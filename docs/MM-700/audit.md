# MM-701: audit of the live MelodyMath site

| | |
|---|---|
| **Site** | https://swissystem7.github.io/MelodyMath/ |
| **Code audited** | `master` @ `744c134` (2026-11-02). The GitHub Pages API reports source `master` / `/`, and its latest build is that commit, so the live site and `master` were identical. |
| **Date** | 2026-11-03 |
| **Work plan** | [work-plan.md](work-plan.md) (tasks MM-711…MM-720 and MM-731…MM-748) |
| **Curriculum side** | [curriculum-gaps.md](curriculum-gaps.md) |
| **Regression suite** | [`audit/`](../../audit/README.md): every open finding below is a `test.fail()` test titled `[finding][task]` |

> **Deploy-branch note (fix later, not now).** `README.md` says Pages deploys from `main`. Pages actually builds from **`master`** (`/`). The README is not edited in this PR because of the MM-100 freeze; the correction is listed as a task note in the work plan (finding m6).

## Method

- Read-only. Fresh clone of `master`. Playwright 1.49.1 with Chromium at desktop 1280×800 and phone 360×740. Lighthouse 12.2.1 headless, mobile preset.
- All third-party requests were aborted during click sweeps, so no form, mail or chat message was sent. Only fake local names were used (`AUDIT-TEST`, `kid-1`). No sign-in anywhere, no accounts created.
- The one-off exploration scripts (crawl, dead-button sweep, PWA/offline probe, grade 2 and grade 5 walkthroughs, role probe, Lighthouse runs) were run outside the repo and are not committed. What matters from them is captured here and, where it can be checked automatically, in `audit/specs/`.
- The original live-site run had 60 tests: 36 pass, 21 fail as known bugs, 3 skipped by viewport. The committed suite in `audit/` is the cleaned-up successor: it targets the local build by default, and known bugs are `test.fail()` so the run is green.

---

## 1. Summary

| Severity | Count | Of which in the MM-100 area (blocked) |
|---|---|---|
| **Blocker** | 3 | 0 |
| **Major** | 11 | 4 |
| **Minor** | 15 | 3 |
| **Total** | 29 | 7 |

Severity is judged against the MM-700 goal (a real app for student, teacher and parent; installable and offline; sign-in and saved progress; no dead-end screens) and a school pilot on tablets.

**MM-100 area** = the guided lessons (MM-100 target: 38), the rhythm clock, and the QR export. Findings there are reported only; nobody touches them until Antigravity finishes MM-100 and Aviran lifts the freeze.

### What already works (no action needed; guarded by `audit/specs/smoke.spec.js`)

- All 12 root pages return 200 and have `lang="he" dir="rtl"`. No JS page error or console error on load, in either viewport. The only console warnings are the expected service-worker note in the crawl context and an AudioContext autoplay warning on `exercise.html`.
- No horizontal scroll at 360px on any page, including all 8 index tabs. No images without alt text, no unlabeled form controls. Lighthouse accessibility: 100 on index, program and check; 96 on offer.
- No "coming soon", placeholder or lorem screens.
- 41 distinct links. All internal and Ministry of Education links return 200. The only dead one is the Google Form (M1).
- `program.html` deep links (`index.html?topic=…&skill=…`) open targeted practice.
- PWA: manifest valid, icons resolve at their real sizes (192, 512), the service worker registers and controls the page after one reload, 137 files precached, Chrome reports **0 installability errors**, and offline reload works for index, program, curriculum, check, offer, privacy, landing, functions, exercise and a `?query` URL. The quick-start flow works offline.
- The teacher tab is behind the adult gate, with a required 3-second hold.

---

## 2. Findings

Each finding: page/URL, steps, expected vs actual, likely file, MM-100 flag, the task that fixes it, and the suite test that flips when it is fixed.

### Blockers

