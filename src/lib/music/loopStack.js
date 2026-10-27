// MelodyMath — LoopStack: box volume as stacked loop layers, grade ו׳
// (mm-cur-56). Refs #591. Not a new way: it is `cubeLayerGroups` from ד׳
// MASS_VOL, same name and sound (grade2Music.cubeLayerSounds): the base a×b
// is one layer loop, the height c is how many times it repeats, so the volume
// is c equal groups of the layer. Up to 12 a layer is one beat per cube; above
// 12 a ten is one held sound in that voice's band (110 Hz is silent on a phone
// and on the djembe) and the ones play on woodClick. EXTRA: another family per layer.
(function (root, factory) {
  const IN_NODE = typeof module === 'object' && !!module.exports;
  const api = factory(IN_NODE ? require('../grade2Music.js') : root);
  if (IN_NODE) module.exports = api;
  else root.MM_LOOP_STACK = api;
  api.registerScreen(root && root.MM_PROGRESSION);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (g2) {
  'use strict';

  const WAY = 'cubeLayerGroups', STEP = 0.22, TEN_DUR = 0.45, ONE_VOICE = 'woodClick', MAX_SIDE = 10, MIN_HZ = 220;
  const SCREEN = { 'mm-cur-56': 'lsCard' }; // not progression.js SCREENS (#798 owns that map)
  // One partner per family; a layer never takes the child's own family.
  const PARTNERS = [['marimba', 'percussion'], ['guitar', 'strings'], ['panFlute', 'winds'], ['piano', 'keys']];

  function side(n) { const v = Number(n); return Number.isInteger(v) && v >= 1 && v <= MAX_SIDE ? v : null; }

  function volume(a, b, c) {
    const x = side(a), y = side(b), z = side(c);
    return x && y && z ? x * y * z : null;
  }

  // c layers, each the same a×b loop: equal groups.
  function layers(a, b, c) {
    if (!volume(a, b, c)) return [];
    return Array.from({ length: c }, function (_, i) { return { layer: i, cubes: a * b }; });
  }

  function cm3ToLiters(n) { const v = Number(n); return Number.isFinite(v) && v >= 0 ? v / 1000 : null; }

  // The base loop: one entry per cube, row after row (the a×b grid).
  function baseLoop(a, b) {
    const x = side(a), y = side(b);
    if (!x || !y) return [];
    const cells = [];
    for (let r = 0; r < x; r++) for (let col = 0; col < y; col++) cells.push({ r: r, c: col });
    return cells;
  }

  // Instruments of the layers: layer 0 is the child's, the rest cycle through
  // partners of other families. family: the child's instrument family.
  function layerInstruments(count, childId, family) {
    const others = PARTNERS.filter(function (p) { return p[1] !== family; });
    return Array.from({ length: count }, function (_, i) { return i === 0 ? childId : others[(i - 1) % others.length][0]; });
  }

  function voiceDefs() {
    const g = typeof globalThis !== 'undefined' ? globalThis : null;
    if (g && g.VOICES && g.VOICES.drumHigh) return g.VOICES;
    try { return require('../instrumentVoices.js').VOICES; } catch (e) { return {}; }
  }

  // Octaves into the filter band, never below MIN_HZ (GrooveGrid audibleHz, #798).
  function audibleHz(voice, hz) {
    const f = voiceDefs()[voice] && voiceDefs()[voice].filter;
    let out = Number(hz) > 0 ? Number(hz) : 262, lo = MIN_HZ, hi = Infinity;
    if (f && f[0] === 'bandpass') { lo = Math.max(lo, f[1] / 2); hi = f[1] * 2; }
    if (f && f[0] === 'lowpass') hi = f[1];
    if (f && f[0] === 'highpass') lo = Math.max(lo, f[1]);
    while (out < lo) out *= 2;
    while (out > hi && out / 2 >= lo) out /= 2;
    return Math.round(out);
  }

  function screenForTopic(id) {
    return Object.prototype.hasOwnProperty.call(SCREEN, id) ? SCREEN[id] : null;
  }
  function registerScreen(prog) {
    if (prog && prog.SCREENS) Object.keys(SCREEN).forEach(function (id) { prog.SCREENS[id] = SCREEN[id]; });
  }

  // Up to 12: one beat per cube. Above: a held ten, then ones a fifth lower.
  function layerNotes(cubes, voice, start, layer) {
    const s = g2.cubeLayerSounds(cubes), notes = [];
    if (!s) return notes;
    let at = start;
    if (s.units) {
      for (let i = 0; i < s.count; i++) { notes.push({ at: at, voice: voice, hz: 0, layer: layer, place: 'unit', cubes: 1, held: false }); at += STEP; }
      return notes;
    }
    for (let t = 0; t < s.tens; t++) { notes.push({ at: at, voice: voice, hz: audibleHz(voice, 110), layer: layer, place: 'ten', cubes: 10, held: true, dur: TEN_DUR, gain: 0.28 }); at += 2 * STEP; }
    for (let j = 0; j < s.ones; j++) { notes.push({ at: at, voice: ONE_VOICE, hz: audibleHz(ONE_VOICE, 1173), layer: layer, place: 'one', cubes: 1, held: false }); at += STEP; }
    return notes;
  }

  // voices: voice id per layer (layerVoice(i)). Layers follow each other with
  // a one-step rest between them, so the child hears c equal groups.
  function stackPlan(a, b, c, layerVoice) {
    if (!volume(a, b, c)) return null;
    const notes = [];
    let at = 0;
    layers(a, b, c).forEach(function (l) {
      const part = layerNotes(l.cubes, layerVoice(l.layer), at, l.layer);
      Array.prototype.push.apply(notes, part);
      at = part[part.length - 1].at + 2 * STEP;
    });
    return notes;
  }

  // The exercises, then the no-music check (#665).
  const TARGETS = [[2, 3, 2], [3, 4, 5], [2, 5, 3], [4, 4, 2], [2, 3, 4]]
    .map(function (t) { return { a: t[0], b: t[1], c: t[2] }; });
  const NO_MUSIC_CHECK_ITEMS = [
    { id: 'ls-nm-1', prompt: 'תיבה 4 על 5 על 3 ס״מ. מה נפחה בסמ״ק?', answer: volume(4, 5, 3) },
    { id: 'ls-nm-2', prompt: 'נפח תיבה 48 סמ״ק ושטח הבסיס 12 סמ״ר. כמה שכבות (גובה בס״מ)?', answer: 4 },
    { id: 'ls-nm-3', prompt: 'כמה ליטרים הם 3,000 סמ״ק?', answer: cm3ToLiters(3000) },
  ];

  return { WAY, ONE_VOICE, MIN_HZ, SCREEN, PARTNERS, TARGETS, NO_MUSIC_CHECK_ITEMS, volume, layers, cm3ToLiters, baseLoop, layerInstruments, audibleHz, layerNotes, stackPlan, screenForTopic, registerScreen };
});
