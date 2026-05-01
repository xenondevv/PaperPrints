import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';
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
        ref
            .read(ordersProvider.notifier)
            .updateFromSocket(widget.orderId, OrderStatus.rejected);
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
        title: const Text('Cancel Order'),
        content: const Text('Are you sure you want to cancel this order?'),
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

  Future<void> _openMaps(OrderModel order) async {
    if (order.shopLat == null || order.shopLng == null) return;
    final url =
        'https://www.google.com/maps/dir/?api=1&destination=${order.shopLat},${order.shopLng}';
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url));
    }
  }

  Future<void> _callShop(OrderModel order) async {
    if (order.shopPhone == null) return;
    final url = 'tel:${order.shopPhone}';
    if (await canLaunchUrl(Uri.parse(url))) {
      await launchUrl(Uri.parse(url));
    }
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied'),
        backgroundColor: AppColors.primary,
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      ),
    );
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

    // Booking code — last 4 digits of order number or a derived code
    final bookingCode = order.orderNumber.length >= 4
        ? order.orderNumber.substring(order.orderNumber.length - 4)
        : order.orderNumber;

    final isPending = order.status == OrderStatus.pending;
    final isTerminal = OrderStatus.isTerminal(order.status);
    final isReady = order.status == OrderStatus.ready;

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        actions: [
          // Notification bell placeholder
          IconButton(
            icon: const Icon(Icons.notifications_none_outlined),
            onPressed: () {},
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.fromLTRB(16, 0, 16, 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // ── Status Banner ──────────────────────────────────────────
            _StatusBanner(status: order.status),
            const SizedBox(height: 20),

            // ── Order ID + Booking Code ────────────────────────────────
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Order ID',
                        style: TextStyle(
                            color: AppColors.textTertiary, fontSize: 12)),
                    Text(order.orderNumber,
                        style: const TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w700,
                            fontSize: 15)),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('Booking Code',
                        style: TextStyle(
                            color: AppColors.textTertiary, fontSize: 12)),
                    Text(bookingCode,
                        style: const TextStyle(
                            color: AppColors.primary,
                            fontWeight: FontWeight.w800,
                            fontSize: 15)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text('Total Amount: ₹${order.totalPrice.toStringAsFixed(2)}',
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 14)),

            const SizedBox(height: 20),

            // ── Action Buttons + QR ────────────────────────────────────
            if (isReady && order.qrCodeUrl != null)
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Expanded(
                    child: Column(
                      children: [
                        _ActionButton(
                          icon: Icons.directions_outlined,
                          label: 'Get Direction',
                          onTap: () => _openMaps(order),
                        ),
                        const SizedBox(height: 10),
                        _ActionButton(
                          icon: Icons.phone_outlined,
                          label: 'Call Printshop',
                          onTap: () => _callShop(order),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  // QR Code
                  Container(
                    width: 110,
                    height: 110,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppColors.border),
                    ),
                    padding: const EdgeInsets.all(6),
                    child: Image.network(
                      order.qrCodeUrl!,
                      fit: BoxFit.contain,
                      errorBuilder: (_, __, ___) => const Center(
                          child: Icon(Icons.qr_code,
                              size: 60, color: AppColors.textPrimary)),
                    ),
                  ),
                ],
              )
            else
              Row(
                children: [
                  Expanded(
                    child: _ActionButton(
                      icon: Icons.directions_outlined,
                      label: 'Get Direction',
                      onTap: () => _openMaps(order),
                    ),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: _ActionButton(
                      icon: Icons.phone_outlined,
                      label: 'Call Printshop',
                      onTap: () => _callShop(order),
                    ),
                  ),
                ],
              ),

            // ETA
            if (order.estimatedTime != null &&
                order.status == OrderStatus.accepted) ...[
              const SizedBox(height: 12),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.primarySurface,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Row(children: [
                  const Icon(Icons.timer_outlined,
                      color: AppColors.primary, size: 18),
                  const SizedBox(width: 8),
                  Text('Ready in ~${order.estimatedTime} min',
                      style: const TextStyle(
                          color: AppColors.primary,
                          fontWeight: FontWeight.w600)),
                ]),
              ),
            ],

            const SizedBox(height: 16),

            // ── Status Tracker ─────────────────────────────────────────
            _StatusTracker(currentStatus: order.status),

            const SizedBox(height: 16),

            // ── Cancel Button ──────────────────────────────────────────
            if (isPending)
              Align(
                alignment: Alignment.centerRight,
                child: TextButton(
                  onPressed: _cancel,
                  style: TextButton.styleFrom(
                    foregroundColor: AppColors.textSecondary,
                    backgroundColor: AppColors.surface,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 10),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(10)),
                  ),
                  child: const Text('Cancel Order'),
                ),
              ),

            if (!isTerminal) ...[
              const SizedBox(height: 20),
              // ── Delivery section ─────────────────────────────────────
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Want your prints delivered?',
                        style: TextStyle(
                            color: AppColors.textPrimary,
                            fontWeight: FontWeight.w700,
                            fontSize: 15)),
                    const SizedBox(height: 4),
                    const Text(
                        'We don\'t provide delivery, but we make it easy! You can copy the shop\'s location and address and paste them directly into any delivery app.',
                        style: TextStyle(
                            color: AppColors.textSecondary,
                            fontSize: 12,
                            height: 1.4)),
                    const SizedBox(height: 14),
                    Row(
                      children: [
                        Expanded(
                          child: _CopyButton(
                            icon: Icons.location_on_outlined,
                            label: 'Copy Location',
                            onTap: order.shopLat != null
                                ? () => _copyToClipboard(
                                    '${order.shopLat},${order.shopLng}',
                                    'Location')
                                : null,
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: _CopyButton(
                            icon: Icons.home_outlined,
                            label: 'Copy Address',
                            onTap: order.shopAddress != null
                                ? () => _copyToClipboard(
                                    order.shopAddress!, 'Address')
                                : null,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ],

            const SizedBox(height: 16),

            // ── Order Details Expandable ────────────────────────────────
            _OrderDetailsRow(order: order),
          ],
        ),
      ),
    );
  }
}

