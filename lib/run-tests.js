'use strict';
const assert = require('node:assert');

// FN-LIB-1: log-semitone pitch mapping
const f = require('./y-to-freq.js');
assert.ok(Math.abs(f.yToFreq(0, -10, 10) - 440 * Math.pow(2, (66 - 69) / 12)) < 1e6);
assert.ok(f.yToFreq(-10, -10, 10) < f.yToFreq(10, -10, 10));
assert.strictEqual(f.yToFreq(NaN, -10, 10), null);
assert.strictEqual(f.yToFreq(Infinity, -10, 10), null);
const lo = f.yToFreq(-10, -10, 10), hi = f.yToFreq(10, -10, 10);
assert.ok(Math.abs(lo - 130.81) < 2);
assert.ok(Math.abs(hi - 1046.5) < 6);

// FN-LIB-2: 807 growth/decay generator
const g = require('./growth-problem.js');
let i = 0;
const rng = () => [0.1, 0.3, 0.7, 0.2, 0.9, 0.5][i++ % 6];
const p = g.genGrowthProblem(rng);
assert.ok(p.a0 >= 100 && p.a0 <= 1000 && p.a0 % 50 === 0);
assert.ok(p.n >= 2 && p.n <= 8);
assert.ok(Math.abs(p.answer - Number((p.a0 * Math.pow(p.q, p.n)).toFixed(2))) < 1e-9);
assert.ok(p.type === 'growth' ? p.q > 1 : p.q < 1);

// FN-LIB-3: quadratic roots/discriminant
const q = require('./quad-info.js');
assert.deepStrictEqual(q.quadInfo(1, 0, -4).roots, [-2, 2]);
assert.strictEqual(q.quadInfo(1, 0, -4).rootCount, 2);
assert.strictEqual(q.quadInfo(1, 0, 4).rootCount, 0);
assert.strictEqual(q.quadInfo(1, -2, 1).rootCount, 1);
assert.deepStrictEqual(q.quadInfo(0, 2, -6).roots, [3]);
assert.strictEqual(q.quadInfo(0, 0, 5).rootCount, 0);

// FN-LIB-4: near-miss distractors
const m = require('./near-miss.js');
let j = 0;
const rng2 = () => [0.05, 0.15, 0.35, 0.55, 0.75, 0.95, 0.25, 0.65, 0.45, 0.85, 0.1, 0.9][j++ % 12];
const d = m.nearMiss('linear', 2, 1, rng2);
assert.strictEqual(d.length, 3);
const key = (o) => o.a + '|' + o.b;
const ks = d.map(key);
assert.strictEqual(new Set(ks).size, 3);
assert.ok(!ks.includes('2|1'));
d.forEach((o) => assert.ok(o.a !== 0));
// regression: degenerate constant rng must not hang and still return 3 distinct
const d2 = m.nearMiss('linear', 2, 1, () => 0.999);
assert.strictEqual(d2.length, 3);
assert.strictEqual(new Set(d2.map(key)).size, 3);

console.log('ALL 4 LIBS + regression PASS');

// FN-LIB-5: adaptive tempo controller
const t = require('./tempo.js');
assert.strictEqual(t.nextTempo(1.0, true), 0.96);
assert.strictEqual(t.nextTempo(1.0, false), 1.12);
assert.strictEqual(t.nextTempo(0.56, true), 0.55);
assert.strictEqual(t.nextTempo(1.95, false), 2.0);
console.log('tempo lib PASS');
