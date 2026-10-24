#!/usr/bin/env node
// Re-checks every quote in src/lib/curriculum/oldProgram.js against the 2006
// (תשס"ו) Ministry programme PDFs, kita<n>.pdf, on the page it names (#591).
// Also checks the תשפ"ז notice that ד׳–ו׳ still learn by that programme.
// Needs network and `pdftotext` (poppler).
//   node tools/verify-old-program-quotes.js
// Exit 1 if a quote is not on its page. Whitespace and bidi marks are ignored.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const old = require('../src/lib/curriculum/oldProgram');

const norm = (s) => s.replace(/[‎‏‪-‮]/g, '').replace(/\s+/g, '');
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-old-'));

async function pages(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(url + ' → HTTP ' + res.status);
  const body = Buffer.from(await res.arrayBuffer());
  if (body.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw new Error(url + ' → not a PDF (' + body.length + ' bytes): the download failed, no quote was checked');
  }
  const pdf = path.join(dir, path.basename(new URL(url).pathname));
  fs.writeFileSync(pdf, body);
  execFileSync('pdftotext', ['-enc', 'UTF-8', pdf, pdf + '.txt']);
  return fs.readFileSync(pdf + '.txt', 'utf8').split('\f').map(norm);
}

(async function main() {
  const cache = {};
  const get = async (url) => (cache[url] = cache[url] || await pages(url));
  let bad = 0;
  const check = async (url, page, quote, label) => {
    const p = (await get(url))[page - 1] || '';
    if (!p.includes(norm(quote))) { bad += 1; console.log('MISSING  ' + label + ' p.' + page + ' ' + quote); }
  };
  await check(old.STILL_OLD_PDF, old.STILL_OLD_PAGE, old.STILL_OLD_QUOTE, 'תשפ"ז');
  for (const q of old.allQuotes()) {
    await check(old.pdfUrl(q.grade), q.page, q.quote, q.grade + '׳ ' + (q.topic || '(old only)'));
  }
  old.MAP.filter((r) => r.unverified).forEach((r) => console.log(old.UNVERIFIED_HE + '  ' + r.grade + '׳ ' + r.topic));
  console.log(bad ? bad + ' quote(s) not found' : 'all ' + old.allQuotes().length + ' quotes found in the 2006 programme PDFs');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e.message); process.exit(1); });
