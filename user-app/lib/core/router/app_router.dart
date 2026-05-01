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
import 'package:paper_prints_user/features/profile/screens/profile_screen.dart';
import 'package:paper_prints_user/shared/widgets/main_shell.dart';

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
      // Auth
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),

      // Main shell — only 3 tabs in nav bar
      ShellRoute(
        builder: (context, state, child) => MainShell(child: child),
        routes: [
          GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
          GoRoute(path: '/upload', builder: (_, state) {
            final extra = state.extra as Map<String, dynamic>?;
            return UploadScreen(preselectedVendorId: extra?['vendorId'] as String?);
          }),
          GoRoute(path: '/orders', builder: (_, __) => const OrderHistoryScreen()),
        ],
      ),

      // Push routes (not in nav bar)
      GoRoute(path: '/shops', builder: (_, __) => const ShopListScreen()),
      GoRoute(path: '/profile', builder: (_, __) => const ProfileScreen()),
      GoRoute(
        path: '/shops/:id',
        builder: (_, state) =>
            ShopDetailScreen(vendorId: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/orders/:id',
        builder: (_, state) =>
            OrderDetailScreen(orderId: state.pathParameters['id']!),
      ),
    ],
  );
});
