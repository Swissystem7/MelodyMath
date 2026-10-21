#!/usr/bin/env node
// Runs e2e/smoke.spec.js against the live Pages site once per deploy and opens
// (or comments on) a GitHub issue when it fails (#419).
//
// There are no GitHub Actions in this repo (AGENTS.md), so this runs on the
// factory machine instead, from a scheduled task every 15 minutes:
//
//   node tools/e2e-live.js            test the latest deploy if it is new
//   node tools/e2e-live.js --force    test it even if it was already tested
//   node tools/e2e-live.js --dry-run  test, but print the issue instead of filing it
//
// It asks GitHub for the latest Pages build, waits while one is in progress,
// and remembers the last tested commit in ~/.melodymath-e2e-live.json.
// Playwright is installed into a cache folder outside the repo, never into
// package.json. Needs Node 22+, gh (logged in) and network.
'use strict';
const { execFileSync, spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const REPO = 'Swissystem7/MelodyMath';
const SITE = 'https://swissystem7.github.io/MelodyMath/';
const TITLE = '[E2E] האתר החי נכשל בבדיקת smoke';
const STATE = path.join(os.homedir(), '.melodymath-e2e-live.json');
const CACHE = path.join(os.tmpdir(), 'melodymath-e2e');
const PW = '@playwright/test@1';
const WIN = process.platform === 'win32';
const root = path.join(__dirname, '..');
const args = new Set(process.argv.slice(2));

function gh(argv) {
  return execFileSync('gh', argv, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
}

function readState() {
  try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch (e) { return {}; }
}

function run(cmd, argv, opts) {
  const r = spawnSync(cmd, argv, { encoding: 'utf8', shell: WIN, maxBuffer: 64 << 20, ...opts });
  return { code: r.status, out: (r.stdout || '') + (r.stderr || '') };
}

function installPlaywright() {
  const cli = path.join(CACHE, 'node_modules', '@playwright', 'test', 'cli.js');
  if (!fs.existsSync(cli)) {
    fs.mkdirSync(CACHE, { recursive: true });
    const r = run('npm', ['install', '--no-save', '--no-audit', '--no-fund', '--prefix', CACHE, PW]);
    if (r.code !== 0) throw new Error('npm install ' + PW + ' failed:\n' + r.out);
  }
  const r = run(process.execPath, [cli, 'install', 'chromium'], { shell: false });
  if (r.code !== 0) throw new Error('playwright install chromium failed:\n' + r.out);
  return cli;
}

function smoke(cli) {
  const env = { ...process.env, NO_COLOR: '1', NODE_PATH: path.join(CACHE, 'node_modules'), MM_BASE_URL: SITE };
  delete env.FORCE_COLOR;
  return run(process.execPath, [cli, 'test', '--config', path.join('e2e', 'live.config.js')], {
    cwd: root,
    shell: false,
    // The spec's require('@playwright/test') resolves from the cache folder.
    env,
  });
}

function report(build, out) {
  const tail = out.trim().split('\n').filter((l) => !/^\((node:\d+|Use `node)/.test(l)).slice(-80).join('\n');
  const body = [
    'בדיקת ה-smoke על האתר החי נכשלה אחרי deploy.',
    '',
    '- אתר: ' + SITE,
    '- commit: ' + build.commit,
    '- deploy: ' + (build.updated_at || build.created_at || '?'),
    '',
    'הרצה חוזרת: `node tools/e2e-live.js --force`',
    '',
    '```',
    tail.replace(/```/g, "'''"),
    '```',
  ].join('\n');
  if (args.has('--dry-run')) { console.log(TITLE + '\n\n' + body); return; }
  const open = JSON.parse(gh(['issue', 'list', '-R', REPO, '--state', 'open',
    '--search', 'in:title "' + TITLE + '"', '--json', 'number,title']))
    .filter((i) => i.title === TITLE);
  if (open.length) {
    gh(['issue', 'comment', String(open[0].number), '-R', REPO, '--body', body]);
    console.log('commented on #' + open[0].number);
    return;
  }
  const create = ['issue', 'create', '-R', REPO, '--title', TITLE, '--body', body];
  let url;
  // WORKPLAN.md: a failing scenario goes to factory:claude with priority:top.
  try { url = gh(create.concat(['--label', 'factory:claude', '--label', 'priority:top'])); }
  catch (e) { url = gh(create); }
  console.log('opened ' + url.trim());
}

function main() {
  const build = JSON.parse(gh(['api', 'repos/' + REPO + '/pages/builds/latest']));
  if (build.status !== 'built') {
    console.log('Pages build is ' + build.status + '; will check on the next run.');
    return 0;
  }
  const state = readState();
  if (!args.has('--force') && state.commit === build.commit) {
    console.log('Deploy ' + build.commit.slice(0, 7) + ' already tested (' + state.result + ').');
    return 0;
  }
  const r = smoke(installPlaywright());
  process.stdout.write(r.out);
  const result = r.code === 0 ? 'pass' : 'fail';
  if (result === 'fail') report(build, r.out);
  if (!args.has('--dry-run')) {
    fs.writeFileSync(STATE, JSON.stringify({ commit: build.commit, result, at: new Date().toISOString() }, null, 2));
  }
  return r.code === 0 ? 0 : 1;
}

process.exitCode = main();
