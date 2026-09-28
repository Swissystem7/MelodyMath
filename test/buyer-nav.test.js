const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const core = require('../src/lib/core');
const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('the nav a teacher sees on elementary and offer pages carries only the elementary product', () => {
  for (const here of ['index.html', 'curriculum.html', 'offer.html', 'landing.html', '']) {
    const html = core.siteNavHtml(here);
    assert.match(html, /href="index\.html"/, here);
    assert.match(html, /href="curriculum\.html"/, here);
    assert.match(html, /href="offer\.html"/, here);
    assert.doesNotMatch(html, /functions\.html|807\.html/, here);
  }
});

test('the sonification pages keep their own nav and a way back', () => {
  for (const here of ['functions.html', '807.html']) {
    const html = core.siteNavHtml(here);
    assert.match(html, /href="functions\.html"/);
    assert.match(html, /href="807\.html"/);
    assert.match(html, /href="index\.html"/);
    assert.match(html, /aria-current="page"/);
  }
});

test('home has no developer lab tab and no sonification card', () => {
  assert.doesNotMatch(index, /data-tab="playground"|id="playground"|מעבדה · לא שיעור/);
  assert.doesNotMatch(index, /class="navcard" href="landing\.html"/);
  const tabs = index.match(/<button[^>]*role="tab"[^>]*>/g) || [];
  assert.equal(tabs.length, 5);
});