#### B1. The student start button is ~6.6 screens down on a phone (~4 on desktop)
- **Page:** `/index.html`, tab "תרגול לפי כיתה". **MM-100:** no. **Task:** MM-711.
- **Steps:** Open index at 360×740 and look for "מתחילים עכשיו ✨" (`#qsStartBtn`).
- **Expected:** A child, or the teacher handing over a tablet, sees the start action on the first screen.
- **Actual:** The button is at y≈4890px on phone (page height 7078) and y≈3131px on desktop. Everything above it is for adults: the a11y bar (165px), the site nav, the header, quick tools, the who-bar (356px), the first-run teacher guide `#firstRun` (**1575px**), metronome, "my song" and setlist-goal bars, the product banner, the grade bar, the 5-card "more" nav (664px), the learner plan slot.
- **Likely files:** `index.html` lines ~570–690 (block order before `#welcomeHero`), `src/lib/onboard.js` (first-run guide), `src/lib/core.js` (`installSharedChrome`).
- **Suite:** `[B1][MM-711] the student start button is within the first two screens` (both viewports).

#### B2. Progress from the main student flow does not reach the teacher unless a name was typed first
- **Page:** `/index.html`. **MM-100:** no. **Task:** MM-712.
- **Steps:** Fresh device → quick start → כיתה ב׳ → instrument → launch → answer 14 items. Open the teacher tab through the gate and look at the class board.
- **Expected:** Every session belongs to a student and shows up for the teacher.
- **Actual:** Quick start never asks "who are you". Without the who-bar filled in, no `mm-roster-v1:*` row is written; only anonymous counters are (`mm.streakMastery.v1`, `mm.tapProgress.v1`, `mm-grade`). The class board stays empty. With a class code and name set first, the session is recorded, shows on the board, and the parent letter works.
- **Likely files:** `index.html` (quick-start `#qsFlow` handlers, session logging), `src/lib/teacherStore.js` (`loadWho`, roster writes).
- **Suite:** `[B2][MM-712] quick start without a name still records progress a teacher can see`.

#### B3. No sign-in, no roles, no sync: the MM-700 core goal is absent
- **Page:** whole site. **MM-100:** no (but QR export, the only cross-device path today, is MM-100). **Task:** MM-717 (local half); the server half needs a design decision (work plan §4).
- **Actual:**
  - No login, password, PIN or account. "Identity" is a free-text class code + name in `localStorage`. Any child can tap another child's chip and act as them.
  - Teacher access is a math question plus a 3-second hold on the same device.
  - No parent role (M3).
  - A second device starts empty. Moving data between devices is manual: JSON export/import, or QR (MM-100).
  - README says so: "אין backend, אין חשבון".
- **Likely files:** `src/lib/teacherStore.js`, `src/lib/adultGate.js`, `index.html` who-bar.
- **Suite:** `[B3][MM-717] the app offers a role choice: student, teacher, parent`.

### Major

#### M1. The public contact form is dead (HTTP 410 Gone)
- **Page:** `/index.html`, `/offer.html`, `/landing.html`, link "טופס פנייה או משוב (טופס Google)". **MM-100:** no. **Task:** MM-713.
- **Steps:** Click the link (or request it): 410.
- **Expected:** A school that wants the pilot reaches the project.
- **Actual:** The form is deleted or closed. Only the mailto (a personal Gmail) works. README says an empty `CONTACT.form` falls back to the GitHub issue form, but the value is set to the dead URL.
- **Likely file:** `src/lib/contact.js` (`CONTACT.form`).
- **Suite:** `[M1][MM-713] <page>: the contact-form link does not point at the deleted Google Form` (offer, landing, index), plus an opt-in live link check (`AUDIT_CHECK_LINKS=1`).

#### M2. An interrupted diagnostic is lost on reload
- **Page:** `/index.html`. **MM-100:** no. **Task:** MM-716.
- **Steps:** Start the grade 2 diagnostic (≥16 items in rounds of 4), answer 3, reload.
- **Expected:** Resume at item 4, or at least an offer to.
- **Actual:** Back to `#rmStart`; the run is gone. The grade 5 gap report (`#rmReport`) also disappears on reload. A tablet that sleeps or loses the tab in class loses the child's work.
- **Likely file:** `index.html` (remediation run state is in memory only).
- **Suite:** `[M2][MM-716] an interrupted diagnostic resumes after reload`.

