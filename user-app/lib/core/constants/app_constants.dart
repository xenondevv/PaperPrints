class AppConstants {
  // API
  static const apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://127.0.0.1:3000/api',
  );
  static const socketUrl = String.fromEnvironment(
    'SOCKET_URL',
    defaultValue: 'http://127.0.0.1:3000',
  );

  // Storage keys
  static const keyAccessToken = 'access_token';
  static const keyRefreshToken = 'refresh_token';
  static const keyUser = 'user_data';

  // Limits
  static const maxFileSizeMb = 50;
  static const maxFileSizeBytes = maxFileSizeMb * 1024 * 1024;
  static const defaultRadiusKm = 10.0;
}

class OrderStatus {
  static const pending = 'PENDING';
  static const accepted = 'ACCEPTED';
  static const processing = 'PROCESSING';
  static const ready = 'READY';
  static const completed = 'COMPLETED';
  static const rejected = 'REJECTED';
  static const cancelled = 'CANCELLED';

  static String label(String status) => switch (status) {
    pending => 'Waiting for vendor',
    accepted => 'Order accepted',
    processing => 'Printing in progress',
    ready => 'Ready for pickup',
    completed => 'Picked up',
    rejected => 'Order rejected',
    cancelled => 'Cancelled',
    _ => status,
  };

  static List<String> get progressSteps =>
      [pending, accepted, processing, ready, completed];

  static bool isTerminal(String s) => s == rejected || s == cancelled;
}

class PrintType {
  static const bw = 'BW';
  static const color = 'COLOR';
}
