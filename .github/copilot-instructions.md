# Copilot instructions for MelodyMath

## Stack
Primary language: JavaScript. Top-level files: .gitignore, 807.html, AGENTS.md, LICENSE, MONETIZATION.md, README.md, RESEARCH.md, curriculum.html, docs, functions.html, icons, index.html, landing.html, manifest.webmanifest, offer.html, package.json, src, sw.js, test. Dependencies: .

## Build / test / lint
- Install: `npm ci` (or `npm install`)
- `npm run test` -> node --test
Always run the relevant checks above before opening a PR and report results in the PR body.

## Conventions
- Keep changes small and focused: one issue = one Draft PR.
- Branch prefix: `copilot/`. Never push to `master` and never merge.
- Follow existing code style and folder structure; don't add new dependencies without explaining why.
- Never commit secrets, tokens, or .env files.
- Write or update tests when changing logic; update README when behavior changes.