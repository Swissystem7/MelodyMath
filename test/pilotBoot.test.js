// The pilot page must boot and answer a click. Every script that
// pilot/index.html loads runs here in page order, in one global, the way a
// browser runs them. On 17.11.2026 two refactors broke the page: a list was read
// above its declaration, and the click listener was wrapped in a second one.
// No test ran the scripts whole, so nothing failed.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const dir = path.join(__dirname, '../pilot');
const html = fs.readFileSync(path.join(dir, 'index.html'), 'utf8');
const srcs = [...html.matchAll(/<script src="([^"?]+)/g)].map((m) => m[1]);

// Only the page parts the scripts touch while they load and on one click.
function openPage() {
  const noop = () => {};
  const el = (extra) => ({
    setAttribute: noop,
    getAttribute: () => null,
    addEventListener: noop,
    querySelector: () => null,
    ...extra,
  });
  let clicks = [];
  const root = el({
    innerHTML: '',
    firstChild: null,
    insertAdjacentHTML(_where, markup) { this.innerHTML = markup; },
    addEventListener: (type, fn) => { if (type === 'click') clicks = clicks.concat(fn); },
  });
  const saved = new Map();
  const page = {
    document: el({ documentElement: el(), getElementById: (id) => (id === 'mm-app' ? root : null) }),
    localStorage: {
      getItem: (k) => (saved.has(k) ? saved.get(k) : null),
      setItem: (k, v) => { saved.set(k, String(v)); },
      removeItem: (k) => { saved.delete(k); },
    },
    navigator: {},
    console: { log: noop, warn: noop, error: noop },
    setTimeout: () => 0,
    clearTimeout: noop,
  };
  page.window = page;
  vm.createContext(page);
  for (const src of srcs) {
    vm.runInContext(fs.readFileSync(path.join(dir, src), 'utf8'), page, { filename: src });
  }
  const click = (act) => {
    const btn = el({ disabled: false, getAttribute: (name) => (name === 'data-act' ? act : null) });
    // A browser calls the listeners that were there when the click began.
    for (const fn of clicks) {
      fn({ target: { closest: () => btn }, preventDefault: noop });
    }
  };
  return { page, root, click, listeners: () => clicks.length };
}

test('the pilot page boots: every script loads and the login screen is drawn', () => {
  assert.ok(srcs.length > 10 && srcs.at(-1) === 'js/app.js', 'the page script list changed: ' + srcs.join(' '));
  const { page, root, listeners } = openPage();
  assert.match(root.innerHTML, /data-testid="login-form"/);
  assert.equal(listeners(), 1, 'one click listener on the app root');
  // the last statement of app.js: the file ran to its end
  assert.equal(typeof page.MMPilotApp.aggregatedReportCard, 'function');
});

test('a click on the pilot page runs its action once', () => {
  const { page, click, listeners } = openPage();
  const music = page.MMPilotMusic;
  assert.equal(music.isMuted(), false);
  click('sound');
  assert.equal(music.isMuted(), true, 'the first click must already work');
  click('sound');
  assert.equal(music.isMuted(), false, 'the second click must run once, not twice');
  assert.equal(listeners(), 1, 'a click must not add a listener');
});
