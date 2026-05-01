import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:paper_prints_user/core/theme/app_theme.dart';
import 'package:paper_prints_user/features/auth/providers/auth_provider.dart';

class LoginScreen extends ConsumerWidget {
  const LoginScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);

    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 32),
          child: Column(
            children: [
              const Spacer(flex: 2),

              // ── Brand ──────────────────────────────────────────────────────
              Container(
                width: 96,
                height: 96,
                decoration: BoxDecoration(
                  color: AppColors.primarySurface,
                  borderRadius: BorderRadius.circular(28),
                  border: Border.all(
                    color: AppColors.primary.withValues(alpha: 0.3),
                    width: 1.5,
                  ),
                ),
                child: const Center(
                  child: Text('🖨️', style: TextStyle(fontSize: 48)),
                ),
              ),
              const SizedBox(height: 24),
              const Text(
                'Paper Prints',
                style: TextStyle(
                  color: AppColors.textPrimary,
                  fontWeight: FontWeight.w800,
                  fontSize: 32,
                  letterSpacing: -0.5,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'Print from anywhere, pick up nearby',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 15,
                  height: 1.4,
                ),
              ),

              const Spacer(flex: 2),

              // ── Feature pills ──────────────────────────────────────────────
              Wrap(
                spacing: 10,
                runSpacing: 10,
                alignment: WrapAlignment.center,
                children: const [
                  _Pill(icon: Icons.upload_file_outlined, label: 'Upload PDF'),
                  _Pill(icon: Icons.storefront_outlined, label: 'Find shops'),
                  _Pill(icon: Icons.qr_code, label: 'Pickup QR'),
                ],
              ),

              const Spacer(flex: 3),

              // ── Error banner ───────────────────────────────────────────────
              if (auth.error != null) ...[
                Container(
                  padding: const EdgeInsets.all(12),
                  margin: const EdgeInsets.only(bottom: 16),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                    border:
                        Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                  ),
                  child: Row(children: [
                    const Icon(Icons.error_outline,
                        color: AppColors.error, size: 18),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(auth.error!,
                          style: const TextStyle(
                              color: AppColors.error, fontSize: 13)),
                    ),
                  ]),
                ),
              ],

              // ── Google Sign-In button ──────────────────────────────────────
              _GoogleButton(
                loading: auth.isLoading,
                onTap: () {
                  ref.read(authProvider.notifier).clearError();
                  ref.read(authProvider.notifier).signInWithGoogle();
                },
              ),

              const SizedBox(height: 16),
              const Text(
                'By continuing, you agree to our Terms of Service\nand Privacy Policy.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: AppColors.textDisabled,
                  fontSize: 11,
                  height: 1.5,
                ),
              ),
              const SizedBox(height: 32),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Google Button ────────────────────────────────────────────────────────────

class _GoogleButton extends StatelessWidget {
  final bool loading;
  final VoidCallback onTap;
  const _GoogleButton({required this.loading, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: loading ? null : onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        height: 56,
        decoration: BoxDecoration(
          color: loading ? AppColors.surface : Colors.white,
          borderRadius: BorderRadius.circular(16),
          boxShadow: loading
              ? []
              : [
                  BoxShadow(
                    color: Colors.black.withValues(alpha: 0.15),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ],
        ),
        child: loading
            ? const Center(
                child: SizedBox(
                  width: 22,
                  height: 22,
                  child: CircularProgressIndicator(
                      color: AppColors.primary, strokeWidth: 2.5),
                ),
              )
            : Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  // Google "G" logo
                  _GoogleLogo(),
                  const SizedBox(width: 12),
                  const Text(
                    'Continue with Google',
                    style: TextStyle(
                      color: Color(0xFF1F1F1F),
                      fontWeight: FontWeight.w600,
                      fontSize: 16,
                      letterSpacing: 0.1,
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}

class _GoogleLogo extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 22,
      height: 22,
      child: CustomPaint(painter: _GLogoPainter()),
    );
  }
}

class _GLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;
    final c = Offset(size.width / 2, size.height / 2);
    final r = size.width / 2;

    // Blue arc (top)
    paint.color = const Color(0xFF4285F4);
    canvas.drawArc(Rect.fromCircle(center: c, radius: r), -1.57, 3.14, true, paint);
    // Red arc (top-left)
    paint.color = const Color(0xFFEA4335);
    canvas.drawArc(Rect.fromCircle(center: c, radius: r), -2.70, 1.14, true, paint);
    // Yellow arc (bottom-left)
    paint.color = const Color(0xFFFBBC05);
    canvas.drawArc(Rect.fromCircle(center: c, radius: r), 1.57, 1.14, true, paint);
    // Green arc (bottom-right)
    paint.color = const Color(0xFF34A853);
    canvas.drawArc(Rect.fromCircle(center: c, radius: r), 0.44, 1.14, true, paint);

    // White inner circle
    paint.color = Colors.white;
    canvas.drawCircle(c, r * 0.65, paint);
    // White right cutout for the "G" bar
    canvas.drawRect(
        Rect.fromLTWH(c.dx, c.dy - r * 0.25, r * 1.1, r * 0.5), paint);
  }

  @override
  bool shouldRepaint(_) => false;
}

// ─── Feature Pill ─────────────────────────────────────────────────────────────

class _Pill extends StatelessWidget {
  final IconData icon;
  final String label;
  const _Pill({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) => Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 15, color: AppColors.primary),
          const SizedBox(width: 6),
          Text(label,
              style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 13,
                  fontWeight: FontWeight.w500)),
        ]),
      );
}
