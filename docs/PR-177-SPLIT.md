# Splitting PR #177 (686 changed lines) — issue #274

`auto_merger` merges at most 400 changed lines; PR #177
(`factory/laptop-claude-g3-music-ui`, grade-3 music widgets) has 686 over two
commits. Diffed against `origin/master` (7ea26a3) rather than the stale local
`master`, 368 of those lines are already in or are a worse version of what is:
the `grade3Music.js` pure core landed in #176; the `musicEngine.js` provider and
`core.js`'s `installAudioUnlock` are superseded by master's own engine, already
called from `index.html`; master's `curriculum.js` moved past the branch
entirely. What is genuinely missing is the grade-3 **UI**, in two slices.

> **Where this landed (issue #278).** The split never ran its course: `master`
> took both slices at once in a741883 ("#104, part 2/3"), which is why this
> branch then conflicted. Resolving that merge kept slice 1's half of the
> overlap, because it is the half with a test behind it — `bindGrade3` and its
> four `draw*` return a boolean, so a spec the pure half rejects leaves the host
> untouched instead of showing an empty box, the leftover bar carries
> `g3-leftover`, and each play button names what it plays. a741883 also landed
> slice 2's `AREA_RECT`/`TIME_MIN_SEC` items without the
> `measurementBank.test.js` line below, and wired `grade3Music.js` into a page
> without taking it off the `reachability.test.js` unused list, so `npm test`
> was red on two counts; both are fixed here. The duplicate
> `musicEngine.js` entries a741883 added to `index.html` and `sw.js` are gone —
> the one the page already had loads before `grade3Music.js` on its own.

## Slice 1 — the widgets (this PR, 399 changed lines)

`bindGrade3` in `src/lib/grade3Music.js`, the `.g3-*` CSS and the `g3` branch in
`renderWidget`, `grade3Music.js` into the `sw.js` precache (#176 shipped it
without one), and `test/grade3Widgets.test.js` — a fake-DOM test of all four
kinds, the `aria-hidden`/`sr-only` pairing, quiet mode and the ≥44px cells.
`grade3Music.js` leaves the `reachability.test.js` intentionally-unused list.

## Slice 2 — the bank items and the remainder answer (~220 changed lines)

Verified green on top of slice 1 (505 tests) by rebuilding the tree and running
`node --test`; the functional body below is 106 changed lines.

- `src/lib/banks.js` (+79/-1): `NUM10K`, `DIV_REM_G3`, `TIMES_MORE`,
  `AREA_RECT`, `TIME_MIN_SEC`; `I()` carries `g3` and `typed`; 32 grade-ג׳ items
  (meter = times table, bar = divisor, grid = rectangle, octave = "פי 2");
  `GRADE_SKILLS['ג']` gains `place_value` and `word_problems` — a fix in itself,
  since ג׳ already held 7 and 8 items those keys kept out of the diagnostic and
  so out of the practice plan. The ג׳ diagnostic goes 8 → 12 items.
- `index.html` (+12/-4): `remSpec`/`answerOk`/`answerHint` send a remainder item
  through `isRemainderAnswer`/`remainderMiss` instead of the numeric
  `isCorrect`; `beatPool` drops `typed` items, because beat mode answers by
  tapping; honest grade-ג׳ `GRADE_NOTE`.
- `src/lib/mathBidi.js` (+4/-2) + `test/mathBidi.test.js`: `שארית` as a word
  operator, or the RTL page reorders `3 שארית 2` into `2 שארית 3`.
- `test/measurementBank.test.js` (+3/-1): ג׳ may also carry `AREA_RECT` and
  `TIME_MIN_SEC` — grid cells are not square units and minutes→seconds is not a
  clock face, so neither folds into `ST.AREA`/`ST.MINUTES`.
- `curriculum.js` + `CURRICULUM-MUSIC-PLAN.md`: grade-ג׳ rows off ❌/GAP onto the
  partial statuses the items earn — no square units, no multiplication
  algorithm, no clock to the minute. Plus `test/grade3Bank.test.js`: every `g3`
  spec is one `bindGrade3` draws and every answer passes its own validator.

Slice 1 goes first: `reachability.test.js` wants a `renderWidget` branch for
every widget the bank uses, and the prompts say "שמעתם".
