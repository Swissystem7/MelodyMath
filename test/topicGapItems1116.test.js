'use strict';
// The second round of items the per-topic research asked for
// (docs/research/topics/*.md, "מה חסר בבנק"), appended on 16.11.2026.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const banks = require('../src/lib/banks');
const measure = require('../src/lib/measure');

const TAG = 'topics-2026-11-16';
const mine = banks.allItems().filter((it) => it.research === TAG);
const by = (re) => { const it = mine.find((x) => re.test(x.prompt)); assert.ok(it, String(re)); return it; };
const num = (it) => +it.id.split('-').pop();

const dir = path.join(__dirname, '../src/lib/music');
const mods = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => {
  try { return [f, require(path.join(dir, f))]; } catch (e) { return [f, null]; }
}).filter(([, m]) => m && typeof m.specForItem === 'function');
const player = (it) => { for (const [f, m] of mods) { try { if (m.specForItem(it)) return f; } catch (e) { /* not this one */ } } return null; };

test('thirty-five items (32 on 16.11, 3 on 17.11), appended after everything that was already in the bank', () => {
  assert.equal(mine.length, 35);
  const older = banks.allItems().filter((it) => it.research !== TAG).map(num);
  assert.ok(Math.min(...mine.map(num)) > Math.max(...older));
  assert.equal(new Set(mine.map((it) => it.prompt)).size, 35);
  mine.forEach((it) => assert.ok(it.hint && it.standard && (it.music || it.noMusic), it.prompt));
});

test('every answer is worked out here, not copied', () => {
  assert.equal(by(/^3 קפיצות של 2 מ־50/).answer, 50 + 3 * 2, 'the number of jumps is not the size of a jump');
  assert.equal(by(/^10 = 7 \+ ☐$/).answer, 10 - 7);
  assert.equal(by(/^6 \+ 4 = 7 \+ ☐$/).answer, 6 + 4 - 7);
  assert.equal(by(/^2 \+ 9 = \?$/).answer, 11);
  assert.equal(by(/בא לפני 15/).answer, 14);
  assert.equal(by(/בא לפני 20/).answer, 19);
  assert.equal(by(/^52, 51, 50, \?$/).answer, 49, 'counting back across a ten');
  assert.equal(by(/100, 95, 90, \?$/).answer, 85);
  assert.equal(by(/^במספר 24/).answer, 2 * 10, 'the digit 2 stands for twenty');
  assert.equal(by(/^3 \+ ☐ = 8$/).answer, 8 - 3);
  assert.equal(by(/^7 \+ 5 \+ 3/).answer, 7 + 3 + 5);
  assert.equal(by(/^לנועה 5 יותר/).answer, 12 - 5, '"more" in the story, subtraction in the sum');
  assert.equal(by(/^היו כמה ילדים/).answer, 8 - 3);
  assert.equal(by(/^3 עשרות ו־14 יחידות/).answer, 3 * 10 + 14);
  assert.equal(by(/^2 מאות, 13 עשרות/).answer, 2 * 100 + 13 * 10 + 5);
  assert.equal(by(/מחולק בקו לשני ריבועים/).answer, measure.perimeter([6, 3, 6, 3]), 'the inner line is not perimeter');
  assert.equal(by(/^מסובבים משולש/).answer, 'כן');
  assert.equal(by(/^האוטובוס יוצא ב־3:10/).answer, (60 - 50) + 10, 'the time goes on across the hour');
  assert.equal(by(/3 שורות של 8 זמרים/).answer, 3 * 8 - 5);
  assert.equal(by(/^קנה 3 מיתרים/).answer, 40 - 3 * 5);
  assert.equal(by(/אותה טבלת צלילים/).answer, 'לא');
  assert.equal(by(/זרועות באורך שונה/).answer, 'לא');
  assert.equal(by(/^35 × 100/).answer, 35 * 10 * 10);
  const ineq = by(/מ־1 ומעלה/);
  assert.equal(ineq.answer, [1, 2, 3, 4, 5, 6].filter((x) => x * 7 < 30).length, 'an inequality has several solutions');
  assert.equal(by(/ישרים באלכסון/).answer, 'כן');
  assert.equal(by(/כמה רבעים יש ב־2 ו־3\/4/).answer, (2 * 4 + 3) + '/4', 'not 5/4: the whole is four quarters');
  assert.equal(by(/הוסיפו 1 למונה ולמכנה/).answer, 1 / 2 > 2 / 3 ? '1/2' : '2/3');
  assert.equal(by(/צלע משופעת 5/).answer, 6 * 4, 'base times height; the slanted side stays out');
  assert.equal(by(/^2\/3 × 2\/3/).answer, (2 * 2) + '/' + (3 * 3));
});

