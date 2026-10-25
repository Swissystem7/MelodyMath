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

test('own exercise types (missing_addend) keep their prompt and answer after variation (Refs #741)', () => {
  const ex = variety.generateVariant({ id: 'x', exerciseType: 'missing_addend', prompt: '3 + ? = 7', answer: 4 }, 2);
  assert.equal(ex.exerciseType, 'missing_addend');
  assert.equal(ex.prompt, '3 + ? = 7');
  assert.equal(ex.answer, 4);
});

test('fractions only use parts that split a 4/4 bar evenly, never thirds or fifths (Refs #741)', () => {
  for (let r = 0; r < 12; r++) for (const g of ['א', 'ד']) assert.ok([2, 4, 8].includes(Number(variety.generateNumberSet('fractions', r, [], g, 'fractions').b)));
});

test('last round of a topic is a check without music (Refs #665)', () => {
  assert.equal(variety.generateVariant('addition', 3, { totalRounds: 5 }).hasMusic, true);
  const last = variety.generateVariant('addition', 4, { totalRounds: 5 });
  assert.equal(last.hasMusic, false);
  assert.match(variety.renderVarietyHtml(last), /בלי מוזיקה/);
});
