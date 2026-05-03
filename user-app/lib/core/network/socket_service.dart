import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:paper_prints_user/core/constants/app_constants.dart';

/// Singleton Socket.IO client for real-time order status updates.
class SocketService {
  SocketService._();
  static final SocketService instance = SocketService._();

  io.Socket? _socket;
  final _storage = const FlutterSecureStorage();

  bool get isConnected => _socket?.connected ?? false;

  /// Connect to the server and join the user's personal room.
  /// Safe to call multiple times — skips reconnect if already connected.
  Future<void> connect(String userId) async {
    final token = await _storage.read(key: AppConstants.keyAccessToken);

    if (!isConnected) {
      _socket = io.io(
        AppConstants.socketUrl,
        io.OptionBuilder()
            .setTransports(['websocket'])
            .disableAutoConnect()
            .setAuth({'token': token})
            .build(),
      );

      _socket!.connect();

      _socket!.onConnect((_) {
        _socket!.emit('join_room', {'role': 'user', 'userId': userId});
      });

      _socket!.onDisconnect((_) {
        // Will auto-reconnect via socket_io_client defaults
      });

      _socket!.onConnectError((err) {
        // Non-fatal — app works in offline/polling mode
      });
    } else {
      // Already connected — just re-join the room in case it was lost
      _socket!.emit('join_room', {'role': 'user', 'userId': userId});
    }
  }

  void disconnect() {
    _socket?.disconnect();
    _socket = null;
  }

  // ── Event subscriptions ────────────────────────────────────────────────────

  /// Vendor accepted the order. Payload: { orderId, estimatedTime }
  void onOrderAccepted(void Function(Map<String, dynamic>) cb) {
    _socket?.on('order_accepted', (data) => cb(_cast(data)));
  }

  /// Vendor rejected the order. Payload: { orderId }
  void onOrderRejected(void Function(Map<String, dynamic>) cb) {
    _socket?.on('order_rejected', (data) => cb(_cast(data)));
  }

  /// Any status transition (PROCESSING, READY…). Payload: { orderId, status }
  void onStatusUpdate(void Function(Map<String, dynamic>) cb) {
    _socket?.on('status_update', (data) => cb(_cast(data)));
  }

  /// Order is ready for pickup. Payload: { orderId, qrCode }
  void onOrderReady(void Function(Map<String, dynamic>) cb) {
    _socket?.on('order_ready', (data) => cb(_cast(data)));
  }

  /// Remove all order-related listeners (call from dispose).
  void offOrderEvents() {
    _socket?.off('order_accepted');
    _socket?.off('order_rejected');
    _socket?.off('status_update');
    _socket?.off('order_ready');
  }

  Map<String, dynamic> _cast(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) return Map<String, dynamic>.from(data);
    return {};
  }
}
