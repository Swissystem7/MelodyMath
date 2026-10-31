// #591 MusicianshipPath: four music skills, timbreQuiz + pitchMatch scoring.
const test = require('node:test');
const assert = require('node:assert/strict');
const MS = require('../src/lib/music/musicianship.js');
const INS = require('../src/lib/instruments.js');
const VOICES = require('../src/lib/instrumentVoices.js').VOICES;

test('the path teaches the four skills: rhythm, pitch, families, timbre', () => {
  assert.deepEqual(MS.SKILL_IDS, ['rhythm', 'pitch', 'families', 'timbre']);
  const items = MS.buildPath(7);
  assert.equal(items.length, 8, '8 short items = about 2-3 minutes');
  MS.SKILL_IDS.forEach((id) => assert.equal(items.filter((x) => x.skill === id).length, 2, id));
  assert.deepEqual(MS.NOTES.map((n) => n.id), ['whole', 'half', 'quarter', 'eighth']);
});

test('generation is deterministic for a seed and differs across seeds', () => {
  assert.deepEqual(MS.buildPath(42), MS.buildPath(42));
  assert.notDeepEqual(MS.buildPath(42), MS.buildPath(43));
  const p = MS.recordResult(MS.initialProgress(), { skill: 'timbre', correct: true });
  assert.deepEqual(MS.buildPath(5, p), MS.buildPath(5, p));
});

test('rhythm items: every bar is exactly 4 beats, the options differ and the answer is the heard bar', () => {
  for (let seed = 1; seed <= 200; seed++) {
    const it = MS.rhythmItem(MS.rng(seed), seed % 2);
    assert.equal(it.options.length, 3);
    it.options.forEach((b) => assert.equal(MS.barBeats(b), 4, b.join(',')));
    assert.equal(new Set(it.options.map((b) => b.join(','))).size, 3);
    assert.deepEqual(it.options[it.answer], it.bar);
  }
  const plan = MS.rhythmPlan(['half', 'quarter', 'eighth', 'eighth'], 60);
  assert.deepEqual(plan.filter((n) => n.kind === 'note').map((n) => n.at), [0, 2, 3, 3.5]);
  assert.equal(plan.filter((n) => n.kind === 'click').length, 4);
});

test('families items use instruments.js FAMILIES and the real family of the instrument', () => {
  for (let seed = 1; seed <= 100; seed++) {
    const it = MS.familyItem(MS.rng(seed));
    assert.deepEqual(it.options, INS.FAMILIES);
    assert.equal(it.options[it.answer], INS.instrumentById(it.instrument).family);
  }
});

test('timbre items: 2-4 choices, each with a different instrumentVoices voice, the target among them', () => {
  assert.equal(MS.timbreChoices(0), 2);
  assert.equal(MS.timbreChoices(3), 3);
  assert.equal(MS.timbreChoices(99), 4);
  for (let n = 2; n <= 4; n++) {
    for (let seed = 1; seed <= 100; seed++) {
      const it = MS.timbreItem(MS.rng(seed), n);
      assert.equal(it.options.length, n);
      const voices = it.options.map((id) => INS.instrumentById(id).voice);
      assert.equal(new Set(voices).size, n, 'voices are distinct');
      voices.forEach((v) => assert.ok(VOICES[v], v + ' is a real voice'));
      assert.equal(it.options[it.answer], it.instrument);
      assert.equal(it.voice, INS.instrumentById(it.instrument).voice);
    }
  }
});

test('scoreTimbreQuiz: right by id or index scores 1, wrong scores 0 and names the answer', () => {
  const it = { skill: 'timbre', instrument: 'oud', voice: 'pluck', options: ['taiko', 'oud', 'ney'], answer: 1 };
  assert.deepEqual(MS.scoreTimbreQuiz(it, 'oud'), { skill: 'timbre', correct: true, score: 1, chosen: 'oud', answerId: 'oud' });
  assert.equal(MS.scoreTimbreQuiz(it, 1).score, 1);
  const wrong = MS.scoreTimbreQuiz(it, 'ney');
  assert.equal(wrong.correct, false);
  assert.equal(wrong.score, 0);
  assert.equal(wrong.answerId, 'oud');
  assert.equal(MS.scoreTimbreQuiz(it, 'piano').score, 0);
});

test('scorePitchMatch: exact = 1, within a whole tone = 0.5 with a direction, further = 0', () => {
  const it = { skill: 'pitch', mode: 'tone', ref: null, target: 4 };
  assert.deepEqual(MS.scorePitchMatch(it, 4), { skill: 'pitch', correct: true, score: 1, cents: 0, move: null });
  assert.equal(MS.scorePitchMatch(it, { hz: 395 }).score, 1, '13 cents off is still the same note');
  const low = MS.scorePitchMatch(it, 3);
  assert.equal(low.score, 0.5);
  assert.equal(low.move, 'higher');
  const high = MS.scorePitchMatch(it, 5);
  assert.equal(high.score, 0.5);
  assert.equal(high.move, 'lower');
});
