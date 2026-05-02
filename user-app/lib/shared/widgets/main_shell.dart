import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:paper_prints_user/core/theme/app_theme.dart';

class MainShell extends StatelessWidget {
  final Widget child;
  const MainShell({super.key, required this.child});

  // 2 tabs: Print (home), Orders
  static const _tabs = [
    ('/home', Icons.print_rounded, Icons.print_outlined, 'Print'),
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
    final bottomPadding = MediaQuery.of(context).padding.bottom;

    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.bg,
          border: Border(
            top: BorderSide(color: AppColors.border, width: 0.8),
          ),
        ),
        padding: EdgeInsets.only(bottom: bottomPadding),
        child: IntrinsicHeight(
          child: Row(
            children: [
              // Print tab
              Expanded(
                child: _NavTab(
                  icon: idx == 0 ? _tabs[0].$2 : _tabs[0].$3,
                  label: _tabs[0].$4,
                  isActive: idx == 0,
                  onTap: () => context.go(_tabs[0].$1),
                ),
              ),
              // Vertical divider
              Container(
                width: 1,
                height: 32,
                color: AppColors.border,
              ),
              // Orders tab
              Expanded(
                child: _NavTab(
                  icon: idx == 1 ? _tabs[1].$2 : _tabs[1].$3,
                  label: _tabs[1].$4,
                  isActive: idx == 1,
                  onTap: () => context.go(_tabs[1].$1),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _NavTab extends StatelessWidget {
  final IconData icon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _NavTab({
    required this.icon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(icon,
                  size: 26,
                  color: isActive ? AppColors.primary : AppColors.textTertiary),
              const SizedBox(height: 4),
              Text(label,
                  style: TextStyle(
                      color: isActive
                          ? AppColors.primary
                          : AppColors.textTertiary,
                      fontSize: 12,
                      fontWeight:
                          isActive ? FontWeight.w700 : FontWeight.w500)),
            ],
          ),
        ),
      );
}
