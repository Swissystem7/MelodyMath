const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const me = require('../src/lib/musicEngine');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'frequency.html'), 'utf8');


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
