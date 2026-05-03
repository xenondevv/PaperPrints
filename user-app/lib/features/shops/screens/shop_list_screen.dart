import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:paper_prints_user/core/theme/app_theme.dart';
import 'package:paper_prints_user/features/shops/providers/shops_provider.dart';
import 'package:paper_prints_user/shared/widgets/shop_card.dart';
import 'package:paper_prints_user/shared/widgets/paper_prints_loader.dart';

class ShopListScreen extends ConsumerStatefulWidget {
  const ShopListScreen({super.key});

  @override
  ConsumerState<ShopListScreen> createState() => _ShopListScreenState();
}

class _ShopListScreenState extends ConsumerState<ShopListScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadShops());
  }

  @override
  void dispose() {
    _searchCtrl.dispose();
    super.dispose();
  }

  Future<void> _loadShops() async {
    try {
      LocationPermission perm = await Geolocator.checkPermission();
      if (perm == LocationPermission.denied) {
        perm = await Geolocator.requestPermission();
      }
      final pos = await Geolocator.getCurrentPosition(
          locationSettings: const LocationSettings(
              accuracy: LocationAccuracy.medium));
      await ref
          .read(nearbyShopsProvider.notifier)
          .load(pos.latitude, pos.longitude, radius: 25);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final shopsState = ref.watch(nearbyShopsProvider);
    final filtered = shopsState.shops.where((s) {
      if (_query.isEmpty) return true;
      final q = _query.toLowerCase();
      return s.shopName.toLowerCase().contains(q) ||
          (s.address?.toLowerCase().contains(q) ?? false);
    }).toList();

    return Scaffold(
      appBar: AppBar(title: const Text('Find a Shop')),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 4),
            child: TextField(
              controller: _searchCtrl,
              style: const TextStyle(color: AppColors.textPrimary),
              onChanged: (v) => setState(() => _query = v),
              decoration: InputDecoration(
                hintText: 'Search shops...',
                prefixIcon: const Icon(Icons.search,
                    color: AppColors.textTertiary, size: 20),
                suffixIcon: _query.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.close,
                            color: AppColors.textTertiary, size: 18),
                        onPressed: () {
                          _searchCtrl.clear();
                          setState(() => _query = '');
                        },
                      )
                    : null,
              ),
            ),
          ),

          Expanded(
            child: shopsState.isLoading
                ? const PaperPrintsLoader(message: 'Finding shops')
                : filtered.isEmpty
                    ? _empty()
                    : RefreshIndicator(
                        color: AppColors.primary,
                        backgroundColor: AppColors.surface,
                        onRefresh: _loadShops,
                        child: ListView.builder(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                          itemCount: filtered.length,
                          itemBuilder: (_, i) => ShopCard(
                            shop: filtered[i],
                            onTap: () =>
                                context.push('/shops/${filtered[i].id}'),
                          ),
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _empty() => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Opacity(
              opacity: 0.4,
              child: Image.asset('assets/logos/favicon.png', width: 64),
            ),
            const SizedBox(height: 16),
            const Text('No shops found',
                style: TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w700,
                    fontSize: 18)),
            const SizedBox(height: 4),
            const Text('Try a different search or expand your radius',
                style:
                    TextStyle(color: AppColors.textTertiary, fontSize: 13)),
          ],
        ),
      );
}
