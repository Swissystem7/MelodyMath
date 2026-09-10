const test = require('node:test');
const assert = require('node:assert/strict');
const g = require('../src/lib/graphListen');

test('sampleCurve walks xmin→xmax and swallows a throwing fn as NaN', () => {
  const s = g.sampleCurve((x) => x, -2, 2, 4);
  assert.equal(s.length, 5);
  assert.equal(s[0].x, -2);
  assert.equal(s[4].x, 2);
  assert.equal(s[2].y, 0);
  const bad = g.sampleCurve(() => { throw new Error('boom'); }, 0, 1, 8);
  assert.ok(bad.every((p) => !isFinite(p.y)));
  assert.deepEqual(g.sampleCurve(null, 0, 1, 10), []);
});

test('roots of x²−4 sit at −2 and 2, and y = x + 1 has no root on [0, 2]', () => {
  const quad = g.findRoots(g.sampleCurve((x) => x * x - 4, -4, 4, 200));
  assert.equal(quad.length, 2);
  assert.ok(Math.abs(quad[0].x + 2) < 0.05);
  assert.ok(Math.abs(quad[1].x - 2) < 0.05);
  const none = g.findRoots(g.sampleCurve((x) => x + 1, 0, 2, 40));
  assert.equal(none.length, 0);
});

test('a parabola has one minimum; |x| is down-then-up', () => {
  const ext = g.findExtrema(g.sampleCurve((x) => x * x, -3, 3, 120));
  assert.ok(ext.some((e) => e.kind === 'min' && Math.abs(e.x) < 0.15));
  const abs = g.summarizeCurve(g.sampleCurve((x) => Math.abs(x), -4, 4, 80));
  assert.equal(abs.trend, 'down-then-up');
});

test('√(x) from −4 to 4 is undefined on the left and defined on the right', () => {
  const spans = g.findUndefinedSpans(g.sampleCurve((x) => (x >= 0 ? Math.sqrt(x) : NaN), -4, 4, 80));
  assert.ok(spans.length >= 1);
  assert.ok(spans[0].from < 0);
  assert.ok(spans[0].to <= 0.2);
});

test('1/x marks an asymptote near zero', () => {
  const asy = g.findAsymptotes(g.sampleCurve((x) => (Math.abs(x) < 0.05 ? NaN : 1 / x), -4, 4, 160));
  assert.ok(asy.length >= 1);
  assert.ok(asy.some((a) => Math.abs(a.x) < 0.6));
});

test('Hebrew description names a root and refuses to call itself the voice of the function', () => {
  const sum = g.summarizeCurve(g.sampleCurve((x) => x, -3, 3, 60));
  const text = g.describeGraphHe(sum);
  assert.match(text, /שורש/);
  assert.match(text, /איקס 0/);
  assert.match(text, /לא הוכחה|לא «קול הפונקציה»|לא "קול הפונקציה"/);
  assert.equal(sum.trend, 'up');
  const yi = g.findYIntercept(sum.samples);
  assert.ok(yi);
  assert.ok(Math.abs(yi.y) < 0.05);
});

test('landmarks are ordered by x and the stepper stays inside the sample list', () => {
  const sum = g.summarizeCurve(g.sampleCurve((x) => x * x - 1, -3, 3, 80));
  const marks = g.landmarksOf(sum);
  assert.ok(marks.length >= 3);
  for (let i = 1; i < marks.length; i++) assert.ok(marks[i].x >= marks[i - 1].x);
  assert.match(g.describeLandmarkHe(marks[0]), /התחלה|איקס/);
  assert.equal(g.stepIndex(0, 1, 5), 1);
  assert.equal(g.stepIndex(0, -1, 5), 0);
  assert.equal(g.stepIndex(4, 1, 5), 4);
  const i0 = g.indexNearX(sum.samples, 0);
  assert.ok(Math.abs(sum.samples[i0].x) < 0.2);
  const next = g.nextLandmarkIndex(marks, marks[0].x, 1);
  assert.ok(next >= 1);
});

