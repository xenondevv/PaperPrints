import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:paper_prints_user/core/theme/app_theme.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  // 3 tabs only: Home, Print, Orders
  static const _tabs = [
    ('/home', Icons.home_rounded, Icons.home_outlined, 'Home'),
    ('/upload', Icons.print_rounded, Icons.print_outlined, 'Print'),
    ('/orders', Icons.receipt_long_rounded, Icons.receipt_long_outlined, 'Orders'),
  ];

  int _tabIndex(BuildContext context) {
    final loc = GoRouterState.of(context).matchedLocation;
    for (var i = 0; i < _tabs.length; i++) {
      if (loc.startsWith(_tabs[i].$1)) return i;
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final idx = _tabIndex(context);

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.bg,
          border: Border(
            top: BorderSide(color: AppColors.border, width: 0.8),
          ),
          boxShadow: [
            BoxShadow(
              color: Color(0x0A000000),
              blurRadius: 8,
              offset: Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: idx,
          onTap: (i) => context.go(_tabs[i].$1),
          backgroundColor: Colors.transparent,
          elevation: 0,
          items: _tabs
              .asMap()
              .entries
              .map((e) => BottomNavigationBarItem(
                    icon: Icon(e.value.$3),
                    activeIcon: Icon(e.value.$2),
                    label: e.value.$4,
                  ))
              .toList(),
        ),
      ),
    );
  }
}
