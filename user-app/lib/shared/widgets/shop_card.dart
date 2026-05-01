import 'package:flutter/material.dart';
import 'package:paper_prints_user/core/theme/app_theme.dart';
import 'package:paper_prints_user/features/shops/providers/shops_provider.dart';

class ShopCard extends StatelessWidget {
  final VendorModel shop;
  final VoidCallback onTap;
  final bool compact;

  const ShopCard({
    super.key,
    required this.shop,
    required this.onTap,
    this.compact = false,
  });

  @override
  Widget build(BuildContext context) {
    if (compact) return _buildCompact();
    return _buildFull();
  }

  Widget _buildFull() {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            // Icon
            Container(
              width: 48,
              height: 48,
              decoration: BoxDecoration(
                color: AppColors.primarySurface,
                borderRadius: BorderRadius.circular(14),
              ),
              child: const Icon(Icons.storefront_rounded,
                  color: AppColors.primary, size: 24),
            ),
            const SizedBox(width: 12),
            // Info
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(shop.shopName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                color: AppColors.textPrimary,
                                fontWeight: FontWeight.w700,
                                fontSize: 15)),
                      ),
                      const SizedBox(width: 8),
                      _StatusBadge(isOpen: shop.isOpen),
                    ],
                  ),
                  if (shop.address != null) ...[
                    const SizedBox(height: 3),
                    Row(children: [
                      const Icon(Icons.location_on_outlined,
                          size: 12, color: AppColors.textTertiary),
                      const SizedBox(width: 3),
                      Expanded(
                        child: Text(shop.address!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                                color: AppColors.textTertiary, fontSize: 12)),
                      ),
                    ]),
                  ],
                  const SizedBox(height: 8),
                  Wrap(spacing: 6, children: [
                    if (shop.distanceKm != null)
                      _Chip(
                          icon: Icons.navigation_outlined,
                          label: shop.distanceLabel),
                    if (shop.settings != null)
                      _Chip(
                          icon: Icons.sell_outlined,
                          label:
                              '₹${shop.settings!.priceBw.toStringAsFixed(0)} B&W · ₹${shop.settings!.priceColor.toStringAsFixed(0)} Color'),
                  ]),
                ],
              ),
            ),
            const SizedBox(width: 8),
            const Icon(Icons.chevron_right,
                color: AppColors.textDisabled, size: 18),
          ],
        ),
      ),
    );
  }

  Widget _buildCompact() {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(
          children: [
            Container(
              width: 36,
              height: 36,
              decoration: BoxDecoration(
                color: AppColors.primarySurface,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.storefront_rounded,
                  color: AppColors.primary, size: 18),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(shop.shopName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w600,
                          fontSize: 14)),
                  if (shop.distanceKm != null)
                    Text('${shop.distanceLabel} away',
                        style: const TextStyle(
                            color: AppColors.textTertiary, fontSize: 12)),
                ],
              ),
            ),
            _StatusBadge(isOpen: shop.isOpen),
          ],
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  final bool isOpen;
  const _StatusBadge({required this.isOpen});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 3),
      decoration: BoxDecoration(
        color: isOpen
            ? AppColors.success.withValues(alpha: 0.12)
            : AppColors.error.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        isOpen ? 'Open' : 'Closed',
        style: TextStyle(
          color: isOpen ? AppColors.success : AppColors.error,
          fontSize: 11,
          fontWeight: FontWeight.w700,
        ),
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Chip({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: AppColors.primarySurface,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(icon, size: 11, color: AppColors.primary),
        const SizedBox(width: 4),
        Text(label,
            style: const TextStyle(
                color: AppColors.primaryLight,
                fontSize: 11,
                fontWeight: FontWeight.w600)),
      ]),
    );
  }
}
