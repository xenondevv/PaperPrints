import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:paper_prints_user/features/auth/providers/auth_provider.dart';
import 'package:paper_prints_user/features/auth/screens/login_screen.dart';
import 'package:paper_prints_user/features/home/screens/home_screen.dart';
import 'package:paper_prints_user/features/shops/screens/shop_list_screen.dart';
import 'package:paper_prints_user/features/shops/screens/shop_detail_screen.dart';
import 'package:paper_prints_user/features/upload/screens/upload_screen.dart';
import 'package:paper_prints_user/features/orders/screens/order_history_screen.dart';
import 'package:paper_prints_user/features/orders/screens/order_detail_screen.dart';
import 'package:paper_prints_user/features/orders/screens/payment_failed_screen.dart';
import 'package:paper_prints_user/features/profile/screens/profile_screen.dart';
import 'package:paper_prints_user/shared/widgets/main_shell.dart';

/// Smooth slide + fade page transition
CustomTransitionPage<void> _smoothPage({
  required LocalKey key,
  required Widget child,
}) {
  return CustomTransitionPage(
    key: key,
    child: child,
    transitionDuration: const Duration(milliseconds: 300),
    reverseTransitionDuration: const Duration(milliseconds: 250),
    transitionsBuilder: (context, animation, secondaryAnimation, child) {
      final curve = CurvedAnimation(parent: animation, curve: Curves.easeOutCubic);
      return FadeTransition(
        opacity: curve,
        child: SlideTransition(
          position: Tween<Offset>(
            begin: const Offset(0.04, 0),
            end: Offset.zero,
          ).animate(curve),
          child: child,
        ),
      );
    },
  );
}

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: authState.isLoggedIn ? '/home' : '/login',
    redirect: (context, state) {
      final loggedIn = authState.isLoggedIn;
      final onAuth = state.matchedLocation.startsWith('/login') ||
          state.matchedLocation.startsWith('/register');

      if (!loggedIn && !onAuth) return '/login';
      if (loggedIn && onAuth) return '/home';
      return null;
    },
    routes: [
      // Auth — fade-in transition
      GoRoute(
        path: '/login',
        pageBuilder: (_, state) => _smoothPage(
          key: state.pageKey,
          child: const LoginScreen(),
        ),
      ),

      // Main shell — only 2 tabs in nav bar
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(
            path: '/home',
            pageBuilder: (_, state) => _smoothPage(
              key: state.pageKey,
              child: const HomeScreen(),
            ),
          ),
          GoRoute(
            path: '/orders',
            pageBuilder: (_, state) => _smoothPage(
              key: state.pageKey,
              child: const OrderHistoryScreen(),
            ),
          ),
        ],
      ),

      // Push routes (not in nav bar) — smooth transitions
      GoRoute(
        path: '/upload',
        pageBuilder: (_, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return _smoothPage(
            key: state.pageKey,
            child: UploadScreen(
                preselectedVendorId: extra?['vendorId'] as String?),
          );
        },
      ),
      GoRoute(
        path: '/shops',
        pageBuilder: (_, state) => _smoothPage(
          key: state.pageKey,
          child: const ShopListScreen(),
        ),
      ),
      GoRoute(
        path: '/profile',
        pageBuilder: (_, state) => _smoothPage(
          key: state.pageKey,
          child: const ProfileScreen(),
        ),
      ),
      GoRoute(
        path: '/shops/:id',
        pageBuilder: (_, state) => _smoothPage(
          key: state.pageKey,
          child: ShopDetailScreen(vendorId: state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/orders/:id',
        pageBuilder: (_, state) => _smoothPage(
          key: state.pageKey,
          child: OrderDetailScreen(orderId: state.pathParameters['id']!),
        ),
      ),
      GoRoute(
        path: '/payment-failed',
        pageBuilder: (_, state) => _smoothPage(
          key: state.pageKey,
          child: PaymentFailedScreen(errorMessage: state.extra as String?),
        ),
      ),
      GoRoute(
        path: '/profile/orders',
        pageBuilder: (_, state) => _smoothPage(
          key: state.pageKey,
          child: const OrderHistoryScreen(),
        ),
      ),
    ],
  );
});
