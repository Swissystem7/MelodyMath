'use strict';
// Grade 6 tap tempo mean (Refs #690, Refs #665, Refs #754): mm-cur-57 link, the
// levelNotes → BPM bridge, an exact mean, the azaryahu2020 source and tap sound.
const test = require('node:test');
const assert = require('node:assert/strict');
const tapTempoMean = require('../src/lib/exercises/tapTempoMean');
const curriculum = require('../src/lib/curriculum');
const progression = require('../src/lib/curriculum/progression');
const g6 = require('../src/lib/curriculum/grade6');
const banks = require('../src/lib/banks');
const instruments = require('../src/lib/instruments');
const voices = require('../src/lib/instrumentVoices');

test('every item is a G6 mean item on mm-cur-57 with a real source and an exact mean', () => {
  const items = tapTempoMean.getItems();
  assert.ok(items.length >= 8);
  const row = curriculum.MATRIX.find((r) => r.topicId === 'mm-cur-57');
  assert.deepEqual([row.grade, row.topic], ['ו', 'ממוצע']);
  const links = progression.linksForTopic('mm-cur-57');
  assert.deepEqual([links.prereq, links.carries], [['mm-cur-49', 'mm-cur-39'], 'mean']);
  const [label, url] = banks.MUSIC_SOURCES.azaryahu2020;
  assert.ok(label.includes('Azaryahu'));
  assert.match(url, /^https:\/\/pmc\.ncbi\.nlm\.nih\.gov\/articles\/PMC/);
  for (const item of items) {
    assert.deepEqual([item.grade, item.strand, item.standard, item.skill], ['ו', 'data', 'G6_MEAN', 'mean']);
    const s = curriculum.sectionForItem(item);
    assert.deepEqual([s.grade, s.topic, s.verified, s.label], ['ו', 'ממוצע', true, 'ממוצע'], item.id);
    assert.equal(curriculum.MATRIX.find((r) => r.grade === item.grade && r.topic === s.topic).topicId, 'mm-cur-57');
    if (!item.noMusic) assert.deepEqual([item.music, item.musicSrc, item.musicEv, item.optional, item.evidence], ['tapTempo', 'azaryahu2020', 'A', true, 'weak'], item.id);
    const list = item.intervals;
    assert.equal(item.bpms, undefined, item.id + ' keeps its gaps in intervals only');
    assert.ok(list.length >= 3);
    const exact = Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 100) / 100;
    assert.equal(tapTempoMean.meanOf(list), item.answer);
    assert.equal(exact, item.answer, item.id + ' answer is sum/count');
  }
});

test('G6_MEAN: levelNotes is the one main way; tapTempo (M3) is a weak EXTRA bridge to BPM; pitchMean stays weak EXTRA', () => {
  const ways = g6.music.G6_MEAN;
  assert.deepEqual(ways.map((w) => w[0]), ['levelNotes', 'tapTempo', 'equalPhrases', 'pitchMean']);
  assert.deepEqual(banks.primaryWays(ways).map((w) => w[0]), ['levelNotes']);
  const [, tapNote, tapSrc, tapEv] = ways[1];
  assert.match(tapNote, /מרווח.*BPM/);
  assert.deepEqual([tapSrc, tapEv, banks.isOptionalWay(ways[1]), ways[1][4].evidence], ['azaryahu2020', 'A', true, 'weak']);
  assert.equal(banks.mechanismOf('tapTempo'), 'M3');
  const pitch = ways[3];
  assert.deepEqual([pitch[2], pitch[3], banks.isOptionalWay(pitch), pitch[4].evidence], ['rusconi2005', 'A', true, 'weak']);
});

test('averaging BPMs is wrong; averaging intervals gives the true tempo', () => {
  const taps = [0, 666.6667, 1266.6667, 1812.1212]; // 90, 100, 110 BPM
  const bpms = tapTempoMean.tapsToBpm(taps);
  assert.deepEqual(bpms.map(Math.round), [90, 100, 110]);
  assert.equal(tapTempoMean.meanOf(bpms), 100);
  assert.equal(tapTempoMean.trueAverageBpm(taps), 99.33);
  assert.equal(tapTempoMean.meanOf([5, 6, 7]), 6);
  assert.equal(tapTempoMean.meanIntervalToBpm(6), 100);
  assert.equal(tapTempoMean.meanOf([7, 8, 8, 10]), 8.25);
});

test('widget shows taps, gaps and the tap cue; the check stage is plain', () => {
  const items = tapTempoMean.getItems();
  const html = tapTempoMean.renderTapTempoWidgetHtml(items[0]);
  ['tap-mean-widget', '4 הקשות יוצרות 3 מרווחי זמן:', '🎵 הקשה לקצב', 'data-voice="' + tapTempoMean.TAP_VOICE + '"']
    .forEach((s) => assert.ok(html.includes(s), s));
  const plain = tapTempoMean.renderTapTempoWidgetHtml(items[items.length - 1]);
  assert.ok(plain.includes('tap-mean-plain') && plain.includes('שלב בדיקה'));
});

test('each tap plays the picked instrument (wood click by default) and the taps reach the mean', () => {
  const djembe = instruments.instrumentById('djembe').voice;
  const darbuka = instruments.instrumentById('darbuka').voice;
  assert.ok(voices.VOICES[tapTempoMean.TAP_VOICE] && voices.VOICES[djembe]);
  assert.notEqual(djembe, tapTempoMean.TAP_VOICE);
  assert.equal(tapTempoMean.tapVoiceFor('djembe'), djembe);
  assert.equal(tapTempoMean.tapVoiceFor(null), tapTempoMean.TAP_VOICE);
  assert.equal(tapTempoMean.tapVoiceFor('noSuchInstrument'), tapTempoMean.TAP_VOICE);

  [[undefined, Array(4).fill(tapTempoMean.TAP_VOICE)], ['djembe', [djembe, djembe, djembe, darbuka]]].forEach(([pick, want]) => {
    const times = [0, 500, 1100, 1800];
    const played = [];
    let click = null;
    let picked = pick;
    const btn = { addEventListener: (ev, fn) => { assert.equal(ev, 'click'); click = fn; } };
    const box = { querySelector: (sel) => (sel === '.btn-tap-cue' ? btn : null) };
    const session = tapTempoMean.attachTapButton(box,
      { instrument: () => picked, now: () => times[played.length], play: (v) => played.push(v) });
    click(); click(); click();
    if (pick) picked = 'darbuka';
    click();
    assert.deepEqual(played, want, 'the voice follows the pick at each tap');
    assert.deepEqual(session.taps(), times);
    assert.deepEqual(session.intervals(), [5, 6, 7]);
    assert.equal(tapTempoMean.meanIntervalToBpm(session.mean()), 100);
  });
});
