# HireSpec — Task Assignment Sheet

> **Date**: February 2026  
> **Reference**: [HIRESPEC_AUDIT_REPORT.md](HIRESPEC_AUDIT_REPORT.md) (400+ issues)

---

## Team Members

| Alias    | Name             | Domain Expertise       |
| -------- | ---------------- | ---------------------- |
| **NT**   | Navneet Tripathi | Full Backend, Gen AI   |
| **VP**   | Vasudev Purohit  | Data Science           |
| **JP**   | Jayesh Patidar   | Backend, Data Analysis |
| **Riya** | Riya             | Frontend               |

---

## Task Assignments Overview

| #   | Category                          | Assigned To | Issue Count | Priority |
| --- | --------------------------------- | ----------- | ----------- | -------- |
| 0   | Full UI Fix                       | Riya & NT   | 127 issues  | High     |
| 1   | Layer-1 Updation (Infrastructure) | NT & Riya   | 28 issues   | Critical |
| 2   | Compare JD / Import Features      | JP & Riya   | 11 issues   | Medium   |
| 3   | Recruiter Interview               | NT          | 15 issues   | Critical |
| 4   | Practice Feature                  | Riya & NT   | 32 issues   | High     |
| 5   | Coding Practice                   | NT          | 56 issues   | Critical |
| 6   | AI Interview                      | NT          | 32 issues   | Critical |
| 7   | AI Calling                        | VP          | 5 issues    | High     |
| 8   | Chatbot (Axiom / Spec AI)         | NT          | 20 issues   | Medium   |
| 9   | Company Section Backend           | JP          | 28 issues   | Critical |
| 10  | Admin Section                     | JP          | 14 issues   | High     |
| 11  | AI Tutor / Resume Verification    | VP          | 12 issues   | High     |
| VP  | Video Proctoring                  | VP & NT     | 30+ issues  | Critical |
| —   | Cross-Cutting Systemic Issues     | NT & JP     | 18 issues   | Critical |
| —   | Frontend Services                 | Riya        | 24 issues   | Medium   |
| —   | Frontend Components               | Riya        | 19 issues   | Medium   |
| —   | Backend Middleware                | NT          | 55 issues   | High     |
| —   | Backend Services                  | NT & JP     | 14 issues   | Critical |
| —   | Auth Routes                       | NT          | 10 issues   | Critical |
| —   | AI Routes                         | NT          | 3 issues    | Critical |

---

## Detailed Breakdown Per Member

---

### Riya (Frontend)

Riya owns all **frontend UI/UX fixes** — pages, components, CSS, accessibility, and responsive design.

#### 0 — Full UI Fix (with NT for backend integration parts)

| Sub-task               | Issues     | Description                                                          |
| ---------------------- | ---------- | -------------------------------------------------------------------- |
| App Shell & Routing    | #1–#9      | Add 404 route, auth guards, lazy loading, meta tags, font loading    |
| Home Page              | #10–#20    | Fix ScrollReveal, counter cleanup, particle perf, CSS conflicts      |
| Login Page (UI only)   | #29–#33    | ARIA tabs, label elements, CSS syntax fix, focus-visible styles      |
| Register Page          | #34–#40    | Fix stepInfo (7 steps), back button, password strength, ARIA         |
| Forgot Password (UI)   | #43–#44    | OTP countdown, resend cooldown UI                                    |
| Candidate Dashboard    | #45–#61    | Profile %, search filter, notifications, mobile logout, CSS vars     |
| Candidate Profile      | #62–#69    | Dependency arrays, file reset, unsaved changes warning, dead CSS     |
| Candidate Analytics    | #70–#79    | Error handling, AnimatedNumber fix, dynamic imports, ARIA, print CSS |
| Candidate Results      | #80–#86    | Role hardcode, null checks, component outside render                 |
| Company Dashboard      | #87–#96    | Remove mock data, fix null vs [], wire up buttons, ESC handler       |
| Recruiter Dashboard    | #97–#104   | Replace hardcoded data with API calls, add dark theme, auth check    |
| Proctor Dashboard (UI) | #112–#113  | Replace emojis, keyboard accessibility                               |
| Admin Scoring (UI)     | #120, #123 | Remove unused imports, keyboard accessible sort headers              |
| Secondary Camera       | #124–#127  | Pass props correctly, release Wake Lock                              |

