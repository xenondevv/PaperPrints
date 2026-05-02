import 'package:flutter/foundation.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpaymentgateway/cfpaymentgatewayservice.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfsession/cfsession.dart';
import 'package:flutter_cashfree_pg_sdk/api/cfpayment/cfwebcheckoutpayment.dart';
import 'package:flutter_cashfree_pg_sdk/api/cferrorresponse/cferrorresponse.dart';
import 'package:flutter_cashfree_pg_sdk/utils/cfenums.dart';
import 'package:paper_prints_user/core/network/repositories.dart';

/// Manages the Cashfree payment flow:
/// 1. Creates a payment session on the backend
/// 2. Opens the Cashfree checkout UI
/// 3. Verifies payment after completion
class PaymentService {
  static final PaymentService _instance = PaymentService._();
  static PaymentService get instance => _instance;

  PaymentService._();

  final _paymentsRepo = PaymentsRepository();

  // Store callbacks so they survive across the async gap
  Function(Map<String, dynamic>)? _onSuccess;
  Function(String)? _onError;
  String? _currentOrderId;

  /// Initiates the full payment flow for an order.
  Future<void> startPayment({
    required String orderId,
    required Function(Map<String, dynamic> result) onSuccess,
    required Function(String error) onError,
  }) async {
    _onSuccess = onSuccess;
    _onError = onError;
    _currentOrderId = orderId;

    // 1. Create session on our backend (which calls Cashfree API)
    final sessionData = await _paymentsRepo.createSession(orderId);

    final cfOrderId = sessionData['cf_order_id'] as String;
    final paymentSessionId = sessionData['payment_session_id'] as String;

    debugPrint('Cashfree session created: cf_order_id=$cfOrderId');

    // 2. Create CFSession
    final cfSession = CFSessionBuilder()
        .setEnvironment(CFEnvironment.SANDBOX) // Change to PRODUCTION for live
        .setOrderId(cfOrderId)
        .setPaymentSessionId(paymentSessionId)
        .build();

    // 3. Create the web checkout payment object
    final cfWebCheckout = CFWebCheckoutPaymentBuilder()
        .setSession(cfSession)
        .build();

    // 4. Set up callbacks on the payment gateway service
    final cfPaymentGateway = CFPaymentGatewayService();

    cfPaymentGateway.setCallback(
      _handlePaymentSuccess,
      _handlePaymentError,
    );

    // 5. Open the checkout
    cfPaymentGateway.doPayment(cfWebCheckout);
  }

  void _handlePaymentSuccess(String cfOrderId) async {
    debugPrint('Cashfree payment completed for cf_order: $cfOrderId');
    try {
      final verifyResult = await _paymentsRepo.verifyPayment(_currentOrderId!);
      
      final status = verifyResult['status'];
      if (status == 'COMPLETED') {
        _onSuccess?.call(verifyResult);
      } else {
        _onError?.call('Payment verification returned status: $status');
      }
    } catch (e) {
      debugPrint('Payment verification error: $e');
      _onError?.call('Payment completed but verification failed. Please contact support.');
    }
  }

  void _handlePaymentError(CFErrorResponse cfError, String cfOrderId) {
    final message = cfError.getMessage() ?? 'Payment failed or cancelled';
    debugPrint('Cashfree payment error: $message for cf_order: $cfOrderId');
    _onError?.call(message);
  }
}
