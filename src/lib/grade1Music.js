// MelodyMath ? Grade ?? music activities: counting beats, number line as scale,
// touch 100-chart, and AB/AAB/ABC melody patterns (plan ?5, issue #102).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const PATTERN_SHAPES = {
    A: { id: 'A', name: '?????', icon: '?', note: '??', freq: 261.63 },
    B: { id: 'B', name: '?????', icon: '?', note: '??', freq: 329.63 },
    C: { id: 'C', name: '?????', icon: '?', note: '???', freq: 392.00 }
  };

  const PATTERN_TYPES = {
    AB: ['A', 'B'],
    AAB: ['A', 'A', 'B'],
    ABC: ['A', 'B', 'C']
  };

  function countBeats(start, step, max) {
    const s0 = Math.max(0, Math.round(Number(start)) || 0);
    const st = Math.max(1, Math.round(Number(step)) || 1);
    const mx = Math.max(s0, Math.round(Number(max)) || 20);
    const beats = [];
    for (let v = s0; v <= mx; v += st) {
      beats.push({
        value: v,
        accented: v % st === 0 && v !== 0,
        label: String(v)
      });
    }
    return beats;
  }

  function predictNextAccented(current, step) {
    const c = Math.round(Number(current)) || 0;
    const s = Math.round(Number(step)) || 1;
    return c + s;
  }

  function scaleStepFreq(baseFreq, jumpSize) {
    const f = Number(baseFreq) || 220;
    const j = Number(jumpSize) || 0;
    return Math.round(f * Math.pow(2, j / 10) * 100) / 100;
  }

  function numberLineScaleJump(fromTick, toTick, baseFreq) {
    const f = Number(fromTick) || 0;
    const t = Number(toTick) || 0;
    const jump = t - f;
    const freq = scaleStepFreq(baseFreq || 220, jump);
    return {
      from: f,
      to: t,
      jump: jump,
      frequency: freq,
      isOctave: Math.abs(jump) === 10
    };
  }

  function chart100Sound(number, baseTensFreq) {
    const n = Math.max(1, Math.min(100, Math.round(Number(number)) || 1));
    const tens = Math.floor(n / 10);
    const ones = n % 10;
    const base = Number(baseTensFreq) || 110;
    const tensFreq = tens === 0 ? null : Math.round(base * (1 + tens * 0.1) * 10) / 10;
    const clickCount = ones;
    let label = '';
    if (tens > 0 && ones > 0) label = tens + ' ????? ?-' + ones + ' ??????';
    else if (tens > 0) label = tens + ' ?????';
    else label = ones + ' ??????';

    return {
      number: n,
      tens: tens,
      ones: ones,
      tensFreq: tensFreq,
      clickCount: clickCount,
      label: label
    };
  }

  function melodyPattern(type, length) {
    const p = PATTERN_TYPES[type] || PATTERN_TYPES.AB;
    const len = Math.max(1, Math.round(Number(length)) || p.length);
    const seq = [];
    for (let i = 0; i < len; i++) {
      const sym = p[i % p.length];
      seq.push(PATTERN_SHAPES[sym]);
    }
    return seq;
  }

  function createPatternChallenge(type, length) {
    const full = melodyPattern(type, length || 5);
    const expected = full[full.length - 1];
    const promptSequence = full.slice(0, full.length - 1);
    const choices = [PATTERN_SHAPES.A, PATTERN_SHAPES.B, PATTERN_SHAPES.C];
    return {
      type: type,
      sequence: promptSequence,
      expected: expected,
      choices: choices
    };
  }

  return {
    PATTERN_SHAPES: PATTERN_SHAPES,
    PATTERN_TYPES: PATTERN_TYPES,
    countBeats: countBeats,
    predictNextAccented: predictNextAccented,
    scaleStepFreq: scaleStepFreq,
    numberLineScaleJump: numberLineScaleJump,
    chart100Sound: chart100Sound,
    melodyPattern: melodyPattern,
    createPatternChallenge: createPatternChallenge
  };
});
