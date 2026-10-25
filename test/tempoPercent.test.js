// MelodyMath — Unit tests for Grade 6 Tempo Percents (Refs #690, Refs #665).
const test = require('node:test'), assert = require('node:assert/strict');
const TempoPercent = require('../src/lib/exercises/tempoPercent.js'), banks = require('../src/lib/banks.js');

test('tempo percent module exports at least 8 items with base tempo and +/- 10/25/50% (#690, Refs #665)', () => {
  const items = TempoPercent.getTempoPercentItems();
  assert.ok(items.length >= 8);
  const changes = items.map(it => it.percentChange), kinds = items.map(it => it.kind);
  [10, -10, 25, -25, 50, -50].forEach(p => assert.ok(changes.includes(p)));
  ['new_tempo', 'by_percent'].forEach(k => assert.ok(kinds.includes(k)));
  items.forEach(it => {
    assert.equal(it.grade, 'ו'); assert.equal(it.skill, 'percent'); assert.equal(it.music, 'tempoPercent');
    assert.equal(banks.mechanismOf(it.music), 'M8');
    if (it.kind === 'new_tempo') {
      assert.equal(it.answer, Math.round(it.baseBpm * (1 + it.percentChange / 100)));
      assert.match(it.prompt, /מה הקצב החדש/);
    } else {
      assert.equal(it.answer, Math.abs(Math.round(((it.newBpm - it.baseBpm) / it.baseBpm) * 100)));
      assert.match(it.prompt, /בכמה אחוזים/);
    }
  });
});

test('circles per sound visual scaffolding is rendered for tempo items (#690, Refs #665)', () => {
  const sample = TempoPercent.getTempoPercentItems()[0];
  assert.equal(sample.circles.baseSounds, 4);
  const html = TempoPercent.renderTempoCirclesHtml(sample);
  ['tempo-circles-widget', 'base-dot', 'changed-dot', 'data-beat="4"'].forEach(s => assert.ok(html.includes(s)));
});

test('end-of-topic no-music check item exists unassisted without musical cues (#690, Refs #665)', () => {
  const check = TempoPercent.getNoMusicCheck();
  assert.equal(check.grade, 'ו'); assert.equal(check.skill, 'percent'); assert.equal(check.noMusic, true);
  assert.equal(check.plain, true); assert.equal(check.musicStage, 'no_music_check');
  assert.ok(check.answer != null); assert.match(check.prompt, /קצב/);
});
