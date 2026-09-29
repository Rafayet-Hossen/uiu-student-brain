import 'package:flutter/material.dart';

class AppColors {
  AppColors._();

  // Brand Palette (UIU Signature Academic Theme)
  static const Color primary = Color(0xFFF26522); // UIU Signature Orange
  static const Color primaryLight = Color(0xFFFB923C); // UIU Glowing Amber-Orange
  static const Color primaryDark = Color(0xFFD9531E); // UIU Deep Orange
  static const Color secondary = Color(0xFF10B981); // Emerald (Achievement / Streaks)
  static const Color secondaryLight = Color(0xFF34D399);
  static const Color accent = Color(0xFFF59E0B); // UIU Golden Amber
  static const Color accentLight = Color(0xFFFBBF24);

  // Light Mode Palette (Crisp Cool Slate Canvas)
  static const Color bgLight = Color(0xFFF8FAFC);
  static const Color surfaceLight = Color(0xFFFFFFFF);
  static const Color surfaceLightSubtle = Color(0xFFF1F5F9);
  static const Color borderLight = Color(0xFFE2E8F0);
  static const Color textLight = Color(0xFF0F172A);
  static const Color textLightMuted = Color(0xFF64748B);
  static const Color textLightSubtle = Color(0xFF94A3B8);

  // Dark Mode Palette (Warm Obsidian & Slate Canvas)
  static const Color bgDark = Color(0xFF0C1017);
  static const Color surfaceDark = Color(0xFF131A26);
  static const Color surfaceDarkSubtle = Color(0xFF1A2232);
  static const Color borderDark = Color(0xFF263345);
  static const Color textDark = Color(0xFFF8FAFC);
  static const Color textDarkMuted = Color(0xFF94A3B8);
  static const Color textDarkSubtle = Color(0xFF64748B);

  // Accent & Functional
  static const Color success = Color(0xFF10B981);
  static const Color warning = Color(0xFFF59E0B);
  static const Color error = Color(0xFFEF4444);
  static const Color info = Color(0xFF3B82F6);
  static const Color gold = Color(0xFFF59E0B);
  static const Color silver = Color(0xFF94A3B8);
  static const Color bronze = Color(0xFFD97706);
  static const Color flame = Color(0xFFEA580C);

  // Module Specific UIU Colors
  static const Color moduleGpa = Color(0xFFEA580C);
  static const Color modulePlanner = Color(0xFFF26522);
  static const Color moduleTracker = Color(0xFFF97316);
  static const Color moduleMaterials = Color(0xFFD97706);
  static const Color moduleCommunity = Color(0xFFC2410C);
  static const Color moduleAnalytics = Color(0xFFF26522);

  // Gradients
  static const LinearGradient primaryGradient = LinearGradient(
    colors: [Color(0xFFF26522), Color(0xFFFB923C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient accentGradient = LinearGradient(
    colors: [Color(0xFFF59E0B), Color(0xFFFBBF24)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient darkCardGradient = LinearGradient(
    colors: [Color(0xFF1A2232), Color(0xFF131A26)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );

  static const LinearGradient flameGradient = LinearGradient(
    colors: [Color(0xFFF97316), Color(0xFFEA580C)],
    begin: Alignment.topLeft,
    end: Alignment.bottomRight,
  );
}
