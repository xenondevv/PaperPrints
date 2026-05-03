import 'dart:convert';
import 'dart:io';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:paper_prints_user/core/network/api_client.dart';

/// Top-level handler for background FCM messages (must be top-level function).
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  // When the app is in the background, FCM automatically shows the notification
  // on Android if it has a `notification` payload. Nothing extra needed here.
  debugPrint('📩 BG message: ${message.messageId}');
}

class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final FirebaseMessaging _fcm = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  bool _initialized = false;

  /// Android notification channel for order updates (high importance = sound + heads-up)
  static const AndroidNotificationChannel _orderChannel =
      AndroidNotificationChannel(
    'order_updates', // id
    'Order Updates', // title
    description: 'Notifications for order status changes',
    importance: Importance.high,
    playSound: true,
    enableVibration: true,
  );

  /// Initialize FCM, local notifications, and request permissions.
  Future<void> init() async {
    if (_initialized) return;
    _initialized = true;

    // 1. Request notification permission (Android 13+ / iOS)
    final settings = await _fcm.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      provisional: false,
    );
    debugPrint('🔔 Notification permission: ${settings.authorizationStatus}');

    // 2. Create the Android notification channel
    if (!kIsWeb && Platform.isAndroid) {
      await _localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(_orderChannel);
    }

    // 3. Initialize flutter_local_notifications
    const androidInit = AndroidInitializationSettings('@mipmap/ic_launcher');
    const initSettings = InitializationSettings(android: androidInit);
    await _localNotifications.initialize(initSettings);

    // 4. Listen for foreground messages
    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

    // 5. Register background handler
    FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);
  }

  /// Get the FCM device token.
  Future<String?> getToken() async {
    try {
      final token = await _fcm.getToken();
      debugPrint('🔑 FCM Token: $token');
      return token;
    } catch (e) {
      debugPrint('❌ Failed to get FCM token: $e');
      return null;
    }
  }

  /// Register the FCM token with our backend.
  Future<void> registerTokenWithBackend() async {
    final token = await getToken();
    if (token == null) return;

    try {
      await ApiClient.instance.dio.post(
        '/users/fcm-token',
        data: {'fcmToken': token},
      );
      debugPrint('✅ FCM token registered with backend');
    } catch (e) {
      debugPrint('❌ Failed to register FCM token: $e');
    }
  }

  /// Listen for token refreshes and re-register with backend.
  void listenForTokenRefresh() {
    _fcm.onTokenRefresh.listen((newToken) async {
      debugPrint('🔄 FCM Token refreshed: $newToken');
      try {
        await ApiClient.instance.dio.post(
          '/users/fcm-token',
          data: {'fcmToken': newToken},
        );
      } catch (e) {
        debugPrint('❌ Failed to update refreshed FCM token: $e');
      }
    });
  }

  /// Handle foreground FCM messages — show a local notification with sound.
  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('📩 Foreground message: ${message.notification?.title}');

    final notification = message.notification;
    if (notification == null) return;

    _localNotifications.show(
      notification.hashCode,
      notification.title,
      notification.body,
      NotificationDetails(
        android: AndroidNotificationDetails(
          _orderChannel.id,
          _orderChannel.name,
          channelDescription: _orderChannel.description,
          importance: Importance.high,
          priority: Priority.high,
          playSound: true,
          enableVibration: true,
          icon: '@mipmap/ic_launcher',
        ),
      ),
      payload: jsonEncode(message.data),
    );
  }
}
