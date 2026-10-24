const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const nl = require('../src/lib/numberLine');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('singingLine has WAI-ARIA slider semantics and fraction preset group', () => {
  // Slider markup
  assert.match(indexHtml, /id="singingLine"[^>]*type="range"/);
  assert.match(indexHtml, /id="singingLine"[^>]*aria-valuemin="0"/);
  assert.match(indexHtml, /id="singingLine"[^>]*aria-valuemax="100"/);
  assert.match(indexHtml, /id="singingLine"[^>]*aria-valuenow="50"/);
  assert.match(indexHtml, /id="singingLine"[^>]*aria-valuetext="/);
  assert.match(indexHtml, /id="singingLine"[^>]*aria-label="מיקום על ישר המספרים"/);

  // Group container
  assert.match(indexHtml, /class="nl-keys"[^>]*role="group"/);
  assert.match(indexHtml, /class="nl-keys"[^>]*aria-label="נקודות שבר עיקריות על ישר המספרים"/);

  // Preset buttons
  assert.match(indexHtml, /<button[^>]*data-pct="0"[^>]*aria-pressed="false"/);
  assert.match(indexHtml, /<button[^>]*data-pct="25"[^>]*aria-pressed="false"/);
  assert.match(indexHtml, /<button[^>]*data-pct="50"[^>]*aria-pressed="true"/);
  assert.match(indexHtml, /<button[^>]*class="[^"]*\bselected\b[^"]*"[^>]*data-pct="50"/);
  assert.match(indexHtml, /<button[^>]*data-pct="75"[^>]*aria-pressed="false"/);
  assert.match(indexHtml, /<button[^>]*data-pct="100"[^>]*aria-pressed="false"/);
});

test('singingLine and preset buttons have accessible CSS styles', () => {
  assert.match(indexHtml, /\.nl-control input\[type=range\]\{[^}]*min-height:48px/);
  assert.match(indexHtml, /\.nl-keys button\{[^}]*min-height:44px/);
  assert.match(indexHtml, /\.nl-keys button\{[^}]*min-width:44px/);
  assert.match(indexHtml, /\.nl-keys button\.selected,\s*\.nl-keys button\[aria-pressed="true"\]/);
  assert.match(indexHtml, /\.nl-keys button:focus-visible\{[^}]*outline:/);
});

test('updateSingingLine updates slider ARIA values and preset button aria-pressed state', () => {
  const fnMatch = indexHtml.match(/function updateSingingLine\([^)]*\)\{[\s\S]*?\n(?=if\(\$\('singingLine'\)\))/);
  assert.ok(fnMatch, 'updateSingingLine function found in index.html');
  const fnCode = fnMatch[0];

  function createEl(attrs = {}) {
    return {
      value: attrs.value || '0',
      textContent: '',
      innerHTML: '',
      dataset: attrs.dataset || {},
      attrs: { ...attrs },
      classList: {
        classes: new Set(attrs.className ? attrs.className.split(' ') : []),
        add(c) { this.classes.add(c); },
        remove(c) { this.classes.delete(c); },
        toggle(c, force) {
          if (force === undefined) {
            if (this.classes.has(c)) this.classes.delete(c); else this.classes.add(c);
          } else if (force) {
            this.classes.add(c);
          } else {
            this.classes.delete(c);
          }
        },
        contains(c) { return this.classes.has(c); },
      },
      setAttribute(k, v) { this.attrs[k] = String(v); },
      getAttribute(k) { return this.attrs[k]; },
    };
  }

  const buttons = [
    createEl({ 'data-pct': '0', dataset: { pct: '0' }, 'aria-pressed': 'false' }),
    createEl({ 'data-pct': '25', dataset: { pct: '25' }, 'aria-pressed': 'false' }),
    createEl({ 'data-pct': '50', dataset: { pct: '50' }, 'aria-pressed': 'true', className: 'selected' }),
    createEl({ 'data-pct': '75', dataset: { pct: '75' }, 'aria-pressed': 'false' }),
    createEl({ 'data-pct': '100', dataset: { pct: '100' }, 'aria-pressed': 'false' }),
  ];

  const singingLine = createEl({ id: 'singingLine', value: '50', 'aria-valuenow': '50' });
  const singingLabel = createEl({ id: 'singingLabel' });
  const singingResult = createEl({ id: 'singingResult' });

  const playedFreqs = [];
  const sandbox = {
    soundForTick: nl.soundForTick,
    playFreq: (f) => playedFreqs.push(f),
    $: (id) => {
      if (id === 'singingLine') return singingLine;
      if (id === 'singingLabel') return singingLabel;
      if (id === 'singingResult') return singingResult;
      return null;
    },
    document: {
      querySelectorAll: (sel) => {
        if (sel === '.nl-keys [data-pct]') return buttons;
        return [];
      },
    },
  };

  vm.createContext(sandbox);
  vm.runInContext(fnCode, sandbox);

  // Test updating to 25% (1/4)
  sandbox.updateSingingLine(25, true);
  assert.equal(singingLine.value, 25);
  assert.equal(singingLine.getAttribute('aria-valuenow'), '25');
  assert.match(singingLine.getAttribute('aria-valuetext'), /25%.*1\/4/);
  assert.equal(buttons[1].getAttribute('aria-pressed'), 'true');
  assert.ok(buttons[1].classList.contains('selected'));
  assert.equal(buttons[2].getAttribute('aria-pressed'), 'false');
  assert.ok(!buttons[2].classList.contains('selected'));
  assert.ok(playedFreqs.length > 0);

  // Test updating to in-between value 60%
  sandbox.updateSingingLine(60, false);
  assert.equal(singingLine.value, 60);
  assert.equal(singingLine.getAttribute('aria-valuenow'), '60');
  buttons.forEach((b) => {
    assert.equal(b.getAttribute('aria-pressed'), 'false');
    assert.ok(!b.classList.contains('selected'));
  });

  // Test updating to 100% (1 שלם)
  sandbox.updateSingingLine(100, false);
  assert.equal(singingLine.value, 100);
  assert.equal(singingLine.getAttribute('aria-valuenow'), '100');
  assert.equal(buttons[4].getAttribute('aria-pressed'), 'true');
  assert.ok(buttons[4].classList.contains('selected'));
  assert.equal(buttons[0].getAttribute('aria-pressed'), 'false');
});
