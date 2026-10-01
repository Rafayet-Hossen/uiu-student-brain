import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../providers/tracker_provider.dart';
import '../../../materials/presentation/providers/materials_provider.dart';

class CreateSessionDialog extends ConsumerStatefulWidget {
  const CreateSessionDialog({super.key});

  @override
  ConsumerState<CreateSessionDialog> createState() => _CreateSessionDialogState();
}

class _CreateSessionDialogState extends ConsumerState<CreateSessionDialog> {
  final _formKey = GlobalKey<FormState>();
  final _subjectCtrl = TextEditingController();
  final _notesCtrl = TextEditingController();

  int? _selectedSemesterId;
  int? _selectedCourseId;
  int? _selectedMaterialId;

  int? _durationMinutes;
  bool _isCustomDuration = false;
  final TextEditingController _customMinutesCtrl = TextEditingController();
  DateTime? _selectedDate;
  TimeOfDay? _selectedTime;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final materialsState = ref.read(materialsProvider);
    if (materialsState.semesters.isNotEmpty) {
      final cur = materialsState.semesters.firstWhere(
        (s) => s['is_current'] == true,
        orElse: () => materialsState.semesters.first,
      );
      _selectedSemesterId = cur['id'] as int?;
    }
  }

  @override
  void dispose() {
    _subjectCtrl.dispose();
    _notesCtrl.dispose();
    _customMinutesCtrl.dispose();
    super.dispose();
  }

  String _formatDateApi(DateTime d) {
    return '${d.year}-${d.month.toString().padLeft(2, '0')}-${d.day.toString().padLeft(2, '0')}';
  }

  String _formatDateDisplay(DateTime d) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return '${d.day.toString().padLeft(2, '0')} ${months[d.month - 1]}, ${d.year}';
  }

  String _formatTimeApi(TimeOfDay t) {
    return '${t.hour.toString().padLeft(2, '0')}:${t.minute.toString().padLeft(2, '0')}';
  }

  String _formatTime12(TimeOfDay time) {
    final hour = time.hour == 0 ? 12 : (time.hour > 12 ? time.hour - 12 : time.hour);
    final minute = time.minute.toString().padLeft(2, '0');
    final period = time.hour >= 12 ? 'PM' : 'AM';
    return '$hour:$minute $period';
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_durationMinutes == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a focus duration'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_selectedDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select session date'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select session start time'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    final success = await ref.read(trackerProvider.notifier).createSession({
      'subject': _subjectCtrl.text.trim(),
      'duration_minutes': _durationMinutes!,
      'session_date': _formatDateApi(_selectedDate!),
      'start_time': _formatTimeApi(_selectedTime!),
      'notes': _notesCtrl.text.trim(),
      if (_selectedCourseId != null) 'course': _selectedCourseId,
      if (_selectedMaterialId != null) 'material': _selectedMaterialId,
    });

    setState(() => _isLoading = false);
    if (success && mounted) {
      Navigator.pop(context);
    }
  }

  Widget _buildDurationChip(int mins, bool isDark) {
    final isSelected = !_isCustomDuration && _durationMinutes == mins;
    return InkWell(
      onTap: () => setState(() {
        _isCustomDuration = false;
        _durationMinutes = mins;
      }),
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(vertical: 10),
        decoration: BoxDecoration(
          color: isSelected
              ? AppColors.primary
              : (isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle),
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: isSelected
                ? AppColors.primary
                : (isDark ? AppColors.borderDark : AppColors.borderLight),
            width: isSelected ? 1.5 : 1,
          ),
        ),
        child: Text(
          '$mins min',
          style: TextStyle(
            fontSize: 13,
            fontWeight: isSelected ? FontWeight.w800 : FontWeight.w600,
            color: isSelected
                ? Colors.white
                : (isDark ? AppColors.textDark : AppColors.textLight),
          ),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final materialsState = ref.watch(materialsProvider);

    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(22)),
      child: ConstrainedBox(
        constraints: const BoxConstraints(maxWidth: 440),
        child: Padding(
          padding: const EdgeInsets.all(20),
          child: SingleChildScrollView(
            child: Form(
              key: _formKey,
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(
                          color: AppColors.primary.withValues(alpha: 0.15),
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: const Icon(
                          Icons.timer_outlined,
                          color: AppColors.primary,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'Book Scheduled Focus Session',
                          style: TextStyle(
                            fontSize: 17,
                            fontWeight: FontWeight.w800,
                            letterSpacing: -0.2,
                          ),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.close_rounded, size: 20),
                        onPressed: () => Navigator.pop(context),
                        tooltip: 'Close',
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // 1. Trimester Selector
                  if (materialsState.semesters.isNotEmpty) ...[
                    DropdownButtonFormField<int?>(
                      initialValue: _selectedSemesterId,
                      isExpanded: true,
                      decoration: InputDecoration(
                        labelText: 'Select Trimester',
                        prefixIcon: const Icon(Icons.calendar_month_outlined, size: 18),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                      ),
                      items: materialsState.semesters.map((s) {
                        final id = s['id'] as int?;
                        final name = s['name']?.toString() ?? 'Semester $id';
                        final isCurrent = s['is_current'] == true;
                        return DropdownMenuItem<int?>(
                          value: id,
                          child: Text(
                            isCurrent ? '$name (Active)' : name,
                            style: TextStyle(
                              fontSize: 13,
                              fontWeight: isCurrent ? FontWeight.w700 : FontWeight.w500,
                              color: isCurrent ? AppColors.primary : null,
                            ),
                          ),
                        );
                      }).toList(),
                      onChanged: (val) {
                        setState(() {
                          _selectedSemesterId = val;
                          _selectedCourseId = null;
                          _selectedMaterialId = null;
                        });
                      },
                    ),
                    const SizedBox(height: 12),
                  ],

                  // 2. Course Selector (Strictly filtered to selected trimester, NO falling back to all courses)
                  Builder(
                    builder: (context) {
                      final selectedSem = materialsState.semesters.firstWhere(
                        (s) => s['id'] == _selectedSemesterId,
                        orElse: () => {},
                      );
                      final semName = selectedSem['name']?.toString() ?? 'Selected Trimester';

                      final trimesterCourses = _selectedSemesterId != null
                          ? materialsState.courses.where((c) => c['semester'] == _selectedSemesterId || c['semester_id'] == _selectedSemesterId).toList()
                          : materialsState.courses;

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          DropdownButtonFormField<int?>(
                            initialValue: _selectedCourseId,
                            isExpanded: true,
                            decoration: InputDecoration(
                              labelText: 'Course in $semName',
                              prefixIcon: const Icon(Icons.school_outlined, size: 18),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            ),
                            hint: const Text('Choose Course', style: TextStyle(fontSize: 13)),
                            items: [
                              const DropdownMenuItem<int?>(
                                value: null,
                                child: Text('General / Non-course study', style: TextStyle(fontSize: 13)),
                              ),
                              ...trimesterCourses.map((c) {
                                final id = c['id'] as int;
                                final code = c['code']?.toString() ?? '';
                                final title = c['title']?.toString() ?? 'Course $id';
                                return DropdownMenuItem<int?>(
                                  value: id,
                                  child: Text(
                                    code.isNotEmpty ? '[$code] $title' : title,
                                    style: const TextStyle(fontSize: 13),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                );
                              }),
                            ],
                            onChanged: (val) {
                              setState(() {
                                _selectedCourseId = val;
                                _selectedMaterialId = null;
                                if (val != null) {
                                  final crs = trimesterCourses.firstWhere((c) => c['id'] == val, orElse: () => {});
                                  if (_subjectCtrl.text.trim().isEmpty) {
                                    _subjectCtrl.text = crs['title']?.toString() ?? crs['code']?.toString() ?? '';
                                  }
                                }
                              });
                            },
                          ),
                          if (trimesterCourses.isEmpty) ...[
                            const SizedBox(height: 6),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: AppColors.warning.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: AppColors.warning.withValues(alpha: 0.3)),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.info_outline, size: 14, color: AppColors.warning),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: Text(
                                      'No courses added in $semName yet. You can study in General mode or add courses in the Library tab.',
                                      style: const TextStyle(fontSize: 11, color: AppColors.warning, fontWeight: FontWeight.w600),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      );
                    },
                  ),
                  const SizedBox(height: 12),

                  // 3. Document / Material Selector (suggested based on selected course)
                  Builder(
                    builder: (context) {
                      final availableMats = _selectedCourseId != null
                          ? materialsState.materials.where((m) => m.courseId == _selectedCourseId).toList()
                          : materialsState.materials;

                      if (availableMats.isEmpty && _selectedCourseId == null) return const SizedBox.shrink();

                      return Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          DropdownButtonFormField<int?>(
                            initialValue: _selectedMaterialId,
                            isExpanded: true,
                            decoration: InputDecoration(
                              labelText: 'Attach Study Document (For AI Quiz)',
                              prefixIcon: const Icon(Icons.auto_stories_outlined, size: 18),
                              border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                              contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            ),
                            hint: Text(
                              availableMats.isEmpty
                                  ? 'No documents uploaded for this course yet (Optional)'
                                  : 'Select uploaded document...',
                              style: const TextStyle(fontSize: 13),
                            ),
                            items: [
                              const DropdownMenuItem<int?>(
                                value: null,
                                child: Text('No Document / Type custom topic below', style: TextStyle(fontSize: 13)),
                              ),
                              ...availableMats.map((m) {
                                return DropdownMenuItem<int?>(
                                  value: m.id,
                                  child: Text(
                                    m.title,
                                    style: const TextStyle(fontSize: 13),
                                    overflow: TextOverflow.ellipsis,
                                  ),
                                );
                              }),
                            ],
                            onChanged: (val) {
                              setState(() {
                                _selectedMaterialId = val;
                                if (val != null) {
                                  final chosen = availableMats.firstWhere((m) => m.id == val);
                                  if (_subjectCtrl.text.trim().isEmpty) {
                                    _subjectCtrl.text = chosen.title;
                                  }
                                }
                              });
                            },
                          ),
                          const SizedBox(height: 12),
                        ],
                      );
                    },
                  ),

                  AppTextField(
                    label: 'Study Subject / Topic *',
                    hint: 'e.g. Distributed Algorithms Review',
                    controller: _subjectCtrl,
                    validator: (val) =>
                        val == null || val.trim().isEmpty ? 'Subject is required' : null,
                  ),
                  const Text(
                    'Duration (Minutes) *',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2.5),
                          child: _buildDurationChip(25, isDark),
                        ),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2.5),
                          child: _buildDurationChip(45, isDark),
                        ),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2.5),
                          child: _buildDurationChip(60, isDark),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2.5),
                          child: _buildDurationChip(90, isDark),
                        ),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2.5),
                          child: _buildDurationChip(120, isDark),
                        ),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2.5),
                          child: InkWell(
                            onTap: () => setState(() {
                              _isCustomDuration = true;
                              _durationMinutes = int.tryParse(_customMinutesCtrl.text) ?? 30;
                            }),
                            borderRadius: BorderRadius.circular(12),
                            child: AnimatedContainer(
                              duration: const Duration(milliseconds: 150),
                              alignment: Alignment.center,
                              padding: const EdgeInsets.symmetric(vertical: 10),
                              decoration: BoxDecoration(
                                color: _isCustomDuration
                                    ? AppColors.primary
                                    : (isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle),
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(
                                  color: _isCustomDuration
                                      ? AppColors.primary
                                      : (isDark ? AppColors.borderDark : AppColors.borderLight),
                                  width: _isCustomDuration ? 1.5 : 1,
                                ),
                              ),
                              child: Text(
                                'Custom',
                                style: TextStyle(
                                  fontSize: 13,
                                  fontWeight: _isCustomDuration ? FontWeight.w800 : FontWeight.w600,
                                  color: _isCustomDuration
                                      ? Colors.white
                                      : (isDark ? AppColors.textDark : AppColors.textLight),
                                ),
                              ),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  if (_isCustomDuration) ...[
                    const SizedBox(height: 8),
                    TextFormField(
                      controller: _customMinutesCtrl,
                      keyboardType: TextInputType.number,
                      decoration: InputDecoration(
                        labelText: 'Custom Focus Minutes *',
                        hintText: 'e.g. 30, 75, 150',
                        prefixIcon: const Icon(Icons.edit_outlined, size: 18),
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                      onChanged: (val) {
                        final parsed = int.tryParse(val);
                        if (parsed != null && parsed > 0) {
                          setState(() => _durationMinutes = parsed);
                        }
                      },
                    ),
                  ],
                  const SizedBox(height: 18),
                  const Text(
                    'Session Date & Time *',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 12,
                            ),
                            side: BorderSide(
                              color: _selectedDate != null
                                  ? AppColors.primary
                                  : (isDark
                                      ? AppColors.borderDark
                                      : AppColors.borderLight),
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          icon: Icon(
                            Icons.calendar_today_rounded,
                            size: 16,
                            color: _selectedDate != null
                                ? AppColors.primary
                                : (isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                          ),
                          label: FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              _selectedDate == null
                                  ? 'Select Date'
                                  : _formatDateDisplay(_selectedDate!),
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: _selectedDate != null
                                    ? FontWeight.w800
                                    : FontWeight.w600,
                                color: _selectedDate != null
                                    ? AppColors.primary
                                    : (isDark
                                        ? AppColors.textDarkMuted
                                        : AppColors.textLightMuted),
                              ),
                            ),
                          ),
                          onPressed: () async {
                            final now = DateTime.now();
                            final d = await showDatePicker(
                              context: context,
                              initialDate: _selectedDate ?? now,
                              firstDate: now.subtract(const Duration(days: 1)),
                              lastDate: now.add(const Duration(days: 60)),
                            );
                            if (d != null) setState(() => _selectedDate = d);
                          },
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: OutlinedButton.icon(
                          style: OutlinedButton.styleFrom(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 12,
                            ),
                            side: BorderSide(
                              color: _selectedTime != null
                                  ? AppColors.primary
                                  : (isDark
                                      ? AppColors.borderDark
                                      : AppColors.borderLight),
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          icon: Icon(
                            Icons.access_time_rounded,
                            size: 16,
                            color: _selectedTime != null
                                ? AppColors.primary
                                : (isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                          ),
                          label: FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              _selectedTime == null
                                  ? 'Select Time'
                                  : _formatTime12(_selectedTime!),
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: _selectedTime != null
                                    ? FontWeight.w800
                                    : FontWeight.w600,
                                color: _selectedTime != null
                                    ? AppColors.primary
                                    : (isDark
                                        ? AppColors.textDarkMuted
                                        : AppColors.textLightMuted),
                              ),
                            ),
                          ),
                          onPressed: () async {
                            final t = await showTimePicker(
                              context: context,
                              initialTime: _selectedTime ?? TimeOfDay.now(),
                            );
                            if (t != null) setState(() => _selectedTime = t);
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  AppTextField(
                    label: 'Study Notes & Goals',
                    hint: 'Topics, formulas, or chapters to cover',
                    controller: _notesCtrl,
                  ),
                  const SizedBox(height: 14),
                  Row(
                    children: [
                      Expanded(
                        flex: 2,
                        child: TextButton(
                          onPressed: () => Navigator.pop(context),
                          style: TextButton.styleFrom(
                            padding: const EdgeInsets.symmetric(vertical: 13),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                          ),
                          child: Text(
                            'Cancel',
                            style: TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w700,
                              color: isDark
                                  ? AppColors.textDarkMuted
                                  : AppColors.textLightMuted,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        flex: 3,
                        child: ElevatedButton(
                          onPressed: _isLoading ? null : _handleSubmit,
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            padding: const EdgeInsets.symmetric(
                              vertical: 13,
                              horizontal: 10,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(14),
                            ),
                            elevation: 0,
                          ),
                          child: _isLoading
                              ? const SizedBox(
                                  width: 20,
                                  height: 20,
                                  child: CircularProgressIndicator(
                                    strokeWidth: 2,
                                    color: Colors.white,
                                  ),
                                )
                              : const FittedBox(
                                  fit: BoxFit.scaleDown,
                                  child: Text(
                                    'Book Session',
                                    style: TextStyle(
                                      fontSize: 14,
                                      fontWeight: FontWeight.w800,
                                      color: Colors.white,
                                    ),
                                  ),
                                ),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
