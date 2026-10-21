#!/usr/bin/env node
// Server-side checks on the live Pages site before a demo (#360). No browser:
// e2e/smoke.spec.js (through tools/e2e-live.js) covers console errors and the
// UI clicks; this covers what plain HTTP can see.
//
//   node tools/live-check.js                 check the live site against origin/master
//   node tools/live-check.js --base <url>    check another deploy (trailing slash)
//   node tools/live-check.js --ref <ref>     compare sizes against another ref
//
// 1. Every page answers 200.
// 2. Every local <script src>, <link href>, <a href> and <img src> on those
//    pages answers 200 (same origin only; outside links are not fetched).
// 3. The walkthrough video (#355): demo.html is linked from index and any
//    YouTube embed in it answers 200.
// 4. Live byte sizes vs the ref for the files the demo depends on, to see
//    whether the deploy is still behind (#358).
//
// Prints a Markdown table to paste into the issue. Exits 1 on any failure.
// Needs Node 22+ (global fetch), git and network.
'use strict';
const { execFileSync } = require('node:child_process');
const path = require('node:path');

const PAGES = ['index.html', 'curriculum.html', 'offer.html', 'landing.html', 'frequency.html', 'demo.html'];
const SIZE_FILES = ['src/lib/grade1Music.js', 'src/lib/banks.js', 'src/lib/curriculum.js', 'index.html'];

