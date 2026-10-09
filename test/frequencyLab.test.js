const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const me = require('../src/lib/musicEngine');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'frequency.html'), 'utf8');

// ---------- the numbers behind the lab ----------

test('an octave is ×2 and a child may answer 2, 2:1, 2/1 or פי 2', () => {
  assert.equal(me.ratioToHz(220, 2, 1), 440);
  assert.equal(me.ratioText(2, 1), '2:1');
  assert.equal(me.ratioText(4, 2), '2:1');
  ['2', '2:1', '2/1', 'פי 2', '2.0'].forEach((answer) => {
    assert.equal(me.ratioMatches(answer, 2, 1), true, answer);
  });
  ['', '1', '0', '3:2', 'שתיים', '2:0'].forEach((answer) => {
    assert.equal(me.ratioMatches(answer, 2, 1), false, answer);
  });
});

test('a fifth is 3:2 and a fourth is 4:3, and 1.5 passes for the fifth', () => {
  assert.equal(me.ratioToHz(220, 3, 2), 330);
  assert.equal(me.ratioToHz(220, 4, 3), 880 / 3);
  assert.equal(me.hzText(me.ratioToHz(220, 4, 3)), '293.3 Hz');
  assert.equal(me.hzText(330), '330 Hz');
  assert.equal(me.ratioMatches('1.5', 3, 2), true);
  assert.equal(me.ratioMatches('3/2', 3, 2), true);
  assert.equal(me.ratioMatches('1.4', 3, 2), false);
});

test('the harmonic series is arithmetic: every gap is f0', () => {
  const series = me.harmonicSeries(110, 6);
  assert.deepEqual(series.map((h) => h.hz), [110, 220, 330, 440, 550, 660]);
  assert.deepEqual(series.map((h) => h.gap), [0, 110, 110, 110, 110, 110]);
  assert.equal(me.commonDifference(series.map((h) => h.hz)), 110);
  assert.equal(me.commonDifference([110, 220, 330, 441]), null);
  assert.equal(me.commonDifference([220]), null);
  assert.deepEqual(me.harmonicSeries(110, 0), []);
  assert.deepEqual(me.harmonicSeries(0, 6), []);
  assert.deepEqual(me.harmonicSeries(110, 99), []);
});

test('the monochord is an inverse ratio: a shorter string sounds higher', () => {
  assert.equal(me.monochordHz(220, '1/2'), 440);
  assert.equal(me.monochordHz(220, '2/3'), 330);
  assert.equal(me.monochordHz(220, '1/1'), 220);
  assert.equal(me.monochordInterval('1/2'), 'octave');
  assert.equal(me.monochordInterval('2/3'), 'fifth');
  assert.equal(me.monochordInterval('3/4'), 'fourth');
  assert.equal(me.monochordInterval('4/5'), 'majorthird');
  assert.equal(me.monochordInterval('3/5'), null, '5/3 is not one of the named intervals');
  assert.equal(me.monochordHz(220, '3/2'), null, 'more than the whole string is not a stop');
  assert.equal(me.monochordHz(0, '1/2'), null);
});

test('every slider stop is a simple fraction of the string and stays in the safe range', () => {
  const stops = me.stringStops();
  assert.equal(stops.length, 8);
  assert.deepEqual(stops[0], { n: 1, d: 1 });
  assert.deepEqual(stops[stops.length - 1], { n: 1, d: 2 });
  stops.forEach((f) => {
    assert.ok(f.n <= f.d, me.fractionText(f));
    assert.ok(f.d <= 8, 'stops stay readable: ' + me.fractionText(f));
    const hz = me.monochordHz(220, f);
    assert.equal(me.clampHz(hz), hz, me.fractionText(f) + ' → ' + hz);
  });
  // The stops only rise: dragging towards a shorter string never drops the pitch.
  const pitches = stops.map((f) => me.monochordHz(220, f));
  pitches.slice(1).forEach((hz, i) => assert.ok(hz > pitches[i]));
});

test('the 12-TET fifth is a hair under 3:2, as a plain number', () => {
  const tet = me.temperedRatio(7);
  assert.ok(Math.abs(tet - 1.498307) < 1e-6);
  assert.equal(me.temperedRatio(12), 2, 'twelve equal steps are exactly an octave');
  assert.equal(me.ratioDriftPercent(tet, 1.5), -0.11);
  assert.equal(me.ratioDriftPercent(2, 1), 100);
  assert.equal(me.ratioDriftPercent(1, 0), null);
  assert.equal(me.temperedRatio('x'), null);
});

