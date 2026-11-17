'use strict';
// A small speaker is a steep high-pass around 300 Hz (the review's phone
// model). These tests render the notes and keep only what that filter passes.
const test = require('node:test');
const assert = require('node:assert/strict');
const engine = require('../src/lib/musicEngine');
const g1 = require('../src/lib/grade1Music');
const V = require('../src/lib/instrumentVoices');
const D = require('../src/lib/music/divisorWorlds');
const TP = require('../src/lib/music/tensPercent');
const DW = require('../src/lib/music/dataWorlds');

const SR = 8000;

function biquadHP(fc, Q) {
  const w0 = 2 * Math.PI * fc / SR, cos = Math.cos(w0), sin = Math.sin(w0), alpha = sin / (2 * Q);
  const b0 = (1 + cos) / 2, b1 = -(1 + cos), b2 = (1 + cos) / 2;
  const a0 = 1 + alpha, a1 = -2 * cos, a2 = 1 - alpha;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

function highpass(x) {
  const qs = [1 / (2 * Math.sin(Math.PI / 8)), 1 / (2 * Math.sin(3 * Math.PI / 8))];
  return qs.reduce(function (sig, q) {
    const c = biquadHP(300, q), y = new Float32Array(sig.length);
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    for (let i = 0; i < sig.length; i++) {
      const v = c.b0 * sig[i] + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
      x2 = x1; x1 = sig[i]; y2 = y1; y1 = v; y[i] = v;
    }
    return y;
  }, x);
}

function rms(x, i0, i1) {
  let s = 0; const a = i0 || 0, b = i1 == null ? x.length : i1;
  for (let i = a; i < b; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, b - a));
}

function mixNotes(notes, seconds) {
  const n = Math.floor(seconds * SR), x = new Float32Array(n);
  notes.forEach(function (note) {
    const at = note.time || 0, dur = note.dur, hz = note.hz, g = note.gain;
    for (let i = Math.floor(at * SR); i < Math.min(n, Math.floor((at + dur) * SR)); i++) {
      const u = i / SR - at;
      const env = u < 0.01 ? u / 0.01 : (u > dur - 0.04 ? Math.max(0, (dur - u) / 0.04) : 1);
      x[i] += Math.sin(2 * Math.PI * hz * i / SR) * g * env;
    }
  });
  return x;
}

function mixVoice(voice, hz, seconds) {
  const plan = V.planVoice(voice, hz);
  const n = Math.floor(seconds * SR), x = new Float32Array(n);
  plan.oscillators.forEach(function (o) {
    for (let i = 0; i < n; i++) x[i] += Math.sin(2 * Math.PI * o.hz * i / SR) * o.gain;
  });
  return x;
}

const db = (v) => 20 * Math.log10(Math.max(v, 1e-9));

test('the number-line gong survives a 300 Hz high-pass about as well as the strokes', () => {
  const events = g1.scaleJumpEvents(0, 10, 220, 96);
  const plan = engine.planSequence(events, 0);
  const gongAt = events.find((e) => e.partials).at;
  const x = highpass(mixNotes(plan, gongAt + 1));
  const gong = rms(x, Math.floor(gongAt * SR), Math.floor((gongAt + 0.4) * SR));
  const strokeEv = events.find((e) => !e.partials && e.hz >= 300);
  const stroke = rms(x, Math.floor(strokeEv.at * SR), Math.floor((strokeEv.at + strokeEv.dur) * SR));
  assert.ok(db(gong) > db(stroke) - 12, 'gong on a phone is within 12 dB of a stroke (' + db(gong).toFixed(1) + ' vs ' + db(stroke).toFixed(1) + ')');
});

test('low drums and the 7+9 steps keep energy above 300 Hz', () => {
  function passed(voice, hz) {
    const full = mixVoice(voice, hz, 0.25);
    return db(rms(highpass(full))) - db(rms(full));
  }
  [65, 98, 110].forEach(function (hz) {
    const plan = V.planVoice('drumLow', hz);
    const cutoff = plan.filter ? plan.filter.hz : 20000;
    const keeps = plan.oscillators.filter((o) => o.hz >= 350 && o.hz < cutoff * 0.9 && o.gain > plan.oscillators[0].gain * 0.3);
    assert.ok(keeps.length >= 1, hz + ' Hz drum has a partial the lowpass lets through and a phone can play');
    const drop = passed('drumLow', hz);
    assert.ok(drop > -14, 'drumLow ' + hz + ' Hz loses ' + (-drop).toFixed(1) + ' dB on a phone');
  });
  const low = passed('stomp', 90);
  const step = passed('stomp', 349);
  assert.ok(step > low + 12, 'a 349 Hz step is much louder on a phone than a 90 Hz one (' + step.toFixed(1) + ' vs ' + low.toFixed(1) + ')');
  assert.ok(step > -10, 'the step itself is not filtered away (' + step.toFixed(1) + ' dB)');
});

test('the sam, the percent toms and the 7+9 steps are the cues that were inaudible', () => {
  const pos = D.specForItem({ music: 'phraseShare', prompt: 'במשקל 4/4, פַּעֲמָה 16 היא איזו פַּעֲמָה בתיבה שלה?', answer: 4 });
  assert.ok(D.soundEvents(pos).some((e) => e.stage === 'sam' && e.voice === 'drumLow'));
  const pct = TP.specForItem({ music: 'shortenByPercent', prompt: 'המחיר עלה מ־40 ל־100 ש״ח. בכמה אחוזים עלה? (מספר בלבד)', answer: 150 });
  const lows = TP.soundEvents(pct).filter((e) => e.voice === 'drumLow');
  assert.ok(lows.some((e) => e.hz <= 98) && lows.some((e) => e.hz <= 65), 'the percent toms include the low drums');
  const sum = DW.specForItem({ music: 'alternateDrums', prompt: '7 + 9 — זוגי או אי־זוגי?', answer: 'זוגי' });
  const steps = DW.soundEvents(sum).filter((e) => e.voice === 'stomp');
  assert.ok(steps.length >= 8);
  assert.ok(steps.every((e) => e.hz >= 300), 'every 7+9 step is in the phone band');
});
