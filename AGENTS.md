# Notes for coding agents

- **מדיניות מיזוג (חובה).** הענף הראשי ( או ) מוגן. אסור למזג PRs ישירות ואסור לדחוף ישירות אליו. פתח PR מענף לולאה ( או ) או dependabot. הלולאות לא ממזגות בעצמן. המיזוג האוטומטי בשרת ( דרך ) רץ רק כאשר סוקר ה-pre-PR ( — Gemini או מודל אחר השונה מהמחבר) אישר בלי בעיות חוסמות, וכל בדיקות GitHub כולל  ירוקות על ה-head הנוכחי, וה-PR הוא MERGEABLE בלי קונפליקט. אין להמתין לאישור מיזוג ידני נוסף. (כלל אבירן 22.11.2026 08:13.)
- **עיצוב.** Build UI minimal and functional; never wait for designs; approved Claude Design packages are applied later as polish.
- **CI.** `.github/workflows/ci.yml` runs `npm ci && npm test` with coverage on pull requests and on push to `master` (`test/honesty.test.js`). CodeQL is a separate check. Still run `npm test` locally (Node 22+) before pushing. There are no app dependencies.
- No dependencies, bundler or CDN: plain files loaded from `index.html`.
- Before opening a PR, check the open PR list for the same file and fix; many factory branches touch `src/lib/teacherStore.js`.
- **Asked to split a PR because it is over `auto_merger`'s 400-line ceiling?** Run `node tools/pr-size.js <branch> [base]` first. A branch stacked on another branch that landed as a squash is counted twice, so the displayed size can be a lie — the fix there is `git merge origin/main` into the branch, not a split (`docs/PR-305-SPLIT.md`). If the branch was cut from a *different* integration branch than the PR targets (`master` vs `main`), pass that as a fourth argument — `node tools/pr-size.js <branch> origin/main 400 origin/master` — and the fix is retargeting the PR, not a split (`docs/PR-342-SPLIT.md`). And if the report's `כבר ביעד (תוכן זהה)` line accounts for most of the displayed size, the target already holds those files byte for byte and merging adds nothing — close the PR instead of splitting it (`docs/PR-370-SUPERSEDED.md`).

## Cursor Cloud specific instructions

- Nothing to install. `npm test` is `node --test` and needs Node 22+, already on the login-shell PATH. Do not add workflows beyond `.github/workflows/ci.yml` (guard tests enforce this).
- On boot the repo is served at `http://127.0.0.1:8080/` (`python3 -m http.server`). Open `index.html` for elementary practice and `functions.html` for graph sonification. Starting again is a no-op when that URL already responds.
- `SENTRY_DSN` and `CODECOV_TOKEN` are optional. Pages and `npm test` run without them.
