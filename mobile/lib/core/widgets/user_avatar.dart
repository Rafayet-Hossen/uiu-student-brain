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

  @override
  Widget build(BuildContext context) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
        color: AppColors.primary.withValues(alpha: 0.18),
        shape: BoxShape.circle,
        border: Border.all(
          color: AppColors.primary.withValues(alpha: 0.4),
          width: 1.5,
        ),
      ),
      child: Center(
        child: Text(
          _getInitials(name),
          style: TextStyle(
            color: AppColors.primary,
            fontWeight: FontWeight.w800,
            fontSize: size * 0.4,
          ),
        ),
      ),
    );
  }
}