#### M3. There is no parent view
- **Page:** `/index.html`. **MM-100:** no. **Task:** MM-718.
- **Actual:** "מכתב להורה" (`#parentMake`/`#parentLetter`) exists only inside the adult-gated teacher tab, as a print sheet. No parent entry point or page; a parent at home cannot see progress (the data lives on the school tablet). The FamilyJam card is a parent+child activity, not a progress view.
- **Likely files:** `index.html` (`#parentCard`), `src/lib/teacherStore.js` (`parentNoteHtml`).
- **Suite:** `[M3][MM-718] a parent can open a parent view without the teacher gate`.

#### M4. Index performance: CLS 1.0, Lighthouse performance 39 (mobile)
- **Page:** `/index.html`, `/program.html`. **MM-100:** no. **Task:** MM-719 (CLS part); bundling is backlog.
- **Actual:** index LCP 4.1s, TBT 930ms, **CLS 1.0**, 117 requests / 579 KiB, ~110 separate `<script>` files, 1550 DOM nodes. program CLS 1.0, perf 74. check CLS 0.40. offer CLS 0.64. The shift comes mainly from the a11y bar and site nav that `core.js` injects at the top after load. GitHub Pages caches for only 10 minutes (113 resources flagged).
- **Likely files:** `src/lib/core.js` (`installSharedChrome`, a11y bar), `index.html` script list.
- **Suite:** `[M4][MM-719] <page>: layout shift after load stays under 0.1` (index, program). Locally (no throttling) the measured sum is ~0.2–0.4 on index and ~0.6–0.9 on program, still well above 0.1.

#### M5. Phone: after launch, the question is cut off at the top
- **Page:** `/index.html` at 360px. **MM-100:** no. **Task:** MM-714.
- **Steps:** Quick start → grade → launch.
- **Expected:** The prompt and the answer box are both fully on screen.
- **Actual:** The prompt's top edge is at −41px and the answer box sits at the bottom edge (y=696 of 740). Music pads, the drag widget and the FamilyJam card that follows dominate the screen.
- **Likely file:** `index.html` (focus/scroll after `#qsLaunchBtn`; `#rmAnswer` autofocus).
- **Suite:** `[M5][MM-714] after launch, the question and the answer box are both on screen` (phone).

#### M6. Grades 1–2 must type answers on the tablet keyboard
- **Page:** `/index.html`, diagnostic and practice. **MM-100:** no. **Task:** MM-715.
- **Actual:** Items use a free-text `<input dir="ltr">`, which opens the OS keyboard; it covers half of a 360px screen and clips the placeholder. No on-screen number pad, no tap-choice mode. Class mode already has 4 tap choices (`makeChoices` in teacherStore), so the pattern exists.
- **Likely files:** `index.html` (`#rmAnswer`, `#rmPlanAnswer`), `src/lib/teacherStore.js` `makeChoices`.
- **Suite:** `[M6][MM-715] grade 1 can answer by tapping an on-screen digit pad (no OS keyboard)`.

#### M7. Shared nav links are 15–20px tall on phones (every page)
- **Page:** all pages at 360px. **MM-100:** no. **Task:** MM-719.
- **Actual:** "תרגול א׳–ו׳" 65×20, "תוכנית הלימודים" 95×20, "כיסוי תוכנית" 70×20, "אודות" 32×15, "ניסוי כיתתי" 61×15 (`frequency.html` styles them at 40px). The latest commit says "44px mobile touch targets", but the shared chrome was not included.
- **Likely file:** `src/lib/core.js` (`siteNavHtml` and its injected CSS).
- **Suite:** `[M7][MM-719] shared nav links are at least 44px tall on phones`.