#### 4 — Practice Feature (Frontend)

| Sub-task                  | Issues    | Description                                            |
| ------------------------- | --------- | ------------------------------------------------------ |
| PracticeSessionSetup.jsx  | #185–#187 | UUID for session, keyboard accessible cards            |
| PracticeMode.jsx          | #188–#194 | Null guards, onKeyDown, timer, save/resume             |
| PracticeInterviewRoom.jsx | #195–#205 | Timer stale closure, fetch error checks, CSS brace fix |
| PracticeFeedback.jsx      | #206–#211 | Prevent duplicate POST, null checks, CSS fix           |

#### Frontend Services

| Sub-task                | Issues | Description                                               |
| ----------------------- | ------ | --------------------------------------------------------- |
| api.js, socket.js, etc. | F1–F24 | Fix API interceptors, socket reconnection, error handling |

#### Frontend Components

| Sub-task                            | Issues | Description                                         |
| ----------------------------------- | ------ | --------------------------------------------------- |
| ChatPanel, CodeEditor, Navbar, etc. | C1–C19 | Fix deprecated events, key props, ARIA, null guards |

#### 2 — Compare JD / Import Features (Frontend)

| Sub-task     | Issues | Description                                                              |
| ------------ | ------ | ------------------------------------------------------------------------ |
| JD Import UI | —      | Add file import option (PDF/DOCX) for job descriptions on compare screen |

**Riya's Total: ~180+ issues**

---

### Navneet Tripathi — NT (Backend & Gen AI)

NT owns all **backend logic, API routes, security hardening, Gen AI integrations**, and backend parts of frontend-backend integration.

#### 0 — Full UI Fix (Backend Integration)

| Sub-task               | Issues       | Description                                                       |
| ---------------------- | ------------ | ----------------------------------------------------------------- |
| Login backend fix      | #21–#22      | Fix field mismatch (`email` vs `username`), face-login route name |
| Demo seed fix          | #23          | Prevent duplicate demo accounts                                   |
| ForgotPassword backend | #41–#42      | Add OTP verification token to password reset flow                 |
| Dashboard API fixes    | #45, #54–#55 | Fix `user.id` vs `_id`, server-side token invalidation            |

#### 1 — Layer-1 Updation (Backend Infrastructure)

| Sub-task              | Issues          | Description                                                               |
| --------------------- | --------------- | ------------------------------------------------------------------------- |
| Security dependencies | #135–#138       | Add bcrypt, helmet, express-mongo-sanitize, compression                   |
| Dead code cleanup     | #139, #153–#155 | Remove mysql2, database.js, .bak files                                    |
| Config & server.js    | #142–#152       | Fix JWT_SECRET validation, error middleware order, body size limits, CSRF |
| MongoDB connection    | #156–#158       | Fix race condition, add disconnect, remove redundant dbName               |

#### 3 — Recruiter Interview

| Sub-task          | Issues    | Description                                                   |
| ----------------- | --------- | ------------------------------------------------------------- |
| InterviewRoom.jsx | #170–#181 | Fix stale closures, missing deps, null guards, auth, debounce |
| Interview Routes  | #182–#184 | Fix `req.user.id` → `req.user.userId`, add ownership checks   |

#### 5 — Coding Practice

