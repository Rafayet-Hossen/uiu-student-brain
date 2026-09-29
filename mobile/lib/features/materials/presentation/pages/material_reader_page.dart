import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/error_card.dart';
import '../../../../core/widgets/student_brain_loader.dart';
import '../../data/models/material_model.dart';
import '../providers/materials_provider.dart';

class MaterialReaderPage extends ConsumerStatefulWidget {
  final int materialId;

  const MaterialReaderPage({super.key, required this.materialId});

  @override
  ConsumerState<MaterialReaderPage> createState() => _MaterialReaderPageState();
}

class _MaterialReaderPageState extends ConsumerState<MaterialReaderPage> {
  StudyMaterialModel? _material;
  bool _isLoading = true;
  String? _error;
  double _fontSizeScale = 1.0;
  bool _isBookmarked = false;

  @override
  void initState() {
    super.initState();
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final repo = ref.read(materialsRepositoryProvider);
      final item = await repo.getMaterialDetail(widget.materialId);
      setState(() {
        _material = item;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        title: Text(
          _material?.title ?? 'Document Reader',
          style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
        ),
        actions: [
          IconButton(
            icon: Icon(
              _isBookmarked ? Icons.bookmark_rounded : Icons.bookmark_outline_rounded,
              color: _isBookmarked ? AppColors.primary : null,
            ),
            onPressed: () {
              setState(() => _isBookmarked = !_isBookmarked);
              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(_isBookmarked ? 'Bookmarked for revision' : 'Bookmark removed'),
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
      ),
      body: SafeArea(
        child: Builder(
          builder: (context) {
            if (_isLoading) {
              return const StudentBrainLoader.fullScreen(message: 'Preparing document reader...');
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
            final displayContent = mat.contentText.isNotEmpty
                ? mat.contentText
                : (mat.summary.isNotEmpty ? mat.summary : '# ${mat.title}\n\nNo text content parsed for this document.');

            return SingleChildScrollView(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Meta bar
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

                  // Markdown Viewer with Code Highlighting
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
          },
        ),
      ),
    );
  }
}
