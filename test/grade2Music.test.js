const test = require('node:test');
const assert = require('node:assert/strict');

const g2 = require('../src/lib/grade2Music');
const engine = require('../src/lib/musicEngine');
const banks = require('../src/lib/banks');

const music = (name) => banks.itemsForGrade('ב').filter((it) => it.music === name);

test('a cube layer over 12 plays as tens and ones, not one sound per cube', () => {
  const dozen = g2.cubeLayerSounds(12);
  assert.equal(dozen.units, true);
  assert.equal(g2.cubeLayerEvents(12).length, 12);
  assert.ok(g2.cubeLayerEvents(12).every((e) => e.place === 'unit'));
  const layer = g2.cubeLayerSounds(24);
  assert.deepEqual({ tens: layer.tens, ones: layer.ones, units: layer.units }, { tens: 2, ones: 4, units: false });
  const played = g2.cubeLayerEvents(24);
  assert.equal(played.length, 6);
  assert.deepEqual(played.map((e) => e.place), ['ten', 'ten', 'one', 'one', 'one', 'one']);
  assert.ok(played.filter((e) => e.place === 'ten').every((e) => e.hz < played.find((x) => x.place === 'one').hz));
  assert.equal(g2.cubeLayerEvents(20).length, 2);
  assert.equal(g2.cubeLayerSounds(0), null);
});

test('even or odd by ear: a full pair at the end, or one beat left alone', () => {
  assert.deepEqual(g2.evenOddBeats(4), { count: 4, pairs: 2, leftover: 0, even: true });
  assert.deepEqual(g2.evenOddBeats(7), { count: 7, pairs: 3, leftover: 1, even: false });
  assert.deepEqual(g2.evenOddBeats(1), { count: 1, pairs: 0, leftover: 1, even: false });
  assert.equal(g2.evenOddBeats(0), null);
  assert.equal(g2.evenOddBeats(99), null);
  assert.equal(g2.evenOddBeats('x'), null);
});

test('the lone beat gets its own timbre, so the odd ending is audible', () => {
  const even = g2.evenOddEvents(6);
  assert.equal(even.length, 6);
  assert.equal(new Set(even.map((e) => e.hz)).size, 2, 'pairs alternate strong and weak');
  const odd = g2.evenOddEvents(7);
  assert.equal(odd.length, 7);
  assert.equal(new Set(odd.map((e) => e.hz)).size, 3);
  assert.notEqual(odd[6].hz, odd[5].hz);
  assert.notEqual(odd[6].hz, odd[4].hz);
  assert.deepEqual(g2.evenOddEvents(0), []);
});

test('the even/odd narration describes the pairs without naming the answer', () => {
  assert.match(g2.evenOddNarration(7), /3 זוגות/);
  assert.match(g2.evenOddNarration(7), /בלי זוג/);
  assert.doesNotMatch(g2.evenOddNarration(7), /אי-זוגי|אי־זוגי/);
  assert.doesNotMatch(g2.evenOddNarration(8), /זוגי/);
  assert.equal(g2.evenOddNarration(0), '');
});

test('vertical as two instruments: ones on the drum, tens on the bass', () => {
  const s = g2.verticalVoices({ a: 23, b: 14, op: '+' });
  assert.equal(s.total, 37);
  assert.equal(s.regroup, null);
  const drums = s.phases.filter((p) => p.voice === 'drum').map((p) => p.hits);
  const bass = s.phases.filter((p) => p.voice === 'bass').map((p) => p.hits);
  assert.deepEqual(drums, [3, 4]);
  assert.deepEqual(bass, [2, 1]);
});

test('a carry is 10 drum hits collapsing into one bass note', () => {
  const s = g2.verticalVoices({ a: 38, b: 25, op: '+' });
  assert.equal(s.total, 63);
  assert.equal(s.onesDigit, 3);
  assert.equal(s.tensDigit, 6);
  assert.deepEqual(s.regroup, { kind: 'carry', from: 'drum', to: 'bass', hits: 10, he: g2.CARRY_HE });
  // The collapse plays 10 fast drum hits and then exactly one bass note.
  const events = g2.phaseEvents([s.regroup]);
  assert.equal(events.length, 11);
  assert.equal(events.filter((e) => e.hz === g2.VOICES.drum.hz).length, 10);
  assert.equal(events.filter((e) => e.hz === g2.VOICES.bass.hz).length, 1);
  assert.ok(events[10].at > events[9].at, 'the bass note lands after the drum hits');
});

test('a borrow runs the same move backwards: one bass note into 10 drum hits', () => {
  const s = g2.verticalVoices({ a: 63, b: 28, op: '-' });
  assert.equal(s.total, 35);
  assert.equal(s.regroup.kind, 'borrow');
  assert.equal(s.regroup.he, g2.BORROW_HE);
  const events = g2.phaseEvents([s.regroup]);
  assert.equal(events.length, 11);
  assert.equal(events[0].hz, g2.VOICES.bass.hz, 'the bass note breaks first');
  assert.equal(events.filter((e) => e.hz === g2.VOICES.drum.hz).length, 10);
});

test('the vertical refuses what is not a grade-ב column', () => {
  assert.equal(g2.verticalVoices({ a: 120, b: 3, op: '+' }), null);
  assert.equal(g2.verticalVoices({ a: 24, b: 58, op: '-' }), null, 'no negative answers');
  assert.equal(g2.verticalVoices({ a: 70, b: 46, op: '-' }).total, 24);
});

