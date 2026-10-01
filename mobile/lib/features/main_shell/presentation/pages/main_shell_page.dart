import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/constants/app_colors.dart';
import '../../../../core/widgets/responsive.dart';

class MainShellPage extends StatelessWidget {
  final StatefulNavigationShell navigationShell;

  const MainShellPage({
    super.key,
    required this.navigationShell,
  });

  void _onTap(int index) {
    navigationShell.goBranch(
      index,
      initialLocation: index == navigationShell.currentIndex,
    );
  }

  @override
  Widget build(BuildContext context) {
    final isTablet = Responsive.isTablet(context);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final destinations = const [
      NavigationDestination(
        icon: Icon(Icons.dashboard_outlined, size: 22),
        selectedIcon: Icon(Icons.dashboard_rounded, color: AppColors.primary, size: 23),
        label: 'Home',
        tooltip: 'Dashboard',
      ),
      NavigationDestination(
        icon: Icon(Icons.calendar_month_outlined, size: 22),
        selectedIcon: Icon(Icons.calendar_month_rounded, color: AppColors.primary, size: 23),
        label: 'Planner',
        tooltip: 'Routine & Planner',
      ),
      NavigationDestination(
        icon: Icon(Icons.timer_outlined, size: 22),
        selectedIcon: Icon(Icons.timer_rounded, color: AppColors.primary, size: 23),
        label: 'Focus',
        tooltip: 'Study Tracker',
      ),
      NavigationDestination(
        icon: Icon(Icons.auto_stories_outlined, size: 22),
        selectedIcon: Icon(Icons.auto_stories_rounded, color: AppColors.primary, size: 23),
        label: 'Docs',
        tooltip: 'Course Materials',
      ),
      NavigationDestination(
        icon: Icon(Icons.forum_outlined, size: 22),
        selectedIcon: Icon(Icons.forum_rounded, color: AppColors.primary, size: 23),
        label: 'Network',
        tooltip: 'Community',
      ),
      NavigationDestination(
        icon: Icon(Icons.school_outlined, size: 22),
        selectedIcon: Icon(Icons.school_rounded, color: AppColors.primary, size: 23),
        label: 'Grades',
        tooltip: 'Grade Planner',
      ),
      NavigationDestination(
        icon: Icon(Icons.person_outline, size: 22),
        selectedIcon: Icon(Icons.person_rounded, color: AppColors.primary, size: 23),
        label: 'Profile',
        tooltip: 'Student Profile',
      ),
    ];

    if (isTablet) {
      return Scaffold(
        body: Row(
          children: [
            NavigationRail(
              selectedIndex: navigationShell.currentIndex,
              onDestinationSelected: _onTap,
              labelType: NavigationRailLabelType.selected,
              backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surfaceLight,
              selectedIconTheme: const IconThemeData(color: AppColors.primary),
              selectedLabelTextStyle: const TextStyle(
                color: AppColors.primary,
                fontWeight: FontWeight.w700,
                fontSize: 12,
              ),
              unselectedLabelTextStyle: TextStyle(
                color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                fontSize: 11,
              ),
              destinations: destinations
                  .map(
                    (d) => NavigationRailDestination(
                      icon: d.icon,
                      selectedIcon: d.selectedIcon,
                      label: Text(d.label),
                    ),
                  )
                  .toList(),
            ),
            const VerticalDivider(thickness: 1, width: 1),
            Expanded(child: navigationShell),
          ],
        ),
      );
    }

    return Scaffold(
      body: navigationShell,
      bottomNavigationBar: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.fromLTRB(14, 0, 14, 10),
          child: Container(
            decoration: BoxDecoration(
              color: isDark
                  ? AppColors.surfaceDark.withValues(alpha: 0.96)
                  : AppColors.surfaceLight.withValues(alpha: 0.98),
              borderRadius: BorderRadius.circular(28),
              border: Border.all(
                color: isDark ? AppColors.borderDark : AppColors.borderLight,
                width: 1.2,
              ),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withValues(alpha: isDark ? 0.35 : 0.08),
                  blurRadius: 18,
                  offset: const Offset(0, 6),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(28),
              child: NavigationBarTheme(
                data: NavigationBarThemeData(
                  labelTextStyle: WidgetStateProperty.resolveWith((states) {
                    if (states.contains(WidgetState.selected)) {
                      return const TextStyle(
                        fontSize: 11,
                        fontWeight: FontWeight.w800,
                        color: AppColors.primary,
                        letterSpacing: -0.2,
                      );
                    }
                    return TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w500,
                      color: isDark ? AppColors.textDarkMuted : AppColors.textLightMuted,
                    );
                  }),
                ),
                child: NavigationBar(
                  selectedIndex: navigationShell.currentIndex,
                  onDestinationSelected: _onTap,
                  height: 60,
                  elevation: 0,
                  backgroundColor: Colors.transparent,
                  labelBehavior: NavigationDestinationLabelBehavior.onlyShowSelected,
                  indicatorColor: AppColors.primary.withValues(alpha: 0.16),
                  indicatorShape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                  ),
                  destinations: destinations,
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
