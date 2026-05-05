import 'dart:io';
import 'package:flutter/foundation.dart';
import 'package:paper_prints_user/core/constants/app_constants.dart';

/// Checks whether the device can resolve the backend hostname.
/// Returns `true` if DNS works, `false` if it fails (e.g. on Jio networks).
class ConnectivityChecker {
  ConnectivityChecker._();

  /// Try to resolve the backend hostname via system DNS.
  /// Returns `true` if successful, `false` on DNS failure.
  static Future<bool> canResolveBackend() async {
    try {
      final uri = Uri.parse(AppConstants.socketUrl);
      final results = await InternetAddress.lookup(uri.host)
          .timeout(const Duration(seconds: 5));
      return results.isNotEmpty && results.first.rawAddress.isNotEmpty;
    } catch (e) {
      debugPrint('DNS resolution failed for backend: $e');
      return false;
    }
  }

  /// Returns `true` if the device has general internet (can reach Google).
  static Future<bool> hasInternet() async {
    try {
      final results = await InternetAddress.lookup('google.com')
          .timeout(const Duration(seconds: 5));
      return results.isNotEmpty && results.first.rawAddress.isNotEmpty;
    } catch (_) {
      return false;
    }
  }

  /// Diagnoses the connectivity issue:
  /// - `null` → everything is fine
  /// - `'no_internet'` → no internet at all
  /// - `'dns_blocked'` → internet works but backend DNS fails (Jio issue)
  static Future<String?> diagnose() async {
    final internet = await hasInternet();
    if (!internet) return 'no_internet';

    final backend = await canResolveBackend();
    if (!backend) return 'dns_blocked';

    return null; // all good
  }
}
