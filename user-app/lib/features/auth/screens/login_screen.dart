import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:paper_prints_user/core/network/connectivity_checker.dart';
import 'package:paper_prints_user/core/theme/app_theme.dart';
import 'package:paper_prints_user/features/auth/providers/auth_provider.dart';
import 'package:paper_prints_user/shared/widgets/paper_prints_loader.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  String? _dnsIssue; // null = ok, 'no_internet', 'dns_blocked'

  @override
  void initState() {
    super.initState();
    _checkConnectivity();
  }

  Future<void> _checkConnectivity() async {
    final issue = await ConnectivityChecker.diagnose();
    if (mounted) {
      setState(() {
        _dnsIssue = issue;
      });
    }
  }

  void _showDnsHelpDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: AppColors.bg,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        contentPadding: const EdgeInsets.all(24),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withValues(alpha: 0.12),
                      shape: BoxShape.circle,
                    ),
                    child: const Icon(Icons.dns_rounded,
                        color: AppColors.warning, size: 26),
                  ),
                  const SizedBox(width: 12),
                  const Expanded(
                    child: Text('Network Issue Detected',
                        style: TextStyle(
                            fontWeight: FontWeight.w800,
                            fontSize: 18,
                            color: AppColors.textPrimary)),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Text(
                'Your mobile network (e.g. Jio) may be blocking our server address. '
                'This is a known issue with some carriers.\n\n'
                'To fix this, change your Private DNS setting:',
                style: TextStyle(
                    color: AppColors.textSecondary, fontSize: 14, height: 1.6),
              ),
              const SizedBox(height: 16),

              // Steps
              _stepTile('1', 'Open your phone Settings'),
              _stepTile('2', 'Go to Wi-Fi & Network → Private DNS'),
              _stepTile('3', 'Select "Private DNS provider hostname"'),
              _stepTile('4', 'Enter:  dns.google', highlight: true),
              _stepTile('5', 'Tap Save and reopen the app'),

              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.info.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                      color: AppColors.info.withValues(alpha: 0.2)),
                ),
                child: const Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Icon(Icons.info_outline, color: AppColors.info, size: 18),
                    SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        'Alternatively, connect to Wi-Fi — this issue only happens on certain mobile data networks.',
                        style: TextStyle(
                            color: AppColors.info, fontSize: 12, height: 1.5),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Actions
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(ctx).pop();
                    _checkConnectivity();
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14)),
                    padding: const EdgeInsets.symmetric(vertical: 14),
                  ),
                  child: const Text('I\'ve changed it — Retry',
                      style:
                          TextStyle(fontWeight: FontWeight.w700, fontSize: 15)),
                ),
              ),
              const SizedBox(height: 8),
              SizedBox(
                width: double.infinity,
                child: TextButton(
                  onPressed: () => Navigator.of(ctx).pop(),
                  child: const Text('Dismiss',
                      style: TextStyle(color: AppColors.textTertiary)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _stepTile(String num, String text, {bool highlight = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 24,
            height: 24,
            decoration: BoxDecoration(
              color: highlight ? AppColors.primary : AppColors.surfaceAlt,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(num,
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: highlight ? Colors.white : AppColors.textSecondary)),
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Text(text,
                style: TextStyle(
                    fontSize: 13,
                    height: 1.4,
                    fontWeight: highlight ? FontWeight.w700 : FontWeight.w500,
                    color: highlight
                        ? AppColors.primary
                        : AppColors.textPrimary)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 28),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Spacer(flex: 2),

              // ── Brand Logo ───────────────────────────────────────────
              Center(
                child: Image.asset(
                  'assets/logos/login_screen.png',
                  width: MediaQuery.of(context).size.width * 0.75,
                  fit: BoxFit.contain,
                ),
              ),

              const Spacer(flex: 2),

              // ── Feature pills ────────────────────────────────────────
              Wrap(
                alignment: WrapAlignment.center,
                spacing: 8,
                runSpacing: 8,
                children: const [
                  _FeaturePill(
                      icon: Icons.upload_file_outlined, label: 'Upload PDF'),
                  _FeaturePill(
                      icon: Icons.storefront_outlined, label: 'Find shops'),
                  _FeaturePill(
                      icon: Icons.qr_code_rounded, label: 'QR Pickup'),
                ],
              ),

              const Spacer(flex: 3),

              // ── DNS Warning Banner ────────────────────────────────────
              if (_dnsIssue == 'dns_blocked')
                GestureDetector(
                  onTap: _showDnsHelpDialog,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 14),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: AppColors.warning.withValues(alpha: 0.08),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                          color: AppColors.warning.withValues(alpha: 0.3)),
                    ),
                    child: Row(children: [
                      const Icon(Icons.wifi_off_rounded,
                          color: AppColors.warning, size: 20),
                      const SizedBox(width: 8),
                      const Expanded(
                        child: Text(
                          'Your network is blocking our server. Tap here to fix.',
                          style: TextStyle(
                              color: Color(0xFF92400E),
                              fontSize: 13,
                              fontWeight: FontWeight.w500),
                        ),
                      ),
                      const Icon(Icons.chevron_right_rounded,
                          color: AppColors.warning, size: 20),
                    ]),
                  ),
                ),

              // ── Error ────────────────────────────────────────────────
              if (auth.error != null)
                Container(
                  margin: const EdgeInsets.only(bottom: 14),
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                        color: AppColors.error.withValues(alpha: 0.25)),
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

              // ── Sign in Button ───────────────────────────────────────
              _GoogleSignInButton(
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
                    height: 1.5),
              ),
              const SizedBox(height: 28),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── Google Button ─────────────────────────────────────────────────────────────