| Sub-task                 | Issues    | Description                                                  |
| ------------------------ | --------- | ------------------------------------------------------------ |
| codingPractice.js routes | #226–#231 | Disable DEMO_MODE, fix error codes, validate input           |
| codeExecution.js routes  | #232–#236 | Replace hardcoded mocks with real execution                  |
| cpAiQuestions.js         | #237–#242 | Add auth, sanitize input, add timeout                        |
| cpAnalysis.js            | #243–#245 | Add auth, input validation                                   |
| cpCode.js                | #246–#249 | Add auth, fix cooldown bypass, add size limit                |
| cpQuestions.js           | #250–#253 | Add auth, fix IDOR                                           |
| cpReports.js             | #254–#256 | Add auth, sanitize filename header                           |
| cpSession.js             | #257–#259 | Add auth on all 8 endpoints                                  |
| Code Executor service    | #260–#271 | **CRITICAL**: Fix all sandbox escapes, add process isolation |
| Test Runner service      | #272–#277 | Fix command injection, Java race condition                   |
| Question Bank service    | #278–#281 | Move to database, fix memory leak                            |
| Session Manager service  | #282–#285 | Add expiration, fix prototype pollution                      |

#### 6 — AI Interview

| Sub-task               | Issues    | Description                                              |
| ---------------------- | --------- | -------------------------------------------------------- |
| AIInterviewSetup.jsx   | #286–#290 | Fix type mismatch, loading state                         |
| AIInterviewRoom.jsx    | #291–#299 | Fix stale closures, cleanup listeners                    |
| AIInterviewReport.jsx  | #300–#303 | Fix useEffect deps, print CSS, ARIA                      |
| aiInterview.js routes  | #304–#307 | **Add auth on ALL 10 endpoints**, fix legacy route crash |
| AI Interviewer service | #308–#312 | Fix shuffle bias, null checks, memory leak               |
| AIInterview model      | #313–#319 | Add validation, trim, maxlength                          |

#### 8 — Chatbot

| Sub-task             | Issues    | Description                                  |
| -------------------- | --------- | -------------------------------------------- |
| axiomChat.js routes  | #330–#334 | Add auth, user isolation, persistent storage |
| specAiChat.js routes | #335–#338 | Add auth, fix IDOR, input limits             |

#### Backend Middleware

| Sub-task                             | Issues | Description                                                        |
| ------------------------------------ | ------ | ------------------------------------------------------------------ |
| auth.js, csrf.js, rateLimit.js, etc. | M1–M55 | Fix hardcoded JWT secret, privilege escalation, CSP for proctoring |

#### Auth Routes

| Sub-task       | Issues | Description                                                 |
| -------------- | ------ | ----------------------------------------------------------- |
| auth.js routes | A1–A10 | Fix plaintext password storage, face login, OTP brute-force |

#### AI Routes

| Sub-task     | Issues  | Description                         |
| ------------ | ------- | ----------------------------------- |
| ai.js routes | AI1–AI3 | Add auth, fix router.handle() crash |

**NT's Total: ~200+ issues**

---

### Vasudev Purohit — VP (Data Science)

VP owns **AI Calling, AI Tutor, Video Proctoring, and data-science-related analysis features**.

#### 7 — AI Calling

| Sub-task            | Issues    | Description                                                         |
| ------------------- | --------- | ------------------------------------------------------------------- |
| aiCalling.js routes | #320–#324 | Add auth, phone validation, rate limiting, fix timer race condition |

#### 11 — AI Tutor / Resume Verification

| Sub-task               | Issues    | Description                                                         |
| ---------------------- | --------- | ------------------------------------------------------------------- |
| ResumeVerification.jsx | #379–#385 | Fix JSON.parse crash, double-click, unused imports, keyboard access |
| verification.js routes | #386–#387 | **Add auth on ALL endpoints**, fix IDOR                             |
| Verification service   | #388–#390 | Fix type cycling, replace() corruption, overclaim analysis          |

#### VP — Video Proctoring

