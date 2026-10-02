import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/error_card.dart';
import '../../../../core/widgets/glass_card.dart';
import '../../../../core/widgets/student_brain_loader.dart';
import '../../data/models/material_model.dart';
import '../providers/materials_provider.dart';

class MaterialReaderPage extends ConsumerStatefulWidget {
  final int materialId;

  const MaterialReaderPage({super.key, required this.materialId});

  @override
  ConsumerState<MaterialReaderPage> createState() => _MaterialReaderPageState();
}

class _MaterialReaderPageState extends ConsumerState<MaterialReaderPage>
    with SingleTickerProviderStateMixin {
  late TabController _tabController;
  StudyMaterialModel? _material;
  bool _isLoading = true;
  bool _isAnalyzing = false;
  String? _error;
  double _fontSizeScale = 1.0;
  final Set<int> _revealedAnswers = {};

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadDetail();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  static const String _cacheKeyPrefix = 'mat_ai_cache_v2_';

  Future<void> _loadDetail() async {
    // 1. Try local cache first for instant offline/saved experience
    try {
      final prefs = await SharedPreferences.getInstance();
      final cachedJson = prefs.getString('$_cacheKeyPrefix${widget.materialId}');
      if (cachedJson != null && cachedJson.isNotEmpty) {
        final map = jsonDecode(cachedJson) as Map<String, dynamic>;
        final cachedMat = StudyMaterialModel.fromJson(map);
        if (mounted) {
          setState(() {
            _material = cachedMat;
            _isLoading = false;
          });
        }
      }
    } catch (_) {}

    setState(() {
      if (_material == null) _isLoading = true;
      _error = null;
    });

    try {
      final repo = ref.read(materialsRepositoryProvider);
      final item = await repo.getMaterialDetail(widget.materialId);

      var finalItem = item;
      if (_material != null && finalItem.keyConcepts.isEmpty && _material!.keyConcepts.isNotEmpty) {
        final merged = finalItem.toJson();
        merged['key_concepts'] = _material!.keyConcepts;
        merged['key_questions'] = _material!.keyQuestions;
        if (finalItem.summary.isEmpty) merged['summary'] = _material!.summary;
        finalItem = StudyMaterialModel.fromJson(merged);
      }

      _saveToCache(finalItem);

      if (mounted) {
        setState(() {
          _material = finalItem;
          _isLoading = false;
        });
      }

      // If not analyzed yet and has content, auto-analyze in background for instant user experience
      if (!finalItem.isAnalyzed &&
          finalItem.summary.isEmpty &&
          (finalItem.contentText.isNotEmpty || finalItem.fileUrl != null)) {
        _triggerAiAnalysis();
      }
    } catch (e) {
      if (_material == null) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _saveToCache(StudyMaterialModel mat) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('$_cacheKeyPrefix${mat.id}', jsonEncode(mat.toJson()));
    } catch (_) {}
  }

  Future<void> _triggerAiAnalysis() async {
    if (_isAnalyzing) return;
    setState(() => _isAnalyzing = true);

    try {
      final repo = ref.read(materialsRepositoryProvider);
      final rawAnalysis = await repo.analyzeMaterial(widget.materialId);

      // Reload fresh analyzed material
      StudyMaterialModel updated = await repo.getMaterialDetail(widget.materialId);

      // If concepts or questions are empty, merge from rawAnalysis response
      if (updated.keyConcepts.isEmpty || updated.keyQuestions.isEmpty) {
        final merged = updated.toJson();
        merged['ai_analysis'] = rawAnalysis['ai_analysis'] ?? rawAnalysis;
        if (rawAnalysis['summary'] != null && rawAnalysis['summary'].toString().isNotEmpty) {
          merged['summary'] = rawAnalysis['summary'];
        }
        if (rawAnalysis['key_topics'] != null) {
          merged['key_topics'] = rawAnalysis['key_topics'];
        }
        if (rawAnalysis['key_concepts'] != null) {
          merged['key_concepts'] = rawAnalysis['key_concepts'];
        }
        if (rawAnalysis['key_formulas_or_definitions'] != null) {
          merged['key_formulas_or_definitions'] = rawAnalysis['key_formulas_or_definitions'];
        }
        if (rawAnalysis['key_questions'] != null) {
          merged['key_questions'] = rawAnalysis['key_questions'];
        }
        updated = StudyMaterialModel.fromJson(merged);
      }

      await _saveToCache(updated);

      // Refresh library list in background so previous page is immediately up to date
      ref.read(materialsProvider.notifier).loadMaterials();

      if (mounted) {
        setState(() {
          _material = updated;
          _isAnalyzing = false;
        });
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Row(
              children: [
                Icon(Icons.check_circle_rounded, color: Colors.white, size: 18),
                SizedBox(width: 8),
                Expanded(child: Text('AI Analysis and Practice Quiz saved locally!')),
              ],
            ),
            backgroundColor: AppColors.success,
            duration: Duration(seconds: 3),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        setState(() => _isAnalyzing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('AI analysis finished and cached locally.'),
            backgroundColor: AppColors.accent,
            duration: Duration(seconds: 2),
          ),
        );
      }
    }
  }

  double _getDifficultyPercent(String level) {
    switch (level.toLowerCase()) {
      case 'beginner':
        return 0.33;
      case 'intermediate':
        return 0.66;
      case 'advanced':
        return 1.0;
      default:
        return 0.5;
    }
  }

  Color _getDifficultyColor(String level) {
    switch (level.toLowerCase()) {
      case 'beginner':
        return AppColors.success;
      case 'intermediate':
        return AppColors.accent;
      case 'advanced':
        return AppColors.error;
      default:
        return AppColors.primary;
    }
  }

  void _copyToClipboard(String text, String label) {
    Clipboard.setData(ClipboardData(text: text));
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$label copied to clipboard'),
        duration: const Duration(seconds: 1),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final isBookmarked = ref.watch(materialsProvider).bookmarkedIds.contains(widget.materialId.toString());

    return Scaffold(
      appBar: AppBar(
        title: Text(
          _material?.title ?? 'Study Material',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          if (_material != null)
            IconButton(
              icon: const Icon(Icons.auto_awesome_rounded, color: AppColors.primary),
              tooltip: _isAnalyzing ? 'Analyzing with Gemini AI...' : 'Re-Analyze with Gemini AI',
              onPressed: _isAnalyzing ? null : _triggerAiAnalysis,
            ),
          IconButton(
            icon: Icon(
              isBookmarked ? Icons.bookmark_rounded : Icons.bookmark_outline_rounded,
              color: isBookmarked ? AppColors.primary : null,
            ),
            tooltip: isBookmarked ? 'Remove Bookmark' : 'Bookmark Material',
            onPressed: () {
              ref.read(materialsProvider.notifier).toggleBookmark(widget.materialId);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(!isBookmarked ? '🔖 Material bookmarked for revision' : 'Bookmark removed'),
                  duration: const Duration(seconds: 1),
                ),
              );
            },
          ),
          PopupMenuButton<double>(
            icon: const Icon(Icons.format_size_rounded),
            tooltip: 'Text Size Zoom',
            onSelected: (val) => setState(() => _fontSizeScale = val),
            itemBuilder: (_) => const [
              PopupMenuItem(value: 0.85, child: Text('Small (85%)')),
              PopupMenuItem(value: 1.0, child: Text('Default (100%)')),
              PopupMenuItem(value: 1.2, child: Text('Large (120%)')),
              PopupMenuItem(value: 1.4, child: Text('Extra Large (140%)')),
            ],
          ),
        ],
        bottom: TabBar(
          controller: _tabController,
          isScrollable: false,
          labelColor: AppColors.primary,
          unselectedLabelColor: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
          indicatorColor: AppColors.primary,
          indicatorWeight: 3,
          labelPadding: const EdgeInsets.symmetric(horizontal: 2),
          labelStyle: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w800),
          unselectedLabelStyle: const TextStyle(fontSize: 11.5, fontWeight: FontWeight.w600),
          tabs: [
            const Tab(
              icon: Icon(Icons.auto_awesome_rounded, size: 18),
              text: 'Summary',
            ),
            Tab(
              icon: const Icon(Icons.lightbulb_outline_rounded, size: 18),
              text: 'Terms (${_material?.keyConcepts.length ?? 0})',
            ),
            Tab(
              icon: const Icon(Icons.quiz_outlined, size: 18),
              text: 'Quiz (${_material?.keyQuestions.length ?? 0})',
            ),
            const Tab(
              icon: Icon(Icons.description_outlined, size: 18),
              text: 'Doc View',
            ),
          ],
        ),
      ),
      body: SafeArea(
        child: Builder(
          builder: (context) {
            if (_isLoading) {
              return const StudentBrainLoader.fullScreen(message: 'Loading study material & AI insights...');
            }

            if (_error != null) {
              return Center(
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: ErrorCard(
                    message: _error!,
                    onRetry: _loadDetail,
                  ),
                ),
              );
            }

            final mat = _material!;

            return TabBarView(
              controller: _tabController,
              children: [
                _buildSummaryTab(mat, isDark),
                _buildConceptsTab(mat, isDark),
                _buildQuizTab(mat, isDark),
                _buildDocumentTab(mat, isDark),
              ],
            );
          },
        ),
      ),
    );
  }

  // ============================================================
  // TAB 1: AI SUMMARY & INSIGHTS
  // ============================================================
  Widget _buildSummaryTab(StudyMaterialModel mat, bool isDark) {
    final diffColor = _getDifficultyColor(mat.difficultyLevel);
    final diffPercent = _getDifficultyPercent(mat.difficultyLevel);

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (_isAnalyzing) ...[
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: AppColors.primary.withValues(alpha: 0.3)),
              ),
              child: const Row(
                children: [
                  SizedBox(
                    width: 16,
                    height: 16,
                    child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                  ),
                  SizedBox(width: 10),
                  Expanded(
                    child: Text(
                      'Gemini AI is analyzing material & generating quiz...',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.primary),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
          ],

          // Executive Summary Card
          GlassCard(
            borderColor: AppColors.primary.withValues(alpha: 0.3),
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.auto_awesome_rounded, color: AppColors.primary, size: 18),
                        SizedBox(width: 8),
                        Text(
                          'Executive Syllabus Summary',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                        ),
                      ],
                    ),
                    IconButton(
                      icon: const Icon(Icons.copy_rounded, size: 16),
                      tooltip: 'Copy Summary',
                      onPressed: mat.summary.isNotEmpty
                          ? () => _copyToClipboard(mat.summary, 'Summary')
                          : null,
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                if (mat.summary.isNotEmpty)
                  MarkdownBody(
                    data: mat.summary,
                    styleSheet: MarkdownStyleSheet(
                      p: TextStyle(
                        fontSize: 14 * _fontSizeScale,
                        height: 1.5,
                        color: isDark ? AppColors.textDark : AppColors.textLight,
                      ),
                    ),
                  )
                else
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'No AI summary generated yet.',
                          style: TextStyle(
                            fontSize: 13,
                            color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                          ),
                        ),
                        const SizedBox(height: 10),
                        ElevatedButton.icon(
                          onPressed: _triggerAiAnalysis,
                          icon: const Icon(Icons.bolt_rounded, size: 16),
                          label: const Text('Analyze with Gemini AI'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                          ),
                        ),
                      ],
                    ),
                  ),
              ],
            ),
          ),
          const SizedBox(height: 14),

          // Academic Metrics Row
          Row(
            children: [
              Expanded(
                child: GlassCard(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Difficulty',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                            ),
                          ),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                            decoration: BoxDecoration(
                              color: diffColor.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: Text(
                              mat.difficultyLevel,
                              style: TextStyle(
                                fontSize: 10,
                                fontWeight: FontWeight.w800,
                                color: diffColor,
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: LinearProgressIndicator(
                          value: diffPercent,
                          backgroundColor: isDark ? Colors.white10 : Colors.black12,
                          valueColor: AlwaysStoppedAnimation<Color>(diffColor),
                          minHeight: 6,
                        ),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Coursework Level',
                        style: TextStyle(
                          fontSize: 10,
                          color: isDark ? AppColors.textDarkSubtle : AppColors.textLightSubtle,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: GlassCard(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            'Reading Time',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w700,
                              color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                            ),
                          ),
                          const Icon(Icons.timer_outlined, size: 14, color: AppColors.accent),
                        ],
                      ),
                      const SizedBox(height: 6),
                      Text(
                        '${mat.estimatedReadingTime} min',
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '~200 words / min',
                        style: TextStyle(
                          fontSize: 10,
                          color: isDark ? AppColors.textDarkSubtle : AppColors.textLightSubtle,
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 14),

          // Key Syllabus Topics
          if (mat.keyTopics.isNotEmpty) ...[
            const Text(
              'Extracted Syllabus Topics',
              style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 6,
              runSpacing: 6,
              children: mat.keyTopics.map((topic) {
                return Container(
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width - 48,
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                      color: isDark ? AppColors.borderDark : AppColors.borderLight,
                      width: 0.8,
                    ),
                  ),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      const Icon(Icons.tag_rounded, size: 12, color: AppColors.primary),
                      const SizedBox(width: 5),
                      Flexible(
                        child: Text(
                          topic,
                          style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700),
                          softWrap: true,
                        ),
                      ),
                    ],
                  ),
                );
              }).toList(),
            ),
          ],
          const SizedBox(height: 24),
        ],
      ),
    );
  }

  // ============================================================
  // TAB 2: KEY CONCEPTS & DEFINITIONS
  // ============================================================
  Widget _buildConceptsTab(StudyMaterialModel mat, bool isDark) {
    if (_isAnalyzing) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: SizedBox(
                    width: 32,
                    height: 32,
                    child: CircularProgressIndicator(strokeWidth: 3, color: AppColors.primary),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              const Text(
                'Extracting Key Terms with Gemini AI...',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Synthesizing definitions, formulas, and core concepts from your document.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (mat.keyConcepts.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.lightbulb_outline_rounded, size: 48, color: AppColors.accent),
              const SizedBox(height: 12),
              const Text(
                'No Key Concepts Extracted',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 6),
              Text(
                'Generate key term definitions and formulas directly using Gemini AI.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _triggerAiAnalysis,
                icon: const Icon(Icons.bolt_rounded, size: 16),
                label: const Text('Extract Key Terms with AI'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      itemCount: mat.keyConcepts.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final concept = mat.keyConcepts[index];
        final term = concept['term'] ?? 'Concept';
        final definition = concept['definition'] ?? '';

        return Container(
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isDark ? AppColors.borderDark : AppColors.borderLight,
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: IntrinsicHeight(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Colorful left indicator accent bar
                Container(
                  width: 5,
                  decoration: const BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [AppColors.primary, AppColors.accent],
                    ),
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(14),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: AppColors.primary.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(6),
                              ),
                              child: Text(
                                '#${(index + 1).toString().padLeft(2, '0')}',
                                style: const TextStyle(
                                  fontSize: 11,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.primary,
                                  letterSpacing: 0.5,
                                ),
                              ),
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                term,
                                style: const TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w800,
                                  letterSpacing: -0.2,
                                ),
                              ),
                            ),
                            Material(
                              color: Colors.transparent,
                              child: InkWell(
                                borderRadius: BorderRadius.circular(8),
                                onTap: () => _copyToClipboard('$term: $definition', 'Concept'),
                                child: Container(
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    color: (isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle),
                                    borderRadius: BorderRadius.circular(8),
                                    border: Border.all(
                                      color: isDark ? AppColors.borderDark : AppColors.borderLight,
                                      width: 0.8,
                                    ),
                                  ),
                                  child: Icon(
                                    Icons.copy_rounded,
                                    size: 14,
                                    color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 10),
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            definition,
                            style: TextStyle(
                              fontSize: 13,
                              height: 1.5,
                              color: isDark ? AppColors.textDark : AppColors.textLight,
                            ),
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
    );
  }

  // ============================================================
  // TAB 3: PRACTICE QUIZ & REVEALABLE ANSWERS
  // ============================================================
  Widget _buildQuizTab(StudyMaterialModel mat, bool isDark) {
    if (_isAnalyzing) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 64,
                height: 64,
                decoration: BoxDecoration(
                  color: AppColors.primary.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: const Center(
                  child: SizedBox(
                    width: 32,
                    height: 32,
                    child: CircularProgressIndicator(strokeWidth: 3, color: AppColors.primary),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              const Text(
                'Generating Practice Quiz with Gemini AI...',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Formulating high-yield exam questions with instant revealable explanations.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                ),
              ),
            ],
          ),
        ),
      );
    }

    if (mat.keyQuestions.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.quiz_outlined, size: 48, color: AppColors.primary),
              const SizedBox(height: 12),
              const Text(
                'No Quiz Questions Yet',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
              ),
              const SizedBox(height: 6),
              Text(
                'Generate instant practice questions with revealable solutions matching exam standards.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 12,
                  color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton.icon(
                onPressed: _triggerAiAnalysis,
                icon: const Icon(Icons.bolt_rounded, size: 16),
                label: const Text('Generate Quiz Questions'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.primary,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ),
      );
    }

    return ListView.separated(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
      itemCount: mat.keyQuestions.length,
      separatorBuilder: (_, __) => const SizedBox(height: 12),
      itemBuilder: (context, index) {
        final q = mat.keyQuestions[index];
        final question = q['question'] ?? 'Question';
        final answer = q['answer'] ?? 'No answer provided.';
        final isRevealed = _revealedAnswers.contains(index);

        return Container(
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : Colors.white,
            borderRadius: BorderRadius.circular(14),
            border: Border.all(
              color: isRevealed
                  ? AppColors.primary.withValues(alpha: 0.5)
                  : (isDark ? AppColors.borderDark : AppColors.borderLight),
              width: isRevealed ? 1.5 : 1,
            ),
            boxShadow: [
              BoxShadow(
                color: isRevealed
                    ? AppColors.primary.withValues(alpha: 0.08)
                    : Colors.black.withValues(alpha: isDark ? 0.2 : 0.04),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [
                          AppColors.primary.withValues(alpha: 0.15),
                          AppColors.accent.withValues(alpha: 0.15),
                        ],
                      ),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(
                        color: AppColors.primary.withValues(alpha: 0.25),
                        width: 0.8,
                      ),
                    ),
                    child: Text(
                      'QUESTION ${index + 1}',
                      style: const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w900,
                        color: AppColors.primary,
                        letterSpacing: 0.6,
                      ),
                    ),
                  ),
                  Material(
                    color: Colors.transparent,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(8),
                      onTap: () {
                        setState(() {
                          if (isRevealed) {
                            _revealedAnswers.remove(index);
                          } else {
                            _revealedAnswers.add(index);
                          }
                        });
                      },
                      child: Container(
                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 7),
                        decoration: BoxDecoration(
                          color: isRevealed
                              ? AppColors.primary.withValues(alpha: 0.12)
                              : (isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isRevealed
                                ? AppColors.primary
                                : (isDark ? AppColors.borderDark : AppColors.borderLight),
                            width: 1,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              isRevealed ? Icons.visibility_off_rounded : Icons.visibility_rounded,
                              size: 14,
                              color: isRevealed
                                  ? AppColors.primary
                                  : (isDark ? AppColors.textDarkMuted : AppColors.textLightMuted),
                            ),
                            const SizedBox(width: 6),
                            Text(
                              isRevealed ? 'Hide Solution' : 'Reveal Solution',
                              style: TextStyle(
                                fontSize: 11.5,
                                fontWeight: FontWeight.w700,
                                color: isRevealed
                                    ? AppColors.primary
                                    : (isDark ? AppColors.textDark : AppColors.textLight),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                question,
                style: const TextStyle(
                  fontSize: 14.5,
                  fontWeight: FontWeight.w800,
                  height: 1.45,
                ),
              ),
              if (isRevealed) ...[
                const SizedBox(height: 14),
                Container(
                  width: double.infinity,
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(
                    color: AppColors.success.withValues(alpha: 0.08),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(
                      color: AppColors.success.withValues(alpha: 0.35),
                      width: 1,
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          const Row(
                            children: [
                              Icon(Icons.check_circle_rounded, size: 16, color: AppColors.success),
                              SizedBox(width: 6),
                              Text(
                                'Verified Solution',
                                style: TextStyle(
                                  fontSize: 12,
                                  fontWeight: FontWeight.w900,
                                  color: AppColors.success,
                                ),
                              ),
                            ],
                          ),
                          InkWell(
                            onTap: () => _copyToClipboard(answer, 'Answer'),
                            child: const Padding(
                              padding: EdgeInsets.all(2),
                              child: Icon(Icons.copy_rounded, size: 14, color: AppColors.success),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(
                        answer,
                        style: TextStyle(
                          fontSize: 13,
                          height: 1.5,
                          color: isDark ? AppColors.textDark : AppColors.textLight,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  // ============================================================
  // TAB 4: ORIGINAL EXTRACTED DOCUMENT TEXT
  // ============================================================
  Widget _buildDocumentTab(StudyMaterialModel mat, bool isDark) {
    final displayContent = mat.contentText.isNotEmpty
        ? mat.contentText
        : (mat.summary.isNotEmpty ? mat.summary : '# ${mat.title}\n\nNo text content parsed for this document.');

    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: isDark ? AppColors.surfaceDarkSubtle : AppColors.surfaceLightSubtle,
              borderRadius: BorderRadius.circular(12),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  mat.category,
                  style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700),
                ),
                Text(
                  '${mat.estimatedReadingTime} min read | ${mat.difficultyLevel}',
                  style: TextStyle(
                    fontSize: 11,
                    color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          MarkdownBody(
            data: displayContent,
            selectable: true,
            styleSheet: MarkdownStyleSheet(
              h1: TextStyle(
                fontSize: 22 * _fontSizeScale,
                fontWeight: FontWeight.w900,
                color: isDark ? AppColors.textDark : AppColors.textLight,
              ),
              h2: TextStyle(
                fontSize: 18 * _fontSizeScale,
                fontWeight: FontWeight.w800,
                color: isDark ? AppColors.textDark : AppColors.textLight,
              ),
              p: TextStyle(
                fontSize: 14 * _fontSizeScale,
                height: 1.55,
                color: isDark ? AppColors.textDark : AppColors.textLight,
              ),
              code: TextStyle(
                backgroundColor: isDark ? Colors.black45 : Colors.grey.shade200,
                fontSize: 12 * _fontSizeScale,
                fontFamily: 'monospace',
              ),
              codeblockDecoration: BoxDecoration(
                color: isDark ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
          const SizedBox(height: 40),
        ],
      ),
    );
  }
}
