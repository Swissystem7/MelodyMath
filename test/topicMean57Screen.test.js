'use strict';
// index.html?topic=mm-cur-57 (grade 6 ממוצע) must open on the #750/#836 tap
// widget. The tap items live in tapTempoMean.js, not in the SHIPPED banks, so
// startTopicPractice has to add them to the pool, and the screen title is the
// topic name (it used to read "שברים עשרוניים" from an old bank skill).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const curriculum = require('../src/lib/curriculum.js');
const banks = require('../src/lib/banks.js');
const TAP = require('../src/lib/exercises/tapTempoMean.js');
const MY = require('../src/lib/myInstrument.js');
const INST = require('../src/lib/instruments.js');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const startSrc = html.match(/function startTopicPractice\(id,skill\)\{[\s\S]*?\n\}/)[0];
const widgetSrc = html.match(/function renderWidget\(hostId, item, inputId\)\{[\s\S]*?\n\}/)[0];

function startTopic(id) {
  const calls = { show: [], grade: null, rendered: 0 };
  const ctx = {
    topicById: curriculum.topicById, itemsForTopic: curriculum.itemsForTopic,
    itemsForGrade: banks.itemsForGrade, isGrade: banks.isGrade,
    MM_TAP_TEMPO_MEAN: TAP, rmHe: banks.skillHe,
    show: (el, on) => calls.show.push([el, on]),
    saveGrade: (g) => { calls.grade = g; },
    rpRender: () => { calls.rendered++; },
  };
  vm.createContext(ctx);
  const ok = vm.runInContext(startSrc + '\nstartTopicPractice(' + JSON.stringify(id) + ');', ctx);
  return { ok, ctx, calls };
}

test('?topic=mm-cur-57 opens with the topic name and the tap items first', () => {
  assert.equal(typeof banks.isGrade, 'function');
  const { ok, ctx, calls } = startTopic('mm-cur-57');
  assert.equal(ok, true);
  assert.equal(calls.grade, 'ו');
  assert.equal(calls.rendered, 1);
  assert.equal(ctx.rmPlanTopic, 'mm-cur-57');
  assert.ok(ctx.rmPlan.length >= 1);
  ctx.rmPlan.forEach((st) => { assert.equal(st.he, 'ממוצע'); assert.notEqual(st.he, 'שברים עשרוניים'); });
  assert.equal(ctx.rmPlan[0].items[0].music, 'tapTempo', 'the screen opens on a tap item');
  const taps = ctx.rmPlan[0].items.filter((it) => it.standard === 'G6_MEAN' && it.music === 'tapTempo' && Array.isArray(it.intervals));
  assert.ok(taps.length >= 1, 'first step holds G6_MEAN tap items');
});

function renderItem(item) {
  const store = new Map();
  global.localStorage = { getItem: (k) => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)), removeItem: (k) => store.delete(k) };
  try {
    const host = {
      innerHTML: '', onclick: null, hidden: true,
      classList: { add() { host.hidden = true; }, remove() { host.hidden = false; } },
      querySelector: () => null,
    };
    const wctx = { $: () => host, MM_TAP_TEMPO_MEAN: TAP, MM_MY_INSTRUMENT: MY, instrumentById: INST.instrumentById };
    vm.createContext(wctx);
    vm.runInContext(widgetSrc + '\nrenderWidget;', wctx)('rmPlanWidget', item, null);
    return host;
  } finally {
    delete global.localStorage;
  }
}

test('a tap item from that plan renders the tap widget with the instrument picker', () => {
  const { ctx } = startTopic('mm-cur-57');
  const host = renderItem(ctx.rmPlan[0].items.find((it) => it.music === 'tapTempo' && !it.noMusic));
  assert.equal(host.hidden, false);
  assert.match(host.innerHTML, /tap-mean-widget/);
  assert.match(host.innerHTML, /class="btn-tap-cue"/);
  assert.match(host.innerHTML, /tap-inst-pick/);
  assert.equal(typeof host.onclick, 'function');
  ['darbuka', 'marimba', 'recorder', 'guitar'].forEach((id) => assert.match(host.innerHTML, new RegExp('data-tap-inst="' + id + '"'), id));
});

test('no-music path: the plain item renders without the widget and taps do not throw without audio', () => {
  const { ctx } = startTopic('mm-cur-57');
  const plain = ctx.rmPlan.flatMap((st) => st.items).find((it) => it.noMusic);
  assert.ok(plain, 'the plain no-music check item is in the mm-cur-57 plan');
  let host;
  assert.doesNotThrow(() => { host = renderItem(plain); });
  assert.doesNotMatch(host.innerHTML, /tap-mean-widget|data-tap-inst/);
  // No playVoice / AudioContext in Node: the tap still records time.
  const s = TAP.createTapSession({ instrument: 'darbuka', now: ((t) => () => (t += 500))(0) });
  assert.doesNotThrow(() => { s.tap(); s.tap(); });
  assert.equal(s.taps().length, 2);
});

test('a topic with no tap items keeps working', () => {
  const { ok, ctx } = startTopic('mm-cur-1');
  assert.equal(ok, true);
  assert.ok(ctx.rmPlan.every((st) => st.items.every((it) => it.music !== 'tapTempo')));
});

test('a topic whose skill names fit it keeps the short skill titles', () => {
  const { ctx } = startTopic('mm-cur-3');
  const row = curriculum.topicById('mm-cur-3');
  ctx.rmPlan.forEach((st) => {
    const he = banks.skillHe(st.skill);
    if (row.topic.includes(he)) assert.equal(st.he, he, st.skill);
  });
  assert.ok(ctx.rmPlan.some((st) => st.he !== row.topic), 'at least one short skill title stays');
});
