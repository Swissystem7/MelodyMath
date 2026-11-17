# MM-702: curriculum map and gap plan, grades 1–6 (א׳–ו׳)

| | |
|---|---|
| **Date** | 3.11.2026 |
| **Code measured** | `master` @ `744c134` (2.11.2026), the same commit MM-501 was measured on. |
| **Official side (source)** | **MM-501, [PR #949](https://github.com/Swissystem7/MelodyMath/pull/949), `docs/research/MM-501-curriculum.md`.** This file does not repeat that research; it builds on it. |
| **Tasks** | Gap tasks are numbered **MM-731…MM-748** in [work-plan.md](work-plan.md) (the old working labels 1-A…4-I are kept in the tables for traceability). |
| **Regression suite** | Measurable gaps are `test.fail()` tests in `audit/specs/curriculum.spec.js`, titled `[gap][task]`. |
| **Freeze** | Every task here edits existing files (`banks.js`, grade files, lessons), so none starts until Aviran says MM-100 is finished. Tasks that touch lessons or the clock additionally wait for Antigravity (MM-100 area). |

## 0. Sources and method

- **Official side: taken from MM-501 only ([PR #949](https://github.com/Swissystem7/MelodyMath/pull/949), `docs/research/MM-501-curriculum.md`).** No new web research was done. Each official topic is cited to the PDF that MM-501 and the code use, with the page number recorded in `curriculum.programForGrade()`:
  - Program page: https://pop.education.gov.il/tchumey_daat/matmatika/yesodi/oraat-math/new-curriculum/
  - Per grade: `https://meyda.education.gov.il/files/Mazkirut_Pedagogit/math/primary-school/math2023/Newprogramgrade{1..6}.pdf`. The code quotes these PDFs verbatim, and `tools/verify-curriculum-quotes.js` and `test/verify-curriculum-quotes.test.js` check the quotes. MM-501 says it read them on 21.10.2026. I did not re-fetch them.
- **App side: re-measured on `master`.** I ran `curriculum.itemsForTopic(topicId, banks.allItems())` for all 59 `MATRIX` rows. The bank has 1,296 items, and every row count and level split matches MM-501 exactly. Other files used:
  - `src/lib/curriculum.js` and `src/lib/curriculum/grade1..6.js`: the `MATRIX` rows, `topicId` `mm-cur-N`, and boundary notes.
  - `src/lib/banks.js`: the items. The bank has an item `widget` field. The `clock` widget appears on **12 items, all in grades א and ב**.
  - `src/lib/interactiveLessons.js`: the 10 guided lessons. None of them has a `topicId`.
  - Tests: `test/curriculum*.test.js`, `test/grade4Coverage|grade5Coverage|grade6Coverage.test.js`, `test/curriculum-gaps.test.js` (asserts there are no `gap` rows in א–ו) and `test/verify-curriculum-quotes.test.js`.
- **Status rule (stricter than the repo's).** Every one of the 59 rows has `status: covered` in code, so tagged coverage is 100% in every grade. This map uses three levels instead:
  - **full**: tagged items exist, nothing that MM-501 or the boundary note names is missing, and the row has at least 12 items (MM-501's G2/G12 threshold).
  - **partial**: tagged, but something is missing. What is missing is stated in the row.
  - **missing**: no tagged items. No row is in this state.
- **MM-100 column.** MM-100 scope as given in the brief: the 38 lessons, the clock, and the QR export.
  - **Yes**: closing the gap needs a guided lesson (`interactiveLessons.js` / the lessons tab), the clock widget or clock items, or `qrSync.js`.
  - **No**: the work is outside that scope.
  - In both cases, see Q2 about `banks.js`.

## 1. Coverage summary

| Grade | Rows | Tagged (repo) | Full (this map) | Partial | Missing | Full % |
|---|---|---|---|---|---|---|
| א (1) | 13 | 13 | 7 | 6 | 0 | **54%** |
| ב (2) | 9 | 9 | 8 | 1 | 0 | **89%** |
| ג (3) | 9 | 9 | 6 | 3 | 0 | **67%** |
| ד (4) | 7 | 7 | 3 | 4 | 0 | **43%** |
| ה (5) | 12 | 12 | 3 | 9 | 0 | **25%** |
| ו (6) | 9 | 9 | 5 | 4 | 0 | **56%** |
| **Total** | 59 | 59 (100%) | 32 | 27 | 0 | **54%** |

## 2. Map per grade

Column notes:
- **L** is item levels, basis/intermediate/challenge.
- **Lesson** is the guided lesson that MM-501 mapped by hand. "—" means practice only.
- **Music** is the main `music` mechanism. Every row has one.

### Grade 1 (א׳): Newprogramgrade1.pdf

| Official topic (page) | MM topic id / files | Items (L) | Music | Lesson | Status | MM-100 |
|---|---|---|---|---|---|---|
| ספירה עד 100 קדימה ואחורה (Counting to 100, forward and back) (p.1) | mm-cur-0 · banks.js, grade1Music.js | 33 (7/17/9) | accentSkip, countDownBeats | — | full | No |
| מנייה עד 100, קיבוץ ל־10 (Counting objects to 100, grouping in 10s) (p.2) | mm-cur-1 · banks.js | 22 (12/7/3) | tenBeatBars | place-value-regrouping | partial: no open quantity estimation (MM-501 G7) | No |
| ישר המספרים עד 100 (Number line to 100) (p.3) | mm-cur-2 · numberLine.js | 40 (13/19/8) | lineStepBeats | number-line-jumps | full | No |
| קריאה וכתיבה, לוח מאה (Reading and writing numbers, hundred chart) (p.3) | mm-cur-5 · banks.js, grade1Music.js | 12 (4/5/3) | rowAccent | place-value-regrouping | full | No |
| סדרות דגמים + יצירת סדרה (Patterns, and making a pattern) (p.3) | mm-cur-6 · grade1Music.js | 13 (4/5/4) | fixedAccents, g1Pattern | — | full (see Q5: "יצירת סדרה", making a pattern, not verified as an item type) | No |
| מצבי חיבור/חיסור מחיי היום־יום (Everyday addition/subtraction situations) (p.6) | mm-cur-7 · banks.js | 15 (5/5/5) | callResponse | — | full | No |
| חיבור/חיסור עד 10 ועד 20; פירוקי 10; = משמאל (+/− within 10 and 20; decompositions of 10; = on the left) (p.6) | mm-cur-3 · banks.js, grade1Music.js | 62 (29/25/8) | takeAwayBeats, twoDrums | — | partial: closed practice only. No strategy teaching (make-10, "how did you compute?") and no guided lesson (G3, G5) | Yes (needs a lesson) |
| חיבור/חיסור בעשרות שלמות (+/− with whole tens) (p.8) | mm-cur-4 · banks.js | 9 (0/0/9) | accentTens | — | partial: all 9 items are challenge level, with no entry point (G9). Fewer than 12 items | No |
| מיון מצולעים, פירוק והרכבה (Sorting polygons; taking apart and composing) (p.8) | mm-cur-8 · geometryShapes.js | 18 (6/7/5) | shapeLoop | — | full (written only, by design, G8) | No |
| מדידת אורך (Length measurement) (p.11) | mm-cur-9 · banks.js (`ruler` widget) | 6 (2/3/1) | cmNote | — | partial: thin bank, 6 items (G2) | No |
| שעון בשעות שלמות (Analog clock, whole hours) (p.12) | mm-cur-10 · banks.js `CLK` (`clock` widget) | 6 (2/2/2) | hourAccents | — | partial: thin, 6 items (G2) | **Yes (clock)** |
| כסף: מטבעות וסכומים (Money: coins and sums) (p.3) | mm-cur-11 · banks.js | 6 (2/2/2) | coinGroups | — | partial: thin, 6 items (G2) | No |
| דיאגרמת עמודות ופיקטוגרם (Bar chart and pictogram) (p.13) | mm-cur-12 · banks.js (`pictogram`/`barchart`) | 15 (5/5/5) | barNotes | — | full (reading only) | No |

### Grade 2 (ב׳): Newprogramgrade2.pdf

| Official topic (page) | MM topic id / files | Items (L) | Music | Lesson | Status | MM-100 |
|---|---|---|---|---|---|---|
| מספרים עד 1,000, זוגי/אי־זוגי (Numbers to 1,000, even/odd) (p.1) | mm-cur-13 · grade2Music.js | 37 (18/11/8) | tenExchange, evenOdd | even-odd-rhythm | full | No |
| חיבור/חיסור דו־ספרתי, מאוזן ומאונך (Two-digit +/−, horizontal and vertical) (p.6) | mm-cur-14 · vertical.js, grade2Music.js | 68 (19/33/16) | columnPlayers | — | full | No |
| כפולות 2, 4, 5, 10 (Multiples of 2, 4, 5, 10) (p.5) | mm-cur-15 · mastery.js | 50 (27/17/6) | repeatedBars | multiplication-groups | full | No |
| חילוק לחלקים ולהכלה (Division as sharing and as grouping) (p.10) | mm-cur-16 · banks.js | 20 (9/9/2) | phraseShare | — | partial: only 2 challenge items (G9). No guided lesson for grade 2 division | No |
| פירוק והרכבה; זווית ישרה (Taking apart and composing shapes; right angle) (p.14) | mm-cur-17 · geometryShapes.js | 18 (6/7/5) | sideCountMotif | — | full (written only) | No |
| ס״מ, היקף, חצאי שעות (Centimetres, perimeter, half hours) (p.17) | mm-cur-18 · banks.js (`ruler`, `clock`) | 35 (13/12/10) | halfBar | — | full | **Yes (clock items)**: any clock change must not break these |
| כסף: שטרות, מטבעות, עודף (Money: notes, coins, change) (p.1) | mm-cur-19 · banks.js | 13 (4/4/5) | billBars | — | full | No |
| נפח תיבות במנייה של קוביות (Box volume by counting cubes) (p.17) | mm-cur-20 · cubeLayers (e2e/cubeLayers.spec.js) | 12 (4/4/4) | cubeLayerGroups | — | full | No |
| טבלה, עמודות, פיקטוגרם (Tables, bar charts, pictograms) (p.18) | mm-cur-21 · banks.js | 15 (4/6/5) | keyFives | — | full (reading only) | No |

### Grade 3 (ג׳): Newprogramgrade3.pdf

| Official topic (page) | MM topic id / files | Items (L) | Music | Lesson | Status | MM-100 |
|---|---|---|---|---|---|---|
| מספרים עד 10,000 (Numbers to 10,000) (p.1) | mm-cur-22 · grade3Music.js | 19 (7/7/5) | thousandAccents | — | full | No |
| חיבור/חיסור עד רבבה (+/− up to 10,000) (p.5) | mm-cur-23 · vertical.js | 24 (8/7/9) | carryAccentUp | — | full | No |
| לוח כפל 10×10 (Multiplication table 10×10) (p.7) | mm-cur-24 · mastery.js | 70 (19/27/24) | repeatedBars, meters | multiplication-groups | full | No |
| חילוק עם שארית; ×/÷ ב־10, 100, 1,000 (Division with remainder; ×/÷ by 10, 100, 1,000) (p.9) | mm-cur-25 · grade3Music.js | 21 (7/9/5) | leftoverBeats | division-groups | full | No |
| השוואה כפלית, שאלות דו־שלביות (Multiplicative comparison; two-step problems) (p.8) | mm-cur-26 · banks.js | 29 (6/15/8) | phraseFits | — | full | No |
| סוגי זוויות; מיון משולשים (Types of angles; sorting triangles) (p.13) | mm-cur-27 · geometryShapes.js | 12 (4/4/4) | turnAsBar | — | full (no protractor, by design, G8) | No |
| שטח מלבן; שעות ודקות (Rectangle area; hours and minutes) (p.19) | mm-cur-28 · banks.js, grade3Music.js (`tuneClock`) | 35 (12/14/9) | hourTwelveGroups, areaScore | — | partial: **no drawn minute clock**. The `clock` widget is used only in grades א and ב, so grade 3 reads times as text only | **Yes (clock)** |
| כסף: שקלים ואגורות (Money: shekels and agorot) (p.1) | mm-cur-29 · banks.js | 8 (3/3/2) | agorotTenGroups | — | partial: thin, 8 items (G2) | No |
| איסוף, ארגון, דיאגרמות (Collecting and organising data; charts) (p.19) | mm-cur-30 · banks.js | 11 (4/4/3) | keyAccentGroups | — | partial: the official text requires «בנייה של פיקטוגרם» (building a pictogram). The app only reads them (G1). Also 11 items | No |

### Grade 4 (ד׳): Newprogramgrade4.pdf

| Official topic (page) | MM topic id / files | Items (L) | Music | Lesson | Status | MM-100 |
|---|---|---|---|---|---|---|
| עד מיליון; אלגוריתמים במאונך; סדר פעולות (Numbers to a million; vertical algorithms; order of operations) (p.1) | mm-cur-31 · vertical.js, banks.js (incl. #710 equations) | 50 (16/17/17) | repeatedBars, carryTenUp | — | full in content. The grade 4 diagnostic does not test it (G4: product gap, see 4-D) | No |
| שבר כחלק משלם (Fraction as part of a whole) (p.11) | mm-cur-32 · bar44.js | 20 (9/9/2) | bar44Notes, fillBar | fractions-intro | partial: only 2 challenge items (G9) | No |
| שבר מכמות; שמות; השוואה; ± (Fraction of a quantity; names; comparing; +/−) (p.11) | mm-cur-33 · banks.js (incl. #709 mixed numbers) | 25 (9/8/8) | fillBar | — | full | No |
| מקבילים, מאונכים, מרובעים, שטח פנים (Parallel and perpendicular lines, quadrilaterals, surface area) (p.16) | mm-cur-34 · geometryShapes.js | 18 (6/7/5) | parallelVoices | geometry-euclidean | partial: the official text says «זיהוי **וסרטוט**» (identifying **and drawing**). There is no drawing (G1) | No |
| יחידות; לוח עברי/לועזי (Units; Hebrew/Gregorian calendar) (p.19) | mm-cur-35 · banks.js | 41 (14/14/13) | weekBars | — | full | No (calendar, not the clock face) |
| כסף: קנייה ועודף (Money: buying and change) (p.10) | mm-cur-36 · banks.js | 6 (2/2/2) | shekelHundredGroups | — | partial: thin, 6 items (G2) | No |
| טבלאות ודיאגרמות כולל שברים (Tables and charts, including fractions) (p.21) | mm-cur-37 · banks.js (`pie`) | 13 (3/5/5) | columnHeldNote, pieAsBar | — | partial: reading only. No double bar chart and no interpretation (G10) | No |

### Grade 5 (ה׳): Newprogramgrade5.pdf

| Official topic (page) | MM topic id / files | Items (L) | Music | Lesson | Status | MM-100 |
|---|---|---|---|---|---|---|
| מספרים גדולים ממיליון (Numbers beyond a million) (p.1) | mm-cur-38 · banks.js | 9 (3/3/3) | periodAccentLevels | — | partial: thin, 9 items. Not in the diagnostic (G2, G4) | No |
| ארבע פעולות עד מיליון; עיגול ואומדן (Four operations to a million; rounding and estimation) (p.2) | mm-cur-39 · banks.js (incl. #710) | 30 (10/12/8) | regroupAllLevels | — | partial: no step-by-step long division and no open estimation (G6, G7). Not in the diagnostic | Yes if done as a guided lesson. No if done as a stepped item widget |
| ראשוניים; גורמים; התחלקות (Primes; factors; divisibility) (p.5) | mm-cur-40 · polyrhythm.js | 23 (7/8/8) | meterGroups | polyrhythm-lcm | full | No |
| ייצוג שברים במודלים ועל הישר (Fractions in models and on the number line) (p.8) | mm-cur-42 · banks.js, numberLine.js | 8 (3/3/2) | noteValues | — | partial: thin, and described in words with no picture (G2) | No |
| הרחבה, צמצום, השוואה (Expanding, simplifying and comparing fractions) (p.8) | mm-cur-41 · banks.js | **4** (2/1/1) | splitNotes | — | partial: **the thinnest row in the bank.** No guided lesson (G2, G3) | Item part No. Lesson part Yes |
| שבר מכמות (Fraction of a quantity) (p.8) | mm-cur-43 · banks.js | 8 (2/3/3) | fillBar | — | partial: thin, 8 items (G2) | No |
| ± שברים במכנים שונים, מעורבים (+/− fractions with unlike denominators; mixed numbers) (p.13) | mm-cur-44 · banks.js | 26 (8/9/9) | mixedBar | — | full | No |
| עשרוניים: ערך מקום, השוואה (Decimals: place value, comparing) (p.15) | mm-cur-45 · banks.js | 19 (5/7/7) | tenthNotes | — | full | No |
| ± עשרוניים (+/− decimals) (p.18) | mm-cur-46 · banks.js, vertical.js | 11 (2/5/4) | tenthsTogether | — | partial: no vertical decimal addition (G6). 11 items | No |
| גובה; שטח משולש ומקבילית (Height; area of triangle and parallelogram) (p.22) | mm-cur-47 · banks.js (incl. #711 perimeter) | 19 (6/7/6) | areaScore | — | partial: no drawing of heights (G1) | No |
| פירמידות ומנסרות, פריסות (Pyramids and prisms, nets) (p.29) | mm-cur-48 · banks.js | 8 (2/3/3) | solidFaceMotif | — | partial: thin, 8 items. No cutting or folding, by design (G2, G8) | No |
| דיאגרמות; שכיחות ושכיח (Charts; frequency and mode) (p.30) | mm-cur-49 · banks.js | 18 (5/8/5) | tallyFives | — | partial: reading only. No double bar chart (G10) | No |

### Grade 6 (ו׳): Newprogramgrade6.pdf (bullet-level map in `curriculum/grade6.js`)

| Official topic (page) | MM topic id / files | Items (L) | Music | Lesson | Status | MM-100 |
|---|---|---|---|---|---|---|
| מספרים טבעיים ו־0; סדר פעולות (Natural numbers and 0; order of operations) (p.1) | mm-cur-50 · grade6.js | 24 (6/10/8) | stickingParity | — | full | No |
| כפל וחילוק שברים (Multiplying and dividing fractions) (p.5) | mm-cur-51 · grade6.js | 37 (12/13/12) | barFill, dotted | dotted-notes-division | full | No |
| כפל וחילוק עשרוניים (Multiplying and dividing decimals) (p.8) | mm-cur-52 · grade6.js | 27 (7/11/9) | decimalNoteScale | — | full | No |
| אחוזים (Percentages) (p.11) | mm-cur-53 · grade6.js | 27 (9/11/7) | percentBar | — | full | No |
| מצולעים מורכבים (Composite polygons) (p.13) | mm-cur-55 · grade6.js | 12 (4/6/2) | splitRowGroups | — | partial: no drawing (G1). Only 2 challenge items | No |
| מעגל ועיגול (Circle and disc) (p.18) | mm-cur-54 · grade6.js, circleOfFifths.js | 25 (8/9/8) | sectorAsNote | circle-of-fifths-tempo | partial: no drawing and no compass (G1) | No |
| נפח (Volume) (p.20) | mm-cur-56 · grade6.js | 12 (4/4/4) | cubeLayerGroups | — | full | No |
| ממוצע (Mean / average) (p.22) | mm-cur-57 · grade6.js, exercises/tapTempoMean.js | 10 (3/4/3) | levelNotes | — | partial: thin, 10 items. The bullet «תכונות הממוצע» (properties of the mean) shares the 7-item `G6_MEAN` pool | No |
| קריאה והצגה של נתונים (Reading and presenting data) (p.22) | mm-cur-58 · grade6.js | 12 (4/5/3) | columnsAsNotes | — | partial: the bullet «הצגת נתונים בדרכים שונות» (presenting data in different ways) is a closed choice, not construction (G1) | No |

## 3. Prioritized gap list (one PR each)

### How to test

**Unit tests**
- Unit tests run under `npm test` (`node --test`, with no dependencies).
- Item-count gaps get a threshold test in the same style as `test/grade5Coverage.test.js`, for example `assert(itemsForTopic('mm-cur-41', allItems()).length >= 12)` plus a per-level minimum.
- `test/verify-curriculum-quotes.test.js`, `test/curriculum-orphans.test.js` and `test/honesty.test.js` must stay green.

**Playwright**
- Already in this PR: `audit/specs/curriculum.spec.js` holds a `test.fail()` threshold check for every gap that can be measured from the shipped bank (MM-731, 732, 733, 734, 738, 739, 740, 741, 742, 747). The task's PR flips its check and removes the marker. Run with `cd audit && npm ci && npx playwright test`.
- Behaviour specs per task (widget renders, answer accepted, music plays) go in the repo's `e2e/` once the freeze lifts. Run manually, outside `npm test` (see `e2e/playwright.config.js`): `npx --yes playwright@1.49 test --config e2e/playwright.config.js`.
- The server is python on 127.0.0.1:8137, and there are 5 viewports.
- New specs go in `e2e/`, following `e2e/dataBeats.spec.js`, `e2e/cubeLayers.spec.js` and `e2e/childPath.spec.js`. Each spec:
  1. opens `index.html`,
  2. picks the grade in «תרגול לפי כיתה» (practice by grade),
  3. drives N items from the topic,
  4. asserts the widget renders, the music control plays (AudioContext unlocked after a click), the correct answer is accepted, and there is no horizontal scroll or console error.

**Blocking**
- **Freeze only**: the task edits existing files (`banks.js`, grade files, widgets). It is blocked until Aviran says MM-100 is finished, then it can start.
- **Freeze + MM-100 area**: the task touches lessons, the clock or QR. It is blocked until Antigravity finishes MM-100, and must then be re-planned against MM-100's result (see Q1).
- Every task edits `src/lib/banks.js` or the grade files, so see Q2 before starting any of them.

### Grades 1–3

| Task | Gap task (one PR) | Files | Test | Closes | Blocked |
|---|---|---|---|---|---|
| **MM-731** (1-A) | **Basis and intermediate entry items for whole tens.** Add 6 basis and 6 intermediate items for mm-cur-4 (for example 20+30 heard as accented tens). Today all 9 items are challenge level. | banks.js (grade א) | Unit: per-level count of at least 4 each. Playwright: grade א, level 1 serves a whole-tens item | G9 | Freeze only |
| **MM-732** (1-B) | **Thicken grade 1 measurement and money.** Raise mm-cur-9 (length) and mm-cur-11 (coins) to at least 12 items each, with every level represented. | banks.js, grade1.js (music ways) | Unit: threshold test. Playwright: `ruler` widget and coin items render at 375px | G2 | Freeze only |
| **MM-733** (1-C) | **Thicken grade 1 whole-hour clock items** (mm-cur-10, 6 to at least 12) on the existing `clock` widget. | banks.js `CLK` | Unit: threshold. Playwright: the clock face renders and the hour hand matches the answer | G2 | **Freeze + MM-100 area (clock)** |
| **MM-734** (1-D) | **Guided lesson "השלמה לעשר" (make 10 in a 10-beat bar)** for mm-cur-3, plus a `topicId` field on all 10 existing lessons (MM-512). | interactiveLessons.js, index.html (lessons tab), test/interactiveLessons.test.js | Unit: every lesson has a valid `topicId` (`curriculum.isValidTopicId`). Playwright: lessons tab, grade א filter, step through 4 steps, quiz passes | G3, G5 | **Freeze + MM-100 area (lessons)** |
| **MM-735** (1-E) | **Strategy items "איך חשבת?" (how did you compute?)** for mm-cur-3: closed-choice items that ask which decomposition was used (for example 8+5 as 8+2+3). | banks.js | Unit: at least 8 items tagged mm-cur-3 with a strategy skill. Playwright: answer flow | G5 | Freeze only |
| **MM-736** (1-F) | **Open quantity estimation, grade 1** (mm-cur-1): show a pictogram, ask "about how many?", accept a range. | banks.js, core.js answer check | Unit: a range-answer check, extending `isCorrect*` tests. Playwright: a value inside the range is accepted | G7 | Freeze only |
| **MM-737** (1-G) | **Build a pictogram, grade 3** (mm-cur-30): drag the number of symbols for a given key, reusing `dragPlace.js` (MM-514, grade ג part). | dragPlace.js, banks.js, index.html widget wiring | Unit: `test/dragPlace.test.js` extension. Playwright: drag symbols, then check is correct; keyboard-only path for a11y | G1 | Freeze only |
| **MM-738** (1-H) | **Drawn minute clock for grade 3** (mm-cur-28): extend the `clock` widget to minutes and add at least 8 grade ג items that use it. | banks.js `CLK`, clock widget in index.html, grade3Music.js `tuneClock` | Unit: widget data has a `minutes` field. Playwright: minute hand angle matches the item | partial row | **Freeze + MM-100 area (clock)** |
| **MM-739** (1-I) | **Agorot thickening, grade 3** (mm-cur-29, 8 to at least 12) and **division challenge items, grade 2** (mm-cur-16, add 4 challenge items). | banks.js | Unit: threshold and level tests | G2, G9 | Freeze only |

### Grades 4–6

| Task | Gap task (one PR) | Files | Test | Closes | Blocked |
|---|---|---|---|---|---|
| **MM-740** (4-A) | **Expanding and simplifying fractions, grade 5** (mm-cur-41, 4 to at least 12, then 42 and 43 to at least 12) (MM-511). This is the top gap in 4–6. | banks.js, curriculum/grade5.js music ways | Unit: threshold on 41, 42, 43. Playwright: `bar44` shows the equivalent split | G2 | Freeze only |
| **MM-741** (4-B) | **Guided lesson "הרחבה = חלוקת תו" (expanding = splitting a note)**, grade 5 fractions (MM-512 part 2). | interactiveLessons.js, index.html | Unit: lesson has `topicId` mm-cur-41. Playwright: lessons tab, grade ה filter | G3 | **Freeze + MM-100 area (lessons)** |
| **MM-742** (4-C) | **Thicken grade 4 money and grade 5 large numbers** (mm-cur-36 6→12, mm-cur-38 9→12). | banks.js | Unit: thresholds | G2 | Freeze only |
| **MM-743** (4-D) | **Extend the grade 4–5 diagnostic** to numbers and operations (mm-cur-31, 38, 39, 40) (MM-513). | diagnostic blocks (`test/diagnosticBlocks678.test.js`), learnerPlan.js | Unit: each diagnostic block lists a topicId from each strand. Playwright: `e2e/planScenarios.spec.js` extension | G4 | Freeze only |
| **MM-744** (4-E) | **Stepped long division and vertical decimal addition** (mm-cur-39, 46) as a `vertical.js` mode, not as a lesson. | vertical.js, banks.js | Unit: `test/vertical*` step-state tests. Playwright: enter digit by digit, final answer accepted | G6 | Freeze only (MM-100 area if done as a lesson) |
| **MM-745** (4-F) | **Double bar chart and interpretation items**, grades 4–5 (mm-cur-37, 49): two series, "which grew more?". | dataViz.js, banks.js | Unit: `test/dataViz.test.js` with 2 series. Playwright: both series render and are announced to a screen reader | G10 | Freeze only |
| **MM-746** (4-G) | **Closed "build" items for drawing rows**: drag a bar to height (mm-cur-58), pick the parallel or perpendicular segment (mm-cur-34), pick the correct height on a triangle (mm-cur-47) (MM-514, grades ד–ו). | dragPlace.js, geometryShapes.js, banks.js | Unit: dragPlace tests. Playwright: one drag test per grade at 375px and on the tablet viewport | G1 | Freeze only |
| **MM-747** (4-H) | **Level balance**: grade 4 part of a whole (mm-cur-32) +4 challenge items, grade 6 composite polygons (mm-cur-55) +4 challenge items, grade 6 mean (mm-cur-57) 10→12 with "properties of the mean" items. | banks.js, curriculum/grade6.js | Unit: per-level and per-bullet thresholds (grade 6 bullets map to standards) | G9, G2 | Freeze only |
| **MM-748** (4-I) | **Docs alignment**: README and the pitch document vs `curriculum.js`, and item counts plus a "thin" flag on `curriculum.html` (MM-516). | README.md, docs/PITCH-BRANCO-WEISS-2026-10.md, curriculum.html | Unit: `test/curriculum-page.test.js` checks the count per row. Playwright: `curriculum.html` shows the flag for rows under 12 | G11–G13 | Freeze only |

**Not gaps** (from MM-501, so no tasks are opened for them):
- agorot in grade 2 and kg/litre in grade 3 (they are not in those PDFs);
- percent fractions and repeated discount in grade 6;
- tables 3/6/7/8/9 being locked in grade 2 (that is the ministry's teaching order).

## 4. Open questions for the manager (on MM-501; not researched, per scope)

- **Q1. Lesson count.** MM-501 counts 10 guided lessons. MM-100's scope is "38 lessons". If MM-100 adds 38 lessons, MM-734 (1-D) and MM-741 (4-B) may be fully or partly covered by it. The lesson-to-topic map should be redone after MM-100 lands.
- **Q2. `banks.js` blocking.** MM-501 §4 and MM-503 say none of the bank tasks should start until MM-100 closes, because of conflicts in `banks.js`. The brief scopes MM-100 to lessons, the clock and QR. Under the current freeze every task here waits anyway (they all edit existing files). The question for the manager: when the freeze lifts, or earlier if Aviran allows, can the "Freeze only" bank tasks run in parallel with MM-100 follow-ups, or must they wait for all MM-100 work to merge?
- **Q3. Unmapped grade ו items.** The grade ו bank has 3 items under the standards «מיון מצולעים» (sorting polygons) and «זווית» (angles), which do not appear in any grade 6 `MATRIX` row. Are they intentional review items? `curriculum-orphans.test.js` passes, so they are probably excluded on purpose. Not checked further.
- **Q4. Citation granularity.** MM-501 cites the base URL and the PDF names, not row-level quotes. The verbatim quotes and page numbers live in code (`grade1..6.js`, `OFFICIAL_PAGE`). This map uses those page numbers.
- **Q5. "Making a pattern".** MM-501 gives no evidence on whether grade 1 «יצירת סדרה» (creating a pattern) and grade 1 estimation are official requirements or only teacher expectations. The statuses above follow MM-501 (G7) and the boundary notes.
