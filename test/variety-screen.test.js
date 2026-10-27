'use strict';
// The topic practice screen (?topic=) draws through varyTopicExercise.
// Each topic keeps its own exercise type. Variety changes numbers inside that type.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const variety = require('../src/lib/exercises/variety.js');
const curriculum = require('../src/lib/curriculum.js');
const banks = require('../src/lib/banks.js');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const BARE_SUM = /^\d+\s*\+\s*\d+\s*=/;

function varyTopicExercise() {
  const start = html.indexOf('function varyTopicExercise');
  assert.ok(start > 0, 'varyTopicExercise is in index.html');
  const end = html.indexOf('\nfunction ', start + 1);
  const sandbox = { MM_VARIETY: variety };
  vm.createContext(sandbox);
  vm.runInContext(html.slice(start, end) + '\nthis.vary = varyTopicExercise;', sandbox);
  return sandbox.vary;
}

const vary = varyTopicExercise();
const PLACE = [
  ['mm-cur-1', 10, 100, 'counting'],
  ['mm-cur-22', 100, 10000, 'place_value'],
  ['mm-cur-31', 100, 1000000, 'place_value'],
  ['mm-cur-38', 1000, 10000000, 'place_value'],
];

function screenFn() {
  const start = html.indexOf('function varyTopicExercise');
  return html.slice(start, html.indexOf('\nfunction ', start + 1));
}

test('index.html loads variety.js for the topic practice screen', () => {
  assert.match(html, /<script src="src\/lib\/exercises\/variety\.js"><\/script>/);
  assert.match(html, /varyTopicExercise\(rmPlanTopic/);
  assert.match(html, /rmPlanTopic=id/);
  assert.match(html, /rmVarietySeed/);
  assert.match(html, /DOMContentLoaded',function\(\)\{startTopicPractice\(q\.get\('topic'\)/);
  assert.doesNotMatch(screenFn(), /hasMusic:\s*true/);
});

for (const [id, min, max, type] of PLACE) {
  test(id + ' stays ' + type + ' and inside ' + min + ' to ' + max, () => {
    assert.equal(variety.TOPIC_TYPES[id], type);
    assert.deepEqual(variety.getTopicRange(id), { min: min, max: max });
    const seen = [];
    for (let round = 0; round < 100; round++) {
      const ex = vary(id, { id: 'bank', prompt: 'old', answer: 0 }, round);
      assert.equal(ex.exerciseType, type, id + ' round ' + round);
      assert.equal(typeof ex.answer, 'number', id + ' round ' + round);
      assert.ok(ex.answer >= min && ex.answer <= max, id + ' answer ' + ex.answer);
      assert.equal(ex.topicId, id);
      assert.notEqual(ex.prompt, 'old');
      assert.doesNotMatch(ex.prompt, BARE_SUM, ex.prompt);
      assert.equal(ex.noMusic, round === 5, id + ' round ' + round + ' no-music check');
      assert.equal(ex.hasMusic, round !== 5);
      if (round === 5) assert.equal(ex.hear, null);
      const combo = ex.numberKey + '|' + ex.instrument + '|' + ex.bpm;
      assert.equal(seen.includes(combo), false, id + ' repeated ' + combo);
      seen.push(combo);
      if (seen.length > 5) seen.shift();
    }
  });
}

test('every topic keeps its own exercise type on the practice screen', () => {
  for (const id of Object.keys(variety.TOPIC_TYPES)) {
    const type = variety.TOPIC_TYPES[id];
    const range = variety.getTopicRange(id);
    const row = curriculum.topicById(id);
    const items = curriculum.itemsForTopic(id, banks.itemsForGrade(row.grade));
    const blank = vary(id, { id: 'bank', prompt: 'old', answer: 0 }, 0);
    assert.equal(blank.exerciseType, type, id);
    if (type !== 'addition') assert.doesNotMatch(blank.prompt, BARE_SUM, id + ' ' + blank.prompt);
    if (typeof blank.answer === 'number') assert.ok(blank.answer >= range.min && blank.answer <= range.max, id + ' ' + blank.answer);
    const own = items.find(function (it) { return it.skill === type; }) || items[0];
    const ex = vary(id, own, 1);
    assert.equal(ex.exerciseType, own.skill, id + ' bank skill');
    if (own.skill !== 'addition' && own.skill !== 'subtraction') assert.doesNotMatch(String(ex.prompt), BARE_SUM, id + ' ' + ex.prompt);
    if (ex.prompt !== own.prompt && Array.isArray(ex.hear)) ex.hear.forEach(function (h) { assert.ok(String(ex.prompt).includes(String(h)), ex.prompt + ' heard ' + h); });
    const last = vary(id, own, 5);
    assert.equal(last.noMusic, true, id + ' final check');
    assert.equal(last.hasMusic, false, id + ' final check');
    assert.equal(last.exerciseType, own.skill, id + ' final type');
  }
});

test('grade-6 percentages stay percentages and the plain check stays silent', () => {
  const ex = vary('mm-cur-53', { id: 'bank', prompt: 'old', answer: 0 }, 0);
  assert.equal(ex.exerciseType, 'percent');
  assert.match(ex.prompt, /%/);
  assert.doesNotMatch(ex.prompt, BARE_SUM);
  const check = vary('mm-cur-53', { skill: 'percent', prompt: 'כמה הם 25% מתוך 100?', answer: 25, noMusic: true, plain: true, musicStage: 'no_music_check', music: 'percentBar' }, 0);
  assert.equal(check.exerciseType, 'percent');
  assert.equal(check.noMusic, true);
  assert.equal(check.hasMusic, false);
  assert.equal(check.hear, null);
  assert.equal(check.music, null);
  assert.match(check.prompt, /%/);
});

test('mm-cur-40 is not whole tens, grade-1 addition stays within 20, and a new entry changes the numbers', () => {
  const factors = vary('mm-cur-40', { id: 'bank', prompt: 'old', answer: 0 }, 0);
  assert.equal(factors.exerciseType, 'factors');
  assert.doesNotMatch(factors.prompt, /\+/);
  for (let round = 0; round < 12; round++) {
    const ex = vary('mm-cur-3', { id: 'bank', prompt: 'old', answer: 0 }, round);
    assert.equal(ex.exerciseType, 'addition');
    assert.ok(ex.answer <= 20, ex.prompt);
    if (Array.isArray(ex.hear)) {
      const m = ex.prompt.match(/(\d+)\s*\+\s*(\d+)/);
      assert.ok(m, ex.prompt);
      assert.deepEqual(ex.hear, [Number(m[1]), Number(m[2])]);
    }
  }
  const a = variety.generateVariant('mm-cur-53', 0, { seed: 1 });
  const b = variety.generateVariant('mm-cur-53', 0, { seed: 4 });
  assert.equal(a.exerciseType, 'percent');
  assert.notEqual(a.numberKey, b.numberKey);
  const drums = 'תוף אחד מכה כל 2 פעימות ותוף שני כל 3 פעימות. אחרי כמה פעימות הם מכים שוב יחד?';
  const kept = vary('mm-cur-40', { skill: 'fractions', prompt: drums, answer: 6 }, 0);
  assert.equal(kept.prompt, drums);
  assert.equal(kept.answer, 6);
  assert.doesNotMatch(kept.prompt, /איזה שבר/);
  const spoken = vary('mm-cur-3', { skill: 'addition', prompt: '3 פעימות תוף ועוד 2 — כמה ביחד?', answer: 5 }, 1);
  assert.match(spoken.prompt, /פעימות תוף/);
  assert.equal(spoken.answer, 5);
});
