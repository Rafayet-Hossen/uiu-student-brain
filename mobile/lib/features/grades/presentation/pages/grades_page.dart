import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:percent_indicator/circular_percent_indicator.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/data/courses_catalog.dart';
import '../../../../core/widgets/app_button.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/responsive.dart';
import '../providers/grades_provider.dart';

const List<Map<String, String>> _kGradeOptions = [
  {'letter': 'A', 'gpa': '4.00', 'label': 'A (4.00 - Outstanding)'},
  {'letter': 'A-', 'gpa': '3.67', 'label': 'A- (3.67 - Excellent)'},
  {'letter': 'B+', 'gpa': '3.33', 'label': 'B+ (3.33 - Very Good)'},
  {'letter': 'B', 'gpa': '3.00', 'label': 'B (3.00 - Good)'},
  {'letter': 'B-', 'gpa': '2.67', 'label': 'B- (2.67 - Satisfactory)'},
  {'letter': 'C+', 'gpa': '2.33', 'label': 'C+ (2.33 - Above Average)'},
  {'letter': 'C', 'gpa': '2.00', 'label': 'C (2.00 - Retake Candidate)'},
  {'letter': 'D+', 'gpa': '1.67', 'label': 'D+ (1.67 - High Priority)'},
  {'letter': 'D', 'gpa': '1.00', 'label': 'D (1.00 - High Priority)'},
  {'letter': 'F', 'gpa': '0.00', 'label': 'F (0.00 - Mandatory Retake)'},
];

const List<double> _kCreditOptions = [3.0, 1.5, 1.0, 2.0, 4.0];

class GradesPage extends ConsumerStatefulWidget {
  const GradesPage({super.key});

  @override
  ConsumerState<GradesPage> createState() => _GradesPageState();
}

class _GradesPageState extends ConsumerState<GradesPage> {

  Widget _buildFormattedMarkdownText(
    String rawText, {
    TextStyle? baseStyle,
  }) {
    final cleanText = rawText.trim();
    if (cleanText.isEmpty) return const SizedBox.shrink();

    // Pattern to parse **bold** or *italic* or regular text chunks
    final regex = RegExp(r'(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|([^*]+)');
    final matches = regex.allMatches(cleanText);

    final defaultStyle = baseStyle ?? const TextStyle(fontSize: 13, height: 1.4);

    final spans = <TextSpan>[];
    for (final match in matches) {
      if (match.group(1) != null) {
        // Bold chunk inside **...**
        final boldContent = match.group(2) ?? '';
        spans.add(
          TextSpan(
            text: boldContent,
            style: defaultStyle.copyWith(
              fontWeight: FontWeight.w800,
              color: defaultStyle.color,
            ),
          ),
        );
      } else if (match.group(3) != null) {
        // Italic chunk inside *...*
        final italicContent = match.group(4) ?? '';
        spans.add(
          TextSpan(
            text: italicContent,
            style: defaultStyle.copyWith(
              fontStyle: FontStyle.italic,
            ),
          ),
        );
      } else if (match.group(5) != null) {
        // Normal text chunk
        spans.add(
          TextSpan(
            text: match.group(5)!,
            style: defaultStyle,
          ),
        );
      }
    }

    return Text.rich(
      TextSpan(children: spans),
    );
  }



