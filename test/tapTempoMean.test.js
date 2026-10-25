import { test } from 'node:test';
import assert from 'node:assert/strict';
import tapTempoMean from '../src/lib/exercises/tapTempoMean.js';

test('tapTempoMean module exports expected items and utilities', () => {
  assert.ok(tapTempoMean);
  assert.ok(Array.isArray(tapTempoMean.TAP_TEMPO_MEAN_ITEMS));
  assert.ok(tapTempoMean.TAP_TEMPO_MEAN_ITEMS.length >= 8);
  assert.strictEqual(typeof tapTempoMean.tapsToBpm, 'function');
  assert.strictEqual(typeof tapTempoMean.meanOf, 'function');
  assert.strictEqual(typeof tapTempoMean.renderTapTempoWidgetHtml, 'function');
});

test('every item is tagged to Grade 6 data/mean curriculum with verified math', () => {
  const items = tapTempoMean.getItems();
  assert.ok(items.length >= 8, 'Must have at least 8 items');

  let activeTapCount = 0;
  let noMusicCheckCount = 0;

  for (const item of items) {
    assert.strictEqual(item.grade, 'ו');
    assert.strictEqual(item.strand, 'data');
    assert.strictEqual(item.standard, 'G6_MEAN');
    assert.strictEqual(item.skill, 'mean');
    assert.ok(item.prompt && item.prompt.length > 5);
    assert.ok(item.hint && item.hint.length > 5);

    // Verify mathematical correctness
    const computedMean = tapTempoMean.meanOf(item.bpms);
    assert.strictEqual(computedMean, item.answer, `Item ${item.id} answer must equal calculated mean`);

    if (item.noMusic) {
      noMusicCheckCount++;
      assert.strictEqual(item.plain, true);
      assert.strictEqual(item.musicStage, 'no_music_check');
    } else {
      activeTapCount++;
      assert.ok(item.tapCount >= 4 && item.tapCount <= 6, `Tap count must be 4-6, got ${item.tapCount}`);
      assert.strictEqual(item.music, 'tapTempo');
    }
  }

  assert.ok(activeTapCount >= 7, 'Must have at least 7 interactive tap items');
  assert.ok(noMusicCheckCount >= 1, 'Must have at least 1 unassisted no-music check item');
});

test('tapsToBpm and meanOf calculate accurate BPM intervals and means', () => {
  // 4 taps at 750ms intervals -> 80 BPM (60000 / 750 = 80)
  const bpms = tapTempoMean.tapsToBpm([0, 750, 1500, 2250]);
  assert.deepEqual(bpms, [80, 80, 80]);
  assert.strictEqual(tapTempoMean.meanOf(bpms), 80);

  // 5 taps: intervals [600ms, 600ms, 600ms, 600ms] -> 100 BPM
  const bpms100 = tapTempoMean.tapsToBpm([0, 600, 1200, 1800, 2400]);
  assert.deepEqual(bpms100, [100, 100, 100, 100]);
  assert.strictEqual(tapTempoMean.meanOf(bpms100), 100);

  // Mean with decimal precision
  assert.strictEqual(tapTempoMean.meanOf([80, 81, 82, 84]), 81.75);

  // Widget html renderer
  const items = tapTempoMean.getItems();
  const htmlActive = tapTempoMean.renderTapTempoWidgetHtml(items[0]);
  assert.ok(htmlActive.includes('tap-mean-widget'));
  assert.ok(htmlActive.includes('80 BPM'));

  const htmlPlain = tapTempoMean.renderTapTempoWidgetHtml(items[items.length - 1]);
  assert.ok(htmlPlain.includes('tap-mean-plain'));
});
