import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/config/providers.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../../grades/presentation/providers/grades_provider.dart';
import '../providers/auth_provider.dart';

class MandatoryOnboardingDialog extends ConsumerStatefulWidget {
  const MandatoryOnboardingDialog({super.key});

  @override
  ConsumerState<MandatoryOnboardingDialog> createState() => _MandatoryOnboardingDialogState();
}

class _MandatoryOnboardingDialogState extends ConsumerState<MandatoryOnboardingDialog> {
  final _formKey = GlobalKey<FormState>();

  late TextEditingController _nameCtrl;
  late TextEditingController _totalCreditsCtrl;
  late TextEditingController _completedCreditsCtrl;
  late TextEditingController _currentGpaCtrl;
  late TextEditingController _targetGpaCtrl;
  late TextEditingController _dailyMinutesCtrl;

  String? _department;
  String? _currentTrimester;
  bool _isSubmitting = false;

  final List<String> _departments = [
    'Computer Science & Engineering (CSE)',
    'Software Engineering (SE)',
    'Data Science (DS)',
    'Electrical & Electronic Engineering (EEE)',
    'Civil Engineering (CE)',
    'BBA / Business Administration',
    'Economics',
    'Media Studies & Journalism (MSJ)',
    'English Language & Literature',
    'Other / General Studies',
  ];

  final List<String> _trimesters = [
    '1st Trimester (Freshman)',
    '2nd Trimester',
    '3rd Trimester',
    '4th Trimester (Sophomore)',
    '5th Trimester',
    '6th Trimester',
    '7th Trimester (Junior)',
    '8th Trimester',
    '9th Trimester',
    '10th Trimester (Senior)',
    '11th Trimester',
    '12th Trimester (Graduating)',
    'Graduate / Masters Program',
  ];

  @override
  void initState() {
    super.initState();
    final user = ref.read(authProvider).user;
    final prefs = ref.read(sharedPreferencesProvider);

    final savedName = user?.fullName ?? prefs.getString('academic_full_name') ?? '';
    // Start with blank text fields so user enters their own authentic academic values
    _nameCtrl = TextEditingController(text: savedName);
    _totalCreditsCtrl = TextEditingController();
    _completedCreditsCtrl = TextEditingController();
    _currentGpaCtrl = TextEditingController();
    _targetGpaCtrl = TextEditingController();
    _dailyMinutesCtrl = TextEditingController();

    if (user != null && user.department != null && _departments.contains(user.department)) {
      _department = user.department;
    }
    if (user != null && user.currentTrimester != null && _trimesters.contains(user.currentTrimester)) {
      _currentTrimester = user.currentTrimester;
    }
  }

