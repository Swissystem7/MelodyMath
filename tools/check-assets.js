#!/usr/bin/env node
// check:assets - every audio/image path the app code references must exist on disk.
// Scans the shipped code (root *.html, sw.js, manifest.webmanifest, src/**, pilot/*.html, pilot/js/**)
// for string literals that end in an audio or image extension and resolves them the way the browser
// would: relative to the page that loads the script (repo root, or pilot/ for pilot/js), or to the
// HTML file itself. A bare file name ('prompt_counting.wav') is joined to a base path at run time, so
// it only has to exist somewhere under sounds/ or icons/. Literal base folders such as
// 'sounds/voice/he/' (used to build paths at run time) must exist as directories.
// URLs, data: URIs and template strings with ${...} are skipped. Exit 1 on anything missing.
'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const EXT = '(?:mp3|wav|ogg|oga|m4a|aac|flac|png|svg|jpe?g|webp|gif|ico|avif)';
const ASSET_RE = new RegExp('([\'"`])([^\'"`\\s<>()]*\\.' + EXT + ')(?:[?#][^\'"`]*)?\\1', 'gi');
const BASE_DIR_RE = /(['"`])((?:\.\.?\/)*(?:sounds|icons|images|img|assets)\/[\w./-]*\/)\1/g;
const ASSET_DIRS = ['sounds', 'icons'];

function walk(dir, filter, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules') walk(full, filter, out);
    } else if (filter(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

function sources() {
  const top = fs.readdirSync(ROOT).filter((n) => n.endsWith('.html')).map((n) => path.join(ROOT, n));
  const pilotHtml = fs.existsSync(path.join(ROOT, 'pilot'))
    ? fs.readdirSync(path.join(ROOT, 'pilot')).filter((n) => n.endsWith('.html')).map((n) => path.join(ROOT, 'pilot', n))
    : [];
  const extra = ['sw.js', 'manifest.webmanifest'].map((n) => path.join(ROOT, n)).filter((f) => fs.existsSync(f));
  const js = (n) => n.endsWith('.js');
  return [...top, ...extra, ...pilotHtml, ...walk(path.join(ROOT, 'src'), js), ...walk(path.join(ROOT, 'pilot', 'js'), js)];
}

// the directory a relative path in this file is resolved against in the browser
function pageDir(file) {
  if (file.endsWith('.html')) return path.dirname(file);
  const rel = path.relative(ROOT, file).split(path.sep);
  return rel[0] === 'pilot' ? path.join(ROOT, 'pilot') : ROOT;
}

const byBasename = new Map();
for (const dir of ASSET_DIRS) {
  for (const f of walk(path.join(ROOT, dir), () => true)) byBasename.set(path.basename(f), f);
}

const missing = [];
let checked = 0;
const rel = (f) => path.relative(ROOT, f).split(path.sep).join('/');

for (const file of sources()) {
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines.forEach((line, i) => {
    const where = rel(file) + ':' + (i + 1);
    for (const m of line.matchAll(ASSET_RE)) {
      const ref = m[2];
      if (/^(https?:|\/\/|data:|blob:)/i.test(ref) || ref.includes('${') || /^\.\w+$/.test(ref)) continue;
      checked += 1;
      const clean = decodeURI(ref);
      if (!clean.includes('/')) {
        const local = path.join(pageDir(file), clean);
        if (!fs.existsSync(local) && !byBasename.has(clean)) missing.push(where + '  ' + ref + '  (no such file under ' + ASSET_DIRS.join('/, ') + '/)');
        continue;
      }
      const target = clean.startsWith('/') ? path.join(ROOT, clean) : path.join(pageDir(file), clean);
      const besideFile = path.join(path.dirname(file), clean);
      if (!fs.existsSync(target) && !fs.existsSync(besideFile)) missing.push(where + '  ' + ref + '  -> ' + rel(target));
    }
    for (const m of line.matchAll(BASE_DIR_RE)) {
      checked += 1;
      const target = path.join(pageDir(file), m[2]);
      if (!fs.existsSync(target)) missing.push(where + '  ' + m[2] + '  (base folder for run-time paths) -> ' + rel(target) + '/');
    }
  });
}

if (missing.length) {
  console.error('check:assets: ' + missing.length + ' of ' + checked + ' referenced asset paths are missing:');
  for (const m of missing) console.error('  ' + m);
  process.exitCode = 1;
} else {
  console.log('check:assets: all ' + checked + ' referenced asset paths exist');
}