test('exponential helpers match M(t)=M0·q^t and describe growth without calling it a proof', () => {
  assert.equal(g.expValue(200, 1.5, 2), 450);
  const series = g.expSeries(100, 2, 3, 6);
  assert.equal(series[0], 100);
  assert.equal(series[series.length - 1], 800);
  const he = g.describeExpHe({ M0: 100, q: 2, t: 3 });
  assert.match(he, /גדילה/);
  assert.match(he, /800/);
  assert.match(he, /ייצוג/);
  assert.doesNotMatch(he, /משפר|טיפול|יעילות/);
  assert.equal(g.expValue(10, -1, 2), null);
});

// ---------------------------------------------------------------------------
// M2 — noise-tolerant landmark detection.
//
// Deterministic throughout: no Math.random, no timers, no audio. The jitter is
// a fixed 32-entry table, written out as literals below.
//
// ENDPOINT POLICY under test (also documented in src/lib/graphListen.js):
//   * the first and last samples are never extrema — a turning point needs a
//     retrace to confirm it, and there is nothing past the edge to retrace
//     into;
//   * the first and last samples DO count as roots when they sit on the axis,
//     within both the epsilon-of-range tolerance and a sample or two of the
//     axis at the local slope, because no sign change is observable past the
//     edge.
// So sin(x) on [0, 2*pi] gives 2 extrema and 3 roots: the zeros at 0 and 2*pi
// are counted, and the values at the two ends are not called extrema.
// ---------------------------------------------------------------------------

const TWO_PI = 2 * Math.PI;
const cleanSine = g.sampleCurve(Math.sin, 0, TWO_PI, 200);

// Fixed jitter table: 32 values in [-0.01, 0.01], generated once with
// mulberry32(20260910) (the PRNG worksheets.js already uses), rounded to five
// decimals and then pinned here as literals so the test is a table and not a
// generator anyone could quietly retune.
const JITTER = [
  -0.0039, 0.00032, 0.00327, -0.0023, -0.0081, 0.0012, -0.00207, -0.00247,
  0.00824, 0.00569, 0.00511, 0.00968, 0.0084, 0.00991, -0.00941, -0.0087,
  0.0029, -0.00248, 0.00934, -0.00053, 0.00437, -0.0056, -0.00687, 0.00231,
  -0.00699, -0.00693, -0.00954, 0.00915, -0.00863, -0.00109, 0.00187, -0.00327,
];

const noisySine = cleanSine.map((s, i) => ({
  i: s.i,
  x: s.x,
  y: s.y + JITTER[i % JITTER.length],
}));

const kinds = (marks) => marks.map((m) => m.kind);
const shown = (marks) => marks.map((m) => m.kind + '@' + g.fmt(m.x)).join(' | ');

test('the jitter table really is a +/-0.01 perturbation and nothing larger', () => {
  assert.equal(JITTER.length, 32);
  assert.ok(JITTER.every((v) => Math.abs(v) <= 0.01));
  assert.ok(JITTER.some((v) => v > 0.008) && JITTER.some((v) => v < -0.008));
  for (let i = 0; i < noisySine.length; i++) {
    assert.ok(Math.abs(noisySine[i].y - cleanSine[i].y) <= 0.01 + 1e-12);
    assert.equal(noisySine[i].x, cleanSine[i].x);
  }
});

test('sin on [0, 2pi] with 200 samples gives exactly 2 extrema and 3 zero crossings', () => {
  const marks = g.findLandmarks(cleanSine);
  assert.deepEqual(kinds(marks), ['root', 'max', 'root', 'min', 'root']);
  assert.equal(marks.filter((m) => m.kind === 'max' || m.kind === 'min').length, 2);
  assert.equal(marks.filter((m) => m.kind === 'root').length, 3);

  const at = (kind, n) => marks.filter((m) => m.kind === kind)[n];
  assert.ok(Math.abs(at('root', 0).x - 0) < 1e-9);
  assert.ok(Math.abs(at('root', 1).x - Math.PI) < 1e-6);
  assert.ok(Math.abs(at('root', 2).x - TWO_PI) < 1e-9);
  assert.ok(Math.abs(at('max', 0).x - Math.PI / 2) < 1e-6);
  assert.ok(Math.abs(at('min', 0).x - 3 * Math.PI / 2) < 1e-6);
  assert.equal(at('max', 0).y, 1);
  assert.equal(at('min', 0).y, -1);

  // x order, and the one-decimal read-out the description uses
  for (let i = 1; i < marks.length; i++) assert.ok(marks[i].x >= marks[i - 1].x);
  assert.equal(shown(marks), 'root@0 | max@1.6 | root@3.1 | min@4.7 | root@6.3');
});

