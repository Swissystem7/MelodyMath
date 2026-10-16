# issue #102 — כיתה א׳ music activities, split into slices

Plan §5, grade א׳ table. The whole issue does not fit in one ≤400-line PR, so
it ships in two. Status checked against master `0b15778`.

## Already on master before this work

- 48 tagged bank items in `banks.js`, 12 per activity, every one with a hint:
  skip-count beats (`ST.SKIP2` / `ST.SKIP5` / `ST.GROUP10`), `ST.CHART100`,
  `ST.PATTERN`, and the scale jumps on `skill: 'number_line'`.
- `src/lib/grade1Music.js` existed, was listed in `sw.js` and loaded from
  `index.html` — but every Hebrew string in it had been mangled to literal
  `?` bytes, it duplicated the number-line scale formula, and no page ever
  called it.

## Slice 1 — the logic layer (this PR)

- `grade1Music.js`: real Hebrew throughout (shape names, 100-chart labels,
  screen-reader narration), built on `musicEngine.js` for every sound.
- Adds `metronomeBeats`: `countBeats` only returned the accented rungs, but
  the activity needs each n-th beat accented *against* the unaccented ones.
- `numberLine.js` extended, not forked: a real `playJumpSound`, the scale
  constants, and `clampHz` so a long jump cannot ask for 220 kHz. The sound
  side effect is out of the pure `jumpOnLine`, so nothing plays before the
  unlock gesture.
- `curriculum.js`: the ספירה and ישר המספרים rows now say what is actually
  audible. The לוח מאה and סדרות דגמים rows already claimed it.
- Tests for all of the above, plus the stated acceptance criteria: ≥12
  tagged hinted items per activity across levels 1–3, and a mastery path —
  no כיתה א׳ item carries a `table`, so `mastery.js` never gates one.

## Slice 2 — the widgets (still owed)

Not started. Needs its own draft PR:

- Four widgets in `index.html` driven by the slice-1 functions: the beat
  counter, the number line on the scale, the tappable 100-chart grid and the
  pattern player, each with a visible "השמע שוב" and the narration rendered
  as text when the device is muted.
- §4 mobile: 360–430 / 768–820 / 1280px, no horizontal scroll, 44×44px
  targets with 8px spacing — the 100-chart grid of 100 cells is the hard one.
- Playwright at 820×1180, 390×844, 360×740 plus iPhone 13 / Pixel 7, with
  screenshots on the PR. Note that agent worktrees run Node 18 and Playwright
  needs 20+, so this slice has to be verified somewhere else.
