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

test('tempo percent is a weak optional extra that claims no research (Refs #755)', () => {
  TempoPercent.getTempoPercentItems().forEach(it => {
    assert.equal(it.musicOptional, true); assert.equal(it.musicEvidence, 'weak');
    assert.ok(!['D', 'R'].includes(it.musicEv));
  });
  // M8 has no evidence, so tempo is not even an optional curriculum way (musicMechanisms.test.js).
  const ways = require('../src/lib/curriculum/grade6.js').music.PERCENT;
  assert.ok(!ways.some(w => w[0] === 'tempoPercent'));
  assert.ok(banks.primaryWays(ways).every(w => banks.mechanismOf(w[0]) === 'M3'));
});

test('the path starts with an exact M3 bridge step from note lengths to tempo (Refs #755)', () => {
  const path = TempoPercent.getTempoPercentPath(), bridge = path[0];
  assert.equal(bridge.stage, 'bridge'); assert.equal(banks.mechanismOf(bridge.music), 'M3');
  assert.equal(bridge.answer, 10 * (1 - 10 / 100)); assert.match(bridge.hint, /BPM/);
  assert.equal(path[path.length - 1].musicStage, 'no_music_check');
});

test('the two tempos are played at their own timing and pitch (Refs #755)', () => {
  const item = TempoPercent.getTempoPercentItems()[0]; // 100 -> 110 BPM
  const both = TempoPercent.tempoSchedule(item, 'both');
  const base = both.filter(s => s.row === 'base'), chg = both.filter(s => s.row === 'changed');
  assert.equal(base.length, 8); assert.equal(chg.length, 8);
  assert.ok(base[7].t - chg[7].t > 0.35, 'after 8 sounds the rows are clearly apart');
  assert.notEqual(base[0].pitch, chg[0].pitch);
});

test('the bank generates the tempo items in grade 6 percent, so the screen is reached (Refs #755)', () => {
  const tempo = banks.rowsOf('percent', 'ו').filter(it => it.music === 'tempoPercent');
  assert.deepEqual(tempo.map(it => it.prompt), TempoPercent.getTempoPercentItems().map(it => it.prompt));
  tempo.forEach(it => assert.equal(it.standard, banks.ST.PERCENT, it.id));
  [1, 2, 3].forEach(l => assert.ok(tempo.some(it => it.level === l), 'level ' + l));
  // The main way of the topic stays M3; tempo is never one of its ways.
  const ways = require('../src/lib/curriculum/grade6.js').music.PERCENT;
  banks.rowsOf('percent', 'ו').filter(it => it.musicNote).forEach(it => assert.equal(banks.mechanismOf(it.music), 'M3', it.id));
  assert.ok(!ways.some(w => w[0] === 'tempoPercent'));
});

test('bank tempo items stay a weak EXTRA and carry what the circles screen needs (Refs #755)', () => {
  const tempo = banks.allItems().filter(it => it.music === 'tempoPercent');
  assert.ok(tempo.length > 0);
  tempo.forEach(it => {
    assert.equal(it.grade, 'ו'); assert.equal(it.musicOptional, true); assert.equal(it.musicEvidence, 'weak');
    assert.ok(!it.musicNote, it.id + ' is never shown as the main way');
    assert.ok(banks.MUSIC_SOURCES[it.musicSrc] && !['D', 'R'].includes(it.musicEv), it.id);
    assert.ok(it.baseBpm && it.circles && it.kind, it.id);
  });
  const html = TempoPercent.renderTempoCirclesHtml(tempo.find(it => it.kind === 'by_percent'));
  assert.ok(html.includes('קצב חדש (90 BPM)'));
});

test('index.html loads tempoPercent.js before banks.js so the browser bank sees it (Refs #755)', () => {
  const html = require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
  const tp = html.indexOf('src/lib/exercises/tempoPercent.js'), bk = html.indexOf('src/lib/banks.js');
  assert.ok(tp > 0 && tp < bk);
});
