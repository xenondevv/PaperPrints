import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:paper_prints_user/core/constants/app_constants.dart';
import 'package:paper_prints_user/core/theme/app_theme.dart';
import 'package:paper_prints_user/features/orders/providers/orders_provider.dart';

class OrderHistoryScreen extends ConsumerStatefulWidget {
  const OrderHistoryScreen({super.key});

  @override
  ConsumerState<OrderHistoryScreen> createState() =>
      _OrderHistoryScreenState();
}

class _OrderHistoryScreenState extends ConsumerState<OrderHistoryScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback(
        (_) => ref.read(ordersProvider.notifier).fetchAll());
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ordersProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Orders')),
      body: state.isLoading
          ? const Center(
              child: CircularProgressIndicator(color: AppColors.primary))
          : state.orders.isEmpty
              ? _empty()
              : RefreshIndicator(
                  color: AppColors.primary,
                  backgroundColor: AppColors.surface,
                  onRefresh: () =>
                      ref.read(ordersProvider.notifier).fetchAll(),
                  child: ListView.builder(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
                    itemCount: state.orders.length,
                    itemBuilder: (_, i) => _OrderTile(
                      order: state.orders[i],
                      onTap: () =>
                          context.push('/orders/${state.orders[i].id}'),
                    ),
                  ),
                ),
    );
  }

  Widget _empty() => const Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('📋', style: TextStyle(fontSize: 48)),
            SizedBox(height: 12),
            Text('No orders yet',
                style: TextStyle(
                    color: AppColors.textPrimary,
                    fontWeight: FontWeight.w700,
                    fontSize: 18)),
            SizedBox(height: 4),
            Text('Upload a PDF to place your first order',
                style:
                    TextStyle(color: AppColors.textTertiary, fontSize: 13)),
          ],
        ),
      );
}

class _OrderTile extends StatelessWidget {
  final OrderModel order;
  final VoidCallback onTap;
  const _OrderTile({required this.order, required this.onTap});

  Color get _statusColor => switch (order.status) {
        OrderStatus.pending => AppColors.warning,
        OrderStatus.accepted => AppColors.info,
        OrderStatus.processing => AppColors.primaryLight,
        OrderStatus.ready => AppColors.success,
        OrderStatus.completed => AppColors.textTertiary,
        OrderStatus.rejected => AppColors.error,
        OrderStatus.cancelled => AppColors.textDisabled,
        _ => AppColors.textTertiary,
      };

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        margin: const EdgeInsets.only(bottom: 10),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('#${order.orderNumber}',
                    style: const TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w700,
                        fontSize: 15)),
                const SizedBox(height: 3),
                Text(DateFormat('dd MMM yyyy').format(order.createdAt),
                    style: const TextStyle(
                        color: AppColors.textTertiary, fontSize: 12)),
              ],
            ),
          ),
          Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
            Text('₹${order.totalPrice.toStringAsFixed(0)}',
                style: const TextStyle(
                    color: AppColors.success,
                    fontWeight: FontWeight.w700,
                    fontSize: 15)),
            const SizedBox(height: 5),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
              decoration: BoxDecoration(
                color: _statusColor.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(10),
              ),
              child: Text(OrderStatus.label(order.status),
                  style: TextStyle(
                      color: _statusColor,
                      fontSize: 11,
                      fontWeight: FontWeight.w600)),
            ),
          ]),
          const SizedBox(width: 8),
          const Icon(Icons.chevron_right,
              color: AppColors.textDisabled, size: 16),
        ]),
      ),
    );
  }
}
