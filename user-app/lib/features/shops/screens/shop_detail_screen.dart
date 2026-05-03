import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:paper_prints_user/core/theme/app_theme.dart';
import 'package:paper_prints_user/features/shops/providers/shops_provider.dart';
import 'package:paper_prints_user/shared/widgets/paper_prints_loader.dart';

class ShopDetailScreen extends ConsumerWidget {
  final String vendorId;
  const ShopDetailScreen({super.key, required this.vendorId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final shopAsync = ref.watch(shopDetailProvider(vendorId));

    return Scaffold(
      body: shopAsync.when(
        loading: () => const Center(
            child: PaperPrintsLoader(message: 'Loading shop')),
        error: (e, _) => Center(
            child: Text('Error: $e',
                style: const TextStyle(color: AppColors.error))),
        data: (shop) => _ShopDetailBody(shop: shop),
      ),
    );
  }
}

class _ShopDetailBody extends StatelessWidget {
  final VendorModel shop;
  const _ShopDetailBody({required this.shop});

  Future<void> _openMaps() async {
    if (shop.lat == null || shop.lng == null) return;
    final url =
        'https://www.google.com/maps/dir/?api=1&destination=${shop.lat},${shop.lng}';
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url));
    }
  }

  Future<void> _call() async {
    if (shop.phone == null) return;
    final url = 'tel:${shop.phone}';
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url));
    }
  }

  @override
  Widget build(BuildContext context) {
    final settings = shop.settings;

    return CustomScrollView(
      slivers: [
        // App bar
        SliverAppBar(
          expandedHeight: 0,
          pinned: true,
          backgroundColor: AppColors.bg,
          leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop(),
          ),
          actions: [
            if (shop.phone != null)
              IconButton(
                  icon: const Icon(Icons.call_outlined),
                  onPressed: _call),
            if (shop.lat != null)
              IconButton(
                  icon: const Icon(Icons.directions_outlined),
                  onPressed: _openMaps),
          ],
        ),

        SliverPadding(
          padding: const EdgeInsets.fromLTRB(20, 0, 20, 40),
          sliver: SliverList(
            delegate: SliverChildListDelegate([
              // Hero
              Center(
                child: Column(children: [
                  Container(
                    width: 80,
                    height: 80,
                    decoration: BoxDecoration(
                      color: AppColors.primarySurface,
                      borderRadius: BorderRadius.circular(24),
                      border: Border.all(
                          color: AppColors.primary.withValues(alpha: 0.25)),
                    ),
                    child: const Icon(Icons.storefront_rounded,
                        color: AppColors.primary, size: 36),
                  ),
                  const SizedBox(height: 14),
                  Text(shop.shopName,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w800,
                          fontSize: 22)),
                  const SizedBox(height: 10),
                  Wrap(spacing: 8, children: [
                    _StatusBadge(isOpen: shop.isOpen),
                    if (shop.distanceKm != null)
                      _InfoBadge(
                          icon: Icons.navigation_outlined,
                          label: '${shop.distanceLabel} away'),
                  ]),
                  if (shop.address != null) ...[
                    const SizedBox(height: 10),
                    Text(shop.address!,
                        textAlign: TextAlign.center,
                        style: const TextStyle(
                            color: AppColors.textTertiary,
                            fontSize: 13,
                            height: 1.4)),
                  ],
                ]),
              ),
              const SizedBox(height: 28),

              // Pricing
              if (settings != null) ...[
                _sectionTitle('Pricing'),
                _Card(child: Column(children: [
                  _PriceRow(
                      icon: Icons.article_outlined,
                      label: 'Black & White',
                      value: '₹${settings.priceBw.toStringAsFixed(0)} / page'),
                  _PriceRow(
                      icon: Icons.palette_outlined,
                      label: 'Color',
                      value:
                          '₹${settings.priceColor.toStringAsFixed(0)} / page',
                      isLast: settings.priceDoubleSided == null &&
                          settings.capabilities.isEmpty),
                  if (settings.priceDoubleSided != null)
                    _PriceRow(
                        icon: Icons.copy_all_outlined,
                        label: 'Double-sided',
                        value:
                            '₹${settings.priceDoubleSided!.toStringAsFixed(0)} / page',
                        isLast: true),
                ])),
              ],

              // Capabilities
              if (settings?.capabilities.isNotEmpty == true) ...[
                _sectionTitle('Capabilities'),
                _Card(
                  child: Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: settings!.capabilities
                        .map((c) => _CapChip(label: c))
                        .toList(),
                  ),
                ),
              ],

              // Accepted formats
              _sectionTitle('Accepted Formats'),
              _Card(
                child: Wrap(spacing: 8, children: [
                  Container(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 12, vertical: 5),
                    decoration: BoxDecoration(
                      color: AppColors.border,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: const Text('PDF',
                        style: TextStyle(
                            color: AppColors.textSecondary,
                            fontWeight: FontWeight.w700)),
                  )
                ]),
              ),
              const SizedBox(height: 8),

              // CTA
              ElevatedButton.icon(
                onPressed: shop.isOpen
                    ? () => context.push('/upload',
                        extra: {'vendorId': shop.id})
                    : null,
                icon: const Icon(Icons.cloud_upload_outlined),
                label: Text(shop.isOpen ? 'Print Here' : 'Shop is Closed'),
              ),
            ]),
          ),
        ),
      ],
    );
  }

  Widget _sectionTitle(String t) => Padding(
        padding: const EdgeInsets.only(bottom: 8, top: 4),
        child: Text(t.toUpperCase(),
            style: const TextStyle(
                color: AppColors.textTertiary,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5)),
      );
}

