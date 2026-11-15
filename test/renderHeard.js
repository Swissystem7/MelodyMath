'use strict';
// Offline render of the Web Audio graph playVoice builds, so a test can measure
// the samples a speaker would get (duration, pitch, loudness, a phone high-pass).

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function sampleParam(events, t, fallback) {
  if (!events.length) return fallback;
  if (t <= events[0].t) return events[0].kind === 'set' ? events[0].v : fallback;
  let i = 0;
  while (i + 1 < events.length && events[i + 1].t <= t) i++;
  const a = events[i], b = events[i + 1];
  if (!b || b.kind === 'set' || !(b.t > a.t)) return t >= (b ? b.t : a.t) && b && b.kind === 'set' ? b.v : a.v;
  const u = (t - a.t) / (b.t - a.t);
  if (b.kind === 'lin') return a.v + (b.v - a.v) * u;
  const av = Math.max(1e-7, Math.abs(a.v)), bv = Math.max(1e-7, Math.abs(b.v));
  return av * Math.pow(bv / av, u) * (b.v < 0 ? -1 : 1);
}

function wave(type, phase) {
  const p = phase % (Math.PI * 2);
  if (type === 'square') return p < Math.PI ? 1 : -1;
  if (type === 'sawtooth') return p / Math.PI - 1;
  if (type === 'triangle') return p < Math.PI ? -1 + (2 * p) / Math.PI : 3 - (2 * p) / Math.PI;
  return Math.sin(p);
}

function biquadCoeffs(type, fc, sr, Q) {
  const w0 = (2 * Math.PI * Math.min(fc, sr * 0.45)) / sr;
  const cos = Math.cos(w0), sin = Math.sin(w0), alpha = sin / (2 * (Q || 1));
  let b0, b1, b2, a0, a1, a2;
  if (type === 'highpass') {
    b0 = (1 + cos) / 2; b1 = -(1 + cos); b2 = (1 + cos) / 2;
  } else if (type === 'bandpass') {
    b0 = alpha; b1 = 0; b2 = -alpha;
  } else {
    b0 = (1 - cos) / 2; b1 = 1 - cos; b2 = (1 - cos) / 2;
  }
  a0 = 1 + alpha; a1 = -2 * cos; a2 = 1 - alpha;
  return { b0: b0 / a0, b1: b1 / a0, b2: b2 / a0, a1: a1 / a0, a2: a2 / a0 };
}

function applyBiquad(x, c) {
  const y = new Float32Array(x.length);
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    const v = c.b0 * x[i] + c.b1 * x1 + c.b2 * x2 - c.a1 * y1 - c.a2 * y2;
    x2 = x1; x1 = x[i]; y2 = y1; y1 = v; y[i] = v;
  }
  return y;
}

function rms(x, i0, i1) {
  const a = i0 || 0, b = i1 == null ? x.length : i1;
  let s = 0;
  for (let i = a; i < b; i++) s += x[i] * x[i];
  return Math.sqrt(s / Math.max(1, b - a));
}

function timeWithin(x, sr, downDb) {
  const w = Math.max(1, Math.round(0.02 * sr));
  let acc = 0, peak = 0;
  const env = new Float32Array(x.length);
  for (let i = 0; i < x.length; i++) {
    acc += x[i] * x[i];
    if (i >= w) acc -= x[i - w] * x[i - w];
    env[i] = Math.sqrt(Math.max(0, acc) / Math.min(i + 1, w));
    if (env[i] > peak) peak = env[i];
  }
  if (peak < 1e-6) return 0;
  const thr = peak * Math.pow(10, -(downDb || 12) / 20);
  let first = -1, last = -1;
  for (let i = 0; i < env.length; i++) if (env[i] >= thr) { if (first < 0) first = i; last = i; }
  return first < 0 ? 0 : (last - first) / sr;
}

function dominantHz(x, sr, i0, i1) {
  const a = Math.max(0, i0 || 0), b = Math.min(x.length, i1 == null ? x.length : i1);
  const n = b - a;
  if (n < 64) return 0;
  let bestF = 0, bestM = 0;
  for (let f = 80; f <= 900; f += 2) {
    let re = 0, im = 0;
    const w = (2 * Math.PI * f) / sr;
    for (let i = 0; i < n; i += 4) {
      const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / n);
      const s = x[a + i] * hann;
      re += s * Math.cos(w * i); im -= s * Math.sin(w * i);
    }
    const m = re * re + im * im;
    if (m > bestM) { bestM = m; bestF = f; }
  }
  return bestF;
}

