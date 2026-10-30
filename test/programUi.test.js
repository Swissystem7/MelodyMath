const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const cur = require('../src/lib/curriculum');
const banks = require('../src/lib/banks');

const root = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(root, f), 'utf8');

function createMockElement(id) {
  let inner = '';
  return {
    id,
    get innerHTML() { return inner; },
    set innerHTML(val) { inner = String(val); },
    querySelectorAll() { return []; }
  };
}

test('program.html buttons have accessible aria-labels and aria-pressed attributes', () => {
  const html = read('program.html');
  assert.match(html, /aria-label="כיתה '\s*\+\s*g\s*\+\s*'׳"/);
  assert.match(html, /aria-pressed="[^"]*g === grade[^"]*"/);
  assert.match(html, /prefers-reduced-motion:reduce/);
});

test('clicking a grade button saves mm-grade in localStorage and updates active grade', () => {
  const store = {};
  const buttons = [];
  const els = {
    programGrades: {
      _html: '',
      get innerHTML() { return this._html; },
      set innerHTML(val) {
        this._html = String(val);
        buttons.length = 0;
        const matches = [...this._html.matchAll(/data-grade="([^"]+)"/g)];
        for (const m of matches) {
          const g = m[1];
          buttons.push({
            getAttribute: (attr) => (attr === 'data-grade' ? g : null),
            onclick: null
          });
        }
      },
      querySelectorAll: () => buttons
    },
    programGrade: createMockElement('programGrade')
  };

  const document = {
    readyState: 'loading',
    addEventListener() {},
    getElementById: (id) => els[id] || null
  };

  const localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); }
  };

  const ctx = vm.createContext({
    document,
    localStorage,
    location: { search: '' }
  });

  const html = read('program.html');
  for (const m of html.matchAll(/<script src="([^"]+)"><\/script>/g)) {
    vm.runInContext(read(m[1]), ctx, { filename: m[1] });
  }
  const inline = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
  vm.runInContext(inline, ctx, { filename: 'program.html inline script' });

  // Default is 'א'
  assert.match(els.programGrade.innerHTML, /<h2>כיתה א׳<\/h2>/);

  // Click on grade 'ד' button
  const dButton = buttons.find((b) => b.getAttribute('data-grade') === 'ד');
  assert.ok(dButton, 'button for grade ד exists');
  assert.equal(typeof dButton.onclick, 'function');
  dButton.onclick();

  // Verifies state is saved in localStorage and UI re-rendered
  assert.equal(store['mm-grade'], 'ד');
  assert.match(els.programGrade.innerHTML, /<h2>כיתה ד׳<\/h2>/);
});

test('program.html initializes grade from URLSearchParams query param if present', () => {
  const store = { 'mm-grade': 'ב' };
  const els = {
    programGrades: { innerHTML: '', querySelectorAll: () => [] },
    programGrade: createMockElement('programGrade')
  };
  const document = {
    readyState: 'loading',
    addEventListener() {},
    getElementById: (id) => els[id] || null
  };
  const localStorage = {
    getItem: (k) => store[k] || null,
    setItem: (k, v) => { store[k] = String(v); }
  };

  const ctx = vm.createContext({
    document,
    localStorage,
    location: { search: '?grade=ה' },
    URLSearchParams
  });

  const html = read('program.html');
  for (const m of html.matchAll(/<script src="([^"]+)"><\/script>/g)) {
    vm.runInContext(read(m[1]), ctx, { filename: m[1] });
  }
  const inline = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
  vm.runInContext(inline, ctx, { filename: 'program.html inline script' });

  // URL search parameter ?grade=ה takes precedence over localStorage 'ב'
  assert.match(els.programGrade.innerHTML, /<h2>כיתה ה׳<\/h2>/);
});

test('program.html renders empty state message if grade has no curriculum rows', () => {
  const els = {
    programGrades: { innerHTML: '', querySelectorAll: () => [] },
    programGrade: createMockElement('programGrade')
  };
  const document = {
    readyState: 'loading',
    addEventListener() {},
    getElementById: (id) => els[id] || null
  };
  const localStorage = {
    getItem: () => null,
    setItem: () => {}
  };

  const ctx = vm.createContext({
    document,
    localStorage,
    location: { search: '' }
  });

  const html = read('program.html');
  for (const m of html.matchAll(/<script src="([^"]+)"><\/script>/g)) {
    vm.runInContext(read(m[1]), ctx, { filename: m[1] });
  }

  // Override programForGrade in context to return empty rows
  ctx.programForGrade = () => ({ rows: [], pdfUrl: 'https://pop.education.gov.il/test.pdf', untagged: 0 });

  const inline = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
  vm.runInContext(inline, ctx, { filename: 'program.html inline script' });

  assert.match(els.programGrade.innerHTML, /id="programEmpty"/);
  assert.match(els.programGrade.innerHTML, /אין נושאים להצגה לכיתה זו/);
});
