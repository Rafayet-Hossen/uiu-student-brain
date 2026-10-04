# 💻 StudentBrain — Web Application (React 19 + Vite)

[![React Version](https://img.shields.io/badge/React-19.2-61DAFB?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8.1.5-646CFF?logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-Ready-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**StudentBrain Web** is the modern Single-Page Application (SPA) frontend for the StudentBrain academic operating system. Built with React 19, Vite, and Framer Motion, it delivers a glassmorphic user interface tailored for university scholars.

---

## 🚀 Key Features

- **🎓 Smart UIU Course Autocomplete**: Instant search and validation across 12 trimesters of UIU BSCSE courses, displaying exam slots, prerequisites, and credit loads.
- **📈 Grade Planner & GPA Trajectory**: Real-time quality-point mathematical projection, retake scenario simulator, and remaining required GPA calculations.
- **⏱️ Study Tracker & Live Focus**: Time-gated focus session timer, Pomodoro integration, and post-session Google Gemini AI diagnostic testing.
- **📚 Materials Hub & Reader**: Full-screen lecture document viewer with markdown support and PDF study-guide exporter.
- **🌐 Dynamic Host Resolver**: Automatically resolves API base URL from `window.location.hostname`, enabling zero-config access over local LAN or tunnels.
- **⚡ Fast Authentication**: Single-request login retrieving JWT tokens and user profile simultaneously, eliminating sequential roundtrips.
- **👥 Scholar Community & Social Feed**: Real-time discussions, nested comments, upvotes, study events with RSVP, and privacy-preserving global leaderboard.

---

## 🏗️ Architecture & Directory Structure

```
frontend/
├── public/                 # Static branding, logo, favicon, SVG icons
├── src/
│   ├── assets/             # Images, illustrations, and graphic assets
│   ├── components/         # Shared reusable UI elements (GlassCard, Navbar, Modals)
│   ├── data/               # UIU syllabus constants, course catalog matrices
│   ├── features/           # Domain-driven feature modules
│   │   ├── analytics/      # Weekly charts, subject distribution, adherence audit
│   │   ├── auth/           # Login, Register, Profile, AuthContext, JWT handling
│   │   ├── community/      # Social discussions, leaderboard, event RSVPs
│   │   ├── dashboard/      # Academic command center, KPI counters
│   │   ├── grades/         # GPA planner, retake advisor, feasibility engine
│   │   ├── materials/      # Course documents, in-browser reader, PDF exporter
│   │   ├── planner/        # Routine maker, weekly schedule calendar grid
│   │   ├── quiz/           # Post-session Gemini diagnostic test & review cards
│   │   └── tracker/        # Focus timer, session logging, streak trackers
│   ├── lib/                # Axios instance, interceptors, error parsers
│   ├── theme/              # Dark/light mode theme variables & tokens
│   ├── App.jsx             # Top-level application component & providers
│   ├── routes.jsx          # React Router v6 route configuration
│   └── main.jsx            # Application entrypoint
├── index.html              # HTML shell with meta tags & font preloads
├── package.json            # NPM scripts & dependencies
└── vite.config.js          # Vite build, HMR, and server configurations
```

---

## 🛠️ Local Development & Scripts

### 1. Install Dependencies:
```bash
cd frontend
npm install
```

### 2. Start Development Server:
```bash
npm run dev
```
The application will be live at `http://localhost:5173`.

### 3. Build for Production:
```bash
npm run build
```
The optimized production bundle will be output to `frontend/dist/`.

### 4. Preview Production Build:
```bash
npm run preview
```