| Sub-task                    | Issues           | Description                                                     |
| --------------------------- | ---------------- | --------------------------------------------------------------- |
| ProctoringMonitor.jsx       | Audit VP section | Fix face-api.js integration, detection thresholds, memory leaks |
| proctoring.js routes        | Audit VP section | Add auth, fix data validation, rate limiting                    |
| InterviewProctoring model   | Audit VP section | Add validation, fix Mixed types                                 |
| faceService.js              | Audit VP section | Fix biometric drift attack, embedding validation                |
| Socket proctoring handlers  | Audit VP section | Add socket auth, room validation                                |
| Proctor Dashboard (backend) | #105–#111        | Add auth, fix fetch calls, remove hardcoded URL                 |

#### Backend Services (Data/ML related)

| Sub-task           | Issues     | Description                               |
| ------------------ | ---------- | ----------------------------------------- |
| aiDetector.js      | SV section | Fix AI detection pipeline, model accuracy |
| groqAnalyzer.js    | SV section | Fix analysis prompts, response parsing    |
| pineconeService.js | SV section | Fix vector search, embedding handling     |

**VP's Total: ~50+ issues**

---

### Jayesh Patidar — JP (Backend & Data Analysis)

JP owns **Company Section backend, Admin Section, data-related backend routes**, and assists NT on cross-cutting backend issues.

#### 9 — Company Section Backend

| Sub-task          | Issues    | Description                                                        |
| ----------------- | --------- | ------------------------------------------------------------------ |
| Application model | #345–#348 | Add maxlength, enum for round, score validation                    |
| User model        | #349–#359 | **CRITICAL**: Add password hashing, select:false, email validation |
| OTP model         | #360–#361 | Hash OTP, add attempts field for brute-force protection            |
| Profile routes    | #362–#364 | Fix PDFParse import crash, fix IDOR                                |
| Jobs routes       | #159–#164 | Fix userId from auth token, ownership checks, ReDoS                |
| Job model         | #165–#169 | Add salary validation, maxlength                                   |

#### 10 — Admin Section

| Sub-task                 | Issues               | Description                                                      |
| ------------------------ | -------------------- | ---------------------------------------------------------------- |
| Scoring routes           | #365–#372            | **Add auth on ALL 10 endpoints**, NaN validation, cache eviction |
| Questions routes         | #373–#378            | Add auth, prevent body spread injection, move to DB              |
| AdminScoring.jsx (logic) | #114–#119, #121–#122 | Fix error handling, debounce API calls, add role check           |

#### 2 — Compare JD / Import Features (Backend)

| Sub-task                  | Issues | Description                                                  |
| ------------------------- | ------ | ------------------------------------------------------------ |
| Import endpoint           | —      | Build backend endpoint for JD file import (PDF/DOCX parsing) |
| Resume parser integration | —      | Wire resume parser service to comparison feature             |

#### Cross-Cutting Systemic Issues (with NT)

| Sub-task        | Issues | Description                                                  |
| --------------- | ------ | ------------------------------------------------------------ |
| Systemic issues | S1–S18 | Help fix auth gaps, error handling patterns, data validation |

#### Backend Services (Data/Analysis related)

| Sub-task           | Issues     | Description                                     |
| ------------------ | ---------- | ----------------------------------------------- |
| reportGenerator.js | SV section | Fix report generation, data aggregation         |
| cache.js (Redis)   | SV section | Fix Redis misconfiguration, connection handling |
| logging.js         | SV section | Fix Sentry incompatibility, log rotation        |

**JP's Total: ~70+ issues**

---

## Priority Execution Order

Work should proceed in this order to unblock other tasks and fix the most critical issues first:

### Phase 1 — Security & Infrastructure (Week 1)

> **Blockers for everything else**

| Priority | Task                                               | Owner                              | Why First                               |
| -------- | -------------------------------------------------- | ---------------------------------- | --------------------------------------- |
| P0       | Add bcrypt / password hashing                      | JP (User model) + NT (Auth routes) | Plaintext passwords — critical security |
| P0       | Fix `req.user.id` → `req.user.userId` JWT mismatch | NT                                 | Breaks ALL authenticated routes         |
| P0       | Fix Login field mismatch (`email` vs `username`)   | NT                                 | Login is completely broken              |
| P0       | Add auth to 40+ unprotected API routes             | NT + JP                            | Anyone can access any endpoint          |
| P0       | Fix code execution sandbox escapes                 | NT                                 | Remote code execution on server         |
| P0       | Fix hardcoded JWT secret fallback                  | NT                                 | Token forgery possible                  |

