import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:paper_prints_user/core/theme/app_theme.dart';
import 'package:paper_prints_user/features/auth/providers/auth_provider.dart';
import 'package:paper_prints_user/features/shops/providers/shops_provider.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  String _locationLine1 = 'Your Location';
  String _locationLine2 = 'Detecting...';
  int _bannerPage = 0;
  final _pageCtrl = PageController();

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _init());
  }

  @override
  void dispose() {
    _pageCtrl.dispose();
    super.dispose();
  }

  Future<void> _init() async {
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.deniedForever) {
        if (mounted) setState(() => _locationLine2 = 'Location unavailable');
        return;
      }

      final pos = await Geolocator.getCurrentPosition(
          locationSettings:
              const LocationSettings(accuracy: LocationAccuracy.medium));

      try {
        final marks = await placemarkFromCoordinates(pos.latitude, pos.longitude);
        if (marks.isNotEmpty && mounted) {
          final p = marks.first;
          setState(() {
            _locationLine1 = [p.subLocality, p.locality]
                .where((s) => s != null && s.isNotEmpty)
                .join(', ')
                .takeIfNotEmpty() ?? 'Your Location';
            _locationLine2 = p.administrativeArea ?? 'India';
          });
        }
      } catch (_) {
        if (mounted) setState(() => _locationLine2 = 'Location found');
      }

      await ref
          .read(nearbyShopsProvider.notifier)
          .load(pos.latitude, pos.longitude);
    } catch (_) {
      if (mounted) setState(() => _locationLine2 = 'Enable location');
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final shopsState = ref.watch(nearbyShopsProvider);
    final initial = user?.name.isNotEmpty == true
        ? user!.name[0].toUpperCase()
        : 'U';

    return Scaffold(
      backgroundColor: const Color(0xFFF5F6FA),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _init,
        child: CustomScrollView(
          slivers: [
            // ── Top section (white card) ──────────────────────────────
            SliverToBoxAdapter(
              child: Container(
                color: Colors.white,
                child: SafeArea(
                  bottom: false,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Header row
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 14, 20, 0),
                        child: Row(
                          children: [
                            // Location block
                            Expanded(
                              child: GestureDetector(
                                onTap: _init,
                                child: Row(
                                  children: [
                                    Container(
                                      width: 36,
                                      height: 36,
                                      decoration: BoxDecoration(
                                        color: AppColors.primarySurface,
                                        borderRadius:
                                            BorderRadius.circular(10),
                                      ),
                                      child: const Icon(
                                          Icons.location_on,
                                          color: AppColors.primary,
                                          size: 18),
                                    ),
                                    const SizedBox(width: 10),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Row(children: [
                                            Flexible(
                                              child: Text(
                                                _locationLine1,
                                                maxLines: 1,
                                                overflow:
                                                    TextOverflow.ellipsis,
                                                style: const TextStyle(
                                                    color:
                                                        AppColors.textPrimary,
                                                    fontWeight:
                                                        FontWeight.w700,
                                                    fontSize: 14),
                                              ),
                                            ),
                                            const SizedBox(width: 3),
                                            const Icon(
                                                Icons.keyboard_arrow_down,
                                                size: 16,
                                                color:
                                                    AppColors.textSecondary),
                                          ]),
                                          Text(
                                            _locationLine2,
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                            style: const TextStyle(
                                                color: AppColors.textTertiary,
                                                fontSize: 12),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            // Avatar
                            GestureDetector(
                              onTap: () => context.push('/profile'),
                              child: Container(
                                width: 40,
                                height: 40,
                                decoration: BoxDecoration(
                                  color: AppColors.primary,
                                  shape: BoxShape.circle,
                                ),
                                child: user?.photoUrl != null
                                    ? ClipOval(
                                        child: Image.network(user!.photoUrl!,
                                            fit: BoxFit.cover))
                                    : Center(
                                        child: Text(initial,
                                            style: const TextStyle(
                                                color: Colors.white,
                                                fontWeight: FontWeight.w700,
                                                fontSize: 16)),
                                      ),
                              ),
                            ),
                          ],
                        ),
                      ),

                      const SizedBox(height: 18),

                      // Banner carousel
                      SizedBox(
                        height: 148,
                        child: PageView.builder(
                          controller: _pageCtrl,
                          itemCount: _banners.length,
                          onPageChanged: (i) =>
                              setState(() => _bannerPage = i),
                          itemBuilder: (_, i) => Padding(
                            padding: EdgeInsets.only(
                              left: i == 0 ? 20 : 8,
                              right: i == _banners.length - 1 ? 20 : 8,
                            ),
                            child: _BannerCard(data: _banners[i]),
                          ),
                        ),
                      ),

                      const SizedBox(height: 10),

                      // Dots
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          _banners.length,
                          (i) => AnimatedContainer(
                            duration: const Duration(milliseconds: 250),
                            margin:
                                const EdgeInsets.symmetric(horizontal: 3),
                            width: _bannerPage == i ? 18 : 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: _bannerPage == i
                                  ? AppColors.primary
                                  : AppColors.border,
                              borderRadius: BorderRadius.circular(3),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 18),
                    ],
                  ),
                ),
              ),
            ),

            // ── Shops Around You ───────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 10),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Shops Around You',
                        style: TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w700,
                            fontSize: 16)),
                    GestureDetector(
                      onTap: () => context.push('/shops'),
                      child: Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 14, vertical: 5),
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.primary),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: const Text('View All',
                            style: TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600,
                                fontSize: 12)),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            SliverToBoxAdapter(
              child: SizedBox(
                height: 120,
                child: shopsState.isLoading
                    ? const Center(
                        child: SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(
                              color: AppColors.primary,
                              strokeWidth: 2),
                        ),
                      )
                    : shopsState.shops.isEmpty
                        ? const Center(
                            child: Text('No shops found nearby',
                                style: TextStyle(
                                    color: AppColors.textTertiary,
                                    fontSize: 13)),
                          )
                        : ListView.separated(
                            scrollDirection: Axis.horizontal,
                            padding:
                                const EdgeInsets.symmetric(horizontal: 20),
                            itemCount: shopsState.shops.take(10).length,
                            separatorBuilder: (_, __) =>
                                const SizedBox(width: 10),
                            itemBuilder: (_, i) => _ShopChip(
                              shop: shopsState.shops[i],
                              onTap: () => context
                                  .push('/shops/${shopsState.shops[i].id}'),
                            ),
                          ),
              ),
            ),

            // ── Select Category ────────────────────────────────────────
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, 20, 20, 12),
                child: Text('Select Category',
                    style: TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 16)),
              ),
            ),

            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 32),
              sliver: SliverGrid(
                gridDelegate:
                    const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 3,
                  mainAxisSpacing: 10,
                  crossAxisSpacing: 10,
                  childAspectRatio: 0.85,
                ),
                delegate: SliverChildListDelegate(
                  _categories
                      .map(
                        (c) => _CategoryCard(
                          data: c,
                          onTap: c.available
                              ? () => context.push('/upload')
                              : null,
                        ),
                      )
                      .toList(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ─── Data ─────────────────────────────────────────────────────────────────────

class _BannerData {
  final String title, subtitle, tag;
  final Color from, to;
  final IconData icon;
  const _BannerData({
    required this.title,
    required this.subtitle,
    required this.tag,
    required this.from,
    required this.to,
    required this.icon,
  });
}

const _banners = [
  _BannerData(
    title: 'Skip the queue,\nSave your time!',
    subtitle: 'Order online, pick up when ready!',
    tag: 'Fast · Easy · Smart',
    from: Color(0xFF0B7DDA),
    to: Color(0xFF1565C0),
    icon: Icons.bolt_rounded,
  ),
  _BannerData(
    title: 'Print from\nanywhere!',
    subtitle: 'Upload PDF, choose a nearby shop',
    tag: 'No wait · No hassle',
    from: Color(0xFF00897B),
    to: Color(0xFF00695C),
    icon: Icons.cloud_upload_outlined,
  ),
  _BannerData(
    title: 'Track live &\npick up easy',
    subtitle: 'Real-time updates on your order',
    tag: 'QR pickup code ready',
    from: Color(0xFF5E35B1),
    to: Color(0xFF4527A0),
    icon: Icons.qr_code_rounded,
  ),
];

class _CategoryData {
  final String label;
  final IconData icon;
  final bool available;
  const _CategoryData(this.label, this.icon, {this.available = false});
}

const _categories = [
  _CategoryData('Standard\nDocuments', Icons.description_outlined,
      available: true),
  _CategoryData('Paper\nPrinting', Icons.print_outlined),
  _CategoryData('Spiral /\nBinding', Icons.menu_book_outlined),
  _CategoryData('Lamination', Icons.layers_outlined),
  _CategoryData('Photograph\nPrinting', Icons.photo_outlined),
  _CategoryData('Framed\nPhoto', Icons.crop_outlined),
];

// ─── Banner Card ──────────────────────────────────────────────────────────────

class _BannerCard extends StatelessWidget {
  final _BannerData data;
  const _BannerCard({required this.data});

  @override
  Widget build(BuildContext context) => Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
              colors: [data.from, data.to],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight),
          borderRadius: BorderRadius.circular(18),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(data.title,
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 18,
                          height: 1.2)),
                  const SizedBox(height: 6),
                  Text(data.subtitle,
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.75),
                          fontSize: 12,
                          height: 1.3)),
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 10, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.18),
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: Text(data.tag,
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 11)),
                  ),
                ],
              ),
            ),
            Icon(data.icon, size: 52, color: Colors.white24),
          ],
        ),
      );
}

