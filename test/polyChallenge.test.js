'use strict';
// #683: polyrhythm (M4) only as an optional challenge, Refs #665.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const grade5 = require('../src/lib/curriculum/grade5');
const pc = require('../src/lib/polyChallenge');

function memoryStorage() {
  const data = {};
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); } };
}

test('locked until the M2 mastery flag is set', () => {
  assert.equal(pc.isUnlocked(5, {}), false);
  assert.equal(pc.isUnlocked(5, { M2: false }), false);
  assert.equal(pc.isUnlocked(5, null), false);
  assert.equal(pc.track(6, {}), null);
  assert.equal(pc.isUnlocked(5, { M2: true }), true);
  assert.equal(pc.isUnlocked(6, { M2: true }), true);
  assert.ok(Array.isArray(pc.track(5, { M2: true })));
});

test('only grades ה׳-ו׳ get the track, even with M2 mastered', () => {
  [1, 2, 3, 4, 7].forEach((g) => assert.equal(pc.isUnlocked(g, { M2: true }), false, 'grade ' + g));
});

test('the M2 flag round-trips through storage and unlocks the track', () => {
  const s = memoryStorage();
  assert.equal(pc.isUnlocked(5, pc.readFlags(s)), false);
  assert.equal(pc.markM2Mastered(s), true);
  assert.equal(pc.isUnlocked(5, pc.readFlags(s)), true);
  assert.deepEqual(pc.readFlags(null), { M2: false });
  assert.deepEqual(pc.readFlags({ getItem: () => { throw new Error('blocked'); } }), { M2: false });
});

test('the first level is 2:3 and 2:3:5 is kept for the end', () => {
  const all = pc.levels();
  assert.equal(all[0].id, '2:3');
  assert.equal(all[0].meet, 6);
  assert.equal(all[all.length - 1].id, '2:3:5');
  assert.equal(all[all.length - 1].meet, 30);
  all.slice(0, -1).forEach((l) => assert.equal(l.voices.length, 2, l.id + ' should have two drums'));
  assert.equal(pc.level(99), null);
});

test('every level is optional, weak M4 evidence', () => {
  pc.levels().forEach((l) => {
    assert.equal(l.optional, true);
    assert.equal(l.mechanism, 'M4');
    assert.equal(l.evidence, 'weak');
  });
});

test('each voice has its own colour and its own screen side', () => {
  pc.levels().forEach((l) => {
    const colours = new Set(l.voices.map((v) => v.colour));
    const sides = new Set(l.voices.map((v) => v.side));
    assert.equal(colours.size, l.voices.length, l.id + ' colours');
    assert.equal(sides.size, l.voices.length, l.id + ' sides');
    l.voices.forEach((v) => assert.match(v.colour, /^#[0-9a-f]{6}$/));
  });
});

test('the "pick the reason" question and each choice are at most 15 words', () => {
  pc.levels().forEach((l) => {
    assert.ok(pc.wordCount(l.reason.question) <= pc.MAX_REASON_WORDS, l.reason.question);
    l.reason.choices.forEach((c) => assert.ok(pc.wordCount(c) <= pc.MAX_REASON_WORDS, c));
    assert.ok(l.reason.choices[l.reason.answer].includes(String(l.meet)));
  });
});

test('the track ends with a check with no music', () => {
  pc.levels().forEach((l) => {
    assert.equal(l.check.music, false);
    assert.equal(l.check.answer, l.meet);
  });
});

test("the topic's primary method is not M4", () => {
  assert.notEqual(pc.TOPIC_PRIMARY, 'M4');
  assert.ok(banks.MUSIC_DOSAGE.primary.includes(pc.TOPIC_PRIMARY));
  const ways = grade5.music[pc.TOPIC];
  const primary = banks.primaryWays(ways);
  assert.ok(primary.length > 0);
  primary.forEach(([tag]) => assert.notEqual(banks.mechanismOf(tag), 'M4', tag));
  assert.equal(banks.mechanismOf(primary[0][0]), pc.TOPIC_PRIMARY);
});
