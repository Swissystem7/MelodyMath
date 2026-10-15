# #103 — כיתה ב׳ music activities, split into slices

§5 of [docs/CURRICULUM-MUSIC-PLAN.md](CURRICULUM-MUSIC-PLAN.md) asks for five
activities with at least 10 tagged items each. That does not fit one ≤400-line
PR, so it ships in slices.

## Already landed before this PR

**#135 — the bank.** All five activities already ship 10–11 tagged items each,
appended at the end of `RAW` in `banks.js` so earlier ids keep theirs. Every
item carries `{grade, strand, standard}` plus `music: '<activity>'`, and the
multiplication items stay on tables 2/4/5/10, so the `mastery.js` gate for
3/6/7/8/9 is untouched.

```
evenOdd 10 · twoInstruments 10 · beatsBars 11 · halfBar 11 · registers 11
```

What #135 did **not** do: nothing read `music`, so none of it made a sound.
`vertical.js` had grown three stub functions (`detectEvenOddBeat`,
`mapVerticalToInstruments`, `mapHalfHourToNote`) that no page called and that
modelled no regrouping at all.

## Slice 1 — `grade2Music.js`, even/odd by ear + the two instruments (this PR)

- `src/lib/grade2Music.js`: the pure logic and the widget for the two
  activities the issue leads with, and the shared `phaseEvents` /
  `phaseNarration` the remaining slices reuse.
  - **זוגי או אי־זוגי בשמיעה** — pairs play strong/weak; a beat with no
    partner gets a third timbre, so "does the rhythm end on a full pair" is
    something you hear and not something you read.
  - **מאונך כשני כלים** — ones on a drum, tens on a bass. A carry is 10 drum
    hits collapsing into one bass note; a borrow is one bass note breaking
    into 10 drum hits. The column itself is reused from `vertical.js`.
- `banks.js`: those 20 items get `widget: 'g2'` and a `g2` spec. The three
  deferred activities keep their items and tags exactly as they were.
- `vertical.js`: the three stubs are gone; the module is display-only again.
- `index.html` / `sw.js`: the `g2` branch in `renderWidget`, the script tag,
  the cache entry, `CACHE` bumped to `v17`. `musicEngine.js` was being loaded
  three times (twice in `index.html`, three times in `sw.js`), which gave the
  page two copies of the shared `AudioContext`; now once.
- `curriculum.js`: the grade-ב rows that the bank already covered were still
  marked `gap`. `נפח תיבות` becomes its own honest `gap` row instead of a note
  on an otherwise-covered measurement row.

## Slice 2 — the remaining three activities (landed with slice 1 in #103)

Same module, same `g2` widget spec, same `.g3-*` CSS:

1. **כפולות: תיבות × פעמות** (`beatsBars`, 11 items) — `barsBeats(bars,
   perBar)`, accent on the first beat of each bar, and a sampled playback for
   long pieces (10 bars of 4/4 is 40 beats, too long to sit through). The
   items are tagged with the multiplication fact, which for one item ("קטע של
   10 תיבות 4/4") is not the meter, so `BARS` needs a `perBar` override.
   Narration must not state the product — that is the answer.
2. **חצי שעה = חצי תיבה** (`halfBar`, 11 items) — the first half of the bar
   plays strong and the second weak, linking תו חצי to חצי שעה. Narration
   stays structural: several items answer `2` or `30`.
3. **מספרים עד 1,000 בשלושה רגיסטרים** (`registers`, 11 items) — בס = מאות,
   פסנתר = עשרות, פעמון = יחידות. A register may be handed more than 9 on
   purpose (`12` tens → 523, and `9/9/10` → 1,000), so it regroups and the
   collapse is heard through `phaseEvents`.

Then `curriculum.js` can credit `grade2Music` on the כפולות and the חצאי שעות
rows, which this PR deliberately does not claim yet.

## Not verified in a browser

Agent worktrees run Node 18 and the repo has no dependencies, so Playwright
(needs Node 20+) never ran. The 360px pad-group overflow was found by
measuring the CSS by hand — a 10-pad regrouping group is 368px against the
284px of card content a 360px phone has — and fixed with `flex-wrap:wrap;
max-width:100%` on `.g3-bar`, asserted in `mobile.test.js`. The widget's DOM,
its ▶ button and its screen-reader line are covered by a fake document in
`test/grade2MusicWidget.test.js`. Real-device screenshots are still owed.
