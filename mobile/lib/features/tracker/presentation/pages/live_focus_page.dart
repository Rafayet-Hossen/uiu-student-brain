import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/responsive.dart';
import '../providers/tracker_provider.dart';

class LiveFocusPage extends ConsumerStatefulWidget {
  const LiveFocusPage({super.key});

  @override
  ConsumerState<LiveFocusPage> createState() => _LiveFocusPageState();
}

class _LiveFocusPageState extends ConsumerState<LiveFocusPage>
    with SingleTickerProviderStateMixin {
  Timer? _timer;
  int _secondsRemaining = 25 * 60; // 25 mins default
  int _initialSeconds = 25 * 60;
  bool _isRunning = false;

  late AnimationController _pulseController;
  late Animation<double> _pulseAnimation;

  final List<String> _quotes = [
    'Deep focus is the superpower of modern scholars.',
    'Every focused minute moves you closer to mastery.',
    'Eliminate distractions. Your future self will thank you.',
    'Consistency compounds into extraordinary academic breakthroughs.',
    'Small focused blocks of study conquer the hardest subjects.',
  ];
  int _quoteIndex = 0;

  @override
  void initState() {
    super.initState();
    final active = ref.read(trackerProvider).activeSession;
    if (active != null) {
      _secondsRemaining = active.totalMinutes * 60;
      _initialSeconds = _secondsRemaining;
    }

    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    )..repeat(reverse: true);

    _pulseAnimation = Tween<double>(begin: 0.96, end: 1.04).animate(
      CurvedAnimation(parent: _pulseController, curve: Curves.easeInOut),
    );

    _startTimer();
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pulseController.dispose();
    super.dispose();
  }

  void _startTimer() {
    _isRunning = true;
    _timer?.cancel();
    _timer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (_secondsRemaining > 0) {
        setState(() {
          _secondsRemaining--;
          if (_secondsRemaining % 90 == 0) {
            _quoteIndex = (_quoteIndex + 1) % _quotes.length;
          }
        });
      } else {
        _timer?.cancel();
        setState(() => _isRunning = false);
        _handleFinishSession();
      }
    });
  }

  void _togglePause() {
    setState(() {
      if (_isRunning) {
        _timer?.cancel();
        _isRunning = false;
      } else {
        _startTimer();
      }
    });
  }

  void _resetTimer() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.restart_alt_rounded, color: AppColors.primary),
            SizedBox(width: 8),
            Text('Reset Focus Timer?'),
          ],
        ),
        content: const Text(
          'This will reset your current timer countdown back to its starting duration.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () {
              Navigator.pop(ctx);
              _timer?.cancel();
              setState(() {
                _secondsRemaining = _initialSeconds;
                _isRunning = false;
              });
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Timer reset to starting duration'),
                  duration: Duration(seconds: 2),
                ),
              );
            },
            child: const Text('Reset'),
          ),
        ],
      ),
    );
  }

  void _extend(int minutes) {
    setState(() {
      _secondsRemaining += minutes * 60;
      _initialSeconds += minutes * 60;
    });
    ref.read(trackerProvider.notifier).extendActiveSession(minutes);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Added +$minutes minutes to session'),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  void _showCustomTimeDialog() {
    final textCtrl = TextEditingController(
      text: (_initialSeconds ~/ 60).toString(),
    );

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      builder: (ctx) {
        int selectedMinutes = (_secondsRemaining / 60).round();
        if (selectedMinutes <= 0) selectedMinutes = 25;
        textCtrl.text = selectedMinutes.toString();

        return StatefulBuilder(
          builder: (context, setModalState) {
            return Padding(
              padding: EdgeInsets.only(
                left: 24,
                right: 24,
                top: 24,
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 24,
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'Set Focus Duration',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded),
                        onPressed: () => Navigator.pop(ctx),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // Interactive Stepper Row
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      IconButton(
                        icon: const Icon(Icons.remove_circle_outline_rounded, size: 28),
                        color: AppColors.primary,
                        onPressed: selectedMinutes > 5
                            ? () {
                                setModalState(() {
                                  selectedMinutes -= 5;
                                  textCtrl.text = selectedMinutes.toString();
                                });
                              }
                            : null,
                      ),
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(16),
                        ),
                        child: Text(
                          '$selectedMinutes mins',
                          style: const TextStyle(
                            fontSize: 22,
                            fontWeight: FontWeight.w900,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      IconButton(
                        icon: const Icon(Icons.add_circle_outline_rounded, size: 28),
                        color: AppColors.primary,
                        onPressed: selectedMinutes < 360
                            ? () {
                                setModalState(() {
                                  selectedMinutes += 5;
                                  textCtrl.text = selectedMinutes.toString();
                                });
                              }
                            : null,
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),

                  const Text(
                    'Quick Presets:',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [15, 25, 45, 60, 90, 120].map((mins) {
                      final isSelected = selectedMinutes == mins;
                      return ChoiceChip(
                        label: Text('${mins}m'),
                        selected: isSelected,
                        onSelected: (val) {
                          if (val) {
                            setModalState(() {
                              selectedMinutes = mins;
                              textCtrl.text = mins.toString();
                            });
                          }
                        },
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 16),

                  const Text(
                    'Or Enter Minutes Directly:',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: textCtrl,
                    keyboardType: TextInputType.number,
                    onChanged: (val) {
                      final parsed = int.tryParse(val.trim());
                      if (parsed != null && parsed > 0 && parsed <= 720) {
                        setModalState(() {
                          selectedMinutes = parsed;
                        });
                      }
                    },
                    decoration: InputDecoration(
                      hintText: 'e.g. 50',
                      suffixText: 'minutes',
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 14,
                      ),
                    ),
                  ),
                  const SizedBox(height: 18),

                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.primary,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(14),
                      ),
                    ),
                    onPressed: () {
                      final parsed = int.tryParse(textCtrl.text.trim()) ?? selectedMinutes;
                      if (parsed > 0 && parsed <= 720) {
                        Navigator.pop(ctx);
                        _applyCustomDuration(parsed);
                      }
                    },
                    child: const Text('Apply Focus Time', style: TextStyle(fontWeight: FontWeight.w800, fontSize: 15)),
                  ),
                ],
              ),
            );
          },
        );
      },
    );
  }

  void _applyCustomDuration(int minutes) {
    _timer?.cancel();
    setState(() {
      _secondsRemaining = minutes * 60;
      _initialSeconds = minutes * 60;
      _isRunning = false;
    });
    _startTimer();
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('Focus timer set to $minutes minutes'),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  Future<void> _handleFinishSession() async {
    _timer?.cancel();
    final active = ref.read(trackerProvider).activeSession;
    final sessionId = active?.id;

    final success = await ref.read(trackerProvider.notifier).completeActiveSession();
    if (success && mounted) {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
          title: const Row(
            children: [
              Icon(Icons.celebration_rounded, color: AppColors.primary, size: 24),
              SizedBox(width: 8),
              Expanded(child: Text('Focus Session Completed!')),
            ],
          ),
          content: const Text(
            'Incredible focus! Would you like to verify concept mastery with an instant AI Diagnostic Assessment?',
          ),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.pop(ctx);
                context.pop();
              },
              child: const Text('Later'),
            ),
            AppButton(
              label: 'Launch AI Quiz',
              height: 40,
              onPressed: () {
                Navigator.pop(ctx);
                if (sessionId != null) {
                  context.pushReplacement('/ai/quiz/$sessionId');
                } else {
                  context.pop();
                }
              },
            ),
          ],
        ),
      );
    } else if (mounted) {
      context.pop();
    }
  }

  String _formatTime() {
    final m = (_secondsRemaining ~/ 60).toString().padLeft(2, '0');
    final s = (_secondsRemaining % 60).toString().padLeft(2, '0');
    return '$m:$s';
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final progress = _initialSeconds > 0
        ? (1.0 - (_secondsRemaining / _initialSeconds)).clamp(0.0, 1.0)
        : 0.0;
    final active = ref.watch(trackerProvider).activeSession;

    return Scaffold(
      backgroundColor: isDark ? AppColors.bgDark : AppColors.bgLight,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: const Text('Live Focus Mode'),
        actions: [
          IconButton(
            icon: const Icon(Icons.more_time_rounded),
            tooltip: 'Custom Duration',
            onPressed: _showCustomTimeDialog,
          ),
          IconButton(
            icon: const Icon(Icons.close_rounded),
            tooltip: 'Exit',
            onPressed: () => context.pop(),
          ),
        ],
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: Responsive.padding(context),
          child: Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 480),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  const SizedBox(height: 8),

                  // Subject / Activity Chip
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.12),
                      borderRadius: BorderRadius.circular(9999),
                      border: Border.all(
                        color: AppColors.primary.withValues(alpha: 0.3),
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.local_library_rounded, size: 14, color: AppColors.primary),
                        const SizedBox(width: 6),
                        Flexible(
                          child: Text(
                            active?.subject ?? 'Deep Academic Focus',
                            style: const TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: AppColors.primary,
                            ),
                            overflow: TextOverflow.ellipsis,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 28),

                  // Interactive Circular Percent Countdown Ring
                  GestureDetector(
                    onTap: _showCustomTimeDialog,
                    child: AnimatedBuilder(
                      animation: _pulseAnimation,
                      builder: (context, child) {
                        return Transform.scale(
                          scale: _isRunning ? _pulseAnimation.value : 1.0,
                          child: child,
                        );
                      },
                      child: CircularPercentIndicator(
                        radius: 125.0,
                        lineWidth: 16.0,
                        animation: false,
                        percent: progress,
                        center: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              _formatTime(),
                              style: const TextStyle(
                                fontSize: 46,
                                fontWeight: FontWeight.w900,
                                letterSpacing: -1.2,
                              ),
                            ),
                            const SizedBox(height: 4),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                              decoration: BoxDecoration(
                                color: (_isRunning ? AppColors.primary : AppColors.warning)
                                    .withValues(alpha: 0.15),
                                borderRadius: BorderRadius.circular(9999),
                              ),
                              child: Text(
                                _isRunning ? 'FOCUSING' : 'PAUSED',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                  letterSpacing: 1.5,
                                  color: _isRunning ? AppColors.primary : AppColors.warning,
                                ),
                              ),
                            ),
                            const SizedBox(height: 6),
                            Text(
                              'Tap to adjust time',
                              style: TextStyle(
                                fontSize: 10,
                                color: isDark ? AppColors.textDarkSubtle : AppColors.textLightSubtle,
                              ),
                            ),
                          ],
                        ),
                        circularStrokeCap: CircularStrokeCap.round,
                        progressColor: AppColors.primary,
                        backgroundColor: isDark
                            ? AppColors.surfaceDarkSubtle
                            : AppColors.surfaceLightSubtle,
                      ),
                    ),
                  ),
                  const SizedBox(height: 28),

                  // Motivational Quote Card
                  GlassCard(
                    padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 12),
                    child: Text(
                      '"${_quotes[_quoteIndex]}"',
                      style: TextStyle(
                        fontSize: 13,
                        fontStyle: FontStyle.italic,
                        color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                  const SizedBox(height: 28),

                  // Main Controls Bar: Reset | Play/Pause | Custom Duration
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      // Reset Timer Button
                      Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isDark ? AppColors.borderDark : AppColors.borderLight,
                            width: 1.2,
                          ),
                        ),
                        child: IconButton(
                          iconSize: 26,
                          tooltip: 'Reset Timer',
                          icon: const Icon(Icons.restart_alt_rounded),
                          onPressed: _resetTimer,
                        ),
                      ),
                      const SizedBox(width: 24),

                      // Central Play / Pause Button
                      Container(
                        decoration: BoxDecoration(
                          gradient: const LinearGradient(
                            colors: [AppColors.primary, AppColors.flame],
                            begin: Alignment.topLeft,
                            end: Alignment.bottomRight,
                          ),
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: AppColors.primary.withValues(alpha: 0.4),
                              blurRadius: 20,
                              offset: const Offset(0, 6),
                            ),
                          ],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            customBorder: const CircleBorder(),
                            onTap: _togglePause,
                            child: Padding(
                              padding: const EdgeInsets.all(22.0),
                              child: Icon(
                                _isRunning ? Icons.pause_rounded : Icons.play_arrow_rounded,
                                size: 44,
                                color: Colors.white,
                              ),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 24),

                      // Set Custom Duration Button
                      Container(
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isDark ? AppColors.borderDark : AppColors.borderLight,
                            width: 1.2,
                          ),
                        ),
                        child: IconButton(
                          iconSize: 26,
                          tooltip: 'Set Time',
                          icon: const Icon(Icons.tune_rounded),
                          onPressed: _showCustomTimeDialog,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 24),

                  // Quick Extension Buttons (2 per row)
                  const Text(
                    'Quick Extend Session:',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: _buildQuickExtendCard(
                          icon: Icons.add_rounded,
                          label: '+10 mins',
                          subtitle: 'Short Boost',
                          color: AppColors.primary,
                          isDark: isDark,
                          onTap: () => _extend(10),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildQuickExtendCard(
                          icon: Icons.add_rounded,
                          label: '+15 mins',
                          subtitle: 'Standard',
                          color: AppColors.secondary,
                          isDark: isDark,
                          onTap: () => _extend(15),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: _buildQuickExtendCard(
                          icon: Icons.add_rounded,
                          label: '+30 mins',
                          subtitle: 'Deep Sprint',
                          color: AppColors.flame,
                          isDark: isDark,
                          onTap: () => _extend(30),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _buildQuickExtendCard(
                          icon: Icons.tune_rounded,
                          label: 'Custom',
                          subtitle: 'Set Any Time',
                          color: AppColors.accent,
                          isDark: isDark,
                          onTap: _showCustomTimeDialog,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),

                  // Finish Session Now Button
                  AppButton(
                    label: 'Complete Session & Log Hours',
                    variant: AppButtonVariant.outline,
                    height: 46,
                    icon: const Icon(Icons.check_circle_outline_rounded, size: 18),
                    onPressed: _handleFinishSession,
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQuickExtendCard({
    required IconData icon,
    required String label,
    required String subtitle,
    required Color color,
    required bool isDark,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(14),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark ? AppColors.borderDark : AppColors.borderLight,
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.03),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, size: 16, color: color),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      label,
                      style: const TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w800,
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text(
                      subtitle,
                      style: TextStyle(
                        fontSize: 10.5,
                        color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
