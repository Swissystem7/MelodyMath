// MelodyMath — Ensemble mode & cross-instrument math ratios (#623, Refs #591).
//
// Implements Aviran's #623 spec (comment 6369229925):
// 1. Percussion is central: darbuka, djembe, tabla, cajon, taiko and marimba
//    anchor counting, rhythm, multiplication and fractions across families
//    (percussion, strings, winds, keys).
// 2. Cross-instrument math match: 2-3 instruments (e.g. a darbuka beat and a
//    guitar string) voice the same fraction/ratio at the exact same tempo
//    (BPM), with the math equation shown on screen.
// 3. Ensemble mode: the child combines 2-3 instruments to build an answer
//    (e.g. tabla 3s + marimba 4s -> common multiple 12), with full beat
//    schedules, unison convergence beats and verified sources from
//    src/lib/instruments.js.
// 4. Follows #591 dosage rules: primary topic ways use M1/M2/M3/M6
//    (evidence: 'strong', optional: false); LCM polyrhythm (M4) is marked
//    optional: true, evidence: 'weak'.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_ENSEMBLE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const DATA = root && typeof root.instrumentById === 'function'
    ? root
    : require('../instruments.js');

  const CENTRAL_PERCUSSION = ['darbuka', 'djembe', 'tabla', 'cajon', 'taiko', 'marimba'];
  const MIN_INSTRUMENTS = 2;
  const MAX_INSTRUMENTS = 3;
  const DEFAULT_BPM = 90;

  function wholeIn(v, lo, hi) {
    const n = Number(v);
    return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
  }

  function gcd(a, b) {
    let x = Math.abs(Number(a) || 0);
    let y = Math.abs(Number(b) || 0);
    while (y !== 0) {
      const t = y;
      y = x % y;
      x = t;
    }
    return x || 1;
  }

  function lcm(a, b) {
    const x = wholeIn(a, 1, 100);
    const y = wholeIn(b, 1, 100);
    if (x == null || y == null) return null;
    return (x / gcd(x, y)) * y;
  }

  function lcmOfSteps(steps) {
    if (!Array.isArray(steps) || steps.length < MIN_INSTRUMENTS || steps.length > MAX_INSTRUMENTS) return null;
    let acc = wholeIn(steps[0], 1, 24);
    if (acc == null) return null;
    for (let i = 1; i < steps.length; i++) {
      const s = wholeIn(steps[i], 1, 24);
      if (s == null) return null;
      acc = lcm(acc, s);
    }
    return acc;
  }

  function hasVerifiedSource(inst) {
    return Boolean(inst && typeof inst.source === 'string' && /^https?:\/\//.test(inst.source));
  }

  function isCentralPercussion(id) {
    return CENTRAL_PERCUSSION.indexOf(String(id || '')) >= 0;
  }

  // Pick a cross-family ensemble of 2-3 verified instruments for a topic,
  // always anchored by a central percussion instrument when available.
  function ensembleForTopic(topic, count) {
    const want = count == null ? 3 : wholeIn(count, MIN_INSTRUMENTS, MAX_INSTRUMENTS);
    if (want == null || !DATA.TOPICS[topic]) return null;
    const pool = DATA.INSTRUMENTS.filter(function (x) {
      return hasVerifiedSource(x) && x.mathTopics.indexOf(topic) >= 0;
    });
    if (pool.length < MIN_INSTRUMENTS) return null;
    const picked = [];
    const usedFamilies = {};
    const anchor = pool.filter(function (x) { return isCentralPercussion(x.id); })[0] || pool[0];
    picked.push(anchor);
    usedFamilies[anchor.family] = true;
    for (let i = 0; i < pool.length && picked.length < want; i++) {
      if (pool[i].id !== anchor.id && !usedFamilies[pool[i].family]) {
        picked.push(pool[i]);
        usedFamilies[pool[i].family] = true;
      }
    }
    for (let j = 0; j < pool.length && picked.length < want; j++) {
      if (picked.indexOf(pool[j]) < 0) picked.push(pool[j]);
    }
    return picked.length >= MIN_INSTRUMENTS ? picked : null;
  }

  // Show how 2-3 instruments (e.g. darbuka beat + guitar string) voice the
  // exact same fraction/ratio at matched tempo (BPM), with math on screen.
  function buildCrossInstrumentRatio(instIds, num, den, bpm) {
    if (!Array.isArray(instIds) || instIds.length < MIN_INSTRUMENTS || instIds.length > MAX_INSTRUMENTS) return null;
    const n = wholeIn(num, 1, 16);
    const d = wholeIn(den, 1, 16);
    if (n == null || d == null || n > d) return null;
    const tempo = bpm == null ? DEFAULT_BPM : wholeIn(bpm, 40, 240);
    if (tempo == null) return null;

    const insts = [];
    const seen = {};
    for (let i = 0; i < instIds.length; i++) {
      const inst = DATA.instrumentById(instIds[i]);
      if (!inst || seen[inst.id] || !hasVerifiedSource(inst)) return null;
      seen[inst.id] = true;
      insts.push(inst);
    }

    const g = gcd(n, d);
    const simpNum = n / g;
    const simpDen = d / g;
    const barMs = Math.round((60000 / tempo) * 4);
    const soundDurationMs = Math.round((barMs * n) / d);
    const ratio = n / d;

    const tracks = insts.map(function (inst) {
      return {
        id: inst.id,
        he: inst.instrument.he,
        family: inst.family,
        voice: inst.voice,
        bpm: tempo,
        fraction: n + '/' + d,
        reducedFraction: simpNum + '/' + simpDen,
        ratio: ratio,
        soundDurationMs: soundDurationMs,
        barMs: barMs,
        source: inst.source,
      };
    });

    return {
      mechanism: 'M3',
      optional: false,
      evidence: 'strong',
      bpm: tempo,
      fraction: n + '/' + d,
      reducedFraction: simpNum + '/' + simpDen,
      ratio: ratio,
      mathDisplay: n + '/' + d + (g > 1 ? ' = ' + simpNum + '/' + simpDen : ''),
      hebrewSummary: tracks.map(function (t) { return t.he; }).join(' + ') + ' מנגנים יחד יחס ' + n + '/' + d + ' בטמפו ' + tempo + ' BPM',
      tracks: tracks,
    };
  }

  // Ensemble mode: combine 2-3 instruments with step sizes (e.g. tabla 3s +
  // marimba 4s -> common multiple 12).
  // layers: [{ id: 'tabla', step: 3 }, { id: 'marimba', step: 4 }, ...]
  // mode: 'multiplication' (M2 primary, strong) or 'lcm' (M4 optional, weak).
  function buildEnsembleCycle(layers, bpm, mode) {
    if (!Array.isArray(layers) || layers.length < MIN_INSTRUMENTS || layers.length > MAX_INSTRUMENTS) return null;
    const tempo = bpm == null ? DEFAULT_BPM : wholeIn(bpm, 40, 240);
    if (tempo == null) return null;

    const resolved = [];
    const seen = {};
    const steps = [];
    let hasPercussion = false;

    for (let i = 0; i < layers.length; i++) {
      const item = layers[i] || {};
      const inst = DATA.instrumentById(item.id);
      const step = wholeIn(item.step, 1, 16);
      if (!inst || step == null || seen[inst.id] || !hasVerifiedSource(inst)) return null;
      seen[inst.id] = true;
      if (inst.family === 'percussion') hasPercussion = true;
      steps.push(step);
      resolved.push({ inst: inst, step: step });
    }
    if (!hasPercussion) return null;

    const cycleBeats = lcmOfSteps(steps);
    if (!cycleBeats) return null;
    const beatMs = 60000 / tempo;

    const parts = resolved.map(function (r) {
      const hits = [];
      for (let b = r.step; b <= cycleBeats; b += r.step) hits.push(b);
      return {
        id: r.inst.id,
        he: r.inst.instrument.he,
        family: r.inst.family,
        voice: r.inst.voice,
        step: r.step,
        groupsToCycle: cycleBeats / r.step,
        accentBeats: hits,
        source: r.inst.source,
      };
    });

    const timeline = [];
    const unisonBeats = [];
    for (let b = 1; b <= cycleBeats; b++) {
      const activeIds = parts.filter(function (p) { return b % p.step === 0; }).map(function (p) { return p.id; });
      const isUnison = activeIds.length === parts.length;
      if (isUnison) unisonBeats.push(b);
      timeline.push({
        beat: b,
        timeMs: Math.round((b - 1) * beatMs),
        activeIds: activeIds,
        unison: isUnison,
      });
    }

    const isLcmMode = mode === 'lcm';
    const mechanism = isLcmMode ? 'M4' : 'M2';
    return {
      mechanism: mechanism,
      optional: isLcmMode,
      evidence: isLcmMode ? 'weak' : 'strong',
      bpm: tempo,
      beatMs: beatMs,
      steps: steps,
      answer: cycleBeats,
      unisonBeats: unisonBeats,
      mathDisplay: steps.join(' × ') + ' → ' + cycleBeats,
      questionHe: parts.map(function (p) { return p.he + ' כל ' + p.step; }).join(' + ') + ' — באיזו פעמה כולם נפגשים יחד?',
      parts: parts,
      timeline: timeline,
    };
  }

  function checkEnsembleAnswer(cycle, userAnswer) {
    if (!cycle || typeof cycle.answer !== 'number') return null;
    const n = wholeIn(userAnswer, 1, 1000);
    if (n == null) return { correct: false, expected: cycle.answer, reason: 'invalid' };
    return {
      correct: n === cycle.answer,
      expected: cycle.answer,
      reason: n === cycle.answer ? 'exact' : (n % cycle.answer === 0 ? 'multiple' : 'mismatch'),
    };
  }

  return {
    CENTRAL_PERCUSSION: CENTRAL_PERCUSSION,
    MIN_INSTRUMENTS: MIN_INSTRUMENTS,
    MAX_INSTRUMENTS: MAX_INSTRUMENTS,
    DEFAULT_BPM: DEFAULT_BPM,
    gcd: gcd,
    lcm: lcm,
    lcmOfSteps: lcmOfSteps,
    isCentralPercussion: isCentralPercussion,
    ensembleForTopic: ensembleForTopic,
    buildCrossInstrumentRatio: buildCrossInstrumentRatio,
    buildEnsembleCycle: buildEnsembleCycle,
    checkEnsembleAnswer: checkEnsembleAnswer,
  };
});