class _GoogleSignInButton extends StatelessWidget {
  final bool loading;
  final VoidCallback onTap;
  const _GoogleSignInButton({required this.loading, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: loading ? null : onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 150),
          height: 54,
          decoration: BoxDecoration(
            color: loading ? AppColors.surface : Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppColors.border),
            boxShadow: loading
                ? []
                : [
                    BoxShadow(
                      color: Colors.black.withValues(alpha: 0.08),
                      blurRadius: 16,
                      offset: const Offset(0, 4),
                    ),
                  ],
          ),
          child: loading
              ? Center(
                  child: SizedBox(
                    width: 22,
                    height: 22,
                    child: PaperPrintsLoaderSmall(size: 22),
                  ),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
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

class _GoogleLogo extends StatelessWidget {
  @override
  Widget build(BuildContext context) => SizedBox(
        width: 22,
        height: 22,
        child: CustomPaint(painter: _GLogoPainter()),
      );
}

class _GLogoPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()..style = PaintingStyle.fill;
    final c = Offset(size.width / 2, size.height / 2);
    final r = size.width / 2;
    paint.color = const Color(0xFF4285F4);
    canvas.drawArc(
        Rect.fromCircle(center: c, radius: r), -1.57, 3.14, true, paint);
    paint.color = const Color(0xFFEA4335);
    canvas.drawArc(
        Rect.fromCircle(center: c, radius: r), -2.70, 1.14, true, paint);
    paint.color = const Color(0xFFFBBC05);
    canvas.drawArc(
        Rect.fromCircle(center: c, radius: r), 1.57, 1.14, true, paint);
    paint.color = const Color(0xFF34A853);
    canvas.drawArc(
        Rect.fromCircle(center: c, radius: r), 0.44, 1.14, true, paint);
    paint.color = Colors.white;
    canvas.drawCircle(c, r * 0.65, paint);
    canvas.drawRect(
        Rect.fromLTWH(c.dx, c.dy - r * 0.25, r * 1.1, r * 0.5), paint);
  }

  @override
  bool shouldRepaint(_) => false;
}

// ─── Feature Pill ──────────────────────────────────────────────────────────────

class _FeaturePill extends StatelessWidget {
  final IconData icon;
  final String label;
  const _FeaturePill({required this.icon, required this.label});

  @override
  Widget build(BuildContext context) => Container(
        padding:
            const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
        decoration: BoxDecoration(
          color: AppColors.surface,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: AppColors.border),
        ),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(icon, size: 14, color: AppColors.primary),
          const SizedBox(width: 5),
          Text(label,
              style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 12,
                  fontWeight: FontWeight.w500)),
        ]),
      );
}
