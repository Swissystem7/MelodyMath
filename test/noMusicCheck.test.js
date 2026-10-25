'use strict';
// End-of-topic no-music check (Refs #747, Refs #665, Refs #681).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const NM = require('../src/lib/noMusicCheck.js');
const instruments = require('../src/lib/instruments.js');
const { PREREQ } = require('../src/lib/curriculum/progression.js');

const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const TOPICS = Object.keys(NM.MISSING_FACTOR);

test('every missing_factor item solves: answer × shown factor = product', () => {
  TOPICS.forEach((t) => {
    NM.checkItemsForTopic(t).forEach((it) => {
      const m = it.prompt.match(/^(\d+|☐) × (\d+|☐) = (\d+)\./);
      assert.ok(m, it.prompt);
      const shown = Number(m[1] === '☐' ? m[2] : m[1]);
      assert.equal(Number(it.answer) * shown, Number(m[3]), it.prompt);
      assert.equal(it.exerciseType, 'missing_factor');
      assert.equal(it.noMusic, true);
      assert.equal(it.plain, true);
      assert.ok(it.prompt.split(/\s+/).length <= 15, it.prompt);
    });
  });
});

test('each topic has three questions with different products (no 7×☐=42 beside 6×☐=42)', () => {
  assert.deepEqual(TOPICS.sort(), ['mm-cur-18', 'mm-cur-24', 'mm-cur-25', 'mm-cur-31']);
  TOPICS.forEach((t) => {
    const items = NM.checkItemsForTopic(t);
    assert.equal(items.length, NM.ROUND, t);
    const products = items.map((it) => it.prompt.match(/= (\d+)/)[1]);
    assert.equal(new Set(products).size, products.length, t + ': ' + products);
    assert.ok(PREREQ[t], t + ' is a curriculum topic');
  });
  const all = TOPICS.flatMap(NM.checkItemsForTopic).map((it) => it.prompt);
  assert.ok(!all.some((p) => p.startsWith('6 × ☐ = 42')));
  assert.ok(all.some((p) => p.startsWith('6 × ☐ = 48')));
  assert.ok(PREREQ['mm-cur-18'][0].includes('mm-cur-16'), 'mm-cur-18 needs division first');
  assert.deepEqual(NM.checkItemsForTopic('nope'), []);
});

test('every topic gets a check: curated for missing_factor, else its own items without sound or picture', () => {
  assert.equal(NM.topicForSkill('multiplication', 'ג'), 'mm-cur-24');
  assert.equal(NM.topicForSkill('division', 'ג'), 'mm-cur-25');
  assert.equal(NM.checkItemsFor('multiplication', 'ד', [])[0].topicId, 'mm-cur-31');
  const pool = [
    { id: 'a', prompt: '3 + 4', answer: 7, hear: [3, 4], widget: 'bars', music: 'claps' },
    { id: 'b', prompt: '3 + 4', answer: 7 },
    { id: 'c', prompt: '5 + 1', answer: 6 },
    { id: 'd', prompt: '2 + 2', answer: 4 },
    { id: 'e', prompt: '9 + 0', answer: 9 },
  ];
  const items = NM.checkItemsFor('addition', 'א', pool);
  assert.deepEqual(items.map((it) => it.id), ['a', 'c', 'd']);
  items.forEach((it) => {
    assert.equal(it.noMusic, true);
    assert.equal(it.hear, undefined);
    assert.equal(it.widget, undefined);
    assert.equal(it.music, undefined);
  });
  assert.deepEqual(NM.checkItemsFor('addition', 'א', null), []);
});

test('round: three questions, two mistakes go back to the picture stage', () => {
  const items = NM.checkItemsForTopic('mm-cur-24');
  let r = NM.createRound(items);
  assert.deepEqual(r.answer(true), { done: false, passed: false, backTo: null });
  r.answer(false);
  assert.deepEqual(r.answer(true), { done: true, passed: true, backTo: null });
  r = NM.createRound(items);
  r.answer(false);
  assert.deepEqual(r.answer(false), { done: true, passed: false, backTo: 'picture' });
  assert.equal(r.index, 2);
});

