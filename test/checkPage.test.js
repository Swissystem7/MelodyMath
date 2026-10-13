const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const uc = require('../src/lib/unitCheck.js');
const store = require('../src/lib/teacherStore.js');

const root = path.join(__dirname, '..');
const page = fs.readFileSync(path.join(root, 'check.html'), 'utf8');
const UNIT = uc.listUnits()[0].id;

// A fake DOM just big enough for check.html, in the shape test/frequencyLab.test.js
// uses: elements appear on demand, `setTimeout` is a queue the test flushes, and
// localStorage is a Map, so a run leaves a real roster the assertions can read.
function runPage() {
  const data = new Map();
  const localStorage = {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
  const timers = [];
  const els = {};

  function makeEl(tag, initialClasses) {
    const classes = new Set(initialClasses || []);
    let html = '';
    const el = {
      tagName: tag, children: [], style: {}, attrs: {}, classes,
      textContent: '', className: '', value: '', type: '', disabled: false, dir: '',
      classList: { add: (c) => classes.add(c), contains: (c) => classes.has(c),
        toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)) },
      setAttribute(k, v) { el.attrs[k] = String(v); },
      getAttribute(k) { return el.attrs[k] == null ? null : el.attrs[k]; },
      appendChild(child) { el.children.push(child); return child; },
      focus() { el.focused = true; },
      // Assigning innerHTML replaces the children, the way a browser would, and
      // a <select> that gets options takes the first one as its value — which is
      // how the page knows which unit is being checked.
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
    // Start each element from the tag and classes the markup declares, so a
    // <select> behaves like one and a card that ships hidden starts hidden.
    getElementById(id) {
      if (!els[id]) {
        const open = new RegExp('<([a-z]+)[^>]*\\sid="' + id + '"[^>]*>').exec(page);
        const cls = open ? /class="([^"]*)"/.exec(open[0]) : null;
        els[id] = makeEl(open ? open[1] : 'div', cls ? cls[1].split(/\s+/) : []);
      }
      return els[id];
    },
    createElement: makeEl,
    addEventListener() {},
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };

  const errors = [];
  const ctx = vm.createContext({
    document, window: {}, localStorage, navigator: { userAgent: 'node' }, clearTimeout() {},
    console: { error(...a) { errors.push(a.join(' ')); }, warn() {}, log() {} },
    setTimeout: (fn) => { timers.push(fn); return timers.length; },
  });
  ctx.globalThis = ctx;
  Array.from(page.matchAll(/<script(?:\s+src="([^"]+)")?\s*>([\s\S]*?)<\/script>/g)).forEach((m) => {
    if (m[1]) vm.runInContext(fs.readFileSync(path.join(root, m[1]), 'utf8'), ctx, { filename: m[1] });
    else vm.runInContext(m[2], ctx, { filename: 'check.html inline script' });
  });

  const api = {
    els, errors, localStorage,
    get: (id) => document.getElementById(id),
    roster: (classCode) => store.loadRoster(classCode, localStorage),
    // Run the queued "next item" timers, which is what moves the sitting on.
    flush() { while (timers.length) timers.shift()(); return api; },
    // One sitting: tap the choice whose text is the right answer for the first
    // `correct` items and a wrong one after that, draining the "next item"
    // timer between taps. `quitAfter` stops the sitting mid-way instead.
    take(name, form, correct, quitAfter) {
      api.get('checkName').value = name;
      api.get(form === 'pre' ? 'startPre' : 'startPost').onclick();
      uc.formItems(UNIT, form).slice(0, quitAfter == null ? undefined : quitAfter).forEach((item, i) => {
        const answer = String(item.answer);
        const buttons = api.get('playChoices').children;
        const pick = buttons.filter((b) => (i < correct ? b.textContent === answer : b.textContent !== answer))[0];
        assert.ok(pick, 'item ' + (i + 1) + ' of ' + form + ' offers a choice to tap');
        pick.onclick();
        while (timers.length) timers.shift()();
      });
      if (quitAfter != null) api.get('playQuit').onclick();
      return api;
    },
  };
  return api;
}

test('check.html loads without throwing, lists the units and opens on the honest empty state', () => {
  let out;
  assert.doesNotThrow(() => { out = runPage(); });
  assert.deepEqual(out.errors, []);
  assert.match(out.get('checkUnit').innerHTML, new RegExp('value="' + UNIT + '"'));
  assert.match(out.get('reportBody').innerHTML, /עוד לא נרשמה בדיקה/);
  assert.equal(out.get('reportDisclaimer').textContent, uc.UNIT_CHECK_DISCLAIMER);
  assert.ok(out.get('play').classes.has('hidden'), 'no check is running yet');
});

test('a check needs a name before it stores anything', () => {
  const out = runPage();
  out.get('startPre').onclick();
  assert.match(out.get('setupMsg').textContent, /שם תלמיד/);
  assert.ok(out.get('play').classes.has('hidden'));
  assert.deepEqual(Object.keys(out.roster('').students), []);
});

