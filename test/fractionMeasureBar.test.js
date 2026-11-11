const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const {
  PARTITIONS,
  DENOMINATORS,
  SUPPORTED_DENOMINATORS,
  getPartition,
  renderMeasureBarHtml,
  validateMeasureConfig
} = require('../src/lib/music/fractionMeasureBar.js');

test('1 part (whole measure / שלם, 4 beats, Hebrew label)', () => {
  const p = getPartition(1);
  assert.equal(p.totalParts, 1);
  assert.equal(p.parts[0].beats, 4);
  assert.match(p.parts[0].label, /שלם/);
  assert.equal(PARTITIONS[1].he, 'שלם');
});

test('2 parts (halves / חצאים, 2 beats each, Hebrew label)', () => {
  const p = getPartition(2);
  assert.equal(p.totalParts, 2);
  assert.equal(p.parts[0].beats, 2);
  assert.equal(p.parts[1].beats, 2);
  assert.match(p.parts[0].label, /חצי/);
  assert.equal(PARTITIONS[2].he, 'חצי תיבה');
});

test('4 parts (quarters / רבעים, 1 beat each, Hebrew label)', () => {
  const p = getPartition(4);
  assert.equal(p.totalParts, 4);
  p.parts.forEach((part) => {
    assert.equal(part.beats, 1);
    assert.match(part.label, /רבע/);
  });
  assert.equal(PARTITIONS[4].he, 'רבע תיבה');
});

test('8 parts (eighths / שמיניות, 0.5 beats each, Hebrew label)', () => {
  const p = getPartition(8);
  assert.equal(p.totalParts, 8);
  p.parts.forEach((part) => {
    assert.equal(part.beats, 0.5);
    assert.match(part.label, /שמינית/);
  });
  assert.equal(PARTITIONS[8].he, 'שמינית תיבה');
});

test('active parts marking by numeric count', () => {
  const p = getPartition(4, 3);
  assert.equal(p.activeParts, 3);
  assert.equal(p.activeBeats, 3);
  assert.deepEqual(p.parts.map((x) => x.active), [true, true, true, false]);
});

test('active parts marking by index array', () => {
  const p = getPartition(4, [1, 3]);
  assert.equal(p.activeParts, 2);
  assert.equal(p.activeBeats, 2);
  assert.deepEqual(p.parts.map((x) => x.active), [false, true, false, true]);
});

test('all parts active (full fill)', () => {
  const p = getPartition(4, 4);
  assert.equal(p.activeParts, 4);
  assert.equal(p.activeBeats, 4);
  assert.ok(p.parts.every((part) => part.active));
});

test('zero parts active (empty bar)', () => {
  const p = getPartition(8, 0);
  assert.equal(p.activeParts, 0);
  assert.equal(p.activeBeats, 0);
  assert.ok(p.parts.every((part) => !part.active));
});

test('container has role="group"', () => {
  const html = renderMeasureBarHtml({ denominator: 4, activeCount: 2 });
  assert.match(html, /<div[^>]+role="group"/);
});

test('container has Hebrew aria-label describing the measure and active fill', () => {
  const html = renderMeasureBarHtml({ denominator: 4, activeCount: 2 });
  assert.match(html, /aria-label="[^"]*סרגל שברים תיבת 4\/4[^"]*2 מתוך 4[^"]*"/);
});

test('individual blocks have Hebrew aria-label indicating block fraction and index', () => {
  const html = renderMeasureBarHtml({ denominator: 4, activeCount: 1 });
  assert.match(html, /aria-label="רבע תיבה 1 מתוך 4/);
  assert.match(html, /aria-label="רבע תיבה 2 מתוך 4/);
});

test('blocks receive distinct color/theme tokens per denomination', () => {
  const tokens = SUPPORTED_DENOMINATORS.map((d) => PARTITIONS[d].color);
  const classes = SUPPORTED_DENOMINATORS.map((d) => PARTITIONS[d].colorClass);
  assert.equal(new Set(tokens).size, 4);
  assert.equal(new Set(classes).size, 4);
  const html8 = renderMeasureBarHtml(8);
  assert.match(html8, /bar-part-eighth/);
});

test('safe handling of invalid denominator (falls back to safe default or validates gracefully)', () => {
  const cfg = validateMeasureConfig({ denominator: 16 });
  assert.equal(cfg.valid, false);
  assert.equal(cfg.denominator, 4);
  const p = getPartition(12, 2);
  assert.equal(p.denominator, 4);
  assert.equal(p.totalParts, 4);
});

test('active count clamped between 0 and total parts', () => {
  const over = validateMeasureConfig({ denominator: 4, activeCount: 99 });
  assert.equal(over.activeCount, 4);
  const under = validateMeasureConfig({ denominator: 4, activeCount: -5 });
  assert.equal(under.activeCount, 0);
});

test('total sum of beats across all parts in any valid partition equals exactly 4', () => {
  SUPPORTED_DENOMINATORS.forEach((d) => {
    const p = getPartition(d);
    const sum = p.parts.reduce((acc, part) => acc + part.beats, 0);
    assert.equal(sum, 4, `Denominator ${d} must total 4 beats`);
  });
});

test('module exports properly for CommonJS and browser environments', () => {
  const api = require('../src/lib/music/fractionMeasureBar.js');
  assert.equal(typeof api.getPartition, 'function');
  assert.equal(typeof api.renderMeasureBarHtml, 'function');
  assert.ok(api.DENOMINATORS && api.PARTITIONS);

  const code = fs.readFileSync(path.join(__dirname, '../src/lib/music/fractionMeasureBar.js'), 'utf8');
  const context = { globalThis: {} };
  context.globalThis = context;
  vm.createContext(context);
  vm.runInContext(code, context);
  assert.ok(context.MM_FRACTION_MEASURE_BAR);
  assert.equal(typeof context.MM_FRACTION_MEASURE_BAR.renderMeasureBarHtml, 'function');
});
