import 'dart:convert';
import 'dart:io';
import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/config/providers.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/responsive.dart';
import '../../../../core/widgets/user_avatar.dart';
import '../../../auth/presentation/providers/auth_provider.dart';
import '../../../grades/presentation/providers/grades_provider.dart';
import '../../../materials/presentation/providers/materials_provider.dart';
import '../../../tracker/presentation/providers/tracker_provider.dart';

class ProfilePage extends ConsumerStatefulWidget {
  const ProfilePage({super.key});

  @override
  ConsumerState<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends ConsumerState<ProfilePage> {
  Set<String> _unlockedMilestones = {};

  @override
  void initState() {
    super.initState();
    _loadAndSyncMilestones();
  }

  void _loadAndSyncMilestones() {
    final prefs = ref.read(sharedPreferencesProvider);
    final saved = prefs.getStringList('user_unlocked_milestones_v1') ?? [];
    setState(() {
      _unlockedMilestones = saved.toSet();
    });
  }

  void _syncMilestonesWithActivity({
    required int streak,
    required double totalHours,
    required double gpa,
    required int sessionCount,
    required int materialCount,
    required bool hasQuiz,
  }) {
    final prefs = ref.read(sharedPreferencesProvider);
    final updated = Set<String>.from(_unlockedMilestones);

    // Dynamic unlocking logic
    updated.add('first_step'); // Logged into StudentBrain
    if (streak >= 3) updated.add('ignition_flame');
    if (streak >= 7) updated.add('unstoppable');
    if (streak >= 14 || gpa >= 3.80) updated.add('academic_master');
    if (totalHours >= 5.0) updated.add('deep_scholar');
    if (totalHours >= 20.0 || sessionCount >= 20) updated.add('centurion');
    if (hasQuiz) updated.add('quiz_ace');
    if (materialCount >= 1) updated.add('knowledge_vault');

    if (updated.length != _unlockedMilestones.length) {
      prefs.setStringList('user_unlocked_milestones_v1', updated.toList());
      setState(() {
        _unlockedMilestones = updated;
      });
    }
  }

  void _showMilestoneDetail(Map<String, dynamic> b) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isUnlocked = b['unlocked'] as bool;
    final color = b['color'] as Color;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: (isUnlocked ? color : Colors.grey).withValues(alpha: 0.15),
                shape: BoxShape.circle,
              ),
              child: Icon(b['icon'] as IconData, color: isUnlocked ? color : Colors.grey, size: 28),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(b['name'] as String, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
                  Text(
                    isUnlocked ? 'Unlocked Milestone' : 'Locked Milestone',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w700,
                      color: isUnlocked ? AppColors.success : Colors.grey,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(b['desc'] as String, style: const TextStyle(fontSize: 13, height: 1.4)),
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.04),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: isDark ? AppColors.borderDark : AppColors.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Unlock Criteria:', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: Colors.grey)),
                  const SizedBox(height: 4),
                  Text(b['requirement'] as String, style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w600)),
                ],
              ),
            ),
          ],
        ),
        actions: [
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx),
            style: ElevatedButton.styleFrom(
              backgroundColor: isUnlocked ? color : AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  void _exportJsonBackup({
    required dynamic user,
    required TrackerState tracker,
    required GradesState grades,
    required MaterialsState materials,
    required String gpa,
    required String totalHours,
    required int streak,
  }) {
    final exportData = {
      'app': 'StudentBrain',
      'version': '2.4.5',
      'exported_at': DateTime.now().toIso8601String(),
      'user': {
        'name': user?.fullName,
        'email': user?.email,
        'department': user?.department,
      },
      'stats': {
        'current_cgpa': gpa,
        'total_focus_hours': totalHours,
        'active_streak_days': streak,
        'sessions_count': tracker.sessions.length,
        'materials_count': materials.materials.length,
      },
      'unlocked_milestones': _unlockedMilestones.toList(),
      'sessions': tracker.sessions.map((s) => s.toJson()).toList(),
      'grades_plan': grades.plan != null
          ? {
              'current_gpa': grades.plan!.currentGpa,
              'target_gpa': grades.plan!.targetGpa,
              'completed_credits': grades.plan!.completedCredits,
              'remaining_credits': grades.plan!.remainingCredits,
            }
          : null,
      'grades_courses': grades.courses
          .map((c) => {
                'id': c.id,
                'course_name': c.courseName,
                'credits': c.credits,
                'grade_letter': c.gradeLetter,
                'grade_point': c.gradePoint,
                'semester': c.semester,
              })
          .toList(),
      'materials': materials.materials
          .map((m) => {
                'id': m.id,
                'title': m.title,
                'category': m.category,
                'course_id': m.courseId,
                'course_code': m.courseCode,
                'file_url': m.fileUrl,
                'summary': m.summary,
              })
          .toList(),
    };

    final jsonStr = const JsonEncoder.withIndent('  ').convert(exportData);

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: const Row(
          children: [
            Icon(Icons.cloud_download_rounded, color: AppColors.primary, size: 24),
            SizedBox(width: 8),
            Text('Export Scholar Backup', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
          ],
        ),
        content: SizedBox(
          width: 500,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const Text(
                'This JSON contains all your study sessions, milestone badges, grade targets, and local study notes. Copy or save it so you can restore your data anytime!',
                style: TextStyle(fontSize: 12, height: 1.4),
              ),
              const SizedBox(height: 12),
              // Summary badges
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _backupStatBadge('${tracker.sessions.length}', 'Sessions'),
                  _backupStatBadge('${materials.materials.length}', 'Materials'),
                  _backupStatBadge('${grades.courses.length}', 'Courses'),
                  _backupStatBadge('${_unlockedMilestones.length}', 'Badges'),
                ],
              ),
              const SizedBox(height: 12),
              // JSON Preview
              Container(
                height: 150,
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.06),
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: Colors.grey.withValues(alpha: 0.3)),
                ),
                child: SingleChildScrollView(
                  child: Text(
                    jsonStr,
                    style: const TextStyle(fontFamily: 'monospace', fontSize: 10.5),
                  ),
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Close'),
          ),
          ElevatedButton.icon(
            onPressed: () {
              Clipboard.setData(ClipboardData(text: jsonStr));
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('JSON Backup successfully copied to clipboard!'),
                  backgroundColor: AppColors.success,
                  duration: Duration(seconds: 3),
                ),
              );
            },
            icon: const Icon(Icons.copy_rounded, size: 16),
            label: const Text('Copy JSON Backup'),
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
            ),
          ),
        ],
      ),
    );
  }

  Widget _backupStatBadge(String count, String label) {
    return Column(
      children: [
        Text(count, style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppColors.primary)),
        Text(label, style: const TextStyle(fontSize: 10, color: Colors.grey)),
      ],
    );
  }

  void _showImportJsonDialog() {
    final textCtrl = TextEditingController();
    bool isProcessing = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
          title: const Row(
            children: [
              Icon(Icons.cloud_upload_rounded, color: AppColors.accent, size: 24),
              SizedBox(width: 8),
              Text('Import Scholar Backup', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
            ],
          ),
          content: SizedBox(
            width: 500,
            child: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  const Text(
                    'Restore your study history, materials, grades, and milestone badges from a previous StudentBrain JSON backup.',
                    style: TextStyle(fontSize: 12, height: 1.4),
                  ),
                  const SizedBox(height: 14),

                  // Option 1: File Picker
                  OutlinedButton.icon(
                    onPressed: isProcessing
                        ? null
                        : () async {
                            try {
                              final result = await FilePicker.platform.pickFiles(
                                type: FileType.custom,
                                allowedExtensions: ['json'],
                              );
                              if (result != null && result.files.single.path != null) {
                                final file = File(result.files.single.path!);
                                final content = await file.readAsString();
                                textCtrl.text = content;
                                setDialogState(() {});
                              }
                            } catch (e) {
                              if (context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(
                                  SnackBar(content: Text('Could not open file: $e')),
                                );
                              }
                            }
                          },
                    icon: const Icon(Icons.file_open_rounded, size: 18),
                    label: const Text('Pick JSON Backup File'),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                    ),
                  ),
                  const SizedBox(height: 12),

                  const Row(
                    children: [
                      Expanded(child: Divider()),
                      Padding(
                        padding: EdgeInsets.symmetric(horizontal: 8.0),
                        child: Text('OR PASTE JSON', style: TextStyle(fontSize: 10, color: Colors.grey, fontWeight: FontWeight.w700)),
                      ),
                      Expanded(child: Divider()),
                    ],
                  ),
                  const SizedBox(height: 8),

                  TextField(
                    controller: textCtrl,
                    maxLines: 6,
                    decoration: InputDecoration(
                      hintText: 'Paste your backup JSON code here...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      contentPadding: const EdgeInsets.all(10),
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.paste_rounded, size: 18),
                        onPressed: () async {
                          final data = await Clipboard.getData('text/plain');
                          if (data?.text != null) {
                            textCtrl.text = data!.text!;
                            setDialogState(() {});
                          }
                        },
                      ),
                    ),
                    style: const TextStyle(fontFamily: 'monospace', fontSize: 11),
                  ),
                ],
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: isProcessing ? null : () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton.icon(
              onPressed: isProcessing
                  ? null
                  : () async {
                      final input = textCtrl.text.trim();
                      if (input.isEmpty) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Please select or paste backup JSON first.')),
                        );
                        return;
                      }

                      setDialogState(() => isProcessing = true);
                      try {
                        final data = jsonDecode(input);
                        if (data is! Map<String, dynamic>) {
                          throw const FormatException('Invalid JSON root format.');
                        }

                        final prefs = ref.read(sharedPreferencesProvider);

                        // 1. Restore Milestones
                        if (data['unlocked_milestones'] is List) {
                          final List<String> list = (data['unlocked_milestones'] as List).map((e) => e.toString()).toList();
                          await prefs.setStringList('user_unlocked_milestones_v1', list);
                          setState(() {
                            _unlockedMilestones = list.toSet();
                          });
                        }

                        // 2. Restore Materials to local cache
                        if (data['materials'] is List) {
                          await prefs.setString('offline_materials_v1', jsonEncode(data['materials']));
                          ref.invalidate(materialsProvider);
                        }

                        // 3. Restore Sessions & Grades
                        if (data['sessions'] is List) {
                          await prefs.setString('local_study_sessions_v1', jsonEncode(data['sessions']));
                          ref.invalidate(trackerProvider);
                        }
                        if (data['grades_courses'] is List) {
                          await prefs.setString('local_grades_courses_v1', jsonEncode(data['grades_courses']));
                          ref.invalidate(gradesProvider);
                        }

                        if (context.mounted) {
                          Navigator.pop(ctx);
                          showDialog(
                            context: context,
                            builder: (sCtx) => AlertDialog(
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                              title: const Row(
                                children: [
                                  Icon(Icons.check_circle_rounded, color: AppColors.success, size: 26),
                                  SizedBox(width: 10),
                                  Text('Backup Restored!'),
                                ],
                              ),
                              content: Text(
                                'Data successfully restored from backup (App: ${data['app'] ?? 'StudentBrain'}).\n\n'
                                '• Milestones: ${_unlockedMilestones.length} unlocked\n'
                                '• Sessions: ${(data['sessions'] as List?)?.length ?? 0} loaded\n'
                                '• Materials: ${(data['materials'] as List?)?.length ?? 0} synchronized\n'
                                '• Courses: ${(data['grades_courses'] as List?)?.length ?? 0} restored',
                                style: const TextStyle(fontSize: 13, height: 1.4),
                              ),
                              actions: [
                                ElevatedButton(
                                  onPressed: () => Navigator.pop(sCtx),
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: AppColors.success,
                                    foregroundColor: Colors.white,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                                  ),
                                  child: const Text('Awesome'),
                                ),
                              ],
                            ),
                          );
                        }
                      } catch (e) {
                        setDialogState(() => isProcessing = false);
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Failed to parse backup JSON: $e'),
                              backgroundColor: AppColors.error,
                            ),
                          );
                        }
                      }
                    },
              icon: isProcessing
                  ? const SizedBox(width: 14, height: 14, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Icon(Icons.restore_page_rounded, size: 18),
              label: Text(isProcessing ? 'Restoring...' : 'Restore Data'),
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.accent,
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    final tracker = ref.watch(trackerProvider);
    final grades = ref.watch(gradesProvider);
    final materials = ref.watch(materialsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final streak = tracker.streaks['current_streak'] ?? 0;
    final totalHoursNum = (tracker.streaks['total_minutes'] ?? 0) / 60.0;
    final totalHours = totalHoursNum.toStringAsFixed(1);
    final gpa = grades.plan?.currentGpa.toStringAsFixed(2) ?? '3.80';
    final gpaNum = double.tryParse(gpa) ?? 3.80;
    final hasQuiz = tracker.sessions.any((s) => s.quizScore != null && s.quizScore! > 0);

    // Sync unlocked milestones dynamically with user activity
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _syncMilestonesWithActivity(
        streak: streak,
        totalHours: totalHoursNum,
        gpa: gpaNum,
        sessionCount: tracker.sessions.length,
        materialCount: materials.materials.length,
        hasQuiz: hasQuiz,
      );
    });

    // Scholar Tier calculation
    String scholarTier = 'Rising Scholar';
    IconData tierIcon = Icons.school_rounded;
    Color tierColor = AppColors.primary;
    if (gpaNum >= 3.85 && streak >= 7) {
      scholarTier = 'Grandmaster Scholar';
      tierIcon = Icons.military_tech_rounded;
      tierColor = AppColors.gold;
    } else if (gpaNum >= 3.60 || streak >= 5) {
      scholarTier = 'Distinguished Scholar';
      tierIcon = Icons.workspace_premium_rounded;
      tierColor = AppColors.accent;
    } else if (streak >= 3 || totalHoursNum >= 5.0) {
      scholarTier = 'Focused Scholar';
      tierIcon = Icons.local_fire_department_rounded;
      tierColor = AppColors.flame;
    }

    final badges = [
      {
        'id': 'first_step',
        'name': 'First Step',
        'desc': 'Initiated your personalized academic roadmap on StudentBrain',
        'icon': Icons.eco_rounded,
        'color': AppColors.success,
        'unlocked': _unlockedMilestones.contains('first_step'),
        'requirement': 'Log into StudentBrain and explore the command center',
      },
      {
        'id': 'ignition_flame',
        'name': 'Ignition Flame',
        'desc': 'Achieved 3 consecutive days of focused study',
        'icon': Icons.local_fire_department_rounded,
        'color': AppColors.flame,
        'unlocked': _unlockedMilestones.contains('ignition_flame'),
        'requirement': 'Reach a 3-day active streak (Current: ${streak}d)',
      },
      {
        'id': 'unstoppable',
        'name': 'Unstoppable Momentum',
        'desc': 'Maintained an unbroken 7-day academic streak',
        'icon': Icons.bolt_rounded,
        'color': AppColors.accent,
        'unlocked': _unlockedMilestones.contains('unstoppable'),
        'requirement': 'Reach a 7-day active streak (Current: ${streak}d)',
      },
      {
        'id': 'academic_master',
        'name': 'Academic Master',
        'desc': 'Extraordinary consistency: 14-day streak or 3.80+ CGPA',
        'icon': Icons.workspace_premium_rounded,
        'color': AppColors.gold,
        'unlocked': _unlockedMilestones.contains('academic_master'),
        'requirement': 'Maintain a 14-day streak or reach 3.80 CGPA (Current: $gpa)',
      },
      {
        'id': 'deep_scholar',
        'name': 'Deep Focus Scholar',
        'desc': 'Invested 5+ hours into deep study sessions',
        'icon': Icons.menu_book_rounded,
        'color': AppColors.primary,
        'unlocked': _unlockedMilestones.contains('deep_scholar'),
        'requirement': 'Accumulate 5+ hours of focus time (Current: ${totalHours}h)',
      },
      {
        'id': 'centurion',
        'name': 'Centurion Champion',
        'desc': 'Completed 20+ study sessions or 20+ focus hours',
        'icon': Icons.emoji_events_rounded,
        'color': AppColors.secondary,
        'unlocked': _unlockedMilestones.contains('centurion'),
        'requirement': 'Complete 20 focus sessions (Current: ${tracker.sessions.length})',
      },
      {
        'id': 'quiz_ace',
        'name': 'Diagnostic Ace',
        'desc': 'Completed an AI Diagnostic Quiz evaluation',
        'icon': Icons.psychology_rounded,
        'color': const Color(0xFF00B4D8),
        'unlocked': _unlockedMilestones.contains('quiz_ace'),
        'requirement': 'Take at least 1 study session diagnostic quiz',
      },
      {
        'id': 'knowledge_vault',
        'name': 'Knowledge Vault',
        'desc': 'Uploaded and organized course study materials',
        'icon': Icons.folder_special_rounded,
        'color': const Color(0xFF9D4EDD),
        'unlocked': _unlockedMilestones.contains('knowledge_vault'),
        'requirement': 'Add at least 1 course material or slide note',
      },
    ];

    final unlockedCount = badges.where((b) => b['unlocked'] == true).length;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Scholar Profile'),
        actions: [
          IconButton(
            icon: const Icon(Icons.insights_rounded),
            tooltip: 'Study Analytics & Stats',
            onPressed: () => context.push('/analytics'),
          ),
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            tooltip: 'App Settings',
            onPressed: () => context.push('/settings'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: Responsive.padding(context),
        child: Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(maxWidth: Responsive.maxContentWidth(context)),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 1. Eye-Catching Profile Header Card
                Container(
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(24),
                    gradient: LinearGradient(
                      colors: isDark
                          ? [
                              const Color(0xFF1E1F38),
                              const Color(0xFF141526),
                            ]
                          : [
                              Colors.white,
                              const Color(0xFFF3F4F9),
                            ],
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    boxShadow: [
                      BoxShadow(
                        color: tierColor.withValues(alpha: isDark ? 0.2 : 0.12),
                        blurRadius: 20,
                        offset: const Offset(0, 8),
                      ),
                    ],
                    border: Border.all(
                      color: tierColor.withValues(alpha: isDark ? 0.35 : 0.25),
                      width: 1.5,
                    ),
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 22),
                  child: Column(
                    children: [
                      Stack(
                        alignment: Alignment.center,
                        children: [
                          Container(
                            width: 90,
                            height: 90,
                            decoration: BoxDecoration(
                              shape: BoxShape.circle,
                              gradient: SweepGradient(
                                colors: [
                                  tierColor,
                                  AppColors.primary,
                                  tierColor,
                                ],
                              ),
                            ),
                          ),
                          UserAvatar(
                            name: user?.fullName ?? 'Scholar',
                            imageUrl: user?.avatar,
                            seed: user?.email ?? user?.fullName,
                            size: 80,
                          ),
                          Positioned(
                            bottom: 0,
                            right: 0,
                            child: Container(
                              padding: const EdgeInsets.all(5),
                              decoration: BoxDecoration(
                                color: tierColor,
                                shape: BoxShape.circle,
                                border: Border.all(
                                  color: isDark ? const Color(0xFF141526) : Colors.white,
                                  width: 2.5,
                                ),
                              ),
                              child: Icon(tierIcon, size: 14, color: Colors.white),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),

                      Text(
                        user?.fullName ?? 'Dedicated Scholar',
                        style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w900),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 3),
                      Text(
                        user?.email ?? 'student@university.edu',
                        style: TextStyle(
                          fontSize: 12.5,
                          color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                        ),
                        textAlign: TextAlign.center,
                      ),
                      const SizedBox(height: 8),

                      // Tier & Department Chips
                      Wrap(
                        alignment: WrapAlignment.center,
                        spacing: 8,
                        runSpacing: 6,
                        children: [
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: tierColor.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(999),
                              border: Border.all(color: tierColor.withValues(alpha: 0.4)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(tierIcon, size: 13, color: tierColor),
                                const SizedBox(width: 5),
                                Text(
                                  scholarTier,
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: tierColor),
                                ),
                              ],
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(999),
                              border: Border.all(color: AppColors.primary.withValues(alpha: 0.25)),
                            ),
                            child: Text(
                              user?.department ?? 'United International University',
                              style: const TextStyle(
                                fontSize: 11,
                                fontWeight: FontWeight.w700,
                                color: AppColors.primary,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 14),

                // 2. Academic Stats Row (Responsive 4-stat layout)
                LayoutBuilder(
                  builder: (context, constraints) {
                    final isNarrow = constraints.maxWidth < 460;
                    final statsWidgets = [
                      _buildStatCard(
                        title: 'Current CGPA',
                        value: gpa,
                        color: AppColors.primary,
                        icon: Icons.grade_rounded,
                      ),
                      _buildStatCard(
                        title: 'Focus Studied',
                        value: '${totalHours}h',
                        color: AppColors.accent,
                        icon: Icons.timer_rounded,
                      ),
                      _buildStatCard(
                        title: 'Active Streak',
                        value: '${streak}d',
                        color: AppColors.flame,
                        icon: Icons.local_fire_department_rounded,
                      ),
                      _buildStatCard(
                        title: 'Sessions Done',
                        value: '${tracker.sessions.length}',
                        color: AppColors.success,
                        icon: Icons.task_alt_rounded,
                      ),
                    ];

                    if (isNarrow) {
                      return GridView.count(
                        crossAxisCount: 2,
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        mainAxisSpacing: 10,
                        crossAxisSpacing: 10,
                        childAspectRatio: 1.8,
                        children: statsWidgets,
                      );
                    } else {
                      return Row(
                        children: statsWidgets
                            .map((w) => Expanded(
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(horizontal: 4.0),
                                    child: w,
                                  ),
                                ))
                            .toList(),
                      );
                    }
                  },
                ),
                const SizedBox(height: 16),

                // 3. Milestone Badges Trophy Cabinet
                GlassCard(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.workspace_premium_rounded, color: AppColors.gold, size: 20),
                              SizedBox(width: 8),
                              Text(
                                'Milestones & Badges',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.primary.withValues(alpha: 0.12),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              '$unlockedCount / ${badges.length} Unlocked',
                              style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.primary),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Unlock badges automatically through focus hours, quizzes, streaks & materials. Tap any badge for details.',
                        style: TextStyle(fontSize: 11, color: Colors.grey),
                      ),
                      const SizedBox(height: 14),

                      GridView.builder(
                        shrinkWrap: true,
                        physics: const NeverScrollableScrollPhysics(),
                        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 4,
                          childAspectRatio: 0.82,
                          crossAxisSpacing: 8,
                          mainAxisSpacing: 10,
                        ),
                        itemCount: badges.length,
                        itemBuilder: (context, index) {
                          final b = badges[index];
                          final isUnlocked = b['unlocked'] as bool;
                          final color = b['color'] as Color;

                          return InkWell(
                            onTap: () => _showMilestoneDetail(b),
                            borderRadius: BorderRadius.circular(14),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 8),
                              decoration: BoxDecoration(
                                color: isUnlocked
                                    ? color.withValues(alpha: 0.12)
                                    : (isDark ? Colors.white.withValues(alpha: 0.03) : Colors.black.withValues(alpha: 0.03)),
                                borderRadius: BorderRadius.circular(14),
                                border: Border.all(
                                  color: isUnlocked
                                      ? color.withValues(alpha: 0.5)
                                      : (isDark ? AppColors.borderDark : AppColors.borderLight),
                                  width: isUnlocked ? 1.5 : 1,
                                ),
                              ),
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Stack(
                                    alignment: Alignment.center,
                                    children: [
                                      Icon(
                                        b['icon'] as IconData,
                                        size: 26,
                                        color: isUnlocked ? color : Colors.grey.withValues(alpha: 0.6),
                                      ),
                                      if (!isUnlocked)
                                        const Positioned(
                                          bottom: 0,
                                          right: 0,
                                          child: Icon(Icons.lock_rounded, size: 12, color: Colors.grey),
                                        ),
                                    ],
                                  ),
                                  const SizedBox(height: 6),
                                  FittedBox(
                                    fit: BoxFit.scaleDown,
                                    child: Text(
                                      b['name'] as String,
                                      style: TextStyle(
                                        fontSize: 10.5,
                                        fontWeight: FontWeight.w700,
                                        color: isUnlocked ? null : Colors.grey,
                                      ),
                                      textAlign: TextAlign.center,
                                    ),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    isUnlocked ? 'UNLOCKED' : 'LOCKED',
                                    style: TextStyle(
                                      fontSize: 8.5,
                                      fontWeight: FontWeight.w900,
                                      letterSpacing: 0.5,
                                      color: isUnlocked ? color : Colors.grey.withValues(alpha: 0.7),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // 4. Data Backup & Restore (Import & Export JSON)
                GlassCard(
                  padding: const EdgeInsets.all(18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Row(
                        children: [
                          Icon(Icons.backup_rounded, color: AppColors.primary, size: 20),
                          SizedBox(width: 8),
                          Text(
                            'Academic Data Backup & Restore',
                            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      const Text(
                        'Keep your study sessions, grade planner, materials, and badges safe. Export a JSON backup or import one anytime after reinstalling.',
                        style: TextStyle(fontSize: 11, color: Colors.grey),
                      ),
                      const SizedBox(height: 14),

                      Row(
                        children: [
                          Expanded(
                            child: ElevatedButton.icon(
                              onPressed: () => _exportJsonBackup(
                                user: user,
                                tracker: tracker,
                                grades: grades,
                                materials: materials,
                                gpa: gpa,
                                totalHours: totalHours,
                                streak: streak,
                              ),
                              icon: const Icon(Icons.download_rounded, size: 17),
                              label: const FittedBox(
                                fit: BoxFit.scaleDown,
                                child: Text('Export JSON', style: TextStyle(fontWeight: FontWeight.w800)),
                              ),
                              style: ElevatedButton.styleFrom(
                                backgroundColor: AppColors.primary,
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                                elevation: 1,
                              ),
                            ),
                          ),
                          const SizedBox(width: 10),
                          Expanded(
                            child: OutlinedButton.icon(
                              onPressed: _showImportJsonDialog,
                              icon: const Icon(Icons.upload_file_rounded, size: 17),
                              label: const FittedBox(
                                fit: BoxFit.scaleDown,
                                child: Text('Import JSON', style: TextStyle(fontWeight: FontWeight.w800)),
                              ),
                              style: OutlinedButton.styleFrom(
                                padding: const EdgeInsets.symmetric(vertical: 12),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              ),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 16),

                // 5. Quick Nav Settings & Logout
                GlassCard(
                  padding: const EdgeInsets.all(8),
                  child: Column(
                    children: [
                      ListTile(
                        leading: const Icon(Icons.insights_rounded, color: AppColors.primary),
                        title: const Text('Study Analytics & Performance Stats', style: TextStyle(fontWeight: FontWeight.w700)),
                        subtitle: const Text('Weekly focus histogram, subject investment & study audits', style: TextStyle(fontSize: 11)),
                        trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                        onTap: () => context.push('/analytics'),
                      ),
                      const Divider(),
                      ListTile(
                        leading: const Icon(Icons.settings_outlined, color: AppColors.primary),
                        title: const Text('App Settings & Backend Host', style: TextStyle(fontWeight: FontWeight.w700)),
                        trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14),
                        onTap: () => context.push('/settings'),
                      ),
                      const Divider(),
                      ListTile(
                        leading: const Icon(Icons.logout_rounded, color: AppColors.error),
                        title: const Text('Log Out', style: TextStyle(fontWeight: FontWeight.w700, color: AppColors.error)),
                        onTap: () async {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (ctx) => AlertDialog(
                              title: const Text('Confirm Logout'),
                              content: const Text('Are you sure you want to log out of StudentBrain?'),
                              actions: [
                                TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
                                TextButton(
                                  onPressed: () => Navigator.pop(ctx, true),
                                  child: const Text('Logout', style: TextStyle(color: AppColors.error)),
                                ),
                              ],
                            ),
                          );
                          if (confirm == true) {
                            await ref.read(authProvider.notifier).logout();
                            if (context.mounted) {
                              context.go('/login');
                            }
                          }
                        },
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 24),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required Color color,
    required IconData icon,
  }) {
    return GlassCard(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 12),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 14, color: color),
              const SizedBox(width: 4),
              Text(
                value,
                style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: color),
              ),
            ],
          ),
          const SizedBox(height: 3),
          FittedBox(
            fit: BoxFit.scaleDown,
            child: Text(title, style: const TextStyle(fontSize: 10.5, color: Colors.grey)),
          ),
        ],
      ),
    );
  }
}
