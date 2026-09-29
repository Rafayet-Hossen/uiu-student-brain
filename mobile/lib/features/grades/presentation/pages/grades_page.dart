import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/responsive.dart';
import '../../../../core/widgets/student_brain_loader.dart';
import '../providers/grades_provider.dart';
import '../widgets/add_course_grade_dialog.dart';

class GradesPage extends ConsumerStatefulWidget {
  const GradesPage({super.key});

  @override
  ConsumerState<GradesPage> createState() => _GradesPageState();
}

class _GradesPageState extends ConsumerState<GradesPage> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _totalCreditsCtrl;
  late TextEditingController _completedCreditsCtrl;
  late TextEditingController _currentGpaCtrl;
  late TextEditingController _targetGpaCtrl;
  final _importCtrl = TextEditingController();
  bool _isEditing = false;

  @override
  void initState() {
    super.initState();
    _totalCreditsCtrl = TextEditingController(text: '140.0');
    _completedCreditsCtrl = TextEditingController(text: '45.0');
    _currentGpaCtrl = TextEditingController(text: '3.80');
    _targetGpaCtrl = TextEditingController(text: '3.90');
  }

  @override
  void dispose() {
    _totalCreditsCtrl.dispose();
    _completedCreditsCtrl.dispose();
    _currentGpaCtrl.dispose();
    _targetGpaCtrl.dispose();
    _importCtrl.dispose();
    super.dispose();
  }

  void _syncControllers(GradesState gradesState) {
    if (gradesState.plan != null && !_isEditing) {
      _totalCreditsCtrl.text = gradesState.plan!.totalCredits.toString();
      _completedCreditsCtrl.text = gradesState.plan!.completedCredits.toString();
      _currentGpaCtrl.text = gradesState.plan!.currentGpa.toString();
      _targetGpaCtrl.text = gradesState.plan!.targetGpa.toString();
    }
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    final tCr = double.tryParse(_totalCreditsCtrl.text) ?? 140.0;
    final cCr = double.tryParse(_completedCreditsCtrl.text) ?? 45.0;
    final cGpa = double.tryParse(_currentGpaCtrl.text) ?? 3.80;
    final tGpa = double.tryParse(_targetGpaCtrl.text) ?? 3.90;

    final success = await ref.read(gradesProvider.notifier).updatePlan(
          totalCredits: tCr,
          completedCredits: cCr,
          currentGpa: cGpa,
          targetGpa: tGpa,
        );

    if (mounted) {
      setState(() => _isEditing = false);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            success ? 'Academic target plan updated successfully!' : 'Failed to save academic plan.',
          ),
          backgroundColor: success ? AppColors.success : AppColors.error,
        ),
      );
    }
  }

  void _showImportDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Row(
          children: [
            Icon(Icons.file_upload_outlined, color: AppColors.primary),
            SizedBox(width: 8),
            Text('Import Transcript / CSV'),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Paste your UIU UCAM transcript text or CSV rows below to automatically extract course codes, credits, and grades:',
              style: TextStyle(fontSize: 12, height: 1.4),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _importCtrl,
              maxLines: 5,
              decoration: InputDecoration(
                hintText: 'e.g.\nCSE 1111 | Structured Programming | 3.0 | A\nCSE 1112 | Programming Lab | 1.0 | A\nCSE 2215 | Data Structures | 3.0 | B+',
                hintStyle: const TextStyle(fontSize: 11),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () async {
              final text = _importCtrl.text.trim();
              Navigator.pop(ctx);
              if (text.isNotEmpty) {
                final ok = await ref.read(gradesProvider.notifier).importTranscriptText(text);
                if (mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(ok ? 'Transcript courses parsed & imported successfully!' : 'Import failed.'),
                      backgroundColor: ok ? AppColors.success : AppColors.error,
                    ),
                  );
                }
              }
            },
            child: const Text('Import'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final gradesState = ref.watch(gradesProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    _syncControllers(gradesState);

    if (gradesState.isLoading && gradesState.plan == null && gradesState.courses.isEmpty) {
      return const Scaffold(
        body: StudentBrainLoader.fullScreen(
          message: 'Analyzing your academic trajectory...',
        ),
      );
    }

    final plan = gradesState.plan;
    final totalCredits = plan?.totalCredits ?? 140.0;
    final completedCredits = plan?.completedCredits ?? 45.0;
    final currentGpa = plan?.currentGpa ?? 3.80;
    final targetGpa = plan?.targetGpa ?? 3.90;
    final remainingCredits = (totalCredits - completedCredits).clamp(0.0, 999.0);

    double requiredGpa = 0.0;
    if (remainingCredits > 0) {
      final totalQualityPointsNeeded = totalCredits * targetGpa;
      final currentQualityPoints = completedCredits * currentGpa;
      requiredGpa = (totalQualityPointsNeeded - currentQualityPoints) / remainingCredits;
    }

    final isFeasible = requiredGpa <= 4.00 && requiredGpa >= 0.0;
    final progressRatio = totalCredits > 0 ? (completedCredits / totalCredits).clamp(0.0, 1.0) : 0.0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Grade Planner & Targets'),
        actions: [
          IconButton(
            icon: const Icon(Icons.upload_file_rounded),
            tooltip: 'Import Transcript/CSV',
            onPressed: _showImportDialog,
          ),
          IconButton(
            icon: const Icon(Icons.add_circle_outline_rounded),
            tooltip: 'Add Course Grade',
            onPressed: () {
              AddCourseGradeDialog.show(
                context,
                onAdd: (course) => ref.read(gradesProvider.notifier).addCourse(course),
              );
            },
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(gradesProvider.notifier).loadGradesData(),
        color: AppColors.primary,
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(),
          padding: Responsive.padding(context),
          child: Center(
            child: ConstrainedBox(
              constraints: BoxConstraints(maxWidth: Responsive.maxContentWidth(context)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // 1. Required GPA & Feasibility Gauge
                  GlassCard(
                    padding: const EdgeInsets.all(20),
                    borderColor: isFeasible
                        ? AppColors.primary.withValues(alpha: 0.3)
                        : AppColors.error.withValues(alpha: 0.5),
                    child: Column(
                      children: [
                        const Text(
                          'Required GPA for Remaining Credits',
                          style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 16),
                        CircularPercentIndicator(
                          radius: 75.0,
                          lineWidth: 12.0,
                          percent: (requiredGpa / 4.0).clamp(0.0, 1.0),
                          center: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Text(
                                requiredGpa > 4.0 ? '> 4.00' : requiredGpa.toStringAsFixed(2),
                                style: TextStyle(
                                  fontSize: 26,
                                  fontWeight: FontWeight.w900,
                                  color: isFeasible ? AppColors.primary : AppColors.error,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                isFeasible ? 'Target Feasible' : 'Exceeds 4.00 Max',
                                style: TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w600,
                                  color: isFeasible ? AppColors.success : AppColors.error,
                                ),
                              ),
                            ],
                          ),
                          progressColor: isFeasible ? AppColors.primary : AppColors.error,
                          backgroundColor: isDark ? AppColors.borderDark : AppColors.borderLight,
                          circularStrokeCap: CircularStrokeCap.round,
                        ),
                        const SizedBox(height: 18),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildSummaryItem('Current GPA', currentGpa.toStringAsFixed(2), AppColors.accent),
                            _buildSummaryItem('Target GPA', targetGpa.toStringAsFixed(2), AppColors.warning),
                            _buildSummaryItem('Remaining Cr', remainingCredits.toStringAsFixed(0), AppColors.primary),
                          ],
                        ),
                        const SizedBox(height: 14),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Degree Progress: ${(progressRatio * 100).toInt()}%',
                              style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                            ),
                            Text(
                              '${completedCredits.toInt()} / ${totalCredits.toInt()} Cr',
                              style: TextStyle(
                                fontSize: 11,
                                color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 2. Degree Targets Form Card
                  GlassCard(
                    padding: const EdgeInsets.all(18),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Degree Targets & Settings',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                              ),
                              if (!_isEditing)
                                TextButton.icon(
                                  icon: const Icon(Icons.edit, size: 14),
                                  label: const Text('Edit'),
                                  onPressed: () => setState(() => _isEditing = true),
                                ),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: AppTextField(
                                  label: 'Total Degree Credits',
                                  controller: _totalCreditsCtrl,
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  enabled: _isEditing,
                                  validator: (v) => (double.tryParse(v ?? '') ?? 0) <= 0 ? 'Invalid' : null,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: AppTextField(
                                  label: 'Completed Credits',
                                  controller: _completedCreditsCtrl,
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  enabled: _isEditing,
                                  validator: (v) => (double.tryParse(v ?? '') ?? 0) < 0 ? 'Invalid' : null,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Row(
                            children: [
                              Expanded(
                                child: AppTextField(
                                  label: 'Current CGPA',
                                  controller: _currentGpaCtrl,
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  enabled: _isEditing,
                                  validator: (v) {
                                    final val = double.tryParse(v ?? '');
                                    if (val == null || val < 0.0 || val > 4.0) return '0.00-4.00';
                                    return null;
                                  },
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: AppTextField(
                                  label: 'Target CGPA',
                                  controller: _targetGpaCtrl,
                                  keyboardType: const TextInputType.numberWithOptions(decimal: true),
                                  enabled: _isEditing,
                                  validator: (v) {
                                    final val = double.tryParse(v ?? '');
                                    if (val == null || val < 0.0 || val > 4.0) return '0.00-4.00';
                                    return null;
                                  },
                                ),
                              ),
                            ],
                          ),
                          if (_isEditing) ...[
                            const SizedBox(height: 16),
                            Row(
                              children: [
                                Expanded(
                                  child: AppButton(
                                    label: 'Cancel',
                                    variant: AppButtonVariant.secondary,
                                    onPressed: () {
                                      setState(() => _isEditing = false);
                                      _syncControllers(gradesState);
                                    },
                                  ),
                                ),
                                const SizedBox(width: 10),
                                Expanded(
                                  child: AppButton(
                                    label: 'Save Target',
                                    isLoading: gradesState.isLoading,
                                    onPressed: _handleSave,
                                  ),
                                ),
                              ],
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 3. Completed Courses Registry List
                  GlassCard(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Row(
                              children: [
                                const Icon(Icons.school_outlined, size: 18, color: AppColors.primary),
                                const SizedBox(width: 8),
                                const Text(
                                  'Completed Courses Registry',
                                  style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                                ),
                              ],
                            ),
                            TextButton.icon(
                              onPressed: () {
                                AddCourseGradeDialog.show(
                                  context,
                                  onAdd: (course) => ref.read(gradesProvider.notifier).addCourse(course),
                                );
                              },
                              icon: const Icon(Icons.add, size: 14),
                              label: const Text('Add Course'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        if (gradesState.courses.isEmpty)
                          Padding(
                            padding: const EdgeInsets.symmetric(vertical: 16.0),
                            child: Center(
                              child: Text(
                                'No completed courses logged yet.\nTap "Add Course" or "Import Transcript" above.',
                                textAlign: TextAlign.center,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                ),
                              ),
                            ),
                          )
                        else
                          ...gradesState.courses.map((course) {
                            return Padding(
                              padding: const EdgeInsets.only(bottom: 8.0),
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                                decoration: BoxDecoration(
                                  color: isDark ? Colors.white.withValues(alpha: 0.04) : Colors.black.withValues(alpha: 0.03),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isDark ? AppColors.borderDark : AppColors.borderLight,
                                  ),
                                ),
                                child: Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 6),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary.withValues(alpha: 0.15),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: Text(
                                        course.grade,
                                        style: const TextStyle(
                                          fontWeight: FontWeight.w900,
                                          fontSize: 14,
                                          color: AppColors.primary,
                                        ),
                                      ),
                                    ),
                                    const SizedBox(width: 12),
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            course.courseCode,
                                            style: const TextStyle(fontWeight: FontWeight.w800, fontSize: 13),
                                          ),
                                          Text(
                                            course.courseTitle,
                                            style: TextStyle(
                                              fontSize: 11,
                                              color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                            ),
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          const SizedBox(height: 2),
                                          Text(
                                            '${course.credits} Credits • ${course.semester}',
                                            style: TextStyle(
                                              fontSize: 10,
                                              color: isDark ? AppColors.textDarkSubtle : AppColors.textLightSubtle,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, size: 18, color: AppColors.error),
                                      onPressed: () async {
                                        final confirm = await showDialog<bool>(
                                          context: context,
                                          builder: (c) => AlertDialog(
                                            title: const Text('Delete Course Record'),
                                            content: Text('Remove ${course.courseCode} (${course.courseTitle})?'),
                                            actions: [
                                              TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
                                              TextButton(
                                                onPressed: () => Navigator.pop(c, true),
                                                child: const Text('Delete', style: TextStyle(color: AppColors.error)),
                                              ),
                                            ],
                                          ),
                                        );
                                        if (confirm == true) {
                                          await ref.read(gradesProvider.notifier).deleteCourse(course.id);
                                        }
                                      },
                                    ),
                                  ],
                                ),
                              ),
                            );
                          }),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 4. AI Course Retake Advisor
                  GlassCard(
                    padding: const EdgeInsets.all(16),
                    borderColor: AppColors.gold.withValues(alpha: 0.3),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(6),
                              decoration: BoxDecoration(
                                color: AppColors.gold.withValues(alpha: 0.15),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.auto_awesome, size: 16, color: AppColors.gold),
                            ),
                            const SizedBox(width: 8),
                            const Text(
                              'AI Course Retake Advisor',
                              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Text(
                          gradesState.retakeData['suggestion']?.toString() ??
                              'Retaking MATH 2183 (Linear Algebra) from Grade B (3.00) to A (4.00) would raise your cumulative GPA by +0.07 with minimal 3-credit course load investment.',
                          style: TextStyle(
                            fontSize: 12,
                            height: 1.35,
                            color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                          ),
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
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(
          value,
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: color),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: Colors.grey),
        ),
      ],
    );
  }
}