// Local paths referenced by src/href attributes, without query or hash,
// resolved against the page's own path. Outside URLs, anchors, mailto: and
// data: are left out.
function localRefs(html, pagePath) {
  const dir = path.posix.dirname('/' + (pagePath || 'index.html'));
  const out = new Set();
  const re = /\s(?:src|href)\s*=\s*["']([^"']*)["']/gi;
  let m;
  while ((m = re.exec(html))) {
    const raw = m[1].trim();
    if (!raw || raw[0] === '#' || /^([a-z][a-z0-9+.-]*:|\/\/)/i.test(raw)) continue;
    const clean = raw.split(/[?#]/)[0];
    if (!clean) continue;
    const abs = clean[0] === '/' ? clean : path.posix.join(dir, clean);
    out.add(abs.replace(/^\/+/, '') || 'index.html');
  }
  return [...out].sort();
}

function youtubeEmbeds(html) {
  const re = /<iframe[^>]*\ssrc\s*=\s*["']((?:https?:)?\/\/(?:www\.)?(?:youtube\.com|youtube-nocookie\.com)\/embed\/[^"']+)["']/gi;
  const out = [];
  let m;
  while ((m = re.exec(html))) out.push(m[1].startsWith('//') ? 'https:' + m[1] : m[1]);
  return out;
}

// Live vs ref bytes -> a row verdict. Pages serves the bytes as committed,
// so any difference means the deploy is not the ref.
function sizeVerdict(live, ref) {
  if (live == null) return 'חסר באתר';
  if (ref == null) return 'חסר ב־ref';
  if (live === ref) return 'זהה';
  return live < ref ? 'האתר מאחור (' + (ref - live) + ' בתים)' : 'האתר שונה (+' + (live - ref) + ' בתים)';
}

function row(cells) { return '| ' + cells.map((c) => String(c).replace(/\|/g, '\\|')).join(' | ') + ' |'; }

async function get(url) {
  try {
    const r = await fetch(url, { redirect: 'follow' });
    const buf = Buffer.from(await r.arrayBuffer());
    return { status: r.status, body: buf };
  } catch (e) {
    return { status: 'ERR ' + (e.cause && e.cause.code || e.message), body: null };
  }
}

function gitSize(ref, file) {
  try {
    return Number(execFileSync('git', ['cat-file', '-s', ref + ':' + file],
      { cwd: path.join(__dirname, '..'), encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim());
  } catch (e) { return null; }
}

// Which of the ref's last commits touching `file` holds exactly these bytes,
// so "behind" reads as "deploy is at <sha>", not just a byte count.
function matchingCommit(ref, file, body) {
  const git = (argv, input) => execFileSync('git', argv,
    { cwd: path.join(__dirname, '..'), encoding: 'utf8', input, stdio: ['pipe', 'pipe', 'ignore'] }).trim();
  try {
    const blob = git(['hash-object', '--stdin'], body);
    for (const line of git(['log', '-30', '--format=%h %ci', ref, '--', file]).split('\n')) {
      const sha = line.split(' ')[0];
      if (sha && git(['rev-parse', sha + ':' + file]) === blob) return line.slice(0, 24);
    }
  } catch (e) { /* not a git checkout, or file not in ref */ }
  return null;
}

async function main(argv) {
  const opt = (name, def) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : def; };
  const base = opt('--base', 'https://swissystem7.github.io/MelodyMath/');
  const ref = opt('--ref', 'origin/master');
  const lines = [];
  let failed = 0;
  const check = (what, target, ok, detail) => {
    if (!ok) failed++;
    lines.push(row([what, target, ok ? '✅' : '❌', detail]));
  };

  const pages = {};
  for (const p of PAGES) {
    const r = await get(base + p);
    pages[p] = r.status === 200 ? r.body.toString('utf8') : null;
    check('דף', p, r.status === 200, r.status);
  }

  const assets = new Map();
  for (const p of PAGES) {
    if (pages[p] == null) continue;
    for (const a of localRefs(pages[p], p)) {
      if (!assets.has(a)) assets.set(a, []);
      assets.get(a).push(p);
    }
  }
  const broken = [];
  for (const [a, from] of assets) {
    const r = await get(base + a);
    if (r.status !== 200) broken.push(a + ' (' + r.status + ', מ־' + from.join(', ') + ')');
  }
  check('קבצים ולינקים מקומיים', assets.size + ' נתיבים', broken.length === 0,
    broken.length ? broken.join('; ') : 'כולם 200');

  // The «צפו בסרטון» link is added at runtime by onboard.js, not in index.html.
  const index = pages['index.html'] || '';
  const onboard = await get(base + 'src/lib/onboard.js');
  const linked = localRefs(index, 'index.html').includes('demo.html')
    || (onboard.status === 200 && onboard.body.toString('utf8').includes('href="demo.html"'));
  check('סרטון הדגמה', 'קישור «צפו בסרטון» ל־demo.html', linked && pages['demo.html'] != null,
    (linked ? 'יש קישור' : 'אין קישור ב־index/onboard.js') + ', demo.html ' + (pages['demo.html'] == null ? 'לא נטען' : 'נטען'));
  for (const url of youtubeEmbeds((pages['demo.html'] || '') + index)) {
    const r = await get(url);
    check('סרטון הדגמה', url, r.status === 200, r.status);
  }

  for (const f of SIZE_FILES) {
    const r = await get(base + f);
    const live = r.status === 200 ? r.body.length : null;
    const want = gitSize(ref, f);
    const verdict = sizeVerdict(live, want);
    const at = live != null && verdict !== 'זהה' ? matchingCommit(ref, f, r.body) : null;
    check('גודל מול ' + ref, f, verdict === 'זהה', (live == null ? r.status : live) + ' / ' + want + ' — ' + verdict
      + (at ? '; האתר תואם ל־' + at : ''));
  }

  console.log('בדיקת שרת ל־' + base + ' (' + new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC)\n');
  console.log(row(['בדיקה', 'יעד', 'תוצאה', 'פירוט']));
  console.log(row(['---', '---', '---', '---']));
  console.log(lines.join('\n'));
  console.log('\n' + (failed ? failed + ' כשלים.' : 'הכול עבר.'));
  return failed ? 1 : 0;
}

if (require.main === module) main(process.argv.slice(2)).then((c) => { process.exitCode = c; });

module.exports = { localRefs, youtubeEmbeds, sizeVerdict };