function makeContext(sampleRate) {
  const sr = sampleRate || 16000, sources = [];
  function Param(v) { this.value = v; this.events = []; }
  Param.prototype.setValueAtTime = function (v, t) { this.events.push({ kind: 'set', v: +v, t: +t }); };
  Param.prototype.linearRampToValueAtTime = function (v, t) { this.events.push({ kind: 'lin', v: +v, t: +t }); };
  Param.prototype.exponentialRampToValueAtTime = function (v, t) { this.events.push({ kind: 'exp', v: +v, t: +t }); };
  Param.prototype.at = function (t) { return sampleParam(this.events, t, this.value); };
  function Node() { this.outputs = []; }
  Node.prototype.connect = function (n) { this.outputs.push(n); return n; };
  function Gain() { Node.call(this); this.gain = new Param(1); }
  Gain.prototype = Object.create(Node.prototype);
  Gain.prototype.process = function (x, rate) {
    const y = new Float32Array(x.length);
    for (let i = 0; i < x.length; i++) y[i] = x[i] * this.gain.at(i / rate);
    return y;
  };
  function Filter() { Node.call(this); this.type = 'lowpass'; this.frequency = new Param(1000); this.Q = new Param(1); }
  Filter.prototype = Object.create(Node.prototype);
  Filter.prototype.process = function (x, rate) {
    return applyBiquad(x, biquadCoeffs(this.type, this.frequency.value, rate, this.Q.value || 1));
  };
  function startable(render) {
    const node = Object.create(Node.prototype);
    Node.call(node);
    node._start = 0; node._stop = 0;
    node.start = function (t) { node._start = t; };
    node.stop = function (t) { node._stop = t; sources.push(node); };
    node.render = render;
    return node;
  }
  const ac = {
    sampleRate: sr, currentTime: 0, state: 'running', destination: new Node(), sources: sources,
    createGain() { return new Gain(); },
    createOscillator() {
      const node = startable(function (len) {
        const y = new Float32Array(len);
        let phase = 0;
        for (let i = 0; i < len; i++) {
          const t = i / sr, hz = Math.max(1, node.frequency.at(t));
          if (t >= node._start && t < node._stop) y[i] = wave(node.type, phase);
          phase += (2 * Math.PI * hz) / sr;
        }
        return y;
      });
      node.type = 'sine'; node.frequency = new Param(440);
      return node;
    },
    createBiquadFilter() { return new Filter(); },
    createBuffer(ch, len) {
      const data = new Float32Array(len);
      return { sampleRate: sr, _data: data, getChannelData() { return data; } };
    },
    createBufferSource() {
      const node = startable(function (len) {
        const y = new Float32Array(len), data = node.buffer && node.buffer._data;
        if (!data) return y;
        for (let i = 0; i < len; i++) {
          const t = i / sr;
          if (t < node._start || t >= node._stop) continue;
          const j = Math.floor((t - node._start) * sr);
          if (j >= 0 && j < data.length) y[i] = data[j];
        }
        return y;
      });
      node.buffer = null;
      return node;
    },
  };
  function reaches(node, seen) {
    if (!node || seen.has(node)) return false;
    if (node === ac.destination) return true;
    seen.add(node);
    return (node.outputs || []).some((n) => reaches(n, seen));
  }
  ac.render = function (seconds) {
    const n = Math.max(1, Math.floor(seconds * sr)), mix = new Float32Array(n);
    sources.forEach(function (src) {
      if (!reaches(src, new Set())) return; // an LFO into a frequency param is silent
      let sig = src.render(n), node = src.outputs[0], seen = new Set();
      while (node && node !== ac.destination && !seen.has(node)) {
        seen.add(node);
        if (typeof node.process === 'function') sig = node.process(sig, sr);
        node = node.outputs && node.outputs[0];
      }
      for (let i = 0; i < n; i++) mix[i] += sig[i];
    });
    return mix;
  };
  return ac;
}

function renderVoice(playVoice, voice, hz, opts, seconds) {
  const ac = makeContext(16000);
  playVoice(ac, voice, hz, 0, ac.destination, opts || null);
  return { samples: ac.render(seconds || ((opts && opts.dur) || 1) + 0.15), sampleRate: ac.sampleRate };
}

module.exports = { mulberry32, makeContext, renderVoice, rms, timeWithin, dominantHz, applyBiquad, biquadCoeffs, wave };
