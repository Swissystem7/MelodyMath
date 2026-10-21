#!/usr/bin/env node
// Re-checks every quote in src/lib/curriculum.js against the official
// Ministry PDF of its grade (#525). Needs network and `pdftotext` (poppler).
//   node tools/verify-curriculum-quotes.js
// Exit 1 if a quote is not in its PDF; rows without a quote are listed as
// 'לא אומת'. Whitespace and bidi marks are ignored on both sides.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const cur = require('../src/lib/curriculum');

const norm = (s) => s.replace(/[‎‏‪-‮]/g, '').replace(/\s+/g, '');

(async function main() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-cur-'));
  const text = {};
  for (const g of cur.grades()) {
    const url = cur.officialPdf(g);
    const res = await fetch(url);
    if (!res.ok) throw new Error(url + ' → HTTP ' + res.status);
    const pdf = path.join(dir, g.charCodeAt(0) + '.pdf');
    fs.writeFileSync(pdf, Buffer.from(await res.arrayBuffer()));
    execFileSync('pdftotext', ['-enc', 'UTF-8', pdf, pdf + '.txt']);
    text[g] = norm(fs.readFileSync(pdf + '.txt', 'utf8'));
  }
  let bad = 0;
  for (const r of cur.coverageMatrix()) {
    if (!r.verified) { console.log('לא אומת  ' + r.grade + '׳ ' + r.topic); continue; }
    if (!text[r.grade].includes(norm(r.quote))) { bad += 1; console.log('MISSING  ' + r.grade + '׳ ' + r.quote); }
  }
  console.log(bad ? bad + ' quote(s) not found' : 'all quotes found in the official PDFs');
  process.exit(bad ? 1 : 0);
})().catch((e) => { console.error(e.message); process.exit(1); });