test('a grade-ב column 14 + 6 resolves to 20 and regroups ten ones', () => {
  const s = g2.verticalVoices({ a: 14, b: 6, op: '+' });
  assert.ok(s);
  assert.equal(s.total, 20);
  assert.equal(s.regroup.kind, 'carry');
  assert.deepEqual(s.phases.filter((p) => p.voice === 'drum').map((p) => p.hits), [4, 6]);
});

test('bars × beats counts accents per bar without naming the product', () => {
  const s = g2.barsBeats(4, 4);
  assert.equal(s.total, 16);
  assert.equal(s.beats.filter((b) => b.accent).length, 4);
  assert.doesNotMatch(g2.barsBeatsNarration(4, 4), /\b16\b/);
  const long = g2.barsBeatsEvents(10, 4);
  assert.equal(long.length, 10, 'long pieces sample downbeats only');
  assert.equal(g2.barsBeatsEvents(3, 4).length, 12);
});

test('half a bar is strong then weak, like half an hour in a whole', () => {
  assert.equal(g2.halfBarSpec(4).half, 2);
  assert.equal(g2.halfBarEvents(4).length, 4);
  assert.match(g2.halfBarNarration(4), /חצי/);
  assert.doesNotMatch(g2.halfBarNarration(4), /\b2\b/);
});

test('three registers regroup 12 tens into 523 and 9/9/10 into 1,000', () => {
  const mid = g2.registerVoices({ h: 4, t: 12, o: 3 });
  assert.equal(mid.value, 523);
  assert.ok(mid.phases.some((p) => p.he === g2.TENS_TO_HUNDRED_HE));
  const top = g2.registerVoices({ h: 9, t: 9, o: 10 });
  assert.equal(top.value, 1000);
  assert.ok(top.phases.some((p) => p.he === g2.ONES_TO_TEN_HE));
});

test('every event the activities emit survives the engine unchanged', () => {
  const batches = [
    g2.evenOddEvents(11),
    g2.phaseEvents(g2.verticalVoices({ a: 85, b: 39, op: '-' }).phases),
    g2.phaseEvents(g2.verticalVoices({ a: 23, b: 14, op: '+' }).phases),
    g2.cubeLayerEvents(6),
    g2.cubeLayerEvents(24),
  ];
  batches.forEach((events) => {
    assert.ok(events.length, 'an activity with no sound is not an activity');
    const plan = engine.planSequence(events, 0);
    assert.equal(plan.length, events.length, 'the engine dropped an event');
    plan.forEach((n, i) => {
      assert.equal(n.hz, events[i].hz, 'clampHz moved a voice out of its register');
      assert.equal(n.gain, events[i].gain, 'clampGain moved a level');
      assert.ok(n.time >= 0 && n.dur > 0);
    });
  });
});

// §5 asks for at least 10 items per activity. All five ship in the bank, and
// all five now carry the widget spec that makes them audible.
test('the bank items carry a widget spec grade2Music can draw', () => {
  const kinds = {
    evenOdd: 'evenOdd', twoInstruments: 'duo',
    beatsBars: 'beatsBars', halfBar: 'halfBar', registers: 'registers',
  };
  Object.keys(kinds).forEach((name) => {
    const rows = music(name);
    assert.ok(rows.length >= 10, name + ' has only ' + rows.length + ' items');
    rows.forEach((it) => {
      assert.equal(it.widget, 'g2', it.id);
      assert.equal(it.g2.kind, kinds[name], it.id);
    });
  });
});

test('every spec resolves, and the pure logic agrees with the answers', () => {
  music('evenOdd').forEach((it) => {
    const s = g2.evenOddBeats(it.g2.beats);
    assert.ok(s, it.id);
    assert.equal(s.even ? 'זוגי' : 'אי-זוגי', it.answer, it.id);
  });
  music('twoInstruments').forEach((it) => {
    const s = g2.verticalVoices(it.g2);
    assert.ok(s, it.id);
    assert.equal(s.total, it.answer, it.id + ' ' + it.prompt);
  });
  music('beatsBars').forEach((it) => {
    const s = g2.barsBeats(it.g2.bars, it.g2.perBar);
    assert.ok(s, it.id);
    assert.equal(String(s.total), String(it.answer), it.id);
  });
  const tenFour = music('beatsBars').find((it) => it.g2.bars === 10 && it.g2.table === 10);
  assert.equal(tenFour.g2.perBar, 4, '10 bars of 4/4 is not the ×10 table');
  music('halfBar').forEach((it) => {
    assert.ok(g2.halfBarSpec(it.g2.beatsPerBar), it.id);
  });
  music('registers').forEach((it) => {
    const s = g2.registerVoices(it.g2);
    assert.ok(s, it.id);
    const ans = Number(it.answer);
    if (/במספר.*מאות/.test(it.prompt)) assert.equal(s.h, ans, it.id);
    else if (/במספר.*עשרות/.test(it.prompt)) assert.equal(s.t, ans, it.id);
    else assert.equal(s.value, ans, it.id);
  });
});

test('the music activities leave the 3/6/7/8/9 mastery gate alone', () => {
  const mastery = require('../src/lib/mastery');
  banks.itemsForGrade('ב').filter((it) => it.music).forEach((it) => {
    assert.equal(mastery.isBlockedItem(it), false, it.id + ' is tagged table ' + it.table);
    if (it.table != null) assert.ok(mastery.isCoreTable(it.table), it.id);
  });
  // The gate itself still names the same core and blocked tables.
  assert.deepEqual(mastery.CORE_TABLES, [2, 4, 5, 10]);
  assert.deepEqual(mastery.BLOCKED_TABLES, [3, 6, 7, 8, 9]);
});
