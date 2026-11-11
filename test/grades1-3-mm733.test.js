// MM-733 (stream B): grade א׳ whole-hour clock (mm-cur-10) from 6 to 12
// items, every level present (gap G2 in docs/MM-700/curriculum-gaps.md, PR
// #951). Official side: Newprogramgrade1.pdf p. 12, via MM-501 (PR #949).
// Items: curriculum/grade1.js lateItems, shipped by the banks.js hook.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const cur = require('../src/lib/curriculum');
const measure = require('../src/lib/measure');
const g1 = require('../src/lib/curriculum/grade1');
const { countWords } = require('../src/lib/exercises/patternAndWorkedExample.js');

const KEYS = Array.from({ length: 6 }, (_, i) => 73301 + i);
const late = g1.lateItems.filter((x) => KEYS.includes((x[6] || {}).key));
const shipped = banks.allItems().filter((it) => it.grade === 'א' && KEYS.includes(+it.id.split('-').pop()));
const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const leaks = (text, answer) => new RegExp('(^|[^0-9])' + escape(answer) + '([^0-9]|$)').test(String(text || ''));
const shift = (hour, d) => ((((hour - 1 + d) % 12) + 12) % 12) + 1;

test('mm-cur-10 has 12 items, 4 per level, on the verified whole-hour clock row', () => {
  assert.equal(late.length, 6);
  assert.equal(shipped.length, 6);
  const c = { 1: 0, 2: 0, 3: 0 };
  cur.itemsForTopic('mm-cur-10', banks.allItems()).forEach((it) => { c[it.level] += 1; });
  assert.deepEqual(c, { 1: 4, 2: 4, 3: 4 });
  shipped.forEach((it) => {
    assert.ok(banks.isShippable(it), it.id);
    assert.equal(it.standard, banks.ST.CLOCK, it.id);
    assert.equal(it.widget, 'clock', it.id);
    assert.ok(cur.sectionForItem(it).verified, it.id);
    assert.match(cur.sectionForItem(it).url, /Newprogramgrade1\.pdf$/);
  });
});

test('answers are whole hours counted around the clock face from the hour shown', () => {
  const by = (k) => late.find((x) => x[6].key === k);
  const h = (k) => by(k)[6].clock.hour;
  assert.equal(by(73301)[2], shift(h(73301), 1));
  assert.equal(by(73302)[2], shift(h(73302), -1));
  assert.equal(by(73303)[2], shift(h(73303), 2));
  assert.equal(by(73304)[2], shift(h(73304), 2));
  assert.equal(by(73305)[2], shift(h(73305), -3));
  assert.equal(shift(h(73306), by(73306)[2]), 1);
});

test('the clock shows its hour with the hand at 30° per hour, and never prints the answer', () => {
  late.forEach(([, prompt, answer, hint, , , e]) => {
    const html = measure.renderClockHtml(e.clock);
    assert.match(html, new RegExp('clock-hour" style="transform:rotate\\(' + (e.clock.hour % 12) * 30 + 'deg\\)'));
    assert.notEqual(answer, e.clock.hour, e.key);
    assert.ok(!leaks(html.replace(/<span class="clock-num"[^>]*>\d+<\/span>/g, ''), answer), e.key + ' clock text');
    assert.ok(!leaks(prompt, answer) && !leaks(hint, answer), e.key);
    g1.music.CLOCK.forEach((w) => assert.ok(!leaks(w[1], answer), e.key + ' ' + w[0]));
    assert.ok(countWords(prompt) <= 15 && countWords(hint) <= 15, e.key);
  });
});

test('one primary music way: hourAccents (M2)', () => {
  assert.deepEqual(banks.primaryWays(g1.music.CLOCK).map(([t]) => t), ['hourAccents']);
  shipped.forEach((it) => assert.equal(it.music, 'hourAccents', it.id));
});
