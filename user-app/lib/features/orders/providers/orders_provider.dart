import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:paper_prints_user/core/constants/app_constants.dart';
import 'package:paper_prints_user/core/network/repositories.dart';

// ─── Models ──────────────────────────────────────────────────────────────────

class OrderPage {
  final int pageNumber;
  final String printType; // 'BW' | 'COLOR'
  final bool isColor;

  const OrderPage(
      {required this.pageNumber,
      required this.printType,
      required this.isColor});

  factory OrderPage.fromJson(Map<String, dynamic> j) => OrderPage(
        pageNumber: ((j['pageNumber'] ?? j['page_number']) as num?)?.toInt() ?? 0,
        printType: (j['printType'] ?? j['print_type']) as String? ??
            (j['isColor'] == true || j['is_color'] == true ? PrintType.color : PrintType.bw),
        isColor: (j['isColor'] ?? j['is_color']) as bool? ?? false,
      );
}

class OrderModel {
  final String id;
  final String orderNumber;
  final String status;
  final int copies;
  final bool isDoubleSided;
  final double totalPrice;
  final String? estimatedTime;
  final String? qrCodeUrl;
  final DateTime createdAt;
  final List<OrderPage> pages;
  // Vendor info (may not always be present)
  final String? shopName;
  final String? shopPhone;
  final String? shopAddress;
  final double? shopLat;
  final double? shopLng;

  const OrderModel({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.copies,
    required this.isDoubleSided,
    required this.totalPrice,
    this.estimatedTime,
    this.qrCodeUrl,
    required this.createdAt,
    this.pages = const [],
    this.shopName,
    this.shopPhone,
    this.shopAddress,
    this.shopLat,
    this.shopLng,
  });

  factory OrderModel.fromJson(Map<String, dynamic> j) => OrderModel(
        id: j['id'] as String,
        // Backend formatOrder() returns camelCase; fall back to snake_case for raw DB rows
        orderNumber: (j['orderNumber'] ?? j['order_number']) as String? ?? '',
        status: (j['status'] as String? ?? 'PENDING').toUpperCase(),
        copies: (j['copies'] as num?)?.toInt() ?? 1,
        isDoubleSided: (j['isDoubleSided'] ?? j['is_double_sided']) as bool? ?? false,
        totalPrice: ((j['totalPrice'] ?? j['total_price']) as num?)?.toDouble() ?? 0,
        estimatedTime: (j['estimatedTime'] ?? j['estimated_time']) as String?,
        qrCodeUrl: (j['qrCodeUrl'] ?? j['qr_code_url']) as String?,
        createdAt: DateTime.tryParse(
                ((j['createdAt'] ?? j['created_at']) as String? ?? '')) ??
            DateTime.now(),
        pages: (j['pages'] as List<dynamic>? ?? [])
            .map((e) => OrderPage.fromJson(e as Map<String, dynamic>))
            .toList(),
        // Vendor info — present when backend includes it
        shopName: j['shop_name'] as String? ?? j['vendor']?['shop_name'] as String?,
        shopPhone: j['shop_phone'] as String? ?? j['vendor']?['phone'] as String?,
        shopAddress: j['shop_address'] as String? ?? j['vendor']?['address'] as String?,
        shopLat: j['shop_lat'] != null
            ? (j['shop_lat'] as num).toDouble()
            : j['vendor']?['lat'] != null
                ? (j['vendor']['lat'] as num).toDouble()
                : null,
        shopLng: j['shop_lng'] != null
            ? (j['shop_lng'] as num).toDouble()
            : j['vendor']?['lng'] != null
                ? (j['vendor']['lng'] as num).toDouble()
                : null,
      );

  OrderModel copyWith({
    String? status,
    String? estimatedTime,
    String? qrCodeUrl,
  }) =>
      OrderModel(
        id: id,
        orderNumber: orderNumber,
        status: status ?? this.status,
        copies: copies,
        isDoubleSided: isDoubleSided,
        totalPrice: totalPrice,
        estimatedTime: estimatedTime ?? this.estimatedTime,
        qrCodeUrl: qrCodeUrl ?? this.qrCodeUrl,
        createdAt: createdAt,
        pages: pages,
        shopName: shopName,
        shopPhone: shopPhone,
        shopAddress: shopAddress,
        shopLat: shopLat,
        shopLng: shopLng,
      );
}

// ─── Orders State ─────────────────────────────────────────────────────────────

class OrdersState {
  final List<OrderModel> orders;
  final OrderModel? activeOrder;
  final bool isLoading;
  final String? error;

  const OrdersState(
      {this.orders = const [],
      this.activeOrder,
      this.isLoading = false,
      this.error});

  OrdersState copyWith({
    List<OrderModel>? orders,
    OrderModel? activeOrder,
    bool? isLoading,
    String? error,
  }) =>
      OrdersState(
        orders: orders ?? this.orders,
        activeOrder: activeOrder ?? this.activeOrder,
        isLoading: isLoading ?? this.isLoading,
        error: error,
      );
}

// ─── Orders Notifier ─────────────────────────────────────────────────────────

class OrdersNotifier extends StateNotifier<OrdersState> {
  OrdersNotifier() : super(const OrdersState());

  final _repo = OrdersRepository();

  Future<void> fetchAll() async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final raw = await _repo.getAll();
      final orders =
          raw.map((e) => OrderModel.fromJson(e as Map<String, dynamic>)).toList();
      state = state.copyWith(orders: orders, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<void> fetchById(String id) async {
    state = state.copyWith(isLoading: true);
    try {
      final raw = await _repo.getById(id);
      final order = OrderModel.fromJson(raw);
      state = state.copyWith(activeOrder: order, isLoading: false);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  Future<OrderModel> create(Map<String, dynamic> payload) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final raw = await _repo.create(payload);
      final order = OrderModel.fromJson(raw);
      state = state.copyWith(
        orders: [order, ...state.orders],
        activeOrder: order,
        isLoading: false,
      );
      return order;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
      rethrow;
    }
  }

  Future<void> cancel(String id) async {
    try {
      await _repo.cancel(id);
      _updateStatus(id, OrderStatus.cancelled);
    } catch (e) {
      state = state.copyWith(error: e.toString());
      rethrow;
    }
  }

  void updateFromSocket(String orderId, String newStatus,
      {String? estimatedTime, String? qrCodeUrl}) {
    _updateStatus(orderId, newStatus,
        estimatedTime: estimatedTime, qrCodeUrl: qrCodeUrl);
  }

  void _updateStatus(String id, String status,
      {String? estimatedTime, String? qrCodeUrl}) {
    final updatedOrders = state.orders.map((o) {
      if (o.id != id) return o;
      return o.copyWith(
          status: status,
          estimatedTime: estimatedTime,
          qrCodeUrl: qrCodeUrl);
    }).toList();

    final activeOrder = state.activeOrder?.id == id
        ? state.activeOrder!.copyWith(
            status: status,
            estimatedTime: estimatedTime,
            qrCodeUrl: qrCodeUrl)
        : state.activeOrder;

    state = state.copyWith(orders: updatedOrders, activeOrder: activeOrder);
  }
}

final ordersProvider =
    StateNotifierProvider<OrdersNotifier, OrdersState>((_) => OrdersNotifier());
