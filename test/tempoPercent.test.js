// MelodyMath — Unit tests for Grade 6 Tempo Percents (Issue #690, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const TempoPercent = require('../src/lib/exercises/tempoPercent.js');
const banks = require('../src/lib/banks.js');
const instruments = require('../src/lib/instruments.js');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('tempo percent module exports 9 items with base tempo and +/- 10/25/50% (#690, Refs #665)', () => {
  const items = TempoPercent.getTempoPercentItems();
  assert.equal(items.length, 9);
  const changes = items.map(it => it.percentChange);
  [10, -10, 25, -25, 50, -50].forEach(p => assert.ok(changes.includes(p), 'Must include ' + p + '%'));
  const kinds = items.map(it => it.kind);
  assert.ok(kinds.includes('new_tempo') && kinds.includes('by_percent'));
  items.forEach(it => {
    assert.equal(it.grade, 'ו');
    assert.equal(it.skill, 'percent');
    assert.equal(it.music, 'tempoPercent');
    assert.equal(banks.mechanismOf(it.music), 'M8');
    if (it.kind === 'new_tempo') {
      assert.equal(it.answer, Math.round(it.baseBpm * (1 + it.percentChange / 100)), it.id);
      assert.match(it.prompt, /מה הקצב החדש/);
    } else {
      assert.equal(it.answer, Math.abs(Math.round(((it.newBpm - it.baseBpm) / it.baseBpm) * 100)), it.id);
      assert.match(it.prompt, /בכמה אחוזים/);
    }
  });
});

test('M8 has no research, so every item is weak optional extra with no outcome-research source', () => {
  assert.deepEqual(banks.MUSIC_MECHANISMS.M8.sources, []);
  TempoPercent.extraItems().forEach(it => {
    assert.equal(it.musicSrc, undefined, it.id + ' must not cite wnetMathInMusic');
    if (!it.music) return;
    assert.equal(it.musicEv, 'weak');
    assert.equal(it.optional, true);
    assert.equal(it.evidence, 'weak');
  });
  // Extras come after the bank's own percent items, never instead of them.
  assert.match(html, /rows=rows\.concat\(MM_TEMPO_PERCENT\.extraItems\(\)\)/);
  assert.ok(banks.rowsOf('percent', 'ו').length > 0);
});

test('circles differ before and after the change by exactly the percent, and the sound follows them', () => {
  TempoPercent.getTempoPercentItems().forEach(it => {
    const c = it.circles;
    assert.notEqual(c.baseSounds, c.changedSounds, it.id);
    assert.equal(c.changedSounds, Math.round(c.baseSounds * (100 + it.percentChange) / 100), it.id);
    assert.ok(Number.isInteger(c.changedSounds) && c.changedSounds <= 12, it.id);
    const notes = TempoPercent.tempoNotes(it, 'drumLow');
    assert.equal(notes.filter(n => n.row === 'base').length, c.baseSounds);
    assert.equal(notes.filter(n => n.row === 'changed').length, c.changedSounds);
    const ch = notes.filter(n => n.row === 'changed');
    if (ch.length > 1) assert.ok(Math.abs(ch[1].at - ch[0].at - 60 / (it.newBpm || it.answer)) < 1e-9, it.id + ' real tempo');
    const out = TempoPercent.renderTempoCirclesHtml(it);
    assert.equal((out.match(/base-dot/g) || []).length, c.baseSounds);
    assert.equal((out.match(/changed-dot/g) || []).length, c.changedSounds);
    assert.ok(out.includes('tp-play'));
  });
});

test('instruments rotate over all 4 families without a store, and follow MM_MY_INSTRUMENT when loaded', () => {
  const fams = new Set(TempoPercent.getTempoPercentItems().map(it => TempoPercent.instrumentFor(it, instruments).family));
  assert.equal(fams.size, 4);
  globalThis.MM_MY_INSTRUMENT = { getMyInstrument: () => ({ id: 'oud' }) };
  try { assert.equal(TempoPercent.instrumentFor(TempoPercent.TEMPO_PERCENT_ITEMS[0], instruments).id, 'oud'); }
  finally { delete globalThis.MM_MY_INSTRUMENT; }
});

test('index.html loads tempoPercent.js and renders it in the exercise widget', () => {
  assert.match(html, /<script src="src\/lib\/exercises\/tempoPercent\.js"><\/script>/);
  assert.match(html, /item\.widget==='tempoPercent'/);
});

test('end-of-topic no-music check item exists unassisted without musical cues (#690, Refs #665)', () => {
  const check = TempoPercent.getNoMusicCheck();
  assert.equal(check.grade, 'ו');
  assert.equal(check.skill, 'percent');
  assert.equal(check.noMusic, true);
  assert.equal(check.plain, true);
  assert.equal(check.musicStage, 'no_music_check');
  assert.equal(check.answer, 90);
  assert.equal(check.widget, undefined);
  assert.match(check.prompt, /קצב/);
});
