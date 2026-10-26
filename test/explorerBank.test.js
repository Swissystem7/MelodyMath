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
    assert.equal(it.locked, undefined);
    assert.equal(it.lock, undefined);
    assert.ok(ex.cardWords(it.prompt).length <= ex.MAX_WORDS, it.prompt);
    assert.ok(ex.cardWords(it.hint).length <= ex.MAX_WORDS, it.hint);
    assert.ok(ex.cardWords(ex.submit(ex.createState(it), 'nope').message).length <= ex.MAX_WORDS);
  });
});

test('answer check: the singing line, the product, and even or odd', () => {
  const [sing, groups, even] = shipped();
  assert.equal(ex.checkAnswer(sing, '75'), true);
  assert.equal(ex.checkAnswer(sing, '75%'), true);
  assert.equal(ex.checkAnswer(sing, '50'), false);
  assert.equal(ex.checkAnswer(sing, '3/4'), false);
  const half = ex.singingSpec('1/2');
  assert.equal(half.answer, 50);
  assert.equal(ex.checkAnswer(half, 50), true);
  assert.equal(ex.bellForPercent(75).frequency, line.soundForTick(75, { min: 0, max: 100 }).frequency);

  assert.equal(groups.prompt, '4 קבוצות של 3. כמה?');
  assert.equal(ex.checkAnswer(groups, 12), true);
  assert.equal(ex.checkAnswer(groups, 7), false);
  assert.equal(groups.table, 4);
  const twoFive = ex.groupsSpec(2, 5);
  assert.equal(ex.checkAnswer(twoFive, 10), true);
  assert.equal(ex.groupsSpec(3, 3), null);

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
  global.updateSingingLine = (pct, play) => heard.push('line:' + pct + ':' + play);
  assert.equal(api.playReplay(api.replayPlan(shipped()[0]), (fn) => fn()), true);
  assert.deepEqual(heard, ['line:75:true']);
  delete global.updateSingingLine;
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
