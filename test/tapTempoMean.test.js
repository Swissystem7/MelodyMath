'use strict';
// MelodyMath — Unit tests for Grade 6 tapTempoMean module (Refs #690, Refs #665).
// Tests requirements:
// (a) link to curriculum item mm-cur-57
// (b) bridge step from levelNotes to BPM
// (c) exact arithmetic mean (mean = sum/count) and average tempo resolution
// (d) verifiable research source (azaryahu2020 instead of circleOfFifths)
const test = require('node:test');
const assert = require('node:assert/strict');
const tapTempoMean = require('../src/lib/exercises/tapTempoMean');
const curriculum = require('../src/lib/curriculum');
const progression = require('../src/lib/curriculum/progression');
const g6 = require('../src/lib/curriculum/grade6');
const banks = require('../src/lib/banks');

test('tapTempoMean module exports expected items and utilities', () => {
  assert.ok(tapTempoMean);
  assert.ok(Array.isArray(tapTempoMean.TAP_TEMPO_MEAN_ITEMS));
  assert.ok(tapTempoMean.TAP_TEMPO_MEAN_ITEMS.length >= 8);
  assert.strictEqual(typeof tapTempoMean.tapsToBpm, 'function');
  assert.strictEqual(typeof tapTempoMean.tapsToIntervals, 'function');
  assert.strictEqual(typeof tapTempoMean.meanOf, 'function');
  assert.strictEqual(typeof tapTempoMean.trueAverageBpm, 'function');
  assert.strictEqual(typeof tapTempoMean.meanIntervalToBpm, 'function');
  assert.strictEqual(typeof tapTempoMean.renderTapTempoWidgetHtml, 'function');
});

test('(a) all items link to curriculum item mm-cur-57 via sectionForItem', () => {
  const items = tapTempoMean.getItems();
  assert.ok(items.length >= 8);

  const mmCur57Row = curriculum.MATRIX.find((r) => r.topicId === 'mm-cur-57');
  assert.ok(mmCur57Row, 'mm-cur-57 must exist in curriculum.MATRIX');
  assert.strictEqual(mmCur57Row.grade, 'ו');
  assert.strictEqual(mmCur57Row.topic, 'ממוצע');

  const links = progression.linksForTopic('mm-cur-57');
  assert.ok(links, 'progression must have links for mm-cur-57');
  assert.deepEqual(links.prereq, ['mm-cur-49', 'mm-cur-39']);
  assert.strictEqual(links.carries, 'mean');

  for (const item of items) {
    assert.strictEqual(item.grade, 'ו');
    assert.strictEqual(item.strand, 'data');
    assert.strictEqual(item.standard, 'G6_MEAN');
    assert.strictEqual(item.skill, 'mean');

    const s = curriculum.sectionForItem(item);
    assert.ok(s, `item ${item.id} must be tagged by sectionForItem`);
    assert.strictEqual(s.grade, 'ו');
    assert.strictEqual(s.topic, 'ממוצע');
    assert.strictEqual(s.verified, true);
    assert.strictEqual(s.label, 'ממוצע');

    const matchedRow = curriculum.MATRIX.find((r) => r.grade === item.grade && r.topic === s.topic);
    assert.strictEqual(matchedRow.topicId, 'mm-cur-57');
  }
});

test('(b) bridge step from levelNotes to BPM is registered in Grade 6 curriculum', () => {
  const ways = g6.music.G6_MEAN;
  assert.ok(Array.isArray(ways));
  assert.strictEqual(ways.length, 3, 'G6_MEAN must have 3 ways');

  assert.strictEqual(ways[0][0], 'levelNotes');
  assert.strictEqual(ways[1][0], 'tapTempo', 'tapTempo must be the second way bridging to BPM');
  assert.strictEqual(ways[2][0], 'equalPhrases');

  const tapWay = ways[1];
  assert.match(tapWay[1], /מרווח/);
  assert.match(tapWay[1], /BPM/);
  assert.strictEqual(tapWay[2], 'azaryahu2020');
  assert.strictEqual(tapWay[3], 'A');

  // Verify mechanism mapping in banks.js
  assert.strictEqual(banks.mechanismOf('tapTempo'), 'M3', 'tapTempo belongs to M3 (durations)');
});