// ─── Status Banner ────────────────────────────────────────────────────────────

class _StatusBanner extends StatelessWidget {
  final String status;
  const _StatusBanner({required this.status});

  String get _title => switch (status) {
        OrderStatus.pending => 'Waiting for Confirmation',
        OrderStatus.accepted => 'Order Accepted!',
        OrderStatus.processing => 'Printing in Progress',
        OrderStatus.ready => 'Ready for Pickup!',
        OrderStatus.completed => 'Order Completed',
        OrderStatus.rejected => 'Order Rejected',
        OrderStatus.cancelled => 'Order Cancelled',
        _ => 'Processing...',
      };

  String get _subtitle => switch (status) {
        OrderStatus.pending =>
          'If confirmation takes longer, we\nrequest you to call the shop directly',
        OrderStatus.accepted =>
          'Your order has been accepted by the shop',
        OrderStatus.processing => 'Your documents are being printed',
        OrderStatus.ready =>
          'Show the QR code at the counter to collect your prints',
        OrderStatus.completed => 'Your prints have been collected',
        OrderStatus.rejected =>
          'The shop was unable to process your order',
        OrderStatus.cancelled => 'Your order has been cancelled',
        _ => '',
      };

  Color get _bgColor => switch (status) {
        OrderStatus.pending => const Color(0xFFFCE4EC),
        OrderStatus.accepted => const Color(0xFFE8F5E9),
        OrderStatus.processing => const Color(0xFFE3F2FD),
        OrderStatus.ready => const Color(0xFFE8F5E9),
        OrderStatus.completed => const Color(0xFFF5F5F5),
        OrderStatus.rejected => const Color(0xFFFFEBEE),
        OrderStatus.cancelled => const Color(0xFFF5F5F5),
        _ => AppColors.surface,
      };

  Color get _textColor => switch (status) {
        OrderStatus.pending => const Color(0xFFD81B60),
        OrderStatus.accepted => AppColors.success,
        OrderStatus.processing => AppColors.info,
        OrderStatus.ready => AppColors.success,
        OrderStatus.completed => AppColors.textSecondary,
        OrderStatus.rejected => AppColors.error,
        OrderStatus.cancelled => AppColors.textSecondary,
        _ => AppColors.textPrimary,
      };

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(18),
        decoration: BoxDecoration(
          color: _bgColor,
          borderRadius: BorderRadius.circular(16),
        ),
        child: Column(
          children: [
            Text(_title,
                textAlign: TextAlign.center,
                style: TextStyle(
                    color: _textColor,
                    fontWeight: FontWeight.w800,
                    fontSize: 18)),
            if (_subtitle.isNotEmpty) ...[
              const SizedBox(height: 6),
              Text(_subtitle,
                  textAlign: TextAlign.center,
                  style: TextStyle(
                      color: _textColor.withValues(alpha: 0.7),
                      fontSize: 12,
                      height: 1.4)),
            ],
          ],
        ),
      );
}

// ─── Action Button ────────────────────────────────────────────────────────────

class _ActionButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  const _ActionButton(
      {required this.icon, required this.label, this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 14),
          decoration: BoxDecoration(
            color: AppColors.bg,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon,
                  size: 18,
                  color: onTap != null
                      ? AppColors.textPrimary
                      : AppColors.textDisabled),
              const SizedBox(width: 8),
              Text(label,
                  style: TextStyle(
                      color: onTap != null
                          ? AppColors.textPrimary
                          : AppColors.textDisabled,
                      fontWeight: FontWeight.w600,
                      fontSize: 13)),
            ],
          ),
        ),
      );
}

// ─── Copy Button ──────────────────────────────────────────────────────────────

