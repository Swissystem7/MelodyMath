const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('index.html playground defines rhythm generator accuracy slider with accessible WAI-ARIA markup', () => {
  assert.match(indexHtml, /id="accuracy"[^>]*type="range"[^>]*min="0"[^>]*max="100"/);
  assert.match(indexHtml, /id="accuracy"[^>]*aria-valuemin="0"[^>]*aria-valuemax="100"/);
  assert.match(indexHtml, /id="accuracy"[^>]*aria-valuenow="70"/);
  assert.match(indexHtml, /id="accuracy"[^>]*aria-valuetext="70%"/);
  assert.match(indexHtml, /id="accuracy"[^>]*aria-label="דיוק אחרון במחולל המקצב"/);
  assert.match(indexHtml, /<b id="accuracyLabel">70%<\/b>/);
  assert.match(indexHtml, /<div id="rhythm" class="result rhythm" aria-live="polite"><\/div>/);
});

test('index.html wires updateRhythmAccuracy to input#accuracy and rhythmLevel change event', () => {
  assert.match(indexHtml, /function updateRhythmAccuracy\(val\)/);
  assert.match(indexHtml, /\$\('accuracy'\)\.oninput\s*=\s*function\s*\(\)\s*\{/);
  assert.match(indexHtml, /\$\('rhythmLevel'\)\.onchange\s*=\s*function\s*\(\)\s*\{/);
  assert.match(indexHtml, /updateRhythmAccuracy\(70\)/);
});

test('updateRhythmAccuracy updates slider value, label, ARIA attributes, and rhythm preview', () => {
  const { formatRhythmPattern } = require('../src/lib/sonify');

  const els = {
    accuracy: {
      value: '70',
      attrs: {},
      setAttribute(k, v) { this.attrs[k] = String(v); },
      getAttribute(k) { return this.attrs[k]; },
    },
    rhythmLevel: { value: '3' },
    accuracyLabel: { textContent: '' },
    rhythm: { innerHTML: '' },
    makeRhythm: { onclick: null },
  };

  const played = [];
  const ctx = {
    $: (id) => els[id] || null,
    formatRhythmPattern,
    playRhythmClicks: (pattern, bpm) => { played.push({ pattern, bpm }); },
  };

  const fnGen = indexHtml.match(/function generateRhythmExercise\(level,accuracy\)[\s\S]*?\n(?=function)/)[0];
  const fnShow = indexHtml.match(/function showRhythm\(play\)[\s\S]*?\n(?=function)/)[0];
  const fnUpdate = indexHtml.match(/function updateRhythmAccuracy\(val\)[\s\S]*?\n(?=if)/)[0];

  vm.createContext(ctx);
  vm.runInContext(fnGen + '\n' + fnShow + '\n' + fnUpdate, ctx);

  // Initialize at 70%
  ctx.updateRhythmAccuracy(70);
  assert.equal(els.accuracy.value, 70);
  assert.equal(els.accuracy.attrs['aria-valuenow'], '70');
  assert.equal(els.accuracy.attrs['aria-valuetext'], '70%');
  assert.equal(els.accuracyLabel.textContent, '70%');
  assert.match(els.rhythm.innerHTML, /BPM/);
  assert.equal(played.length, 0); // showRhythm(false) does not play audio clicks

  // Change accuracy to 30% (lower accuracy increases tempo slack / adjustments)
  ctx.updateRhythmAccuracy(30);
  assert.equal(els.accuracy.value, 30);
  assert.equal(els.accuracy.attrs['aria-valuenow'], '30');
  assert.equal(els.accuracy.attrs['aria-valuetext'], '30%');
  assert.equal(els.accuracyLabel.textContent, '30%');
  assert.match(els.rhythm.innerHTML, /BPM/);

  // Out of bound inputs are clamped safely
  ctx.updateRhythmAccuracy(-15);
  assert.equal(els.accuracy.value, 0);
  assert.equal(els.accuracy.attrs['aria-valuenow'], '0');
  assert.equal(els.accuracy.attrs['aria-valuetext'], '0%');
  assert.equal(els.accuracyLabel.textContent, '0%');

  ctx.updateRhythmAccuracy(120);
  assert.equal(els.accuracy.value, 100);
  assert.equal(els.accuracy.attrs['aria-valuenow'], '100');
  assert.equal(els.accuracy.attrs['aria-valuetext'], '100%');
  assert.equal(els.accuracyLabel.textContent, '100%');

  // Triggering showRhythm(true) plays the pattern
  ctx.showRhythm(true);
  assert.equal(played.length, 1);
  assert.ok(Array.isArray(played[0].pattern));
  assert.ok(played[0].bpm > 0);
});

test('rhythm generator tool preserves honesty guidelines without therapy claims', () => {
  const toolSnippet = indexHtml.match(/<div class="tool"><h3>מחולל מקצב<\/h3>[\s\S]*?<\/div><\/div>/)[0];
  assert.match(toolSnippet, /מחולל מקצב/);
  assert.doesNotMatch(toolSnippet, /טיפול|ריפוי|שיפור מוכח|מאושר על ידי/);
});
