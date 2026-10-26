// MelodyMath — percent bar: one bar = 100%, split 4/10/20 (Van den Heuvel-Panhuizen 2003). Refs #682 #665.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_PERCENT_MIX = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MECHANISM = 'M3', SUBBEATS = 100, DEFAULT_SPLIT = 10, SPLITS = Object.freeze([4, 10, 20]);
  const SOURCE = 'vanDenHeuvel2003', DOI = '10.1023/B:EDUC.0000005212.03219.dc', MIN_NOTE_SEC = 0.08, MIN_NOTE_MS = 80;

  const TEACHER_METADATA = Object.freeze({
    mechanism: MECHANISM, evidence: 'strong', optional: false, source: SOURCE, doi: DOI,
    buildsFrom: Object.freeze(['fractions', 'decimals']), buildsTo: 'ratio', splits: SPLITS, defaultSplit: DEFAULT_SPLIT,
    primary: Object.freeze({ id: 'percentBar', splits: SPLITS, defaultSplit: DEFAULT_SPLIT, evidence: 'strong' }),
    addon: Object.freeze({ id: 'subbeats100', subbeats: SUBBEATS, optional: true, evidence: 'experimental' })
  });

  function gcd(a, b) { while (b) { const t = b; b = a % b; a = t; } return a || 1; }
  function checkPercent(x) { if (!Number.isInteger(x) || x < 0 || x > 100) throw new RangeError('percent 0-100, got ' + x); }
  function splitOf(split) { return SPLITS.indexOf(split) >= 0 ? split : DEFAULT_SPLIT; }
  function fraction(x) { const g = gcd(x, 100); return x === 0 ? '0' : (x / g) + '/' + (100 / g); }

  function percentBar(x, split) {
    checkPercent(x);
    const s = splitOf(split);
    return { percent: x, split: s, beats: (x * s) / 100, totalBeats: s, fraction: fraction(x), decimal: x / 100,
      mechanism: MECHANISM, valueOf: function () { return x / 100; } };
  }

  function percentToSubbeats(x) {
    checkPercent(x);
    return { percent: x, subbeats: x, of: SUBBEATS, fraction: fraction(x), decimal: x / SUBBEATS, optional: true, evidence: 'experimental', addon: true };
  }

  const TILES = [
    { id: 'half', n: 50, percent: 50, he: '50% (חצי תיבה)' },
    { id: 'quarter', alias: 'beat', n: 25, percent: 25, he: '25% (רבע תיבה)', voices: ['drumLow', 'woodClick'] },
    { id: 'ten', n: 10, percent: 10, he: '10% (עשירית תיבה)' },
    { id: 'five', n: 5, percent: 5, he: '5 תת־פעמות', hidden: true },
    { id: 'one', n: 1, percent: 1, he: 'תת־פעמה (1%)', hidden: true },
  ];
  const VISIBLE_TILES = TILES.filter(function (t) { return !t.hidden; });
  function tile(id) { return TILES.filter(function (t) { return t.id === id || t.alias === id; })[0] || null; }
  function beatsHe(b) { return b === 1 ? 'פעמה' : b === 0.5 ? 'חצי פעמה' : b + ' פעמות'; }
  function tileLabel(id, split) {
    const t = tile(id), s = splitOf(split);
    return t ? t.percent + '% = ' + beatsHe((t.n * s) / 100) + ' מתוך ' + s : '';
  }

  function filled(fill) { return fill.reduce(function (s, id) { const t = tile(id); return s + (t ? t.n : 0); }, 0); }
  function checkFill(fill, target) {
    const sum = filled(fill);
    return { status: sum === target ? 'exact' : sum < target ? 'under' : 'over', missing: Math.max(0, target - sum), sum: sum };
  }

  function addTile(fill, id, target) {
    checkPercent(target);
    const t = tile(id), sum = filled(fill) + (t ? t.n : 0);
    if (!t || sum > target) return { accepted: false, fill: fill, over: t ? sum - target : 0, status: t ? 'over' : checkFill(fill, target).status };
    const next = fill.concat([id]);
    return { accepted: true, fill: next, over: 0, status: checkFill(next, target).status };
  }

  function barPlan(fill, bpm, voice, split) {
    const s = splitOf(split), barSec = (s / 4) * (60 / (bpm || 90)), notes = [];
    function note(at, dur, more) {
      const d = Math.max(MIN_NOTE_SEC, Math.round(dur * 1000) / 1000);
      notes.push(Object.assign({ at: Math.round(at * 1000) / 1000, dur: d, durMs: Math.max(MIN_NOTE_MS, Math.round(d * 1000)) }, more));
    }
    let pos = 0;
    fill.forEach(function (id, i) {
      const t = tile(id), n = t ? t.n : 0, at = (pos / 100) * barSec;
      note(at, (n / 100) * barSec, { voice: voice || 'drumLow', kind: 'tile', tile: i, percent: n });
      if (t && t.voices) note(at, MIN_NOTE_SEC, { voice: t.voices[1], hz: 1800, kind: 'tileBeat', tile: i });
      pos += n;
    });
    for (let b = 0, clicks = Math.ceil((pos / 100) * s); b < clicks; b++) note(b * (barSec / s), MIN_NOTE_SEC, { voice: 'woodClick', hz: 1800, kind: 'click', accent: clicks > 12 && (b + 1) % 5 === 0 });
    return notes.sort(function (a, b) { return a.at - b.at || (a.kind === 'click' ? 1 : -1); });
  }

  const TARGETS = [25, 50, 75, 10, 40, 60].map(function (p) {
    const allowed = p === 10 ? ['ten'] : p === 40 ? ['quarter', 'ten'] : p === 60 ? ['half', 'ten'] : ['half', 'quarter', 'ten'];
    return { percent: p, allowed: allowed, he: 'מלאו ' + p + '% מהתיבה' };
  });

  const NO_MUSIC_CHECK_ITEMS = [['כמה הם 25% מתוך 100?', 25], ['כמה הם 50% מתוך 80 תלמידים?', 40], ['איזה שבר פשוט שווה ל־10%?', '1/10', ['עשירית']]]
    .map(function (q, i) {
      return { id: 'percent-nm-' + (i + 1), topic: 'percent', grade: 'ו', standard: 'PERCENT', skill: 'percent', prompt: q[0], answer: q[1],
        altAnswers: q[2] || [], noMusic: true, plain: true, musicStage: 'no_music_check' };
    });
  function getNoMusicCheck() { return NO_MUSIC_CHECK_ITEMS[0]; }

  function specForItem(item) {
    if (!item || item.noMusic || (item.music !== 'percentBar' && item.widget !== 'percentBar')) return null;
    const m = String(item.prompt || '').match(/(\d+)\s*%/), percent = m ? Math.min(100, Number(m[1])) : 100;
    const split = SPLITS.indexOf(item.split) >= 0 ? item.split : ((percent * 4) % 100 === 0 ? 4 : (percent * 10) % 100 === 0 ? 10 : 20);
    const raw = (percent * split) / 100, n = Number.isInteger(raw) && raw > 0 ? raw : split;
    return { kind: 'percentBar', percent: percent, split: split, beats: n, circles: n };
  }
  function soundsOf(spec) { const notes = []; for (let i = 0; i < (spec && spec.circles || 0); i++) notes.push({ at: i * 0.2, dur: MIN_NOTE_SEC, durMs: MIN_NOTE_MS, voice: 'drumLow', kind: 'beat', circle: i }); return notes; }
  function circlesHtml(spec) {
    return '<div class="percent-bar" data-split="' + spec.split + '">' + soundsOf(spec).map(function (_, i) { return '<button type="button" class="snd-dot" data-tap="drumLow" data-i="' + i + '"></button>'; }).join('') + '<button type="button" class="snd-play">▶</button></div>';
  }
  function play(spec, env) { const jam = (env && env.jam) || (typeof globalThis !== 'undefined' && globalThis.MM_JAM), notes = soundsOf(spec); return jam && jam.playNotes ? jam.playNotes(notes) : { notes: notes }; }

  return { MECHANISM: MECHANISM, SUBBEATS: SUBBEATS, DEFAULT_SPLIT: DEFAULT_SPLIT, SPLITS: SPLITS, SOURCE: SOURCE, DOI: DOI,
    MIN_NOTE_SEC: MIN_NOTE_SEC, MIN_NOTE_MS: MIN_NOTE_MS, TEACHER_METADATA: TEACHER_METADATA, TILES: TILES, VISIBLE_TILES: VISIBLE_TILES,
    TARGETS: TARGETS, NO_MUSIC_CHECK_ITEMS: NO_MUSIC_CHECK_ITEMS, getNoMusicCheck: getNoMusicCheck, tile: tile, tileLabel: tileLabel,
    filled: filled, percentBar: percentBar, percentToSubbeats: percentToSubbeats, addTile: addTile, checkFill: checkFill, barPlan: barPlan,
    specForItem: specForItem, soundsOf: soundsOf, circlesHtml: circlesHtml, play: play };
});