class _CopyButton extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback? onTap;
  const _CopyButton({required this.icon, required this.label, this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 12),
          decoration: BoxDecoration(
            color: AppColors.bg,
            borderRadius: BorderRadius.circular(10),
            border: Border.all(color: AppColors.border),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon,
                  size: 15,
                  color: onTap != null
                      ? AppColors.textSecondary
                      : AppColors.textDisabled),
              const SizedBox(width: 6),
              Text(label,
                  style: TextStyle(
                      color: onTap != null
                          ? AppColors.textSecondary
                          : AppColors.textDisabled,
                      fontWeight: FontWeight.w500,
                      fontSize: 12)),
            ],
          ),
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
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.border),
      ),
      child: isTerminal
          ? Row(children: [
              Icon(
                currentStatus == OrderStatus.rejected
                    ? Icons.cancel_outlined
                    : Icons.block_outlined,
                color: AppColors.error,
              ),
              const SizedBox(width: 10),
              Text(
                currentStatus == OrderStatus.rejected
                    ? 'Rejected by vendor'
                    : 'Order cancelled',
                style: const TextStyle(
                    color: AppColors.error,
                    fontWeight: FontWeight.w600,
                    fontSize: 15),
              ),
            ])
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
                            height: 32,
                            color: isDone
                                ? AppColors.primary
                                : AppColors.border),
                    ]),
                    const SizedBox(width: 14),
                    Expanded(
                      child: Padding(
                        padding:
                            const EdgeInsets.only(top: 4, bottom: 18),
                        child: Text(step.$2,
                            style: TextStyle(
                                color: isActive
                                    ? AppColors.primary
                                    : isDone
                                        ? AppColors.textPrimary
                                        : AppColors.textDisabled,
                                fontWeight: FontWeight.w600,
                                fontSize: 14)),
                      ),
                    ),
                    if (isDone)
                      const Padding(
                        padding: EdgeInsets.only(top: 4),
                        child: Icon(Icons.check_circle,
                            size: 16, color: AppColors.primary),
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
              ? AppColors.primary
              : isActive
                  ? AppColors.primarySurface
                  : AppColors.surface,
          shape: BoxShape.circle,
          border: isActive
              ? Border.all(color: AppColors.primary, width: 2)
              : Border.all(color: AppColors.border),
        ),
        child: Icon(
          isDone ? Icons.check : icon,
          size: 14,
          color: isDone
              ? Colors.white
              : isActive
                  ? AppColors.primary
                  : AppColors.textDisabled,
        ),
      );
}

// ─── Order Details Expandable Row ─────────────────────────────────────────────

class _OrderDetailsRow extends StatefulWidget {
  final OrderModel order;
  const _OrderDetailsRow({required this.order});

  @override
  State<_OrderDetailsRow> createState() => _OrderDetailsRowState();
}

class _OrderDetailsRowState extends State<_OrderDetailsRow> {
  bool _expanded = false;

  @override
  Widget build(BuildContext context) {
    final order = widget.order;
    return Column(
      children: [
        GestureDetector(
          onTap: () => setState(() => _expanded = !_expanded),
          child: Container(
            padding:
                const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Row(
              children: [
                const Text('View Order Details',
                    style: TextStyle(
                        color: AppColors.textPrimary,
                        fontWeight: FontWeight.w600,
                        fontSize: 14)),
                const Spacer(),
                Icon(
                    _expanded
                        ? Icons.keyboard_arrow_up
                        : Icons.keyboard_arrow_right,
                    color: AppColors.textTertiary),
              ],
            ),
          ),
        ),
        if (_expanded)
          Container(
            margin: const EdgeInsets.only(top: 2),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: AppColors.border),
            ),
            child: Column(
              children: [
                _DetailRow('Copies', '${order.copies}'),
                _DetailRow(
                    'Double-sided', order.isDoubleSided ? 'Yes' : 'No'),
                _DetailRow(
                    'Total',
                    '₹${order.totalPrice.toStringAsFixed(2)}',
                    highlight: true),
                _DetailRow(
                    'Placed',
                    '${order.createdAt.day}/${order.createdAt.month}/${order.createdAt.year}',
                    isLast: true),
              ],
            ),
          ),
      ],
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label, value;
  final bool highlight, isLast;
  const _DetailRow(this.label, this.value,
      {this.highlight = false, this.isLast = false});

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(vertical: 9),
        decoration: isLast
            ? null
            : const BoxDecoration(
                border: Border(
                    bottom:
                        BorderSide(color: AppColors.border, width: 0.5))),
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label,
                style: const TextStyle(
                    color: AppColors.textSecondary, fontSize: 13)),
            Text(value,
                style: TextStyle(
                    color:
                        highlight ? AppColors.primary : AppColors.textPrimary,
                    fontSize: highlight ? 15 : 13,
                    fontWeight: FontWeight.w600)),
          ],
        ),
      );
}