test('the same sine plus fixed jitter yields an identical landmark list', () => {
  const clean = g.findLandmarks(cleanSine);
  const noisy = g.findLandmarks(noisySine);

  assert.deepEqual(kinds(noisy), kinds(clean));
  assert.equal(noisy.length, 5);
  assert.equal(shown(noisy), shown(clean));
  assert.equal(g.describeLandmarksHe(noisy), g.describeLandmarksHe(clean));

  // and every landmark is within half a sample step of where it truly belongs
  const step = TWO_PI / 200;
  const truth = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2, TWO_PI];
  noisy.forEach((m, i) => assert.ok(Math.abs(m.x - truth[i]) < step / 2,
    m.kind + ' at ' + m.x + ' is more than half a step from ' + truth[i]));
});

test('prominence is what keeps the noisy sine down to two extrema', () => {
  // the literal reading of the same samples: every three-sample wobble counts
  assert.equal(g.findExtrema(noisySine).length, 22);
  assert.equal(g.findExtrema(cleanSine).length, 2);
  // the robust reading throws away everything below epsilon of the range
  assert.equal(g.findLandmarks(noisySine).filter((m) => m.kind === 'max' || m.kind === 'min').length, 2);

  // a small ripple on a large curve is noise at epsilon 0.05 and signal at 0.005
  const ripple = g.sampleCurve((x) => x * x + 0.3 * Math.sin(20 * x), -3, 3, 400);
  const coarse = g.findLandmarks(ripple).filter((m) => m.kind !== 'root').length;
  const fine = g.findLandmarks(ripple, { epsilon: 0.005 }).filter((m) => m.kind !== 'root').length;
  assert.ok(fine > coarse * 3, 'a smaller epsilon must expose the ripples: ' + fine + ' vs ' + coarse);
  // a bad epsilon falls back to the default rather than producing nonsense
  assert.deepEqual(kinds(g.findLandmarks(cleanSine, { epsilon: 0 })), kinds(g.findLandmarks(cleanSine)));
  assert.deepEqual(kinds(g.findLandmarks(cleanSine, { epsilon: -2 })), kinds(g.findLandmarks(cleanSine)));
  assert.deepEqual(kinds(g.findLandmarks(cleanSine, null)), kinds(g.findLandmarks(cleanSine)));
});

test('sign changes closer than one sample step are one crossing', () => {
  // hand-built: the curve crosses once, but noise flips the sign three times
  // inside a single step
  const flips = [
    { i: 0, x: 0, y: -1 }, { i: 1, x: 1, y: -1 }, { i: 2, x: 2, y: -0.02 },
    { i: 3, x: 3, y: 0.01 }, { i: 4, x: 4, y: -0.01 }, { i: 5, x: 5, y: 0.02 },
    { i: 6, x: 6, y: 1 }, { i: 7, x: 7, y: 1 },
  ];
  assert.equal(g.findRoots(flips).length, 2);       // the literal reading
  const marks = g.findLandmarks(flips);
  const roots = marks.filter((m) => m.kind === 'root');
  assert.equal(roots.length, 1);
  assert.equal(g.fmt(roots[0].x), 3.5);
});

test('a constant function has no landmarks, and says so in Hebrew', () => {
  const flat = g.sampleCurve(() => 3, -5, 5, 40);
  assert.deepEqual(g.findLandmarks(flat), []);
  const he = g.describeLandmarksHe(g.findLandmarks(flat), flat);
  assert.equal(he.indexOf(g.FLAT_HE), 0);
  assert.match(he, /שטוח/);
  assert.match(he, /לא הוכחה|לא «קול הפונקציה»/);
  // zero is constant too, and a negative constant
  assert.deepEqual(g.findLandmarks(g.sampleCurve(() => 0, 0, 1, 20)), []);
  assert.deepEqual(g.findLandmarks(g.sampleCurve(() => -7, 0, 1, 20)), []);
  // empty and rubbish input do not throw
  assert.deepEqual(g.findLandmarks([]), []);
  assert.deepEqual(g.findLandmarks(null), []);
});

