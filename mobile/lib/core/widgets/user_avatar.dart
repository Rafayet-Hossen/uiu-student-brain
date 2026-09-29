import 'package:flutter/material.dart';
import '../constants/app_colors.dart';

class UserAvatar extends StatelessWidget {
  final String name;
  final String? imageUrl;
  final double size;
  final bool showBadge;

  const UserAvatar({
    super.key,
    required this.name,
    this.imageUrl,
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

  String _getCartoonAvatarUrl(String seed) {
    final cleanSeed = Uri.encodeComponent(seed.trim().isEmpty ? 'Scholar' : seed.trim());
    return 'https://api.dicebear.com/7.x/notionists/png?seed=$cleanSeed&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf';
  }

  @override
  Widget build(BuildContext context) {
    final effectiveUrl = (imageUrl != null && imageUrl!.trim().isNotEmpty)
        ? imageUrl!
        : _getCartoonAvatarUrl(name);

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
          effectiveUrl,
          width: size,
          height: size,
          fit: BoxFit.cover,
          errorBuilder: (context, error, stackTrace) {
            return Container(
              color: AppColors.primary.withValues(alpha: 0.18),
              alignment: Alignment.center,
              child: Text(
                _getInitials(name),
                style: TextStyle(
                  color: AppColors.primary,
                  fontWeight: FontWeight.w900,
                  fontSize: size * 0.38,
                ),
              ),
            );
          },
          loadingBuilder: (context, child, loadingProgress) {
            if (loadingProgress == null) return child;
            return Container(
              color: AppColors.primary.withValues(alpha: 0.08),
              alignment: Alignment.center,
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
