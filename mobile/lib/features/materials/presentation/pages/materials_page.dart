import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/data/courses_catalog.dart';
import '../../../../core/widgets/empty_state.dart';
import '../../../../core/widgets/error_card.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/responsive.dart';
import '../../../../core/widgets/student_brain_loader.dart';
import '../providers/materials_provider.dart';

class MaterialsPage extends ConsumerWidget {
  const MaterialsPage({super.key});

  static const List<String> categories = [
    'All',
    'Lecture Note',
    'Cheat Sheet',
    'Textbook Chapter',
    'Lab Report',
  ];

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final matState = ref.watch(materialsProvider);
    final notifier = ref.read(materialsProvider.notifier);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Study Materials & Library'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => notifier.loadMaterialsData(),
          ),
        ],
      ),
      body: RefreshIndicator(
        onRefresh: () => notifier.loadMaterialsData(),
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
                  // 1. Search Bar
                  TextField(
                    onChanged: (val) => notifier.setSearchQuery(val),
                    decoration: InputDecoration(
                      hintText: 'Search lecture notes, topics, formulas...',
                      prefixIcon: const Icon(Icons.search_rounded),
                      suffixIcon: matState.searchQuery.isNotEmpty
                          ? IconButton(
                              icon: const Icon(Icons.clear_rounded),
                              onPressed: () => notifier.setSearchQuery(''),
                            )
                          : null,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(9999),
                        borderSide: BorderSide(
                          color: isDark ? AppColors.borderDark : AppColors.borderLight,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),

                  // 2. Category Filter Chips
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: categories.map((cat) {
                        final isSelected = matState.selectedCategory == cat;
                        return Padding(
                          padding: const EdgeInsets.only(right: 8.0),
                          child: FilterChip(
                            label: Text(cat),
                            selected: isSelected,
                            onSelected: (_) => notifier.selectCategory(cat),
                            selectedColor: AppColors.primary.withValues(alpha: 0.2),
                            checkmarkColor: AppColors.primary,
                            labelStyle: TextStyle(
                              fontSize: 12,
                              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
                              color: isSelected
                                  ? AppColors.primary
                                  : (isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                  const SizedBox(height: 18),

                  // 3. Trimesters & Enrolled Courses Section
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Expanded(
                        child: Text(
                          'Trimester Courses & AI Copilots',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          TextButton.icon(
                            onPressed: () => _showAddSemesterDialog(context, ref),
                            icon: const Icon(Icons.add_rounded, size: 16),
                            label: const Text('Trimester', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                            style: TextButton.styleFrom(
                              foregroundColor: AppColors.primary,
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                            ),
                          ),
                          TextButton.icon(
                            onPressed: () => _showAddCourseDialog(context, ref, matState.semesters),
                            icon: const Icon(Icons.add_rounded, size: 16),
                            label: const Text('Course', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w800)),
                            style: TextButton.styleFrom(
                              foregroundColor: AppColors.accent,
                              padding: const EdgeInsets.symmetric(horizontal: 8),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 8),

                  // Trimester Pills Filter
                  if (matState.semesters.isNotEmpty)
                    SingleChildScrollView(
                      scrollDirection: Axis.horizontal,
                      child: Row(
                        children: [
                          ChoiceChip(
                            label: const Text('All Terms'),
                            selected: matState.selectedSemesterId == null,
                            onSelected: (_) => notifier.selectSemester(null),
                            selectedColor: AppColors.primary.withValues(alpha: 0.15),
                            labelStyle: TextStyle(
                              fontSize: 12,
                              fontWeight: matState.selectedSemesterId == null ? FontWeight.w800 : FontWeight.w500,
                              color: matState.selectedSemesterId == null ? AppColors.primary : (isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                            ),
                          ),
                          const SizedBox(width: 8),
                          ...matState.semesters.map((sem) {
                            final semId = sem['id'] as int?;
                            final semName = sem['name']?.toString() ?? 'Term';
                            final isCurrent = sem['is_current'] == true;
                            final isSelected = matState.selectedSemesterId == semId;

                            return Padding(
                              padding: const EdgeInsets.only(right: 8.0),
                              child: GestureDetector(
                                onLongPress: () => _showTrimesterOptionsBottomSheet(context, ref, sem),
                                child: ChoiceChip(
                                  avatar: isCurrent
                                      ? Icon(
                                          Icons.star_rounded,
                                          size: 14,
                                          color: isSelected ? AppColors.primary : AppColors.warning,
                                        )
                                      : null,
                                  label: Row(
                                    mainAxisSize: MainAxisSize.min,
                                    children: [
                                      Text(semName),
                                      const SizedBox(width: 4),
                                      InkWell(
                                        onTap: () => _showTrimesterOptionsBottomSheet(context, ref, sem),
                                        child: Icon(
                                          Icons.more_vert_rounded,
                                          size: 13,
                                          color: isSelected ? AppColors.primary : (isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                                        ),
                                      ),
                                    ],
                                  ),
                                  selected: isSelected,
                                  onSelected: (_) => notifier.selectSemester(semId),
                                  selectedColor: AppColors.primary.withValues(alpha: 0.15),
                                  labelStyle: TextStyle(
                                    fontSize: 12,
                                    fontWeight: isSelected ? FontWeight.w800 : FontWeight.w500,
                                    color: isSelected ? AppColors.primary : (isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                                  ),
                                ),
                              ),
                            );
                          }),
                        ],
                      ),
                    ),
                  const SizedBox(height: 10),

                  if (matState.semesterCourses.isEmpty)
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle,
                        borderRadius: BorderRadius.circular(16),
                        border: Border.all(
                          color: isDark ? AppColors.borderDark : AppColors.borderLight,
                        ),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.school_outlined, size: 28, color: AppColors.primary),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                const Text('No Courses in this Trimester', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
                                Text(
                                  'Tap "+ Course" above to organize classes for this trimester.',
                                  style: TextStyle(
                                    fontSize: 11,
                                    color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    )
                  else
                    SizedBox(
                      height: 122,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: matState.semesterCourses.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 10),
                        itemBuilder: (context, index) {
                          final c = matState.semesterCourses[index];
                          final courseId = c['id'] as int? ?? 1;
                          final code = c['code']?.toString() ?? 'CSE';
                          final title = c['title']?.toString() ?? 'Course';
                          final semName = c['semester_name']?.toString();
                          final isSelected = matState.selectedCourseId == courseId;

                          return InkWell(
                            onTap: () => notifier.selectCourse(courseId),
                            borderRadius: BorderRadius.circular(16),
                            child: Container(
                              width: 240,
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? AppColors.primary.withValues(alpha: isDark ? 0.2 : 0.08)
                                    : (isDark ? AppColors.surfaceDark : AppColors.surfaceLight),
                                borderRadius: BorderRadius.circular(16),
                                border: Border.all(
                                  color: isSelected
                                      ? AppColors.primary
                                      : (isDark ? AppColors.borderDark : AppColors.borderLight),
                                  width: isSelected ? 1.8 : 1.0,
                                ),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Row(
                                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                        children: [
                                          Container(
                                            padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2.5),
                                            decoration: BoxDecoration(
                                              color: isSelected
                                                  ? AppColors.primary
                                                  : AppColors.primary.withValues(alpha: 0.15),
                                              borderRadius: BorderRadius.circular(6),
                                            ),
                                            child: Text(
                                              code,
                                              style: TextStyle(
                                                fontSize: 10.5,
                                                fontWeight: FontWeight.w800,
                                                color: isSelected ? Colors.white : AppColors.primary,
                                              ),
                                            ),
                                          ),
                                          Row(
                                            mainAxisSize: MainAxisSize.min,
                                            children: [
                                              if (isSelected)
                                                Container(
                                                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1.5),
                                                  decoration: BoxDecoration(
                                                    color: AppColors.primary.withValues(alpha: 0.15),
                                                    borderRadius: BorderRadius.circular(4),
                                                  ),
                                                  child: const Row(
                                                    mainAxisSize: MainAxisSize.min,
                                                    children: [
                                                      Icon(Icons.check_circle_rounded, size: 10, color: AppColors.primary),
                                                      SizedBox(width: 3),
                                                      Text(
                                                        'Filtered',
                                                        style: TextStyle(fontSize: 9.5, fontWeight: FontWeight.w800, color: AppColors.primary),
                                                      ),
                                                    ],
                                                  ),
                                                )
                                              else if (semName != null && semName.isNotEmpty)
                                                Text(
                                                  semName,
                                                  style: TextStyle(
                                                    fontSize: 10,
                                                    fontWeight: FontWeight.w600,
                                                    color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                                  ),
                                                  overflow: TextOverflow.ellipsis,
                                                ),
                                              const SizedBox(width: 4),
                                              PopupMenuButton<String>(
                                                icon: Icon(
                                                  Icons.more_vert_rounded,
                                                  size: 16,
                                                  color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                                ),
                                                padding: EdgeInsets.zero,
                                                constraints: const BoxConstraints(),
                                                itemBuilder: (_) => [
                                                  const PopupMenuItem(
                                                    value: 'edit',
                                                    child: Row(
                                                      children: [
                                                        Icon(Icons.edit_outlined, size: 16),
                                                        SizedBox(width: 8),
                                                        Text('Edit Course', style: TextStyle(fontSize: 13)),
                                                      ],
                                                    ),
                                                  ),
                                                  const PopupMenuItem(
                                                    value: 'delete',
                                                    child: Row(
                                                      children: [
                                                        Icon(Icons.delete_outline_rounded, size: 16, color: AppColors.error),
                                                        SizedBox(width: 8),
                                                        Text('Delete Course', style: TextStyle(fontSize: 13, color: AppColors.error)),
                                                      ],
                                                    ),
                                                  ),
                                                ],
                                                onSelected: (val) {
                                                  if (val == 'edit') {
                                                    _showEditCourseDialog(context, ref, c);
                                                  } else if (val == 'delete') {
                                                    _confirmDeleteCourse(context, ref, c);
                                                  }
                                                },
                                              ),
                                            ],
                                          ),
                                        ],
                                      ),
                                      const SizedBox(height: 6),
                                      Text(
                                        title,
                                        style: const TextStyle(fontSize: 12.5, fontWeight: FontWeight.w700),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                    ],
                                  ),
                                  InkWell(
                                    onTap: () {
                                      context.push('/ai/chat/$courseId?title=$code - $title');
                                    },
                                    borderRadius: BorderRadius.circular(8),
                                    child: Container(
                                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4.5),
                                      decoration: BoxDecoration(
                                        color: AppColors.primary.withValues(alpha: 0.12),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Row(
                                        mainAxisSize: MainAxisSize.min,
                                        children: [
                                          Icon(Icons.auto_awesome_rounded, size: 13, color: AppColors.primary),
                                          SizedBox(width: 5),
                                          Text(
                                            'Chat with Course AI',
                                            style: TextStyle(
                                              fontSize: 11,
                                              fontWeight: FontWeight.w800,
                                              color: AppColors.primary,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  const SizedBox(height: 18),

                  // 4. Materials List Header with Filter Clear Option & Upload Material Button
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Expanded(
                        child: Text(
                          'Course Documents & Cheat Sheets',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      const SizedBox(width: 8),
                      ElevatedButton.icon(
                        icon: const Icon(Icons.upload_file_rounded, size: 14),
                        label: const Text('Upload Material', style: TextStyle(fontSize: 11.5, fontWeight: FontWeight.bold)),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                          elevation: 0,
                        ),
                        onPressed: () => _showUploadMaterialDialog(context, ref),
                      ),
                      if (matState.selectedCourseId != null) ...[
                        const SizedBox(width: 6),
                        InkWell(
                          onTap: () => notifier.selectCourse(null),
                          borderRadius: BorderRadius.circular(6),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                            decoration: BoxDecoration(
                              color: AppColors.error.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.close_rounded, size: 12, color: AppColors.error),
                                SizedBox(width: 4),
                                Text(
                                  'Clear',
                                  style: TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: AppColors.error),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                  const SizedBox(height: 10),

                  if (matState.isLoading)
                    const Padding(
                      padding: EdgeInsets.symmetric(vertical: 36),
                      child: StudentBrainLoader(
                        message: 'Loading UIU study materials & notes...',
                      ),
                    )
                  else if (matState.error != null)
                    ErrorCard(
                      message: matState.error!,
                      onRetry: () => notifier.loadMaterialsData(),
                    )
                  else if (matState.filteredMaterials.isEmpty)
                    const EmptyState(
                      icon: Icons.folder_open_outlined,
                      title: 'No Materials Found',
                      subtitle: 'Try changing your search keywords or filter category.',
                    )
                  else
                    ListView.separated(
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: matState.filteredMaterials.length,
                      separatorBuilder: (_, __) => const SizedBox(height: 10),
                      itemBuilder: (context, index) {
                        final item = matState.filteredMaterials[index];

                        return GlassCard(
                          onTap: () {
                            context.push('/materials/${item.id}');
                          },
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withValues(alpha: 0.12),
                                      borderRadius: BorderRadius.circular(10),
                                    ),
                                    child: const Icon(
                                      Icons.description_outlined,
                                      color: AppColors.primary,
                                      size: 20,
                                    ),
                                  ),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Column(
                                      crossAxisAlignment: CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          item.title,
                                          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
                                        ),
                                        const SizedBox(height: 2),
                                        Text(
                                          '${item.category} | ${item.difficultyLevel} | ${item.estimatedReadingTime} min read',
                                          style: TextStyle(
                                            fontSize: 11,
                                            color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                          ),
                                        ),
                                      ],
                                    ),
                                  ),
                                    IconButton(
                                      icon: const Icon(Icons.delete_outline, size: 18, color: Colors.grey),
                                      tooltip: 'Delete Material',
                                      onPressed: () => _confirmDeleteMaterial(context, ref, item),
                                    ),
                                    const Icon(Icons.arrow_forward_ios_rounded, size: 13, color: AppColors.primary),
                                ],
                              ),
                              if (item.summary.isNotEmpty) ...[
                                const SizedBox(height: 10),
                                Text(
                                  item.summary,
                                  style: TextStyle(
                                    fontSize: 12,
                                    height: 1.35,
                                    color: isDark ? AppColors.textDarkSubtle : AppColors.textLightSubtle,
                                  ),
                                  maxLines: 2,
                                  overflow: TextOverflow.ellipsis,
                                ),
                              ],
                            ],
                          ),
                        );
                      },
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

  void _showAddSemesterDialog(BuildContext context, WidgetRef ref) {
    final nameCtrl = TextEditingController(text: 'Fall ${DateTime.now().year}');
    bool isCurrent = true;
    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Row(
              children: [
                Icon(Icons.calendar_month_rounded, color: AppColors.primary, size: 22),
                SizedBox(width: 8),
                Text('Add Academic Trimester', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  TextField(
                    controller: nameCtrl,
                    decoration: InputDecoration(
                      labelText: 'Trimester / Semester Name *',
                      hintText: 'e.g. Fall 2026, Spring 2027',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 12),
                  SwitchListTile(
                    title: const Text('Current Active Trimester', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700)),
                    subtitle: const Text('Set as your primary enrolled term', style: TextStyle(fontSize: 11)),
                    value: isCurrent,
                    contentPadding: EdgeInsets.zero,
                    activeTrackColor: AppColors.primary,
                    onChanged: (val) => setDialogState(() => isCurrent = val),
                  ),
                ],
              ),
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
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: isSubmitting
                    ? null
                    : () async {
                        final name = nameCtrl.text.trim();
                        if (name.isEmpty) return;

                        setDialogState(() => isSubmitting = true);
                        final success = await ref
                            .read(materialsProvider.notifier)
                            .createSemester(name, isCurrent);

                        if (ctx.mounted) {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(success ? 'Trimester created successfully!' : 'Failed to create trimester'),
                              backgroundColor: success ? AppColors.success : AppColors.error,
                            ),
                          );
                        }
                      },
                child: isSubmitting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Create Trimester', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showAddCourseDialog(BuildContext context, WidgetRef ref, List<Map<String, dynamic>> semesters) {
    if (semesters.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please create a Trimester / Semester first!'),
          backgroundColor: AppColors.accent,
        ),
      );
      _showAddSemesterDialog(context, ref);
      return;
    }

    int selectedSemesterId = semesters.first['id'] as int? ?? 1;
    final codeCtrl = TextEditingController();
    final titleCtrl = TextEditingController();
    String selectedColor = '#2563eb';
    bool isSubmitting = false;
    List<CatalogCourse> courseSuggestions = [];

    final colorOptions = [
      {'hex': '#2563eb', 'name': 'Blue'},
      {'hex': '#10b981', 'name': 'Green'},
      {'hex': '#8b5cf6', 'name': 'Purple'},
      {'hex': '#f59e0b', 'name': 'Amber'},
      {'hex': '#ef4444', 'name': 'Crimson'},
    ];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) {
          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Row(
              children: [
                Icon(Icons.school_rounded, color: AppColors.primary, size: 22),
                SizedBox(width: 8),
                Text('Add Course to Trimester', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  DropdownButtonFormField<int>(
                    initialValue: selectedSemesterId,
                    decoration: InputDecoration(
                      labelText: 'Select Trimester',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    items: semesters.map((s) {
                      final id = s['id'] as int;
                      final name = s['name']?.toString() ?? 'Semester';
                      final isCur = s['is_current'] == true;
                      return DropdownMenuItem(
                        value: id,
                        child: Text(isCur ? '$name (Current)' : name),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) setDialogState(() => selectedSemesterId = val);
                    },
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    controller: codeCtrl,
                    decoration: InputDecoration(
                      labelText: 'Course Code *',
                      hintText: 'e.g. CSE 4123, MATH 2183',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                    onChanged: (val) {
                      setDialogState(() {
                        courseSuggestions = searchCoursesCatalog(val);
                      });
                    },
                  ),
                  if (courseSuggestions.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: courseSuggestions.take(4).map((c) {
                        return ActionChip(
                          avatar: const Icon(Icons.school, size: 14, color: AppColors.primary),
                          label: Text('${c.code} (${c.title})', style: const TextStyle(fontSize: 11)),
                          onPressed: () {
                            setDialogState(() {
                              codeCtrl.text = c.code;
                              titleCtrl.text = c.title;
                              courseSuggestions = [];
                            });
                          },
                        );
                      }).toList(),
                    ),
                  ],
                  const SizedBox(height: 12),
                  TextField(
                    controller: titleCtrl,
                    decoration: InputDecoration(
                      labelText: 'Course Title *',
                      hintText: 'e.g. Distributed Computing',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                    ),
                  ),
                  const SizedBox(height: 14),
                  const Text('Course Theme Color', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: colorOptions.map((opt) {
                      final hex = opt['hex']!;
                      final color = Color(int.parse(hex.replaceFirst('#', '0xFF')));
                      final isSelected = selectedColor == hex;

                      return GestureDetector(
                        onTap: () => setDialogState(() => selectedColor = hex),
                        child: Container(
                          width: 32,
                          height: 32,
                          decoration: BoxDecoration(
                            color: color,
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: isSelected ? Colors.white : Colors.transparent,
                              width: 2.5,
                            ),
                          ),
                          child: isSelected ? const Icon(Icons.check, size: 16, color: Colors.white) : null,
                        ),
                      );
                    }).toList(),
                  ),
                ],
              ),
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
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: isSubmitting
                    ? null
                    : () async {
                        final code = codeCtrl.text.trim();
                        final title = titleCtrl.text.trim();
                        if (code.isEmpty || title.isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Course code and title are required')),
                          );
                          return;
                        }

                        setDialogState(() => isSubmitting = true);
                        final success = await ref.read(materialsProvider.notifier).createCourse(
                              semesterId: selectedSemesterId,
                              title: title,
                              code: code,
                              color: selectedColor,
                            );

                        if (ctx.mounted) {
                          Navigator.pop(ctx);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text(success ? 'Course added successfully!' : 'Failed to add course'),
                              backgroundColor: success ? AppColors.success : AppColors.error,
                            ),
                          );
                        }
                      },
                child: isSubmitting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Add Course', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ],
          );
        },
      ),
    );
  }

  void _showTrimesterOptionsBottomSheet(BuildContext context, WidgetRef ref, Map<String, dynamic> sem) {
    final semId = sem['id'] as int;
    final semName = sem['name']?.toString() ?? 'Trimester';
    final isCurrent = sem['is_current'] == true;

    showModalBottomSheet(
      context: context,
      backgroundColor: Colors.transparent,
      builder: (bCtx) => Container(
        decoration: BoxDecoration(
          color: Theme.of(context).brightness == Brightness.dark ? AppColors.surfaceDark : AppColors.surfaceLight,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 36,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.withValues(alpha: 0.3),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            const SizedBox(height: 14),
            Row(
              children: [
                const Icon(Icons.school_rounded, color: AppColors.primary, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    semName,
                    style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                  ),
                ),
                if (isCurrent)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                    decoration: BoxDecoration(
                      color: AppColors.primary.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(6),
                    ),
                    child: const Text('Active', style: TextStyle(fontSize: 11, fontWeight: FontWeight.w800, color: AppColors.primary)),
                  ),
              ],
            ),
            const SizedBox(height: 14),
            const Divider(height: 1),
            ListTile(
              leading: const Icon(Icons.edit_outlined, color: AppColors.primary),
              title: const Text('Edit Trimester Name', style: TextStyle(fontWeight: FontWeight.w600)),
              onTap: () {
                Navigator.pop(bCtx);
                _showEditSemesterDialog(context, ref, sem);
              },
            ),
            ListTile(
              leading: Icon(
                isCurrent ? Icons.star_border_rounded : Icons.star_rounded,
                color: AppColors.warning,
              ),
              title: Text(
                isCurrent ? 'Unmark as Active Trimester' : 'Set as Active Trimester',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
              onTap: () async {
                Navigator.pop(bCtx);
                await ref.read(materialsProvider.notifier).updateSemester(semId, isCurrent: !isCurrent);
              },
            ),
            ListTile(
              leading: const Icon(Icons.delete_outline_rounded, color: AppColors.error),
              title: const Text('Delete Trimester', style: TextStyle(fontWeight: FontWeight.w600, color: AppColors.error)),
              onTap: () {
                Navigator.pop(bCtx);
                _confirmDeleteSemester(context, ref, sem);
              },
            ),
          ],
        ),
      ),
    );
  }

  void _showEditSemesterDialog(BuildContext context, WidgetRef ref, Map<String, dynamic> sem) {
    final semId = sem['id'] as int;
    final nameCtrl = TextEditingController(text: sem['name']?.toString() ?? '');
    bool isCurrent = sem['is_current'] == true;
    bool isSubmitting = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          title: const Text('Edit Trimester', style: TextStyle(fontWeight: FontWeight.w800)),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: nameCtrl,
                decoration: InputDecoration(
                  labelText: 'Trimester Name',
                  hintText: 'e.g. Fall 2027, Spring 2028',
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Set as Active / Current', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600)),
                value: isCurrent,
                onChanged: (val) => setDialogState(() => isCurrent = val),
              ),
            ],
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
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: isSubmitting
                  ? null
                  : () async {
                      final name = nameCtrl.text.trim();
                      if (name.isEmpty) return;
                      setDialogState(() => isSubmitting = true);
                      final success = await ref.read(materialsProvider.notifier).updateSemester(
                            semId,
                            name: name,
                            isCurrent: isCurrent,
                          );
                      if (ctx.mounted) {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(success ? 'Trimester updated' : 'Failed to update trimester'),
                            backgroundColor: success ? AppColors.success : AppColors.error,
                          ),
                        );
                      }
                    },
              child: isSubmitting
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDeleteSemester(BuildContext context, WidgetRef ref, Map<String, dynamic> sem) {
    final semId = sem['id'] as int;
    final semName = sem['name']?.toString() ?? 'Trimester';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Trimester'),
        content: Text('Are you sure you want to delete "$semName"? All associated courses and study materials will also be removed.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await ref.read(materialsProvider.notifier).deleteSemester(semId);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success ? 'Trimester deleted' : 'Failed to delete trimester'),
                    backgroundColor: success ? AppColors.success : AppColors.error,
                  ),
                );
              }
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _showEditCourseDialog(BuildContext context, WidgetRef ref, Map<String, dynamic> course) {
    final courseId = course['id'] as int;
    final codeCtrl = TextEditingController(text: course['code']?.toString() ?? '');
    final titleCtrl = TextEditingController(text: course['title']?.toString() ?? '');
    final descCtrl = TextEditingController(text: course['description']?.toString() ?? '');
    String selectedColor = course['color']?.toString() ?? '#2563eb';
    bool isSubmitting = false;

    final colorOptions = [
      {'hex': '#2563eb', 'name': 'Blue'},
      {'hex': '#7c3aed', 'name': 'Purple'},
      {'hex': '#059669', 'name': 'Emerald'},
      {'hex': '#d97706', 'name': 'Amber'},
      {'hex': '#dc2626', 'name': 'Red'},
      {'hex': '#0891b2', 'name': 'Cyan'},
    ];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
          title: const Text('Edit Course', style: TextStyle(fontWeight: FontWeight.w800)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(
                  controller: codeCtrl,
                  decoration: InputDecoration(
                    labelText: 'Course Code *',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: titleCtrl,
                  decoration: InputDecoration(
                    labelText: 'Course Title *',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: descCtrl,
                  decoration: InputDecoration(
                    labelText: 'Description (Optional)',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                  ),
                ),
                const SizedBox(height: 14),
                const Text('Course Theme Color', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                const SizedBox(height: 8),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: colorOptions.map((opt) {
                    final hex = opt['hex']!;
                    final color = Color(int.parse(hex.replaceFirst('#', '0xFF')));
                    final isSelected = selectedColor == hex;

                    return GestureDetector(
                      onTap: () => setDialogState(() => selectedColor = hex),
                      child: Container(
                        width: 32,
                        height: 32,
                        decoration: BoxDecoration(
                          color: color,
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: isSelected ? Colors.white : Colors.transparent,
                            width: 2.5,
                          ),
                        ),
                        child: isSelected ? const Icon(Icons.check, size: 16, color: Colors.white) : null,
                      ),
                    );
                  }).toList(),
                ),
              ],
            ),
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
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
              ),
              onPressed: isSubmitting
                  ? null
                  : () async {
                      final code = codeCtrl.text.trim();
                      final title = titleCtrl.text.trim();
                      if (code.isEmpty || title.isEmpty) return;

                      setDialogState(() => isSubmitting = true);
                      final success = await ref.read(materialsProvider.notifier).updateCourse(
                            courseId,
                            title: title,
                            code: code,
                            color: selectedColor,
                            description: descCtrl.text.trim(),
                          );
                      if (ctx.mounted) {
                        Navigator.pop(ctx);
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(success ? 'Course updated' : 'Failed to update course'),
                            backgroundColor: success ? AppColors.success : AppColors.error,
                          ),
                        );
                      }
                    },
              child: isSubmitting
                  ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                  : const Text('Save Changes', style: TextStyle(fontWeight: FontWeight.w700)),
            ),
          ],
        ),
      ),
    );
  }

  void _confirmDeleteCourse(BuildContext context, WidgetRef ref, Map<String, dynamic> course) {
    final courseId = course['id'] as int;
    final courseTitle = course['title']?.toString() ?? 'Course';

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Course'),
        content: Text('Are you sure you want to delete "$courseTitle"? All study materials inside this course will also be removed.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await ref.read(materialsProvider.notifier).deleteCourse(courseId);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success ? 'Course deleted' : 'Failed to delete course'),
                    backgroundColor: success ? AppColors.success : AppColors.error,
                  ),
                );
              }
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _confirmDeleteMaterial(BuildContext context, WidgetRef ref, dynamic item) {
    final materialId = item.id as int;
    final title = item.title as String;

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Delete Material'),
        content: Text('Delete "$title"? This document will be removed from your device library.'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.error,
              foregroundColor: Colors.white,
            ),
            onPressed: () async {
              Navigator.pop(ctx);
              final success = await ref.read(materialsProvider.notifier).deleteMaterial(materialId);
              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text(success ? 'Document removed from library' : 'Failed to delete document'),
                    backgroundColor: success ? AppColors.success : AppColors.error,
                  ),
                );
              }
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _showUploadMaterialDialog(BuildContext context, WidgetRef ref) {
    final matState = ref.read(materialsProvider);
    final semesters = matState.semesters;

    int? selectedSemesterId = matState.selectedSemesterId ?? (semesters.isNotEmpty ? semesters.first['id'] as int? : null);
    List<Map<String, dynamic>> availableCourses = selectedSemesterId != null
        ? matState.courses.where((c) => c['semester'] == selectedSemesterId || c['semester_id'] == selectedSemesterId).toList()
        : matState.courses;
    int? selectedCourseId = availableCourses.isNotEmpty ? (availableCourses.first['id'] as int?) : null;

    final titleCtrl = TextEditingController();
    final notesCtrl = TextEditingController();
    String category = 'Lecture Note';
    PlatformFile? pickedFile;
    bool isSubmitting = false;
    List<CatalogCourse> courseSuggestions = [];

    const categoriesList = [
      'Lecture Note',
      'Cheat Sheet',
      'Textbook Chapter',
      'Lab Report',
      'Other',
    ];

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (context, setDialogState) {
          final isDark = Theme.of(context).brightness == Brightness.dark;

          return AlertDialog(
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            title: const Row(
              children: [
                Icon(Icons.cloud_upload_rounded, color: AppColors.primary, size: 22),
                SizedBox(width: 8),
                Text('Upload Study Document', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800)),
              ],
            ),
            content: SingleChildScrollView(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Trimester selector
                  DropdownButtonFormField<int>(
                    initialValue: selectedSemesterId,
                    decoration: InputDecoration(
                      labelText: 'Select Trimester *',
                      prefixIcon: const Icon(Icons.calendar_today_rounded, size: 18),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                    items: semesters.map((s) {
                      final id = s['id'] as int;
                      final name = s['name']?.toString() ?? 'Trimester $id';
                      final isCur = s['is_current'] == true;
                      return DropdownMenuItem(
                        value: id,
                        child: Text(isCur ? '$name (Active)' : name),
                      );
                    }).toList(),
                    onChanged: (val) {
                      if (val != null) {
                        setDialogState(() {
                          selectedSemesterId = val;
                          availableCourses = matState.courses
                              .where((c) => c['semester'] == val || c['semester_id'] == val)
                              .toList();
                          selectedCourseId = availableCourses.isNotEmpty ? (availableCourses.first['id'] as int) : null;
                        });
                      }
                    },
                  ),
                  const SizedBox(height: 12),

                  // Course Selector (Strictly filtered by selected trimester)
                  DropdownButtonFormField<int?>(
                    initialValue: selectedCourseId,
                    decoration: InputDecoration(
                      labelText: 'Select Course *',
                      prefixIcon: const Icon(Icons.school_outlined, size: 18),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                    items: availableCourses.isEmpty
                        ? [
                            const DropdownMenuItem<int?>(
                              value: null,
                              enabled: false,
                              child: Text('No courses in this trimester (Add Course first)', style: TextStyle(fontSize: 12, color: Colors.grey)),
                            ),
                          ]
                        : availableCourses.map((c) {
                            final id = c['id'] as int;
                            final code = c['code']?.toString() ?? '';
                            final title = c['title']?.toString() ?? 'Course';
                            return DropdownMenuItem<int?>(
                              value: id,
                              child: Text('[$code] $title', style: const TextStyle(fontSize: 13), overflow: TextOverflow.ellipsis),
                            );
                          }).toList(),
                    onChanged: availableCourses.isEmpty
                        ? null
                        : (val) {
                            if (val != null) setDialogState(() => selectedCourseId = val);
                          },
                  ),
                  const SizedBox(height: 12),

                  // Material Title with Autocomplete from catalog
                  TextField(
                    controller: titleCtrl,
                    decoration: InputDecoration(
                      labelText: 'Document Title *',
                      hintText: 'e.g. Midterm Cheat Sheet & Formulas',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                    onChanged: (val) {
                      setDialogState(() {
                        courseSuggestions = searchCoursesCatalog(val);
                      });
                    },
                  ),
                  if (courseSuggestions.isNotEmpty) ...[
                    const SizedBox(height: 6),
                    Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: courseSuggestions.take(4).map((c) {
                        return ActionChip(
                          avatar: const Icon(Icons.school, size: 14, color: AppColors.primary),
                          label: Text('${c.code} (${c.title})', style: const TextStyle(fontSize: 11)),
                          onPressed: () {
                            setDialogState(() {
                              titleCtrl.text = '${c.code} - ${c.title} Lecture Notes';
                              courseSuggestions = [];
                            });
                          },
                        );
                      }).toList(),
                    ),
                  ],
                  const SizedBox(height: 12),

                  // Category Selector
                  DropdownButtonFormField<String>(
                    initialValue: category,
                    decoration: InputDecoration(
                      labelText: 'Document Category',
                      prefixIcon: const Icon(Icons.category_outlined, size: 18),
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                    ),
                    items: categoriesList.map((cat) => DropdownMenuItem(value: cat, child: Text(cat, style: const TextStyle(fontSize: 13)))).toList(),
                    onChanged: (val) {
                      if (val != null) setDialogState(() => category = val);
                    },
                  ),
                  const SizedBox(height: 14),

                  // File Picker Area
                  const Text('Attach File (PDF, CSV, Image, TXT, DOCX)', style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700)),
                  const SizedBox(height: 6),
                  if (pickedFile == null)
                    InkWell(
                      onTap: () async {
                        final messenger = ScaffoldMessenger.of(context);
                        try {
                          final result = await FilePicker.platform.pickFiles(
                            type: FileType.any,
                            allowMultiple: false,
                          );
                          if (result != null && result.files.isNotEmpty) {
                            setDialogState(() {
                              pickedFile = result.files.first;
                              if (titleCtrl.text.isEmpty) {
                                final nameWithoutExt = pickedFile!.name.split('.').first;
                                titleCtrl.text = nameWithoutExt.replaceAll(RegExp(r'[_\-]'), ' ');
                              }
                            });
                          }
                        } catch (e) {
                          messenger.showSnackBar(
                            SnackBar(content: Text('File picker error: $e')),
                          );
                        }
                      },
                      borderRadius: BorderRadius.circular(12),
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
                        decoration: BoxDecoration(
                          color: isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(
                            color: AppColors.primary.withValues(alpha: 0.35),
                            style: BorderStyle.solid,
                          ),
                        ),
                        child: Column(
                          children: [
                            const Icon(Icons.cloud_upload_outlined, color: AppColors.primary, size: 30),
                            const SizedBox(height: 6),
                            const Text(
                              'Tap to select document from device',
                              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 2),
                            Text(
                              'PDF, CSV, Image, TXT, DOCX supported',
                              style: TextStyle(fontSize: 10.5, color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                            ),
                          ],
                        ),
                      ),
                    )
                  else
                    Container(
                      padding: const EdgeInsets.all(12),
                      decoration: BoxDecoration(
                        color: AppColors.primary.withValues(alpha: 0.1),
                        borderRadius: BorderRadius.circular(12),
                        border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
                      ),
                      child: Row(
                        children: [
                          const Icon(Icons.insert_drive_file_rounded, color: AppColors.primary, size: 24),
                          const SizedBox(width: 10),
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  pickedFile!.name,
                                  style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                                  overflow: TextOverflow.ellipsis,
                                ),
                                Text(
                                  '${(pickedFile!.size / 1024).toStringAsFixed(1)} KB',
                                  style: const TextStyle(fontSize: 10, color: Colors.grey),
                                ),
                              ],
                            ),
                          ),
                          IconButton(
                            icon: const Icon(Icons.close_rounded, size: 18),
                            onPressed: () => setDialogState(() => pickedFile = null),
                          ),
                        ],
                      ),
                    ),
                  const SizedBox(height: 12),

                  // Notes / Description
                  TextField(
                    controller: notesCtrl,
                    maxLines: 3,
                    decoration: InputDecoration(
                      labelText: 'Notes / Topic Overview (Optional)',
                      hintText: 'Chapters, formulas, or key insights covered...',
                      border: OutlineInputBorder(borderRadius: BorderRadius.circular(12)),
                      contentPadding: const EdgeInsets.all(12),
                    ),
                  ),
                ],
              ),
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
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                ),
                onPressed: isSubmitting
                    ? null
                    : () async {
                        if (selectedCourseId == null) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Please select or add a course first')),
                          );
                          return;
                        }
                        if (titleCtrl.text.trim().isEmpty) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('Please enter a document title')),
                          );
                          return;
                        }

                        setDialogState(() => isSubmitting = true);
                        final messenger = ScaffoldMessenger.of(context);

                        final success = await ref.read(materialsProvider.notifier).createMaterial(
                              courseId: selectedCourseId!,
                              title: titleCtrl.text.trim(),
                              category: category,
                              filePath: pickedFile?.path,
                              fileName: pickedFile?.name,
                              contentText: notesCtrl.text.trim().isNotEmpty ? notesCtrl.text.trim() : null,
                            );

                        if (ctx.mounted) {
                          Navigator.pop(ctx);
                          messenger.showSnackBar(
                            SnackBar(
                              content: Text(success
                                  ? 'Study document uploaded and saved locally to device!'
                                  : 'Could not upload document'),
                              backgroundColor: success ? AppColors.success : AppColors.error,
                            ),
                          );
                        }
                      },
                child: isSubmitting
                    ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white))
                    : const Text('Save Material', style: TextStyle(fontWeight: FontWeight.w700)),
              ),
            ],
          );
        },
      ),
    );
  }
}