test('the cue uses the instrument the child picked (mm-tap-instrument), else the topic instrument', () => {
  const store = { 'mm-tap-instrument': 'marimba' };
  const storage = { getItem: (k) => store[k] || null };
  assert.equal(NM.childInstrument(storage, 'multiplication', instruments), 'marimba');
  const topicFirst = instruments.forTopic('multiplication')[0].id;
  assert.equal(NM.childInstrument({ getItem: () => null }, 'multiplication', instruments), topicFirst);
  assert.equal(NM.childInstrument({ getItem() { throw new Error('private'); } }, 'multiplication', instruments), topicFirst);
  const played = [];
  const env = { instrumentById: instruments.instrumentById, getSharedAudioContext: () => ({ currentTime: 0 }),
    playVoice: (ac, voice, hz) => played.push([voice, hz]) };
  assert.equal(NM.cueInstrument('marimba', env), instruments.instrumentById('marimba').voice);
  assert.equal(played.length, 3);
  assert.ok(played.every(([v]) => v === instruments.instrumentById('marimba').voice));
  assert.equal(NM.cueInstrument('marimba', {}), null);
});

test('the screen runs the check at the end of a skill and goes back to the picture after two mistakes', () => {
  assert.match(indexHtml, /<script src="src\/lib\/noMusicCheck\.js"><\/script>/);
  assert.match(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), /'\.\/src\/lib\/noMusicCheck\.js'/);
  const src = indexHtml.match(/<script>\r?\n\/\/ End-of-topic no-music check \(#747\)[\s\S]*?<\/script>/)[0].replace(/<\/?script>/g, '');
  const els = {}, el = (id) => (els[id] = els[id] || { id, value: '', textContent: '', disabled: false, hidden: false, focus() {} });
  const cued = [], log = [];
  const ctx = {
    MM_NO_MUSIC_CHECK: Object.assign({}, NM, { cueInstrument: (id) => cued.push(id) }), PLAN_PER_SKILL: 6, selectedGrade: 'ג', rpStep: 0, rpAnswered: false,
    rmPlan: [{ skill: 'multiplication', items: [], history: [1, 2, 3, 4, 5, 6].map((i) => ({ id: i, correct: true })) }],
    $: el, show: (id, on) => { el(id).hidden = !on; }, setMath: (e, t) => { e.textContent = t; },
    normalizeAnswer: (v) => String(v).trim(), askForAnswer: () => {}, answerOk: (it, v) => String(it.answer) === v,
    prefsNow: () => ({ quiet: false }), setTimeout: () => {},
    rpAdvance: () => log.push('practiceAdvance'), rpCheck: () => log.push('practiceCheck'),
    localStorage: { getItem: (k) => (k === 'mm-tap-instrument' ? 'guitar' : null) },
  };
  vm.createContext(ctx);
  vm.runInContext(src + ';this.next=rpAdvance;this.check=rpCheck;', ctx);
  assert.equal(els.rmPlanNext.onclick, ctx.next);
  ctx.next();
  assert.match(els.rmPlanPrompt.textContent, /^7 × ☐ = 42/);
  assert.equal(els.rmPlanWidget.hidden, true, 'no picture');
  assert.equal(els.rmPlanWay.hidden, true, 'no music way');
  assert.deepEqual(log, [], 'practice render (and its sound) is skipped');
  els.rmPlanAnswer.value = '5'; ctx.check();
  ctx.next(); els.rmPlanAnswer.value = '5'; ctx.check();
  assert.equal(ctx.rmPlan[0].history.length, 3, 'back to three practice items with the picture');
  assert.deepEqual(cued, ['guitar']);
  ctx.next();
  assert.deepEqual(log, ['practiceAdvance']);
  ctx.rmPlan[0].history.push(4, 5, 6);
  ctx.next();
  ['6', '7', '4'].forEach((v) => { els.rmPlanAnswer.value = v; ctx.check(); ctx.next(); });
  assert.equal(ctx.rmPlan[0].nmDone, true);
  assert.deepEqual(log, ['practiceAdvance', 'practiceAdvance'], 'passing moves on to the next skill');
});