  // ==========================================
  // ADD GRADE MANUALLY DIALOG WITH AUTOCOMPLETE
  // ==========================================
  void _showAddGradeDialog() {
    final codeCtrl = TextEditingController();
    final nameCtrl = TextEditingController();
    final semCtrl = TextEditingController(text: 'Spring 2026');
    double selectedCredits = 3.0;
    Map<String, String> selectedGrade = _kGradeOptions[6]; // C 2.00
    bool isRetake = true;
    List<CatalogCourse> suggestions = [];
    bool isSubmitting = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            final isDark = Theme.of(ctx).brightness == Brightness.dark;

            return Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
                left: 20,
                right: 20,
                top: 20,
              ),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.15),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.add_task_rounded,
                                  color: AppColors.primary, size: 20),
                            ),
                            const SizedBox(width: 10),
                            const Text(
                              'Add Course Grade',
                              style: TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.w800),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),

                    // Course Code with catalog autocomplete
                    TextField(
                      controller: codeCtrl,
                      textCapitalization: TextCapitalization.characters,
                      decoration: InputDecoration(
                        labelText: 'Course Code (e.g. CSE 220)',
                        hintText: 'Type code to search UIU catalog...',
                        prefixIcon: const Icon(Icons.search, size: 20),
                        filled: true,
                        fillColor: isDark
                            ? Colors.white.withValues(alpha: 0.05)
                            : Colors.grey.shade100,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                      ),
                      onChanged: (val) {
                        setModalState(() {
                          suggestions = searchCoursesCatalog(val);
                        });
                      },
                    ),

                    // Suggestions Chips
                    if (suggestions.isNotEmpty) ...[
                      const SizedBox(height: 8),
                      SizedBox(
                        height: 38,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: suggestions.length.clamp(0, 6),
                          separatorBuilder: (_, __) => const SizedBox(width: 8),
                          itemBuilder: (context, i) {
                            final item = suggestions[i];
                            return ActionChip(
                              label: Text(
                                '${item.code} - ${item.title}',
                                style: const TextStyle(fontSize: 12),
                              ),
                              avatar: const Icon(Icons.bookmark_outline,
                                  size: 14, color: AppColors.primary),
                              backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                              onPressed: () {
                                setModalState(() {
                                  codeCtrl.text = item.code;
                                  nameCtrl.text = item.title;
                                  selectedCredits = item.credits;
                                  suggestions = [];
                                });
                              },
                            );
                          },
                        ),
                      ),
                    ],
                    const SizedBox(height: 12),

                    // Course Name
                    TextField(
                      controller: nameCtrl,
                      decoration: InputDecoration(
                        labelText: 'Course Name',
                        hintText: 'e.g. Data Structures',
                        prefixIcon: const Icon(Icons.book_outlined, size: 20),
                        filled: true,
                        fillColor: isDark
                            ? Colors.white.withValues(alpha: 0.05)
                            : Colors.grey.shade100,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),

                    // Credits & Grade Row
                    Row(
                      children: [
                        // Credits Dropdown
                        Expanded(
                          child: DropdownButtonFormField<double>(
                            initialValue: selectedCredits,
                            decoration: InputDecoration(
                              labelText: 'Credits',
                              filled: true,
                              fillColor: isDark
                                  ? Colors.white.withValues(alpha: 0.05)
                                  : Colors.grey.shade100,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide.none,
                              ),
                            ),
                            items: _kCreditOptions.map((cr) {
                              return DropdownMenuItem(
                                value: cr,
                                child: Text('$cr cr'),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) {
                                setModalState(() => selectedCredits = val);
                              }
                            },
                          ),
                        ),
                        const SizedBox(width: 12),

                        // Grade Dropdown
                        Expanded(
                          flex: 2,
                          child: DropdownButtonFormField<Map<String, String>>(
                            initialValue: selectedGrade,
                            decoration: InputDecoration(
                              labelText: 'Grade Received',
                              filled: true,
                              fillColor: isDark
                                  ? Colors.white.withValues(alpha: 0.05)
                                  : Colors.grey.shade100,
                              border: OutlineInputBorder(
                                borderRadius: BorderRadius.circular(12),
                                borderSide: BorderSide.none,
                              ),
                            ),
                            items: _kGradeOptions.map((g) {
                              return DropdownMenuItem(
                                value: g,
                                child: Text(g['label']!,
                                    style: const TextStyle(fontSize: 12)),
                              );
                            }).toList(),
                            onChanged: (val) {
                              if (val != null) {
                                setModalState(() {
                                  selectedGrade = val;
                                  final gp = double.tryParse(val['gpa']!) ?? 4.0;
                                  isRetake = gp < 3.00;
                                });
                              }
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),

                    // Trimester / Semester
                    TextField(
                      controller: semCtrl,
                      decoration: InputDecoration(
                        labelText: 'Trimester / Term',
                        hintText: 'e.g. Spring 2026',
                        prefixIcon: const Icon(Icons.calendar_month_outlined, size: 20),
                        filled: true,
                        fillColor: isDark
                            ? Colors.white.withValues(alpha: 0.05)
                            : Colors.grey.shade100,
                        border: OutlineInputBorder(
                          borderRadius: BorderRadius.circular(12),
                          borderSide: BorderSide.none,
                        ),
                      ),
                    ),
                    const SizedBox(height: 8),

                    // Retake Checkbox
                    CheckboxListTile(
                      contentPadding: EdgeInsets.zero,
                      value: isRetake,
                      title: const Text(
                        'Mark as Retake Candidate',
                        style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                      subtitle: const Text(
                        'Include in AI CGPA Jump & Retake Advisor analysis',
                        style: TextStyle(fontSize: 11, color: Colors.grey),
                      ),
                      activeColor: AppColors.primary,
                      onChanged: (val) {
                        setModalState(() => isRetake = val ?? false);
                      },
                    ),
                    const SizedBox(height: 16),

                    AppButton(
                      label: 'Save Course Grade',
                      isLoading: isSubmitting,
                      onPressed: () async {
                        final code = codeCtrl.text.trim();
                        final name = nameCtrl.text.trim();
                        if (code.isEmpty) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            const SnackBar(content: Text('Please enter course code')),
                          );
                          return;
                        }
                        setModalState(() => isSubmitting = true);
                        final gradePoint =
                            double.tryParse(selectedGrade['gpa'] ?? '0.00') ?? 0.0;
                        final gradeLetter = selectedGrade['letter'] ?? 'C';
                        final messenger = ScaffoldMessenger.of(context);

                        final ok = await ref
                            .read(gradesProvider.notifier)
                            .createCourseGrade({
                          'course_code': code,
                          'course_name': name.isEmpty ? code : name,
                          'credits': selectedCredits,
                          'grade_point': gradePoint,
                          'grade_letter': gradeLetter,
                          'semester': semCtrl.text.trim(),
                          'is_retake': isRetake,
                        });

                        setModalState(() => isSubmitting = false);
                        if (ok) {
                          if (ctx.mounted) Navigator.pop(ctx);
                          messenger.showSnackBar(
                            SnackBar(
                              content: Text('Saved $code ($gradeLetter) successfully!'),
                              backgroundColor: AppColors.success,
                            ),
                          );
                        }
                      },
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  // ==========================================
  // UPLOAD TRANSCRIPT DIALOG (AI EXTRACTION)
  // ==========================================
  void _showUploadTranscriptDialog() {
    PlatformFile? pickedFile;
    final textCtrl = TextEditingController();
    int activeTab = 0; // 0 = File, 1 = Raw Text
    bool isProcessing = false;

    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (ctx) {
        return StatefulBuilder(
          builder: (ctx, setModalState) {
            final isDark = Theme.of(ctx).brightness == Brightness.dark;

            return Container(
              padding: EdgeInsets.only(
                bottom: MediaQuery.of(ctx).viewInsets.bottom + 20,
                left: 20,
                right: 20,
                top: 20,
              ),
              decoration: BoxDecoration(
                color: isDark ? const Color(0xFF1E293B) : Colors.white,
                borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
              ),
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(8),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.15),
                                shape: BoxShape.circle,
                              ),
                              child: const Icon(Icons.document_scanner_rounded,
                                  color: AppColors.primary, size: 20),
                            ),
                            const SizedBox(width: 10),
                            const Text(
                              'Import Transcript (AI)',
                              style: TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.w800),
                            ),
                          ],
                        ),
                        IconButton(
                          icon: const Icon(Icons.close),
                          onPressed: () => Navigator.pop(ctx),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Gemini AI will scan courses, credits & grades to automatically recalculate CGPA & retake roadmap.',
                      style: TextStyle(
                        fontSize: 12,
                        color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                      ),
                    ),
                    const SizedBox(height: 14),

                    // Tab selector (File vs Text)
                    Row(
                      children: [
                        Expanded(
                          child: ChoiceChip(
                            label: const Center(
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.upload_file, size: 16),
                                  SizedBox(width: 6),
                                  Text('File Upload'),
                                ],
                              ),
                            ),
                            selected: activeTab == 0,
                            selectedColor: AppColors.primary.withValues(alpha: 0.2),
                            onSelected: (val) {
                              if (val) setModalState(() => activeTab = 0);
                            },
                          ),
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: ChoiceChip(
                            label: const Center(
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.text_snippet_outlined, size: 16),
                                  SizedBox(width: 6),
                                  Text('Paste Text / CSV'),
                                ],
                              ),
                            ),
                            selected: activeTab == 1,
                            selectedColor: AppColors.primary.withValues(alpha: 0.2),
                            onSelected: (val) {
                              if (val) setModalState(() => activeTab = 1);
                            },
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),

                    if (activeTab == 0) ...[
                      // File Upload Container
                      InkWell(
                        onTap: () async {
                          final result = await FilePicker.platform.pickFiles(
                            type: FileType.custom,
                            allowedExtensions: [
                              'pdf',
                              'csv',
                              'txt',
                              'jpg',
                              'jpeg',
                              'png'
                            ],
                          );
                          if (result != null && result.files.isNotEmpty) {
                            setModalState(() {
                              pickedFile = result.files.first;
                            });
                          }
                        },
                        borderRadius: BorderRadius.circular(16),
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                              vertical: 28, horizontal: 16),
                          decoration: BoxDecoration(
                            border: Border.all(
                              color: AppColors.primary.withValues(alpha: 0.4),
                              width: 1.5,
                            ),
                            borderRadius: BorderRadius.circular(16),
                            color: AppColors.primary.withValues(alpha: 0.05),
                          ),
                          child: Column(
                            children: [
                              Icon(
                                pickedFile != null
                                    ? Icons.check_circle_outline
                                    : Icons.cloud_upload_outlined,
                                size: 36,
                                color: pickedFile != null
                                    ? AppColors.success
                                    : AppColors.primary,
                              ),
                              const SizedBox(height: 10),
                              Text(
                                pickedFile != null
                                    ? pickedFile!.name
                                    : 'Tap to select PDF, Image or CSV',
                                style: const TextStyle(
                                    fontWeight: FontWeight.w700, fontSize: 13),
                                textAlign: TextAlign.center,
                              ),
                              if (pickedFile != null) ...[
                                const SizedBox(height: 4),
                                Text(
                                  '${(pickedFile!.size / 1024).toStringAsFixed(1)} KB - Ready to analyze',
                                  style: const TextStyle(
                                      fontSize: 11, color: AppColors.success),
                                ),
                              ] else ...[
                                const SizedBox(height: 4),
                                const Text(
                                  'Supports UIU Portal Grade Sheets & Screenshots',
                                  style: TextStyle(
                                      fontSize: 11, color: Colors.grey),
                                ),
                              ],
                            ],
                          ),
                        ),
                      ),
                    ] else ...[
                      // Raw Text / CSV input
                      TextField(
                        controller: textCtrl,
                        maxLines: 6,
                        decoration: InputDecoration(
                          hintText:
                              "Paste transcript lines, portal text, or CSV rows:\n\nCSE 220, Data Structures, 3.0, C+\nMATH 187, Linear Algebra, 3.0, B-\nPHY 102, Physics II, 3.0, C",
                          hintStyle:
                              const TextStyle(fontSize: 12, color: Colors.grey),
                          filled: true,
                          fillColor: isDark
                              ? Colors.white.withValues(alpha: 0.05)
                              : Colors.grey.shade100,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(12),
                            borderSide: BorderSide.none,
                          ),
                        ),
                      ),
                    ],
                    const SizedBox(height: 18),

                    AppButton(
                      label: 'Analyze & Import Grades',
                      isLoading: isProcessing,
                      onPressed: () async {
                        final rawText = textCtrl.text.trim();
                        final filePath = pickedFile?.path;
                        final fileName = pickedFile?.name;

                        if (activeTab == 0 && (filePath == null || filePath.isEmpty)) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            const SnackBar(
                                content: Text('Please select a file first')),
                          );
                          return;
                        }
                        if (activeTab == 1 && rawText.isEmpty) {
                          ScaffoldMessenger.of(ctx).showSnackBar(
                            const SnackBar(
                                content: Text('Please paste transcript text')),
                          );
                          return;
                        }

                        setModalState(() => isProcessing = true);
                        final messenger = ScaffoldMessenger.of(context);
                        final result = await ref
                            .read(gradesProvider.notifier)
                            .uploadTranscript(
                              filePath: activeTab == 0 ? filePath : null,
                              fileName: activeTab == 0 ? fileName : null,
                              rawText: activeTab == 1 ? rawText : null,
                            );

                        setModalState(() => isProcessing = false);
                        if (result != null) {
                          if (ctx.mounted) Navigator.pop(ctx);
                          final count = result['count'] ?? 0;
                          final retakeCount = result['retake_count'] ?? 0;
                          messenger.showSnackBar(
                            SnackBar(
                              content: Text(
                                'Imported $count courses ($retakeCount retakes). Roadmap updated!',
                              ),
                              backgroundColor: AppColors.success,
                            ),
                          );
                        } else {
                          messenger.showSnackBar(
                            const SnackBar(
                              content: Text(
                                  'Could not extract courses. Please check file format.'),
                              backgroundColor: AppColors.error,
                            ),
                          );
                        }
                      },
                    ),
                  ],
                ),
              ),
            );
          },
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final gradesState = ref.watch(gradesProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final plan = gradesState.plan;
    final requiredGpa = plan?.calculatedRequiredGpa ?? 3.94;
    final isFeasible = plan?.isFeasible ?? true;
    final remainingCredits = plan?.remainingCredits ?? 95.0;

    final sim = gradesState.simulation;
    final retakeData = gradesState.retakeData;
    final topSingle = retakeData['top_single'] as Map<String, dynamic>?;
    final duoData = retakeData['recommended_duo'] as Map<String, dynamic>?;
    final narrative =
        retakeData['advisor_narrative'] as Map<String, dynamic>?;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Grade & GPA Planner'),
        actions: [
          IconButton(
            tooltip: 'Degree Targets & Profile',
            icon: const Icon(Icons.tune_rounded),
            onPressed: () => context.push('/profile'),
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
              constraints:
                  BoxConstraints(maxWidth: Responsive.maxContentWidth(context)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // ==========================================
                  // 1. TOP ACTION ROW: ADD GRADE & TRANSCRIPT
                  // ==========================================
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _showAddGradeDialog,
                          icon: const Icon(Icons.add, size: 18),
                          label: const Text('Add Grade',
                              style: TextStyle(fontWeight: FontWeight.w700)),
                          style: OutlinedButton.styleFrom(
                            foregroundColor: AppColors.primary,
                            side: const BorderSide(color: AppColors.primary),
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: _showUploadTranscriptDialog,
                          icon: const Icon(Icons.document_scanner_outlined,
                              size: 18),
                          label: const Text('Transcript AI',
                              style: TextStyle(fontWeight: FontWeight.w700)),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.symmetric(vertical: 12),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(12),
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),

                  // ==========================================
                  // 2. THREE-PILLARS CGPA HERO BANNER
                  // ==========================================
                  GlassCard(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Wrap(
                          alignment: WrapAlignment.spaceBetween,
                          runAlignment: WrapAlignment.center,
                          crossAxisAlignment: WrapCrossAlignment.center,
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            const Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Icon(Icons.timeline_rounded,
                                    color: AppColors.primary, size: 20),
                                SizedBox(width: 8),
                                Text(
                                  'Live CGPA Simulation Hub',
                                  style: TextStyle(
                                      fontSize: 16,
                                      fontWeight: FontWeight.w800),
                                ),
                              ],
                            ),
                            if (sim.cgpaJump > 0)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.success.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                  border: Border.all(
                                      color:
                                          AppColors.success.withValues(alpha: 0.3)),
                                ),
                                child: Text(
                                  '+${sim.cgpaJump.toStringAsFixed(2)} CGPA Jump',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.success,
                                  ),
                                ),
                              ),
                          ],
                        ),
                        const SizedBox(height: 16),

                        // Three Pillars: Baseline -> Target -> Projected (Fluid & Fully Responsive)
                        Row(
                          children: [
                            // Pillar 1: Baseline
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? Colors.white.withValues(alpha: 0.04)
                                      : Colors.grey.shade100,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isDark ? AppColors.borderDark : AppColors.borderLight,
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text('Current CGPA',
                                          style: TextStyle(
                                              fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600)),
                                    ),
                                    const SizedBox(height: 3),
                                    FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text(
                                        sim.baselineCgpa.toStringAsFixed(2),
                                        style: const TextStyle(
                                            fontSize: 20,
                                            fontWeight: FontWeight.w900),
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text(
                                        '${retakeData['effective_credits'] ?? plan?.completedCredits ?? 45.0} cr done',
                                        style: const TextStyle(
                                            fontSize: 9.5, color: Colors.grey),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),

                            // Pillar 2: Target
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                decoration: BoxDecoration(
                                  color: isDark
                                      ? Colors.white.withValues(alpha: 0.04)
                                      : Colors.grey.shade100,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                    color: isDark ? AppColors.borderDark : AppColors.borderLight,
                                  ),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text('Target Goal',
                                          style: TextStyle(
                                              fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600)),
                                    ),
                                    const SizedBox(height: 3),
                                    FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text(
                                        sim.targetCgpa.toStringAsFixed(2),
                                        style: const TextStyle(
                                            fontSize: 20,
                                            fontWeight: FontWeight.w900,
                                            color: AppColors.primary),
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text(
                                        'Gap: ${(sim.targetCgpa - sim.baselineCgpa).clamp(0.0, 4.0).toStringAsFixed(2)}',
                                        style: const TextStyle(
                                            fontSize: 9.5, color: Colors.grey),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),

                            // Pillar 3: Projected Simulated
                            Expanded(
                              child: Container(
                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 10),
                                decoration: BoxDecoration(
                                  color: AppColors.success.withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(
                                      color:
                                          AppColors.success.withValues(alpha: 0.35)),
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text('Projected CGPA',
                                          style: TextStyle(
                                              fontSize: 11,
                                              color: AppColors.success,
                                              fontWeight: FontWeight.w700)),
                                    ),
                                    const SizedBox(height: 3),
                                    FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text(
                                        sim.projectedCgpa.toStringAsFixed(2),
                                        style: const TextStyle(
                                            fontSize: 20,
                                            fontWeight: FontWeight.w900,
                                            color: AppColors.success),
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    FittedBox(
                                      fit: BoxFit.scaleDown,
                                      child: Text(
                                        sim.selectedCount > 0
                                            ? '${sim.gapClosedPercent}% closed'
                                            : 'Select retakes',
                                        style: const TextStyle(
                                            fontSize: 9.5,
                                            fontWeight: FontWeight.w600,
                                            color: AppColors.success),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                          ],
                        ),

                        // Interactive Gap Closure Tracker Bar
                        const SizedBox(height: 12),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                          decoration: BoxDecoration(
                            color: isDark ? Colors.white.withValues(alpha: 0.03) : Colors.black.withValues(alpha: 0.02),
                            borderRadius: BorderRadius.circular(10),
                            border: Border.all(
                              color: isDark ? AppColors.borderDark : AppColors.borderLight,
                            ),
                          ),
                          child: Column(
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Text(
                                    sim.selectedCount > 0
                                        ? 'Simulation: ${sim.selectedCount} retake${sim.selectedCount > 1 ? "s" : ""} active'
                                        : 'Simulation: Pick courses below to see CGPA boost',
                                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                                  ),
                                  Text(
                                    '${sim.gapClosedPercent}% Goal Reached',
                                    style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w800,
                                      color: sim.gapClosedPercent > 0 ? AppColors.success : AppColors.primary,
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 6),
                              ClipRRect(
                                borderRadius: BorderRadius.circular(999),
                                child: LinearProgressIndicator(
                                  value: (sim.gapClosedPercent / 100.0).clamp(0.0, 1.0),
                                  minHeight: 5,
                                  backgroundColor: isDark ? Colors.white10 : Colors.black12,
                                  valueColor: AlwaysStoppedAnimation<Color>(
                                    sim.gapClosedPercent > 0 ? AppColors.success : AppColors.primary,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  // ==========================================
                  // 3. AI STRATEGIC ADVISOR NARRATIVE CARD
                  // ==========================================
                  if (narrative != null) ...[
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
                                child: const Icon(Icons.auto_awesome,
                                    color: AppColors.primary, size: 18),
                              ),
                              const SizedBox(width: 10),
                              Expanded(
                                child: Text(
                                  narrative['headline']?.toString() ??
                                      'AI Strategic Retake Roadmap',
                                  style: const TextStyle(
                                      fontSize: 15,
                                      fontWeight: FontWeight.w800),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          _buildFormattedMarkdownText(
                            narrative['summary']?.toString() ?? '',
                            baseStyle: TextStyle(
                              fontSize: 13,
                              height: 1.4,
                              color: isDark
                                  ? AppColors.textDarkMuted
                                  : AppColors.textLightMuted,
                            ),
                          ),
                          if (narrative['action_plan'] is List) ...[
                            const SizedBox(height: 12),
                            const Text(
                              'Action Steps for Maximum ROI:',
                              style: TextStyle(
                                  fontSize: 12, fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 6),
                            ...(narrative['action_plan'] as List).map((step) {
                              return Padding(
                                padding: const EdgeInsets.only(bottom: 6),
                                child: Row(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    const Text('• ',
                                        style: TextStyle(
                                            color: AppColors.primary,
                                            fontWeight: FontWeight.bold)),
                                    Expanded(
                                      child: _buildFormattedMarkdownText(
                                        step.toString(),
                                        baseStyle: TextStyle(
                                          fontSize: 12,
                                          height: 1.3,
                                          color: isDark
                                              ? AppColors.textDarkMuted
                                              : AppColors.textLightMuted,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              );
                            }),
                          ],
                          if (narrative['workload_warning'] != null) ...[
                            const SizedBox(height: 8),
                            Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(
                                color: AppColors.warning.withValues(alpha: 0.1),
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                    color:
                                        AppColors.warning.withValues(alpha: 0.3)),
                              ),
                              child: Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Icon(Icons.bolt,
                                      color: AppColors.warning, size: 16),
                                  const SizedBox(width: 6),
                                  Expanded(
                                    child: _buildFormattedMarkdownText(
                                      narrative['workload_warning'].toString(),
                                      baseStyle: const TextStyle(
                                          fontSize: 11,
                                          color: AppColors.warning,
                                          fontWeight: FontWeight.w600),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // ==========================================
                  // 4. PRIORITY 1 RETAKE CARD (HIGHEST ROI)
                  // ==========================================
                  if (topSingle != null) ...[
                    GlassCard(
                      padding: const EdgeInsets.all(18),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Wrap(
                            alignment: WrapAlignment.spaceBetween,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            spacing: 8,
                            runSpacing: 6,
                            children: [
                              Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 10, vertical: 4),
                                decoration: BoxDecoration(
                                  color: AppColors.primary.withValues(alpha: 0.15),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Text(
                                  topSingle['strategy_tag']?.toString() ??
                                      'Priority 1: Highest ROI',
                                  style: const TextStyle(
                                    fontSize: 11,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.primary,
                                  ),
                                ),
                              ),
                              Text(
                                '+${topSingle['cgpa_jump_4']} CGPA Jump',
                                style: const TextStyle(
                                  fontSize: 13,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.success,
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 10),
                          Text(
                            '${topSingle['course_code']} - ${topSingle['course_name']}',
                            style: const TextStyle(
                                fontSize: 15, fontWeight: FontWeight.w800),
                          ),
                          const SizedBox(height: 6),
                          Wrap(
                            spacing: 8,
                            runSpacing: 4,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            children: [
                              Text(
                                'Current: ${topSingle['current_grade_letter']} (${topSingle['current_grade_point']})',
                                style: const TextStyle(
                                    fontSize: 12, color: Colors.grey),
                              ),
                              const Icon(Icons.arrow_forward,
                                  size: 14, color: AppColors.primary),
                              Text(
                                'Target A (4.00) ➔ ${topSingle['projected_cgpa_4']} CGPA',
                                style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w700,
                                    color: AppColors.success),
                              ),
                            ],
                          ),
                          if (topSingle['familiarity_label'] != null) ...[
                            const SizedBox(height: 4),
                            Text(
                              'Study Habit Familiarity: ${topSingle['familiarity_label']}',
                              style: const TextStyle(
                                  fontSize: 11, color: Colors.grey),
                            ),
                          ],
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // ==========================================
                  // 5. RECOMMENDED DUAL SYNERGY CARD
                  // ==========================================
                  if (duoData != null) ...[
                    GlassCard(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Wrap(
                            alignment: WrapAlignment.spaceBetween,
                            crossAxisAlignment: WrapCrossAlignment.center,
                            spacing: 8,
                            runSpacing: 6,
                            children: [
                              const Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(Icons.hub_outlined,
                                      size: 18, color: AppColors.primary),
                                  SizedBox(width: 8),
                                  Text(
                                    'Dual Retake Synergy',
                                    style: TextStyle(
                                        fontSize: 14,
                                        fontWeight: FontWeight.w800),
                                  ),
                                ],
                              ),
                              Text(
                                '+${duoData['combined_cgpa_jump']} Combined Jump',
                                style: const TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w800,
                                    color: AppColors.success),
                              ),
                            ],
                          ),
                          const SizedBox(height: 8),
                          _buildFormattedMarkdownText(
                            'Retaking both courses elevates your cumulative CGPA to ${duoData['projected_cgpa']} (${duoData['target_gap_closed_percent']}% of target gap closed).',
                            baseStyle: TextStyle(
                              fontSize: 12,
                              color: isDark
                                  ? AppColors.textDarkMuted
                                  : AppColors.textLightMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 16),
                  ],

                  // ==========================================
                  // 6. RECORDED COURSES & INTERACTIVE SIMULATION
                  // ==========================================
                  GlassCard(
                    padding: const EdgeInsets.all(18),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'My Course Grades (${gradesState.courses.length})',
                              style: const TextStyle(
                                  fontSize: 15, fontWeight: FontWeight.w800),
                            ),
                            Row(
                              children: [
                                TextButton(
                                  style: TextButton.styleFrom(
                                      padding: EdgeInsets.zero,
                                      minimumSize: const Size(60, 28)),
                                  onPressed: () => ref
                                      .read(gradesProvider.notifier)
                                      .selectAllRetakes(),
                                  child: const Text('Select All',
                                      style: TextStyle(fontSize: 11)),
                                ),
                                const SizedBox(width: 8),
                                TextButton(
                                  style: TextButton.styleFrom(
                                      padding: EdgeInsets.zero,
                                      minimumSize: const Size(50, 28)),
                                  onPressed: () => ref
                                      .read(gradesProvider.notifier)
                                      .clearRetakeSelection(),
                                  child: const Text('Clear',
                                      style: TextStyle(
                                          fontSize: 11, color: Colors.grey)),
                                ),
                              ],
                            ),
                          ],
                        ),
                        const SizedBox(height: 4),
                        const Text(
                          'Check courses below to simulate how upgrading to 4.00 boosts your CGPA in real-time.',
                          style: TextStyle(fontSize: 11, color: Colors.grey),
                        ),
                        const SizedBox(height: 12),

                        if (gradesState.courses.isEmpty)
                          Container(
                            padding: const EdgeInsets.symmetric(vertical: 24),
                            alignment: Alignment.center,
                            child: Column(
                              children: [
                                const Icon(Icons.school_outlined,
                                    size: 36, color: Colors.grey),
                                const SizedBox(height: 8),
                                const Text(
                                  'No courses recorded yet',
                                  style: TextStyle(
                                      fontWeight: FontWeight.w700,
                                      fontSize: 13),
                                ),
                                const SizedBox(height: 4),
                                const Text(
                                  'Tap "+ Add Grade" or "Transcript AI" above to get started',
                                  style: TextStyle(
                                      fontSize: 11, color: Colors.grey),
                                ),
                              ],
                            ),
                          )
                        else
                          ListView.separated(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            itemCount: gradesState.courses.length,
                            separatorBuilder: (_, __) =>
                                const Divider(height: 14),
                            itemBuilder: (context, i) {
                              final course = gradesState.courses[i];
                              final isSelected = gradesState.selectedRetakeIds
                                  .contains(course.id);
                              final canRetake =
                                  course.gradePoint < 3.50 || course.isRetake;

                              return InkWell(
                                onTap: canRetake
                                    ? () => ref
                                        .read(gradesProvider.notifier)
                                        .toggleRetakeSelection(course.id)
                                    : null,
                                borderRadius: BorderRadius.circular(10),
                                child: Padding(
                                  padding:
                                      const EdgeInsets.symmetric(vertical: 4),
                                  child: Row(
                                    children: [
                                      // Checkbox for retake simulation
                                      if (canRetake)
                                        Checkbox(
                                          value: isSelected,
                                          activeColor: AppColors.primary,
                                          onChanged: (_) => ref
                                              .read(gradesProvider.notifier)
                                              .toggleRetakeSelection(course.id),
                                        )
                                      else
                                        const SizedBox(
                                          width: 48,
                                          child: Icon(Icons.check,
                                              size: 16,
                                              color: AppColors.success),
                                        ),

                                      // Course Code & Info
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment:
                                              CrossAxisAlignment.start,
                                          children: [
                                            Row(
                                              children: [
                                                Text(
                                                  course.courseCode,
                                                  style: const TextStyle(
                                                      fontWeight:
                                                          FontWeight.w800,
                                                      fontSize: 13),
                                                ),
                                                const SizedBox(width: 8),
                                                Text(
                                                  '${course.credits} cr',
                                                  style: const TextStyle(
                                                      fontSize: 11,
                                                      color: Colors.grey),
                                                ),
                                                if (course.semester.isNotEmpty) ...[
                                                  const SizedBox(width: 6),
                                                  Text(
                                                    '• ${course.semester}',
                                                    style: const TextStyle(
                                                        fontSize: 10,
                                                        color: Colors.grey),
                                                  ),
                                                ],
                                              ],
                                            ),
                                            const SizedBox(height: 2),
                                            Text(
                                              course.courseName,
                                              style: TextStyle(
                                                fontSize: 12,
                                                color: isDark
                                                    ? AppColors.textDarkMuted
                                                    : AppColors.textLightMuted,
                                              ),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ],
                                        ),
                                      ),

                                      // Grade Badge
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 4),
                                        decoration: BoxDecoration(
                                          color: _getGradeColor(course.gradeLetter)
                                              .withValues(alpha: 0.15),
                                          borderRadius:
                                              BorderRadius.circular(6),
                                        ),
                                        child: Text(
                                          '${course.gradeLetter} (${course.gradePoint.toStringAsFixed(2)})',
                                          style: TextStyle(
                                            fontSize: 11,
                                            fontWeight: FontWeight.w800,
                                            color: _getGradeColor(
                                                course.gradeLetter),
                                          ),
                                        ),
                                      ),

                                      // Delete Course Button
                                      IconButton(
                                        icon: const Icon(Icons.delete_outline_rounded,
                                            size: 18, color: Colors.redAccent),
                                        tooltip: 'Delete Course',
                                        onPressed: () async {
                                          final confirm = await showDialog<bool>(
                                            context: context,
                                            builder: (dCtx) => AlertDialog(
                                              title: const Text('Delete Grade?'),
                                              content: Text(
                                                  'Are you sure you want to remove ${course.courseCode} from your record?'),
                                              actions: [
                                                TextButton(
                                                  onPressed: () =>
                                                      Navigator.pop(dCtx, false),
                                                  child: const Text('Cancel'),
                                                ),
                                                TextButton(
                                                  onPressed: () =>
                                                      Navigator.pop(dCtx, true),
                                                  child: const Text('Delete',
                                                      style: TextStyle(
                                                          color:
                                                              AppColors.error,
                                                          fontWeight: FontWeight.bold)),
                                                ),
                                              ],
                                            ),
                                          );
                                          if (confirm == true && context.mounted) {
                                            final ok = await ref
                                                .read(gradesProvider.notifier)
                                                .deleteCourseGrade(course.id);
                                            if (ok && context.mounted) {
                                              ScaffoldMessenger.of(context).showSnackBar(
                                                SnackBar(
                                                  content: Text('${course.courseCode} removed successfully'),
                                                  backgroundColor: AppColors.success,
                                                  duration: const Duration(seconds: 2),
                                                ),
                                              );
                                            }
                                          }
                                        },
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

                  // ==========================================
                  // 7. REQUIRED GPA GAUGE CARD
                  // ==========================================
                  GlassCard(
                    padding: const EdgeInsets.symmetric(
                        horizontal: 20, vertical: 24),
                    child: Column(
                      children: [
                        CircularPercentIndicator(
                          radius: 70.0,
                          lineWidth: 12.0,
                          animation: true,
                          percent: (requiredGpa / 4.0).clamp(0.0, 1.0),
                          center: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Text(
                                requiredGpa.toStringAsFixed(2),
                                style: TextStyle(
                                  fontSize: 26,
                                  fontWeight: FontWeight.w900,
                                  color: isFeasible
                                      ? AppColors.primary
                                      : AppColors.warning,
                                ),
                              ),
                              const Text(
                                'Required GPA',
                                style: TextStyle(
                                    fontSize: 10,
                                    color: Colors.grey,
                                    fontWeight: FontWeight.w700),
                              ),
                            ],
                          ),
                          circularStrokeCap: CircularStrokeCap.round,
                          progressColor:
                              isFeasible ? AppColors.primary : AppColors.warning,
                          backgroundColor: isDark
                              ? AppColors.surfaceDarkSubtle
                              : AppColors.surfaceLightSubtle,
                        ),
                        const SizedBox(height: 14),

                        // Feasibility Badge
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 6),
                          decoration: BoxDecoration(
                            color: (isFeasible
                                    ? AppColors.success
                                    : AppColors.warning)
                                .withValues(alpha: 0.15),
                            borderRadius: BorderRadius.circular(9999),
                            border: Border.all(
                              color: (isFeasible
                                      ? AppColors.success
                                      : AppColors.warning)
                                  .withValues(alpha: 0.4),
                            ),
                          ),
                          child: Text(
                            isFeasible
                                ? 'Target Achievable'
                                : 'Challenging Target (> 4.00)',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w800,
                              color: isFeasible
                                  ? AppColors.success
                                  : AppColors.warning,
                            ),
                          ),
                        ),
                        const SizedBox(height: 14),

                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceAround,
                          children: [
                            _buildInfoColumn('Completed',
                                '${plan?.completedCredits ?? 45.0} cr'),
                            _buildInfoColumn('Remaining', '$remainingCredits cr'),
                            _buildInfoColumn('Target',
                                '${plan?.targetGpa.toStringAsFixed(2) ?? "3.50"} GPA'),
                          ],
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 16),

                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Color _getGradeColor(String letter) {
    final clean = letter.toUpperCase().trim();
    if (clean.startsWith('A')) return AppColors.success;
    if (clean.startsWith('B')) return AppColors.primary;
    if (clean.startsWith('C')) return AppColors.warning;
    return AppColors.error;
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
          style: const TextStyle(
              fontSize: 11, color: Colors.grey, fontWeight: FontWeight.w600),
        ),
      ],
    );
  }
}
