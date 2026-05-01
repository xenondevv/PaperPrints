// register_screen.dart is no longer used.
// Google Sign-In handles both login and registration automatically.
// Users are redirected from /login directly.
// This file is kept as an empty placeholder to avoid broken imports.

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class RegisterScreen extends StatelessWidget {
  const RegisterScreen({super.key});
  @override
  Widget build(BuildContext context) {
    // Auto-redirect if somehow reached
    WidgetsBinding.instance.addPostFrameCallback((_) => context.go('/login'));
    return const SizedBox.shrink();
  }
}
