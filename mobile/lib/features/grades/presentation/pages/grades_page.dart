import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/responsive.dart';
import '../providers/grades_provider.dart';

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
    super.dispose();
  }

  void _syncControllers(gradesState) {
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

    if (success) {
      setState(() => _isEditing = false);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('GPA targets updated successfully')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final gradesState = ref.watch(gradesProvider);
    _syncControllers(gradesState);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final plan = gradesState.plan;
    final requiredGpa = plan?.calculatedRequiredGpa ?? 3.94;
    final isFeasible = plan?.isFeasible ?? true;
    final remainingCredits = plan?.remainingCredits ?? 95.0;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Grade & GPA Planner'),
        actions: [
          IconButton(
            icon: Icon(_isEditing ? Icons.close : Icons.edit_outlined),
            onPressed: () {
              setState(() => _isEditing = !_isEditing);
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
                  // 1. Animated Required GPA Gauge Card
                  GlassCard(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                    child: Column(
                      children: [
                        CircularPercentIndicator(
                          radius: 75.0,
                          lineWidth: 12.0,
                          animation: true,
                          percent: (requiredGpa / 4.0).clamp(0.0, 1.0),
                          center: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                requiredGpa.toStringAsFixed(2),
                                style: TextStyle(
                                  fontSize: 28,
                                  fontWeight: FontWeight.w900,
                                  color: isFeasible ? AppColors.primary : AppColors.warning,
                                ),
                              ),
                              const Text(
                                'Required GPA',
                                style: TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                          circularStrokeCap: CircularStrokeCap.round,
                          progressColor: isFeasible ? AppColors.primary : AppColors.warning,
                          backgroundColor: isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle,
                        ),
                        const SizedBox(height: 18),

                        // Feasibility Badge
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color: (isFeasible ? AppColors.success : AppColors.warning).withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(9999),
                            border: Border.all(
                              color: (isFeasible ? AppColors.success : AppColors.warning).withValues(alpha: 0.4),
                            ),
                          ),
                          child: Text(
                            isFeasible ? 'Target Achievable' : 'Challenging Target (> 4.00)',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: isFeasible ? AppColors.success : AppColors.warning,
                            ),
                          ),
                        ),
                        const SizedBox(height: 16),

                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildInfoColumn('Completed', '${plan?.completedCredits ?? 45.0} cr'),
                            _buildInfoColumn('Remaining', '$remainingCredits cr'),
                            _buildInfoColumn('Target', '${plan?.targetGpa.toStringAsFixed(2) ?? "3.90"} GPA'),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 2. Targets Form Card (Edit Mode or Read Mode)
                  GlassCard(
                    padding: const EdgeInsets.all(20),
                    child: Form(
                      key: _formKey,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                            children: [
                              const Text(
                                'Degree Target Configuration',
                                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                              ),
                              if (!_isEditing)
                                TextButton.icon(
                                  icon: const Icon(Icons.edit, size: 15),
                                  label: const Text('Edit'),
                                  onPressed: () => setState(() => _isEditing = true),
                                ),
                            ],
                          ),
                          const SizedBox(height: 16),
                          Row(
                            children: [
                              Expanded(
                                child: AppTextField(
                                  label: 'Total Degree Credits',
                                  controller: _totalCreditsCtrl,
                                  keyboardType: TextInputType.number,
                                  readOnly: !_isEditing,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: AppTextField(
                                  label: 'Completed Credits',
                                  controller: _completedCreditsCtrl,
                                  keyboardType: TextInputType.number,
                                  readOnly: !_isEditing,
                                ),
                              ),
                            ],
                          ),
                          Row(
                            children: [
                              Expanded(
                                child: AppTextField(
                                  label: 'Current CGPA',
                                  controller: _currentGpaCtrl,
                                  keyboardType: TextInputType.number,
                                  readOnly: !_isEditing,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: AppTextField(
                                  label: 'Target Graduation GPA',
                                  controller: _targetGpaCtrl,
                                  keyboardType: TextInputType.number,
                                  readOnly: !_isEditing,
                                ),
                              ),
                            ],
                          ),
                          if (_isEditing) ...[
                            const SizedBox(height: 10),
                            AppButton(
                              label: 'Save Configuration',
                              onPressed: _handleSave,
                              isLoading: gradesState.isLoading,
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),

                  // 3. AI Retake Advisor Preview
                  if (gradesState.retakeData['top_single'] != null) ...[
                    GlassCard(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(6),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withValues(alpha: 0.15),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(Icons.psychology_outlined, color: AppColors.primary, size: 18),
                              ),
                              const SizedBox(width: 10),
                              const Text(
                                'AI Course Retake Advisor',
                                style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            'Highest ROI Course to Retake: ${gradesState.retakeData['top_single']['course_code']} (${gradesState.retakeData['top_single']['course_name']})',
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            'Upgrading to 4.00 yields a +${gradesState.retakeData['top_single']['cgpa_jump_4']} CGPA jump to ${gradesState.retakeData['top_single']['projected_cgpa_4']}!',
                            style: TextStyle(
                              fontSize: 12,
                              color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildInfoColumn(String label, String value) {
    return Column(
      children: [
        Text(
          value,
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
        ),
        const SizedBox(height: 2),
        Text(
          label,
          style: const TextStyle(fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
