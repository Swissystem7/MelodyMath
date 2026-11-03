// MM-731 (stream B): grade א׳ whole tens (mm-cur-4) gets basis and
// intermediate entry items, so the topic no longer opens at challenge level
// (gap G9 in docs/MM-700/curriculum-gaps.md, PR #951). Official side:
// Newprogramgrade1.pdf p. 8 «חיבור וחיסור בעשרות שלמות», via MM-501 (PR #949)
// and curriculum.js. The items live in curriculum/grade1.js `lateItems`; they
// ship once banks.js appends late items (handoff in the PR). Until then the
// "ships" tests are todo, and the data tests below already guard the items.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const cur = require('../src/lib/curriculum');
const prog = require('../src/lib/curriculum/progression');
const g1 = require('../src/lib/curriculum/grade1');

const KEYS = Array.from({ length: 12 }, (_, i) => 73101 + i);
const late = g1.lateItems.filter((x) => KEYS.includes((x[6] || {}).key));
const at = (lv) => late.filter((x) => x[4] === lv);

const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const leaks = (text, answer) => new RegExp('(^|[^0-9])' + escape(answer) + '([^0-9]|$)').test(String(text || ''));

test('grade1.js carries 12 MM-731 late items: 6 basis and 6 intermediate, both skills at each level', () => {
  assert.equal(late.length, 12);
  assert.equal(at(1).length, 6);
  assert.equal(at(2).length, 6);
  ['addition', 'subtraction'].forEach((skill) => [1, 2].forEach((lv) => {
    assert.ok(at(lv).filter((x) => x[0] === skill).length >= 3, skill + ' level ' + lv);
  }));
});

test('late item keys are stable, well formed and unique', () => {
  const keys = g1.lateItems.map((x) => (x[6] || {}).key);
  // task × 100 + n: numeric like every other id, far above any RAW index.
  keys.forEach((k) => assert.ok(Number.isInteger(k) && k >= 73100 && k < 74900, String(k)));
  assert.equal(new Set(keys).size, keys.length);
  assert.deepEqual(late.map((x) => x[6].key), KEYS);
});

test('every MM-731 item is tagged to the verified whole-tens row of the official programme', () => {
  late.forEach((x) => {
    assert.equal(x[5], 'TENS', x[6].key);
    const s = cur.sectionForItem({ grade: 'א', standard: banks.ST[x[5]] });
    assert.ok(s.verified, x[6].key);
    assert.equal(s.topic, 'חיבור וחיסור בעשרות שלמות עד 100');
    assert.match(s.url, /Newprogramgrade1\.pdf$/);
  });
});

test('answers are whole tens from 10 to 100 and match the numbers in the prompt', () => {
  late.forEach(([, prompt, answer, , , , { key }]) => {
    assert.equal(typeof answer, 'number', key);
    assert.ok(answer >= 10 && answer <= 100 && answer % 10 === 0, key + ': ' + answer);
    const m = /^(\d+) ([+−]) (\d+) = \?$/.exec(prompt);
    if (m) assert.equal(answer, m[2] === '+' ? +m[1] + +m[3] : +m[1] - +m[3], key);
  });
  const ask = (re) => late.find((x) => re.test(x[1]))[2];
  assert.equal(ask(/^תוף מדגיש/), 10 + 10);
  assert.equal(ask(/^2 תיבות/), 2 * 10 + 10);
  assert.equal(ask(/^ניגנו 30/), 30 - 10);
  assert.equal(ask(/^3 תיבות/), 3 * 10 + 4 * 10);
  assert.equal(ask(/^ניגנו 90/), 90 - 5 * 10);
});

test('no MM-731 item gives its answer away in the prompt, the hint or any music way of the topic', () => {
  const notes = g1.music.TENS.map((w) => w[1]);
  late.forEach(([, prompt, answer, hint, , , { key }]) => {
    assert.ok(!leaks(prompt, answer), key + ' prompt');
    assert.ok(!leaks(hint, answer), key + ' hint');
    notes.forEach((n) => assert.ok(!leaks(n, answer), key + ' music note'));
  });
  const lateIds = new Set(g1.lateItems.map((x) => 'א-' + x[0] + '-' + x[6].key));
  const prompts = banks.itemsForGrade('א').filter((it) => !lateIds.has(it.id)).map((it) => it.prompt);
  late.forEach((x) => assert.ok(!prompts.includes(x[1]), x[6].key + ' is not already in the bank'));
});

test('whole tens is learned through one music way: accentTens (M2, strongly evidenced)', () => {
  assert.deepEqual(banks.primaryWays(g1.music.TENS).map(([tag]) => tag), ['accentTens']);
  assert.equal(banks.mechanismOf('accentTens'), 'M2');
  assert.ok(banks.MUSIC_DOSAGE.primary.includes('M2'));
  late.forEach((x) => assert.ok(!(x[6] && x[6].hear), x[6].key + ': no counted-beats cue, so the topic keeps one way'));
});

test('whole tens keeps its place in the progression: after the hundred chart, before two-digit addition', () => {
  const links = prog.linksForTopic('mm-cur-4');
  assert.ok(links.prereq.includes('mm-cur-5'));
  assert.ok(links.buildsTo.includes('mm-cur-14'));
});

// ---------- once banks.js appends late items (handoff to the banks.js owner) ----------
const shipped = banks.allItems().filter((it) => it.grade === 'א' && KEYS.includes(+it.id.split('-').pop()));
const waiting = shipped.length ? false : 'awaiting the banks.js late-items hook (stream B PR handoff)';

test('MM-731 items ship: mm-cur-4 has ≥4 basis and ≥4 intermediate items and keeps its 9 challenge items', { todo: waiting }, () => {
  const topic = cur.itemsForTopic('mm-cur-4', banks.allItems());
  const n = (lv) => topic.filter((it) => it.level === lv).length;
  assert.equal(shipped.length, 12);
  assert.ok(n(1) >= 4 && n(2) >= 4, JSON.stringify([n(1), n(2)]));
  assert.equal(n(3), 9);
  shipped.forEach((it) => {
    assert.ok(banks.isShippable(it), it.id);
    assert.equal(it.music, 'accentTens', it.id);
    assert.equal(it.musicSrc, 'das2023', it.id);
    assert.ok(!leaks(it.musicNote, it.answer), it.id);
  });
});

test('MM-731 items ship without moving any existing id or the diagnostic', { todo: waiting }, () => {
  assert.equal(shipped.length, 12);
  assert.deepEqual(cur.itemsForTopic('mm-cur-4', banks.allItems()).filter((it) => it.level === 3).map((it) => it.id), [
    'א-addition-68', 'א-addition-69', 'א-addition-70', 'א-addition-71', 'א-addition-72',
    'א-subtraction-101', 'א-subtraction-102', 'א-subtraction-103', 'א-subtraction-104',
  ]);
  assert.deepEqual(banks.diagnosticItems('א').map((it) => it.id).slice(2, 6),
    ['א-addition-35', 'א-addition-50', 'א-subtraction-73', 'א-subtraction-86']);
  assert.ok(banks.allItems().some((it) => it.id === 'ב-place_value-1295'), 'the last item before the late ones keeps its id');
});