// ─── Shop Chip ────────────────────────────────────────────────────────────────

class _ShopChip extends StatelessWidget {
  final VendorModel shop;
  final VoidCallback onTap;
  const _ShopChip({required this.shop, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          width: 140,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: AppColors.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(shop.shopName,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w700,
                      fontSize: 13,
                      height: 1.3)),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 7, vertical: 3),
                    decoration: BoxDecoration(
                      color: shop.isOpen
                          ? const Color(0xFFE8F8F2)
                          : const Color(0xFFFEEBEB),
                      borderRadius: BorderRadius.circular(5),
                    ),
                    child: Text(
                      shop.isOpen ? 'Open' : 'Closed',
                      style: TextStyle(
                          color: shop.isOpen
                              ? AppColors.success
                              : AppColors.error,
                          fontSize: 10,
                          fontWeight: FontWeight.w700),
                    ),
                  ),
                  if (shop.distanceKm != null)
                    Text(shop.distanceLabel,
                        style: const TextStyle(
                            color: AppColors.textTertiary, fontSize: 11)),
                ],
              ),
            ],
          ),
        ),
      );
}

// ─── Category Card ────────────────────────────────────────────────────────────

class _CategoryCard extends StatelessWidget {
  final _CategoryData data;
  final VoidCallback? onTap;
  const _CategoryCard({required this.data, this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: data.available ? const Color(0xFFFFF9E6) : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: data.available
                  ? const Color(0xFFFFD600).withValues(alpha: 0.6)
                  : AppColors.border,
            ),
          ),
          padding: const EdgeInsets.all(10),
          child: Stack(
            children: [
              Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const Spacer(),
                  Icon(data.icon,
                      size: 28,
                      color: data.available
                          ? const Color(0xFFF59E0B)
                          : AppColors.textDisabled),
                  const SizedBox(height: 6),
                  Text(
                    data.label,
                    textAlign: TextAlign.center,
                    style: TextStyle(
                        color: data.available
                            ? AppColors.textPrimary
                            : AppColors.textDisabled,
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        height: 1.2),
                  ),
                  const Spacer(),
                ],
              ),
              if (!data.available)
                Positioned(
                  bottom: 0,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 7, vertical: 2),
                      decoration: BoxDecoration(
                        color: AppColors.textSecondary,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text('Soon',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 9,
                              fontWeight: FontWeight.w600)),
                    ),
                  ),
                ),
            ],
          ),
        ),
      );
}

// ─── String extension ─────────────────────────────────────────────────────────

extension _StringExt on String {
  String? takeIfNotEmpty() => isEmpty ? null : this;
}
