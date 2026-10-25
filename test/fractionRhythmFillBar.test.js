// Refs #665: fractions as rhythm — the EXISTING fillBar (M3 note lengths in a
// 4/4 bar) is the single fraction method from mm-cur-32 onward. The child taps
// whole / half / quarter notes to fill the bar; no second fraction method is
// created, and decimalToBarFraction is left alone (its >1 fix is PR #713).
const test = require('node:test');
const assert = require('node:assert/strict');

const banks = require('../src/lib/banks');
const fb = require('../src/lib/music/fractionBar');
const PAD = require('../src/components/FractionBarPad.js');

const GRADE_FILES = {
  'ד': require('../src/lib/curriculum/grade4'),
  'ה': require('../src/lib/curriculum/grade5'),
  'ו': require('../src/lib/curriculum/grade6'),
};
// Fraction standards whose topics start at mm-cur-32 (note values as parts of
// a 4/4 bar) and build on it: ד׳ fractions, ה׳ fraction models/equivalence/
// quantity/addition/mixed, ו׳ fraction multiplication/division and laws.
const FRACTION_KEYS = {
  'ד': ['FRAC_BAR', 'FRAC_OF_QTY', 'FRAC_NAMES', 'FRAC_ADD_D', 'FRAC_MIXED_D'],
  'ה': ['FRAC_EQUIV', 'FRAC_ADD', 'FRAC_OF', 'FRAC_MIXED', 'FRAC_MODELS'],
  'ו': ['FRAC_MUL', 'FRAC_DIV', 'G6_MIXED', 'G6_FRAC_LAWS', 'G6_FRAC_PART', 'G6_FRAC_EST'],
};

test('fillBar is the only primary fraction method from mm-cur-32 onward', () => {
  Object.entries(FRACTION_KEYS).forEach(([grade, keys]) => {
    const file = GRADE_FILES[grade];
    keys.forEach((key) => {
      const ways = file.music[key];
      assert.ok(ways, grade + ' ' + key + ' has ways');
      const primary = banks.primaryWays(ways);
      assert.deepEqual(primary.map((w) => w[0]), ['fillBar'], grade + ' ' + key + ': single primary method is fillBar');
      assert.equal(banks.mechanismOf('fillBar'), 'M3', grade + ' ' + key);
      ways.filter((w) => w[0] !== 'fillBar').forEach((w) => {
        assert.ok(banks.isOptionalWay(w), grade + ' ' + key + ': ' + w[0] + ' stays optional extra practice, not a second method');
      });
    });
  });
});

test('every non-activity fraction item from mm-cur-32 onward is solved with fillBar', () => {
  Object.entries(FRACTION_KEYS).forEach(([grade, keys]) => {
    const standards = new Set(keys.map((k) => banks.ST[k]).filter(Boolean));
    const mine = banks.itemsForGrade(grade).filter((it) => standards.has(it.standard) && it.musicNote);
    assert.ok(mine.length > 0, grade + ' fraction way items exist');
    mine.forEach((it) => assert.equal(it.music, 'fillBar', it.id + ' ' + it.standard));
  });
});

test('no second fraction method tag is introduced for fraction items', () => {
  const tags = new Set();
  Object.entries(FRACTION_KEYS).forEach(([grade, keys]) => {
    const standards = new Set(keys.map((k) => banks.ST[k]).filter(Boolean));
    banks.itemsForGrade(grade)
      .filter((it) => standards.has(it.standard) && it.musicNote)
      .forEach((it) => tags.add(it.music));
  });
  assert.deepEqual([...tags], ['fillBar']);
});

test('the child fills a whole bar by tapping whole, half and quarter notes', () => {
  const tapAll = (state, ids) => ids.reduce((s, id) => PAD.tapTile(s, id), state);
  // A dedicated whole/half/quarter exercise ships on the existing pad.
  const idx = PAD.EXERCISES.findIndex((ex) => ex.target === '1'
    && ex.allowed.includes('whole') && ex.allowed.includes('half') && ex.allowed.includes('quarter')
    && ex.allowed.every((id) => ['whole', 'half', 'quarter'].includes(id)));
  assert.ok(idx >= 0, 'an exercise using only whole/half/quarter tiles exists');
  assert.equal(tapAll(PAD.createState(idx), ['whole']).status, 'exact');
  assert.equal(tapAll(PAD.createState(idx), ['half', 'quarter', 'quarter']).status, 'exact');
  assert.equal(tapAll(PAD.createState(idx), ['half', 'half']).status, 'exact');
  const over = tapAll(PAD.createState(idx), ['half', 'quarter', 'half']);
  assert.equal(over.status, 'over');
  assert.deepEqual(over.fill, ['1/2', '1/4'], 'the overflowing half note is refused');
  assert.equal(tapAll(PAD.createState(idx), ['quarter', 'quarter', 'quarter', 'quarter']).status, 'exact');
});

test('decimalToBarFraction handles values above one bar per PR #723 (Refs #665)', () => {
  assert.equal(fb.decimalToBarFraction(0.25), '1/4');
  assert.equal(fb.decimalToBarFraction(0.5), '1/2');
  assert.equal(fb.decimalToBarFraction(1), '1');
  assert.equal(fb.decimalToBarFraction(1.5), '3/2');
});

test('estimation prompt and acceptance logic are consistent: 7/8 is filled exactly to show almost a whole bar', () => {
  const tapAll = (state, ids) => ids.reduce((s, id) => PAD.tapTile(s, id), state);
  const estWay = GRADE_FILES['ו'].music.G6_FRAC_EST.find((w) => w[0] === 'fillBar');
  assert.ok(estWay, 'fillBar way exists in G6_FRAC_EST');
  assert.match(estWay[1], /בדיוק/, 'prompt specifies exact fill to match screen acceptance logic');
  assert.match(estWay[1], /7\/8/, 'prompt specifies 7/8 fill');
  assert.equal(estWay[3], 'D', 'evidence level is unified as D');

  const idx = PAD.EXERCISES.findIndex((ex) => ex.target === '7/8');
  assert.ok(idx >= 0, 'an exercise for 7/8 almost-whole estimation exists');
  const ex = PAD.EXERCISES[idx];
  assert.match(ex.he, /בדיוק/, 'exercise prompt specifies exact fill');
  assert.match(ex.he, /7\/8/, 'exercise specifies 7/8');

  // Exact fill of 7/8 (half + quarter + eighth) is accepted with cadence
  const s = tapAll(PAD.createState(idx), ['half', 'quarter', 'eighth']);
  assert.equal(s.status, 'exact');
  assert.equal(s.sound, 'cadence');
  assert.match(s.message, /התיבה מלאה בדיוק/);

  // Partial fill is under (screen accepts only exact fill)
  const partial = tapAll(PAD.createState(idx), ['half', 'quarter']);
  assert.equal(partial.status, 'filling');
  const checked = PAD.check(partial);
  assert.equal(checked.status, 'under');
  assert.match(checked.message, /חסר 1\/8/);
});
