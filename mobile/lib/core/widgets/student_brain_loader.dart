import 'dart:math' as math;
import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class StudentBrainLoader extends StatefulWidget {
  final String? message;
  final double size;
  final bool isFullScreen;

  const StudentBrainLoader({
    super.key,
    this.message,
    this.size = 64.0,
    this.isFullScreen = false,
  });

  const StudentBrainLoader.fullScreen({
    super.key,
    this.message = 'Syncing StudentBrain portal...',
    this.size = 72.0,
  }) : isFullScreen = true;

  @override
  State<StudentBrainLoader> createState() => _StudentBrainLoaderState();
}

class _StudentBrainLoaderState extends State<StudentBrainLoader>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _pulseAnimation;
  late Animation<double> _rotateAnimation;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1800),
    )..repeat();

    _pulseAnimation = Tween<double>(begin: 0.92, end: 1.08).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.easeInOutSine,
      ),
    );

    _rotateAnimation = Tween<double>(begin: 0.0, end: 2 * math.pi).animate(
      CurvedAnimation(
        parent: _controller,
        curve: Curves.linear,
      ),
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    Widget content = Column(
      mainAxisSize: MainAxisSize.min,
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        AnimatedBuilder(
          animation: _controller,
          builder: (context, child) {
            return Stack(
              alignment: Alignment.center,
              children: [
                // Outer Radiating Glow Ring 1
                Transform.scale(
                  scale: 1.0 + (_controller.value * 0.35),
                  child: Container(
                    width: widget.size + 24,
                    height: widget.size + 24,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.primary.withValues(
                          alpha: (1.0 - _controller.value) * 0.45,
                        ),
                        width: 2.0,
                      ),
                    ),
                  ),
                ),

                // Outer Radiating Glow Ring 2 (Amber)
                Transform.scale(
                  scale: 1.0 + (((_controller.value + 0.5) % 1.0) * 0.3),
                  child: Container(
                    width: widget.size + 14,
                    height: widget.size + 14,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: AppColors.accent.withValues(
                          alpha: (1.0 - ((_controller.value + 0.5) % 1.0)) * 0.35,
                        ),
                        width: 1.5,
                      ),
                    ),
                  ),
                ),

                // Rotating Accent Dash Arc
                Transform.rotate(
                  angle: _rotateAnimation.value,
                  child: SizedBox(
                    width: widget.size + 8,
                    height: widget.size + 8,
                    child: CircularProgressIndicator(
                      value: 0.28,
                      strokeWidth: 2.5,
                      strokeCap: StrokeCap.round,
                      valueColor: const AlwaysStoppedAnimation<Color>(
                        AppColors.primary,
                      ),
                      backgroundColor: Colors.transparent,
                    ),
                  ),
                ),

                // Central Pulsing Branded Logo Crest
                Transform.scale(
                  scale: _pulseAnimation.value,
                  child: Container(
                    width: widget.size,
                    height: widget.size,
                    decoration: BoxDecoration(
                      borderRadius: BorderRadius.circular(widget.size * 0.28),
                      boxShadow: [
                        BoxShadow(
                          color: AppColors.primary.withValues(alpha: 0.35),
                          blurRadius: 18,
                          spreadRadius: 1,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: BorderRadius.circular(widget.size * 0.28),
                      child: Image.asset(
                        'assets/images/logo.jpg',
                        width: widget.size,
                        height: widget.size,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Container(
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(widget.size * 0.28),
                          ),
                          child: Icon(
                            Icons.school_rounded,
                            size: widget.size * 0.55,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            );
          },
        ),
        if (widget.message != null) ...[
          const SizedBox(height: 18),
          Text(
            widget.message!,
            style: TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w600,
              letterSpacing: -0.2,
              color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );

    if (widget.isFullScreen) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: content,
        ),
      );
    }

    return Center(child: content);
  }
}