  @override
  void dispose() {
    _nameCtrl.dispose();
    _totalCreditsCtrl.dispose();
    _completedCreditsCtrl.dispose();
    _currentGpaCtrl.dispose();
    _targetGpaCtrl.dispose();
    _dailyMinutesCtrl.dispose();
    super.dispose();
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_department == null || _department!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select your department / major'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_currentTrimester == null || _currentTrimester!.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select your current trimester / level'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    final name = _nameCtrl.text.trim();
    final totalCredits = double.tryParse(_totalCreditsCtrl.text.trim()) ?? 140.0;
    final completedCredits = double.tryParse(_completedCreditsCtrl.text.trim()) ?? 45.0;
    final currentGpa = double.tryParse(_currentGpaCtrl.text.trim()) ?? 3.80;
    final targetGpa = double.tryParse(_targetGpaCtrl.text.trim()) ?? 3.90;
    final dailyMinutes = int.tryParse(_dailyMinutesCtrl.text.trim()) ?? 60;

    if (currentGpa < 0.0 || currentGpa > 4.0 || targetGpa < 0.0 || targetGpa > 4.0) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('CGPA values must be between 0.00 and 4.00'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (completedCredits > totalCredits) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Completed credits cannot exceed total degree credits'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final prefs = ref.read(sharedPreferencesProvider);
      await prefs.setBool('academic_onboarding_completed', true);
      await prefs.setString('academic_full_name', name);
      await prefs.setString('academic_department', _department!);
      await prefs.setString('academic_trimester', _currentTrimester!);
      await prefs.setDouble('academic_current_gpa', currentGpa);
      await prefs.setDouble('academic_target_gpa', targetGpa);
      await prefs.setDouble('academic_completed_credits', completedCredits);
      await prefs.setDouble('academic_total_credits', totalCredits);
      await prefs.setInt('academic_target_daily_minutes', dailyMinutes);

      // Update Grades Plan Provider
      await ref.read(gradesProvider.notifier).updatePlan(
        totalCredits: totalCredits,
        completedCredits: completedCredits,
        currentGpa: currentGpa,
        targetGpa: targetGpa,
      );

      // Update Auth Profile Provider
      await ref.read(authProvider.notifier).updateProfile({
        'full_name': name,
        'department': _department!,
        'current_trimester': _currentTrimester!,
        'current_gpa': currentGpa,
        'target_gpa': targetGpa,
        'target_daily_minutes': dailyMinutes,
        'is_onboarded': true,
      });

      if (mounted) {
        Navigator.of(context, rootNavigator: true).pop();
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Academic Command Center configured successfully! Welcome Scholar.'),
            backgroundColor: AppColors.success,
            duration: Duration(seconds: 4),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isSubmitting = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Failed to save academic setup: $e'),
            backgroundColor: AppColors.error,
          ),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return PopScope(
      canPop: false,
      child: Dialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        backgroundColor: isDark ? const Color(0xFF141624) : Colors.white,
        insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 540),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 22, vertical: 24),
            child: SingleChildScrollView(
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Header with Icon
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(
                              colors: [AppColors.primary, AppColors.secondary],
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                            ),
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                              BoxShadow(
                                color: AppColors.primary.withValues(alpha: 0.35),
                                blurRadius: 10,
                                offset: const Offset(0, 4),
                              ),
                            ],
                          ),
                          child: const Icon(Icons.school_rounded, color: Colors.white, size: 24),
                        ),
                        const SizedBox(width: 14),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              const Text(
                                'Academic Profile Setup',
                                style: TextStyle(fontSize: 19, fontWeight: FontWeight.w900),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                'Personalize your degree targets & daily goals',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: isDark ? 0.12 : 0.08),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.primary.withValues(alpha: 0.25)),
                      ),
                      child: const Text(
                        'This setup is required once to personalize your GPA simulation, graduation tracking, and study planner accurately.',
                        style: TextStyle(fontSize: 12, height: 1.4),
                      ),
                    ),
                    const SizedBox(height: 18),

                    // 1. Full Name
                    AppTextField(
                      label: 'Full Name',
                      controller: _nameCtrl,
                      prefixIcon: const Icon(Icons.person_rounded, size: 18),
                      validator: (v) => (v == null || v.trim().isEmpty) ? 'Please enter your full name' : null,
                    ),
                    const SizedBox(height: 12),

                    // 2. Department (Responsive, No Overflow, Blank Default)
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      initialValue: _department,
                      hint: Text(
                        'Select Department / Major',
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                        ),
                      ),
                      decoration: InputDecoration(
                        labelText: 'Department / Major',
                        prefixIcon: const Icon(Icons.account_balance_rounded, size: 18),
                        filled: true,
                        fillColor: isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(
                            color: isDark ? AppColors.borderDark : AppColors.borderLight,
                          ),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                      items: _departments.map((dep) {
                        return DropdownMenuItem(
                          value: dep,
                          child: Text(
                            dep,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                        );
                      }).toList(),
                      validator: (val) => (val == null || val.isEmpty) ? 'Please select your department' : null,
                      onChanged: (val) {
                        if (val != null) setState(() => _department = val);
                      },
                    ),
                    const SizedBox(height: 12),

                    // 3. Current Trimester Level (Responsive, Blank Default)
                    DropdownButtonFormField<String>(
                      isExpanded: true,
                      initialValue: _currentTrimester,
                      hint: Text(
                        'Select Current Trimester / Level',
                        style: TextStyle(
                          fontSize: 13,
                          color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                        ),
                      ),
                      decoration: InputDecoration(
                        labelText: 'Current Trimester / Level',
                        prefixIcon: const Icon(Icons.calendar_today_rounded, size: 18),
                        filled: true,
                        fillColor: isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide(
                            color: isDark ? AppColors.borderDark : AppColors.borderLight,
                          ),
                        ),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                      ),
                      items: _trimesters.map((t) {
                        return DropdownMenuItem(
                          value: t,
                          child: Text(
                            t,
                            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                            overflow: TextOverflow.ellipsis,
                            maxLines: 1,
                          ),
                        );
                      }).toList(),
                      validator: (val) => (val == null || val.isEmpty) ? 'Please select your trimester' : null,
                      onChanged: (val) {
                        if (val != null) setState(() => _currentTrimester = val);
                      },
                    ),
                    const SizedBox(height: 14),

                    // 4. CGPA Inputs (Current & Target)
                    Row(
                      children: [
                        Expanded(
                          child: AppTextField(
                            label: 'Current CGPA',
                            hint: 'e.g. 3.75',
                            controller: _currentGpaCtrl,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            prefixIcon: const Icon(Icons.grade_rounded, size: 18),
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) return 'Enter CGPA';
                              final val = double.tryParse(v.trim());
                              if (val == null || val < 0.0 || val > 4.0) return '0.00 - 4.00';
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: AppTextField(
                            label: 'Target CGPA',
                            hint: 'e.g. 3.85',
                            controller: _targetGpaCtrl,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            prefixIcon: const Icon(Icons.flag_rounded, size: 18),
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) return 'Enter Target';
                              final val = double.tryParse(v.trim());
                              if (val == null || val < 0.0 || val > 4.0) return '0.00 - 4.00';
                              return null;
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // 5. Credits Inputs (Completed & Total)
                    Row(
                      children: [
                        Expanded(
                          child: AppTextField(
                            label: 'Completed Credits',
                            hint: 'e.g. 45',
                            controller: _completedCreditsCtrl,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            prefixIcon: const Icon(Icons.check_circle_outline_rounded, size: 18),
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) return 'Required';
                              final val = double.tryParse(v.trim());
                              if (val == null || val < 0) return 'Invalid';
                              return null;
                            },
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: AppTextField(
                            label: 'Total Degree Credits',
                            hint: 'e.g. 138 or 140',
                            controller: _totalCreditsCtrl,
                            keyboardType: const TextInputType.numberWithOptions(decimal: true),
                            prefixIcon: const Icon(Icons.timeline_rounded, size: 18),
                            validator: (v) {
                              if (v == null || v.trim().isEmpty) return 'Required';
                              final val = double.tryParse(v.trim());
                              if (val == null || val <= 0) return 'Invalid';
                              return null;
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // 6. Daily Focus Goal Minutes
                    AppTextField(
                      label: 'Daily Study Focus Goal (Minutes/Day)',
                      controller: _dailyMinutesCtrl,
                      keyboardType: TextInputType.number,
                      prefixIcon: const Icon(Icons.timer_rounded, size: 18),
                      hint: 'e.g. 60 (1 hour daily)',
                      validator: (v) {
                        if (v == null || v.trim().isEmpty) return 'Please enter daily focus goal';
                        final val = int.tryParse(v.trim());
                        if (val == null || val < 10 || val > 720) return 'Between 10 and 720 minutes';
                        return null;
                      },
                    ),
                    const SizedBox(height: 22),

                    // Submit Action Button
                    AppButton(
                      label: 'Initialize Academic Command Center',
                      icon: const Icon(Icons.rocket_launch_rounded, color: Colors.white, size: 18),
                      isLoading: _isSubmitting,
                      onPressed: _handleSubmit,
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
