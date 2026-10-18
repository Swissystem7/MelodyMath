# Notes for coding agents

- **No GitHub Actions.** `.github/workflows/` must not exist (see `test/honesty.test.js` and the README). The only PR check is CodeQL, so it will not catch a broken test — run `npm test` (Node 22+, no install) before pushing.
- No dependencies, bundler or CDN: plain files loaded from `index.html`.
- Before opening a PR, check the open PR list for the same file and fix; many factory branches touch `src/lib/teacherStore.js`.
- **Asked to split a PR because it is over `auto_merger`'s 400-line ceiling?** Run `node tools/pr-size.js <branch> [base]` first. A branch stacked on another branch that landed as a squash is counted twice, so the displayed size can be a lie — the fix there is `git merge origin/main` into the branch, not a split (`docs/PR-305-SPLIT.md`). If the branch was cut from a *different* integration branch than the PR targets (`master` vs `main`), pass that as a fourth argument — `node tools/pr-size.js <branch> origin/main 400 origin/master` — and the fix is retargeting the PR, not a split (`docs/PR-342-SPLIT.md`).
