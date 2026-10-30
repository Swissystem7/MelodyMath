# PR #848 split — part 1 of 2

split from #848. Refs #848, Refs #665.

## Merge order

1. **Part 1 (this branch)**: `MM_JAM.dragToTarget` plus its test. Merge it first.
2. **Part 2**: the dragPlace exercise. It calls `MM_JAM.dragToTarget`, so it
   needs part 1. Part 2 does not edit `jamKit.js`, so it should apply cleanly
   on top of part 1.

#848 stays open and unchanged. It is the source for part 2, and should be
closed only after part 1 and part 2 have both landed.

## In part 1 (from #848)

| #848 file | hunks |
|---|---|
| `src/components/jamKit.js` | all 3 hunks, byte-identical to #848 (blob `7cafe2a`): the header comment line, `DRAG_MIN` + `dragToTarget()`, and the two new exports |

New in part 1 (not part of #848): `test/jamKitDrag.test.js`, 8 tests of the
helper on its own.

Part 1 has no caller on master yet. `index.html` and `sw.js` already load
`jamKit.js`, so the cache version does not change.

## Left for part 2 (from #848)

| #848 file | hunks |
|---|---|
| `src/lib/music/dragPlace.js` | the whole new file: build and pick specs, `boxValue`, `noteFor`, two-family `voicesFor`, `sound`, `mount` |
| `index.html` | the `MM_DRAG_PLACE` branch in `renderWidget`, and the `dragPlace.js` script tag |
| `src/components/jam.css` | the `.dp-*` rules |
| `sw.js` | the `CACHE` bump (v30 → v31) and the `dragPlace.js` asset |
| `test/dragPlace.test.js` | all of #848's tests |

The split brief also listed "the 220Hz fix (was 110Hz)", "the hint without
numbers" and "the near-miss wrong options". None of these is in #848's diff:
the only "110" in it is an expected answer (100 + 10), not a frequency.
Nothing of that kind exists to carry over.

## The rules, for what part 1 includes

- **The answer box never fills in the number for the child.** The helper only
  calls `onDrop(target)` and never writes a value. Test: `dragToTarget never
  writes an answer`.
- **Fast taps never play overlapping sounds.** The helper makes no sound, and
  one gesture is only one action: the click that ends a drag is ignored
  exactly once. Tests: the "trailing click" and "plain tap" tests.
- **A wrong answer never moves the child forward.** A drop beside the target
  calls nothing. Test: `a wrong drop never moves the child forward`.
- **At least 2 instrument families.** Part 1 adds no sound. This rule belongs
  to dragPlace's `voicesFor` in part 2, which #848 tests under "at least 2
  instrument families".

Follow-up from review, not a blocker for part 1: before part 2's UI ships,
handle a second finger (or a re-render) in the middle of a drag, so the ghost
cannot be left on screen.
