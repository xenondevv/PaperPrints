import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:paper_prints_user/core/network/repositories.dart';
import 'package:paper_prints_user/core/theme/app_theme.dart';
import 'package:paper_prints_user/features/auth/providers/auth_provider.dart';
import 'package:paper_prints_user/shared/widgets/paper_prints_loader.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  bool _saving = false;

  @override
  void dispose() {
    _nameCtrl.dispose();
    _emailCtrl.dispose();
    super.dispose();
  }

  void _openEdit() {
    final user = ref.read(authProvider).user;
    _nameCtrl.text = user?.name ?? '';
    _emailCtrl.text = user?.email ?? '';
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.bg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(24)),
      ),
      builder: (_) => _EditProfileSheet(
        nameCtrl: _nameCtrl,
        emailCtrl: _emailCtrl,
        onSave: _saveProfile,
        saving: _saving,
      ),
    );
  }

  Future<void> _saveProfile() async {
    if (_nameCtrl.text.trim().isEmpty) return;
    setState(() => _saving = true);
    try {
      final updated = await UsersRepository().updateProfile({
        'name': _nameCtrl.text.trim(),
        if (_emailCtrl.text.trim().isNotEmpty) 'email': _emailCtrl.text.trim(),
      });
      ref.read(authProvider.notifier).updateUser(
            UserModel.fromJson(updated),
          );
      if (mounted) {
        Navigator.pop(context);
        _showSnack('Profile updated', success: true);
      }
    } catch (_) {
      if (mounted) _showSnack('Could not update profile');
    } finally {
      setState(() => _saving = false);
    }
  }

  void _confirmLogout() {
    showDialog(
      context: context,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: const Text('Log Out',
            style: TextStyle(color: AppColors.textPrimary)),
        content: const Text('Are you sure you want to log out?',
            style: TextStyle(color: AppColors.textSecondary)),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            onPressed: () {
              Navigator.pop(context);
              ref.read(authProvider.notifier).logout();
            },
            child: const Text('Log Out'),
          ),
        ],
      ),
    );
  }

  void _showSnack(String msg, {bool success = false}) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(
      content: Text(msg),
      backgroundColor: success ? AppColors.success : AppColors.error,
      behavior: SnackBarBehavior.floating,
      shape:
          RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
    ));
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final initial = user?.name.isNotEmpty == true
        ? user!.name[0].toUpperCase()
        : 'U';

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.fromLTRB(20, 24, 20, 40),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // ── Header ────────────────────────────────────────
              const Text('Profile',
                  style: TextStyle(
                      color: AppColors.textPrimary,
                      fontWeight: FontWeight.w800,
                      fontSize: 28)),
              const SizedBox(height: 28),

              // ── Avatar + Info ──────────────────────────────────
              Center(
                child: Column(children: [
                  GestureDetector(
                    onTap: _openEdit,
                    child: Stack(children: [
                      // Avatar: photo from Google or initial letter
                      user?.photoUrl != null
                          ? CircleAvatar(
                              radius: 42,
                              backgroundImage: NetworkImage(user!.photoUrl!),
                            )
                          : Container(
                              width: 84,
                              height: 84,
                              decoration: const BoxDecoration(
                                color: AppColors.primary,
                                shape: BoxShape.circle,
                              ),
                              child: Center(
                                child: Text(initial,
                                    style: const TextStyle(
                                        color: Colors.white,
                                        fontWeight: FontWeight.w800,
                                        fontSize: 34)),
                              ),
                            ),
                      Positioned(
                        bottom: 0,
                        right: 0,
                        child: Container(
                          width: 26,
                          height: 26,
                          decoration: BoxDecoration(
                            color: AppColors.primaryDark,
                            shape: BoxShape.circle,
                            border: Border.all(
                                color: AppColors.bg, width: 2),
                          ),
                          child: const Icon(Icons.edit,
                              size: 13, color: Colors.white),
                        ),
                      ),
                    ]),
                  ),
                  const SizedBox(height: 12),
                  Text(user?.name ?? '',
                      style: const TextStyle(
                          color: AppColors.textPrimary,
                          fontWeight: FontWeight.w700,
                          fontSize: 22)),
                  const SizedBox(height: 4),
                  Text(user?.email ?? '',
                      style: const TextStyle(
                          color: AppColors.textSecondary, fontSize: 14)),
                  const SizedBox(height: 4),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.primarySurface,
                      borderRadius: BorderRadius.circular(20),
                    ),
                    child: const Row(mainAxisSize: MainAxisSize.min, children: [
                      Icon(Icons.account_circle_outlined,
                          size: 12, color: AppColors.primary),
                      SizedBox(width: 4),
                      Text('Google Account',
                          style: TextStyle(
                              color: AppColors.primary,
                              fontSize: 11,
                              fontWeight: FontWeight.w600)),
                    ]),
                  ),
                ]),
              ),
              const SizedBox(height: 32),

              // ── Menu ──────────────────────────────────────────
              _MenuCard(items: [
                _MenuItem(
                  icon: Icons.receipt_long_outlined,
                  label: 'My Orders',
                  onTap: () => context.push('/profile/orders'),
                ),
                _MenuItem(
                  icon: Icons.person_outline,
                  label: 'Edit Profile',
                  onTap: _openEdit,
                ),
                _MenuItem(
                  icon: Icons.notifications_outlined,
                  label: 'Notifications',
                  onTap: () => _showSnack(
                      'Notification preferences coming soon',
                      success: true),
                ),
              ]),
              const SizedBox(height: 12),

              _MenuCard(items: [
                _MenuItem(
                  icon: Icons.help_outline,
                  label: 'Help & Support',
                  onTap: () => _showInfo(
                      context, 'Support', 'Email us at support@paperprints.store'),
                ),
                _MenuItem(
                  icon: Icons.shield_outlined,
                  label: 'Privacy Policy',
                  onTap: () => _showInfo(context, 'Privacy Policy', _privacyPolicyText),
                ),
                _MenuItem(
                  icon: Icons.info_outline,
                  label: 'About',
                  trailing: const Text('v1.0.0',
                      style: TextStyle(
                          color: AppColors.textTertiary, fontSize: 13)),
                  onTap: () => _showInfo(
                      context, 'Paper Prints', 'Version 1.0.0\nBuilt with Flutter'),
                ),
              ]),
              const SizedBox(height: 24),

              // ── Logout ────────────────────────────────────────
              OutlinedButton.icon(
                onPressed: _confirmLogout,
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.error,
                  side: const BorderSide(color: AppColors.error),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  minimumSize: const Size(double.infinity, 52),
                ),
                icon: const Icon(Icons.logout_outlined),
                label: const Text('Log Out',
                    style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _showInfo(BuildContext ctx, String title, String msg) {
    showDialog(
      context: ctx,
      builder: (_) => AlertDialog(
        backgroundColor: AppColors.surface,
        title: Text(title,
            style: const TextStyle(color: AppColors.textPrimary)),
        content: SingleChildScrollView(
          child: Text(msg,
              style: const TextStyle(
                  color: AppColors.textSecondary, height: 1.5)),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('OK')),
        ],
      ),
    );
  }
}

