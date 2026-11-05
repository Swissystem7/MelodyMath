# MM-700: תוכנית עבודה (MM-7xx)

## תקציר

**המטרה:** להפוך את MelodyMath מאוסף דפי תרגול לאפליקציה אמיתית לשלושה תפקידים: **תלמיד/ה, מורה, הורה**. האפליקציה ניתנת להתקנה ועובדת גם בלי רשת (PWA), יש בה כניסה והתקדמות שנשמרת, ואין בה מסכים ללא המשך.

**איפה אנחנו היום** (מתוך [audit.md](audit.md), 29 ממצאים):
- ההתקנה והעבודה בלי רשת **כבר עובדות** (0 שגיאות התקנה, טעינה מחדש בלי רשת עובדת). נשאר רק ליטוש: MM-720, MM-719.
- **אין כניסה, אין תפקידים ואין סנכרון.** הזהות היא קוד כיתה + שם ב-`localStorage` של המכשיר. כשלא מקלידים שם, ההתקדמות לא מגיעה למורה (B2). אין מסך להורה (M3).
- **ילד/ה לא מוצא/ת את כפתור ההתחלה**: הוא נמצא כ-6.6 מסכים מתחת לראש העמוד בטלפון (B1). בטלפון השאלה נחתכת (M5), המקלדת מכסה חצי מסך (M6), וטעינה מחדש מוחקת אבחון באמצע (M2).
- **תוכנית הלימודים:** כל 59 השורות מתויגות בקוד, אבל רק 32 מהן (54%) מלאות לפי הכלל המחמיר של [curriculum-gaps.md](curriculum-gaps.md). המקור לצד הרשמי הוא MM-501 ([PR #949](https://github.com/Swissystem7/MelodyMath/pull/949)).

**מה ה-PR הזה עושה:** מוסיף **קבצים חדשים בלבד**: שלושה מסמכים ב-`docs/MM-700/` וחבילת בדיקות רגרסיה עצמאית ב-`audit/`. החבילה ירוקה היום. כל באג ידוע מסומן `test.fail()` עם מזהה הממצא ומזהה המשימה, כך שכל תיקון "יהפוך" את הבדיקה שלו.

**הקפאה (MM-100):** עד שאבירן יודיע ש-MM-100 הסתיים, **אסור לערוך אף קובץ קיים**. לכן **כל המשימות כאן חסומות**. יש שתי רמות חסימה:

| סטטוס | משמעות |
|---|---|
| **blocked until MM-100 ends (edits existing files)** | המשימה עורכת קבצים קיימים (`index.html`, `core.js`, `banks.js` וכו'). אפשר להתחיל מיד כשההקפאה מוסרת. |
| **MM-100 area: blocked until Antigravity finishes** | המשימה נוגעת בשיעורים המודרכים, בשעון או בייצוא ה-QR. מחכים ש-Antigravity יסיים את MM-100, ואז מתכננים אותה מחדש מול התוצאה. |

---

## 1. Numbering

- **MM-702** is taken by the curriculum map ([curriculum-gaps.md](curriculum-gaps.md)). The proposed task numbers in the raw audit (MM-702…MM-711) are **retired** and replaced as follows:

| Raw audit label | Now | Short name |
|---|---|---|
| MM-702 | **MM-711** | Child-first home |
| MM-703 | **MM-712** | Who is playing (every session has an owner) |
| MM-704 | **MM-713** | Contact link (410) |
| MM-705 | **MM-714** | Phone question layout |
| MM-706 | **MM-715** | Tap pad, grades א–ב |
| MM-707 | **MM-716** | Resume after reload |
| MM-708 | **MM-717** | Local roles + PIN |
| MM-709 | **MM-718** | Parent page |
| MM-710 | **MM-719** | Nav tap targets, CLS, contrast, child-screen cleanup |
| MM-711 | **MM-720** | PWA polish |

- **MM-731…MM-748**: curriculum gap tasks (old labels 1-A…1-I → MM-731…MM-739, grades 1–3 first; 4-A…4-I → MM-740…MM-748, grades 4–6).
- **MM-100** in a test title means "MM-100 area finding, no MM-7xx task until MM-100 is finished".

## 2. Regression suite (`audit/`)

- Self-contained: own `package.json` + lockfile, `playwright.config.js`, a tiny static server (`serve.js`) that serves the repo root, and `specs/`. Not part of the repo's `npm test` and not in CI. How to run: [`audit/README.md`](../../audit/README.md).
- Default target: the **local build** of the repo, with every outside request blocked (`page.route` abort). Optional: `AUDIT_BASE_URL=https://swissystem7.github.io/MelodyMath/` to run against the live site.
- Two projects: `desktop` (1280×800) and `phone360` (360×740, touch).
- Known bugs: `test.fail()` and a title `[finding][task] what the fixed app does`. When a fix lands, Playwright reports that test as "expected to fail, but passed" and the run goes red. **The fixing PR removes that `test.fail()` line**, and the test then guards the fix.
- Per task, "Flips" below names the suite tests the task must turn green. "Add" lists tests the task's PR should add (in `audit/specs/` or the repo's `e2e/`).

## 3. App, UX and PWA tasks (MM-711…MM-720)

Suggested order once the freeze lifts: MM-713 → MM-711 → MM-712 → MM-714 → MM-715 → MM-716 → MM-719 → MM-720 → MM-717 → MM-718. MM-713 is a one-line change. MM-711 and MM-712 unblock the pilot. MM-717 and MM-718 depend on the decision in §4.

Note: most of these tasks edit `index.html`, which MM-100 also edits (lessons tab, QR modal, clock card). After MM-100 merges, rebase and re-check the line references in audit.md.

### MM-711: Child-first home
- **Goal:** a child (or the teacher handing over a tablet) sees "מתחילים עכשיו" on the first screen. Move the quick-start hero (`#welcomeHero`) to the top of the practice tab. Fold the first-run teacher guide, metronome, my-song, setlist goal, grade bar and the "more" nav into one collapsed "למבוגרים" `<details>` below it. Fixes **B1** and reduces M5.
- **Files:** `index.html` (block order before `#welcomeHero`), `src/lib/onboard.js`, `src/lib/core.js` (`installSharedChrome`).
- **Flips:** `[B1][MM-711] the student start button is within the first two screens` (desktop + phone360).
- **Add:** `#qsStartBtn` is inside the **first** viewport at both sizes; the "למבוגרים" section is collapsed by default and still holds the teacher guide.
- **Size:** M.
- **Status:** **blocked until MM-100 ends (edits existing files).**

### MM-712: Who is playing
- **Goal:** every session has an owner. Add step 0 to quick start, "מי משחק/ת?": pick a roster chip or type a name; the class code is remembered; an "אורח/ת" option keeps today's anonymous path but says that the teacher will not see it. Write every diagnostic/practice session to `mm-roster-v1`. Fixes **B2**.
- **Files:** `index.html` (`#qsFlow` handlers, session logging), `src/lib/teacherStore.js` (`loadWho`, roster writes).
- **Flips:** `[B2][MM-712] quick start without a name still records progress a teacher can see`.
- **Add:** after quick start with a picked name, the teacher board (through the gate) shows the session; the guest path shows its notice.
- **Size:** M.
- **Status:** **blocked until MM-100 ends (edits existing files).**

### MM-713: Contact link (410)
- **Goal:** a school that wants the pilot can reach the project. Set `CONTACT.form` to `''` so the documented GitHub issue-form fallback is used (or to a working form the owner provides). Decide whether to keep a personal Gmail on school-facing pages (m14). Fixes **M1**, m14.
- **Files:** `src/lib/contact.js`; a unit test in `test/contact.test.js` (form is `''` or an https URL).
- **Flips:** `[M1][MM-713] offer.html / landing.html / index.html: the contact-form link does not point at the deleted Google Form` (3 tests × 2 viewports). Optional live check `[M1][MM-713] live check…` with `AUDIT_CHECK_LINKS=1`.
- **Add:** the unit test above.
- **Size:** S.
- **Status:** **blocked until MM-100 ends (edits existing files).** Needs the owner's choice of contact address (open question Q-A).

### MM-714: Phone question layout
- **Goal:** on a phone, the prompt and the answer box are both on screen after launch and after every "next". Scroll the prompt top into view; hide the mixtape and FamilyJam cards while a run is active. Fixes **M5**.
- **Files:** `index.html` (focus/scroll after `#qsLaunchBtn`, `#rmAnswer` autofocus, card visibility during a run).
- **Flips:** `[M5][MM-714] after launch, the question and the answer box are both on screen` (phone360).
- **Add:** the same check after the 2nd and 4th item, and for a grade 5 data item with a diagram.
- **Size:** S–M.
- **Status:** **blocked until MM-100 ends (edits existing files).**

### MM-715: Tap pad, grades א–ב
- **Goal:** grades 1–2 answer by tapping, never through the OS keyboard. Add an on-screen digit pad (or the 4-choice `makeChoices` already used in class mode) for `#rmAnswer`/`#rmPlanAnswer`, with `inputmode="none"` when the pad is on. PR #950's pilot keypad is the reference design. Fixes **M6**.
- **Files:** `index.html` (`#rmAnswer`, `#rmPlanAnswer`), `src/lib/teacherStore.js` (`makeChoices`) or a new pad module.
- **Flips:** `[M6][MM-715] grade 1 can answer by tapping an on-screen digit pad (no OS keyboard)`.
- **Add:** finish 3 grade-1 items without `keyboard.type`/`fill`; pad buttons ≥44px; pad works with a screen reader (labelled buttons).
- **Size:** M.
- **Status:** **blocked until MM-100 ends (edits existing files).**

### MM-716: Resume after reload
- **Goal:** a tablet that sleeps, or a tab that reloads, does not lose the child's work. Persist the active diagnostic/practice run and the last gap report per student (e.g. `mm-run-v1:<code>:<name>`), and offer "להמשיך מאיפה שעצרנו?" on load. PR #950's pilot already resumes at the same question; reuse the pattern. Fixes **M2**.
- **Files:** `index.html` (remediation run state).
- **Flips:** `[M2][MM-716] an interrupted diagnostic resumes after reload`.
- **Add:** the gap report survives a reload; "start over" clears the saved run; offline reload also resumes.
- **Size:** M.
- **Status:** **blocked until MM-100 ends (edits existing files).**

### MM-717: Local roles + PIN
- **Goal:** the local half of sign-in. On first open, ask "אני תלמיד/ה · מורה · הורה" and remember it per device. Students get an optional 4-picture PIN set by the teacher; teachers keep the adult gate. Still local-only; the server half is §4. Fixes the local half of **B3**, and **m12**.
- **Files:** `index.html` (who-bar, first-open flow), `src/lib/teacherStore.js`, `src/lib/adultGate.js`; probably a new `src/lib/roles.js` (and its `sw.js` precache entry).
- **Flips:** `[B3][MM-717] the app offers a role choice: student, teacher, parent`.
- **Add:** the role choice persists across reload; a wrong PIN cannot open another child's row; the teacher gate still guards the teacher tab.
- **Size:** L.
- **Status:** **blocked until MM-100 ends (edits existing files).** Scope also depends on the §4 decision.

### MM-718: Parent page
- **Goal:** a parent has an entry point. A read-only `parent.html` that shows the parent letter (`parentNoteHtml`) for a child chosen from this device's roster, with print; linked from the role picker and as "להורים" in the shared nav; gated by the child's PIN, not the teacher gate. Move the "דוח פערים להורה" wording off the child's end-of-diagnostic screen (m11). Fixes **M3**, **m11**.
- **Files:** new `parent.html`; `src/lib/core.js` (`siteNavHtml`); `src/lib/teacherStore.js` (`parentNoteHtml`); `index.html` (`#rmReport` wording); `sw.js` (precache the new page).
- **Flips:** `[M3][MM-718] a parent can open a parent view without the teacher gate`; `[m11][MM-718] the child's end-of-diagnostic screen is not a parent report`.
- **Add:** `parent.html` loads offline, is RTL, has no horizontal scroll at 360px; it shows only the chosen child.
- **Size:** M (local); L if it must read synced data (§4).
- **Status:** **blocked until MM-100 ends (edits existing files).**

### MM-719: Nav tap targets, CLS, contrast, child-screen cleanup
- **Goal:** the shared chrome meets touch and stability basics. Shared nav links ≥44px; reserve space for the injected a11y bar and nav so CLS < 0.1; remove "#591" from the child screen (m1); fix the offer.html contrast (m3); align the nav colour with the terracotta theme (m9); give the phone tab strip a visible scroll affordance or wrap it (m10). Turn the one-off dead-button sweep into per-card tests (Music Games, Lessons after MM-100). Fixes **M7**, the CLS part of **M4**, **m1**, **m3**, **m9**, **m10**.
- **Files:** `src/lib/core.js` (`siteNavHtml` CSS, a11y bar), `src/sefirot.css`, `src/theme.css`, `offer.html`, `index.html` (line ~948, `.tabs`).
- **Flips:** `[M7][MM-719] shared nav links are at least 44px tall on phones`; `[M4][MM-719] index.html / program.html: layout shift after load stays under 0.1` (×2 viewports); `[m1][MM-719] no internal issue numbers`; `[m3][MM-719] offer.html eyebrow/kicker text meets 4.5:1 contrast`; `[m10][MM-719] every index tab button is reachable…` (phone).
- **Add:** CLS check on check.html and offer.html; per-card click tests for Music Games.
- **Size:** M.
- **Status:** **blocked until MM-100 ends (edits existing files).**

### MM-720: PWA polish
- **Goal:** the install and splash screens match the brand. Set the manifest `theme_color`/`background_color` to the current tokens, add 192/512 maskable icons, `id` and `screenshots`; add a static `<link rel=manifest>` and apple-touch-icon to `index.html`; align the `core.js` theme meta. Bump the SW cache name. Fixes **m2**.
- **Files:** `manifest.webmanifest`, `icons/` (new maskable PNGs), `index.html`, `src/lib/core.js` (`installPwaHooks`), `sw.js`.
- **Flips:** `[m2][MM-720] manifest has a maskable icon and its theme matches the page theme-color`; `[m2][MM-720] index.html declares the manifest statically`.
- **Add:** keep `PWA: the service worker takes control…` green; check `test/pwa.test.js` still passes.
- **Size:** S.
- **Status:** **blocked until MM-100 ends (edits existing files).**

### MM-100 area findings (no MM-7xx task yet)

Reported only. Each has a `test.fail()` test titled `[finding][MM-100]`. After Antigravity finishes MM-100, re-run the suite: MM-100 may already flip some of them; the rest get MM-7xx numbers then.

| Finding | What | Suite test | Status |
|---|---|---|---|
| M8 | QR modal too tall at 360px, close button unreachable | `[M8][MM-100]` (phone) | **MM-100 area: blocked until Antigravity finishes** |
| M9 | Lesson "practice" button is a dead end | `[M9][MM-100]` | **MM-100 area: blocked until Antigravity finishes** |
| M10 | 10 lessons, target 38 | `[M10][MM-100]` | **MM-100 area: blocked until Antigravity finishes** |
| M11 | Rhythm clock card after the footer on every tab | `[M11][MM-100]` | **MM-100 area: blocked until Antigravity finishes** |
| m4 | QR export builds a code with no student | `[m4][MM-100]` | **MM-100 area: blocked until Antigravity finishes** |
| m5 | Stale widget in lesson step 4 | manual | **MM-100 area: blocked until Antigravity finishes** |
| m13 | QR payload with names in a URL fragment | privacy review | **MM-100 area: blocked until Antigravity finishes** |

### Backlog (not pilot-critical; no ID yet)

- **README deploy branch (m6):** README says Pages deploys from `main`; it builds from **`master`**. Also the "מעבדה" tab note. Fix in README after the freeze. Not done here because README is an existing file.
- Index script bundling and the rest of M4 (LCP 4.1s, ~110 scripts, 10-minute Pages cache).
- `exercise.html` orphan; `demo.html` reachable only from the first-run guide (m7).
- NUL byte in `src/lib/teacherStore.js` (m8).
- `functions.html` quiz options stay enabled (m15; high-school product).

## 4. Curriculum gap tasks (MM-731…MM-748)

Details, files and per-task tests are in [curriculum-gaps.md §3](curriculum-gaps.md#3-prioritized-gap-list-one-pr-each). Official side from MM-501 ([PR #949](https://github.com/Swissystem7/MelodyMath/pull/949)). Grades 1–3 first, then 4–6.

| ID | One line | Flips (`audit/specs/curriculum.spec.js`) | Size | Status |
|---|---|---|---|---|
| MM-731 | Grade 1 whole tens: add basis + intermediate items (mm-cur-4) | `[G9][MM-731]` | S | blocked until MM-100 ends (edits existing files) |
| MM-732 | Grade 1 length and coins to ≥12 items each (mm-cur-9, 11) | `[G2][MM-732]` ×2 | S | blocked until MM-100 ends (edits existing files) |
| MM-733 | Grade 1 whole-hour clock items to ≥12 (mm-cur-10) | `[G2][MM-733]` | S | **MM-100 area: blocked until Antigravity finishes** (clock) |
| MM-734 | Lesson "השלמה לעשר" + `topicId` on every lesson (mm-cur-3) | `[G3/G5][MM-734]` | M | **MM-100 area: blocked until Antigravity finishes** (lessons) |
| MM-735 | "איך חשבת?" strategy items (mm-cur-3) | — (add unit + e2e) | S | blocked until MM-100 ends (edits existing files) |
| MM-736 | Grade 1 open estimation with range answers (mm-cur-1) | — (add unit + e2e) | M | blocked until MM-100 ends (edits existing files) |
| MM-737 | Grade 3 build-a-pictogram via `dragPlace.js` (mm-cur-30) | — (add unit + e2e) | M | blocked until MM-100 ends (edits existing files) |
| MM-738 | Grade 3 drawn minute clock, ≥8 items (mm-cur-28) | `[partial][MM-738]` | M | **MM-100 area: blocked until Antigravity finishes** (clock) |
| MM-739 | Grade 3 agorot ≥12; grade 2 division +4 challenge items | `[G2/G9][MM-739]` | S | blocked until MM-100 ends (edits existing files) |
| MM-740 | Grade 5 fractions mm-cur-41/42/43 to ≥12 each (top 4–6 gap) | `[G2][MM-740]` ×3 | M | blocked until MM-100 ends (edits existing files) |
| MM-741 | Lesson "הרחבה = חלוקת תו" for mm-cur-41 | `[G3][MM-741]` | M | **MM-100 area: blocked until Antigravity finishes** (lessons) |
| MM-742 | Grade 4 money and grade 5 large numbers to ≥12 (mm-cur-36, 38) | `[G2][MM-742]` ×2 | S | blocked until MM-100 ends (edits existing files) |
| MM-743 | Grade 4–5 diagnostic covers numbers and operations | — (add unit + e2e) | M | blocked until MM-100 ends (edits existing files) |
| MM-744 | Stepped long division + vertical decimal addition (`vertical.js` mode) | — (add unit + e2e) | L | blocked until MM-100 ends (edits existing files); MM-100 area only if built as a lesson |
| MM-745 | Double bar chart + interpretation items, grades 4–5 | — (add unit + e2e) | M | blocked until MM-100 ends (edits existing files) |
| MM-746 | Closed "build" items for drawing rows, grades 4–6 | — (add unit + e2e) | L | blocked until MM-100 ends (edits existing files) |
| MM-747 | Level balance: mm-cur-32, 55 challenge items; mean to ≥12 | `[G9/G2][MM-747]` | S | blocked until MM-100 ends (edits existing files) |
| MM-748 | Docs alignment + "thin" flag on `curriculum.html` | — (add unit + e2e) | S | blocked until MM-100 ends (edits existing files) |

## 5. Server sign-in and sync: needs a design decision

MM-717 and MM-718 give **local** roles. A real sign-in with progress that follows the child across devices (school tablet → home) needs a server, and that is an architecture and privacy decision for Aviran and the manager, not a PR. **No option is chosen here, and no accounts, projects or keys were created.**

Constraints any option must meet:
- Users are minors (ages 6–12). Israeli Privacy Protection Law (including Amendment 13) and Ministry of Education rules for student data and approved apps apply; parental consent and data minimisation are needed.
- The site is static on GitHub Pages and works offline today; sync must be offline-first and handle conflicts.
- No secrets in the repo; CI must stay a single `ci.yml` (guard tests enforce it).

| Option | What it is | For | Against |
|---|---|---|---|
| A. Stay local + better transfer | No server. Improve JSON export/import and QR (after MM-100) between teacher and student devices. | Zero privacy surface; no cost; works today. | No real sign-in; parent sees nothing at home; manual. |
| B. Teacher-hosted file | The teacher exports a class file to the school's own drive (Google Workspace / Microsoft 365 for Education) and imports it on other devices. | Data stays in school systems; no project server. | Still manual; depends on each school's setup. |
| C. Managed backend (BaaS) | A hosted auth + database service with class codes and child PINs. | Fast to build; real sync; parent access possible. | A vendor holds minors' data (location, DPA, cost); needs keys and an account owner. |
| D. School identity (SSO) | Sign in with the Ministry's identity service or the school's Google/Microsoft education accounts. | No new passwords; schools already manage the accounts. | Approval process; young children struggle with SSO; integration effort. |
| E. Own minimal backend | A small API + database run by the project. | Full control; minimal data model. | Hosting, security, backups and on-call fall on the project. |

Questions to settle first: who owns the data and the accounts (project, school, or parent); whether a parent account is needed at all or a printable/PIN view is enough; what the pilot needs versus the product.

## 6. The pilot (PR #950) in context

[PR #950](https://github.com/Swissystem7/MelodyMath/pull/950) (MM-600, branch `goza/MM-600-pilot-demo`) is a **separate demo** in `pilot/`, new files only, not linked from the app. On one device it shows: a demo sign-in for a teacher and a student (client-side check against seed accounts), one grade א–ג unit on the number line with an on-screen keypad, progress saved after every answer with resume after reload, teacher assignment, and a report by topic with gaps.

How it relates to this plan:
- It is the **UX reference** for MM-712 (owner of each session), MM-715 (keypad), MM-716 (resume), MM-717 (roles) and MM-718 (report for adults). The tasks here bring those patterns into the main app after the freeze.
- Its demo accounts are **not** a sign-in design. They must not be copied into the main app as real authentication; §5 decides that.
- It does not change any existing file, so it does not conflict with this PR or with the freeze. This PR does not touch `pilot/`.

## 7. Open questions for the manager

- **Q-A (MM-713):** which contact target should replace the dead Google Form: the GitHub issue form (the documented fallback), a new form, or a project email instead of the personal Gmail?
- **Q-B (§5):** which sign-in/sync option (A–E) to pursue, and who owns minors' data?
- **Q-C (MM-717/718):** is a local parent page with a child PIN enough for the pilot, or must the parent see progress from home?
- **Q-D (order):** confirm the order in §3, or move MM-717/718 ahead of the UX fixes.
- **Q1–Q5:** the curriculum questions in [curriculum-gaps.md §4](curriculum-gaps.md#4-open-questions-for-the-manager-on-mm-501-not-researched-per-scope) (lesson count after MM-100; whether bank-only tasks can run in parallel with MM-100; 3 unmapped grade ו items; citation granularity; "making a pattern").