### Phase 2 — Core Feature Fixes (Week 2)

> **Make features actually work**

| Priority | Task                                                | Owner   | Why                                  |
| -------- | --------------------------------------------------- | ------- | ------------------------------------ |
| P1       | Fix stale closures (Interview, AI Interview, Timer) | NT      | Features crash or use wrong data     |
| P1       | Fix Company Dashboard mock data contamination       | Riya    | Stats always inflated/wrong          |
| P1       | Replace hardcoded mock code execution               | NT      | Coding practice returns fake results |
| P1       | Add OTP verification to password reset              | NT      | Anyone can reset any password        |
| P1       | Fix Recruiter Dashboard (all hardcoded)             | Riya    | Page is non-functional               |
| P1       | Add socket authentication                           | NT + VP | Any client can join any room         |
| P1       | Fix biometric drift attack in face service          | VP      | Identity hijack possible             |

### Phase 3 — Feature Completion (Week 3)

> **Polish and complete features**

| Priority | Task                                            | Owner     | Why                           |
| -------- | ----------------------------------------------- | --------- | ----------------------------- |
| P2       | Build JD import feature (frontend + backend)    | Riya + JP | Missing feature               |
| P2       | Fix AI Calling phone validation & rate limiting | VP        | Abuse vector for Twilio costs |
| P2       | Fix chatbot user isolation                      | NT        | Users can read others' chats  |
| P2       | Wire up dead buttons across all dashboards      | Riya      | 10+ buttons with no onClick   |
| P2       | Fix practice session timer & save/resume        | Riya + NT | Practice feature incomplete   |
| P2       | Move in-memory data to MongoDB                  | NT + JP   | Data lost on restart          |

### Phase 4 — UI/UX & Polish (Week 4)

> **Make it look and feel right**

| Priority | Task                                           | Owner     | Why                          |
| -------- | ---------------------------------------------- | --------- | ---------------------------- |
| P3       | Fix all CSS syntax errors & broken styles      | Riya      | Visual glitches across pages |
| P3       | Add ARIA attributes & keyboard navigation      | Riya      | Accessibility compliance     |
| P3       | Add loading states, error toasts, pagination   | Riya      | UX completeness              |
| P3       | Clean up dead code, unused imports, .bak files | All       | Code hygiene                 |
| P3       | Add input validation & rate limiting           | NT + JP   | Hardening                    |
| P3       | Fix print/export CSS for reports               | Riya + VP | Report generation broken     |

---

## Workload Summary

| Member                    | Issues | Domains                                                      |
| ------------------------- | ------ | ------------------------------------------------------------ |
| **NT** (Navneet Tripathi) | ~200+  | Backend security, API routes, Gen AI, middleware, auth       |
| **Riya**                  | ~180+  | All frontend pages, components, services, CSS, accessibility |
| **JP** (Jayesh Patidar)   | ~70+   | Company backend, admin, models, data services                |
| **VP** (Vasudev Purohit)  | ~50+   | AI Calling, AI Tutor, Video Proctoring, ML services          |

---

## Communication Notes

- **NT + Riya** must coordinate on: Login flow (#21–#22), Dashboard API integration (#45–#55), Practice feature (frontend + backend)
- **NT + JP** must coordinate on: User model password hashing (#349 + auth routes), cross-cutting auth middleware
- **NT + VP** must coordinate on: Video proctoring (socket auth + face service), AI interview pipeline
- **JP + Riya** must coordinate on: JD import feature (Category 2), Company Dashboard API wiring

---

_Refer to [HIRESPEC_AUDIT_REPORT.md](HIRESPEC_AUDIT_REPORT.md) for full issue details with line numbers and severity ratings._
