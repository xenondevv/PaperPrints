import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:paper_prints_user/core/theme/app_theme.dart';
import 'package:paper_prints_user/features/auth/providers/auth_provider.dart';
import 'package:paper_prints_user/features/shops/providers/shops_provider.dart';
import 'package:paper_prints_user/shared/widgets/shop_card.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadShops());
  }

  Future<void> _loadShops() async {
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      if (perm == LocationPermission.deniedForever) return;

      final pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
              accuracy: LocationAccuracy.medium));
      await ref
          .read(nearbyShopsProvider.notifier)
          .load(pos.latitude, pos.longitude);
    } catch (_) {}
  }

  String get _greeting {
    final h = DateTime.now().hour;
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final shopsState = ref.watch(nearbyShopsProvider);
    final firstName = user?.name.split(' ').first ?? 'there';

    return Scaffold(
      body: RefreshIndicator(
        color: AppColors.primary,
        backgroundColor: AppColors.surface,
        onRefresh: _loadShops,
        child: CustomScrollView(
          slivers: [
            // ── App Bar ──────────────────────────────────────────────
            SliverAppBar(
              floating: true,
              snap: true,
              backgroundColor: AppColors.bg,
              title: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('$_greeting, $firstName 👋',
                      style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.w800,
                          color: AppColors.textPrimary)),
                  const Text('Find a print shop near you',
                      style: TextStyle(
                          fontSize: 12, color: AppColors.textTertiary)),
                ],
              ),
              actions: [
                GestureDetector(
                  onTap: () => context.push('/profile'),
                  child: Container(
                    margin: const EdgeInsets.only(right: 16),
                    width: 40,
                    height: 40,
                    decoration: const BoxDecoration(
                        color: AppColors.primary, shape: BoxShape.circle),
                    child: Center(
                      child: Text(
                        user?.name[0].toUpperCase() ?? 'U',
                        style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w700,
                            fontSize: 16),
                      ),
                    ),
                  ),
                ),
              ],
            ),

            SliverPadding(
              padding: const EdgeInsets.fromLTRB(20, 16, 20, 32),
              sliver: SliverList(
                delegate: SliverChildListDelegate([
                  // ── Upload Banner ─────────────────────────────────
                  GestureDetector(
                    onTap: () => context.push('/upload'),
                    child: Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF7C3AED), Color(0xFF5B21B6)],
                        ),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Row(
                        children: [
                          Icon(Icons.cloud_upload_outlined,
                              color: Colors.white, size: 28),
                          SizedBox(width: 14),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('Upload & Print',
                                    style: TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w700,
                                        fontSize: 16)),
                                SizedBox(height: 2),
                                Text('Select a shop · Upload PDF · Done',
                                    style: TextStyle(
                                        color: Colors.white70, fontSize: 12)),
                              ],
                            ),
                          ),
                          Icon(Icons.arrow_forward,
                              color: Colors.white70, size: 20),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),

                  // ── Nearby Shops header ───────────────────────────
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Shops Near You',
                          style: TextStyle(
                              color: AppColors.textPrimary,
                              fontWeight: FontWeight.w700,
                              fontSize: 18)),
                      GestureDetector(
                        onTap: () => context.push('/shops'),
                        child: const Text('See all',
                            style: TextStyle(
                                color: AppColors.primary,
                                fontWeight: FontWeight.w600,
                                fontSize: 13)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),

                  // ── Shops list ────────────────────────────────────
                  if (shopsState.isLoading)
                    const Padding(
                      padding: EdgeInsets.only(top: 32),
                      child: Center(
                          child: CircularProgressIndicator(
                              color: AppColors.primary)),
                    )
                  else if (shopsState.shops.isEmpty)
                    _EmptyShops()
                  else
                    ...shopsState.shops.take(5).map((shop) => ShopCard(
                          shop: shop,
                          onTap: () => context.push('/shops/${shop.id}'),
                        )),
                ]),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _EmptyShops extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return const Padding(
      padding: EdgeInsets.only(top: 48),
      child: Column(children: [
        Text('🏪', style: TextStyle(fontSize: 48)),
        SizedBox(height: 12),
        Text('No shops found',
            style: TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w700,
                fontSize: 18)),
        SizedBox(height: 4),
        Text('No active print shops within 10 km',
            style: TextStyle(color: AppColors.textTertiary, fontSize: 13)),
      ]),
    );
  }
}
