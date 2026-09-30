import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../../../core/constants/app_colors.dart';
import '../providers/quiz_provider.dart';

class ChatMessage {
  final String text;
  final bool isUser;
  final DateTime timestamp;

  ChatMessage({
    required this.text,
    required this.isUser,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() => {
        'text': text,
        'isUser': isUser,
        'timestamp': timestamp.toIso8601String(),
      };

  factory ChatMessage.fromJson(Map<String, dynamic> json) => ChatMessage(
        text: json['text'] as String? ?? '',
        isUser: json['isUser'] as bool? ?? false,
        timestamp: DateTime.tryParse(json['timestamp'] as String? ?? '') ?? DateTime.now(),
      );
}

class CourseChatPage extends ConsumerStatefulWidget {
  final int courseId;
  final String courseTitle;

  const CourseChatPage({
    super.key,
    required this.courseId,
    required this.courseTitle,
  });

  @override
  ConsumerState<CourseChatPage> createState() => _CourseChatPageState();
}

class _CourseChatPageState extends ConsumerState<CourseChatPage> {
  final _textController = TextEditingController();
  final _scrollController = ScrollController();
  final List<ChatMessage> _messages = [];
  bool _isTyping = false;
  bool _isLoadingHistory = true;

  final List<String> _promptSuggestions = const [
    'Explain the core concepts of this course',
    'Summarize high-frequency exam topics',
    'Generate 5 practice quiz questions',
    'Clarify the most difficult topic with examples',
  ];

  @override
  void initState() {
    super.initState();
    _loadChatHistory();
  }

  @override
  void dispose() {
    _textController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  String get _storageKey => 'course_chat_history_v2_${widget.courseId}';

  Future<void> _loadChatHistory() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final raw = prefs.getString(_storageKey);
      if (raw != null && raw.isNotEmpty) {
        final List<dynamic> decoded = jsonDecode(raw);
        final loaded = decoded.map((item) => ChatMessage.fromJson(item as Map<String, dynamic>)).toList();
        if (loaded.isNotEmpty) {
          if (mounted) {
            setState(() {
              _messages.addAll(loaded);
              _isLoadingHistory = false;
            });
            _scrollToBottom();
            return;
          }
        }
      }
    } catch (_) {}

    // Default welcome if no prior history
    if (mounted) {
      setState(() {
        _messages.add(
          ChatMessage(
            text: 'Hello! I am your AI Copilot for **${widget.courseTitle}**.\n\nI have indexed your syllabus, lecture slides, and notes. Ask me anything, or tap a prompt suggestion below to begin.',
            isUser: false,
            timestamp: DateTime.now(),
          ),
        );
        _isLoadingHistory = false;
      });
    }
  }

  Future<void> _saveChatHistory() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final encoded = jsonEncode(_messages.map((m) => m.toJson()).toList());
      await prefs.setString(_storageKey, encoded);
    } catch (_) {}
  }

  Future<void> _clearChatHistory() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Reset Chat'),
        content: const Text('Do you want to clear conversation history for this course?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          TextButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: TextButton.styleFrom(foregroundColor: AppColors.error),
            child: const Text('Clear'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_storageKey);
      if (mounted) {
        setState(() {
          _messages.clear();
          _messages.add(
            ChatMessage(
              text: 'Conversation reset. How can I help you with **${widget.courseTitle}** today?',
              isUser: false,
              timestamp: DateTime.now(),
            ),
          );
        });
      }
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  Future<void> _sendMessage([String? presetText]) async {
    final text = (presetText ?? _textController.text).trim();
    if (text.isEmpty || _isTyping) return;

    if (presetText == null) {
      _textController.clear();
    }
    setState(() {
      _messages.add(ChatMessage(text: text, isUser: true, timestamp: DateTime.now()));
      _isTyping = true;
    });
    _scrollToBottom();
    _saveChatHistory();

    try {
      final reply = await ref
          .read(aiRepositoryProvider)
          .sendCourseChatMessage(widget.courseId, text);

      if (mounted) {
        setState(() {
          _messages.add(ChatMessage(text: reply, isUser: false, timestamp: DateTime.now()));
          _isTyping = false;
        });
        _scrollToBottom();
        _saveChatHistory();
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _messages.add(
            ChatMessage(
              text: 'Could not connect to AI: ${e.toString()}',
              isUser: false,
              timestamp: DateTime.now(),
            ),
          );
          _isTyping = false;
        });
        _scrollToBottom();
        _saveChatHistory();
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        titleSpacing: 0,
        title: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(6),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [Color(0xFF4285F4), Color(0xFF9B72CF), Color(0xFFD96570)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(Icons.auto_awesome, color: Colors.white, size: 16),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.courseTitle,
                    style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w700),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const Text(
                    'Gemini AI Intelligence',
                    style: TextStyle(fontSize: 11, color: AppColors.primary, fontWeight: FontWeight.w500),
                  ),
                ],
              ),
            ),
          ],
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh_rounded, size: 20),
            tooltip: 'New Chat',
            onPressed: _clearChatHistory,
          ),
        ],
      ),
      body: SafeArea(
        child: _isLoadingHistory
            ? const Center(child: CircularProgressIndicator())
            : Column(
                children: [
                  // Chat message list
                  Expanded(
                    child: ListView.builder(
                      controller: _scrollController,
                      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                      itemCount: _messages.length,
                      itemBuilder: (context, index) {
                        final msg = _messages[index];
                        final isUser = msg.isUser;

                        return Padding(
                          padding: const EdgeInsets.only(bottom: 16),
                          child: Row(
                            mainAxisAlignment: isUser ? MainAxisAlignment.end : MainAxisAlignment.start,
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              if (!isUser) ...[
                                Container(
                                  margin: const EdgeInsets.only(top: 2, right: 10),
                                  padding: const EdgeInsets.all(6),
                                  decoration: BoxDecoration(
                                    gradient: const LinearGradient(
                                      colors: [Color(0xFF1E88E5), Color(0xFF8E24AA)],
                                      begin: Alignment.topLeft,
                                      end: Alignment.bottomRight,
                                    ),
                                    borderRadius: BorderRadius.circular(8),
                                  ),
                                  child: const Icon(Icons.auto_awesome, size: 13, color: Colors.white),
                                ),
                              ],
                              Flexible(
                                child: Container(
                                  constraints: BoxConstraints(
                                    maxWidth: MediaQuery.of(context).size.width * 0.82,
                                  ),
                                  decoration: BoxDecoration(
                                    color: isUser
                                        ? AppColors.primary
                                        : (isDark ? const Color(0xFF1E232D) : const Color(0xFFF1F5F9)),
                                    borderRadius: BorderRadius.only(
                                      topLeft: const Radius.circular(16),
                                      topRight: const Radius.circular(16),
                                      bottomLeft: Radius.circular(isUser ? 16 : 4),
                                      bottomRight: Radius.circular(isUser ? 4 : 16),
                                    ),
                                    border: isUser
                                        ? null
                                        : Border.all(
                                            color: isDark ? const Color(0xFF2C3240) : const Color(0xFFE2E8F0),
                                          ),
                                    boxShadow: [
                                      BoxShadow(
                                        color: Colors.black.withValues(alpha: 0.04),
                                        blurRadius: 4,
                                        offset: const Offset(0, 2),
                                      ),
                                    ],
                                  ),
                                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
                                  child: Column(
                                    crossAxisAlignment:
                                        isUser ? CrossAxisAlignment.end : CrossAxisAlignment.start,
                                    children: [
                                      MarkdownBody(
                                        data: msg.text,
                                        selectable: true,
                                        styleSheet: MarkdownStyleSheet(
                                          p: TextStyle(
                                            fontSize: 14,
                                            color: isUser
                                                ? Colors.white
                                                : (isDark ? AppColors.textDark : AppColors.textLight),
                                            height: 1.45,
                                          ),
                                          code: TextStyle(
                                            backgroundColor: isDark ? const Color(0xFF151820) : const Color(0xFFE2E8F0),
                                            fontSize: 12,
                                            fontFamily: 'monospace',
                                            color: isUser ? Colors.white : (isDark ? const Color(0xFF64B5F6) : const Color(0xFF0D47A1)),
                                          ),
                                          codeblockDecoration: BoxDecoration(
                                            color: isDark ? const Color(0xFF12151C) : const Color(0xFFF8FAFC),
                                            borderRadius: BorderRadius.circular(8),
                                            border: Border.all(
                                              color: isDark ? const Color(0xFF2C3240) : const Color(0xFFCBD5E1),
                                            ),
                                          ),
                                        ),
                                      ),
                                      if (!isUser) ...[
                                        const SizedBox(height: 6),
                                        Row(
                                          mainAxisSize: MainAxisSize.min,
                                          children: [
                                            InkWell(
                                              borderRadius: BorderRadius.circular(4),
                                              onTap: () {
                                                Clipboard.setData(ClipboardData(text: msg.text));
                                                ScaffoldMessenger.of(context).showSnackBar(
                                                  const SnackBar(
                                                    content: Text('Copied response to clipboard'),
                                                    duration: Duration(seconds: 1),
                                                  ),
                                                );
                                              },
                                              child: Padding(
                                                padding: const EdgeInsets.all(4),
                                                child: Row(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    Icon(
                                                      Icons.copy_rounded,
                                                      size: 13,
                                                      color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                                    ),
                                                    const SizedBox(width: 4),
                                                    Text(
                                                      'Copy',
                                                      style: TextStyle(
                                                        fontSize: 11,
                                                        color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                          ],
                                        ),
                                      ],
                                    ],
                                  ),
                                ),
                              ),
                              if (isUser) const SizedBox(width: 4),
                            ],
                          ),
                        );
                      },
                    ),
                  ),

                  // Prompt Suggestions (when message count is small)
                  if (_messages.length <= 2) ...[
                    Container(
                      height: 38,
                      margin: const EdgeInsets.only(bottom: 8),
                      child: ListView.separated(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        scrollDirection: Axis.horizontal,
                        itemCount: _promptSuggestions.length,
                        separatorBuilder: (_, __) => const SizedBox(width: 8),
                        itemBuilder: (context, i) {
                          final suggestion = _promptSuggestions[i];
                          return ActionChip(
                            avatar: const Icon(Icons.auto_awesome, size: 13, color: AppColors.primary),
                            label: Text(suggestion, style: const TextStyle(fontSize: 12)),
                            backgroundColor: isDark ? const Color(0xFF1E232D) : const Color(0xFFF1F5F9),
                            side: BorderSide(
                              color: isDark ? const Color(0xFF2C3240) : const Color(0xFFE2E8F0),
                            ),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                            onPressed: () => _sendMessage(suggestion),
                          );
                        },
                      ),
                    ),
                  ],

                  if (_isTyping) ...[
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
                      child: Row(
                        children: [
                          Container(
                            padding: const EdgeInsets.all(4),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF4285F4), Color(0xFF9B72CF)],
                              ),
                              borderRadius: BorderRadius.circular(6),
                            ),
                            child: const Icon(Icons.auto_awesome, size: 11, color: Colors.white),
                          ),
                          const SizedBox(width: 10),
                          const SizedBox(
                            width: 12,
                            height: 12,
                            child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.primary),
                          ),
                          const SizedBox(width: 8),
                          Text(
                            'Gemini is thinking...',
                            style: TextStyle(
                              fontSize: 12,
                              fontStyle: FontStyle.italic,
                              color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],

                  // Input Bar
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
                      border: Border(
                        top: BorderSide(
                          color: isDark ? AppColors.borderDark : AppColors.borderLight,
                        ),
                      ),
                    ),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Expanded(
                          child: Container(
                            decoration: BoxDecoration(
                              color: isDark ? const Color(0xFF1A1E26) : const Color(0xFFF8FAFC),
                              borderRadius: BorderRadius.circular(24),
                              border: Border.all(
                                color: isDark ? const Color(0xFF2C3240) : const Color(0xFFE2E8F0),
                              ),
                            ),
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            child: TextField(
                              controller: _textController,
                              minLines: 1,
                              maxLines: 5,
                              style: TextStyle(
                                fontSize: 14,
                                color: isDark ? AppColors.textDark : AppColors.textLight,
                              ),
                              decoration: InputDecoration(
                                hintText: 'Ask Gemini anything about this course...',
                                hintStyle: TextStyle(
                                  fontSize: 13,
                                  color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                                ),
                                border: InputBorder.none,
                                isDense: true,
                                contentPadding: const EdgeInsets.symmetric(vertical: 12),
                              ),
                              onSubmitted: (_) => _sendMessage(),
                            ),
                          ),
                        ),
                        const SizedBox(width: 8),
                        IconButton.filled(
                          onPressed: _isTyping ? null : () => _sendMessage(),
                          style: IconButton.styleFrom(
                            backgroundColor: AppColors.primary,
                            foregroundColor: Colors.white,
                            padding: const EdgeInsets.all(12),
                          ),
                          icon: const Icon(Icons.arrow_upward_rounded, size: 20),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
      ),
    );
  }
}
