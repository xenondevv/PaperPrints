import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geocoding/geocoding.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:paper_prints_user/core/theme/app_theme.dart';
import 'package:paper_prints_user/features/auth/providers/auth_provider.dart';
import 'package:paper_prints_user/features/shops/providers/shops_provider.dart';
import 'package:paper_prints_user/shared/widgets/paper_prints_loader.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen>
    with WidgetsBindingObserver {
  String _locationLine1 = 'Your Location';
  String _locationLine2 = 'Detecting...';
  int _bannerPage = 0;
  final _pageCtrl = PageController();

  // Cache last known position so we can reload shops without re-fetching GPS
  double? _lastLat;
  double? _lastLng;
  bool _initDone = false;
  int _retryCount = 0;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) => _init());
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    _pageCtrl.dispose();
    super.dispose();
  }

  /// Called when app lifecycle changes — auto-refresh shops on resume
  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed) {
      _retryCount = 0; // reset retries on resume
      _refreshShops();
    }
  }

  /// Quick refresh using cached position (no GPS re-fetch)
  Future<void> _refreshShops() async {
    if (_lastLat != null && _lastLng != null) {
      await ref
          .read(nearbyShopsProvider.notifier)
          .load(_lastLat!, _lastLng!);
    } else {
      await _init();
    }
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

      // Cache position for future refreshes
      _lastLat = pos.latitude;
      _lastLng = pos.longitude;

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
      _initDone = true;
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

    // Safety net: if shops are empty after init, auto-retry (max 3 times)
    if (_initDone && shopsState.shops.isEmpty && !shopsState.isLoading && _retryCount < 3) {
      _retryCount++;
      Future.microtask(() => _refreshShops());
    }

    return Scaffold(
      backgroundColor: const Color(0xFFF2F3F5),
      body: RefreshIndicator(
        color: AppColors.primary,
        onRefresh: _init,
        child: CustomScrollView(
          slivers: [
            // ── Top white section ─────────────────────────────────────────
            SliverToBoxAdapter(
              child: Container(
                color: Colors.white,
                child: SafeArea(
                  bottom: false,
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // ── Header row ──────────────────────────────────────
                      Padding(
                        padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                        child: Row(
                          children: [
                            // Location icon
                            Container(
                              width: 38,
                              height: 38,
                              decoration: BoxDecoration(
                                color: AppColors.primarySurface,
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.location_on,
                                  color: AppColors.primary, size: 18),
                            ),
                            const SizedBox(width: 10),
                            // Location text
                            Expanded(
                              child: GestureDetector(
                                onTap: _init,
                                child: Row(
                                  children: [
                                    Flexible(
                                      child: Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          const Text(
                                            'WE ARE AT',
                                            style: TextStyle(
                                                color: AppColors.textTertiary,
                                                fontSize: 10,
                                                fontWeight: FontWeight.w600,
                                                letterSpacing: 0.8),
                                          ),
                                          const SizedBox(height: 1),
                                          Row(children: [
                                            Flexible(
                                              child: Text(
                                                _locationLine1,
                                                maxLines: 1,
                                                overflow:
                                                    TextOverflow.ellipsis,
                                                style: const TextStyle(
                                                    color: Colors.black,
                                                    fontWeight:
                                                        FontWeight.w700,
                                                    fontSize: 15),
                                              ),
                                            ),
                                            const SizedBox(width: 2),
                                            const Icon(
                                                Icons.keyboard_arrow_down,
                                                size: 16,
                                                color: AppColors.primary),
                                          ]),
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
                                  color: Colors.black,
                                  shape: BoxShape.circle,
                                  border: Border.all(
                                      color: AppColors.primary, width: 2),
                                ),
                                child: user?.photoUrl != null
                                    ? ClipOval(
                                        child: Image.network(
                                            user!.photoUrl!,
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

                      const SizedBox(height: 24),

                      // ── Banner carousel ─────────────────────────────────
                      SizedBox(
                        height: 170,
                        child: PageView.builder(
                          controller: _pageCtrl,
                          itemCount: _banners.length,
                          onPageChanged: (i) =>
                              setState(() => _bannerPage = i),
                          itemBuilder: (_, i) => Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            child: _BannerCard(data: _banners[i]),
                          ),
                        ),
                      ),

                      const SizedBox(height: 12),

                      // Dots
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(
                          _banners.length,
                          (i) => AnimatedContainer(
                            duration: const Duration(milliseconds: 250),
                            margin:
                                const EdgeInsets.symmetric(horizontal: 3),
                            width: _bannerPage == i ? 20 : 7,
                            height: 7,
                            decoration: BoxDecoration(
                              color: _bannerPage == i
                                  ? AppColors.primary
                                  : AppColors.border,
                              borderRadius: BorderRadius.circular(4),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 8),
                    ],
                  ),
                ),
              ),
            ),

            // Soft fade from white → grey background
            SliverToBoxAdapter(
              child: Container(
                height: 8,
                decoration: const BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [Colors.white, Color(0xFFF2F3F5)],
                  ),
                ),
              ),
            ),

            // ── Shops Around You ──────────────────────────────────────────
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 8, 20, 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text('Shops Around You',
                        style: TextStyle(
                            color: Colors.black,
                            fontWeight: FontWeight.w800,
                            fontSize: 17)),
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
                height: 100,
                child: shopsState.isLoading
                    ? const Center(
                        child: PaperPrintsLoaderSmall(size: 28),
                      )
                    : shopsState.shops.isEmpty
                        ? Padding(
                            padding: const EdgeInsets.symmetric(horizontal: 20),
                            child: Container(
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(color: AppColors.border),
                              ),
                              child: Row(
                                children: [
                                  Container(
                                    width: 44,
                                    height: 44,
                                    decoration: BoxDecoration(
                                      color: AppColors.primarySurface,
                                      borderRadius: BorderRadius.circular(12),
                                    ),
                                    child: const Icon(
                                        Icons.store_mall_directory_outlined,
                                        color: AppColors.primary,
                                        size: 22),
                                  ),
                                  const SizedBox(width: 14),
                                  const Expanded(
                                    child: Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      mainAxisAlignment:
                                          MainAxisAlignment.center,
                                      children: [
                                        Text('No shops found nearby',
                                            style: TextStyle(
                                                color: Colors.black,
                                                fontWeight: FontWeight.w600,
                                                fontSize: 13)),
                                        SizedBox(height: 2),
                                        Text(
                                            'Try expanding your search area',
                                            style: TextStyle(
                                                color: AppColors.textTertiary,
                                                fontSize: 11)),
                                      ],
                                    ),
                                  ),
                                ],
                              ),
                            ),
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

            // ── Select Category ───────────────────────────────────────────
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, 24, 20, 16),
                child: Text('Select Category',
                    style: TextStyle(
                        color: Colors.black,
                        fontWeight: FontWeight.w800,
                        fontSize: 17)),
              ),
            ),

            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 0, 20, 0),
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
  final String title, subtitle;
  final List<String> chips;
  final String image;
  const _BannerData({
    required this.title,
    required this.subtitle,
    required this.chips,
    required this.image,
  });
}

const _banners = [
  _BannerData(
    title: 'Skip the Queue,\nSave Your Time!',
    subtitle: 'Order online, pick up when ready.',
    chips: ['⚡ Fast', '⭐ Easy', '🤖 Smart'],
    image: 'assets/banners/skip_queue.png',
  ),
  _BannerData(
    title: 'Print from\nAnywhere!',
    subtitle: 'Upload any file, choose a nearby shop.',
    chips: ['📄 PDF', '🖼 Images', '📊 Docs'],
    image: 'assets/banners/print_anywhere.png',
  ),
  _BannerData(
    title: 'Track Live &\nPickup Easy',
    subtitle: 'Get notified when your order is ready.',
    chips: ['🔔 Alerts', '📲 QR Code', '✅ Done'],
    image: 'assets/banners/track_pickup.png',
  ),
];

class _CategoryData {
  final String label;
  final IconData icon;
  final bool available;
  const _CategoryData(this.label, this.icon, {this.available = false});
}

const _categories = [
  _CategoryData('Standard\nDoc', Icons.description_outlined,
      available: true),
  _CategoryData('Paper\nPrinting', Icons.print_outlined),
  _CategoryData('Spiral\nBinding', Icons.menu_book_outlined),
  _CategoryData('Lamination', Icons.layers_outlined),
  _CategoryData('Photo\nPrinting', Icons.photo_outlined),
  _CategoryData('Framed\nPhoto', Icons.crop_outlined),
];

// ─── Banner Card ──────────────────────────────────────────────────────────────

class _BannerCard extends StatelessWidget {
  final _BannerData data;
  const _BannerCard({required this.data});

  @override
  Widget build(BuildContext context) => ClipRRect(
        borderRadius: BorderRadius.circular(18),
        child: Stack(
          fit: StackFit.expand,
          children: [
            // Background image
            Image.asset(data.image, fit: BoxFit.cover),
            // Dark overlay for readability
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    Colors.black.withValues(alpha: 0.72),
                    Colors.black.withValues(alpha: 0.25),
                  ],
                ),
              ),
            ),
            // Text content
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(data.title,
                      style: const TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w800,
                          fontSize: 19,
                          height: 1.2)),
                  const SizedBox(height: 6),
                  Text(data.subtitle,
                      style: TextStyle(
                          color: Colors.white.withValues(alpha: 0.85),
                          fontSize: 11,
                          height: 1.3)),
                  const SizedBox(height: 10),
                  Row(
                    children: data.chips
                        .map((c) => Container(
                              margin: const EdgeInsets.only(right: 6),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 9, vertical: 4),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.85),
                                borderRadius: BorderRadius.circular(20),
                              ),
                              child: Text(c,
                                  style: const TextStyle(
                                      color: Colors.white,
                                      fontWeight: FontWeight.w600,
                                      fontSize: 10)),
                            ))
                        .toList(),
                  ),
                ],
              ),
            ),
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
                      color: Colors.black,
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
  Widget build(BuildContext context) {
    // Active = teal fill, white contents
    // Inactive = white fill, teal border, black contents
    final isActive = data.available;

    return GestureDetector(
      onTap: onTap,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final w = constraints.maxWidth;
          final iconSize = (w * 0.28).clamp(24.0, 32.0);
          final fontSize = (w * 0.11).clamp(10.0, 12.5);

          return Container(
            decoration: BoxDecoration(
              color: isActive ? AppColors.primary : Colors.white,
              borderRadius: BorderRadius.circular(16),
              border: isActive
                  ? null
                  : Border.all(color: AppColors.primary, width: 1.2),
            ),
            child: Stack(
              children: [
                // Centre content
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                  child: Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(data.icon,
                            color: isActive ? Colors.white : const Color(0xFF6B7280),
                            size: iconSize),
                        const SizedBox(height: 6),
                        Text(
                          data.label,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            color: isActive ? Colors.white : const Color(0xFF6B7280),
                            fontSize: fontSize,
                            fontWeight: FontWeight.w600,
                            height: 1.2,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                // Coming Soon — grey pill top-right
                if (!isActive)
                  Positioned(
                    top: 6,
                    right: 6,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 6, vertical: 3),
                      decoration: BoxDecoration(
                        color: const Color(0xFF6B7280),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text('Soon',
                          style: TextStyle(
                              color: Colors.white,
                              fontSize: 8,
                              fontWeight: FontWeight.w700)),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

// ─── String extension ─────────────────────────────────────────────────────────

extension _StringExt on String {
  String? takeIfNotEmpty() => isEmpty ? null : this;
}
