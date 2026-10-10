# Notes for coding agents

- **GitHub Actions: one test-only workflow, nothing else.** `.github/workflows/test.yml` runs `node --test` on every PR; `test/honesty.test.js` keeps it minimal (single job, read-only, no secrets, no deploy) and rejects any other workflow file. Still run `npm test` (Node 22+, no install) before pushing — do not use CI as your first test run.
- No dependencies, bundler or CDN: plain files loaded from `index.html`.
- Before opening a PR, check the open PR list for the same file and fix; many factory branches touch `src/lib/teacherStore.js`.
