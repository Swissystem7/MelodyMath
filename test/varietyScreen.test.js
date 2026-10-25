'use strict';
// Screen render and wiring tests for variety.js (WIRE-741, Refs #741, Refs #720).
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs'), path = require('node:path');
const variety = require('../src/lib/exercises/variety.js');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const swJs = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

test('renderVarietyHtml creates valid accessible variety badge with instrument, BPM and pattern', () => {
  const v = variety.generateVariant('multiplication', 0), html = variety.renderVarietyHtml(v);
  assert.match(html, /class="mm-variety-badge"/);
  assert.match(html, /data-bpm="\d+"/);
  assert.match(html, /data-instrument="/);
  assert.match(html, /BPM/);
  assert.ok(html.includes(v.instrumentHe || v.instrument));
});

test('mount() mounts onto container element, removes hidden class and renders variety badge', () => {
  const mockContainer = { innerHTML: '', classList: { classes: new Set(['hidden']), remove(c) { this.classes.delete(c); }, add(c) { this.classes.add(c); } } };
  const v = variety.mount(mockContainer, 'mm-cur-3', { roundIndex: 1 });
  assert.ok(v && mockContainer.innerHTML.includes('mm-variety-badge') && !mockContainer.classList.classes.has('hidden'));
});

test('nextPrev generates proper prompt and is distinct from subtraction (Task V1, Refs #665)', () => {
  const ex = variety.generateVariant('nextPrev', 0);
  assert.equal(ex.exerciseType, 'nextPrev');
  assert.notEqual(ex.exerciseType, 'subtraction');
  assert.match(ex.prompt, /עוקב|קודם/);
  assert.doesNotMatch(ex.prompt, / - | − /);
});

test('index.html and sw.js load and precache variety.js and wire #varietyBadge to screen', () => {
  assert.ok(indexHtml.includes('src/lib/exercises/variety.js') && indexHtml.includes('id="varietyBadge"'));
  assert.ok(indexHtml.includes('MM_VARIETY.mount') && swJs.includes("'./src/lib/exercises/variety.js'"));
});
