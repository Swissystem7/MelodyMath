// Stream B (#955): the practice ruler and clock widgets (measure.js bindRuler /
// bindClock) no longer print the length or time they show. For a "read the
// ruler / read the clock" item that value is the answer, so it waits in
// data-reveal until index.html's revealWidget runs after the child answers.
// No item id or item text changes (grades1-3-idStability stays green).
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const measure = require('../src/lib/measure');

const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const leaks = (text, answer) => new RegExp('(^|[^0-9])' + escape(answer) + '([^0-9]|$)').test(String(text || ''));
// What a child sees or hears before answering: the markup without the hidden
// data-reveal values and without the fixed 1-12 numerals of the clock face.
const visible = (html) => html
  .replace(/ data-reveal="[^"]*"/g, '')
  .replace(/<span class="clock-num"[^>]*>\d+<\/span>/g, '');
const host = () => ({ innerHTML: '' });
// revealWidget in index.html: every [data-reveal] element gets its value as text.
const reveal = (html) => html.replace(/<p class="(ruler|clock)-read" data-reveal="([^"]*)">[^<]*<\/p>/g, '<p class="$1-read">$2</p>');

const widgetItems = banks.allItems().filter((it) => (it.widget === 'ruler' && it.ruler) || (it.widget === 'clock' && it.clock));
const isRead = (it) => (it.widget === 'ruler' ? Number(it.answer) === measure.normalizeRuler(it.ruler).length
  : Number(it.answer) === measure.normalizeClock(it.clock).hour && !measure.normalizeClock(it.clock).minutes);

test('the 24 old "read the ruler / read the clock" items of grades א׳–ב׳ are all still there', () => {
  const read = widgetItems.filter((it) => +it.id.split('-').pop() < 10000 && isRead(it));
  assert.equal(read.length, 24);
  assert.ok(read.every((it) => it.grade === 'א' || it.grade === 'ב'));
});

test('no practice ruler or clock prints the answer of its item before the child answers', () => {
  widgetItems.forEach((it) => {
    const h = host();
    (it.widget === 'ruler' ? measure.bindRuler : measure.bindClock)(h, it[it.widget]);
    assert.ok(!leaks(visible(h.innerHTML), it.answer), it.id + ' shows ' + it.answer);
  });
});

test('after the answer, revealWidget shows the read-out the child can check against', () => {
  const r = host();
  measure.bindRuler(r, { unit: 'cm', length: 6 });
  assert.match(r.innerHTML, /data-reveal="6 ס״מ"/);
  assert.match(reveal(r.innerHTML), /<p class="ruler-read">6 ס״מ<\/p>/);
  const c = host();
  measure.bindClock(c, { hour: 7 });
  assert.match(reveal(c.innerHTML), /<p class="clock-read">7:00<\/p>/);
  assert.match(c.innerHTML, /clock-hour" style="transform:rotate\(210deg\)/, 'the hand still shows the time');
});

test('without hideRead (answer keys, older callers) the full read-out is unchanged', () => {
  assert.match(measure.renderRulerHtml({ unit: 'cm', length: 7 }), /<p class="ruler-read">7 ס״מ<\/p>/);
  assert.match(measure.renderClockHtml({ hour: 4 }), /aria-label="שעון מראה השעה 4:00"/);
});
