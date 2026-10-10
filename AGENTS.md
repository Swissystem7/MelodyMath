# Notes for coding agents

- **One test-only workflow, nothing else.** `.github/workflows/test.yml` runs `node --test` on every PR and on `master` (see `test/honesty.test.js` and the README). Do not add other workflows, deploy steps or secrets. Run `npm test` (Node 22+, no install) locally too.
- No dependencies, bundler or CDN: plain files loaded from `index.html`.
- Before opening a PR, check the open PR list for the same file and fix; many factory branches touch `src/lib/teacherStore.js`.