test('"no landmarks" is not the same claim as "flat"', () => {
  // y = x + 1 on [0, 2] has no root and no turning point, but it is not flat
  // and the sentence must not say it is
  const line = g.sampleCurve((x) => x + 1, 0, 2, 40);
  assert.deepEqual(g.findLandmarks(line), []);
  const he = g.describeLandmarksHe(g.findLandmarks(line), line);
  assert.equal(he.indexOf(g.NO_LANDMARKS_HE), 0);
  assert.doesNotMatch(he, /שטוח|קבוע/);
});

test('the Hebrew description lists landmarks in x order with one decimal', () => {
  const marks = g.findLandmarks(cleanSine);
  const he = g.describeLandmarksHe(marks, cleanSine);
  assert.match(he, /שיא/);
  assert.match(he, /שפל/);
  assert.match(he, /חיתוך עם ציר איקס/);
  assert.match(he, /לא הוכחה|לא «קול הפונקציה»/);

  // every number printed carries at most one decimal place
  (he.match(/-?\d+(?:\.\d+)?/g) || []).forEach((token) => {
    const dot = token.indexOf('.');
    assert.ok(dot === -1 || token.length - dot - 1 <= 1, 'too many decimals: ' + token);
  });

  // the x values appear in ascending order in the sentence itself
  const order = ['באיקס 0', 'באיקס 1.6', 'באיקס 3.1', 'באיקס 4.7', 'באיקס 6.3'];
  let cursor = -1;
  order.forEach((needle) => {
    const at = he.indexOf(needle, cursor + 1);
    assert.ok(at > cursor, needle + ' is out of order in: ' + he);
    cursor = at;
  });
});

test('the endpoint rules hold on curves other than the sine', () => {
  // cos on [0, 4pi]: the values at both ends are 1, and neither is an
  // extremum; the four interior zeros and three interior turning points are.
  const cos = g.findLandmarks(g.sampleCurve(Math.cos, 0, 4 * Math.PI, 400));
  assert.deepEqual(kinds(cos), ['root', 'min', 'root', 'max', 'root', 'min', 'root']);

  // x^2 - 4: two roots and the one minimum, ends are not landmarks
  const quad = g.findLandmarks(g.sampleCurve((x) => x * x - 4, -4, 4, 200));
  assert.deepEqual(kinds(quad), ['root', 'min', 'root']);
  assert.ok(Math.abs(quad[0].x + 2) < 0.01);
  assert.ok(Math.abs(quad[1].x) < 0.01);
  assert.ok(Math.abs(quad[2].x - 2) < 0.01);

  // 1/x spans 20 units, so a fifth of a unit is well inside epsilon of the
  // range — but y(-4) = -0.25 is nowhere near crossing, and the local-slope
  // test must refuse to call the window edges roots.
  const inv = g.findLandmarks(g.sampleCurve((x) => (Math.abs(x) < 0.05 ? NaN : 1 / x), -4, 4, 160));
  assert.equal(inv.filter((m) => m.kind === 'root').length, 0);
  assert.ok(inv.some((m) => m.kind === 'gap'));
  assert.ok(inv.some((m) => m.kind === 'jump'));

  // a gap is reported where the samples stop being defined
  const root = g.findLandmarks(g.sampleCurve((x) => (x >= 0 ? Math.sqrt(x) : NaN), -4, 4, 80));
  assert.ok(root.some((m) => m.kind === 'gap'));
  assert.equal(root.filter((m) => m.kind === 'root').length, 1);
});

test('findLandmarks leaves the literal detectors alone', () => {
  // the older functions still report exactly what they always did
  assert.equal(g.findRoots(cleanSine).length, 3);
  assert.equal(g.findExtrema(cleanSine).length, 2);
  const sum = g.summarizeCurve(cleanSine);
  assert.equal(sum.roots.length, 3);
  assert.equal(sum.extrema.length, 2);
  // trendOf only looks at first / middle / last, and a whole sine period is
  // 0 / 0 / 0 — so "flat" is what it says, and findLandmarks does not change
  // that. Half a period is where it has something to report.
  assert.equal(sum.trend, 'flat');
  assert.equal(g.summarizeCurve(g.sampleCurve(Math.sin, 0, Math.PI, 100)).trend, 'up-then-down');
});

// The two numerical helpers below were found unprotected on 2026-09-10: deleting either left the suite green
// while measurements showed both matter (11x and 2.3x error reductions). These tests fail without them.