#### M8. QR share/export modal does not fit a phone; its close button is unreachable — **MM-100 area, blocked**
- **Page:** `/index.html` → "📱 קוד QR ושיתוף מהיר" → "ייצוא ב-QR".
- **Actual:** At 360px the modal is 872px tall with top=−66px. Title and ✕ are off-screen and cannot be scrolled to (`.modal-backdrop` uses `align-items:center` with no `max-height`/`overflow:auto`). The 3 mode tabs are clipped.
- **Likely file:** `index.html` lines 492–493 (CSS), 575–620 (markup).
- **Suite:** `[M8][MM-100] QR export modal: the close button is on screen at 360px`.

#### M9. Guided lesson "🎯 מעבר לתרגול בבנק!" does not open practice for that lesson — **MM-100 area, blocked**
- **Page:** `/index.html` → 🎓 שיעורים מודרכים → any lesson → step 4.
- **Steps:** Finish the check question, press the practice button.
- **Expected:** Practice on the lesson's topic.
- **Actual:** It closes the lesson, saves the grade and returns to the home tab top. No topic practice starts: a dead end 6 screens above the action.
- **Likely file:** `index.html` line 3584 (`stepPracticeBtn.onclick`); `startTopicPractice()` already exists (line 1977).
- **Suite:** `[M9][MM-100] the guided lesson "practice" button opens practice on the lesson topic`.

#### M10. Only 10 guided lessons on master (MM-100 target: 38) — **MM-100 area, blocked**
- By grade: א׳ 2, ב׳ 2, ג׳ 1, ד׳ 2, ה׳ 1, ו׳ 2. File: `src/lib/interactiveLessons.js`. Status note only.
- **Suite:** `[M10][MM-100] the lessons library holds the 38 MM-100 lessons`.

#### M11. The "rhythm clock" card renders outside `<main>`, after the footer, on every tab — **MM-100 area (clock), blocked**
- **Page:** `/index.html`, any tab.
- **Actual:** `#rpCard` ("M6 · שעון קצב · גאומטריה") is a direct child of `<body>` after `<footer>`, 423px tall, visible on every tab, and shows an internal code ("M6").
- **Likely files:** `index.html` line 3615, `src/components/RhythmPolygon.js`.
- **Suite:** `[M11][MM-100] the rhythm clock card is inside <main>, not after the footer`.

### Minor

