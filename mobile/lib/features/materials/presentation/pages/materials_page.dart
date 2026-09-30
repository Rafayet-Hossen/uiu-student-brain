import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
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
                  const SizedBox(height: 10),

                  if (matState.courses.isEmpty)
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
                                const Text('No Courses Added Yet', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w800)),
                                Text(
                                  'Tap "+ Trimester" or "+ Course" to organize your university classes.',
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
                      height: 116,
                      child: ListView.separated(
                        scrollDirection: Axis.horizontal,
                        itemCount: matState.courses.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 10),
                        itemBuilder: (context, index) {
                          final c = matState.courses[index];
                          final courseId = c['id'] as int? ?? 1;
                          final code = c['code']?.toString() ?? 'CSE';
                          final title = c['title']?.toString() ?? 'Course';
                          final semName = c['semester_name']?.toString();

                          return Container(
                            width: 230,
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                              borderRadius: BorderRadius.circular(16),
                              border: Border.all(
                                color: isDark ? AppColors.borderDark : AppColors.borderLight,
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
                                      children: [
                                        Container(
                                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                                          decoration: BoxDecoration(
                                            color: AppColors.primary.withValues(alpha: 0.15),
                                            borderRadius: BorderRadius.circular(4),
                                          ),
                                          child: Text(
                                            code,
                                            style: const TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w800,
                                              color: AppColors.primary,
                                            ),
                                          ),
                                        ),
                                        if (semName != null && semName.isNotEmpty) ...[
                                          const SizedBox(width: 6),
                                          Flexible(
                                            child: Text(
                                              semName,
                                              style: TextStyle(
                                                fontSize: 10,
                                                fontWeight: FontWeight.w600,
                                                color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                              ),
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      ],
                                    ),
                                    const SizedBox(height: 5),
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
                                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: AppColors.primary.withValues(alpha: 0.1),
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
                          );
                        },
                      ),
                    ),
                  const SizedBox(height: 18),

                  // 4. Materials List Header
                  const Text(
                    'Course Documents & Cheat Sheets',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800),
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
                  ),
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
}
