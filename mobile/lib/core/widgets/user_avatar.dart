import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class UserAvatar extends StatelessWidget {
  final String name;
  final String? imageUrl;
  final String? seed;
  final double size;
  final bool showBadge;

  const UserAvatar({
    super.key,
    required this.name,
    this.imageUrl,
    this.seed,
    this.size = 40.0,
    this.showBadge = false,
  });

  String _getInitials(String input) {
    if (input.trim().isEmpty) return 'S';
    final parts = input.trim().split(RegExp(r'\s+'));
    if (parts.length > 1) {
      return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
    }
    return input[0].toUpperCase();
  }

  String _getEffectiveUrl() {
    if (imageUrl != null && imageUrl!.trim().isNotEmpty) {
      final img = imageUrl!.trim();
      if (img.startsWith('http://') || img.startsWith('https://')) {
        return img;
      }
      if (img.startsWith('/media/')) {
        return 'https://uiu-student-brain.onrender.com$img';
      }
    }
    // Matching website's exact DiceBear Notionists cartoon avatar
    final effectiveSeed = (seed != null && seed!.trim().isNotEmpty)
        ? seed!.trim()
        : (name.trim().isNotEmpty ? name.trim() : 'scholar_student');
    return 'https://api.dicebear.com/7.x/notionists/png?seed=${Uri.encodeComponent(effectiveSeed)}&backgroundColor=e0e7ff,fde68a,bbf7d0,bfdbfe,fbcfe8,fed7aa';
  }

  @override
  Widget build(BuildContext context) {
    final avatarUrl = _getEffectiveUrl();

    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.12),
        shape: BoxShape.circle,
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.35),
          width: 1.5,
        ),
      ),
      child: ClipOval(
        child: Image.network(
          avatarUrl,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return Center(
              child: Text(
                _getInitials(name),
                style: TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w800,
                  fontSize: size * 0.38,
                ),
              ),
            );
          },
          loadingBuilder: (context, child, loadingProgress) {
            if (loadingProgress == null) return child;
            return Center(
              child: Text(
                _getInitials(name),
                style: TextStyle(
                  color: AppColors.primary.withValues(alpha: 0.6),
                  fontWeight: FontWeight.w800,
                  fontSize: size * 0.38,
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