test('twenty-six of them sound in a music world, and the sounds give the answer', () => {
  const silent = mine.filter((it) => !it.widget && !player(it)).map((it) => it.prompt.slice(0, 11)).sort();
  assert.deepEqual(silent, ['לשני שירים ', 'לשתי זוויות', 'מסובבים משו', 'שני ישרים ב'].sort(), 'only the four yes/no ideas stay silent');
  assert.equal(mine.filter((it) => it.widget === 'clock').length, 1);
  const eb = require('../src/lib/music/earlyBeats');
  const spec = (re) => eb.specForItem(by(re));
  assert.equal(spec(/^3 קפיצות של 2 מ־50/).seq.length, 3, 'one group per jump');
  assert.equal(spec(/^10 = 7 \+ ☐$/).kind, 'compare');
  assert.deepEqual([spec(/^3 \+ ☐ = 8$/).a, spec(/^3 \+ ☐ = 8$/).b], [8, 3]);
  assert.equal(spec(/בא לפני 20/).dir, -1);
  assert.equal(spec(/^52, 51, 50, \?$/).kind, 'back');
  assert.equal(spec(/100, 95, 90, \?$/).d, -5);
  const digit = spec(/^במספר 24/);
  assert.equal(eb.soundEvents(digit).filter((n) => n.stage === 'tom').length * 10, 20, 'two toms: twenty');
  // a wrong answer never sounds
  assert.equal(eb.specForItem(Object.assign({}, by(/^10 = 7 \+ ☐$/), { answer: 4 })), null);
});

test('the clock at 2:50: the short hand is not yet on 3, and the face does not print the time', () => {
  const it = by(/^מה השעה בשעון\?$/);
  assert.equal(it.answer, '2:50');
  assert.deepEqual(measure.normalizeClock(it.clock), { hour: 2, minute: 50 });
  assert.equal(measure.clockHandAngle(2, 50), 2 * 30 + 25);
  assert.ok(measure.clockHandAngle(2, 50) < measure.clockHandAngle(3, 0));
  const html = measure.renderClockHtml(it.clock);
  assert.match(html, /clock-min" style="transform:rotate\(300deg\)/);
  assert.match(html, /בין 2 ל־3/);
  assert.doesNotMatch(html, /2:50/);
  // whole hours look as they did
  assert.match(measure.renderClockHtml({ hour: 3 }), /מצביע על 3, ומחוג הדקות הארוך על 12/);
  assert.deepEqual(measure.normalizeClock({ hour: 2, minute: 52 }), { hour: 2, minute: 0 }, 'only steps of five');
});

test('XI and IX: the same signs in another order are another number, and both sound', () => {
  const pn = require('../src/lib/music/partsNumerals');
  const xi = by(/הוא XI\?$/), ix = by(/הוא IX\?$/);
  assert.equal(xi.answer, 10 + 1);
  assert.equal(ix.answer, 10 - 1);
  assert.ok(pn.specForItem(xi) && pn.specForItem(ix));
});

test('17.11: the same amount in another order, the same volume with another weight, an axis above zero', () => {
  const swap = by(/^3 \+ 2 = 2 \+ ☐$/);
  assert.equal(swap.answer, 3 + 2 - 2, '3 + 2 and 2 + 3 are the same amount');
  assert.ok(player(swap), 'the swapped order sounds');
  const oil = by(/ליטר שמן/);
  assert.equal(oil.answer, 10 - 9, 'the same 10 litres weigh differently');
  assert.ok(player(oil), 'the two weights sound');
  const wrong = Object.assign({}, oil, { answer: 2 });
  assert.equal(player(wrong), null, 'a wrong answer never sounds');
  const chart = by(/^בגרף, עמודה א׳/);
  assert.equal(chart.answer, 70 - 60, 'the gap, not the picture');
  const html = require('../src/lib/dataViz').renderBarChartHtml(chart.chart);
  const heights = (html.match(/height:(\d+)%/g) || []).map((h) => +h.replace(/\D/g, ''));
  assert.deepEqual(heights, [50, 100], 'from 50, ב׳ looks twice as tall');
  assert.match(html, /הציר מתחיל ב־50/);
  assert.doesNotMatch(require('../src/lib/dataViz').renderBarChartHtml({ bars: [{ label: 'x', value: 4 }] }), /הציר מתחיל/, 'a chart from zero says nothing');
});

test('the print sheet keeps the minutes of a clock', () => {
  const ws = require('../src/lib/worksheets');
  assert.match(ws.printableWidget({ widget: 'clock', clock: { hour: 2, minute: 50 } }), /2:50/);
  assert.match(ws.printableWidget({ widget: 'clock', clock: { hour: 4 } }), /4:00/);
});
