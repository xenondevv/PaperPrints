import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:paper_prints_user/core/theme/app_theme.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  static const _tabs = [
    ('/home', Icons.home_rounded, Icons.home_outlined, 'Home'),
    ('/shops', Icons.storefront_rounded, Icons.storefront_outlined, 'Shops'),
    ('/upload', Icons.cloud_upload_rounded, Icons.cloud_upload_outlined, 'Upload'),
    ('/orders', Icons.receipt_long_rounded, Icons.receipt_long_outlined, 'Orders'),
    ('/profile', Icons.person_rounded, Icons.person_outlined, 'Profile'),
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
          border: Border(
            top: BorderSide(color: AppColors.border, width: 0.5),
          ),
        ),
        child: BottomNavigationBar(
          currentIndex: idx,
          onTap: (i) => context.go(_tabs[i].$1),
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
