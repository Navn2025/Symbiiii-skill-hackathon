# Interview Feature — Complete Issues Audit

> **Date:** Post-fix audit after initial round of fixes to InterviewRoom.jsx, interview.js, handlers.js, socket.js  
> **Scope:** Every file involved in the interview feature — frontend components, CSS, services, backend routes, models, middleware, socket handlers  
> **Total Issues Found:** 120+

---

## Table of Contents

1. [Critical / App-Breaking Bugs](#1-critical--app-breaking-bugs)
2. [Frontend Component Bugs](#2-frontend-component-bugs)
3. [Frontend Service Bugs](#3-frontend-service-bugs)
4. [Backend Route Bugs](#4-backend-route-bugs)
5. [Backend Model / Schema Issues](#5-backend-model--schema-issues)
6. [Backend Middleware Issues](#6-backend-middleware-issues)
7. [Socket / Real-time Issues](#7-socket--real-time-issues)
8. [Security Vulnerabilities](#8-security-vulnerabilities)
9. [CSS / Styling Issues](#9-css--styling-issues)
10. [Accessibility Issues](#10-accessibility-issues)
11. [UX / Usability Issues](#11-ux--usability-issues)
12. [Memory Leaks & Performance](#12-memory-leaks--performance)
13. [Cross-Cutting Integration Mismatches](#13-cross-cutting-integration-mismatches)
14. [Fix Priority Matrix](#14-fix-priority-matrix)

---

## 1. Critical / App-Breaking Bugs

These issues cause **crashes, data loss, or complete feature failure**. Must be fixed before any demo.

| # | File | Issue | Impact |
|---|------|-------|--------|
| C1 | `frontend/src/components/ProctoringMonitor.jsx` | **`events` prop is NEVER passed** from `InterviewRoom.jsx`. Component does `events.forEach()`, `events.filter()`, `events.length` on mount — all throw `TypeError: Cannot read properties of undefined`. | **ProctoringMonitor crashes on every mount**, taking down the interview room if no ErrorBoundary catches it at panel level. |
| C2 | `frontend/src/services/api.js` L108 | `sendProctoringEvent(interviewId, event)` sends `{ interviewId, event: { type, severity, description } }` — **nested object**. Backend expects **flat** fields `{ interviewId, eventType, severity, description }`. | **Every proctoring API call silently fails validation.** Proctoring events never reach the database. |
| C3 | `backend/routes/proctoring.js` | `req.user.id` used throughout — should be `req.user.userId` (JWT payload has `userId`). | **Every authenticated proctoring route fails.** userId is always `undefined`. |
| C4 | `backend/models/InterviewProctoring.js` | `interviewId` field is `type: mongoose.Schema.Types.ObjectId` but frontend passes **UUID strings** (from AIInterview `interviewId` field). | **Mongoose CastError** on every proctoring record creation. |
| C5 | `backend/routes/questions.js` | `GET /random/:count` is defined **after** `GET /:id` — Express matches `:id` first (treating "random" as an ID). | **Random questions endpoint is unreachable.** Always 404 or returns wrong data. |
| C6 | `backend/routes/proctoring.js` | `GET /dashboard/sessions` is shadowed by `GET /:interviewId` — Express treats "dashboard" as an `interviewId`. | **Dashboard sessions endpoint is unreachable.** |
| C7 | `backend/routes/codeExecution.js` | Both `/execute` and `/submit` routes return **hardcoded mock data**. Neither actually runs any code. | **Code execution feature is 100% non-functional.** |
| C8 | `frontend/src/services/socket.js` L4 | `SOCKET_URL = 'http://localhost:5000'` is **hardcoded**. Does not read from `import.meta.env.VITE_API_URL`. | **Socket connection fails in any non-local environment** (staging, production, Docker). |
| C9 | `backend/routes/interview.js` | Route pushes `{ question, questionMetadata, answer, evaluation, followUps }` to `questions` array, but `AIInterview` model schema defines `questions` as `[{ id, question, topic, difficulty }]`. | **Question/answer data is silently dropped** by Mongoose strict mode. Should push to `questionAnswerPairs` or update schema. |
| C10 | `backend/middleware/validation.js` | `proctoringSchemas.recordEvent` does NOT include `interviewId` in its schema. Combined with `stripUnknown: true`, the `interviewId` is **stripped from the request body** before it reaches the route handler. | **Proctoring events have no interview association.** |

---

## 2. Frontend Component Bugs

### VideoPanel.jsx (233 lines)

| # | Line(s) | Issue |
|---|---------|-------|
| F1 | L26–30 | **Stale closure in cleanup**: `localStream` captured in `useEffect` cleanup is always `null` (initial state). Media tracks are never stopped on unmount — **camera stays on** after leaving interview. |
| F2 | L45–60 | **WebRTC setup race condition**: `setupWebRTC()` is called in `useEffect` but depends on `localStream` state, which hasn't been set yet when the function runs. Peer connection attempts to add `null` tracks. |
| F3 | L80 | **Double-fire of `handleLoadedMetadata`**: `<video onLoadedMetadata={handler}>` can fire multiple times if the source changes. Sets `isVideoReady` repeatedly. |
| F4 | Cleanup | **Socket listener leak**: WebRTC-related socket listeners (`offer`, `answer`, `ice-candidate`) registered in `useEffect` are never removed on cleanup. Accumulate on re-mount. |
| F5 | L120 | **No WebRTC reconnection logic**: If the peer connection drops (ICE failure, network change), there's no retry or recovery mechanism. Interview video dies silently. |
| F6 | L95 | **`alert()` on camera denial**: Uses blocking `window.alert()` instead of inline UI feedback. |

### CodeEditor.jsx (34 lines)

| # | Line(s) | Issue |
|---|---------|-------|
| F7 | — | **No loading state**: Monaco editor takes time to load; no spinner/placeholder shown during initialization. |
| F8 | — | **No guard if `onChange` is undefined**: If parent doesn't pass `onChange`, the editor's onChange handler throws. |
| F9 | — | **`'c'` language mapping** incorrect: Monaco's language ID for C is `'c'`, but syntax highlighting may not work correctly without explicit language support registration. |

### ChatPanel.jsx (103 lines)

| # | Line(s) | Issue |
|---|---------|-------|
| F10 | L65 | **Deprecated `onKeyPress`**: Should use `onKeyDown` — `onKeyPress` is deprecated and doesn't fire for all keys in modern browsers. |
| F11 | L30 | **Message duplication**: If the server echoes the sent message back, it appears twice. No deduplication by message ID. |
| F12 | L85 | **`socket.off('chat-message')` removes ALL listeners**: Not scoped to this component's callback. If multiple components listen to `chat-message`, all get removed. |
| F13 | — | **No message length limit**: Users can send arbitrarily long messages, flooding the chat. |

### QuestionPanel.jsx (44 lines)

| # | Line(s) | Issue |
|---|---------|-------|
| F14 | L28 | **Crash if `question.examples` is undefined**: Uses `question.examples.map()` without null guard. Throws `TypeError`. |
| F15 | — | **No null checks** on `question.title`, `question.difficulty`, `question.description` — any missing field causes silent render of `undefined`. |

### QuestionSelector.jsx (455 lines)

| # | Line(s) | Issue |
|---|---------|-------|
| F16 | All fetch calls | **No `credentials: 'include'`** and no `Authorization` header on any `fetch()` call. All API calls fail if backend requires auth. |
| F17 | All fetch calls | **No `response.ok` check**: Fetch doesn't throw on 4xx/5xx. JSON parsing of error HTML throws cryptic errors. |
| F18 | L200+ | **Uses `q.id` but MongoDB has `_id`**: Question matching/selection logic breaks because `.id` is `undefined`. |
| F19 | Modal | **No focus trap or ESC handler**: Modal doesn't trap keyboard focus. No way to close via keyboard. |
| F20 | — | **No pagination**: Fetches all questions at once. Will be slow/crash with large question sets. |
| F21 | — | **C++ starter code missing**: Defines starter code for Python/JS/Java but not C++. Selecting C++ gives empty editor. |

### ProctoringMonitor.jsx (155 lines)

| # | Line(s) | Issue |
|---|---------|-------|
| F22 | L45 | **`suspicionScore` prop is dead code**: Calculated internally but also accepted as prop. Internal calculation always overrides the prop. |
| F23 | L60–80 | **Duplicate integrity score calculation**: `integrityScore` is computed from `events` in two separate places with potentially different logic. |
| F24 | L10 | **Events prop crash** (see C1): The most critical bug — `events` is never passed. |

### SecondaryCamera.jsx (186 lines)

| # | Line(s) | Issue |
|---|---------|-------|
| F25 | L26–30 | **Stale closure**: `stream` in cleanup is always `null`. Camera tracks never stopped on unmount — **persistent camera leak**. |
| F26 | L76 | **`setInterval` never cleared**: `startSnapshotCapture` creates an interval that runs forever, even after unmount. Sends snapshots on dead socket. |
| F27 | L91 | **Socket listeners never cleaned up**: `secondary-camera-connected` and `secondary-snapshot` listeners accumulate on re-mount. |
| F28 | L80 | **Bandwidth-heavy snapshots**: Sends base64 JPEG (130KB+) over WebSocket every 3 seconds = ~43KB/s sustained per secondary camera. |
| F29 | L104 | **External QR API (`api.qrserver.com`)**: Interview URL sent to third-party service — **privacy leak** + single point of failure. |
| F30 | L109 | **Clipboard API rejection unhandled**: `navigator.clipboard.writeText()` promise rejection not caught (fails in non-secure contexts). |
| F31 | L110 | **`alert()` blocks UI** (used twice in this file). |
| F32 | L37 | **Predictable connection code**: `${interviewId}-${userName}-${Date.now()}` is guessable. Should use crypto-random token. |

### ErrorBoundary.jsx (138 lines)

| # | Line(s) | Issue |
|---|---------|-------|
| F33 | L80 | **`process.env.NODE_ENV` undefined in Vite**: Should be `import.meta.env.MODE` or `import.meta.env.DEV`. Dev details section **never renders**. |
| F34 | L134 | **Error ID regenerates on every render**: `Date.now()` called in render — ID changes on each re-render. Not useful for debugging. |
| F35 | L113–126 | **`e.target` vs `e.currentTarget`**: Hover handlers use `e.target.style`. Hovering the SVG icon inside a button targets the icon, not the button. |
| F36 | L68 | **"We've logged this incident" is misleading**: No error reporting service — only `console.error`. |
| F37 | L41 | **`resetError()` loops**: If child throws the same error on re-render, ErrorBoundary alternates between error and re-throw infinitely. |

---

## 3. Frontend Service Bugs

### api.js (125 lines)

| # | Line(s) | Issue |
|---|---------|-------|
| S1 | L108 | **Proctoring event payload mismatch** (see C2): Sends nested `{ event: {...} }` but backend expects flat fields. |
| S2 | L107 | **Duplicate proctoring functions**: `logProctoringEvent(data)` and `sendProctoringEvent(interviewId, event)` hit the same endpoint with different shapes. Confusing API. |
| S3 | L97 | **`getRandomQuestions`** calls `/questions/random/:count` — unreachable route (see C5). **Always fails.** |
| S4 | L104 | **`submitCode`** sends data to `/code-execution/submit` which returns hardcoded mock (see C7). |
| S5 | — | **No `listInterviews` function**: Backend `GET /interview/` exists but no frontend API call wraps it. |
| S6 | L38–46 | **URL-matching for auth response**: `response.config.url.includes('/login')` could false-positive on URLs with `/login` in query params. |

### socket.js (136 lines)

| # | Line(s) | Issue |
|---|---------|-------|
| S7 | L4 | **Hardcoded localhost** (see C8). |
| S8 | L14 | **No auth token on socket connect**: `io(SOCKET_URL)` passes no `auth` option. Connection is unauthenticated. |
| S9 | — | **No reconnection handling**: Socket disconnect mid-interview = dead interview. No auto-reconnect, no event queuing, no state recovery. |
| S10 | — | **No error event handler**: Socket errors silently swallowed. |
| S11 | L46–50 | **`joinInterview` no acknowledgment**: If join fails server-side, frontend has no way to know. |
| S12 | L120–128 | **Listener accumulation**: `on(event, callback)` registers listeners but repeated mount/unmount without `off()` causes listeners to pile up. |
| S13 | L38 | **`disconnect()` orphans callbacks**: Sets `this.socket = null` but pending event callbacks still reference old socket. |

### proctoring.js (853 lines)

| # | Line(s) | Issue |
|---|---------|-------|
| S14 | L736 | **API calls always fail** (see C2): `sendProctoringEvent` sends mismatched payload. |
| S15 | L38–44 | **CDN model loading without fallback**: face-api.js models loaded from `justadudewhohacks.github.io`. If blocked → **no face detection**, no error shown. |
| S16 | L67 | **`initialize()` returns `true` even on failure**: Sets `isInitialized = true` and `faceDetectionDisabled`, but returns success. Callers believe init worked. |
| S17 | L95–100 | **No null guard on `videoElement`**: `startMonitoring` proceeds with null `videoElement` → throws on `.readyState`. |
| S18 | L83 | **`cleanupFunctions` overwritten on double-call**: If `startMonitoring` called twice (React StrictMode), first call's cleanup functions orphaned → DOM event listener leak. |
| S19 | L714 | **`suspicionScore` can exceed 100**: Concurrent `reportViolation` calls can each read old score and add to it before clamping. |
| S20 | L733–739 | **Divergent state on network failure**: If backend is unreachable, violations counted locally but never reach proctor dashboard. Candidate may be auto-terminated while proctor sees 0 events. |

---

## 4. Backend Route Bugs

### interview.js (196 lines)

| # | Line(s) | Issue |
|---|---------|-------|
| B1 | L130–140 | **Schema push mismatch** (see C9): Pushes `{ question, questionMetadata, answer, evaluation, followUps }` to `questions` array, but model expects `{ id, question, topic, difficulty }`. |
| B2 | L80 | **`score \|\| 0` discards zero scores**: Legitimate score of `0` is replaced with `0` (happens to work) but the pattern `score \|\| 0` would fail for falsy values in other contexts. Use `score ?? 0`. |
| B3 | — | **No pagination on `GET /`**: Returns all interviews for a user. Will be slow with hundreds of interviews. |
| B4 | — | **Race condition on concurrent saves**: Two simultaneous `PATCH /add-question` calls could overwrite each other's data (last-write-wins on the `questions` array). |
| B5 | — | **Fields `feedback`, `rating`, `notes`, `codeSubmissions`, `proctoringEvents` silently dropped**: Sent in create/update requests but not in Mongoose schema. Mongoose strict mode ignores them. |

### questions.js (120 lines)

| # | Line(s) | Issue |
|---|---------|-------|
| B6 | — | **Route ordering bug** (see C5): `GET /:id` before `GET /random/:count`. |
| B7 | — | **No authentication on ANY endpoint**: All question CRUD is completely public. |
| B8 | — | **In-memory storage**: Questions stored in a JS array, not MongoDB. Server restart loses all data. |
| B9 | — | **`...req.body` spread in POST**: Allows prototype pollution — attacker can send `{ "__proto__": { "isAdmin": true } }`. |
| B10 | — | **No validation middleware**: No Joi/Yup schema applied. Any shape of data accepted. |

### codeExecution.js (79 lines)

| # | Line(s) | Issue |
|---|---------|-------|
| B11 | — | **100% mocked** (see C7). |
| B12 | — | **No auth middleware**: Anyone can call execute/submit. |
| B13 | — | **No validation middleware applied**: Request body not validated. |
| B14 | — | **`/submit` has no try/catch**: Unhandled errors crash the server. |
| B15 | — | **Returns 200 on errors**: Error responses still return HTTP 200 with `{ success: false }`. |

### proctoring.js backend (216 lines)

| # | Line(s) | Issue |
|---|---------|-------|
| B16 | — | **`req.user.id` bug** (see C3): Should be `req.user.userId`. |
| B17 | — | **Dashboard route shadowed** (see C6). |
| B18 | — | **Validation strips `interviewId`** (see C10). |
| B19 | — | **Frontend sends `{ event }` nested, backend reads flat fields** (see C2). |

---

## 5. Backend Model / Schema Issues

### AIInterview.js (118 lines)

| # | Issue |
|---|-------|
| M1 | `questions` array schema `{ id, question, topic, difficulty }` doesn't match what routes actually push. Should add `questionAnswerPairs` array or update `questions` schema. |
| M2 | Missing fields in schema: `feedback`, `rating`, `score`, `notes`, `codeSubmissions`, `proctoringEvents` — all silently dropped. |
| M3 | Dead enum value `'ended'` in `status` — routes use `'completed'`, never `'ended'`. |
| M4 | No index on `userId` field — queries filtering by user will be slow at scale. |

### InterviewProctoring.js (127 lines)

| # | Issue |
|---|-------|
| M5 | `interviewId` is `ObjectId` type but receives **UUID strings** (see C4) — CastError on every write. |
| M6 | Conflicting timestamps: Manual `startTime`/`endTime` fields + `timestamps: true` option. Creates redundant `createdAt`/`updatedAt`. |
| M7 | No index on `interviewId` — proctoring queries will table-scan. |

---

## 6. Backend Middleware Issues

### validation.js

| # | Issue |
|---|-------|
| MW1 | `proctoringSchemas.recordEvent` missing `interviewId` → stripped by `stripUnknown` (see C10). |
| MW2 | `proctoringSchemas.recordEvent` missing `details` field — any extra event details are stripped. |
| MW3 | `codeExecutionSchemas.submit` requires `problemId` but frontend sends `questionId` — **field name mismatch**. Validation always rejects. |

---

## 7. Socket / Real-time Issues

### handlers.js (248 lines)

| # | Issue |
|---|-------|
| SK1 | **No socket authentication**: Any client can connect and join any interview room. No token/session verification. |
| SK2 | `socketRooms` Map stores **only one room per socket**: If a socket joins multiple rooms (e.g., interview + secondary camera), the first room is overwritten. Disconnect cleanup only leaves the last room. |
| SK3 | **No validation on `chat-message` `interviewId`**: Users can send messages to any interview room by guessing IDs. |
| SK4 | **No size limit on `secondary-snapshot` data**: Malicious client can send arbitrarily large base64 strings, consuming server memory. |
| SK5 | **No rate limiting on socket events**: Client can flood the server with rapid-fire events. |

---

## 8. Security Vulnerabilities

| # | File | Severity | Issue |
|---|------|----------|-------|
| SEC1 | `backend/services/codeExecutor.js` | **CRITICAL** | Multiple sandbox escape vectors: indirect eval via `Function` constructor, string concatenation to bypass regex checks, `constructor.constructor('return this')()` to access global scope. |
| SEC2 | `backend/services/codeExecutor.js` | **CRITICAL** | Template literal injection: User code interpolated into Python/Java/C++ wrapper templates without escaping. Multi-line strings or quote characters can break out. |
| SEC3 | `backend/services/codeExecutor.js` | **HIGH** | `runCommand` spawns child process inheriting server's full environment (DB credentials, API keys, etc.). No `env` override. |
| SEC4 | `backend/services/codeExecutor.js` | **HIGH** | `resource.setrlimit` only works on Linux. On Windows, code runs **completely unsandboxed**. |
| SEC5 | `backend/services/codeExecutor.js` | **HIGH** | Temp files written inside backend project directory (`__dirname/../temp`). User code can traverse to read server source files. |
| SEC6 | `backend/services/codeExecutor.js` | **MEDIUM** | `execSync` for Java/C++ compilation blocks the event loop for up to 10 seconds. A malicious compilation can hang the entire server. |
| SEC7 | `backend/routes/questions.js` | **HIGH** | `...req.body` spread allows prototype pollution attack. |
| SEC8 | `backend/routes/questions.js` | **HIGH** | No authentication on any CRUD endpoint. Anyone can create, read, update, delete questions. |
| SEC9 | `backend/socket/handlers.js` | **HIGH** | No socket authentication. Any WebSocket client can join any room and send messages. |
| SEC10 | `frontend/src/services/proctoring.js` | **MEDIUM** | ML models loaded from external CDN without SRI integrity checks. CDN compromise = malicious code injection. |
| SEC11 | `frontend/src/services/proctoring.js` | **LOW** | All proctoring runs client-side — trivially bypassable by overriding `ProctoringService.prototype.reportViolation`. |
| SEC12 | `frontend/src/components/SecondaryCamera.jsx` | **MEDIUM** | QR code generated via external API — interview URL leaked to third party. |
| SEC13 | `frontend/src/components/SecondaryCamera.jsx` | **MEDIUM** | Predictable connection code (interviewId + userName + timestamp) — guessable by attacker. |

---

## 9. CSS / Styling Issues

| # | File | Issue |
|---|------|-------|
| CSS1 | `InterviewRoom.css` | No mobile breakpoint for `<768px`. Interview room unusable on mobile/tablet. |
| CSS2 | `InterviewRoom.css` | `.text-danger`, `.text-warning`, `.text-success` classes used in JSX but may not be defined (relying on Bootstrap?). |
| CSS3 | `ProctoringMonitor.css` L73 | `.proctoring-stats` uses `grid-template-columns: 1fr 1fr` but JSX has **3 stat items** — third wraps to new row, causing misalignment. Should be `1fr 1fr 1fr`. |
| CSS4 | `ProctoringMonitor.css` L127 | `@keyframes pulse` name **conflicts** with same name in `VideoPanel.css` L78. Different animations — whichever CSS loads last wins. |
| CSS5 | `SecondaryCamera.css` L163–182 | `.btn` and `.btn-secondary` defined with **global class names** — conflicts with any global button styles from other components/libraries. |
| CSS6 | `SecondaryCamera.css` L117 | `.secondary-camera-phone` uses `min-height: 100vh` — breaks if rendered inside a parent container. |
| CSS7 | `SecondaryCamera.css` | `.phone-video` uses `object-fit: cover` — crops parts of room view, defeating surveillance purpose. Should be `contain`. |
| CSS8 | `QuestionPanel.css` | Badge classes `.badge-easy`, `.badge-medium`, `.badge-hard` used in QuestionPanel but **defined only in QuestionSelector.css**. If QuestionSelector isn't mounted, badges are unstyled. |
| CSS9 | `SecondaryCamera.css` L52 | No responsive breakpoints for connection methods flex layout — squishes on narrow screens instead of stacking. |
| CSS10 | `SecondaryCamera.css` | `.status.disconnected` uses alarming red **before** user has attempted to connect. |

---

## 10. Accessibility Issues

| # | Component | Issue |
|---|-----------|-------|
| A1 | VideoPanel | No keyboard-accessible controls. `aria-label` missing on video elements. |
| A2 | ChatPanel | No `aria-live` region for new messages. Screen reader users don't get notified of new chat messages. |
| A3 | QuestionSelector | Modal has no focus trap, no ESC to close, no `aria-modal="true"`. |
| A4 | ProctoringMonitor | `LIVE` indicator is visual only — no `aria-live="polite"` announcement. Feature badges have `cursor: help` but no `aria-describedby`. |
| A5 | SecondaryCamera | QR code alt text is generic ("QR Code") — should describe purpose. No keyboard alternative to QR scanning. Status uses color alone. |
| A6 | ErrorBoundary | No `role="alert"` or `aria-live` region. AlertTriangle icon not `aria-hidden`. Buttons lack `aria-label`. Inline styles prevent `:focus-visible` outlines. |
| A7 | QuestionPanel | Max-height truncates content with no expand mechanism. Overflow content inaccessible to keyboard users. |

---

## 11. UX / Usability Issues

| # | Component | Issue |
|---|-----------|-------|
| U1 | ProctoringMonitor | Shows only last 10 events — no "show all" or expand. No way to dismiss/acknowledge alerts. |
| U2 | SecondaryCamera | No retry mechanism if phone camera fails. No visual feedback on link copy (just blocking `alert`). "Connected" persists even after phone disconnects — no heartbeat. No loading state for phone camera init. |
| U3 | ErrorBoundary | "We've logged this incident" shown but no error reporting exists. Hardcoded dark background ignores user color scheme. No copy-error-details button. |
| U4 | VideoPanel | No visual indicator when peer connection drops. User sees frozen frame with no feedback. |
| U5 | QuestionSelector | No loading spinner during question fetch. No empty state message. |
| U6 | CodeEditor | No loading placeholder while Monaco initializes. |
| U7 | ChatPanel | No "is typing" indicator. No timestamps on messages. |
| U8 | ErrorBoundary | `resetError()` can loop infinitely if child re-throws. |

---

## 12. Memory Leaks & Performance

| # | File | Issue |
|---|------|-------|
| ML1 | `VideoPanel.jsx` | Camera stream never stopped on unmount (stale closure). WebRTC socket listeners accumulate. |
| ML2 | `SecondaryCamera.jsx` | Camera stream never stopped (stale closure). `setInterval` runs forever after unmount. Socket listeners never removed. |
| ML3 | `ChatPanel.jsx` | `socket.off('chat-message')` removes all listeners, not just this component's — but also means OTHER components' listeners are destroyed. |
| ML4 | `proctoring.js` service | Singleton `violations` array grows unbounded across page navigations. `typingPatterns` capped at 50 — ok. `codeSnapshots` unbounded. |
| ML5 | `proctoring.js` service | Calling `startMonitoring` twice (StrictMode) orphans first call's cleanup functions — DOM event listeners leak. |
| ML6 | `socket.js` | `on(event, callback)` without corresponding `off()` on unmount → listener pile-up in singleton socket. |
| ML7 | `codeExecutor.js` L132 | If `executeJavaScript` throws during `writeFile`, temp file is never cleaned up (no `finally` block). |
| ML8 | `codeExecutor.js` L175–182 | No limit on `stdout`/`stderr` buffer size in `runCommand`. Infinite-output program causes OOM before timeout fires. |

---

## 13. Cross-Cutting Integration Mismatches

End-to-end flow analysis — where frontend and backend **don't align**:

| Flow | Frontend | Backend | Status |
|------|----------|---------|--------|
| **Create Interview** | `POST /interview/create` with `notes`, `codeSubmissions`, `proctoringEvents` | Schema doesn't have those fields | ⚠️ Fields silently dropped |
| **Get Interview** | `GET /interview/:id` | `GET /:id` | ✅ Works |
| **Load Questions** | `GET /questions/random/:count` | `GET /random/:count` shadowed by `/:id` | ❌ **BROKEN** |
| **Run Code** | `POST /code-execution/execute` | Returns hardcoded mock | ❌ **MOCKED** |
| **Submit Code** | `POST /code-execution/submit` with `questionId` | Validation expects `problemId` | ❌ **BROKEN** (field mismatch) |
| **Log Proctoring Event** | Sends `{ interviewId, event: {...} }` nested | Expects `{ interviewId, eventType, severity }` flat | ❌ **BROKEN** |
| **Create Proctoring Record** | Sends with `req.user.id` | `req.user.id` is `undefined` | ❌ **BROKEN** |
| **Proctoring interviewId** | UUID string from AIInterview | Model expects ObjectId | ❌ **BROKEN** (CastError) |
| **Socket Connection** | `localhost:5000` hardcoded, no auth token | No auth check | ⚠️ Works locally, fails in prod |
| **Dashboard Sessions** | `GET /proctoring/dashboard/sessions` | Shadowed by `/:interviewId` | ❌ **BROKEN** |
| **C++ Code** | C++ in language dropdown | No starter code defined for C++ | ⚠️ Empty editor |
| **List Interviews** | No API function for listing | `GET /interview/` exists | ⚠️ Unused endpoint |

---

## 14. Fix Priority Matrix

### Phase 1 — CRITICAL (Fix First — App Non-Functional Without These)

| ID | Task | Files | Est. Effort |
|----|------|-------|-------------|
| C1 | Pass `events` prop to ProctoringMonitor (or make it self-fetching) | `InterviewRoom.jsx` | 15 min |
| C2 | Fix proctoring event payload — flatten `{ eventType, severity, description }` | `api.js`, `proctoring.js` service | 30 min |
| C3 | Fix `req.user.id` → `req.user.userId` in proctoring routes | `backend/routes/proctoring.js` | 10 min |
| C4 | Change `interviewId` to `String` type in InterviewProctoring model | `InterviewProctoring.js` | 10 min |
| C5 | Move `/random/:count` route BEFORE `/:id` | `backend/routes/questions.js` | 5 min |
| C6 | Move `/dashboard/*` routes BEFORE `/:interviewId` | `backend/routes/proctoring.js` | 5 min |
| C8 | Use env var for socket URL | `frontend/src/services/socket.js` | 5 min |
| C9 | Fix questions array schema or use `questionAnswerPairs` | `AIInterview.js`, `interview.js` | 30 min |
| C10 | Add `interviewId` to proctoring validation schema | `validation.js` | 5 min |

### Phase 2 — HIGH (Major Functionality / Security)

| ID | Task | Files | Est. Effort |
|----|------|-------|-------------|
| C7 | Implement real code execution (or clearly indicate mock) | `codeExecution.js`, `codeExecutor.js` | 2-3 hrs |
| SEC1-2 | Fix sandbox escape vectors in codeExecutor | `codeExecutor.js` | 2 hrs |
| SEC7 | Remove `...req.body` spread, whitelist fields | `questions.js` | 15 min |
| SEC8 | Add auth middleware to question routes | `questions.js` | 10 min |
| SK1 | Add socket authentication (verify JWT on connect) | `handlers.js`, `socket.js` frontend | 1 hr |
| F1 | Fix VideoPanel stale closure — use ref for stream | `VideoPanel.jsx` | 30 min |
| F25-26 | Fix SecondaryCamera stream leak + interval cleanup | `SecondaryCamera.jsx` | 30 min |
| MW3 | Fix `problemId` vs `questionId` mismatch | `validation.js` | 5 min |
| B8 | Migrate questions to MongoDB | `questions.js` | 1-2 hrs |

### Phase 3 — MEDIUM (Quality & Robustness)

| ID | Task | Files | Est. Effort |
|----|------|-------|-------------|
| F10-13 | Fix ChatPanel (onKeyDown, dedup, scoped off, length limit) | `ChatPanel.jsx` | 30 min |
| F14-15 | Add null guards to QuestionPanel | `QuestionPanel.jsx` | 15 min |
| F16-18 | Add auth headers, response.ok checks, fix _id in QuestionSelector | `QuestionSelector.jsx` | 45 min |
| F33 | Fix `process.env` → `import.meta.env` in ErrorBoundary | `ErrorBoundary.jsx` | 5 min |
| S9 | Add socket reconnection logic | `socket.js` | 1 hr |
| ML4-5 | Fix proctoring singleton leaks | `proctoring.js` service | 30 min |
| CSS3 | Fix proctoring stats grid `1fr 1fr` → `1fr 1fr 1fr` | `ProctoringMonitor.css` | 5 min |
| CSS4 | Rename conflicting `@keyframes pulse` | `ProctoringMonitor.css` or `VideoPanel.css` | 5 min |
| CSS8 | Co-locate badge styles or move to shared CSS | `QuestionPanel.css` / shared | 10 min |

### Phase 4 — LOW (Polish & Accessibility)

| ID | Task | Est. Effort |
|----|------|-------------|
| A1-A7 | Add aria attributes, focus traps, screen reader support | 2-3 hrs |
| U1-U8 | UX improvements (loading states, retry, heartbeat, typing indicator) | 3-4 hrs |
| CSS1 | Add mobile responsive breakpoints | 1-2 hrs |
| CSS5 | Scope SecondaryCamera button classes | 15 min |
| F29 | Replace external QR API with local QR generation library | 30 min |
| F35 | Fix `e.target` → `e.currentTarget` in ErrorBoundary | 5 min |

---

## Summary

| Category | Count |
|----------|-------|
| Critical / App-Breaking | 10 |
| Frontend Component Bugs | 37 |
| Frontend Service Bugs | 20 |
| Backend Route Bugs | 19 |
| Model / Schema Issues | 7 |
| Middleware Issues | 3 |
| Socket Issues | 5 |
| Security Vulnerabilities | 13 |
| CSS Issues | 10 |
| Accessibility Issues | 7 |
| UX Issues | 8 |
| Memory Leaks | 8 |
| **Total** | **~147** |

> **Bottom Line:** The interview feature has **10 critical bugs** that prevent core flows from working (proctoring, questions, code execution, socket connectivity). Phase 1 fixes (~2 hours) will make the basic flow functional. Phase 2 (~6-8 hours) addresses security and major gaps. Phases 3-4 are polish.