// ---------- the page, run the way a browser runs it ----------

// A fake DOM just big enough for frequency.html: elements appear on demand, and
// a fake AudioContext records every oscillator so the test can check what would
// have sounded. readyState 'loading' keeps core.js from installing the chrome.
function runPage() {
  const sounded = [];
  const gains = [];
  function makeEl(tag) {
    const el = {
      tagName: tag, children: [], dataset: {}, style: {}, attrs: {}, handlers: {},
      textContent: '', innerHTML: '', className: '', value: '0', type: '', hidden: false,
      setAttribute(k, v) { this.attrs[k] = String(v); },
      getAttribute(k) { return this.attrs[k] == null ? null : this.attrs[k]; },
      addEventListener(ev, fn) { (this.handlers[ev] = this.handlers[ev] || []).push(fn); },
      appendChild(child) { this.children.push(child); return child; },
      querySelector() { return null; },
      fire(ev) { (this.handlers[ev] || []).forEach((fn) => fn({ target: this })); },
    };
    // Setting an id registers the element, the way the document would.
    Object.defineProperty(el, 'id', {
      get() { return el.attrs.id || ''; },
      set(v) { el.attrs.id = String(v); els[v] = el; },
    });
    return el;
  }
  const els = {};
  const docHandlers = {};
  const document = {
    readyState: 'loading',
    getElementById(id) {
      if (!els[id]) els[id] = makeEl('div');
      return els[id];
    },
    createElement: makeEl,
    addEventListener(ev, fn) { (docHandlers[ev] = docHandlers[ev] || []).push(fn); },
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
  function FakeAudioContext() {
    this.state = 'running';
    this.currentTime = 0;
    this.sampleRate = 48000;
    this.destination = { name: 'destination' };
  }
  FakeAudioContext.prototype.createBuffer = function () { return {}; };
  FakeAudioContext.prototype.createBufferSource = function () {
    return { buffer: null, connect() {}, start() {} };
  };
  FakeAudioContext.prototype.createOscillator = function () {
    return {
      type: '',
      frequency: { setValueAtTime(hz, at) { sounded.push({ hz, at }); } },
      connect(target) { return target; },
      start() {}, stop() {}, disconnect() {},
    };
  };
  FakeAudioContext.prototype.createGain = function () {
    return {
      gain: {
        setValueAtTime(v) { gains.push(v); },
        linearRampToValueAtTime(v) { gains.push(v); },
      },
      connect(target) { return target; },
      disconnect() {},
    };
  };
  const errors = [];
  const ctx = vm.createContext({
    document,
    window: { AudioContext: FakeAudioContext },
    navigator: { userAgent: 'node' },
    console: { error(...a) { errors.push(a.join(' ')); }, warn() {}, log() {} },
    setTimeout, clearTimeout, localStorage: undefined,
  });
  ctx.globalThis = ctx;
  Array.from(page.matchAll(/<script(?:\s+src="([^"]+)")?\s*>([\s\S]*?)<\/script>/g)).forEach((m) => {
    if (m[1]) vm.runInContext(fs.readFileSync(path.join(root, m[1]), 'utf8'), ctx, { filename: m[1] });
    else vm.runInContext(m[2], ctx, { filename: 'frequency.html inline script' });
  });
  return { els, get: (id) => document.getElementById(id), docHandlers, sounded, gains, errors };
}

test('frequency.html loads without throwing and fills in the computed numbers', () => {
  let out;
  assert.doesNotThrow(() => { out = runPage(); });
  assert.deepEqual(out.errors, []);
  assert.match(out.els.harmRows.innerHTML, /110 Hz/);
  assert.match(out.els.harmRows.innerHTML, /660 Hz/);
  assert.match(out.els.harmNote.innerHTML, /110 Hz/);
  assert.match(out.els.intRows.children[0].innerHTML, /3:2/);
  assert.match(out.els.intRows.children[0].innerHTML, /330 Hz/);
  assert.match(out.els.intRows.children[1].innerHTML, /4:3/);
  assert.match(out.els.tetDrift.innerHTML, /0\.11%/);
  assert.match(out.els.stringOut.innerHTML, /220 Hz/);
  assert.equal(out.els.stringBar.style.width, '100%');
});

