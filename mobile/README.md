# 📱 StudentBrain — Flutter Android Application

[![Flutter](https://img.shields.io/badge/Flutter-3.47.5-02569B?logo=flutter)](https://flutter.dev/)
[![Dart](https://img.shields.io/badge/Dart-3.13.4-0175C2?logo=dart)](https://dart.dev/)
[![Version](https://img.shields.io/badge/Release-v2.6.3%2B55-3DDC84?logo=android&logoColor=white)](https://github.com/souravsahapartho/uiu-student-brain/releases/tag/v2.6.3)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**StudentBrain Mobile** is the official Android companion application for the StudentBrain academic operating system. Built with Flutter, it empowers UIU scholars with real-time study tracking, a dynamic TTS voice coach, course material readers, post-session Gemini AI diagnostic quizzes, live follower/following community networks, and scheduled academic notifications.

---

## 🚀 Key Features

- **⚡ Lightning-Fast Authentication**:
  - Instant email pre-validation preventing redundant backend password hashing delays.
  - Single-roundtrip login: Access/refresh tokens and user profile payload return together, halving dashboard load time.
  - Safe, automatic queued token refresh interceptor via Dio.
- **🎯 Dynamic Focus Tracker & Pomodoro**:
  - Manual start/pause/resume timer controls (no unwanted auto-starts).
  - Trimester course selection and uploaded study material linking.
  - Instant AI quiz generation directly from linked materials upon session completion.
  - Focus page auto-reloads whenever the bottom navigation item is re-tapped.
- **🔊 Voice Coach & Celebrations**:
  - Dynamic Text-to-Speech (TTS) voice announcements.
  - Randomized, motivational congratulations upon finishing focus sessions.
- **🤝 Live Scholar Community Network**:
  - Real-time auto-synchronization of follower and following counts.
  - Comprehensive follower list modals with compact **Remove Follower** and **Unfollow** actions.
  - Instant discussion post editing replacing the existing post rather than creating duplicates.
  - Clean, responsive discussion cards and nested replies.
- **🔔 Persistent Event Notifications**:
  - Automatic alerts delivered **1 day before** and **1 hour before** scheduled campus study events.
  - Tapping alerts marks them as read with backend database persistence.
- **🏆 Global Scholar Leaderboard**:
  - Default opt-in for all students with personal privacy toggle.
  - Multi-tier ranking by weekly focus minutes, consecutive streaks, and all-time hours.
- **📚 Study Materials & PDF Reader**:
  - In-app document reading for lecture slides, notes, and handouts.
  - Clean UI without redundant saved badges.

---

## 🏗️ Architecture & Tech Stack

```
mobile/
├── android/               # Native Android build configurations & Gradle
├── assets/                # App icons, university badges, and branding assets
├── lib/
│   ├── core/              # Cross-cutting concerns & shared infrastructure
│   │   ├── config/        # Global Riverpod providers & environment setup
│   │   ├── constants/     # API endpoints, colors, dimensions, typography
│   │   ├── network/       # DioClient, AuthInterceptor, ApiException
│   │   ├── storage/       # FlutterSecureStorage service
│   │   ├── utils/         # Formatters, date helpers, debouncers
│   │   └── widgets/       # GlassCard, AppButton, AppTextField, GoogleLogo, etc.
│   ├── features/          # Feature-Driven modular architecture
│   │   ├── auth/          # Login, Register, Profile, Forgot Password
│   │   ├── dashboard/     # Academic command center & summary widgets
│   │   ├── tracker/       # Focus session timer, session history, voice coach
│   │   ├── planner/       # Schedule maker, weekly routine calendar
│   │   ├── grades/        # GPA planner, retake simulator, credit audits
│   │   ├── materials/     # Study documents, file reader, course folders
│   │   ├── community/     # Discussions, replies, follow network, leaderboard
│   │   └── notifications/ # Alerts, event reminders, read state tracking
│   └── main.dart          # App entrypoint, Riverpod scope, theme setup
├── test/                  # Unit and widget tests
└── pubspec.yaml           # Dependencies and version configuration
```

### Libraries & Dependencies:
- **State Management**: `flutter_riverpod: ^2.6.1`
- **Routing**: `go_router: ^14.8.1`
- **Networking**: `dio: ^5.8.0+1` with queued JWT refresh interceptor
- **Secure Storage**: `flutter_secure_storage: ^9.2.4`
- **Voice Engine**: `flutter_tts: ^4.2.0`
- **Notifications**: `flutter_local_notifications: ^18.0.1`
- **Charts & Visualizations**: `fl_chart: ^0.70.2`
- **UI & Icons**: `google_fonts: ^6.3.3`, `cupertino_icons: ^1.0.9`

---

## 📦 Download Release APK

The latest release binary is tracked directly in the repository:

- 📥 **Direct APK Download**: [StudentBrain.apk](https://github.com/souravsahapartho/uiu-student-brain/blob/main/mobile/StudentBrain.apk?raw=true)
- 🌐 **Release Page**: [GitHub Release v2.6.3](https://github.com/souravsahapartho/uiu-student-brain/releases/tag/v2.6.3)

---

## 🛠️ Local Development & Build

### Prerequisites:
- Flutter SDK `^3.13.4` or later (tested on Flutter `3.47.5`)
- Android Studio / Android SDK (API 34+)
- JDK 17

### 1. Install Dependencies:
```bash
cd mobile
flutter pub get
```

### 2. Run Debug Mode:
```bash
flutter run
```

### 3. Build Production Release APK:
```bash
flutter build apk --release
```
The compiled APK will be generated at:
`mobile/build/app/outputs/flutter-apk/app-release.apk`
