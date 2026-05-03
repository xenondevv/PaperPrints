import 'dart:math';
import 'package:flutter/material.dart';
import 'package:paper_prints_user/core/theme/app_theme.dart';

/// A beautiful branded loading indicator for Paper Prints.
///
/// Shows the Paper Prints logo with a pulsing scale + fade animation,
/// surrounded by an orbiting arc spinner. Optionally displays a
/// status message below.
class PaperPrintsLoader extends StatefulWidget {
  /// Optional message displayed below the loader (e.g. "Uploading…")
  final String? message;

  /// Overall size of the loader widget
  final double size;

  /// Whether to show in a full-screen centered layout
  final bool fullScreen;

  const PaperPrintsLoader({
    super.key,
    this.message,
    this.size = 80,
    this.fullScreen = true,
  });

  @override
  State<PaperPrintsLoader> createState() => _PaperPrintsLoaderState();
}

class _PaperPrintsLoaderState extends State<PaperPrintsLoader>
    with TickerProviderStateMixin {
  late final AnimationController _pulseController;
  late final AnimationController _spinController;
  late final AnimationController _dotController;
  late final Animation<double> _pulseAnim;
  late final Animation<double> _fadeAnim;

  @override
  void initState() {
    super.initState();

    // Pulse: gentle scale up/down on the logo
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);

    _pulseAnim = Tween<double>(begin: 0.88, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _fadeAnim = Tween<double>(begin: 0.5, end: 1.0).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    // Spin: orbiting arc around the logo
    _spinController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1200),
    )..repeat();

    // Dot animation for message text
    _dotController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat();
  }

  @override
  void dispose() {
    _pulseController.dispose();
    _spinController.dispose();
    _dotController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final loader = Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        SizedBox(
          width: widget.size + 24,
          height: widget.size + 24,
          child: Stack(
            alignment: Alignment.center,
            children: [
              // Orbiting arc spinner
              AnimatedBuilder(
                animation: _spinController,
                builder: (_, __) => CustomPaint(
                  size: Size(widget.size + 20, widget.size + 20),
                  painter: _ArcPainter(
                    progress: _spinController.value,
                    color: AppColors.primary,
                  ),
                ),
              ),
              // Pulsing logo
              AnimatedBuilder(
                animation: _pulseAnim,
                builder: (_, child) => Opacity(
                  opacity: _fadeAnim.value,
                  child: Transform.scale(
                    scale: _pulseAnim.value,
                    child: child,
                  ),
                ),
                child: ClipRRect(
                  borderRadius: BorderRadius.circular(widget.size * 0.25),
                  child: Image.asset(
                    'assets/logos/favicon.png',
                    width: widget.size * 0.55,
                    height: widget.size * 0.55,
                    fit: BoxFit.contain,
                  ),
                ),
              ),
            ],
          ),
        ),
        if (widget.message != null) ...[
          const SizedBox(height: 20),
          AnimatedBuilder(
            animation: _dotController,
            builder: (_, __) {
              final dots = '.' * ((_dotController.value * 3).floor() + 1);
              return Text(
                '${widget.message}$dots',
                style: const TextStyle(
                  color: AppColors.textSecondary,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 0.2,
                ),
              );
            },
          ),
        ],
      ],
    );

    if (widget.fullScreen) {
      return Center(child: loader);
    }
    return loader;
  }
}

/// Draws a smooth orbiting arc around the logo.
class _ArcPainter extends CustomPainter {
  final double progress;
  final Color color;

  _ArcPainter({required this.progress, required this.color});

  @override
  void paint(Canvas canvas, Size size) {
    final rect = Offset.zero & size;
    final startAngle = 2 * pi * progress;

    // Primary arc
    final paint = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(rect.deflate(2), startAngle, pi * 0.75, false, paint);

    // Secondary (lighter) arc on the opposite side
    final paint2 = Paint()
      ..color = color.withValues(alpha: 0.25)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 3.0
      ..strokeCap = StrokeCap.round;
    canvas.drawArc(rect.deflate(2), startAngle + pi, pi * 0.5, false, paint2);
  }

  @override
  bool shouldRepaint(_ArcPainter old) => old.progress != progress;
}

/// A small inline loader (no full-screen centering) for buttons, cards, etc.
class PaperPrintsLoaderSmall extends StatefulWidget {
  final double size;
  const PaperPrintsLoaderSmall({super.key, this.size = 24});

  @override
  State<PaperPrintsLoaderSmall> createState() => _PaperPrintsLoaderSmallState();
}

class _PaperPrintsLoaderSmallState extends State<PaperPrintsLoaderSmall>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1000),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (_, __) => CustomPaint(
        size: Size(widget.size, widget.size),
        painter: _ArcPainter(
          progress: _controller.value,
          color: AppColors.primary,
        ),
      ),
    );
  }
}
