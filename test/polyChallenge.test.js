'use strict';
// #683: polyrhythm (M4) only as an optional challenge, Refs #665.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const grade5 = require('../src/lib/curriculum/grade5');
const pc = require('../src/lib/polyChallenge');

test('no lock (#717): grades ה׳-ו׳ always get the track', () => {
  assert.equal(pc.isAvailable(5), true);
  assert.equal(pc.isAvailable(6), true);
  assert.equal(pc.isAvailable('6'), true);
  assert.ok(Array.isArray(pc.track(5)));
  assert.equal(pc.track(6).length, pc.levels().length);
  assert.equal(pc.isUnlocked, undefined);
  assert.equal(pc.markM2Mastered, undefined);
});

test('only grades ה׳-ו׳ get the track', () => {
  [1, 2, 3, 4, 7].forEach((g) => {
    assert.equal(pc.isAvailable(g), false, 'grade ' + g);
    assert.equal(pc.track(g), null, 'grade ' + g);
  });
});

test('every level cites M4 research sources that exist', () => {
  pc.SOURCES.forEach((id) => {
    assert.ok(banks.MUSIC_SOURCES[id], id);
    assert.ok(banks.MUSIC_MECHANISMS.M4.sources.includes(id), id + ' in M4');
    assert.match(banks.MUSIC_SOURCES[id][1], /^https:\/\/doi\.org\//);
  });
  pc.levels().forEach((l) => assert.deepEqual(l.sources, pc.SOURCES));
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

test('the right reason is not always first: choices are shuffled', () => {
  const seeded = (seed) => () => { const x = Math.sin(++seed * 12.9898) * 43758.5453; return x - Math.floor(x); };
  const fixed = [...pc.level(0).reason.choices].sort();
  const positions = new Set();
  for (let s = 1; s <= 30; s++) {
    const l = pc.level(0, seeded(s));
    positions.add(l.reason.answer);
    assert.deepEqual([...l.reason.choices].sort(), fixed, 'same choices, new order');
    assert.match(l.reason.choices[l.reason.answer], /הכפולה הקטנה ביותר/);
  }
  assert.equal(positions.size, 3, 'the answer lands in every position');
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