test('a finished pre and post check become ordinary teacherStore sessions and a pre/post row', () => {
  const out = runPage();
  out.take('דנה', 'pre', 3).take('דנה', 'post', 6);
  const student = out.roster('').students['דנה'];
  const kinds = student.sessions.map((s) => s.kind);
  assert.deepEqual(kinds, [uc.checkKind(UNIT, 'pre'), uc.checkKind(UNIT, 'post')]);
  student.sessions.forEach((s) => {
    assert.ok(s.ended, 'a finished check is ended, so latestCheck counts it');
    assert.equal(s.items.length, uc.formItems(UNIT, 'pre').length);
  });
  const r = uc.checkReport(out.roster('').students, UNIT);
  assert.equal(r.n, 1);
  assert.equal(r.rows[0].pre.correct, 3);
  assert.equal(r.rows[0].post.correct, 6);
  assert.equal(r.rows[0].change, 3);
  assert.match(out.get('reportBody').innerHTML, /דנה/);
  assert.match(out.get('reportBody').innerHTML, /\+3/);
  assert.match(out.get('setupMsg').textContent, /נשמרה/);
});

test('stopping in the middle leaves no score, and the name is remembered for next time', () => {
  const out = runPage();
  out.take('יואב', 'pre', 2, 2);
  assert.match(out.get('setupMsg').textContent, /לא נספרה/);
  assert.ok(out.get('play').classes.has('hidden'));
  const [session] = out.roster('').students['יואב'].sessions;
  assert.equal(session.ended, null, 'an abandoned check is not ended');
  assert.equal(uc.latestCheck(out.roster('').students['יואב'], UNIT, 'pre'), null);
  assert.equal(uc.checkReport(out.roster('').students, UNIT).rows.length, 0);
  assert.equal(store.loadWho(out.localStorage).name, 'יואב');
});

test('the check gives no right/wrong feedback and makes no efficacy claim', () => {
  const out = runPage();
  out.get('checkName').value = 'מאיה';
  out.get('startPre').onclick();
  const [item] = uc.formItems(UNIT, 'pre');
  const wrong = out.get('playChoices').children.filter((b) => b.textContent !== String(item.answer))[0];
  wrong.onclick();
  assert.ok(wrong.classes.has('picked'), 'the tap is acknowledged');
  assert.ok(!wrong.classes.has('picked-bad') && !wrong.classes.has('picked-good'));
  assert.equal(out.get('playEcho').textContent, 'נרשם.');
  assert.doesNotMatch(page, /לא הפעם|תשובה נכונה|משפר|מוכח|סוגרים פערים/);
  assert.doesNotMatch(page, /playFreq|AudioContext|src\/lib\/sonify\.js/, 'the check is silent');
});

// The page is RTL, so a prompt handed to textContent as-is comes out as
// "? = 3/8 − 7/8". src/lib/mathBidi.js is the only thing that stops that.
test('an expression prompt is isolated left-to-right, not reordered by the RTL page', () => {
  assert.match(page, /src="src\/lib\/mathBidi\.js"/, 'the page must link mathBidi.js');
  assert.match(page, /\.math-ltr\{[^}]*unicode-bidi:isolate/, 'the isolate rule must ship with it');
  const items = uc.formItems(UNIT, 'pre');
  const at = items.findIndex((it) => /[+\-−×÷=]/.test(it.prompt));
  assert.ok(at >= 0, 'the bank has an item whose prompt is an expression');

  const out = runPage();
  out.get('checkName').value = 'איתי';
  out.get('startPre').onclick();
  for (let i = 0; i < at; i++) { out.get('playChoices').children[0].onclick(); out.flush(); }
  const shown = out.get('playPrompt').innerHTML;
  assert.match(shown, /<span class="math-ltr" dir="ltr">/, 'the expression run is wrapped');
  assert.equal(shown.replace(/<[^>]*>/g, ''), items[at].prompt, 'and no text was lost');
});

// teacherStore.buildReport groups items by `skill` and the teacher tab prints
// that string verbatim, so the bank's English key must not reach storage.
test('a stored item is filed under the Hebrew skill label, not the bank key', () => {
  const labels = Object.keys(uc.UNIT_CHECK_SKILL_HE).map((k) => uc.UNIT_CHECK_SKILL_HE[k]);
  const out = runPage();
  out.take('רות', 'pre', uc.formItems(UNIT, 'pre').length);
  const student = out.roster('').students['רות'];
  const [session] = student.sessions;
  session.items.forEach((it) => {
    assert.ok(labels.includes(it.skill), 'skill must be Hebrew, got ' + it.skill);
  });
  const stray = store.buildReport(student).perSkill.filter((g) => !labels.includes(g.skill));
  assert.deepEqual(stray, [], 'the per-skill report has no Latin bank keys in it');
});

// test/unitCheck.test.js already pins the precache entries; what it cannot see
// is whether a teacher can get here at all, or whether tablets that cached v13
// will pick the new page up.
test('the check is reachable from the teacher tab, and the cache was bumped for it', () => {
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /href="check\.html"/);
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  const v = sw.match(/const CACHE = 'melodymath-offline-v(\d+)'/);
  assert.ok(Number(v[1]) > 13, 'the cache must be bumped past v13 for check.html; it is v' + v[1]);
});
