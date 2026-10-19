# PR #475 — merge resolution (Refs #476)

PR #475 (`issue-425-pace-ranges-15611752295098632013`) could not be merged: GitHub
reported conflicts with `master` and update-branch failed.

## Why it conflicted

Both sides branched from `b625e2a` and implemented the **same spec** — issue #425
(per-topic expected pace ranges with a source, plus one plain-Hebrew sentence per tab):

| | commit | files |
|---|---|---|
| `master` | `9fe6171` — "add topic pace ranges and tab descriptions to learner plan (#472)" | `learnerPlan.js`, `learnerPlanView.js`, `sefirot.css`, both tests |
| PR #475 | `5d87391` / `311336b` — "implement expected pace ranges and tab explanations" | `learnerPlan.js`, `learnerPlanView.js`, both tests, plus `issue.json` / `issue.txt` |

Every hunk of the PR lands in a region `#472` had already rewritten, so all four
shared files conflicted. The two implementations are not incompatible — they are
duplicates.

## Resolution

**`master`'s side wins in every file; nothing of the PR's intent is lost.** `#472`
is a strict superset of #475, item by item against the spec in the issue:

- `PACE` table — byte-identical in both (same 9 rows, same `הערכה` labels, same
  `Azaryahu et al. 2020` source). `#472` places it next to `HOOKS`, which is where
  the spec asked for it.
- `paceFor(topic)` — both do the `hookFor`-style fragment lookup with the
  `[3, 8, '—', 'הערכה']` default. The PR's version returned the *whole* 5-wide row
  on a hit but the 4-wide default on a miss, so `pace[4]` was `undefined` for any
  unlisted topic; `#472` returns a consistent 4-wide row.
- `weeksRange` / `paceSource` threaded through `pack()` — both. `#472` also threads
  `minutes` from the table instead of hard-coding `8`, and sets both fields on the
  error object so they are never `undefined`.
- `' טווח טיפוסי: … שבועות (…)'` appended to the adult sentence — both. `#472`
  escapes the two values separately and defaults them.
- `TAB_WHY` (7 strings) rendered as `<p class="mm-plan-why">` in every slot — both.
  `#472` adds an `esc()` for the text, exports `TAB_WHY` so tests can assert on it,
  and styles the line from `src/sefirot.css` with the `--muted` token; the PR used an
  inline `style="color: var(--muted)"` attribute instead.
- Progress bar on `--confidence` (the spec's design note) — only `#472`.
- Tests — `#472`'s `learnerPlanView` test mounts the view against a fake DOM and
  asserts each slot's rendered `innerHTML`; the PR's asserted a regex over the
  source file. Both `learnerPlan` assertions (`'4–8'` / `'הערכה'`, non-empty source
  per row, `טווח טיפוסי` in the HTML) exist on `master`.

**Dropped:** `issue.json` and `issue.txt` — a dump of the GitHub issue committed by
accident at the repo root. They are build-agent scratch, not part of the PR's intent.

That makes the merged content equal to `master`, so **PR #475 should be closed as
superseded by #472** rather than merged.

## What this branch still changes

Reviewing the two sides against each other surfaced one defect in the landed `#472`
code, fixed here:

- `renderLearnerPlanHtml` appended the typical-range sentence unconditionally, so the
  error card read `בחרו כיתה א׳ עד ו׳. טווח טיפוסי: — שבועות (הערכה).` — a pace claim
  glued onto a "pick a grade" message, with no topic behind it. The range is now
  emitted only for a real plan (`p.ok !== false && p.topic`), and
  `test/learnerPlan.test.js` asserts the error card carries neither `טווח טיפוסי` nor
  `הערכה` while a grade-ג׳ card still carries both.
- `paceFor` now documents that it returns the row *without* its topic fragment, which
  is the off-by-one the PR's own test walked into.

Suite: 688 tests, 0 fail, 1 skip (the Playwright mobile spec).
