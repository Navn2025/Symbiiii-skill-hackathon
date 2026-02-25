# HireSpec — Comprehensive Codebase Audit Report

> **Generated**: June 2025  
> **Scope**: Full frontend + backend line-by-line review  
> **Total Issues Found**: 400+

---

## Table of Contents

- [0 — Full UI Fix](#0--full-ui-fix)
- [1 — Layer-1 Updation (Project Infrastructure)](#1--layer-1-updation-project-infrastructure)
- [2 — Compare JD / Import Features](#2--compare-jd--import-features)
- [3 — Recruiter Interview](#3--recruiter-interview)
- [4 — Practice Feature](#4--practice-feature)
- [5 — Coding Practice](#5--coding-practice)
- [6 — AI Interview](#6--ai-interview)
- [7 — AI Calling](#7--ai-calling)
- [8 — Chatbot (Axiom / Spec AI)](#8--chatbot-axiom--spec-ai)
- [9 — Company Section Backend](#9--company-section-backend)
- [10 — Admin Section](#10--admin-section)
- [11 — AI Tutor / Resume Verification](#11--ai-tutor--resume-verification)
- [VP — Video Proctoring](#vp--video-proctoring)
- [Cross-Cutting Systemic Issues](#cross-cutting-systemic-issues)
- [Frontend Services Summary](#frontend-services-summary)
- [Frontend Components Summary](#frontend-components-summary)
- [Backend Middleware Summary](#backend-middleware-summary)
- [Backend Services Summary](#backend-services-summary)
- [Auth Routes](#auth-routes)
- [AI Routes](#ai-routes)
- [Summary by Severity](#summary-by-severity)

---

## 0 — Full UI Fix

### App Shell & Routing (App.jsx, main.jsx, index.html)

| #   | File       | Line(s) | Severity | Issue                                                                                             |
| --- | ---------- | ------- | -------- | ------------------------------------------------------------------------------------------------- |
| 1   | App.jsx    | —       | High     | No 404/catch-all route — unmatched URLs show a blank page                                         |
| 2   | App.jsx    | —       | High     | No auth guards on protected routes — any URL directly accessible                                  |
| 3   | App.jsx    | —       | Medium   | No `React.lazy()` or `<Suspense>` — entire app loaded in one bundle                               |
| 4   | App.jsx    | —       | Low      | `HIDE_NAVBAR_PATHS` is incomplete — some pages show navbar that shouldn't                         |
| 5   | main.jsx   | —       | Low      | No null-check on `document.getElementById('root')`                                                |
| 6   | index.html | —       | Medium   | No `<meta description>`, no OG tags, favicon is default Vite, no `<noscript>` fallback            |
| 7   | index.html | —       | Low      | No `theme-color` meta for mobile browsers                                                         |
| 8   | index.css  | —       | Medium   | References fonts (Inter, JetBrains Mono, Fira Code) that are never loaded via `@font-face` or CDN |
| 9   | index.css  | —       | Low      | No `prefers-reduced-motion` or `prefers-color-scheme` media queries                               |

### Home Page (Home.jsx, Home.css)

| #   | Line(s)  | Severity | Issue                                                                                                                          |
| --- | -------- | -------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 10  | Home.jsx | High     | `ScrollReveal` left/right animations both map to `[0, 0]` — never actually slide                                               |
| 11  | Home.jsx | Medium   | `AnimatePresence` imported but never used                                                                                      |
| 12  | Home.jsx | Medium   | `line2Done` variable is dead code — never triggers any action                                                                  |
| 13  | Home.jsx | High     | 4 concurrent `setInterval` calls for counters — causes CPU churn; no cleanup on unmount                                        |
| 14  | Home.jsx | Medium   | 40 `FloatingParticles` divs with infinite CSS animations — performance drain on low-end devices                                |
| 15  | Home.jsx | High     | `mode-card::after` requires CSS variables (`--mouse-x`,`--mouse-y`) that are never set by JavaScript — spotlight effect broken |
| 16  | Home.jsx | Critical | Defines its own inline Navbar that conflicts with App.jsx's Navbar component                                                   |
| 17  | Home.jsx | Low      | Hardcoded vanity metrics (10000+ interviews, etc.) with no data source                                                         |
| 18  | Home.css | Low      | Duplicate `scroll-behavior` declaration                                                                                        |
| 19  | Home.css | Medium   | `.btn-ghost` / `.btn-secondary` CSS class conflicts                                                                            |
| 20  | Home.css | Low      | Multiple `!important` overrides — specificity war                                                                              |

### Login Page (Login.jsx, Login.css)

| #   | Line(s)   | Severity | Issue                                                                                                          |
| --- | --------- | -------- | -------------------------------------------------------------------------------------------------------------- |
| 21  | Login.jsx | Critical | **Login field mismatch**: Frontend sends `{email}` but backend `/login` expects `{username}` — login is broken |
| 22  | Login.jsx | Critical | **Face login URL mismatch**: Frontend calls `/faceLogin` but backend route is `/face-login`                    |
| 23  | Login.jsx | High     | Demo seed fires on every mount — creates duplicate demo accounts                                               |
| 24  | Login.jsx | High     | `console.log` leaks PII (email, tokens) to browser console                                                     |
| 25  | Login.jsx | High     | `localStorage` stores user data — XSS-accessible                                                               |
| 26  | Login.jsx | Medium   | Fragile response parsing — tries 3 different response shapes with guesswork                                    |
| 27  | Login.jsx | Medium   | No CSRF token sent with login request                                                                          |
| 28  | Login.jsx | Medium   | No rate limiting on face login attempts                                                                        |
| 29  | Login.jsx | Low      | Tabs lack ARIA `role="tablist"` / `role="tab"`                                                                 |
| 30  | Login.jsx | Low      | Inputs lack `<label>` elements and `autocomplete` attributes                                                   |
| 31  | Login.css | High     | **Broken CSS**: Lines ~240-247 have orphaned rules after `@media` block — syntax error                         |
| 32  | Login.css | Medium   | `min-height` assumes 80px navbar but navbar is hidden on login                                                 |
| 33  | Login.css | Low      | No `focus-visible` styles for keyboard navigation                                                              |

### Register Page (Register.jsx)

| #   | Line(s)      | Severity | Issue                                                                                    |
| --- | ------------ | -------- | ---------------------------------------------------------------------------------------- |
| 34  | Register.jsx | High     | `stepInfo` has only 4 entries but wizard has 7 steps — steps 5-7 crash or show undefined |
| 35  | Register.jsx | Medium   | 6-character minimum password — too weak                                                  |
| 36  | Register.jsx | Medium   | `images` state stores base64 photos but never sends them to backend                      |
| 37  | Register.jsx | Low      | Role dropdown has no close-on-outside-click handler                                      |
| 38  | Register.jsx | Low      | No back button on camera capture steps                                                   |
| 39  | Register.jsx | Low      | No password strength indicator                                                           |
| 40  | Register.jsx | Low      | No ARIA attributes on form elements                                                      |

### Forgot Password (ForgotPassword.jsx)

| #   | Line(s)            | Severity | Issue                                                                                         |
| --- | ------------------ | -------- | --------------------------------------------------------------------------------------------- |
| 41  | ForgotPassword.jsx | Critical | Reset sends email+password WITHOUT OTP verification token — **anyone can reset any password** |
| 42  | ForgotPassword.jsx | Medium   | Inconsistent OTP response shape parsing                                                       |
| 43  | ForgotPassword.jsx | Low      | No OTP expiry countdown shown to user                                                         |
| 44  | ForgotPassword.jsx | Low      | No resend cooldown — users can spam OTP requests                                              |

### Candidate Dashboard (CandidateDashboard.jsx, .css — 1468 + 2174 lines)

| #   | Severity | Issue                                                                         |
| --- | -------- | ----------------------------------------------------------------------------- |
| 45  | High     | Uses `user.id` but MongoDB returns `user._id` — comparisons always fail       |
| 46  | High     | Profile completion hardcoded to 50% — never calculated                        |
| 47  | High     | Assessments count hardcoded to 0                                              |
| 48  | High     | Timer race condition in AI Calling tab — state updates on unmounted component |
| 49  | Medium   | `joinLoading` state set to true but never reset to false on failure           |
| 50  | Medium   | `appliedJobIds` Set recreated every render — O(n) per render                  |
| 51  | Medium   | Search input is decorative — no filtering logic                               |
| 52  | Medium   | Bell notification icon is decorative — no notifications system                |
| 53  | Medium   | `alert()` used for errors instead of toast/modal                              |
| 54  | Medium   | Logout doesn't invalidate server-side token                                   |
| 55  | Medium   | `candidateId` read from client localStorage, not auth token                   |
| 56  | Medium   | Conversation history array grows unbounded                                    |
| 57  | Low      | `getStatusColor()` function defined but never called                          |
| 58  | Low      | No pagination on jobs list                                                    |
| 59  | CSS      | Undefined `--border-hover` CSS variable                                       |
| 60  | CSS      | Scrollbar hidden with `overflow: hidden` — confuses users                     |
| 61  | CSS      | Logout button hidden on mobile viewports                                      |

### Candidate Profile (CandidateProfile.jsx, .css — 956 + 1231 lines)

| #   | Severity | Issue                                                                                                               |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| 62  | High     | Missing `navigate` in useEffect dependency array                                                                    |
| 63  | High     | `JSON.parse()` on localStorage with no try-catch — can crash on corrupt data                                        |
| 64  | Medium   | `profileCompletion` fallback is 10 but dashboard shows 50                                                           |
| 65  | Medium   | File input not reset after upload                                                                                   |
| 66  | Medium   | Client-side-only file validation — server accepts anything                                                          |
| 67  | Medium   | No file size enforcement                                                                                            |
| 68  | Medium   | No unsaved changes warning on navigation                                                                            |
| 69  | CSS      | Dead CSS classes: `.cp-ats-results`, `.cp-ats-details`, `.cp-ats-score-big`, `.cp-ats-value`, `.cp-recommendations` |

### Candidate Analytics (CandidateAnalytics.jsx, .css — 723 + 476 lines)

| #   | Severity | Issue                                                                    |
| --- | -------- | ------------------------------------------------------------------------ |
| 70  | High     | API error silently swallowed — shows empty dashboard                     |
| 71  | High     | 13 properties destructured without null checks                           |
| 72  | Medium   | `AnimatePresence` imported unused                                        |
| 73  | Medium   | `sort()` mutates original data array                                     |
| 74  | Medium   | `AnimatedNumber` infinite loop if value is 0                             |
| 75  | Medium   | `html2canvas` + `jsPDF` statically imported (~800KB) — should be dynamic |
| 76  | Low      | Charts are completely inaccessible (no ARIA)                             |
| 77  | CSS      | Global `* { box-sizing }` reset leaks to all elements                    |
| 78  | CSS      | Hardcoded colors instead of CSS variables                                |
| 79  | CSS      | No print media query despite having export-to-PDF feature                |

### Candidate Results (CandidateResults.jsx — 386 lines)

| #   | Severity | Issue                                                                            |
| --- | -------- | -------------------------------------------------------------------------------- |
| 80  | Medium   | Hardcoded `sde-fullstack` role                                                   |
| 81  | Medium   | API errors silently swallowed                                                    |
| 82  | Medium   | No null check on `candidate.sections`                                            |
| 83  | Medium   | `CircularProgress` component defined inside render — recreated every render      |
| 84  | Medium   | `sort()` mutates array                                                           |
| 85  | Low      | "Is You" detection compares by name not ID — name collisions cause false matches |
| 86  | Low      | `Minus` and `Cell` imported but unused                                           |

### Company Dashboard (CompanyDashboard.jsx — 887 lines)

| #   | Severity | Issue                                                                                     |
| --- | -------- | ----------------------------------------------------------------------------------------- |
| 87  | Critical | **Mock data ALWAYS appended** to real data — stats are always inflated                    |
| 88  | High     | `selectedJobApplicants` has null vs [] type confusion                                     |
| 89  | High     | `c.candidate?.name` structure doesn't match API response shape                            |
| 90  | Medium   | `loadingJobs` state tracked but never renders a loading indicator                         |
| 91  | Medium   | Pipeline values are hardcoded, never from API                                             |
| 92  | Medium   | "Create Quiz" / "View" / "View Results" / "Configure" buttons have **no onClick handler** |
| 93  | Medium   | "Start Interview" navigates to `/` instead of interview page                              |
| 94  | Medium   | Modal has no ESC-to-close handler                                                         |
| 95  | Medium   | Search input does nothing                                                                 |
| 96  | Low      | Donut chart SVG has no ARIA labels                                                        |

### Recruiter Dashboard (RecruiterDashboard.jsx — 204 lines)

| #   | Severity | Issue                                                                       |
| --- | -------- | --------------------------------------------------------------------------- |
| 97  | Critical | **100% mock/hardcoded data** — no API calls for real data                   |
| 98  | Medium   | `api` imported but never used                                               |
| 99  | Medium   | Hardcoded 2024 dates                                                        |
| 100 | Medium   | "Create New Interview" / "View" / "Schedule" buttons have **no onClick**    |
| 101 | Medium   | No logout button                                                            |
| 102 | Medium   | No auth check on mount                                                      |
| 103 | CSS      | **Light theme** (#f5f5f5 background) completely clashes with dark app theme |
| 104 | CSS      | Generic selectors (`table`, `thead th`, `tbody td`) leak globally           |

### Proctor Dashboard (ProctorDashboard.jsx — 398 lines)

| #   | Severity | Issue                                                           |
| --- | -------- | --------------------------------------------------------------- |
| 105 | Critical | **No authentication** — any user can view proctor dashboard     |
| 106 | High     | Raw `fetch()` bypasses auth interceptor — no token sent         |
| 107 | High     | No `response.ok` check on any fetch call                        |
| 108 | High     | Socket connection has no auth                                   |
| 109 | Medium   | 5-second polling AND socket = double-fetching same data         |
| 110 | Medium   | "View Full Report" / "Join Session" buttons have **no onClick** |
| 111 | Medium   | Hardcoded `localhost:5000` URL                                  |
| 112 | Low      | Emoji characters used as semantic icons                         |
| 113 | Low      | Session cards are `<div onClick>` — not keyboard accessible     |

### Admin Scoring (AdminScoring.jsx — 598 lines)

| #   | Severity | Issue                                                                                                   |
| --- | -------- | ------------------------------------------------------------------------------------------------------- |
| 114 | High     | All API errors silently swallowed                                                                       |
| 115 | High     | `saveThreshold` fires API call on every keystroke                                                       |
| 116 | High     | `topN` fires API call on every keystroke                                                                |
| 117 | Medium   | `exportCSV` sends empty role parameter                                                                  |
| 118 | Medium   | Podium renders null for missing candidates                                                              |
| 119 | Medium   | `JSON.parse()` with no try-catch                                                                        |
| 120 | Medium   | 7 unused imports (`Bell`, `Briefcase`, `Zap`, `ChevronRight`, `ArrowUpRight`, `Percent`, `useCallback`) |
| 121 | Medium   | No role check — any logged-in user can access admin scoring                                             |
| 122 | Medium   | Score distribution IIFE computed in JSX on every render                                                 |
| 123 | Low      | Table sort headers not keyboard accessible                                                              |

### Secondary Camera (SecondaryCameraView.jsx — 39 lines)

| #   | Severity | Issue                                                           |
| --- | -------- | --------------------------------------------------------------- |
| 124 | High     | `SecondaryCamera` receives no `interviewId` or `userName` props |
| 125 | Medium   | `code` variable never passed to child component                 |
| 126 | Medium   | Wake Lock acquired but never released                           |
| 127 | Low      | `alert()` fallback on unsupported devices                       |

---

## 1 — Layer-1 Updation (Project Infrastructure)

### Frontend (package.json, vite.config.js)

| #   | Severity | Issue                                                               |
| --- | -------- | ------------------------------------------------------------------- |
| 128 | Medium   | **No API proxy** in vite.config.js — CORS issues in development     |
| 129 | Medium   | `global: globalThis` polyfill in define — leaks to all modules      |
| 130 | Low      | No sourcemaps configured for production debugging                   |
| 131 | Medium   | Duplicate charting libraries: both `apexcharts` AND `recharts`      |
| 132 | Medium   | `face-api.js@0.22.2` is abandoned (last update: 2020)               |
| 133 | Low      | `@types` packages installed without TypeScript                      |
| 134 | Medium   | No linter (ESLint), formatter (Prettier), or test runner configured |

### Backend (package.json, config.js, server.js)

| #   | Severity | Issue                                                                                                 |
| --- | -------- | ----------------------------------------------------------------------------------------------------- |
| 135 | Critical | **No password hashing library** — no `bcrypt`/`bcryptjs` in dependencies                              |
| 136 | Critical | **No `helmet`** — custom security headers used instead of battle-tested library                       |
| 137 | High     | **No `express-mongo-sanitize`** — NoSQL injection possible via `Mixed` type fields                    |
| 138 | High     | **No `compression`** middleware — responses not gzip-compressed                                       |
| 139 | Medium   | Dead dependency: `mysql2` included but app uses MongoDB only                                          |
| 140 | Medium   | No test framework (jest/mocha/vitest)                                                                 |
| 141 | Medium   | No `hpp` (HTTP Parameter Pollution) protection                                                        |
| 142 | High     | `config.js` exports config object that is **never imported** — server.js reads `process.env` directly |
| 143 | Critical | `JWT_SECRET` NOT in `REQUIRED_ENV_VARS` — if missing, falls back to hardcoded secret                  |
| 144 | Medium   | Missing validation for email env vars (`EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`)                      |
| 145 | Medium   | Twilio credentials default to empty string with no warning                                            |
| 146 | High     | **Error logging middleware placed BEFORE routes** in server.js L143 — never catches route errors      |
| 147 | Medium   | Unused variable: `const {logger: log}` — `log` never used; separate `logger` import used instead      |
| 148 | Medium   | Hardcoded health check: `mongodbConnected: true`, `redisConnected: false`                             |
| 149 | Low      | Swapped comments on `/ready` and `/live` endpoints                                                    |
| 150 | High     | **50MB body size limit** globally — DoS vector for all endpoints                                      |
| 151 | High     | CSRF only covers 2 routes (`/api/profile/update`, `/api/interview/submit`) — all others unprotected   |
| 152 | Medium   | `FRONTEND_URL` parsed differently in config.js (single string) vs server.js (comma-split)             |

### Dead Code — Entire Files

| #   | File                             | Lines | Issue                                                  |
| --- | -------------------------------- | ----- | ------------------------------------------------------ |
| 153 | backend/db/database.js           | 213   | **Entire MySQL module** never imported — all dead code |
| 154 | backend/routes/practice.js.bak   | —     | Backup file in repository                              |
| 155 | backend/routes/proctoring.js.bak | —     | Backup file in repository                              |

### MongoDB Connection (backend/db/mongodb.js — 52 lines)

| #   | Severity | Issue                                                                                                   |
| --- | -------- | ------------------------------------------------------------------------------------------------------- |
| 156 | Medium   | Race condition: concurrent `connectMongoDB()` calls pass `if (isConnected)` check before either sets it |
| 157 | Medium   | Redundant DB name in URI fallback AND `dbName` option — option silently overrides URI                   |
| 158 | Medium   | No `disconnectMongoDB()` exported — server shutdown doesn't close MongoDB                               |

---

## 2 — Compare JD / Import Features

### Jobs Routes (backend/routes/jobs.js — 585 lines)

| #   | Severity | Issue                                                                                 |
| --- | -------- | ------------------------------------------------------------------------------------- |
| 159 | Critical | `userId` taken from request body, not `req.user` — any user can act as any other user |
| 160 | High     | No ownership check on PUT/DELETE job — any user can edit/delete any job               |
| 161 | High     | `candidateId` from body, not auth token — IDOR on application endpoints               |
| 162 | Medium   | ReDoS vulnerability in search regex construction                                      |
| 163 | Medium   | Any user can view any candidate's applications                                        |
| 164 | Low      | No pagination on job listings                                                         |

### Job Model (backend/models/Job.js — 65 lines)

| #   | Severity | Issue                                                                  |
| --- | -------- | ---------------------------------------------------------------------- |
| 165 | Medium   | No validation that `salary.min <= salary.max` — allows inverted ranges |
| 166 | Medium   | `salary.min`/`salary.max` allow negative values                        |
| 167 | Low      | No `maxlength` on `title`, `department`, `description`, `requirements` |
| 168 | Low      | `skills` array has no max size                                         |
| 169 | Low      | `companyName` missing `trim` (unlike `title` and `department`)         |

---

## 3 — Recruiter Interview

### Interview Room (InterviewRoom.jsx — 485 lines)

| #   | Severity | Issue                                                                                   |
| --- | -------- | --------------------------------------------------------------------------------------- |
| 170 | Critical | **Stale closure** on `language` variable in socket listener — always uses initial value |
| 171 | High     | Missing useEffect dependencies cause stale state                                        |
| 172 | High     | Crashes on null `starterCode`                                                           |
| 173 | High     | `mode === 'recruiter'` is never true — dead code path                                   |
| 174 | High     | Crashes on null `currentQuestion` with no guard                                         |
| 175 | High     | No auth on proctoring fetch — any user can fetch proctoring data                        |
| 176 | Medium   | Client-side integrity scoring — easily bypassable                                       |
| 177 | Medium   | "Test Alert" button visible in production                                               |
| 178 | Medium   | Blocking `alert()` for test alerts                                                      |
| 179 | Medium   | **End Interview button has no onClick handler**                                         |
| 180 | Medium   | Socket emits on every keystroke — no debounce                                           |
| 181 | Low      | `Beaker` icon import doesn't exist in lucide-react                                      |

### Interview Routes (backend/routes/interview.js — 165 lines)

| #   | Severity | Issue                                                                    |
| --- | -------- | ------------------------------------------------------------------------ |
| 182 | Critical | `req.user.id` is always `undefined` — JWT uses `userId` field, not `id`  |
| 183 | Critical | Queries with undefined `candidateId` return ALL interviews for ALL users |
| 184 | High     | No ownership checks on any endpoint                                      |

---

## 4 — Practice Feature

### Practice Session Setup (PracticeSessionSetup.jsx — 220 lines)

| #   | Severity | Issue                                                        |
| --- | -------- | ------------------------------------------------------------ |
| 185 | Medium   | Session ID uses `Date.now()` — not cryptographically unique  |
| 186 | Medium   | `practiceSession` stored in localStorage but never read back |
| 187 | Low      | Cards use `<div onClick>` — not keyboard accessible          |

### Practice Mode (PracticeMode.jsx — 321 lines)

| #   | Severity | Issue                                                      |
| --- | -------- | ---------------------------------------------------------- |
| 188 | High     | Missing null guard on `questions[]` — crash on empty array |
| 189 | Medium   | Hardcoded hint for all questions regardless of content     |
| 190 | Medium   | Deprecated `onKeyPress` instead of `onKeyDown`             |
| 191 | Medium   | No timer for practice sessions                             |
| 192 | Medium   | No save/resume functionality                               |
| 193 | Low      | `addAIMessage` creates unbounded message array             |
| 194 | Low      | Previous button doesn't restore previous code              |

### Practice Interview Room (PracticeInterviewRoom.jsx — 553 lines)

| #   | Severity | Issue                                                                   |
| --- | -------- | ----------------------------------------------------------------------- |
| 195 | Critical | Timer useEffect has stale closure — timer value never updates correctly |
| 196 | Critical | `handleFinishInterview` captures stale state                            |
| 197 | High     | No `response.ok` checking on ANY fetch call                             |
| 198 | High     | `confirm()` used for destructive actions                                |
| 199 | High     | Navigates without waiting for cleanup to complete                       |
| 200 | High     | `role.replace()` crashes if role is null                                |
| 201 | High     | ALL `fetch()` calls missing `credentials: 'include'`                    |
| 202 | Medium   | `isFinished` state declared but never read                              |
| 203 | Medium   | Uses `<textarea>` for code instead of CodeEditor component              |
| 204 | CSS      | Missing closing brace at L717 — breaks all subsequent styles            |
| 205 | CSS      | `.start-btn` class name collision with other components                 |

### Practice Feedback (PracticeFeedback.jsx — 253 lines)

| #   | Severity | Issue                                                                      |
| --- | -------- | -------------------------------------------------------------------------- |
| 206 | Critical | `POST /finish` called on every page load — sends duplicate finish requests |
| 207 | High     | No `response.ok` check on API calls                                        |
| 208 | High     | Crash on null `strengths`/`weaknesses` arrays                              |
| 209 | High     | No auth on fetch calls                                                     |
| 210 | Low      | Session ID displayed in plaintext on page                                  |
| 211 | CSS      | Extra closing brace at L210 breaks styles                                  |

### Practice Routes (backend/routes/practice.js — 596 lines)

| #   | Severity | Issue                                                                |
| --- | -------- | -------------------------------------------------------------------- |
| 212 | Critical | `req.user.id` always undefined — same JWT field mismatch             |
| 213 | High     | Session lookup matches ANY session — no user scoping                 |
| 214 | High     | Completed sessions can be reopened                                   |
| 215 | Medium   | Fallback query has no userId scoping — returns other users' sessions |

### Practice Session Model (PracticeSession.js — 100 lines)

| #   | Severity | Issue                                                                                |
| --- | -------- | ------------------------------------------------------------------------------------ |
| 216 | Medium   | Conflicting timestamps: manual `createdAt`/`updatedAt` + `timestamps: true`          |
| 217 | Medium   | Redundant `unique: true` + `index: true` on sessionId                                |
| 218 | Medium   | `questions` and `responses` arrays both track Q&A with scores — redundant data model |
| 219 | Low      | `score`, `duration`, `totalQuestions` — no min/max validation                        |

---

## 5 — Coding Practice

### Coding Practice Page (CodingPractice.jsx — 357 lines)

| #   | Severity | Issue                                                                           |
| --- | -------- | ------------------------------------------------------------------------------- |
| 220 | High     | Silent mock data fallback with mismatched ID types (number vs MongoDB ObjectId) |
| 221 | Medium   | Language change resets code without warning                                     |
| 222 | Medium   | Null `selectedQuestion` crash                                                   |
| 223 | Low      | No auto-save                                                                    |
| 224 | Low      | No keyboard shortcuts                                                           |
| 225 | CSS      | Grid doesn't update when sidebar collapses (260px hardcoded)                    |

### Coding Practice Routes (backend/routes/codingPractice.js — 686 lines)

| #   | Severity | Issue                                                                                            |
| --- | -------- | ------------------------------------------------------------------------------------------------ |
| 226 | Critical | **Mock execution active by default** — `DEMO_MODE` undefined → `true` → random pass/fail results |
| 227 | High     | Error responses return HTTP 200 instead of 500                                                   |
| 228 | High     | `/generate` silently falls back to random problem on AI failure — no error flag to client        |
| 229 | Medium   | No validation on `code` body — arbitrary content/length accepted                                 |
| 230 | Medium   | 430 lines of inline problem bank — should be in database                                         |
| 231 | Low      | Same 5-line problem-lookup loop duplicated 4 times                                               |

### Code Execution Routes (backend/routes/codeExecution.js — 82 lines)

| #   | Severity | Issue                                                                        |
| --- | -------- | ---------------------------------------------------------------------------- |
| 232 | Critical | `/execute` is **100% hardcoded mock** — always returns "Hello, World!"       |
| 233 | Critical | `/submit` is **100% hardcoded** — ignores all input, returns fake 3/5 passed |
| 234 | High     | No authentication on any endpoint                                            |
| 235 | Medium   | Error responses return HTTP 200                                              |
| 236 | Low      | `code`, `language`, `questionId` destructured but never used in `/submit`    |

### CP AI Questions (backend/routes/cpAiQuestions.js — 169 lines)

| #   | Severity | Issue                                                                           |
| --- | -------- | ------------------------------------------------------------------------------- |
| 237 | High     | No authentication — anyone can exhaust Groq API quota                           |
| 238 | Medium   | `Math.random()` seed defeats purpose of reproducible seeding                    |
| 239 | Medium   | API error details leaked to client                                              |
| 240 | Medium   | `detectLanguage` has false positives — comment `// const` triggers JS detection |
| 241 | Medium   | Prompt injection via `topics` parameter — no sanitization                       |
| 242 | Medium   | No timeout on `validateAndFixTestCases` — infinite loops hang server            |

### CP Analysis (backend/routes/cpAnalysis.js — 48 lines)

| #   | Severity | Issue                                                                           |
| --- | -------- | ------------------------------------------------------------------------------- |
| 243 | High     | No authentication on `/analyze`, `/suggestions`, `/detect-ai`                   |
| 244 | Medium   | Missing input validation on `/suggestions` — `code`/`language` can be undefined |
| 245 | Low      | Inconsistent response formats across endpoints                                  |

### CP Code (backend/routes/cpCode.js — 46 lines)

| #   | Severity | Issue                                                                        |
| --- | -------- | ---------------------------------------------------------------------------- |
| 246 | High     | No authentication — anyone can execute arbitrary code                        |
| 247 | High     | Session cooldown bypassed by omitting `sessionId`                            |
| 248 | Medium   | Session errors silently swallowed — code executes even if session terminated |
| 249 | Medium   | No code size limit — multi-GB payload accepted                               |

### CP Questions (backend/routes/cpQuestions.js — 100 lines)

| #   | Severity | Issue                                                           |
| --- | -------- | --------------------------------------------------------------- |
| 250 | High     | No authentication on any endpoint                               |
| 251 | High     | IDOR: `/progress/:userId` exposes any user's progress           |
| 252 | High     | IDOR: `/submit` accepts `userId` from body — submit as any user |
| 253 | Low      | All handlers are unnecessarily async                            |

### CP Reports (backend/routes/cpReports.js — 32 lines)

| #   | Severity | Issue                                                                                                               |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------- |
| 254 | High     | No authentication on report generation/download                                                                     |
| 255 | Critical | **HTTP header injection**: `filename` parameter used unsanitized in `Content-Disposition` — CRLF injection possible |
| 256 | Medium   | No content size limit on `markdown` body                                                                            |

### CP Session (backend/routes/cpSession.js — 91 lines)

| #   | Severity | Issue                                                                                                              |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| 257 | Critical | No authentication on ANY of 8 endpoints (create, read, violation, metrics, cooldown, complete, terminate, summary) |
| 258 | Critical | No authorization — any session can be terminated/manipulated by anyone                                             |
| 259 | Medium   | Anonymous sessions allowed with `userId: 'anonymous'`                                                              |

### Code Executor Service (backend/services/codeExecutor.js — 186 lines)

| #   | Severity | Issue                                                                                       |
| --- | -------- | ------------------------------------------------------------------------------------------- |
| 260 | Critical | **JS sandbox escape**: Indirect eval `(0,eval)('require("child_process")')` bypasses regex  |
| 261 | Critical | **JS sandbox escape**: Constructor chain `this.constructor.constructor('return process')()` |
| 262 | Critical | **JS sandbox escape**: String concatenation `global['req'+'uire']('fs')`                    |
| 263 | Critical | **JS sandbox escape**: Dynamic `import()` not blocked                                       |
| 264 | Critical | **Python sandbox escape**: `__builtins__.__import__('os').system('whoami')`                 |
| 265 | Critical | **Python sandbox escape**: `type.__subclasses__()` chains                                   |
| 266 | Critical | **No process isolation** — no containers, namespaces, chroot, or seccomp                    |
| 267 | High     | `ensureTempDir()` in constructor not awaited — first call may fail                          |
| 268 | High     | File leak on compilation failure — source files not cleaned up                              |
| 269 | High     | `execSync` for compilation blocks Node event loop                                           |
| 270 | Medium   | Python `resource.setrlimit` only works on Linux — Windows has NO memory limits              |
| 271 | Medium   | Any stderr output flags as error — even warnings                                            |

### Test Runner Service (backend/services/testRunner.js — 155 lines)

| #   | Severity | Issue                                                                                             |
| --- | -------- | ------------------------------------------------------------------------------------------------- |
| 272 | Critical | **No security validation** — wraps user code directly into test harnesses with zero checks        |
| 273 | High     | **Shell command injection risk** — `exec(command)` with shell interpolation                       |
| 274 | High     | **Race condition**: Java always uses `Main.java` — concurrent runs overwrite each other           |
| 275 | Medium   | `functionName[language]` crashes if functionName is string, not object                            |
| 276 | Medium   | `formatJavaArgs` only handles `int`/`String` — `double`, `boolean`, `long`, etc. treated as `int` |
| 277 | Low      | C++ function name regex misses `long long`, `unsigned int`, `map<K,V>` return types               |

### Question Bank Service (backend/services/questionBank.js — 350 lines)

| #   | Severity | Issue                                                                           |
| --- | -------- | ------------------------------------------------------------------------------- |
| 278 | High     | **All data in-memory** — questions and progress lost on server restart          |
| 279 | Medium   | `userProgress` Map grows indefinitely — memory leak                             |
| 280 | Medium   | Binary tree question has `testCases: []` — zero test cases, untestable          |
| 281 | Low      | `sanitizeQuestion` strips `testCases` — downstream code expecting it will break |

### Session Manager Service (backend/services/sessionManager.js — 140 lines)

| #   | Severity | Issue                                                                         |
| --- | -------- | ----------------------------------------------------------------------------- |
| 282 | High     | Both `sessions` and `submissions` Maps grow indefinitely                      |
| 283 | Medium   | `hasOwnProperty` called directly — prototype pollution risk                   |
| 284 | Medium   | `recordSubmission` increments count before time check — off-by-one accounting |
| 285 | Medium   | No session expiration for active sessions                                     |

---

## 6 — AI Interview

### AI Interview Setup (AIInterviewSetup.jsx — 168 lines)

| #   | Severity | Issue                                                                        |
| --- | -------- | ---------------------------------------------------------------------------- |
| 286 | High     | Duration value type mismatch (number vs string) — comparison failures        |
| 287 | Medium   | `setLoading(false)` only in catch block — success path stays loading forever |
| 288 | Medium   | `candidateId` from localStorage — spoofable by user                          |
| 289 | Medium   | `alert()` for validation errors                                              |
| 290 | Low      | Topic toggle buttons lack `aria-pressed`                                     |

### AI Interview Room (AIInterviewRoom.jsx — 417 lines)

| #   | Severity | Issue                                                                    |
| --- | -------- | ------------------------------------------------------------------------ |
| 291 | Critical | **Stale closure** in timer — `handleEndInterview` captures initial state |
| 292 | Critical | **Stale closure** in speech recognition callback                         |
| 293 | High     | `speechSynthesis.onvoiceschanged` listener never cleaned up              |
| 294 | Medium   | `voices` may be undefined on first load                                  |
| 295 | Medium   | No timer warning before auto-end                                         |
| 296 | Medium   | No end confirmation dialog                                               |
| 297 | Low      | `key={index}` — unstable list key                                        |
| 298 | Low      | Emoji buttons have no `aria-label`                                       |
| 299 | Low      | Timer element has no `role="timer"`                                      |

### AI Interview Report (AIInterviewReport.jsx — 696 lines)

| #   | Severity | Issue                                                   |
| --- | -------- | ------------------------------------------------------- |
| 300 | High     | Missing dependencies in useEffect                       |
| 301 | Medium   | Print CSS hides candidate name, role, and date          |
| 302 | Medium   | Canvas charts completely inaccessible — no alt text     |
| 303 | Low      | `getDashboardPath` re-parses localStorage on every call |

### AI Interview Routes (backend/routes/aiInterview.js — 533 lines)

| #   | Severity | Issue                                                                  |
| --- | -------- | ---------------------------------------------------------------------- |
| 304 | Critical | **NO AUTH on ALL 10 endpoints**                                        |
| 305 | Critical | Legacy `/start` uses invalid `router.handle()` — crashes on invocation |
| 306 | High     | Section scores use `Math.random()` — random grading                    |
| 307 | Medium   | Route collision blacklist is incomplete                                |

### AI Interviewer Service (backend/services/aiInterviewer.js — 619 lines)

| #   | Severity | Issue                                                                                |
| --- | -------- | ------------------------------------------------------------------------------------ |
| 308 | High     | Biased shuffle: `sort(() => Math.random()-0.5)` not uniform distribution             |
| 309 | High     | `response.data.choices[0].message.content` — no null/bounds check (appears 4+ times) |
| 310 | Medium   | `conversationHistory` Map never cleaned on abandoned sessions — memory leak          |
| 311 | Medium   | `evaluateAnswer` has no timeout — can hang indefinitely                              |
| 312 | Low      | `audioMetrics` parameter accepted but mostly ignored                                 |

### AI Interview Model (backend/models/AIInterview.js — 105 lines)

| #   | Severity | Issue                                                                           |
| --- | -------- | ------------------------------------------------------------------------------- |
| 313 | Medium   | Redundant `unique: true` + `index: true` on interviewId                         |
| 314 | Medium   | `candidateName` — no `trim`, no `maxlength`                                     |
| 315 | Medium   | `role` — no `trim`, no `maxlength`, no enum                                     |
| 316 | Medium   | `topics` array — no max size limit                                              |
| 317 | Medium   | `duration` — no min/max (allows negative)                                       |
| 318 | Medium   | `sectionScores` fields — no min/max (allows negative or >100)                   |
| 319 | Low      | `questionMetadata`, `evaluation`, `report` all use `Mixed` type — no validation |

---

## 7 — AI Calling

### AI Calling Routes (backend/routes/aiCalling.js — 177 lines)

| #   | Severity | Issue                                                                                      |
| --- | -------- | ------------------------------------------------------------------------------------------ |
| 320 | Critical | **NO AUTH on any endpoint** — anyone can trigger Twilio calls                              |
| 321 | Critical | Twilio phone number exposed in route                                                       |
| 322 | High     | No phone number validation — can call arbitrary numbers                                    |
| 323 | High     | No rate limiting — unlimited calls can be triggered                                        |
| 324 | Medium   | AI Calling tab in CandidateDashboard has timer race condition (state updates on unmounted) |

---

## 8 — Chatbot (Axiom / Spec AI)

### Axiom Chat (AxiomChat.jsx — 118 lines)

| #   | Severity | Issue                                                                     |
| --- | -------- | ------------------------------------------------------------------------- |
| 325 | High     | Stale `conversationHistory` sent in API call — closure captures old value |
| 326 | Medium   | Suggestion items not clickable                                            |
| 327 | Medium   | No markdown rendering in responses                                        |
| 328 | Low      | No timestamps on messages                                                 |
| 329 | Low      | No retry mechanism on failed messages                                     |

### Axiom Chat Routes (backend/routes/axiomChat.js — 133 lines)

| #   | Severity | Issue                                             |
| --- | -------- | ------------------------------------------------- |
| 330 | Critical | **NO AUTH** on any endpoint                       |
| 331 | High     | In-memory Map storage — lost on restart           |
| 332 | High     | No user isolation — can access other users' chats |
| 333 | Medium   | `Date.now()` collision-unsafe IDs                 |
| 334 | Medium   | Unbounded memory growth per chat session          |

### Spec AI Chat Routes (backend/routes/specAiChat.js — 137 lines)

| #   | Severity | Issue                                                  |
| --- | -------- | ------------------------------------------------------ |
| 335 | Critical | **NO AUTH** on any endpoint                            |
| 336 | Critical | IDOR via client-provided `userId`                      |
| 337 | High     | No input length limits — prompt injection possible     |
| 338 | Medium   | `conversationHistory` injection via manipulated userId |

### Chat Panel Component (ChatPanel.jsx — 107 lines)

| #   | Severity | Issue                                                          |
| --- | -------- | -------------------------------------------------------------- |
| 339 | Medium   | Deprecated `onKeyPress` event handler                          |
| 340 | Medium   | `index` as key for messages — causes React reconciliation bugs |
| 341 | Medium   | Duplicate messages appear from own sends                       |
| 342 | Medium   | Unbounded message array                                        |
| 343 | Low      | No label on chat input                                         |
| 344 | Low      | Socket may be null — no guard                                  |

---

## 9 — Company Section Backend

### Application Model (backend/models/Application.js — 52 lines)

| #   | Severity | Issue                                                               |
| --- | -------- | ------------------------------------------------------------------- |
| 345 | Medium   | `coverLetter` — no maxlength (DoS vector)                           |
| 346 | Medium   | `round` is free-form string — should be enum                        |
| 347 | Medium   | `score` — no min/max validation                                     |
| 348 | Low      | `appliedAt` redundant with `timestamps: true` providing `createdAt` |

### User Model (backend/models/User.js — 103 lines)

| #   | Severity | Issue                                                                                       |
| --- | -------- | ------------------------------------------------------------------------------------------- |
| 349 | Critical | **NO PASSWORD HASHING** — no `pre('save')` hook, no bcrypt dependency. Plaintext passwords. |
| 350 | Critical | No `select: false` on password field — returned in every query                              |
| 351 | High     | No `minlength` on password — 1-character passwords accepted                                 |
| 352 | Medium   | `email` — no regex format validation                                                        |
| 353 | Medium   | `username` — no minlength/maxlength                                                         |
| 354 | Medium   | `phone` — no format validation                                                              |
| 355 | Medium   | `linkedIn`, `github`, `portfolio` — no URL validation                                       |
| 356 | Medium   | `projects.technologies` uses `Mixed` type — should be `[String]`                            |
| 357 | Low      | `projects` has both `url` and `link` fields — redundant                                     |
| 358 | Low      | `desiredSalary` is String — should be Number                                                |
| 359 | Low      | `atsScore` — no min(0)/max(100)                                                             |

### OTP Model (backend/models/Otp.js — 36 lines)

| #   | Severity | Issue                                                         |
| --- | -------- | ------------------------------------------------------------- |
| 360 | Critical | **OTP stored as plaintext** — exposed if database compromised |
| 361 | High     | No `attempts` field — cannot limit brute-force OTP guessing   |

### Profile Routes (backend/routes/profile.js — 477 lines)

| #   | Severity | Issue                                                    |
| --- | -------- | -------------------------------------------------------- |
| 362 | Critical | **PDFParse import broken** — causes crash on require     |
| 363 | Critical | pdf-parse API misuse (wrong function signature)          |
| 364 | High     | IDOR on all `:userId` routes — no ownership verification |

---

## 10 — Admin Section

### Scoring Routes (backend/routes/scoring.js — 509 lines)

| #   | Severity | Issue                                                                                  |
| --- | -------- | -------------------------------------------------------------------------------------- |
| 365 | Critical | **NO AUTH on ALL 10 endpoints** including admin PUT endpoints                          |
| 366 | High     | No NaN/bounds validation on config updates — `Number("abc")` = NaN breaks comparisons  |
| 367 | High     | Unvalidated `jobRole` — arbitrary strings create cache pollution, unbounded memory     |
| 368 | Medium   | In-memory cache never evicts                                                           |
| 369 | Medium   | Inconsistent role label: "Full Stack Engineer" vs "Full Stack Developer" for same role |
| 370 | Medium   | ~280 lines of near-identical code duplicated between live/fallback branches            |
| 371 | Medium   | Non-deterministic mock data from `Math.random()`                                       |
| 372 | Low      | `User` imported but never used                                                         |

### Questions Routes (backend/routes/questions.js — 137 lines)

| #   | Severity | Issue                                                              |
| --- | -------- | ------------------------------------------------------------------ |
| 373 | Critical | **NO AUTH** on CRUD endpoints — anyone can create/delete questions |
| 374 | High     | `...req.body` spread directly — arbitrary data injection           |
| 375 | High     | PUT allows overwriting protected fields (`id`, `createdAt`)        |
| 376 | Medium   | In-memory data — all custom questions lost on restart              |
| 377 | Medium   | No pagination on GET /                                             |
| 378 | Low      | `parseInt` without NaN check on random count                       |

---

## 11 — AI Tutor / Resume Verification

### Resume Verification (ResumeVerification.jsx — 676 lines)

| #   | Severity | Issue                                                                           |
| --- | -------- | ------------------------------------------------------------------------------- |
| 379 | High     | `JSON.parse()` with no try-catch — crash on corrupt data                        |
| 380 | High     | Client-side state construction is fragile — assumes API response shape          |
| 381 | Medium   | Double-click reset sends multiple DELETE requests                               |
| 382 | Medium   | 5 unused imports (`Briefcase`, `BarChart3`, `FileText`, `TrendingUp`, `Unlock`) |
| 383 | Medium   | No confirmation dialog before reset                                             |
| 384 | Medium   | Assessment answers lost on page refresh                                         |
| 385 | Low      | Pipeline divs not keyboard accessible                                           |

### Verification Routes (backend/routes/verification.js — 443 lines)

| #   | Severity | Issue                                                          |
| --- | -------- | -------------------------------------------------------------- |
| 386 | Critical | **NO AUTH on ALL endpoints** including DELETE reset            |
| 387 | Critical | Complete IDOR — client-provided userId used for all operations |

### Verification Service (backend/services/verificationService.js — 666 lines)

| #   | Severity | Issue                                                                             |
| --- | -------- | --------------------------------------------------------------------------------- |
| 388 | Medium   | Type cycling mismatch — specific question bank entries go unused                  |
| 389 | Medium   | `String.replace()` special characters (`$&`, `$$`) corrupt output                 |
| 390 | Medium   | `analyzeOverclaims` expects numeric scores but questions have letter/text answers |
| 391 | Medium   | No automated scoring adapter for MCQ/coding/scenario questions                    |

### Resume Parser Service (backend/services/resumeParser.js — 600 lines)

| #   | Severity | Issue                                                                                 |
| --- | -------- | ------------------------------------------------------------------------------------- |
| 392 | Medium   | First non-empty line assumed to be name — false if resume starts with "RESUME" header |
| 393 | Medium   | US-centric phone regex — misses international formats                                 |
| 394 | Low      | Experience extraction captures first match only — may get partial experience          |
| 395 | Low      | `c++` skill matching regex may fail at word boundaries                                |
| 396 | Low      | O(n×m) skill extraction — 200 keys × document length per parse                        |

### Gemini AI Service (backend/services/geminiAI.js — 101 lines)

| #   | Severity | Issue                                                                                   |
| --- | -------- | --------------------------------------------------------------------------------------- |
| 397 | Critical | On embedding failure returns zero vector — Pinecone stores meaningless results silently |
| 398 | Medium   | `response.text` vs `response.text()` — SDK version-dependent                            |
| 399 | Medium   | No timeout on any Gemini API call                                                       |

### Groq Analyzer Service (backend/services/groqAnalyzer.js — 131 lines)

| #   | Severity | Issue                                                               |
| --- | -------- | ------------------------------------------------------------------- |
| 400 | High     | **API key first 8 chars leaked to console** in log message          |
| 401 | Medium   | No timeout on API calls                                             |
| 402 | Medium   | `choices[0].message.content` — no null/bounds check                 |
| 403 | Low      | Variable naming check `/\b[a-z]\b/` matches loop vars `i`, `j`, `n` |

### AI Detector Service (backend/services/aiDetector.js — 150 lines)

| #   | Severity | Issue                                                                  |
| --- | -------- | ---------------------------------------------------------------------- |
| 404 | Medium   | No timeout on Groq API call                                            |
| 405 | Medium   | `choices[0]` — no bounds check                                         |
| 406 | Low      | Docstring regex has optional closing quotes — matches unclosed strings |

---

## VP — Video Proctoring

### Proctoring Monitor Component (ProctoringMonitor.jsx — 149 lines)

| #   | Severity | Issue                                                            |
| --- | -------- | ---------------------------------------------------------------- |
| 407 | High     | 7 unused icon imports                                            |
| 408 | High     | `suspicionScore` and `interviewId` props accepted but never used |
| 409 | Critical | Cleanup function only returned conditionally — can miss cleanup  |
| 410 | CSS      | 2-column grid layout but 3 stat children — layout breaks         |

### Proctoring Service (frontend/services/proctoring.js — 853 lines)

| #   | Severity | Issue                                                                                     |
| --- | -------- | ----------------------------------------------------------------------------------------- |
| 411 | Critical | **Event payload mismatch**: wraps events in `{event}` key but backend expects flat fields |
| 412 | High     | `MODEL_URL` dead code — overwritten before use                                            |
| 413 | High     | Silent success on model load failure                                                      |
| 414 | High     | Video ready timeout race condition                                                        |
| 415 | High     | Global regex flag reuse bug — matches fail on alternating calls                           |
| 416 | High     | `alert()` blocks UI thread during interviews                                              |
| 417 | High     | `window.location.href` navigation destroys React state                                    |
| 418 | Medium   | Face detection every 2 seconds — heavy on low-end devices                                 |
| 419 | Medium   | Screen monitoring polls every 5 seconds                                                   |
| 420 | Medium   | Violations array grows unbounded                                                          |
| 421 | Medium   | Copy/paste blocking easily bypassable                                                     |

### Face Recognition Service (frontend/services/faceRecognition.js — 172 lines)

| #   | Severity | Issue                                                                        |
| --- | -------- | ---------------------------------------------------------------------------- |
| 422 | Critical | CDN model URL is third-party GitHub Pages — **supply chain risk**            |
| 423 | High     | Uses different model than proctoring.js (ssdMobilenetv1 vs tinyFaceDetector) |
| 424 | Medium   | Models loaded twice if both services used                                    |
| 425 | Medium   | No progress indicator during model loading                                   |
| 426 | Low      | Sequential descriptor processing instead of parallel                         |

### Proctoring Routes (backend/routes/proctoring.js — 305 lines)

| #   | Severity | Issue                                                        |
| --- | -------- | ------------------------------------------------------------ |
| 427 | Critical | `req.user.id` always undefined — JWT `userId` field mismatch |
| 428 | High     | `faceLostCount++` on undefined = NaN — face tracking broken  |
| 429 | High     | Typo: `environmentnoise` should be `environmentNoise`        |
| 430 | High     | No role check on dashboard — any user can view proctor data  |
| 431 | High     | Any user can flag any session                                |
| 432 | Medium   | `/dashboard/sessions` shadowed by `/:interviewId` route      |

### Face Service (backend/services/faceService.js — 260 lines)

| #   | Severity | Issue                                                                                                                                                  |
| --- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 433 | Critical | **Biometric drift attack**: Adaptive update (lr=0.05) shifts stored embedding toward each new input — attacker can gradually hijack biometric identity |
| 434 | High     | Permanent failure on init error — `initError` never cleared, all subsequent calls fail until server restart                                            |
| 435 | Medium   | Score thresholds assume cosine similarity — wrong if Pinecone uses different metric                                                                    |
| 436 | Low      | `RATIO_THRESHOLD` constant defined but never used                                                                                                      |

### Proctoring Model (backend/models/InterviewProctoring.js — 136 lines)

| #   | Severity | Issue                                                      |
| --- | -------- | ---------------------------------------------------------- |
| 437 | High     | **Typo**: `environmentnoise` should be `environmentNoise`  |
| 438 | Medium   | Conflicting timestamps: manual fields + `timestamps: true` |
| 439 | Medium   | `events` array — no max size limit (unbounded growth)      |
| 440 | Medium   | `metadata` uses `Mixed` type — no validation               |
| 441 | Low      | `violationCount`/`warningCount` — no min(0)                |

### Socket Handlers (backend/socket/handlers.js — 247 lines)

| #   | Severity | Issue                                                                   |
| --- | -------- | ----------------------------------------------------------------------- |
| 442 | Critical | **NO socket authentication** — any client can connect and emit events   |
| 443 | Critical | Any socket can join proctor dashboard — no authorization                |
| 444 | Critical | Any socket can join any interview room — no ownership check             |
| 445 | High     | Anonymous AI chat allowed — unauthenticated users consume paid API      |
| 446 | High     | Logic bug: proctor removed from Set inside secondary-snapshot handler   |
| 447 | High     | `secondaryCameraMappings` Map never cleaned on disconnect — memory leak |
| 448 | High     | `proctorDashboardSockets` Set entries never cleaned on disconnect       |
| 449 | Medium   | No input validation on ANY socket event                                 |
| 450 | Medium   | No rate limiting on socket events                                       |
| 451 | Low      | Business logic imported from route file instead of service              |

### Video Panel Component (VideoPanel.jsx)

| #   | Severity | Issue                                                      |
| --- | -------- | ---------------------------------------------------------- |
| 452 | Medium   | WebRTC peer connection has no ICE candidate error handling |
| 453 | Medium   | No fallback for browsers without WebRTC support            |

### Secondary Camera Component (SecondaryCamera.jsx)

| #   | Severity | Issue                                            |
| --- | -------- | ------------------------------------------------ |
| 454 | Medium   | Camera stream not properly cleaned up on unmount |
| 455 | Low      | No camera permission denied handling             |

---

## Cross-Cutting Systemic Issues

### S1 — CRITICAL: `req.user.id` Always Undefined

**Affects**: interview.js, practice.js, proctoring.js, and any route using `verifyAuth`  
**Root Cause**: JWT payload stores `userId` but middleware sets `req.user = decoded` — routes access `req.user.id` which doesn't exist  
**Impact**: All user-scoped queries use `undefined` as userId, returning ALL records or creating orphaned data

### S2 — CRITICAL: Plaintext Password Storage

**Affects**: User.js model, auth.js routes  
**Root Cause**: No `bcrypt`/`bcryptjs` dependency, no `pre('save')` hook  
**Impact**: All user passwords stored as plaintext in MongoDB

### S3 — CRITICAL: 40+ Unprotected Routes

| Route File       | # Unprotected Endpoints |
| ---------------- | ----------------------- |
| scoring.js       | 10                      |
| questions.js     | 6                       |
| cpSession.js     | 8                       |
| cpAiQuestions.js | 2                       |
| cpAnalysis.js    | 3                       |
| cpCode.js        | 2                       |
| cpQuestions.js   | 5                       |
| cpReports.js     | 2                       |
| aiInterview.js   | 10                      |
| aiCalling.js     | 3+                      |
| axiomChat.js     | all                     |
| specAiChat.js    | all                     |
| verification.js  | all                     |
| codeExecution.js | 2                       |

### S4 — CRITICAL: No Code Execution Sandbox

Code runs via native `child_process` with regex-only validation. Multiple bypass vectors exist for JavaScript, Python, C++, and Java. No containerization, namespaces, or resource limits.

### S5 — HIGH: Hardcoded JWT Secret Fallback

`auth.js` L3: `const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key-change-in-production'`  
If env var missing, all tokens are forgeable with the known secret.

### S6 — HIGH: JWT Algorithm Not Restricted

`jwt.verify(token, JWT_SECRET)` with no `{ algorithms: ['HS256'] }` — vulnerable to algorithm confusion attacks (`alg: "none"`).

### S7 — HIGH: Permissions-Policy Blocks Camera/Mic

`securityHeaders.js` sets `camera=(), microphone=()` — **blocks all camera and microphone access**, breaking the proctoring feature entirely.

### S8 — HIGH: CSP Allows unsafe-inline and unsafe-eval

`script-src 'self' 'unsafe-inline' 'unsafe-eval'` completely negates XSS protection from CSP.

### S9 — HIGH: Redis Client Misconfiguration

`cache.js` passes `host`/`port` as top-level options but redis v4 expects them inside `socket: {}`. Options silently ignored — always connects to localhost:6379.

### S10 — HIGH: In-Memory State Everywhere

| Store                 | Location                   | Risk                        |
| --------------------- | -------------------------- | --------------------------- |
| Rate limit timestamps | middleware/rateLimit.js    | Lost per-worker, on restart |
| CSRF tokens           | middleware/csrf.js         | Lost per-worker, on restart |
| Chat messages         | routes/axiomChat.js        | Lost on restart             |
| Questions             | routes/questions.js        | Lost on restart             |
| Sessions              | services/sessionManager.js | Lost on restart             |
| User progress         | services/questionBank.js   | Lost on restart             |
| Problem bank          | routes/codingPractice.js   | In-memory only              |
| Scoring cache         | routes/scoring.js          | Never evicts                |

### S11 — HIGH: Monkey-Patching Conflicts

Both `timeout.js` and `logger.js` middleware monkey-patch `res.send`. Only the last-applied patch survives — the other's cleanup/logging logic is silently lost.

### S12 — MEDIUM: Dual HTTP Clients

Frontend uses both `axios` (via api.js) and raw `fetch()` (in multiple pages). Auth headers/interceptors only applied to axios — fetch calls skip authentication.

### S13 — MEDIUM: Hardcoded localhost:5000

Multiple frontend files hardcode `http://localhost:5000` instead of using environment variables — breaks in any non-local deployment.

### S14 — MEDIUM: No Input Sanitization Before AI Prompts

User-supplied strings (`candidateName`, `role`, `answer`, `code`) interpolated directly into AI prompts across `aiInterviewer.js`, `groqAnalyzer.js`, `aiDetector.js`. Prompt injection possible.

### S15 — MEDIUM: Inconsistent Error Handling

Services return errors in 4+ different ways: throw errors, return `{error: ...}`, return `null`, return fallback data. No consistent error contract.

### S16 — MEDIUM: No MongoDB Disconnect on Shutdown

`server.js` graceful shutdown only disconnects Redis, not MongoDB. No `disconnectMongoDB()` function exported.

### S17 — LOW: Singleton Anti-Pattern

Every service exports `new ClassName()` — makes testing impossible (can't inject mocks) and creates hidden shared state.

### S18 — LOW: Temp File Accumulation

Code executor and test runner have multiple paths where temp files aren't cleaned up. `temp/` directory fills with orphaned `.js`, `.py`, `.java`, `.cpp` files. No periodic cleanup job.

---

## Frontend Services Summary

### api.js (129 lines)

| #   | Severity | Issue                                                        |
| --- | -------- | ------------------------------------------------------------ |
| F1  | Critical | Login sends `{email}` but backend expects `{username}`       |
| F2  | Critical | Face login URL `/faceLogin` should be `/face-login`          |
| F3  | High     | Duplicate proctoring event functions with different payloads |
| F4  | Medium   | Profile endpoint missing `:userId` parameter                 |
| F5  | Medium   | Circular dependency with authService.js                      |
| F6  | Medium   | `/questions/random/:count` shadowed by `/:id` route          |
| F7  | Medium   | Hardcoded `localhost:5000` fallback                          |
| F8  | Low      | `refreshToken` exported but never used                       |

### authService.js (275 lines)

| #   | Severity | Issue                                                             |
| --- | -------- | ----------------------------------------------------------------- |
| F9  | Critical | Login sends `{email}` but backend expects `{username}`            |
| F10 | Critical | `/faceLogin` URL should be `/face-login`                          |
| F11 | High     | Unsafe `email.split('@')` without null check                      |
| F12 | High     | Circular import with api.js                                       |
| F13 | High     | Duplicate HTTP client (fetch vs axios)                            |
| F14 | Medium   | No timeout on `initialize()`                                      |
| F15 | Medium   | Face descriptor sent unencrypted despite comment saying otherwise |
| F16 | Medium   | `sessionStorage` role is client-spoofable                         |
| F17 | Low      | `hasPermission()` client-only — no server enforcement             |
| F18 | Low      | `loadFromSessionStorage()` never called                           |

### socket.js (131 lines)

| #   | Severity | Issue                                                    |
| --- | -------- | -------------------------------------------------------- |
| F19 | Critical | **Hardcoded `localhost:5000`** — broken in production    |
| F20 | High     | `on()`/`off()` silently no-op when socket is null        |
| F21 | Medium   | All `emit()` silently no-op if disconnected — no queuing |
| F22 | Medium   | No auth token on socket connection                       |
| F23 | Medium   | No reconnection handling                                 |
| F24 | Low      | No event type constants — string event names throughout  |

---

## Frontend Components Summary

### CodeEditor.jsx (33 lines)

| #   | Severity | Issue                                                                  |
| --- | -------- | ---------------------------------------------------------------------- |
| C1  | Medium   | `languageMap` recreated every render — should be module-level constant |
| C2  | Medium   | No loading state for Monaco editor                                     |
| C3  | Low      | `'c'` is not a valid Monaco language identifier                        |

### ErrorBoundary.jsx (148 lines)

| #   | Severity | Issue                                                                     |
| --- | -------- | ------------------------------------------------------------------------- |
| C4  | Medium   | `Date.now()` as Error ID is meaningless to users                          |
| C5  | Medium   | Hover uses `e.target` not `e.currentTarget` — bubbles incorrectly         |
| C6  | High     | `process.env.NODE_ENV` doesn't work in Vite — should be `import.meta.env` |

### Navbar.jsx (72 lines)

| #   | Severity | Issue                                                           |
| --- | -------- | --------------------------------------------------------------- |
| C7  | Medium   | Storage event only fires cross-tab — same-tab logout not synced |
| C8  | Medium   | User data from localStorage with no validation                  |
| C9  | Medium   | Token not cleared from cookies on logout                        |
| C10 | Low      | No hamburger menu for mobile                                    |
| C11 | Low      | No active link styling                                          |

### Navbar.css

| #   | Severity | Issue                                                         |
| --- | -------- | ------------------------------------------------------------- |
| C12 | Medium   | `backdrop-filter` useless behind opaque `#000` background     |
| C13 | Low      | Staggered animation delays for 9 children but max 3 nav items |
| C14 | Low      | No focus styles for keyboard navigation                       |

### QuestionPanel.jsx (47 lines)

| #   | Severity | Issue                                                     |
| --- | -------- | --------------------------------------------------------- |
| C15 | Medium   | No null check on `question.examples` — crash if undefined |

### QuestionSelector.jsx (455 lines)

| #   | Severity | Issue                                                           |
| --- | -------- | --------------------------------------------------------------- |
| C16 | High     | Library questions NOT loaded on mount despite being default tab |
| C17 | High     | No `response.ok` check on any fetch call                        |
| C18 | Medium   | No auth headers sent                                            |
| C19 | Medium   | `q.id` may not exist — MongoDB uses `_id`                       |

---

## Backend Middleware Summary

### auth.js (106 lines)

| #   | Severity | Issue                                          |
| --- | -------- | ---------------------------------------------- |
| M1  | Critical | Hardcoded fallback JWT secret                  |
| M2  | High     | JWT verify with no algorithm restriction       |
| M3  | Medium   | `verifyRole` leaks allowed roles to client     |
| M4  | Medium   | No validation of decoded JWT payload structure |
| M5  | Medium   | No token revocation/blacklist mechanism        |

### validation.js (376 lines)

| #   | Severity | Issue                                                                                               |
| --- | -------- | --------------------------------------------------------------------------------------------------- |
| M6  | High     | Password regex not anchored with `$` — accepts trailing malicious chars                             |
| M7  | High     | Register schema allows self-assigning `company_admin`/`company_hr` roles — **privilege escalation** |
| M8  | Medium   | Password character class too restrictive — rejects `#`, `^`, `~`, `-`, `_`                          |
| M9  | Medium   | No max length on login username/password — hash-DoS possible                                        |
| M10 | Medium   | `updateProfile` allows changing email without re-authentication                                     |

### rateLimit.js (103 lines)

| #   | Severity | Issue                                                                 |
| --- | -------- | --------------------------------------------------------------------- |
| M11 | High     | In-memory Map not shared across workers/processes                     |
| M12 | High     | `req.ip` behind proxy always returns proxy IP                         |
| M13 | Medium   | `skipSuccessfulRequests`/`skipFailedRequests` accepted but never used |
| M14 | Medium   | `Math.min(...timestamps)` can stack overflow on large arrays          |
| M15 | Low      | Cleanup interval hardcoded 1hr regardless of windowMs                 |

### securityHeaders.js (38 lines)

| #   | Severity | Issue                                                                       |
| --- | -------- | --------------------------------------------------------------------------- |
| M16 | Critical | CSP `unsafe-inline` + `unsafe-eval` negates XSS protection                  |
| M17 | High     | `connect-src 'self' https:` allows connections to ANY HTTPS origin          |
| M18 | Medium   | `img-src` allows any HTTPS — tracking pixel risk                            |
| M19 | Medium   | `Access-Control-Allow-Credentials: true` without proper `Allow-Origin`      |
| M20 | Medium   | `camera=(), microphone=()` blocks proctoring features                       |
| M21 | Low      | `X-XSS-Protection: 1; mode=block` deprecated — can cause IE vulnerabilities |

### csrf.js (113 lines)

| #   | Severity | Issue                                                                        |
| --- | -------- | ---------------------------------------------------------------------------- |
| M22 | High     | In-memory token store — not shared across processes                          |
| M23 | High     | `sessionId` falls back to `req.ip` — shared by all users behind same IP      |
| M24 | High     | `crypto.timingSafeEqual` throws on different-length tokens — unhandled crash |
| M25 | Medium   | Tab generates new token → previous tab's token invalidated                   |
| M26 | Medium   | New token after verification set in `res.locals` but never sent to client    |
| M27 | Medium   | Pre-auth endpoints not in skip list — chicken-and-egg CSRF problem           |

### timeout.js (67 lines)

| #   | Severity | Issue                                                                                     |
| --- | -------- | ----------------------------------------------------------------------------------------- |
| M28 | High     | `req.socket.destroy()` kills keep-alive connections, crashes pipelined requests           |
| M29 | Medium   | Only patches `res.send`/`res.json` — `res.end()`, `res.redirect()`, streaming not covered |
| M30 | Low      | `req.socket.setTimeout()` without timeout event handler — no effect                       |

### logger.js (137 lines)

| #   | Severity | Issue                                                                                 |
| --- | -------- | ------------------------------------------------------------------------------------- |
| M31 | Medium   | Only patches `res.send` — `res.json()` may not trigger in all Express versions        |
| M32 | Medium   | Sensitive field redaction only checks top-level keys — nested passwords not sanitized |
| M33 | Low      | New `createLogger('HTTP')` per request — GC pressure                                  |
| M34 | Low      | No request ID generation for log correlation                                          |

### fileValidation.js (210 lines)

| #   | Severity | Issue                                                                      |
| --- | -------- | -------------------------------------------------------------------------- |
| M35 | High     | `fs.openSync` blocks event loop synchronously                              |
| M36 | Medium   | DOCX signature is generic ZIP header — any ZIP file passes DOCX validation |
| M37 | Medium   | `Math.random()` for filenames — predictable/guessable                      |
| M38 | Medium   | MIME type mismatch only logged as warning, not rejected                    |
| M39 | Low      | `fieldName` parameter accepted but never used                              |

### apiVersioning.js (382 lines)

| #   | Severity | Issue                                                                |
| --- | -------- | -------------------------------------------------------------------- |
| M40 | High     | Version normalization creates invalid 4-part versions (`1.0.0.0`)    |
| M41 | Medium   | URL regex only matches 2-part versions but config uses 3-part semver |
| M42 | Medium   | `Sunset` header uses `new Date(null)` → "Jan 1, 1970"                |
| M43 | Low      | `VersionCompatibility.transformRequest()` is a no-op stub            |

### transaction.js (304 lines)

| #   | Severity | Issue                                                                                           |
| --- | -------- | ----------------------------------------------------------------------------------------------- |
| M44 | High     | `withSessionMiddleware` commits after response sent — `ERR_HTTP_HEADERS_SENT` on commit failure |
| M45 | Medium   | `withLock` uses `findById` — no actual pessimistic lock acquired                                |
| M46 | Medium   | `session.hasEnded` is not a standard Mongoose/MongoDB driver property                           |
| M47 | Low      | `TransactionStats.recordRetry()` defined but never called                                       |

### response.js (159 lines)

| #   | Severity | Issue                                                                                    |
| --- | -------- | ---------------------------------------------------------------------------------------- |
| M48 | Medium   | `serverError` defaults to 400 — masks server errors as client errors                     |
| M49 | Medium   | `res.apiResponse.success(res, data)` — passing `res` into property of `res` is confusing |
| M50 | Low      | Stack trace leak possible in non-production mode                                         |

### Scheduler: otpCleanup.js (257 lines)

| #   | Severity | Issue                                                                                          |
| --- | -------- | ---------------------------------------------------------------------------------------------- |
| M51 | High     | `require('cron-parser')` inside ESM file — `ReferenceError: require is not defined` at runtime |
| M52 | Medium   | Verified OTPs never cleaned — accumulate forever                                               |
| M53 | Medium   | `advancedOTPCleanup` doesn't check `isRunning` lock                                            |
| M54 | Medium   | `advancedOTPCleanup` exported but never called                                                 |
| M55 | Low      | No graceful shutdown hook — cleanup may fire against closing DB                                |

---

## Backend Services Summary

### Logging Service (backend/services/logging.js — 300 lines)

| #   | Severity | Issue                                                                                     |
| --- | -------- | ----------------------------------------------------------------------------------------- |
| SV1 | High     | Sentry SDK v7+ incompatibility — `new Sentry.Integrations.Http()` removed                 |
| SV2 | Medium   | `Sentry?.captureMessage()` — always truthy, doesn't protect against uninitialized Sentry  |
| SV3 | Medium   | Synchronous `fs.existsSync`/`fs.mkdirSync` at module load — crash if filesystem read-only |
| SV4 | Medium   | TC39 Stage 3 decorator syntax not available in plain Node.js                              |

### Cache Service (backend/services/cache.js — 350 lines)

| #   | Severity | Issue                                                                      |
| --- | -------- | -------------------------------------------------------------------------- |
| SV5 | High     | Redis v4 wrong API: `host`/`port` should be inside `socket: {}`            |
| SV6 | Medium   | `retryStrategy` returns `false` — coerced to 0, causes immediate reconnect |
| SV7 | Medium   | `redis.keys(pattern)` blocks Redis for entire keyspace scan                |

### Pinecone Service (backend/services/pineconeService.js — 130 lines)

| #    | Severity | Issue                                                                                |
| ---- | -------- | ------------------------------------------------------------------------------------ |
| SV8  | High     | `initializePinecone()` in constructor never awaited — race condition on first call   |
| SV9  | Medium   | All operations silently swallow errors — can't distinguish failure from empty result |
| SV10 | Low      | `substr` is deprecated — should use `substring`                                      |

### Email Service (backend/services/sendEmail.js — 110 lines)

| #    | Severity | Issue                                                                        |
| ---- | -------- | ---------------------------------------------------------------------------- |
| SV11 | Medium   | No HTML sanitization on email body — potential phishing/XSS in email clients |
| SV12 | Low      | If `retryCount` ≤ 0, function silently returns undefined                     |

### Report Generator (backend/services/reportGenerator.js — 100 lines)

| #    | Severity | Issue                                                               |
| ---- | -------- | ------------------------------------------------------------------- |
| SV13 | Low      | Quality score >100 creates bar overflow                             |
| SV14 | Low      | No null check on input — concatenation produces "undefined" strings |

---

## Auth Routes

### backend/routes/auth.js (703 lines)

| #   | Severity | Issue                                                                          |
| --- | -------- | ------------------------------------------------------------------------------ |
| A1  | Critical | `Math.random()` OTP — not cryptographically secure                             |
| A2  | Critical | `transporter` is undefined — OTP email send **crashes**                        |
| A3  | Critical | `/reset-password` requires no OTP verification — anyone can reset any password |
| A4  | High     | Timing-unsafe password comparison (string `===` instead of constant-time)      |
| A5  | High     | Email failure still returns "OTP sent successfully"                            |
| A6  | High     | `/register` never verifies OTP was completed                                   |
| A7  | High     | Hardcoded JWT secret fallback                                                  |
| A8  | Medium   | OTP value leaked to console.log                                                |
| A9  | Medium   | `/demo-accounts` exposes plaintext passwords                                   |
| A10 | Medium   | `/seed-demo` has no auth protection                                            |

---

## AI Routes

### backend/routes/ai.js (338 lines)

| #   | Severity | Issue                                               |
| --- | -------- | --------------------------------------------------- |
| AI1 | Critical | NO AUTH on any endpoint consuming Groq API credits  |
| AI2 | Critical | Legacy `router.handle()` usage causes crash         |
| AI3 | Medium   | Inconsistent model names across different endpoints |

---

## Summary by Severity

| Severity     | Count    |
| ------------ | -------- |
| **Critical** | 55+      |
| **High**     | 90+      |
| **Medium**   | 170+     |
| **Low**      | 85+      |
| **Total**    | **400+** |

### Top 10 Most Critical Issues

1. **Plaintext passwords** — No bcrypt, no hashing. All passwords stored in clear text.
2. **40+ unauthenticated API routes** — Including admin, scoring, AI interview, code execution.
3. **Code execution sandbox bypass** — Multiple escape vectors for JS, Python, C++, Java.
4. **`req.user.id` always undefined** — JWT field mismatch breaks all user-scoped queries.
5. **Login field mismatch** — Frontend sends `email`, backend expects `username`. Login is broken.
6. **No OTP verification on password reset** — Anyone can reset any user's password.
7. **Socket.IO has zero authentication** — Any client can join any interview, proctor dashboard.
8. **Biometric drift attack** — Face embedding adaptive update allows gradual identity hijack.
9. **Hardcoded JWT secret fallback** — Known secret enables token forgery if env var missing.
10. **Permissions-Policy blocks camera/mic** — Security header breaks proctoring feature.

---

_End of Report_