const String _privacyPolicyText = '''
Last Updated: May 2026

1. Information We Collect
• Account Data: When you sign in via Google, we collect your basic profile information (name, email address, and profile picture).
• Location Data: We may request location access to show you the nearest available print shops.
• Files and Documents: We temporarily store the documents (e.g., PDFs, images) you upload solely for fulfilling your print orders.

2. How We Use Your Information
• To route your print orders to your selected vendor.
• To process payments securely through our third-party payment gateway.
• To communicate order updates and status changes.

3. Third-Party Services
We use trusted third-party services that may access your data securely:
• Firebase/Google Auth (for secure authentication)
• Cashfree Payments (for processing transactions)
These services operate under their own privacy policies.

4. Data Retention and Security
• Document Security: The files you upload are encrypted in transit and at rest.
• Auto-Deletion: Your uploaded files are automatically deleted from our servers shortly after your order is completed or cancelled. We do not use your documents for any other purpose.
• Account Data: You may request account deletion at any time by contacting our support team.

5. Your Rights
You have the right to access, update, or request the deletion of your personal data. You can manage your profile information directly within the app.

6. Contact Us
If you have any questions or concerns about this Privacy Policy, please contact us at support@paperprints.store.
''';

// ─── Edit Profile Bottom Sheet ────────────────────────────────────────────────

