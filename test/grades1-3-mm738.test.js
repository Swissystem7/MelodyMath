// MM-738 (stream B): a drawn minute clock for grade ג׳ (mm-cur-28): the clock
// widget takes `minutes`, and 8 grade ג׳ items use it (partial row in
// docs/MM-700/curriculum-gaps.md, PR #951). Official side:
// Newprogramgrade3.pdf p. 19 via MM-501 (PR #949). Items: grade3.js lateItems.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const cur = require('../src/lib/curriculum');
const measure = require('../src/lib/measure');
const g3 = require('../src/lib/curriculum/grade3');
const { countWords } = require('../src/lib/exercises/patternAndWorkedExample.js');

const KEYS = Array.from({ length: 8 }, (_, i) => 73801 + i);
const late = g3.lateItems.filter((x) => KEYS.includes((x[6] || {}).key));
const shipped = banks.allItems().filter((it) => it.grade === 'ג' && KEYS.includes(+it.id.split('-').pop()));
const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const leaks = (text, answer) => new RegExp('(^|[^0-9])' + escape(answer) + '([^0-9]|$)').test(String(text || ''));
const visible = (html) => html.replace(/ data-reveal="[^"]*"/g, '').replace(/<span class="clock-num"[^>]*>\d+<\/span>/g, '');

test('the clock widget data has a minutes field, and the hands follow it', () => {
  assert.deepEqual(measure.normalizeClock({ hour: 3, minutes: 15 }), { hour: 3, minutes: 15 });
  assert.equal(measure.normalizeClock({ hour: 3 }).minutes, 0);
  assert.equal(measure.normalizeClock({ hour: 3, minutes: 75 }).minutes, 0);
  assert.equal(measure.minuteHandAngle(15), 90);
  assert.equal(measure.minuteHandAngle(45), 270);
  assert.equal(measure.clockHandAngle(3, 30), 105);
  assert.equal(measure.clockHandAngle(3), 90, 'whole hours draw as before');
  const html = measure.renderClockHtml({ hour: 9, minutes: 45 });
  assert.match(html, /clock-min" style="transform:rotate\(270deg\)/);
  assert.match(html, /clock-hour" style="transform:rotate\(292\.5deg\)/);
  assert.match(html, /9:45/);
});

test('8 grade ג׳ minute-clock items ship on the verified hours-and-minutes row, every level present', () => {
  assert.equal(late.length, 8);
  assert.equal(shipped.length, 8);
  [1, 2, 3].forEach((lv) => assert.ok(shipped.some((it) => it.level === lv), 'level ' + lv));
  shipped.forEach((it) => {
    assert.ok(banks.isShippable(it), it.id);
    assert.equal(it.widget, 'clock', it.id);
    assert.ok(it.clock.minutes > 0, it.id);
    assert.ok(cur.sectionForItem(it).verified, it.id);
    assert.match(cur.sectionForItem(it).url, /Newprogramgrade3\.pdf$/);
    assert.ok(cur.itemsForTopic('mm-cur-28', banks.allItems()).includes(it), it.id);
  });
});

test('answers follow from the time the clock shows', () => {
  const by = (k) => late.find((x) => x[6].key === k);
  const c = (k) => by(k)[6].clock;
  assert.equal(by(73801)[2], c(73801).minutes);
  assert.equal(by(73802)[2], c(73802).minutes);
  assert.equal(by(73803)[2], c(73803).minutes);
  assert.equal(by(73804)[2], 60 - c(73804).minutes);
  assert.equal(by(73805)[2], c(73805).minutes + 35);
  assert.equal(by(73806)[2], c(73806).hour + 1);
  assert.equal(c(73806).minutes + 35, 60);
  assert.equal(by(73807)[2], c(73807).minutes + 25 - 60);
  assert.equal(by(73808)[2], 60 * c(73808).hour + c(73808).minutes);
});

test('no answer is given away by the prompt, the hint, the music way or the practice clock', () => {
  late.forEach(([, prompt, answer, hint, , st, e]) => {
    assert.ok(!leaks(prompt, answer) && !leaks(hint, answer), String(e.key));
    g3.music[st].forEach((w) => assert.ok(!leaks(w[1], answer), e.key + ' ' + w[0]));
    const h = { innerHTML: '' };
    measure.bindClock(h, e.clock);
    assert.ok(!leaks(visible(h.innerHTML), answer), e.key + ' clock');
    assert.ok(countWords(prompt) <= 15 && countWords(hint) <= 15, String(e.key));
  });
});

test('one music mechanism: the primary MINUTES ways are M2 accent groups of five minutes', () => {
  banks.primaryWays(g3.music.MINUTES).forEach(([t]) => assert.equal(banks.mechanismOf(t), 'M2', t));
  shipped.forEach((it) => assert.equal(banks.mechanismOf(it.music), 'M2', it.id));
});
