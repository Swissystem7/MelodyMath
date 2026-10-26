'use strict';
// #688: singing line, groups×size and even/odd as bank exercises.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('path');
const banks = require('../src/lib/banks');
const cur = require('../src/lib/curriculum');
const line = require('../src/lib/numberLine');
const ex = require('../src/lib/exercises/explorerBank');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const TOPICS = { singingLine: 'mm-cur-2', groupsSize: 'mm-cur-15', evenOdd: 'mm-cur-13' };
const SOURCES = { singingLine: 'mcdonel2015', groupsSize: 'das2023', evenOdd: 'das2023' };

function shipped() {
  return banks.allItems().filter((it) => it.explorer);
}

test('the bank has the three explorer types, each tagged to its curriculum topic', () => {
  const items = shipped();
  assert.deepEqual(items.map((it) => it.explorer.type), ['singingLine', 'groupsSize', 'evenOdd']);
  items.forEach((it) => {
    const topicId = it.explorer.topicId;
    assert.equal(topicId, TOPICS[it.explorer.type]);
    const row = cur.topicById(topicId);
    const section = cur.sectionForItem(it);
    assert.equal(section.verified, true, it.prompt);
    assert.equal(section.grade, it.grade);
    assert.equal(section.topic, row.topic);
    assert.ok(cur.itemsForTopic(topicId, banks.allItems()).some((x) => x.explorer && x.explorer.type === it.explorer.type));
    assert.equal(it.answer, ex.expectedOf(it));
    assert.equal(it.musicSrc, SOURCES[it.explorer.type]);
    assert.match(banks.MUSIC_SOURCES[it.musicSrc][1], /^https:\/\//);
    assert.ok(['D', 'R', 'A'].includes(it.musicEv));
    assert.equal(it.noMusic, undefined);
    assert.equal(it.locked, undefined);
    assert.equal(it.lock, undefined);
    assert.ok(ex.cardWords(it.prompt).length <= ex.MAX_WORDS, it.prompt);
    assert.ok(ex.cardWords(it.hint).length <= ex.MAX_WORDS, it.hint);
    assert.ok(ex.cardWords(ex.submit(ex.createState(it), 'nope').message).length <= ex.MAX_WORDS);
  });
});

test('answer check: the singing line, the product, and even or odd', () => {
  const [sing, groups, even] = shipped();
  assert.equal(sing.grade, 'א');
  assert.equal(sing.prompt, 'איפה 7?');
  assert.equal(sing.line.max, 20);
  assert.equal(ex.checkAnswer(sing, 7), true);
  assert.equal(ex.checkAnswer(sing, '3/4'), false);
  assert.equal(ex.checkAnswer(sing, '75'), false);
  assert.equal(ex.singingSpec(21), null);
  assert.equal(ex.hzOnLine(7, 20), line.soundForTick(7, { min: 0, max: 20 }).frequency);

  assert.equal(groups.prompt, '4 קבוצות של 3. כמה?');
  assert.equal(ex.checkAnswer(groups, 12), true);
  assert.equal(ex.checkAnswer(groups, 7), false);
  assert.equal(groups.table, 4);
  const twoFive = ex.groupsSpec(2, 5);
  assert.equal(ex.checkAnswer(twoFive, 10), true);
  assert.equal(ex.groupsSpec(3, 3), null);

  assert.equal(even.standard, banks.ST.EVEN_ODD);
  assert.notEqual(even.standard, banks.ST.PLACE_VALUE);
  assert.match(cur.sectionForItem(even).topic, /זוגי\/אי־זוגי/);
  assert.equal(ex.checkAnswer(even, 'זוגי'), true);
  assert.equal(ex.checkAnswer(even, 'אי־זוגי'), false);
  const seven = ex.evenOddSpec(7);
  assert.equal(seven.answer, 'אי-זוגי');
  assert.equal(ex.checkAnswer(seven, 'אי־זוגי'), true);
  assert.equal(ex.checkAnswer(seven, 'זוגי'), false);
  assert.equal(ex.checkAnswer(even, ''), false);
});

test('a miss replays that exercise and opens one second try; a hit plays a scale', () => {
  shipped().forEach((it) => {
    const miss = ex.submit(ex.createState(it), '0');
    assert.equal(miss.phase, 'hint_replay');
    assert.equal(miss.secondTry, true);
    assert.equal(miss.hasBuzzer, false);
    assert.equal(miss.hasRedX, false);
    assert.deepEqual(miss.replay, ex.replayPlan(it));
    assert.equal(miss.scale, null);
    const again = ex.submit(ex.startRetry(miss), it.answer);
    assert.equal(again.phase, 'correct');
    assert.equal(again.secondTry, false);
    assert.deepEqual(again.scale, ex.SCALE);
    assert.ok(again.animation.className.startsWith('anim-math-'));
    for (let i = 1; i < again.scale.length; i++) assert.ok(again.scale[i] > again.scale[i - 1]);
    const revealed = ex.submit(miss, '0');
    assert.equal(revealed.phase, 'revealed');
    assert.equal(revealed.secondTry, false);
    assert.match(revealed.message, /התשובה/);
  });
  const groups = shipped()[1];
  assert.deepEqual(ex.replayPlan(groups).beats, ['kick', 'snare', 'snare', 'kick', 'snare', 'snare', 'kick', 'snare', 'snare', 'kick', 'snare', 'snare']);
  const odd = ex.evenOddSpec(3);
  assert.equal(ex.replayPlan(odd).events.filter((ev) => ev.hz === 880).length, 1);
  assert.equal(ex.replayPlan(ex.evenOddSpec(4)).events.some((ev) => ev.hz === 880), false);
});

test('playReplay plays the same exercise, and the enrichment explorers stay', () => {
  const api = require('../src/lib/exercises/explorerBank');
  assert.equal(api.playReplay(null), false);
  const heard = [];
  global.playFreq = (hz) => heard.push(hz);
  assert.equal(api.playReplay(api.replayPlan(shipped()[0]), (fn) => fn()), true);
  assert.deepEqual(heard, [ex.replayPlan(shipped()[0]).frequency]);
  delete global.playFreq;
  const kicks = [];
  global.playDrumSound = (name) => kicks.push(name);
  assert.equal(api.playReplay(api.replayPlan(shipped()[1]), (fn) => fn()), true);
  assert.deepEqual(kicks, api.replayPlan(shipped()[1]).beats);
  delete global.playDrumSound;
  const scale = [];
  global.playFreq = (hz) => scale.push(hz);
  assert.equal(api.playScale(api.SCALE, (fn) => fn()), true);
  assert.deepEqual(scale, api.SCALE);
  delete global.playFreq;

  const play = html.slice(html.indexOf('id="playground"'), html.indexOf('id="playground"') + 4000);
  assert.match(play, /id="singingLine"/);
  assert.match(play, /העשרה/);
  assert.match(html, /id="mgGroupBtns"/);
  assert.match(html, /id="mgSizeBtns"/);
  assert.match(html, /id="eoNumBtns"/);
  assert.match(html, /function renderMultExplorerUI/);
  assert.match(html, /function renderEvenOddExplorerUI/);
});

test('regular practice check replays an explorer miss, then accepts a dashed second try', () => {
  const vm = require('node:vm'); const item = ex.evenOddSpec(9); const els = {};
  const ctx = { answered: false, current: item, history: [], $: (id) => els[id] || (els[id] = { value: '', style: {}, focus() {} }), show() {}, normalizeAnswer: (v) => String(v).trim(), isCorrect: require('../src/lib/adaptive').isCorrect, noteMetro() {}, logTeacherItem() {}, mathHtml: (s) => s, MM_EXPLORER_BANK: ex };
  vm.createContext(ctx); const run = (v) => { ctx.$('answer').value = v; vm.runInContext(html.match(/^function check\(.*$/m)[0] + ';check()', ctx); };
  ['-', '\u05BE', '\u2013', '\u2011'].forEach((d) => assert.equal(ctx.isCorrect('אי' + d + 'זוגי', 'אי-זוגי'), true));
  run('זוגי'); assert.equal(ctx.answered, false); assert.equal(item._exState.secondTry, true); run('אי\u2011זוגי'); assert.equal(ctx.answered, true); assert.equal(item._exState.phase, 'correct');
});

test('each explorer type is followed by a silent check with no music', () => {
  const silent = banks.allItems().filter((it) => it.noMusic);
  assert.deepEqual(ex.bankSpecs().map((s) => !!s.noMusic), [false, true, false, true, false, true]);
  assert.deepEqual(silent.map((it) => [it.answer, it.music, it.musicNote, it.explorer, cur.sectionForItem(it).verified]), [
    [9, undefined, undefined, undefined, true], [10, undefined, undefined, undefined, true], ['אי-זוגי', undefined, undefined, undefined, true],
  ]);
  silent.forEach((it) => assert.ok(ex.cardWords(it.prompt).length <= ex.MAX_WORDS && ex.checkAnswer(it, it.answer)));
});