class _EditProfileSheet extends StatelessWidget {
  final TextEditingController nameCtrl, emailCtrl;
  final VoidCallback onSave;
  final bool saving;

  const _EditProfileSheet({
    required this.nameCtrl,
    required this.emailCtrl,
    required this.onSave,
    required this.saving,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.fromLTRB(
          24, 16, 24, MediaQuery.of(context).viewInsets.bottom + 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: AppColors.border,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 20),
          const Text('Edit Profile',
              style: TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w800,
                  fontSize: 20)),
          const SizedBox(height: 24),
          _label('Full Name'),
          const SizedBox(height: 6),
          TextField(
            controller: nameCtrl,
            style: const TextStyle(color: AppColors.textPrimary),
            textCapitalization: TextCapitalization.words,
            decoration: const InputDecoration(
              hintText: 'Your name',
              filled: true,
              fillColor: AppColors.bg,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.all(Radius.circular(12)),
                borderSide: BorderSide(color: AppColors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.all(Radius.circular(12)),
                borderSide: BorderSide(color: AppColors.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.all(Radius.circular(12)),
                borderSide:
                    BorderSide(color: AppColors.primary, width: 1.5),
              ),
            ),
          ),
          const SizedBox(height: 16),
          _label('Email (optional)'),
          const SizedBox(height: 6),
          TextField(
            controller: emailCtrl,
            style: const TextStyle(color: AppColors.textPrimary),
            keyboardType: TextInputType.emailAddress,
            decoration: const InputDecoration(
              hintText: 'you@example.com',
              filled: true,
              fillColor: AppColors.bg,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.all(Radius.circular(12)),
                borderSide: BorderSide(color: AppColors.border),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.all(Radius.circular(12)),
                borderSide: BorderSide(color: AppColors.border),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.all(Radius.circular(12)),
                borderSide:
                    BorderSide(color: AppColors.primary, width: 1.5),
              ),
            ),
          ),
          const SizedBox(height: 24),
          Row(children: [
            Expanded(
              child: OutlinedButton(
                onPressed: () => Navigator.pop(context),
                style: OutlinedButton.styleFrom(
                  foregroundColor: AppColors.textSecondary,
                  side: const BorderSide(color: AppColors.border),
                  shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(12)),
                  minimumSize: const Size(0, 50),
                ),
                child: const Text('Cancel'),
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: ElevatedButton(
                onPressed: saving ? null : onSave,
                style: ElevatedButton.styleFrom(
                  minimumSize: const Size(0, 50),
                ),
                child: saving
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: PaperPrintsLoaderSmall(size: 20))
                    : const Text('Save'),
              ),
            ),
          ]),
        ],
      ),
    );
  }

  Widget _label(String t) => Text(t,
      style: const TextStyle(
          color: AppColors.textSecondary,
          fontSize: 13,
          fontWeight: FontWeight.w600));
}

// ─── Menu helpers ─────────────────────────────────────────────────────────────

class _MenuCard extends StatelessWidget {
  final List<_MenuItem> items;
  const _MenuCard({required this.items});

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.border),
      ),
      clipBehavior: Clip.hardEdge,
      child: Column(
        children: items.asMap().entries.map((e) {
          final isLast = e.key == items.length - 1;
          return Column(children: [
            e.value,
            if (!isLast)
              const Divider(
                  height: 1, color: AppColors.border, indent: 16, endIndent: 16),
          ]);
        }).toList(),
      ),
    );
  }
}

class _MenuItem extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Widget? trailing;

  const _MenuItem({
    required this.icon,
    required this.label,
    required this.onTap,
    this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 15),
        child: Row(children: [
          Icon(icon, size: 20, color: AppColors.primary),
          const SizedBox(width: 14),
          Expanded(
            child: Text(label,
                style: const TextStyle(
                    color: AppColors.textPrimary, fontSize: 15)),
          ),
          trailing ??
              const Icon(Icons.chevron_right,
                  size: 18, color: AppColors.textDisabled),
        ]),
      ),
    );
  }
}
