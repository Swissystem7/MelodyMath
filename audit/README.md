# audit/: MM-701 regression suite

A self-contained Playwright suite that encodes the MM-701 audit ([docs/MM-700/audit.md](../docs/MM-700/audit.md)) and the measurable curriculum gaps ([docs/MM-700/curriculum-gaps.md](../docs/MM-700/curriculum-gaps.md)). Tasks are in [docs/MM-700/work-plan.md](../docs/MM-700/work-plan.md).

It has its own `package.json` and lockfile. It is **not** part of the repo's `npm test` (`node --test` only picks up `*.test.js` and `test/` files; this folder has neither) and **not** in CI.

## Run

```sh
cd audit
npm ci
npx playwright install chromium   # once, if Chromium for Playwright 1.49.1 is not installed
npx playwright test               # desktop (1280×800) + phone360 (360×740)
npx playwright test --project=desktop
npx playwright test --project=phone360
```

- **Default target: the local build of this repo.** `serve.js` serves the repo root on `http://127.0.0.1:8171/` (no dependencies; `AUDIT_PORT` changes the port). Every request to another host is aborted in `specs/_fixtures.js`, so runs are deterministic and nothing is sent anywhere.
- **Live site (optional):** `AUDIT_BASE_URL=https://swissystem7.github.io/MelodyMath/ npx playwright test` (PowerShell: `$env:AUDIT_BASE_URL='https://swissystem7.github.io/MelodyMath/'; npx playwright test`). No local server is started, and only that host is allowed.
- **Live link check (optional):** `AUDIT_CHECK_LINKS=1` enables the network check of the contact-form link (skipped by default).

## How known bugs work

Every open finding is a test that describes the **fixed** app, marked with `test.fail()`, titled `[finding][task] …`, for example `[B1][MM-711] the student start button is within the first two screens`.

- Today the assertion fails, `test.fail()` expects that, and the run is **green**.
- When a task fixes the bug, Playwright reports `expected to fail, but passed` and the run goes **red**. That is the signal: the fixing PR removes the `test.fail()` line, and the test then guards the fix.
- `[…][MM-100]` tests are in the MM-100 area (lessons, clock, QR). They are reported only, until Antigravity finishes MM-100.

## Files

| File | What |
|---|---|
| `playwright.config.js` | Projects `desktop` and `phone360`; local server or `AUDIT_BASE_URL`. |
| `serve.js` | Static server for the repo root, bound to 127.0.0.1. |
| `specs/_fixtures.js` | Outside-network blocking, error collection, quick-start helpers. |
| `specs/smoke.spec.js` | What works today (must stay green): pages, tabs, adult gate, deep link, PWA manifest, offline, saved progress. |
| `specs/known-bugs.spec.js` | Open findings for MM-711…MM-720. |
| `specs/phone.spec.js` | Phone-only checks (phone360 project only). |
| `specs/mm100.spec.js` | MM-100 area findings (blocked). |
| `specs/curriculum.spec.js` | Curriculum thresholds on the shipped bank (desktop only). |