class _Card extends StatelessWidget {
  final Widget child;
  const _Card({required this.child});
  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: 14),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: child,
      );
}

class _PriceRow extends StatelessWidget {
  final IconData icon;
  final String label, value;
  final bool isLast;
  const _PriceRow(
      {required this.icon,
      required this.label,
      required this.value,
      this.isLast = false});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: isLast
            ? null
            : const BoxDecoration(
                border: Border(
                    bottom: BorderSide(color: AppColors.border, width: 0.5))),
        child: Row(children: [
          Icon(icon, size: 16, color: AppColors.textTertiary),
          const SizedBox(width: 10),
          Expanded(
              child: Text(label,
                  style: const TextStyle(
                      color: AppColors.textPrimary, fontSize: 14))),
          Text(value,
              style: const TextStyle(
                  color: AppColors.success,
                  fontWeight: FontWeight.w700,
                  fontSize: 14)),
        ]),
      );
}

class _CapChip extends StatelessWidget {
  final String label;
  const _CapChip({required this.label});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
        decoration: BoxDecoration(
          color: AppColors.success.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          const Icon(Icons.check_circle,
              size: 14, color: AppColors.success),
          const SizedBox(width: 4),
          Text(label,
              style: const TextStyle(
                  color: AppColors.success,
                  fontSize: 12,
                  fontWeight: FontWeight.w600)),
        ]),
      );
}

class _StatusBadge extends StatelessWidget {
  final bool isOpen;
  const _StatusBadge({required this.isOpen});
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: isOpen
              ? AppColors.success.withValues(alpha: 0.12)
              : AppColors.error.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Container(
              width: 7,
              height: 7,
              decoration: BoxDecoration(
                  color: isOpen ? AppColors.success : AppColors.error,
                  shape: BoxShape.circle)),
          const SizedBox(width: 5),
          Text(isOpen ? 'Open now' : 'Closed',
              style: TextStyle(
                  color: isOpen ? AppColors.success : AppColors.error,
                  fontSize: 12,
                  fontWeight: FontWeight.w700)),
        ]),
      );
}

class _InfoBadge extends StatelessWidget {
  final IconData icon;
  final String label;
  const _InfoBadge({required this.icon, required this.label});
  @override
  Widget build(BuildContext context) => Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: AppColors.primarySurface,
          borderRadius: BorderRadius.circular(20),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 12, color: AppColors.primary),
          const SizedBox(width: 4),
          Text(label,
              style: const TextStyle(
                  color: AppColors.primaryLight,
                  fontSize: 12,
                  fontWeight: FontWeight.w600)),
        ]),
      );
}
