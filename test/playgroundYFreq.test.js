const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('index.html playground defines screen height Y frequency slider with accessible WAI-ARIA markup', () => {
  assert.match(indexHtml, /id="y"[^>]*type="range"[^>]*min="0"[^>]*max="100"/);
  assert.match(indexHtml, /id="y"[^>]*aria-label="גובה על המסך לתדר"/);
  assert.match(indexHtml, /id="y"[^>]*aria-valuenow="50"/);
  assert.match(indexHtml, /id="y"[^>]*aria-valuetext="50% · 370 Hz"/);
  assert.match(indexHtml, /<div id="freq" class="result" aria-live="polite"><\/div>/);
  assert.match(indexHtml, /<b id="yLabel">50<\/b>/);
});

test('index.html wires updateYFreq to input#y and initializes default value', () => {
  assert.match(indexHtml, /function updateYFreq\(val,\s*play\)/);
  assert.match(indexHtml, /\$\('y'\)\.oninput\s*=\s*function\s*\(\)\s*\{/);
  assert.match(indexHtml, /updateYFreq\(50,\s*false\)/);
});

test('updateYFreq correctly maps slider percentages to Hz frequencies and updates UI and ARIA attributes', () => {
  const { yToFreq } = require('../src/lib/sonify');

  const els = {
    y: {
      value: '50',
      attrs: {},
      setAttribute(k, v) { this.attrs[k] = String(v); },
      getAttribute(k) { return this.attrs[k]; },
    },
    yLabel: { textContent: '' },
    freq: { innerHTML: '' },
  };

  const played = [];
  const ctx = {
    $: (id) => els[id] || null,
    yToFreq,
    playFreq: (f, d) => { played.push({ f, d }); },
    yAudioThrottle: null,
    clearTimeout: () => {},
    setTimeout: (fn) => fn(),
  };

  const fnSrc = indexHtml.match(/function updateYFreq\(val,\s*play\)[\s\S]*?\n(?=function|\$|\/\/)/)[0];
  vm.createContext(ctx);
  vm.runInContext(fnSrc, ctx);

  // Initial call at 50%
  ctx.updateYFreq(50, false);
  assert.equal(els.y.value, 50);
  assert.equal(els.y.attrs['aria-valuenow'], '50');
  assert.equal(els.y.attrs['aria-valuetext'], '50% · 370 Hz');
  assert.equal(els.yLabel.textContent, '50');
  assert.match(els.freq.innerHTML, /<b>370 Hz<\/b> · מיקום Y: 50%/);
  assert.equal(played.length, 0);

  // Bottom endpoint at 0% (C3 ~ 131 Hz)
  ctx.updateYFreq(0, true);
  assert.equal(els.y.value, 0);
  assert.equal(els.y.attrs['aria-valuenow'], '0');
  assert.equal(els.y.attrs['aria-valuetext'], '0% · 131 Hz');
  assert.equal(els.yLabel.textContent, '0');
  assert.match(els.freq.innerHTML, /<b>131 Hz<\/b> · מיקום Y: 0%/);
  assert.equal(played.length, 1);
  assert.equal(played[0].f, 131);

  // Top endpoint at 100% (C6 ~ 1047 Hz)
  ctx.updateYFreq(100, true);
  assert.equal(els.y.value, 100);
  assert.equal(els.y.attrs['aria-valuenow'], '100');
  assert.equal(els.y.attrs['aria-valuetext'], '100% · 1047 Hz');
  assert.equal(els.yLabel.textContent, '100');
  assert.match(els.freq.innerHTML, /<b>1047 Hz<\/b> · מיקום Y: 100%/);
  assert.equal(played.length, 2);
  assert.equal(played[1].f, 1047);

  // Out of bound inputs are clamped safely
  ctx.updateYFreq(-20, false);
  assert.equal(els.y.value, 0);
  ctx.updateYFreq(150, false);
  assert.equal(els.y.value, 100);
});

test('playground tab maintains honesty guidelines without medical or diagnostic claims', () => {
  const playgroundSnippet = indexHtml.match(/<section id="playground"[\s\S]*?<\/section>/)[0];
  assert.match(playgroundSnippet, /סטודיו מקצב וצליל · העשרה/);
  assert.doesNotMatch(playgroundSnippet, /טיפול|ריפוי|אבחון קליני|שיפור מוכח/);
});
