'use strict';
// check:sw - every URL in the service worker precache list must exist on disk.
// A missing file makes cache.addAll() reject, so the offline install fails (or, where the
// worker swallows the error, the app silently is not cached). Paths resolve against the
// worker's own folder, which is its scope; './' and other folder URLs need an index.html.
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const WORKERS = [{ file: 'sw.js', list: 'ASSETS' }];

function listOf(source, name) {
  const m = new RegExp('(?:const|let|var)\\s+' + name + '\\s*=\\s*\\[([\\s\\S]*?)\\]').exec(source);
  if (!m) return null;
  const body = m[1].replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:])\/\/.*$/gm, '$1');
  return [...body.matchAll(/'([^']*)'|"([^"]*)"|`([^`$]*)`/g)].map((x) => x[1] ?? x[2] ?? x[3]);
}

let missing = 0;
let total = 0;
for (const w of WORKERS) {
  const swPath = path.join(ROOT, w.file);
  const urls = listOf(fs.readFileSync(swPath, 'utf8'), w.list);
  if (!urls) {
    console.error('check:sw: ' + w.file + ' has no ' + w.list + ' = [...] list');
    process.exitCode = 1;
    continue;
  }
  const scope = path.dirname(swPath);
  let bad = 0;
  for (const url of urls) {
    if (/^([a-z][a-z0-9+.-]*:|\/\/)/i.test(url)) continue; // cross-origin entries are not files here
    const clean = decodeURI(url.split(/[?#]/)[0]);
    let target = clean.startsWith('/') ? path.join(ROOT, clean) : path.join(scope, clean);
    if (clean === '' || clean.endsWith('/') || (fs.existsSync(target) && fs.statSync(target).isDirectory())) target = path.join(target, 'index.html');
    if (!fs.existsSync(target)) {
      console.error('  MISSING  ' + w.file + '  ' + url + '  -> ' + path.relative(ROOT, target));
      bad += 1;
    }
  }
  total += urls.length;
  missing += bad;
  console.log('check:sw: ' + w.file + ' (' + w.list + '): ' + urls.length + ' URL(s), ' + bad + ' missing');
}
if (missing) process.exitCode = 1;
