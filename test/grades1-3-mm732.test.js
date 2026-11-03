// MM-732 (stream B): grade א׳ length (mm-cur-9) and coins (mm-cur-11) from 6
// to at least 12 items each, every level present (gap G2 in
// docs/MM-700/curriculum-gaps.md, PR #951). Official side: Newprogramgrade1.pdf
// p. 11 (length) and p. 3 (money), via MM-501 (PR #949) and curriculum.js.
// The items live in curriculum/grade1.js `lateItems` and ship once banks.js
// appends late items (handoff in the PR); until then the ships tests are todo.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const cur = require('../src/lib/curriculum');
const measure = require('../src/lib/measure');
const g1 = require('../src/lib/curriculum/grade1');

const KEYS = Array.from({ length: 12 }, (_, i) => 73201 + i);
const late = g1.lateItems.filter((x) => KEYS.includes((x[6] || {}).key));
const ofStd = (k) => late.filter((x) => x[5] === k);
const TOPIC = { LENGTH: 'mm-cur-9', MONEY: 'mm-cur-11' };
const ROW = { LENGTH: /^מדידת אורך/, MONEY: /^כסף/ };

const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const leaks = (text, answer) => new RegExp('(^|[^0-9])' + escape(answer) + '([^0-9]|$)').test(String(text || ''));
const bankLevels = (topicId, withoutLate) => {
  const c = { 1: 0, 2: 0, 3: 0 };
  const items = banks.allItems().filter((it) => !withoutLate || !KEYS.includes(+it.id.split('-').pop()));
  cur.itemsForTopic(topicId, items).forEach((it) => { c[it.level] += 1; });
  return c;
};

test('grade1.js carries 6 MM-732 length and 6 coin items; with the bank, each topic reaches 12 with 4 per level', () => {
  assert.equal(late.length, 12);
  assert.deepEqual(late.map((x) => x[6].key), KEYS);
  ['LENGTH', 'MONEY'].forEach((k) => {
    assert.equal(ofStd(k).length, 6, k);
    const before = bankLevels(TOPIC[k], true);
    const total = { 1: before[1], 2: before[2], 3: before[3] };
    ofStd(k).forEach((x) => { total[x[4]] += 1; });
    assert.deepEqual(total, { 1: 4, 2: 4, 3: 4 }, k + ' per level after MM-732');
  });
});

test('every MM-732 item is a grade א׳ measurement item on the verified length or money row', () => {
  late.forEach((x) => {
    assert.equal(x[0], 'measurement', x[6].key);
    const s = cur.sectionForItem({ grade: 'א', standard: banks.ST[x[5]] });
    assert.ok(s.verified, x[6].key);
    assert.match(s.topic, ROW[x[5]], x[6].key);
    assert.match(s.url, /Newprogramgrade1\.pdf$/);
  });
});

test('length items show a ruler, and none asks for the length the ruler prints', () => {
  ofStd('LENGTH').forEach(([, prompt, answer, , , , e]) => {
    assert.equal(e.widget, 'ruler', e.key);
    const html = measure.renderRulerHtml(e.ruler);
    assert.match(html, /class="ruler"/);
    assert.ok(e.ruler.length >= 1 && e.ruler.length <= 20, e.key);
    assert.notEqual(answer, e.ruler.length, e.key + ' asks one step beyond reading the ruler');
    assert.ok(!leaks(html, answer), e.key + ' ruler shows ' + answer);
  });
  const by = (key) => late.find((x) => x[6].key === key);
  const len = (key) => by(key)[6].ruler.length;
  assert.equal(by(73201)[2], len(73201) + 2);
  assert.equal(by(73202)[2], len(73202) - 1);
  assert.equal(by(73203)[2], len(73203) + 3);
  assert.equal(by(73204)[2], len(73204) / 2);
  assert.equal(by(73205)[2], len(73205) * 2);
  assert.equal(by(73206)[2], 20 - len(73206));
});

test('coin answers add up', () => {
  const by = (key) => late.find((x) => x[6].key === key)[2];
  assert.equal(by(73207), measure.coinsTotal([[1, 2], [2, 1]]));
  assert.equal(by(73208), measure.coinsTotal([[5, 1], [1, 1]]));
  assert.equal(by(73209), measure.coinsTotal([[5, 2], [2, 1]]));
  assert.equal(by(73210), 10 / 5);
  assert.equal(by(73211), measure.coinsTotal([[10, 1], [5, 1], [1, 1]]));
  assert.equal(by(73212), 10 - 6);
});

test('no MM-732 item gives its answer away in the prompt, the hint or a music way of its standard', () => {
  late.forEach(([, prompt, answer, hint, , st, { key }]) => {
    assert.ok(!leaks(prompt, answer), key + ' prompt');
    assert.ok(!leaks(hint, answer), key + ' hint');
    g1.music[st].forEach((w) => assert.ok(!leaks(w[1], answer), key + ' music note ' + w[0]));
  });
  const lateIds = new Set(g1.lateItems.map((x) => 'א-' + x[0] + '-' + x[6].key));
  const prompts = banks.itemsForGrade('א').filter((it) => !lateIds.has(it.id)).map((it) => it.prompt);
  late.forEach((x) => assert.ok(!prompts.includes(x[1]), x[6].key + ' is not already in the bank'));
});

test('one primary music way per topic: cmNote (M3) for length, coinGroups (M2) for coins', () => {
  assert.deepEqual(banks.primaryWays(g1.music.LENGTH).map(([t]) => t), ['cmNote']);
  assert.deepEqual(banks.primaryWays(g1.music.MONEY).map(([t]) => t), ['coinGroups']);
  assert.equal(banks.mechanismOf('cmNote'), 'M3');
  assert.equal(banks.mechanismOf('coinGroups'), 'M2');
  late.forEach((x) => assert.ok(!x[6].hear, x[6].key + ': no counted-beats cue'));
});

// ---------- once banks.js appends late items (handoff to the banks.js owner) ----------
const shipped = banks.allItems().filter((it) => it.grade === 'א' && KEYS.includes(+it.id.split('-').pop()));
const waiting = shipped.length ? false : 'awaiting the banks.js late-items hook (stream B PR handoff)';

test('MM-732 items ship: mm-cur-9 and mm-cur-11 have ≥12 items with every level present', { todo: waiting }, () => {
  assert.equal(shipped.length, 12);
  ['mm-cur-9', 'mm-cur-11'].forEach((id) => {
    const l = bankLevels(id);
    assert.ok(l[1] + l[2] + l[3] >= 12, id);
    assert.ok(Math.min(l[1], l[2], l[3]) > 0, id);
  });
  shipped.forEach((it) => {
    assert.ok(banks.isShippable(it), it.id);
    assert.equal(it.music, it.standard === banks.ST.LENGTH ? 'cmNote' : 'coinGroups', it.id);
    assert.ok(!leaks(it.musicNote, it.answer), it.id);
    if (it.standard === banks.ST.LENGTH) assert.equal(it.widget, 'ruler', it.id);
  });
});

test('prompts and hints stay within the 15-word card limit (#665)', () => {
  const { countWords } = require('../src/lib/exercises/patternAndWorkedExample.js');
  late.forEach((x) => {
    assert.ok(countWords(x[1]) <= 15, x[6].key + ' prompt ' + countWords(x[1]));
    assert.ok(countWords(x[3]) <= 15, x[6].key + ' hint ' + countWords(x[3]));
  });
});