test('a root is placed by the least-squares line through the band, not by the one bracketing pair', () => {
  // y = x - 3 sampled at 0.125 + k/4. The two samples bracketing the zero are pushed down by 0.05 and the two
  // beyond them pushed up by 0.05: the bracketing pair alone says t = 0.175/(0.175+0.075) = 0.7, i.e. 3.05,
  // while the fit through the four samples inside the band is exactly y = x - 3 again, i.e. 3.0.
  const pts = [];
  for (let k = 0; k < 24; k++) { const x = 0.125 + k * 0.25; pts.push({ i: k, x: x, y: x - 3 }); }
  const bump = { 2.625: 0.05, 2.875: -0.05, 3.125: -0.05, 3.375: 0.05 };
  pts.forEach((s) => { if (bump[s.x] !== undefined) s.y += bump[s.x]; });
  const roots = g.findLandmarks(pts, { epsilon: 0.1 }).filter((m) => m.kind === 'root');
  assert.equal(roots.length, 1);
  assert.ok(Math.abs(roots[0].x - 3) < 1e-9, 'the fitted root is 3, the bracketing pair alone says 3.05; got ' + roots[0].x);
});

test('a flat-topped peak is placed at the centre of its plateau, not at the first sample that touches the top', () => {
  const ys = [0, 0.2, 0.5, 0.9, 1, 1, 1, 0.9, 0.5, 0.2, 0];
  const pts = ys.map((y, i) => ({ i: i, x: i, y: y }));
  const maxes = g.findLandmarks(pts).filter((m) => m.kind === 'max');
  assert.equal(maxes.length, 1);
  assert.ok(Math.abs(maxes[0].x - 5) < 1e-9, 'the argmax would say 4; the plateau centre is 5; got ' + maxes[0].x);
  assert.equal(maxes[0].y, 1);
});

test('an extremum close to the window edge is placed where it is, not pulled inward', () => {
  // sin(x + 4.24) on [0, 2pi]: the minimum sits at 3pi/2 - 4.24 = 0.4724, fifteen samples from the left edge.
  // Until 2026-09-10 the centroid was clipped to the swing that confirmed the extremum, and reported 0.566 -
  // a whole one-decimal bucket off, and worse than the raw argmax it was meant to improve on.
  const step = TWO_PI / 200;
  const shifted = g.sampleCurve((x) => Math.sin(x + 4.24), 0, TWO_PI, 200);
  const marks = g.findLandmarks(shifted);
  const min = marks.filter((m) => m.kind === 'min')[0];
  assert.ok(min, 'the minimum is reported');
  const truthMin = 3 * Math.PI / 2 - 4.24;
  assert.ok(Math.abs(min.x - truthMin) < step / 2, 'min read at ' + min.x + ', truth ' + truthMin);
  const max = marks.filter((m) => m.kind === 'max')[0];
  const truthMax = Math.PI / 2 - 4.24 + TWO_PI;
  assert.ok(Math.abs(max.x - truthMax) < step / 2, 'max read at ' + max.x + ', truth ' + truthMax);
  assert.equal(g.fmt(min.x), 0.5);
});

// ---------------------------------------------------------------------------
// R2-A — the audio control state machine (WCAG 1.4.2 / EN 301 549 9.1.4.2).
//
// Every expected object below was written out by hand from the rules in the
// header of src/lib/graphListen.js before the reducer existed. No audio API,
// no timer, no clock.
// ---------------------------------------------------------------------------

const IDLE = { status: 'idle', volume: 0.8, position: 0 };

test('audio starts idle, and only PLAY can leave idle', () => {
  assert.deepEqual(g.initialAudioState(), IDLE);
  assert.equal(g.AUDIO_DEFAULT_VOLUME, 0.8);
  assert.deepEqual(g.AUDIO_STATUSES, ['idle', 'playing', 'paused', 'stopped']);

  // "no audio on load" as a machine-checkable claim: nothing but PLAY moves it
  ['PAUSE', 'STOP', 'SET_VOLUME', 'SEEK', '', 'play'].forEach((type) => {
    assert.equal(g.updateAudioState(IDLE, { type: type }).status, 'idle', type);
  });
  assert.equal(g.updateAudioState(IDLE, { type: 'PLAY' }).status, 'playing');
  assert.equal(g.updateAudioState(IDLE, 'PLAY').status, 'playing');
  assert.equal(g.updateAudioState(IDLE, null).status, 'idle');
});