test('(c) arithmetic mean computation is exact (mean = sum/count) and resolves BPM rate fallacy', () => {
  const items = tapTempoMean.getItems();
  for (const item of items) {
    const list = item.intervals || item.bpms;
    assert.ok(Array.isArray(list) && list.length >= 3);

    let sum = 0;
    for (let i = 0; i < list.length; i++) sum += list[i];
    const expectedMean = Math.round((sum / list.length) * 100) / 100;
    assert.strictEqual(tapTempoMean.meanOf(list), item.answer);
    assert.strictEqual(expectedMean, item.answer, `mean of ${item.id} must equal sum/count exactly`);
  }

  // Demonstration of mathematical fix:
  // Intervals corresponding to 90, 100, 110 BPM (approx 666.67, 600, 545.45 ms)
  const taps = [0, 666.6667, 1266.6667, 1812.1212];
  const bpms = tapTempoMean.tapsToBpm(taps);
  assert.strictEqual(Math.round(bpms[0]), 90);
  assert.strictEqual(Math.round(bpms[1]), 100);
  assert.strictEqual(Math.round(bpms[2]), 110);

  // Directly averaging the BPM rates gives 100, which is mathematically false:
  assert.strictEqual(tapTempoMean.meanOf(bpms), 100);

  // The true physical tempo of these taps is ~99.33 BPM:
  const trueBpm = tapTempoMean.trueAverageBpm(taps);
  assert.strictEqual(trueBpm, 99.33);

  // The interval duration bridge solves this:
  // [5, 6, 7] tenths of a second has sum=18, count=3, mean=6 tenths of a second exactly:
  const intervalDurations = [5, 6, 7];
  assert.strictEqual(tapTempoMean.meanOf(intervalDurations), 6);
  assert.strictEqual(tapTempoMean.meanIntervalToBpm(6), 100);

  // Decimal precision at level 3
  assert.strictEqual(tapTempoMean.meanOf([7, 8, 8, 10]), 8.25);
});

test('(d) real verifiable source azaryahu2020 replaces fake circleOfFifths source', () => {
  const items = tapTempoMean.getItems();
  assert.ok(banks.MUSIC_SOURCES.azaryahu2020, 'azaryahu2020 must be in banks.MUSIC_SOURCES');
  const [label, url] = banks.MUSIC_SOURCES.azaryahu2020;
  assert.ok(label.includes('Azaryahu'));
  assert.match(url, /^https:\/\/pmc\.ncbi\.nlm\.nih\.gov\/articles\/PMC/);

  for (const item of items) {
    if (!item.noMusic) {
      assert.strictEqual(item.music, 'tapTempo');
      assert.strictEqual(item.musicSrc, 'azaryahu2020', 'must cite real source azaryahu2020');
      assert.notStrictEqual(item.musicSrc, 'circleOfFifths', 'fake circleOfFifths must not be used');
      assert.strictEqual(item.musicEv, 'A');
    }
  }
});

test('widget rendering reflects tap and interval counts and button cue', () => {
  const items = tapTempoMean.getItems();
  const htmlActive = tapTempoMean.renderTapTempoWidgetHtml(items[0]);
  assert.ok(htmlActive.includes('tap-mean-widget'));
  assert.ok(htmlActive.includes('4 הקשות יוצרות 3 מרווחי זמן:'));
  assert.ok(htmlActive.includes('🎵 הקשה לקצב'));

  const htmlPlain = tapTempoMean.renderTapTempoWidgetHtml(items[items.length - 1]);
  assert.ok(htmlPlain.includes('tap-mean-plain'));
  assert.ok(htmlPlain.includes('שלב בדיקה'));
});
