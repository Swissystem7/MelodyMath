// MelodyMath — percent bar: one bar = 100%, split 4/10/20 (Van den Heuvel-Panhuizen 2003). Refs #682 #665.
// TODO-source: there is no direct study of percent taught through musical sub-beats.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_PERCENT_MIX = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const MECHANISM = 'M3';
  const SUBBEATS = 100;
  const DEFAULT_SPLIT = 10;
  const SPLITS = Object.freeze([4, 10, 20]);
  const BEATS = 4;
  const PER_BEAT = SUBBEATS / BEATS; // 25
  const SOURCE = 'TODO-source';
  const DOI = '10.1023/B:EDUC.0000005212.03219.dc';
  const MIN_NOTE_SEC = 0.08;
  const MIN_NOTE_MS = 80;

  const TEACHER_METADATA = Object.freeze({
    mechanism: MECHANISM,
    evidence: 'strong',
    optional: false,
    source: SOURCE,
    doi: DOI,
    buildsFrom: Object.freeze(['fractions', 'decimals']),
    buildsTo: 'ratio',
    splits: SPLITS,
    defaultSplit: DEFAULT_SPLIT,
    primary: Object.freeze({ id: 'percentBar', splits: SPLITS, defaultSplit: DEFAULT_SPLIT, evidence: 'strong' }),
    addon: Object.freeze({ id: 'subbeats100', subbeats: SUBBEATS, optional: true, evidence: 'experimental' })
  });

  function gcd(a, b) {
    let x = Math.abs(a);
    let y = Math.abs(b);
    while (y) { const t = y; y = x % y; x = t; }
    return x || 1;
  }
  function checkPercent(x) {
    if (!Number.isInteger(x) || x < 0 || x > 100) throw new RangeError('percent 0-100, got ' + x);
  }
  function splitOf(split) { return SPLITS.indexOf(split) >= 0 ? split : DEFAULT_SPLIT; }
  function fraction(x) { const g = gcd(x, 100); return x === 0 ? '0' : (x / g) + '/' + (100 / g); }

  function percentBar(x, split) {
    checkPercent(x);
    const s = splitOf(split);
    return {
      percent: x,
      split: s,
      beats: (x * s) / 100,
      totalBeats: s,
      fraction: fraction(x),
      decimal: x / 100,
      mechanism: MECHANISM,
      valueOf: function () { return x / 100; }
    };
  }

  function percentToSubbeats(x) {
    checkPercent(x);
    const g = gcd(x, SUBBEATS);
    return {
      percent: x,
      subbeats: x,
      of: SUBBEATS,
      beats: x / PER_BEAT,
      fullBeats: Math.floor(x / PER_BEAT),
      restSubbeats: x % PER_BEAT,
      fraction: fraction(x),
      decimal: x / SUBBEATS,
      optional: true,
      evidence: 'experimental',
      addon: true,
      mechanism: MECHANISM,
      source: SOURCE
    };
  }

  function subbeatsToPercent(n, total) {
    const t = total || SUBBEATS;
    if (!Number.isInteger(n) || n < 0 || n > t) throw new RangeError('sub-beats out of the bar: ' + n);
    return (n * 100) / t;
  }

  function percentOf(p, total) {
    checkPercent(p);
    const t = total === undefined ? SUBBEATS : total;
    if (typeof t !== 'number' || !Number.isFinite(t) || t < 0) throw new RangeError('total must be a non-negative number: ' + t);
    return (p * t) / 100;
  }

  const TILES = [
    { id: 'half', n: 50, subbeats: 50, percent: 50, he: '50% (חצי תיבה)' },
    { id: 'quarter', alias: 'beat', n: 25, subbeats: 25, percent: 25, he: '25% (רבע תיבה)', voices: ['drumLow', 'woodClick'] },
    { id: 'ten', n: 10, subbeats: 10, percent: 10, he: '10% (עשירית תיבה)' },
    { id: 'five', n: 5, subbeats: 5, percent: 5, he: '5 תת־פעמות', hidden: true },
    { id: 'one', n: 1, subbeats: 1, percent: 1, he: 'תת־פעמה (1%)', hidden: true },
  ];
  const VISIBLE_TILES = TILES.filter(function (t) { return !t.hidden; });
  function tile(id) {
    return TILES.filter(function (t) { return t.id === id || t.alias === id; })[0] || null;
  }
  function beatsHe(b) { return b === 1 ? 'פעמה' : b === 0.5 ? 'חצי פעמה' : b + ' פעמות'; }
  function tileLabel(id, split) {
    const t = tile(id), s = splitOf(split);
    return t ? t.percent + '% = ' + beatsHe((t.n * s) / 100) + ' מתוך ' + s : '';
  }

  function filled(fill) {
    return fill.reduce(function (s, id) { const t = tile(id); return s + (t ? t.n : 0); }, 0);
  }
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

  const TEN_STEPS_HZ = Object.freeze([261.63, 293.66, 329.63, 392, 440, 523.25, 587.33, 659.25, 783.99, 880]);
  function partnerInstrument(family) { return family === 'percussion' ? 'erhu' : 'darbuka'; }
  function libOf(which) {
    if (which === 'my' && typeof globalThis !== 'undefined' && globalThis.MM_MY_INSTRUMENT) return globalThis.MM_MY_INSTRUMENT;
    if (which === 'instruments' && typeof globalThis !== 'undefined' && typeof globalThis.instrumentById === 'function') return globalThis;
    try { return require(which === 'my' ? '../myInstrument.js' : '../instruments.js'); } catch (e) { return null; }
  }

  function familyVoices(storage) {
    const data = libOf('instruments'), my = libOf('my');
    const id = my && my.instrumentFor ? my.instrumentFor('darbuka', null, storage) : 'darbuka';
    const main = (data && data.instrumentById && data.instrumentById(id)) || { id: 'darbuka', family: 'percussion', voice: 'drumLow' };
    const partner = (data && data.instrumentById && data.instrumentById(partnerInstrument(main.family))) || { voice: 'bowed', family: 'strings', id: 'erhu' };
    const melodic = main.family !== 'percussion';
    return {
      id: main.id,
      family: main.family,
      main: main,
      partner: partner,
      drum: melodic ? partner.voice : main.voice,
      melody: melodic ? main.voice : partner.voice,
      partnerId: partner.id,
      partnerFamily: partner.family
    };
  }

  function barPlan(fill, bpm, voice, split, melodyVoice) {
    const s = split !== undefined ? splitOf(split) : 4;
    const beat = 60 / (bpm || 90);
    const barSec = beat * 4;
    const notes = [];
    const hasTen = fill.indexOf('ten') >= 0;
    let pos = 0, step = 0;
    function note(at, dur, extra) {
      const d = Math.max(MIN_NOTE_SEC, Math.round(dur * 1000) / 1000);
      const dMs = Math.max(MIN_NOTE_MS, Math.round(d * 1000));
      notes.push(Object.assign({ at: Math.round(at * 1000) / 1000, dur: d, durMs: dMs }, extra));
    }
    fill.forEach(function (id, i) {
      const t = tile(id), n = t ? t.n : 0;
      const at = (pos / 100) * barSec;
      const sing = melodyVoice && (n === 10 || (!hasTen && (n === 25 || n === 50)));
      const chosen = { voice: sing ? melodyVoice : (voice || 'drumLow') };
      if (sing && n === 10) chosen.hz = TEN_STEPS_HZ[step++ % TEN_STEPS_HZ.length];
      note(at, (n / 100) * barSec, Object.assign(chosen, { kind: 'tile', tile: i, percent: n }));
      if (t && t.voices) note(at, MIN_NOTE_SEC, { voice: t.voices[1], hz: 1800, kind: 'tileBeat', tile: i });
      pos += n;
    });
    const tiles = notes.filter(function (n) { return n.kind === 'tile'; });
    const allMelody = !!(melodyVoice && tiles.length && tiles.every(function (n) { return n.voice === melodyVoice; }));
    const clickVoice = allMelody ? (voice || 'drumLow') : 'woodClick';
    const numClicks = Math.ceil((pos / 100) * s);
    for (let b = 0; b < numClicks; b++) {
      note(b * (barSec / s), MIN_NOTE_SEC, { voice: clickVoice, hz: 1800, kind: 'click', accent: numClicks > 12 && (b + 1) % 5 === 0 });
    }
    return notes.sort(function (a, b) { return a.at - b.at || (a.kind === 'click' ? 1 : -1); });
  }

  const TARGETS = [
    { percent: 25, allowed: ['half', 'quarter', 'ten'], he: 'מלאו 25% מהתיבה' },
    { percent: 50, allowed: ['half', 'quarter', 'ten'], he: 'מלאו 50% מהתיבה' },
    { percent: 75, allowed: ['half', 'quarter', 'ten'], he: 'מלאו 75% מהתיבה' },
    { percent: 10, allowed: ['quarter', 'ten'], he: 'מלאו 10% מהתיבה' },
    { percent: 40, allowed: ['quarter', 'ten'], he: 'מלאו 40% מהתיבה' },
    { percent: 60, allowed: ['half', 'quarter', 'ten'], he: 'מלאו 60% מהתיבה' },
  ];

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

  function groupBeats(split) { return splitOf(split) === 4 ? 4 : 5; }

  function soundsOf(spec, storage) {
    const v = familyVoices(storage), count = spec && spec.circles || 0, group = groupBeats(spec && spec.split), notes = [];
    for (let i = 0; i < count; i++) {
      const accent = i % group === 0;
      const note = { at: i * 0.2, dur: MIN_NOTE_SEC, durMs: MIN_NOTE_MS, voice: accent ? v.melody : v.drum, kind: 'beat', circle: i };
      if (accent) note.hz = TEN_STEPS_HZ[Math.floor(i / group) % TEN_STEPS_HZ.length];
      notes.push(note);
      if (count === 1) notes.push({ at: 0, dur: MIN_NOTE_SEC, durMs: MIN_NOTE_MS, voice: v.drum, kind: 'beat', circle: i });
    }
    return notes;
  }

  function circlesHtml(spec, storage) {
    const seen = {};
    const dots = soundsOf(spec, storage).filter(function (n) { if (seen[n.circle]) return false; seen[n.circle] = true; return true; }).map(function (n) {
      return '<button type="button" class="snd-dot" data-tap="' + n.voice + '"' + (n.hz ? ' data-hz="' + n.hz + '"' : '') + ' data-i="' + n.circle + '"></button>';
    }).join('');
    return '<div class="percent-bar" data-split="' + spec.split + '">' + dots + '<button type="button" class="snd-play">▶</button></div>';
  }

  function play(spec, env) {
    const jam = (env && env.jam) || (typeof globalThis !== 'undefined' && globalThis.MM_JAM);
    const notes = soundsOf(spec, env && env.storage);
    return jam && jam.playNotes ? jam.playNotes(notes) : { notes: notes };
  }

  return {
    MECHANISM: MECHANISM,
    SUBBEATS: SUBBEATS,
    DEFAULT_SPLIT: DEFAULT_SPLIT,
    SPLITS: SPLITS,
    BEATS: BEATS,
    PER_BEAT: PER_BEAT,
    SOURCE: SOURCE,
    DOI: DOI,
    MIN_NOTE_SEC: MIN_NOTE_SEC,
    MIN_NOTE_MS: MIN_NOTE_MS,
    TEACHER_METADATA: TEACHER_METADATA,
    TILES: TILES,
    VISIBLE_TILES: VISIBLE_TILES,
    TARGETS: TARGETS,
    NO_MUSIC_CHECK_ITEMS: NO_MUSIC_CHECK_ITEMS,
    getNoMusicCheck: getNoMusicCheck,
    tile: tile,
    tileLabel: tileLabel,
    filled: filled,
    percentBar: percentBar,
    percentToSubbeats: percentToSubbeats,
    subbeatsToPercent: subbeatsToPercent,
    percentOf: percentOf,
    addTile: addTile,
    checkFill: checkFill,
    barPlan: barPlan,
    specForItem: specForItem,
    soundsOf: soundsOf,
    circlesHtml: circlesHtml,
    play: play,
    TEN_STEPS_HZ: TEN_STEPS_HZ,
    partnerInstrument: partnerInstrument,
    familyVoices: familyVoices,
    groupBeats: groupBeats
  };
});
