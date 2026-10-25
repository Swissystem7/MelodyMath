// MelodyMath — Unit tests for Grade 6 Tempo Percents (Issue #690, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');
const TempoPercent = require('../src/lib/exercises/tempoPercent.js');
const banks = require('../src/lib/banks.js');

test('tempo percent module exports at least 8 items with base tempo and +/- 10/25/50% (#690, Refs #665)', () => {
  const items = TempoPercent.getTempoPercentItems();
  assert.ok(items.length >= 8, 'Must have at least 8 tempo percent items, got ' + items.length);

  // Check percent changes include +/-10%, 25%, 50%
  const changes = items.map(it => it.percentChange);
  assert.ok(changes.includes(10), 'Must include +10%');
  assert.ok(changes.includes(-10), 'Must include -10%');
  assert.ok(changes.includes(25), 'Must include +25%');
  assert.ok(changes.includes(-25), 'Must include -25%');
  assert.ok(changes.includes(50), 'Must include +50%');
  assert.ok(changes.includes(-50), 'Must include -50%');

  // Check both question formats exist
  const kinds = items.map(it => it.kind);
  assert.ok(kinds.includes('new_tempo'), 'Must have new_tempo items');
  assert.ok(kinds.includes('by_percent'), 'Must have by_percent items');

  // Verify mathematical correctness of all items
  items.forEach(it => {
    assert.equal(it.grade, 'ו');
    assert.equal(it.skill, 'percent');
    assert.equal(it.music, 'tempoPercent');
    assert.equal(banks.mechanismOf(it.music), 'M8');

    if (it.kind === 'new_tempo') {
      const expected = Math.round(it.baseBpm * (1 + it.percentChange / 100));
      assert.equal(it.answer, expected, 'Item ' + it.id + ' answer must match calculation');
      assert.match(it.prompt, /מה הקצב החדש/);
    } else if (it.kind === 'by_percent') {
      const expectedPct = Math.abs(Math.round(((it.newBpm - it.baseBpm) / it.baseBpm) * 100));
      assert.equal(it.answer, expectedPct, 'Item ' + it.id + ' answer must match percent change');
      assert.match(it.prompt, /בכמה אחוזים/);
    }
  });
});

test('circles per sound visual scaffolding is rendered for tempo items (#690, Refs #665)', () => {
  const items = TempoPercent.getTempoPercentItems();
  const sample = items[0];
  assert.ok(sample.circles, 'Item must have circles metadata');
  assert.equal(sample.circles.baseSounds, 4);

  const html = TempoPercent.renderTempoCirclesHtml(sample);
  assert.ok(html.includes('tempo-circles-widget'));
  assert.ok(html.includes('base-dot'));
  assert.ok(html.includes('changed-dot'));
  assert.ok(html.includes('data-beat="4"'));
});

test('end-of-topic no-music check item exists unassisted without musical cues (#690, Refs #665)', () => {
  const check = TempoPercent.getNoMusicCheck();
  assert.ok(check);
  assert.equal(check.grade, 'ו');
  assert.equal(check.skill, 'percent');
  assert.equal(check.noMusic, true);
  assert.equal(check.plain, true);
  assert.equal(check.musicStage, 'no_music_check');
  assert.ok(check.answer != null);
  assert.match(check.prompt, /קצב/);
});
