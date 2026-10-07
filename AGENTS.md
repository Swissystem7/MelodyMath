# Notes for coding agents

- **No GitHub Actions.** `.github/workflows/` must not exist (see `test/honesty.test.js` and the README). The only PR check is CodeQL, so it will not catch a broken test — run `npm test` (Node 22+, no install) before pushing.
- No dependencies, bundler or CDN: plain files loaded from `index.html`.
- Before opening a PR, check the open PR list for the same file and fix; many factory branches touch `src/lib/teacherStore.js`.
