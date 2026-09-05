# Feature tracker

This is the single source of truth for what's built and what isn't. We
build **one feature at a time**, test it, then push to GitHub before
starting the next one.

Update this file in the same PR that finishes a feature — not before, not
after.

---

## Status legend

| Symbol | Meaning               |
| ------ | --------------------- |
| ⬜     | Not started           |
| 🟡     | In progress           |
| 🔵     | In review (PR open)   |
| ✅     | Done (merged to main) |
| ⏸️     | Blocked               |

---

## Definition of Done

A feature is only ✅ when **all** of these are true:

- Backend service + endpoint exist.
- It has at least one test.
- The frontend screen consumes it, with loading, error, and empty states handled.
- It's merged to `main`.
- This tracker is updated in the same PR.

---

## Features (in build order)

| #   | Feature (backend app name)                                | Depends on                       | MUST/STRETCH | Backend | Frontend | Status | Owner   | Notes                                                 |
| --- | --------------------------------------------------------- | -------------------------------- | ------------ | ------- | -------- | ------ | ------- | ----------------------------------------------------- |
| 1   | Accounts (`accounts`)                                     | None                             | MUST         | ✅      | ✅       | ✅     | Rafayet | Register, login, JWT auth, profile, avatar & bios     |
| 2   | Study Schedule Maker (`planner`)                          | Accounts                         | MUST         | ✅      | ✅       | ✅     | Sourav  | Routine from time + subjects + deadlines + notes      |
| 3   | Grade Planner (`grades`)                                  | Accounts                         | MUST         | ✅      | ✅       | ✅     | Rafayet | Target GPA, grades, required scores + projection      |
| 4   | Study Tracker (`tracker`)                                 | Accounts                         | MUST         | ✅      | ✅       | ✅     | Rafayet | Log sessions, habits, streaks                         |
| 5   | Community (`community`)                                   | Accounts                         | MUST         | ✅      | ✅       | ✅     | Sourav  | Posts, comments, reactions, follow, events + RSVP     |
| 6   | AI service (`ai`)                                         | Accounts                         | MUST         | ✅      | N/A      | ✅     | Rafayet | Core Gemini AI client, structured schemas & services  |
| 7   | Material Upload & Analyze (`materials`)                   | AI service                       | MUST         | ✅      | ✅       | ✅     | Rafayet | Semesters, Courses, PDF upload, links, AI Tutor chat  |
| 8   | Study Session Test + Weak Topic Detection (`assessments`) | AI service, Materials            | MUST         | ⬜      | ⬜       | ⬜     |         | AI quiz, score, weak areas                            |
| 9   | AI Revision Planner (extends `planner`/`assessments`)     | Assessments, Planner, AI service | MUST         | ⬜      | ⬜       | ⬜     |         | Revision plan from weak topics + deadlines            |
| 10  | Rewards & streaks (extends `tracker`)                     | Study Tracker                    | MUST         | ✅      | ✅       | ✅     | Rafayet | Daily-plan achievement rewards                        |
| 11  | Study Analytics Dashboard (`analytics`)                   | Tracker, Grades, Assessments     | MUST         | ✅      | ✅       | ✅     | Rafayet | Charts across tracker + grades + assessments          |
| 12  | AI Risk Prediction (`analytics`)                          | Tracker, Grades                  | STRETCH      | ⬜      | ⬜       | ⬜     |         | Flag falling-behind students (rule-based fallback OK) |
| 13  | Leaderboard (`community`/`tracker`)                       | Tracker                          | STRETCH      | ✅      | ✅       | ✅     | Sourav  | Opt-in ranking                                        |

`Backend` and `Frontend` track each half's progress using the same legend
above. `Status` is the feature's overall status — only ✅ once both halves
are done and the Definition of Done is met. Row 6 (AI service) has no
frontend screen by design, so its Frontend cell is `N/A` instead of ⬜.

---

## Change log

| Date       | Feature                            | Change                              | By      |
| ---------- | ---------------------------------- | ----------------------------------- | ------- |
| 2026-08-14 | Study Schedule Maker (`planner`)   | Started feature development         | Sourav  |
| 2026-08-30 | Accounts (`accounts`)              | Completed backend and frontend      | Rafayet |
| 2026-08-30 | Study Schedule Maker (`planner`)   | Completed backend and frontend      | Sourav  |
| 2026-08-30 | Grade Planner (`grades`)           | Completed backend and frontend      | Rafayet |
| 2026-08-30 | Study Tracker (`tracker`)          | Completed backend and frontend      | Rafayet |
| 2026-08-30 | Academic UI Redesign               | Modern academic theme & UI overhaul | Rafayet |
| 2026-08-30 | Community (`community`)            | Completed backend and frontend      | Sourav  |
| 2026-08-31 | Rewards & Streaks (`tracker`)      | Completed backend and frontend      | Rafayet |
| 2026-08-31 | Study Analytics (`analytics`)      | Completed backend and frontend      | Rafayet |
| 2026-08-31 | Leaderboard (`community`)          | Completed backend and frontend      | Sourav  |
| 2026-09-03 | AI Service Core (`ai`)             | Completed backend core AI service   | Rafayet |
| 2026-09-03 | Material Upload & AI (`materials`) | Completed backend and frontend      | Rafayet |
| 2026-09-05 | Frontend Redesign v3               | Integrated modern UI/UX overhaul    | Rafayet |

Add one row here every time a feature's status changes — keep the newest
entry at the bottom.
