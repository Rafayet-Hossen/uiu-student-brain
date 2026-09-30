import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/app_text_field.dart';
import '../providers/planner_provider.dart';

class AddScheduleDialog extends ConsumerStatefulWidget {
  const AddScheduleDialog({super.key});

  @override
  ConsumerState<AddScheduleDialog> createState() => _AddScheduleDialogState();
}

class _AddScheduleDialogState extends ConsumerState<AddScheduleDialog> {
  final _formKey = GlobalKey<FormState>();
  final _subjectController = TextEditingController();
  final _roomController = TextEditingController();
  final _notesController = TextEditingController();

  TimeOfDay? _startTime;
  TimeOfDay? _endTime;
  final Set<String> _selectedDays = {};
  bool _isLoading = false;

  @override
  void dispose() {
    _subjectController.dispose();
    _roomController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  String _formatTime(TimeOfDay time) {
    final h = time.hour.toString().padLeft(2, '0');
    final m = time.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }

  Future<void> _handleSubmit() async {
    if (!_formKey.currentState!.validate()) return;

    if (_selectedDays.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select at least one routine day'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    if (_startTime == null || _endTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select both class start and end time'),
          backgroundColor: AppColors.error,
        ),
      );
      return;
    }

    setState(() => _isLoading = true);

    String notes = _notesController.text;
    if (_roomController.text.isNotEmpty) {
      notes = 'Room: ${_roomController.text} | $notes';
    }

    final success = await ref.read(plannerProvider.notifier).addSchedule({
      'subject': _subjectController.text.trim(),
      'start_time': _formatTime(_startTime!),
      'end_time': _formatTime(_endTime!),
      'days': _selectedDays.toList(),
      'notes': notes.trim(),
    });

    setState(() => _isLoading = false);

    if (success && mounted) {
      Navigator.pop(context);
    }
  }

  String _formatTime12(TimeOfDay time) {
    final hour = time.hour == 0 ? 12 : (time.hour > 12 ? time.hour - 12 : time.hour);
    final minute = time.minute.toString().padLeft(2, '0');
    final period = time.hour >= 12 ? 'PM' : 'AM';
    return '$hour:$minute $period';
  }

  Widget _buildDayChip(String dayName, String shortName, bool isDark) {
    final isSelected = _selectedDays.contains(dayName);
    return InkWell(
      onTap: () {
        setState(() {
          if (isSelected) {
            _selectedDays.remove(dayName);
          } else {
            _selectedDays.add(dayName);
          }
        });
      },
      borderRadius: BorderRadius.circular(12),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 150),
        alignment: Alignment.center,
        padding: const EdgeInsets.symmetric(vertical: 9),
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
          shortName,
          style: TextStyle(
            fontSize: 12,
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

    return Dialog(
      insetPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 24),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
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
                          Icons.calendar_today_rounded,
                          color: AppColors.primary,
                          size: 20,
                        ),
                      ),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'Add Class Routine',
                          style: TextStyle(
                            fontSize: 18,
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
                  AppTextField(
                    label: 'Subject / Course Name *',
                    hint: 'e.g. Software Engineering',
                    controller: _subjectController,
                    validator: (val) => val == null || val.trim().isEmpty
                        ? 'Subject is required'
                        : null,
                  ),
                  AppTextField(
                    label: 'Room / Venue',
                    hint: 'e.g. Room 402, Campus Building A',
                    controller: _roomController,
                  ),
                  const Text(
                    'Select Routine Days *',
                    style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2.5),
                          child: _buildDayChip('Saturday', 'Sat', isDark),
                        ),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2.5),
                          child: _buildDayChip('Sunday', 'Sun', isDark),
                        ),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2.5),
                          child: _buildDayChip('Monday', 'Mon', isDark),
                        ),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2.5),
                          child: _buildDayChip('Tuesday', 'Tue', isDark),
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
                          child: _buildDayChip('Wednesday', 'Wed', isDark),
                        ),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2.5),
                          child: _buildDayChip('Thursday', 'Thu', isDark),
                        ),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 2.5),
                          child: _buildDayChip('Friday', 'Fri', isDark),
                        ),
                      ),
                      const Expanded(
                        child: SizedBox(),
                      ),
                    ],
                  ),
                  const SizedBox(height: 18),
                  const Text(
                    'Class Timing *',
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
                              color: _startTime != null
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
                            color: _startTime != null
                                ? AppColors.primary
                                : (isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                          ),
                          label: FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              _startTime == null
                                  ? 'Start Time'
                                  : _formatTime12(_startTime!),
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: _startTime != null
                                    ? FontWeight.w800
                                    : FontWeight.w600,
                                color: _startTime != null
                                    ? AppColors.primary
                                    : (isDark
                                        ? AppColors.textDarkMuted
                                        : AppColors.textLightMuted),
                              ),
                            ),
                          ),
                          onPressed: () async {
                            final picked = await showTimePicker(
                              context: context,
                              initialTime: _startTime ??
                                  const TimeOfDay(hour: 9, minute: 0),
                            );
                            if (picked != null) {
                              setState(() => _startTime = picked);
                            }
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
                              color: _endTime != null
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
                            Icons.access_time_filled_rounded,
                            size: 16,
                            color: _endTime != null
                                ? AppColors.primary
                                : (isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                          ),
                          label: FittedBox(
                            fit: BoxFit.scaleDown,
                            child: Text(
                              _endTime == null
                                  ? 'End Time'
                                  : _formatTime12(_endTime!),
                              style: TextStyle(
                                fontSize: 12,
                                fontWeight: _endTime != null
                                    ? FontWeight.w800
                                    : FontWeight.w600,
                                color: _endTime != null
                                    ? AppColors.primary
                                    : (isDark
                                        ? AppColors.textDarkMuted
                                        : AppColors.textLightMuted),
                              ),
                            ),
                          ),
                          onPressed: () async {
                            final picked = await showTimePicker(
                              context: context,
                              initialTime: _endTime ??
                                  const TimeOfDay(hour: 10, minute: 30),
                            );
                            if (picked != null) {
                              setState(() => _endTime = picked);
                            }
                          },
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  AppTextField(
                    label: 'Notes / Teacher',
                    hint: 'Faculty name or section notes',
                    controller: _notesController,
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
                                    'Save Routine',
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
