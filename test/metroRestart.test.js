// The click track must keep its phase across answers: startMetro() plays a
// click immediately and resets the interval, so it may run only when the
// tempo actually changes, not on every pick in beat mode.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const metro = require('../src/lib/metro.js');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function metroBlock() {
  const start = indexHtml.indexOf('let metroTimer=null');
  const end = indexHtml.indexOf("document.addEventListener('visibilitychange'", start);
  assert.ok(start > 0 && end > start, 'metro block must exist in index.html');
  return indexHtml.slice(start, end);
}

function boot(opts) {
  const els = {
    metroBpm: { value: String(opts.bpm == null ? 80 : opts.bpm), onchange: null },
    metroAccel: { checked: !!opts.accel },
    metroToggle: { textContent: '', attrs: {}, setAttribute(k, v) { this.attrs[k] = v; }, onclick: null },
    metroDown: { onclick: null },
    metroUp: { onclick: null },
  };
  const calls = { clicks: 0, starts: 0, clears: 0 };
  const sandbox = Object.assign({}, metro, {
    $: function (id) { return els[id] || null; },
    playClick: function () { calls.clicks += 1; },
    setInterval: function () { calls.starts += 1; return calls.starts; },
    clearInterval: function () { calls.clears += 1; },
  });
  vm.createContext(sandbox);
  vm.runInContext(metroBlock() + '\nthis.api={startMetro,stopMetro,noteMetro,setMetroBpm,metroBpmNow,isOn:function(){return metroOn},streak:function(){return metroStreak}};', sandbox);
  return { api: sandbox.api, els: els, calls: calls };
}

test('a correct answer with accelerate on does not restart the click track until the tempo changes', () => {
  const { api, els, calls } = boot({ bpm: 80, accel: true });
  api.startMetro();
  assert.equal(calls.starts, 1);
  assert.equal(calls.clicks, 1);
  api.noteMetro(true);
  api.noteMetro(true);
  assert.equal(Number(els.metroBpm.value), 80);
  assert.equal(calls.starts, 1, 'no restart while the tempo holds');
  assert.equal(calls.clicks, 1, 'no extra off-beat click');
  api.noteMetro(true);
  assert.equal(Number(els.metroBpm.value), 80 + metro.STREAK_STEP);
  assert.equal(calls.starts, 2, 'one restart when the tempo rises');
});

test('setMetroBpm restarts only on a real change and never when the metronome is off', () => {
  const { api, els, calls } = boot({ bpm: 80 });
  api.setMetroBpm(80);
  assert.equal(calls.starts, 0);
  api.setMetroBpm(96);
  assert.equal(Number(els.metroBpm.value), 96);
  assert.equal(calls.starts, 0, 'metronome off: write the value, do not start it');
  api.startMetro();
  api.setMetroBpm(96);
  assert.equal(calls.starts, 1);
  api.setMetroBpm(100);
  assert.equal(calls.starts, 2);
});

test('the down button at the minimum tempo does not restart the click track', () => {
  const { api, els, calls } = boot({ bpm: metro.BPM_MIN });
  api.startMetro();
  els.metroDown.onclick();
  assert.equal(Number(els.metroBpm.value), metro.BPM_MIN);
  assert.equal(calls.starts, 1);
  els.metroUp.onclick();
  assert.equal(Number(els.metroBpm.value), metro.BPM_MIN + 4);
  assert.equal(calls.starts, 2);
});

test('beat mode writes the paced tempo through setMetroBpm instead of restarting on every pick', () => {
  const pick = indexHtml.match(/function finishBeatPick\(value, correct, late\)\{[\s\S]*?\r?\n\}\r?\n/)[0];
  assert.match(pick, /setMetroBpm\(paced\.bpm\)/);
  assert.doesNotMatch(pick, /if\(metroOn\) startMetro\(\)/);
});
