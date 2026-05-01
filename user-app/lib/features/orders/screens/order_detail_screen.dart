import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:share_plus/share_plus.dart';
import 'package:paper_prints_user/core/constants/app_constants.dart';
import 'package:paper_prints_user/core/network/socket_service.dart';
import 'package:paper_prints_user/core/theme/app_theme.dart';
import 'package:paper_prints_user/features/auth/providers/auth_provider.dart';
import 'package:paper_prints_user/features/orders/providers/orders_provider.dart';

class OrderDetailScreen extends ConsumerStatefulWidget {
  final String orderId;
  const OrderDetailScreen({super.key, required this.orderId});
  @override
  ConsumerState<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends ConsumerState<OrderDetailScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) async {
      await ref.read(ordersProvider.notifier).fetchById(widget.orderId);
      _connectSocket();
    });
  }

  void _connectSocket() {
    final userId = ref.read(authProvider).user?.id;
    if (userId == null) return;

    final socket = SocketService.instance;
    socket.connect(userId);

    socket.onOrderAccepted((data) {
      if (data['orderId'] == widget.orderId) {
        ref.read(ordersProvider.notifier).updateFromSocket(
              widget.orderId,
              OrderStatus.accepted,
              estimatedTime: data['estimatedTime']?.toString(),
            );
      }
    });

    socket.onOrderRejected((data) {
      if (data['orderId'] == widget.orderId) {
        ref.read(ordersProvider.notifier).updateFromSocket(
              widget.orderId, OrderStatus.rejected);
      }
    });

    socket.onStatusUpdate((data) {
      if (data['orderId'] == widget.orderId) {
        ref.read(ordersProvider.notifier).updateFromSocket(
              widget.orderId, data['status'] as String);
      }
    });

    socket.onOrderReady((data) {
      if (data['orderId'] == widget.orderId) {
        ref.read(ordersProvider.notifier).updateFromSocket(
              widget.orderId,
              OrderStatus.ready,
              qrCodeUrl: data['qrCode']?.toString(),
            );
      }
    });
  }

  @override
  void dispose() {
    SocketService.instance.offOrderEvents();
    super.dispose();
  }

  Future<void> _cancel() async {
    final ok = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Cancel Order',
            style: TextStyle(color: AppColors.textPrimary)),
        content: const Text('Are you sure you want to cancel this order?',
            style: TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('No')),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Yes, cancel'),
          ),
        ],
      ),
    );
    if (ok == true) {
      try {
        await ref.read(ordersProvider.notifier).cancel(widget.orderId);
      } catch (_) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(
            content: Text('Could not cancel order.'),
            backgroundColor: AppColors.error,
          ));
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ordersProvider);
    final order = state.activeOrder;

    if (state.isLoading || order == null) {
      return const Scaffold(
        body: Center(
            child: CircularProgressIndicator(color: AppColors.primary)),
      );
    }

    return Scaffold(
      appBar: AppBar(
        leading: IconButton(
            icon: const Icon(Icons.arrow_back),
            onPressed: () => context.pop()),
        title: Text('#${order.orderNumber}'),
        actions: [
          _StatusBadge(status: order.status),
          const SizedBox(width: 12),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ETA card
            if (order.estimatedTime != null &&
                order.status == OrderStatus.accepted) ...[
              _EtaCard(minutes: order.estimatedTime!),
              const SizedBox(height: 16),
            ],

            // Status tracker
            _StatusTracker(currentStatus: order.status),
            const SizedBox(height: 16),

            // QR pickup card
            if (order.status == OrderStatus.ready &&
                order.qrCodeUrl != null) ...[
              _QRCard(
                  qrUrl: order.qrCodeUrl!,
                  orderNumber: order.orderNumber),
              const SizedBox(height: 16),
            ],

            // Details
            _DetailsCard(order: order),
            const SizedBox(height: 16),

            // Cancel button
            if (order.status == OrderStatus.pending)
              OutlinedButton(
                onPressed: _cancel,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.error,
                  side: const BorderSide(color: AppColors.error),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  minimumSize: const Size(double.infinity, 52),
                ),
                child: const Text('Cancel Order',
                    style: TextStyle(fontWeight: FontWeight.w700)),
              ),
          ],
        ),
      ),
    );
  }
}