test('the child volume is clamped once, at the door, and 0 is a real volume', () => {
  assert.equal(g.initialAudioState(0.25).volume, 0.25);
  assert.equal(g.initialAudioState(0).volume, 0);
  assert.equal(g.initialAudioState(5).volume, 1);
  assert.equal(g.initialAudioState(-1).volume, 0);
  assert.equal(g.initialAudioState('loud').volume, 0.8);
  assert.equal(g.initialAudioState(undefined).volume, 0.8);
});

test('PLAY, PAUSE, PLAY, STOP keeps the position across the pause and rewinds on stop', () => {
  const played = g.updateAudioState(IDLE, { type: 'PLAY' });
  assert.deepEqual(played, { status: 'playing', volume: 0.8, position: 0 });

  const paused = g.updateAudioState(played, { type: 'PAUSE', position: 12 });
  assert.deepEqual(paused, { status: 'paused', volume: 0.8, position: 12 });

  const resumed = g.updateAudioState(paused, { type: 'PLAY' });
  assert.deepEqual(resumed, { status: 'playing', volume: 0.8, position: 12 });

  const stopped = g.updateAudioState(resumed, { type: 'STOP' });
  assert.deepEqual(stopped, { status: 'stopped', volume: 0.8, position: 0 });

  // and PLAY after a stop starts from the beginning, because STOP rewound it
  assert.deepEqual(g.updateAudioState(stopped, { type: 'PLAY' }),
    { status: 'playing', volume: 0.8, position: 0 });
});

test('a second PLAY while playing changes nothing — not even the position', () => {
  const playing = g.updateAudioState(IDLE, { type: 'PLAY', position: 4 });
  assert.deepEqual(playing, { status: 'playing', volume: 0.8, position: 4 });
  // a second press must not restart the sweep under the child, and must not
  // start a second voice at a different offset
  assert.deepEqual(g.updateAudioState(playing, { type: 'PLAY' }), playing);
  assert.deepEqual(g.updateAudioState(playing, { type: 'PLAY', position: 99 }), playing);
  assert.deepEqual(g.updateAudioState(g.updateAudioState(playing, { type: 'PLAY' }),
    { type: 'PLAY' }), playing);
});

test('STOP from idle stays idle; from anywhere else it stops and rewinds', () => {
  // nothing is making a sound, so there is nothing to stop — and answering
  // "stopped" would assert that something had played
  assert.deepEqual(g.updateAudioState(IDLE, { type: 'STOP' }), IDLE);

  const playing = { status: 'playing', volume: 0.3, position: 9 };
  const paused = { status: 'paused', volume: 0.3, position: 9 };
  const stopped = { status: 'stopped', volume: 0.3, position: 0 };
  assert.deepEqual(g.updateAudioState(playing, { type: 'STOP' }), stopped);
  assert.deepEqual(g.updateAudioState(paused, { type: 'STOP' }), stopped);
  assert.deepEqual(g.updateAudioState(stopped, { type: 'STOP' }), stopped);
});

test('PAUSE only bites while playing', () => {
  const paused = { status: 'paused', volume: 0.8, position: 5 };
  assert.deepEqual(g.updateAudioState(paused, { type: 'PAUSE', position: 40 }), paused);
  const stopped = { status: 'stopped', volume: 0.8, position: 0 };
  assert.deepEqual(g.updateAudioState(stopped, { type: 'PAUSE', position: 40 }), stopped);
  assert.deepEqual(g.updateAudioState(IDLE, { type: 'PAUSE', position: 40 }), IDLE);
  // while playing it records where the sweep got to
  assert.deepEqual(g.updateAudioState({ status: 'playing', volume: 0.8, position: 1 },
    { type: 'PAUSE', position: 40 }), { status: 'paused', volume: 0.8, position: 40 });
  // a position that is not a number is not a position
  ['3', null, undefined, NaN, {}].forEach((bad) => {
    assert.deepEqual(g.updateAudioState({ status: 'playing', volume: 0.8, position: 1 },
      { type: 'PAUSE', position: bad }), { status: 'paused', volume: 0.8, position: 1 },
      String(bad));
  });
  assert.deepEqual(g.updateAudioState({ status: 'playing', volume: 0.8, position: 1 },
    { type: 'PAUSE', position: -5 }), { status: 'paused', volume: 0.8, position: 0 });
});

