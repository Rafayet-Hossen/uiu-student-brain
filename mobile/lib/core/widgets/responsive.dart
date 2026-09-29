import 'package:flutter/material.dart';

enum DeviceBreakpoint {
  compact, // < 600 (phones: 5.0", 5.5", 6.1", 6.7")
  medium,  // 600 - 840 (foldables, small tablets)
  expanded // > 840 (tablets, landscape foldables)
}

class Responsive {
  Responsive._();

  static DeviceBreakpoint breakpoint(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    if (width < 600) return DeviceBreakpoint.compact;
    if (width < 840) return DeviceBreakpoint.medium;
    return DeviceBreakpoint.expanded;
  }

  static bool isCompact(BuildContext context) =>
      breakpoint(context) == DeviceBreakpoint.compact;

  static bool isMedium(BuildContext context) =>
      breakpoint(context) == DeviceBreakpoint.medium;

  static bool isExpanded(BuildContext context) =>
      breakpoint(context) == DeviceBreakpoint.expanded;

  static bool isTablet(BuildContext context) =>
      MediaQuery.sizeOf(context).shortestSide >= 600;

  static bool isLandscape(BuildContext context) =>
      MediaQuery.orientationOf(context) == Orientation.landscape;

  static double screenWidth(BuildContext context) =>
      MediaQuery.sizeOf(context).width;

  static double screenHeight(BuildContext context) =>
      MediaQuery.sizeOf(context).height;

  static EdgeInsets padding(BuildContext context) {
    final bp = breakpoint(context);
    switch (bp) {
      case DeviceBreakpoint.compact:
        return const EdgeInsets.symmetric(horizontal: 16, vertical: 12);
      case DeviceBreakpoint.medium:
        return const EdgeInsets.symmetric(horizontal: 24, vertical: 16);
      case DeviceBreakpoint.expanded:
        return const EdgeInsets.symmetric(horizontal: 36, vertical: 24);
    }
  }

  static double font(BuildContext context, double baseSize) {
    final width = MediaQuery.sizeOf(context).width;
    // Base reference is a 390px mobile screen (e.g. 6.1" phone)
    final scale = (width / 390.0).clamp(0.85, 1.25);
    return baseSize * scale;
  }

  static double radius(BuildContext context, {double baseRadius = 22.0}) {
    final bp = breakpoint(context);
    switch (bp) {
      case DeviceBreakpoint.compact:
        return baseRadius.clamp(14.0, 20.0);
      case DeviceBreakpoint.medium:
        return baseRadius;
      case DeviceBreakpoint.expanded:
        return baseRadius + 4.0;
    }
  }

  static int gridColumns(BuildContext context) {
    final bp = breakpoint(context);
    switch (bp) {
      case DeviceBreakpoint.compact:
        return isLandscape(context) ? 2 : 1;
      case DeviceBreakpoint.medium:
        return 2;
      case DeviceBreakpoint.expanded:
        return 3;
    }
  }

  static double maxContentWidth(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    if (width > 1200) return 1100;
    if (width > 900) return 860;
    return double.infinity;
  }
}
