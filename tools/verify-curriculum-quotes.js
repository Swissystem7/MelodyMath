#!/usr/bin/env node
// Re-checks every quote in src/lib/curriculum.js against the official
// Ministry PDF of its grade (#525). Needs network and `pdftotext` (poppler).
//   node tools/verify-curriculum-quotes.js
// Exit 1 if a quote is not in its PDF; rows without a quote are listed as
// 'לא אומת'. Whitespace and bidi marks are ignored on both sides. Also checks
// OFFICIAL_ORDER: each row sits on the page where its quote first appears,
// and the pages never go back.
//
// The program pages are two-column tables. pdftotext prints them one line
// per column in turn, so a quote that wraps inside its cell comes out with a
// line of the other column between its parts (#591). findQuote accepts that:
// the words of the quote, in order, on one page, broken in at most MAX_SPLITS
// places with at most MAX_GAP characters of other text at each break.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const MAX_SPLITS = 3;
const MAX_GAP = 160;
const BIDI = new RegExp('[' + String.fromCharCode(0x200e, 0x200f, 0x202a) + '-' + String.fromCharCode(0x202e)
  + String.fromCharCode(0x2066) + '-' + String.fromCharCode(0x2069) + ']', 'g');
const norm = (s) => s.replace(BIDI, '').replace(/\s+/g, '');

// Words of `quote` from position `from` of page text `t` (one normalised
// line per text line); returns the end of the match or -1. A line break
// inside the quote is free. Otherwise a part may only resume at the start
// of a later line, at most MAX_GAP characters on, using one of `splits`.
function matchWords(t, words, i, from, splits) {
  if (i === words.length) return from;
  const next = t[from] === '\n' ? from + 1 : from;
  if (t.startsWith(words[i], next)) {
    const end = matchWords(t, words, i + 1, next + words[i].length, splits);
    if (end !== -1) return end;
  }
  if (splits === 0) return -1;
  for (let at = t.indexOf('\n' + words[i], from); at !== -1 && at - from <= MAX_GAP; at = t.indexOf('\n' + words[i], at + 1)) {
    const end = matchWords(t, words, i + 1, at + 1 + words[i].length, splits - 1);
    if (end !== -1) return end;
  }
  return -1;
}

// Text of one pdftotext page: whitespace and bidi marks dropped, line
// breaks kept.
const pageText = (s) => s.split(/\r?\n/).map(norm).filter(Boolean).join('\n');

// pages: pageText of each page. Returns the 1-based page of the first exact
// match, else of the first match split across columns, else 0.
function findQuote(pages, quote) {
  const words = quote.split(/\s+/).map(norm).filter(Boolean);
  if (!words.length) return 0;
  for (const splits of [0, MAX_SPLITS]) {
    for (let p = 0; p < pages.length; p++) {
      const t = pages[p];
      for (let at = t.indexOf(words[0]); at !== -1; at = t.indexOf(words[0], at + 1)) {
        if (matchWords(t, words, 1, at + words[0].length, splits) !== -1) return p + 1;
      }
    }
  }
  return 0;
}

async function main() {
  const cur = require('../src/lib/curriculum');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'mm-cur-'));
  const pages = {};
  for (const g of cur.grades()) {
    const url = cur.officialPdf(g);
    const res = await fetch(url);
    if (!res.ok) throw new Error(url + ' → HTTP ' + res.status);
    const pdf = path.join(dir, g.charCodeAt(0) + '.pdf');
    const body = Buffer.from(await res.arrayBuffer());
    // A blocked or redirected download can still answer 200 with an HTML
    // page; every quote of that grade would then show as MISSING (#591).
    if (body.subarray(0, 5).toString('latin1') !== '%PDF-') {
      throw new Error(url + ' → not a PDF (' + body.length + ' bytes): the download failed, no quote was checked');
    }
    fs.writeFileSync(pdf, body);
    execFileSync('pdftotext', ['-enc', 'UTF-8', pdf, pdf + '.txt']);
    pages[g] = fs.readFileSync(pdf + '.txt', 'utf8').split(String.fromCharCode(12)).map(pageText);
    const chars = pages[g].join('').length;
    if (chars < 1000) throw new Error(url + ' → pdftotext gave ' + chars + ' characters, no quote was checked');
  }
  let bad = 0;
  for (const r of cur.coverageMatrix()) {
    if (!r.verified) { console.log('לא אומת  ' + r.grade + '׳ ' + r.topic); continue; }
    if (!findQuote(pages[r.grade], r.quote)) { bad += 1; console.log('MISSING  ' + r.grade + '׳ ' + r.quote); }
  }
  // A row kept in a per-grade file also lists its sub-items verbatim.
  for (const r of cur.MATRIX) {
    for (const b of r.bullets || []) {
      if (!findQuote(pages[r.grade], b)) { bad += 1; console.log('MISSING  ' + r.grade + '׳ ' + b); }
    }
  }
  for (const g of Object.keys(cur.OFFICIAL_ORDER)) {
    let last = 0;
    for (const [topic, page] of cur.OFFICIAL_ORDER[g]) {
      const onPage = findQuote(pages[g], cur.MATRIX.find((r) => r.grade === g && r.topic === topic).quote);
      // Within one page the two columns are interleaved, so only the page
      // order is checked.
      if (onPage !== page || page < last) { bad += 1; console.log('ORDER    ' + g + '׳ ' + topic + ' → page ' + onPage); }
      last = page;
    }
  }
  console.log(bad ? bad + ' quote(s) not found' : 'all quotes found in the official PDFs');
  process.exit(bad ? 1 : 0);
}

module.exports = { findQuote, pageText };

if (require.main === module) main().catch((e) => { console.error(e.message); process.exit(1); });
