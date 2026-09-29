import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../../data/models/course_grade_model.dart';

class AddCourseGradeDialog extends StatefulWidget {
  final Function(CourseGradeModel) onAdd;

  const AddCourseGradeDialog({super.key, required this.onAdd});

  static Future<void> show(BuildContext context, {required Function(CourseGradeModel) onAdd}) {
    return showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => AddCourseGradeDialog(onAdd: onAdd),
    );
  }

  @override
  State<AddCourseGradeDialog> createState() => _AddCourseGradeDialogState();
}

class _AddCourseGradeDialogState extends State<AddCourseGradeDialog> {
  final _formKey = GlobalKey<FormState>();
  final _codeController = TextEditingController();
  final _titleController = TextEditingController();
  final _creditsController = TextEditingController(text: '3.0');
  
  String _selectedGrade = 'A';
  String _selectedSemester = 'Fall 2024';

  final Map<String, double> _gradePointMap = {
    'A': 4.00,
    'A-': 3.67,
    'B+': 3.33,
    'B': 3.00,
    'B-': 2.67,
    'C+': 2.33,
    'C': 2.00,
    'D': 1.00,
    'F': 0.00,
  };

  final List<String> _semesters = [
    'Spring 2023',
    'Summer 2023',
    'Fall 2023',
    'Spring 2024',
    'Summer 2024',
    'Fall 2024',
    'Spring 2025',
  ];

  @override
  void dispose() {
    _codeController.dispose();
    _titleController.dispose();
    _creditsController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_formKey.currentState!.validate()) return;

    final credits = double.tryParse(_creditsController.text) ?? 3.0;
    final gradePoint = _gradePointMap[_selectedGrade] ?? 4.0;

    final course = CourseGradeModel(
      id: DateTime.now().millisecondsSinceEpoch,
      courseCode: _codeController.text.trim().toUpperCase(),
      courseTitle: _titleController.text.trim(),
      credits: credits,
      grade: _selectedGrade,
      gradePoint: gradePoint,
      semester: _selectedSemester,
    );

    widget.onAdd(course);
    Navigator.of(context).pop();
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final bottomInset = MediaQuery.of(context).viewInsets.bottom;

    return Container(
      padding: EdgeInsets.fromLTRB(20, 20, 20, 20 + bottomInset),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        border: Border.all(
          color: isDark ? AppColors.borderDark : AppColors.borderLight,
          width: 1.2,
        ),
      ),
      child: SingleChildScrollView(
        child: Form(
          key: _formKey,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Center(
                child: Container(
                  width: 40,
                  height: 4,
                  decoration: BoxDecoration(
                    color: Colors.grey.withValues(alpha: 0.4),
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              ),
              const SizedBox(height: 14),
              const Text(
                'Add Completed Course Grade',
                style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              AppTextField(
                label: 'Course Code',
                hintText: 'e.g. CSE 323 or ENG 101',
                controller: _codeController,
                prefixIcon: const Icon(Icons.code_rounded),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Course code is required' : null,
              ),
              const SizedBox(height: 12),
              AppTextField(
                label: 'Course Title',
                hintText: 'e.g. Operating Systems',
                controller: _titleController,
                prefixIcon: const Icon(Icons.book_rounded),
                validator: (v) => (v == null || v.trim().isEmpty) ? 'Course title is required' : null,
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: AppTextField(
                      label: 'Credits',
                      hintText: '3.0',
                      controller: _creditsController,
                      keyboardType: const TextInputType.numberWithOptions(decimal: true),
                      prefixIcon: const Icon(Icons.credit_score_rounded),
                      validator: (v) {
                        final val = double.tryParse(v ?? '');
                        if (val == null || val <= 0 || val > 12) return 'Invalid credits';
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Earned Grade',
                          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.04),
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(
                              color: isDark ? AppColors.borderDark : AppColors.borderLight,
                            ),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _selectedGrade,
                              isExpanded: true,
                              items: _gradePointMap.keys.map((grade) {
                                final gp = _gradePointMap[grade]!;
                                return DropdownMenuItem(
                                  value: grade,
                                  child: Text('$grade ($gp)', style: const TextStyle(fontWeight: FontWeight.w700)),
                                );
                              }).toList(),
                              onChanged: (val) {
                                if (val != null) setState(() => _selectedGrade = val);
                              },
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Semester Completed', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 6),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.04),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isDark ? AppColors.borderDark : AppColors.borderLight,
                      ),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<String>(
                        value: _selectedSemester,
                        isExpanded: true,
                        items: _semesters.map((sem) {
                          return DropdownMenuItem(value: sem, child: Text(sem));
                        }).toList(),
                        onChanged: (val) {
                          if (val != null) setState(() => _selectedSemester = val);
                        },
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),
              AppButton(
                label: 'Save Course Grade',
                icon: const Icon(Icons.check_rounded, size: 20),
                onPressed: _submit,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