| # | Finding | Where | Likely file | MM-100 | Task | Suite test |
|---|---|---|---|---|---|---|
| m1 | Internal issue number shown to children: "משחקי מוזיקה · #591" | index → 🎵 משחקי מוזיקה | `index.html` line 948 | no | MM-719 | `[m1][MM-719]` |
| m2 | Manifest uses the old purple theme (`theme_color #6946e8`, `background #f7f4ff`, also in `core.js` meta); site is now terracotta `#9a3412`/cream. No maskable icon, no `id`, no `screenshots`. `index.html` has no static `<link rel=manifest>` (`core.js` injects it). | PWA | `manifest.webmanifest`, `src/lib/core.js` `installPwaHooks`, `index.html` | no | MM-720 | `[m2][MM-720]` ×2 |
| m3 | Contrast: `.eyebrow`/`.kicker` `#d97757` on cream is 2.96–3.12:1 (needs 4.5:1) | `/offer.html` | `offer.html` / `src/theme.css` | no | MM-719 | `[m3][MM-719]` |
| m4 | QR "current student" export with no student selected still builds a QR for the placeholder "תלמיד" and says "מוכן לסריקה" | index → QR → ייצוא | `index.html` `renderExportQr` (~1784) | **yes, blocked** | MM-100 | `[m4][MM-100]` |
| m5 | Lesson step 4 still shows the step-3 widget; step 3 "next" is enabled before the child builds the whole | index → lessons | `index.html` lesson stepper (~2117–2400) | **yes, blocked** | MM-100 | — (manual) |
| m6 | README says Pages deploys from `main` (actual: `master`). README says the "מעבדה" tab was removed on 28.9, but it is still the 4th tab. | docs | `README.md` | no | backlog (after freeze) | — |
| m7 | `exercise.html` is not linked from anywhere; `demo.html` only from the first-run guide | — | `src/lib/onboard.js`, nav | no | backlog | — |
| m8 | `src/lib/teacherStore.js` has a literal NUL byte (`noteKey` separator, line 379), so `grep`/`git diff` treat it as binary | — | `src/lib/teacherStore.js` | no | backlog | — |
| m9 | The shared site nav is a dark purple band above a terracotta/cream page (mismatch after #948) | all pages | `src/lib/core.js`, `src/sefirot.css` | no | MM-719 | — (visual) |
| m10 | 8 tabs on phone sit in a 995px horizontal strip inside 358px with no scroll affordance; 3 tabs off-screen | index 360px | `index.html` `.tabs` | no | MM-719 | `[m10][MM-719]` |
| m11 | The child sees "דוח פערים להורה" with ⚠️ and "0/2" tiles right after the diagnostic | index after diagnostic | `index.html` `#rmReport` | no | MM-718 | `[m11][MM-718]` |
| m12 | No per-child PIN: any child can switch to another child via roster chips | who-bar | `index.html`, `teacherStore.js` | no | MM-717 | covered by MM-717 tests to add |
| m13 | QR export payload (names and results) goes into a production URL fragment (`#import=`); a phone camera scan puts it in browser history | QR | `src/lib/qrSync.js` line 136 | **yes, blocked** | MM-100 | — (privacy review) |
| m14 | Project contact is a personal Gmail on school-facing pages | index/offer/landing | `src/lib/contact.js` | no | MM-713 | — |
| m15 | `functions.html` sonification quiz: after answering, the other options stay enabled but do nothing. Out of elementary scope. | `/functions.html` | `src/lib/listenLessons.js` | no | backlog | — |

**Click sweep.** Every visible button on all pages and index tabs was clicked once, with side effects instrumented (DOM, audio, speech, print, clipboard, popup). No confirmed dead buttons. The three "no effect" hits were false positives (`check.html` repeats an existing validation message; two `functions.html` quiz options were already answered, m15). Coverage is partial where the first click replaces the view (Music Games: 176 buttons; Lessons: 22). Per-card dead-button tests are a follow-up inside MM-719.

---

## 3. App structure, screens and roles

**Root pages (all live):** `index.html` (elementary practice, the main app) · `program.html` (curriculum by grade, deep links into practice) · `curriculum.html` (coverage and failure points) · `check.html` (pre/post unit check, 8 items, roster-based) · `offer.html` (pilot offer letter) · `landing.html` (about) · `privacy.html` · `frequency.html` (frequency lab, ה׳–ו׳ enrichment) · `functions.html`, `807.html` (high-school sonification, a separate product) · `demo.html` (scripted walkthrough) · `exercise.html` (single exercise, orphan).

**index.html tabs** (`nav.tabs`, `src/lib/tabs.js`):
- תרגול לפי כיתה (`#remediation`): quick start → grade → instrument → diagnostic → gap report → personal practice; also mixtape and FamilyJam.
- 🎓 שיעורים מודרכים (`#lessons`, **MM-100**): 10 four-step lessons.
- צלילים וטמפו (`#practice`) · מעבדה (`#playground`) · 🎵 משחקי מוזיקה (`#musicGames`)
- מצב כיתה (`#classMode`): 8-minute session, tap choices, optional class clock (**MM-100 clock**); requires a student name.
- על הפעימה (`#beatMode`)
- דוח מורה (`#teacherReport`): behind the adult gate; class board, trial kit, roster JSON export/import, worksheets, parent letter, certificate.

Quick tools: smartboard mode; QR share/export/import (**MM-100**).

**Navigation:** shared top nav injected by `core.js` (תרגול א׳–ו׳ · תוכנית הלימודים · כיסוי תוכנית · אודות · ניסוי כיתתי); a "more" card nav on index; tabs inside index. No client-side routes; deep links via `?topic=&skill=` and `?screen=`.

**Roles today:**
- **Student:** anonymous by default; optionally a class code + name in the who-bar, stored on the device.
- **Teacher:** same device, unlocked by the adult gate (3-digit × 2-digit product + 3-second hold). Sees the board for one class code on this device only.
- **Parent:** no role; only a printable letter the teacher generates.

## 4. PWA

| Check | Result |
|---|---|
| Manifest | 200. `name`/`short_name` "MelodyMath", `lang he`, `dir rtl`, `start_url ./index.html`, `scope ./`, `display standalone`. Icons: svg any, 192 PNG, 512 PNG (real sizes). Missing: maskable icon, `id`, `screenshots`. Theme colours are the old purple (m2). |
| Link | Injected at runtime by `core.js` `installPwaHooks`. No static link in `index.html`; other pages have one. |
| Service worker | `sw.js`, scope `/MelodyMath/`, active, controls the page after the first reload. Cache `melodymath-offline-v32`, 137 entries. Cache-first with stale-while-revalidate; navigation falls back to `index.html`. Every asset referenced by the HTML is precached. |
| Installability (CDP `Page.getInstallabilityErrors`) | **0 errors**. |
| Offline | Works for index, program, curriculum, check, offer, privacy, landing, functions, exercise, and `index.html?topic=…`. Starting a diagnostic offline works. |
| Lighthouse (mobile) | index perf 39 / a11y 100 / BP 100 / SEO 100; program 74/100/100/100; check 81/100/100/100; offer 71/96/100/100. (Lighthouse 12 has no PWA category; CDP was used instead.) |

**Verdict:** installable and offline already work. Remaining PWA work is polish (m2 → MM-720) and layout shift (M4 → MM-719), not a rebuild.

## 5. Sign-in, progress and roles

| Question | Answer |
|---|---|
| Any sign-in? | **No.** No login, password, PIN, account or backend. |
| Per role? | No roles. The teacher area is gated by `src/lib/adultGate.js` (a nuisance, not a lock). No parent role. |
| Where is progress stored? | `localStorage` only: `mm-roster-v1:<classCode>` (per-student sessions; written only when a name is set), `mm-who-v1` (current student), `mm-grade`, `mm.myInstrument`, `mm.streakMastery.v1`, `mm.tapProgress.v1`, and about 20 more `mm.*` keys. |
| Survives reload? | Settings, the selected student and roster sessions: yes. **In-progress diagnostic/practice runs and the gap report: no** (M2). |
| Teacher sees a student's progress? | **Only on the same device, only for named students, one class code at a time.** Cross-device: manual JSON export/import (teacher tab) or QR (MM-100). A second browser context starts empty. |
| Parent view? | **None** (M3). |

## 6. Student walkthroughs

**Grades 1–3 (כיתה ב׳, 360px):** the start button is far below the fold (B1) → 2 quick steps (grade, instrument) → launch; focus goes to the answer box but the prompt is cut off (M5) and the OS keyboard opens (M6) → the diagnostic runs in rounds of 4 across addition, subtraction, multiplication, division, place value, word problems and geometry: at least 16 items, long for a 7-year-old, with no whole-run progress bar (only "סבב N · שאלה k/4") → music pads and a drag widget sit between prompt and answer → reload mid-run restarts everything (M2) → without a name nothing reaches the teacher (B2).

**Grades 4–6 (כיתה ה׳, 360px):** same entry friction → short diagnostic (6 items: fractions, decimals, data) → the data item's diagram renders above the input and pushes it to the bottom edge on phone → end screen shows "דוח פערים להורה" with three ⚠️ "0/2" tiles to the child (m11) → "מתחילים תרגול אישי" works → the report is gone after reload (M2).

**Class mode:** with no student it correctly asks for a name; with a student the 4-choice tap flow works (3 answers → stop → "1/3, 33%").

**Guided lesson (MM-100):** the 4 steps run without errors; the practice button is a dead end (M9); step 4 shows a stale widget (m5).

## 7. Where the fixes live

The fix tasks, with files, tests, size and blocked status, are in [work-plan.md](work-plan.md):
- MM-711…MM-720: app, UX and PWA tasks from this audit.
- MM-731…MM-748: curriculum gap tasks from [curriculum-gaps.md](curriculum-gaps.md).
- MM-100 area findings (M8, M9, M10, M11, m4, m5, m13): reported only; wait for Antigravity.
