// Refs #665 (6): the product covers grades א׳–ו׳, so no child- or teacher-visible
// text may still say א׳–ד׳ — not the shared nav, not any page, not the trial one-pager.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const core = require('../src/lib/core.js');
const offer = require('../src/lib/offer.js');
const banks = require('../src/lib/banks.js');

const root = path.join(__dirname, '..');
const OLD_RANGE = /א׳–ד׳/;
const PAGES = ['index.html', 'program.html', 'curriculum.html', 'landing.html',
  'offer.html', 'functions.html', '807.html', 'frequency.html'];

// Drop every closed <!-- ... --> span by scanning (no regex replace, CodeQL
// js/incomplete-multi-character-sanitization); an unclosed <!-- is kept and checked.
function stripComments(html) {
  let out = '';
  let i = 0;
  for (;;) {
    const start = html.indexOf('<!--', i);
    if (start === -1) return out + html.slice(i);
    const end = html.indexOf('-->', start + 4);
    if (end === -1) return out + html.slice(i);
    out += html.slice(i, start);
    i = end + 3;
  }
}

test('the shared nav says תרגול א׳–ו׳ and links home on every page', () => {
  for (const here of [''].concat(PAGES)) {
    const html = core.siteNavHtml(here);
    assert.doesNotMatch(html, OLD_RANGE, 'nav on ' + (here || '(none)'));
    assert.ok(html.includes('תרגול א׳–ו׳'), 'nav label on ' + (here || '(none)'));
    assert.match(html, /href="index\.html"/, 'home link on ' + (here || '(none)'));
  }
});

test('no visible page still claims the old range א׳–ד׳', () => {
  for (const page of PAGES) {
    const raw = fs.readFileSync(path.join(root, page), 'utf8');
    const visible = stripComments(raw);
    assert.doesNotMatch(visible, OLD_RANGE, page);
  }
});

test('the trial one-pager facts carry no א׳–ד׳', () => {
  const f = offer.onePagerFacts();
  const text = [f.titleHe, f.askHe].concat(f.whatHe, f.notHe).join('\n');
  assert.doesNotMatch(text, OLD_RANGE);
  assert.ok(text.includes('א׳–ו׳'));
});

test('the home where the range is picked still offers ה׳ and ו׳', () => {
  const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(index, /id="gradePick"/);
  assert.match(index, /<script src="src\/lib\/banks\.js"><\/script>/);
  assert.match(index, /box\.innerHTML=GRADES\.map/);
  for (const g of ['ה', 'ו']) assert.ok(banks.GRADES.includes(g), 'GRADES has ' + g);
});