// ─── Sub-widgets ──────────────────────────────────────────────────────────────

class _EtaCard extends StatelessWidget {
  final String minutes;
  const _EtaCard({required this.minutes});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(
          color: AppColors.primarySurface,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(children: [
          const Icon(Icons.timer_outlined,
              color: AppColors.primary, size: 20),
          const SizedBox(width: 10),
          Text('Ready in ~$minutes min',
              style: const TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w600,
                  fontSize: 15)),
        ]),
      );
}

class _DetailsCard extends StatelessWidget {
  final OrderModel order;
  const _DetailsCard({required this.order});

  @override
  Widget build(BuildContext context) {
    final date =
        '${order.createdAt.day}/${order.createdAt.month}/${order.createdAt.year}';
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        const Text('ORDER DETAILS',
            style: TextStyle(
                color: AppColors.textTertiary,
                fontSize: 11,
                fontWeight: FontWeight.w700,
                letterSpacing: 0.5)),
        const SizedBox(height: 14),
        _Row('Copies', '${order.copies}'),
        _Row('Double-sided', order.isDoubleSided ? 'Yes' : 'No'),
        _Row('Total', '₹${order.totalPrice.toStringAsFixed(2)}',
            highlight: true),
        _Row('Placed', date, isLast: true),
      ]),
    );
  }
}

class _Row extends StatelessWidget {
  final String label, value;
  final bool highlight, isLast;
  const _Row(this.label, this.value,
      {this.highlight = false, this.isLast = false});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: isLast
            ? null
            : const BoxDecoration(
                border: Border(
                    bottom: BorderSide(color: AppColors.border, width: 0.5))),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label,
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 14)),
            Text(value,
                style: TextStyle(
                    color: highlight
                        ? AppColors.success
                        : AppColors.textPrimary,
                    fontSize: highlight ? 16 : 14,
                    fontWeight: FontWeight.w600)),
          ],
        ),
      );
}

// ─── Status Tracker ───────────────────────────────────────────────────────────

class _StatusTracker extends StatelessWidget {
  final String currentStatus;
  const _StatusTracker({required this.currentStatus});

  static const _steps = [
    (OrderStatus.pending, 'Order Placed', Icons.receipt_outlined),
    (OrderStatus.accepted, 'Accepted', Icons.check_circle_outline),
    (OrderStatus.processing, 'Printing', Icons.print_outlined),
    (OrderStatus.ready, 'Ready for Pickup', Icons.shopping_bag_outlined),
    (OrderStatus.completed, 'Picked Up',
        Icons.sentiment_satisfied_alt_outlined),
  ];

  @override
  Widget build(BuildContext context) {
    final progressSteps = OrderStatus.progressSteps;
    final curIdx = progressSteps.indexOf(currentStatus);
    final isTerminal = OrderStatus.isTerminal(currentStatus);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      child: isTerminal
          ? _TerminalRow(status: currentStatus)
          : Column(
              children: _steps.asMap().entries.map((e) {
                final idx = e.key;
                final step = e.value;
                final sIdx = progressSteps.indexOf(step.$1);
                final isDone = sIdx < curIdx;
                final isActive = sIdx == curIdx;
                final isLast = idx == _steps.length - 1;

                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Column(children: [
                      _StepIcon(
                          isDone: isDone,
                          isActive: isActive,
                          icon: step.$3),
                      if (!isLast)
                        Container(
                            width: 2,
                            height: 36,
                            color: isDone
                                ? AppColors.success
                                : AppColors.border),
                    ]),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Padding(
                        padding: const EdgeInsets.only(top: 4, bottom: 20),
                        child: Text(step.$2,
                            style: TextStyle(
                                color: isActive
                                    ? AppColors.primaryLight
                                    : isDone
                                        ? AppColors.textPrimary
                                        : AppColors.textDisabled,
                                fontWeight: FontWeight.w700,
                                fontSize: 14)),
                      ),
                    ),
                  ],
                );
              }).toList(),
            ),
    );
  }
}

class _StepIcon extends StatelessWidget {
  final bool isDone, isActive;
  final IconData icon;
  const _StepIcon(
      {required this.isDone, required this.isActive, required this.icon});

