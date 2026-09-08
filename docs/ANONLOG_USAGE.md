# anonLog wiring — MelodyMath UI

**Prerequisite:** `src/lib/anonLog.js` is **not** on clean `master`. Apply **`MelodyMath-partb.patch` first** (adds `src/lib/anonLog.js` + `test/anonLog.test.js`). This doc only explains how the UI should call that module after partb lands.

## What to log

Anonymous practice events only: time, exercise, accuracy. **No PII** (no name, email, phone, national id, class roster keys).

Allowed fields after strip (see `stripPii` / `normalizeEvent`):

- `exerciseId` — short exercise key (string, ≤64)
- `correct` — boolean
- `durationMs` — non-negative ms
- `ts` — epoch ms (optional; defaulted)

## How the UI should call it

After partb, load `src/lib/anonLog.js` (UMD: browser global or `require`).

```js
// After a practice attempt finishes (example):
anonLog.record({
  exerciseId: currentExercise.id, // e.g. 'add-3'
  correct: attempt.ok === true,
  durationMs: attempt.elapsedMs,
});

// Teacher / export view (aggregates only):
const rows = anonLog.exportEvents(); // no PII keys
```

Do **not** pass student names, emails, or free-text notes into `record`. Extra keys matching name/email/phone/address/tz/id are dropped (except `exerciseId`).

## Checklist

- [ ] `MelodyMath-partb.patch` applied so `src/lib/anonLog.js` exists
- [ ] Practice UI calls `record` with `exerciseId` + accuracy/timing only
- [ ] No PII fields in localStorage key `mm-anon-log-v1`
