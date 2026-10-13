const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const uc = require('../src/lib/unitCheck.js');
const store = require('../src/lib/teacherStore.js');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'check.html'), 'utf8');
const UNIT = uc.listUnits()[0];
const TOTAL = UNIT.length;

// What a finished sitting leaves in the roster: `correct` items first, the rest
// wrong, and an `ended` session — which is what unitCheck.latestCheck counts.
function sitting(storage, name, form, correct) {
  const session = store.startSession('', name, uc.checkKind(UNIT.id, form), storage);
  uc.formItems(UNIT.id, form).forEach(function (it, i) {
    store.addItem('', name, session.id, {
      skill: uc.UNIT_CHECK_SKILL_HE[it.skill] || it.skill,
      prompt: it.prompt, answer: it.answer, given: it.answer, correct: i < correct,
    }, storage);
  });
  store.endSession('', name, session.id, storage);
}

// A fake DOM just big enough for check.html, in the shape test/frequencyLab.test.js
// uses: elements appear on demand, readyState 'loading' keeps core.js from
// installing the shared chrome, and localStorage is a Map — so `seed` can leave a
// real roster that the page reads back the way a tablet would.
function runPage(seed) {
  const data = new Map();
  const localStorage = {
    getItem: function (k) { return data.has(k) ? data.get(k) : null; },
    setItem: function (k, v) { data.set(k, String(v)); },
    removeItem: function (k) { data.delete(k); },
  };
  if (seed) seed(localStorage);
  const els = {};

  function makeEl(tag, initialClasses) {
    const classes = new Set(initialClasses || []);
    let html = '';
    const el = {
      tagName: tag, children: [], style: {}, attrs: {}, classes: classes,
      textContent: '', className: '', value: '', type: '', dir: '',
      classList: {
        add: function (c) { classes.add(c); },
        remove: function (c) { classes.delete(c); },
        contains: function (c) { return classes.has(c); },
      },
      setAttribute: function (k, v) { el.attrs[k] = String(v); },
      getAttribute: function (k) { return el.attrs[k] == null ? null : el.attrs[k]; },
      appendChild: function (child) { el.children.push(child); return child; },
      focus: function () { el.focused = true; },
      querySelector: function () { return null; },
      querySelectorAll: function () { return []; },
      // A <select> that is handed options takes the first one as its value,
      // which is how the page knows which unit is on screen.
      get innerHTML() { return html; },
      set innerHTML(v) {
        html = String(v);
        el.children.length = 0;
        if (tag === 'select') el.value = (/value="([^"]*)"/.exec(html) || ['', ''])[1];
      },
    };
    return el;
  }

  const document = {
    readyState: 'loading',
    // Each element starts from the tag and the classes the markup declares, so
    // the unit picker behaves like a <select> and a hidden card ships hidden.
    getElementById: function (id) {
      if (!els[id]) {
        const open = new RegExp('<([a-z0-9]+)[^>]*\\sid="' + id + '"[^>]*>').exec(page);
        const cls = open ? /class="([^"]*)"/.exec(open[0]) : null;
        els[id] = makeEl(open ? open[1] : 'div', cls ? cls[1].split(/\s+/) : []);
      }
      return els[id];
    },
    createElement: makeEl,
    addEventListener: function () {},
    querySelector: function () { return null; },
    querySelectorAll: function () { return []; },
  };

  const errors = [];
  const ctx = vm.createContext({
    document: document, window: {}, localStorage: localStorage,
    navigator: { userAgent: 'node' }, setTimeout: function () {}, clearTimeout: function () {},
    console: { error: function () { errors.push(Array.prototype.join.call(arguments, ' ')); }, warn: function () {}, log: function () {} },
  });
  ctx.globalThis = ctx;
  Array.from(page.matchAll(/<script(?:\s+src="([^"]+)")?\s*>([\s\S]*?)<\/script\s*>/gi)).forEach(function (m) {
    if (m[1]) vm.runInContext(fs.readFileSync(path.join(root, m[1]), 'utf8'), ctx, { filename: m[1] });
    else vm.runInContext(m[2], ctx, { filename: 'check.html inline script' });
  });

  return {
    errors: errors,
    get: function (id) { return document.getElementById(id); },
    report: function () {
      document.getElementById('showReport').onclick();
      return document.getElementById('reportBody').innerHTML;
    },
  };
}

test('check.html loads, names the unit with its length, and keeps the disclaimer', () => {
  let out;
  assert.doesNotThrow(() => { out = runPage(); });
  assert.deepEqual(out.errors, []);
  assert.equal(out.get('unit').value, UNIT.id);
  assert.match(out.get('unit').innerHTML, new RegExp(' · ' + TOTAL + ' שאלות'));
  assert.equal(out.get('disclaimer').textContent, uc.UNIT_CHECK_DISCLAIMER);
});

test('the report leads with the two class means and the n behind them', () => {
  const out = runPage((storage) => {
    sitting(storage, 'דנה', 'pre', 3);
    sitting(storage, 'דנה', 'post', 6);
    sitting(storage, 'יואב', 'pre', 5);
  });
  const html = out.report();
  assert.equal((html.match(/class="stat"/g) || []).length, 3, 'mean before, mean after, and n');
  // Each figure is bidi-isolated: inside an RTL page "3/8" would otherwise be
  // reordered, and the tile is the first thing a teacher reads.
  assert.match(html, new RegExp('<strong><bdi dir="ltr">3/' + TOTAL + '</bdi></strong>ממוצע לפני'));
  assert.match(html, new RegExp('<strong><bdi dir="ltr">6/' + TOTAL + '</bdi></strong>ממוצע אחרי'));
  assert.match(html, /<strong><bdi dir="ltr">1<\/bdi><\/strong>תלמידים עם שתי הבדיקות/);
  // יואב sat one form only, so he is out of the means and said out loud.
  assert.match(html, /1 עשו רק את הבדיקה שלפני\./);
  assert.doesNotMatch(html, /עשו רק את הבדיקה שאחרי/);
  // The per-student table is still the evidence under the summary.
  assert.match(html, /דנה/);
  assert.match(html, /יואב/);
  assert.match(html, /\+3/);
});

test('an empty class keeps the honest empty state instead of tiles of nothing', () => {
  const html = runPage().report();
  assert.match(html, /אין עדיין בדיקות/);
  assert.doesNotMatch(html, /class="stats"/);
});

test('the tiles summarise and never grade: no pass mark, no claim of cause', () => {
  const html = runPage((storage) => {
    sitting(storage, 'מאיה', 'pre', 2);
    sitting(storage, 'מאיה', 'post', 8);
  }).report();
  assert.doesNotMatch(html, /class="(good|bad|pass|fail)"/);
  assert.doesNotMatch(html, /מוכח|שיפור מוכח|הצלחה|נכשל|עבר\/לא עבר/);
  assert.match(page, /UNIT_CHECK_DISCLAIMER/, 'the disclaimer still ships with the view');
});

test('the choice row is two tap targets wide on a tablet and one on a phone', () => {
  assert.match(page, /\.choices\{display:grid;grid-template-columns:1fr 1fr/);
  assert.match(page, /@media\(max-width:430px\)\{\.choices\{grid-template-columns:1fr\}\}/);
  assert.match(page, /\.choices button\{min-height:56px/, 'bigger than the 44px floor');
});

test('the check is framed as a local record and is reachable in both directions', () => {
  assert.match(page, /<p class="tag">/);
  assert.match(page, /<p class="lead">/);
  assert.match(page, /<a href="index\.html">/, 'back to practice');
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /href="check\.html"/);
});