  @override
  Widget build(BuildContext context) => Container(
        width: 28,
        height: 28,
        decoration: BoxDecoration(
          color: isDone
              ? AppColors.success
              : isActive
                  ? AppColors.primary
                  : AppColors.border,
          shape: BoxShape.circle,
        ),
        child: Icon(
          isDone ? Icons.check : icon,
          size: 14,
          color: isDone || isActive ? Colors.white : AppColors.textDisabled,
        ),
      );
}

class _TerminalRow extends StatelessWidget {
  final String status;
  const _TerminalRow({required this.status});

  @override
  Widget build(BuildContext context) {
    final isRejected = status == OrderStatus.rejected;
    return Row(children: [
      Icon(
        isRejected ? Icons.cancel_outlined : Icons.block_outlined,
        color: isRejected ? AppColors.error : AppColors.textDisabled,
      ),
      const SizedBox(width: 10),
      Text(
        isRejected ? 'Rejected by vendor' : 'Order cancelled',
        style: TextStyle(
          color: isRejected ? AppColors.error : AppColors.textDisabled,
          fontWeight: FontWeight.w600,
          fontSize: 15,
        ),
      ),
    ]);
  }
}

// ─── QR Card ─────────────────────────────────────────────────────────────────

class _QRCard extends StatelessWidget {
  final String qrUrl, orderNumber;
  const _QRCard({required this.qrUrl, required this.orderNumber});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: AppColors.success.withValues(alpha: 0.3)),
      ),
      child: Column(children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Container(
              padding:
                  const EdgeInsets.symmetric(horizontal: 12, vertical: 5),
              decoration: BoxDecoration(
                color: AppColors.success.withValues(alpha: 0.12),
                borderRadius: BorderRadius.circular(20),
              ),
              child: const Row(mainAxisSize: MainAxisSize.min, children: [
                Icon(Icons.check_circle, size: 14, color: AppColors.success),
                SizedBox(width: 5),
                Text('Ready for Pickup',
                    style: TextStyle(
                        color: AppColors.success,
                        fontWeight: FontWeight.w700,
                        fontSize: 13)),
              ]),
            ),
            IconButton(
              icon: const Icon(Icons.share_outlined,
                  color: AppColors.primary),
              onPressed: () => Share.share(
                  'Paper Prints — Order #$orderNumber QR: $qrUrl'),
            ),
          ],
        ),
        const SizedBox(height: 12),
        const Text(
          'Show this QR code at the counter to collect your prints.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        const SizedBox(height: 20),
        Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: AppColors.primary.withValues(alpha: 0.25),
                blurRadius: 16,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          padding: const EdgeInsets.all(16),
          child: Image.network(
            qrUrl,
            width: 180,
            height: 180,
            errorBuilder: (_, __, ___) => const SizedBox(
              width: 180,
              height: 180,
              child: Center(
                  child: Icon(Icons.qr_code, size: 80, color: Colors.black45)),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text('Order #$orderNumber',
            style: const TextStyle(
                color: AppColors.textPrimary,
                fontWeight: FontWeight.w800,
                fontSize: 18)),
        const SizedBox(height: 12),
        const Row(children: [
          Icon(Icons.info_outline,
              size: 14, color: AppColors.textTertiary),
          SizedBox(width: 6),
          Expanded(
            child: Text(
                'Valid for 24 hours after the order is marked ready',
                style: TextStyle(
                    color: AppColors.textTertiary, fontSize: 12)),
          ),
        ]),
      ]),
    );
  }
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

class _StatusBadge extends StatelessWidget {
  final String status;
  const _StatusBadge({required this.status});

  Color get _color => switch (status) {
        OrderStatus.pending => AppColors.warning,
        OrderStatus.accepted => AppColors.info,
        OrderStatus.processing => AppColors.primaryLight,
        OrderStatus.ready => AppColors.success,
        OrderStatus.rejected => AppColors.error,
        _ => AppColors.textTertiary,
      };

  @override
  Widget build(BuildContext context) => Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          color: _color.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(20),
        ),
        child: Text(
          OrderStatus.label(status),
          style: TextStyle(
              color: _color,
              fontSize: 12,
              fontWeight: FontWeight.w600),
        ),
      );
}