test('SET_VOLUME never changes the status, and the volume survives a stop', () => {
  const playing = { status: 'playing', volume: 0.8, position: 6 };
  assert.deepEqual(g.updateAudioState(playing, { type: 'SET_VOLUME', volume: 0.3 }),
    { status: 'playing', volume: 0.3, position: 6 });
  assert.deepEqual(g.updateAudioState(playing, { type: 'SET_VOLUME', volume: 0 }),
    { status: 'playing', volume: 0, position: 6 });
  assert.deepEqual(g.updateAudioState(playing, { type: 'SET_VOLUME', volume: 1.5 }),
    { status: 'playing', volume: 1, position: 6 });
  assert.deepEqual(g.updateAudioState(playing, { type: 'SET_VOLUME', volume: -0.2 }),
    { status: 'playing', volume: 0, position: 6 });
  // an unreadable volume leaves the one the child already chose
  assert.deepEqual(g.updateAudioState(playing, { type: 'SET_VOLUME', volume: 'loud' }), playing);
  assert.deepEqual(g.updateAudioState(playing, { type: 'SET_VOLUME' }), playing);
  // it works before anything has played, and it does not start anything
  assert.deepEqual(g.updateAudioState(IDLE, { type: 'SET_VOLUME', volume: 0.1 }),
    { status: 'idle', volume: 0.1, position: 0 });
  // and the stop that follows keeps it
  assert.equal(g.updateAudioState({ status: 'playing', volume: 0.1, position: 3 },
    { type: 'STOP' }).volume, 0.1);
});

test('the reducer is pure: the state that came in is never touched', () => {
  const before = Object.freeze({ status: 'playing', volume: 0.8, position: 2 });
  const after = g.updateAudioState(before, { type: 'PAUSE', position: 7 });
  assert.deepEqual(before, { status: 'playing', volume: 0.8, position: 2 });
  assert.equal(after.position, 7);
  // even a no-op hands back a fresh object rather than the caller's
  const noop = g.updateAudioState(before, { type: 'NOPE' });
  assert.deepEqual(noop, before);
  assert.notEqual(noop, before);
});

test('a half-written or stored state is read into a whole one', () => {
  assert.deepEqual(g.normalizeAudioState(null), IDLE);
  assert.deepEqual(g.normalizeAudioState({}), IDLE);
  assert.deepEqual(g.normalizeAudioState('playing'), IDLE);
  // a status nobody defined is idle; the volume is still only clamped, never dropped
  assert.deepEqual(g.normalizeAudioState({ status: 'dancing', volume: 9, position: -4 }),
    { status: 'idle', volume: 1, position: 0 });
  assert.deepEqual(g.normalizeAudioState({ status: 'paused', position: '12' }),
    { status: 'paused', volume: 0.8, position: 0 });
  assert.deepEqual(g.normalizeAudioState({ status: 'paused', volume: 0, position: 12 }),
    { status: 'paused', volume: 0, position: 12 });
});

test('a whole session folds to one state', () => {
  const session = [
    { type: 'PLAY' },
    { type: 'SET_VOLUME', volume: 0.5 },
    { type: 'PAUSE', position: 7 },
    { type: 'PLAY' },
    { type: 'STOP' },
    { type: 'PLAY' },
  ];
  assert.deepEqual(g.reduceAudioEvents(g.initialAudioState(), session),
    { status: 'playing', volume: 0.5, position: 0 });

  // the same events, one at a time, land in the same place
  let step = g.initialAudioState();
  session.forEach((ev) => { step = g.updateAudioState(step, ev); });
  assert.deepEqual(step, { status: 'playing', volume: 0.5, position: 0 });

  // pressing stop twice at the end is still stopped, at the start, same volume
  assert.deepEqual(g.reduceAudioEvents(g.initialAudioState(),
    session.concat([{ type: 'STOP' }, { type: 'STOP' }])),
    { status: 'stopped', volume: 0.5, position: 0 });

  assert.deepEqual(g.reduceAudioEvents(null, null), IDLE);
  assert.deepEqual(g.reduceAudioEvents(null, []), IDLE);
});