test('nothing sounds before a gesture, and one tap is enough for the A/B compare', () => {
  const out = runPage();
  // Dragging the handle before any gesture only updates the text.
  out.els.stringSlider.value = '7';
  out.els.stringSlider.fire('input');
  assert.deepEqual(out.sounded, [], 'no sound before a user gesture');
  assert.match(out.els.stringOut.innerHTML, /440 Hz/);
  assert.match(out.els.stringSlider.getAttribute('aria-valuetext'), /אוקטבה/);

  // The first pointerdown unlocks audio; the tap that lands on the button plays.
  assert.ok(out.docHandlers.pointerdown, 'the page unlocks audio on pointerdown');
  out.docHandlers.pointerdown.forEach((fn) => fn({}));
  out.els.octAb.fire('click');
  assert.deepEqual(out.sounded.map((s) => s.hz), [220, 440]);
  assert.ok(out.sounded[1].at > out.sounded[0].at, 'the two tones are one after the other');
  assert.match(out.els.live.textContent, /220 Hz/);
  assert.match(out.els.live.textContent, /440 Hz/);
});

test('"play again" repeats the last sound, and every sound stays inside the safety limits', () => {
  const out = runPage();
  out.docHandlers.pointerdown.forEach((fn) => fn({}));
  out.els.harmPlay.fire('click');
  const series = out.sounded.map((s) => s.hz);
  assert.deepEqual(series, [110, 220, 330, 440, 550, 660]);
  const text = out.els.live.textContent;
  out.els.again.fire('click');
  assert.deepEqual(out.sounded.map((s) => s.hz), series.concat(series));
  assert.equal(out.els.live.textContent, text);

  out.get('both-fifth').fire('click'); // the fifth, both tones at once
  out.sounded.forEach((s) => assert.equal(me.clampHz(s.hz), s.hz, s.hz + ' Hz'));
  out.gains.forEach((g) => assert.ok(g <= me.MAX_GAIN, 'gain ' + g));
  assert.ok(out.gains.some((g) => g > 0), 'something actually sounded');
});

test('checking the octave answer says why, right or wrong', () => {
  const out = runPage();
  out.get('octAnswer').value = '2:1';
  out.get('octCheck').fire('click');
  assert.match(out.get('octFeedback').className, /\bok\b/);
  assert.match(out.get('octFeedback').textContent, /440/);
  out.get('octAnswer').value = '3';
  out.get('octCheck').fire('click');
  assert.match(out.get('octFeedback').className, /\bno\b/);
});

// ---------- mobile, RTL and offline guards ----------

test('the lab is Hebrew RTL with its maths isolated LTR, and no efficacy claim', () => {
  assert.match(page, /lang="he"/);
  assert.match(page, /dir="rtl"/);
  assert.match(page, /<bdi dir="ltr">220 Hz<\/bdi>/);
  assert.match(page, /unicode-bidi:isolate/);
  assert.match(page, /id="live"[^>]*aria-live/);
  assert.match(page, /id="octFeedback"[^>]*aria-live/);
  assert.match(page, /id="stringOut"[^>]*aria-live/);
  assert.doesNotMatch(page, /משפר|מוכח|סוגרים פערים|טיפול ב/);
});

test('every control is a 44px target and the monochord handle is keyboard-operable', () => {
  assert.match(page, /button\{[^}]*min-height:44px/);
  assert.match(page, /button\{[^}]*min-width:44px/);
  assert.match(page, /input\[type=text\]\{[^}]*min-height:44px/);
  assert.match(page, /input\[type=range\]\{[^}]*min-height:48px/);
  assert.match(page, /::-webkit-slider-thumb\{[^}]*width:44px;height:44px/);
  assert.match(page, /type="range"/, 'a range input gives arrow-key control for free');
  assert.match(page, /gap:10px/, 'at least 8px between targets');
  assert.doesNotMatch(page, /width:\s*\d{4,}px/, 'nothing wider than the phone viewport');
});

test('the lab is reachable from home and precached for offline use', () => {
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /href="frequency\.html"/);
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(sw, /'\.\/frequency\.html'/);
  assert.match(sw, /'\.\/src\/lib\/musicEngine\.js'/);
  const v = sw.match(/const CACHE = 'melodymath-offline-v(\d+)'/);
  assert.ok(Number(v[1]) > 9, 'the cache must be bumped past v9 for the new files; it is v' + v[1]);
});
