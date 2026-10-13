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
// uses: elements appear on demand, readyState 'loading' keeps core.js from
// installing the shared chrome, `setTimeout` is a queue the test drains, and
// localStorage is a Map — so a sitting leaves a real roster the assertions read
// back through teacherStore, the same way a tablet would.
function runPage() {
  const data = new Map();
  const localStorage = {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
  // A cancellable timer queue rather than a plain list: clearTimeout has to
  // really drop the callback, or the test cannot tell a cancelled "next item"
  // timer from one that is still pending.
  const timers = new Map();
  let nextTimerId = 1;
  const els = {};

  function makeEl(tag, initialClasses) {
    const classes = new Set(initialClasses || []);
    let html = '';
    const el = {
      tagName: tag, children: [], style: {}, attrs: {}, classes,
      textContent: '', className: '', value: '', type: '', dir: '', disabled: false,
      classList: {
        add: (c) => classes.add(c),
        remove: (c) => classes.delete(c),
        contains: (c) => classes.has(c),
      },
      setAttribute(k, v) { el.attrs[k] = String(v); },
      getAttribute(k) { return el.attrs[k] == null ? null : el.attrs[k]; },
      appendChild(child) { el.children.push(child); return child; },
      focus() { el.focused = true; },
      // Assigning innerHTML drops the children, the way a browser would, and a
      // <select> that is handed options takes the first one as its value — which
      // is how the page knows which unit is on screen.
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
    // Each element starts from the tag and classes the markup declares, so the
    // unit picker behaves like a <select> and a card that ships hidden is hidden.
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
    document, window: {}, localStorage, navigator: { userAgent: 'node' },
    console: { error(...a) { errors.push(a.join(' ')); }, warn() {}, log() {} },
    setTimeout: (fn) => { const id = nextTimerId++; timers.set(id, fn); return id; },
    clearTimeout: (id) => { timers.delete(id); },
  });
  ctx.globalThis = ctx;
  Array.from(page.matchAll(/<script(?:\s+src="([^"]+)")?\s*>([\s\S]*?)<\/script\s*>/gi)).forEach((m) => {
    if (m[1]) vm.runInContext(fs.readFileSync(path.join(root, m[1]), 'utf8'), ctx, { filename: m[1] });
    else vm.runInContext(m[2], ctx, { filename: 'check.html inline script' });
  });

  const api = {
    els, errors, localStorage, timers,
    get: (id) => document.getElementById(id),
    roster: (classCode) => store.loadRoster(classCode, localStorage),
    choices: () => document.getElementById('quizChoices').children,
    pending: () => timers.size,
    drain() {
      while (timers.size) {
        const [id, fn] = timers.entries().next().value;
        timers.delete(id);
        fn();
      }
      return api;
    },
    // One sitting: tap the choice whose label is the right answer for the first
    // `correct` items and a wrong one after that, draining the "next item" timer
    // between taps. `quitAfter` stops the sitting mid-way instead of finishing.
    take(name, form, correct, quitAfter) {
      api.get('studentName').value = name;
      api.get(form === 'pre' ? 'startPre' : 'startPost').onclick();
      const items = uc.formItems(UNIT, form);
      items.slice(0, quitAfter == null ? items.length : quitAfter).forEach((item, i) => {
        const answer = String(item.answer);
        const want = (b) => (i < correct ? b.textContent === answer : b.textContent !== answer);
        const pick = api.choices().filter(want)[0];
        assert.ok(pick, 'item ' + (i + 1) + ' of the ' + form + ' form offers a choice to tap');
        pick.onclick();
        api.drain();
      });
      if (quitAfter != null) api.get('quizQuit').onclick();
      return api;
    },
  };
  return api;
}

test('check.html loads without throwing, lists the units and opens on the honest empty state', () => {
  let out;
  assert.doesNotThrow(() => { out = runPage(); });
  assert.deepEqual(out.errors, []);
  assert.match(out.get('unit').innerHTML, new RegExp('value="' + UNIT + '"'));
  assert.equal(out.get('unit').value, UNIT);
  // The report is on screen from the first load, with no tap on anything.
  assert.match(out.get('reportBody').innerHTML, /אין עדיין בדיקות/);
  assert.equal(out.get('disclaimer').textContent, uc.UNIT_CHECK_DISCLAIMER);
  assert.ok(out.get('quiz').classList.contains('hidden'), 'no check is running yet');
});

test('a check needs a student before it stores anything', () => {
  const out = runPage();
  out.get('startPre').onclick();
  assert.match(out.get('setupStatus').textContent, /שם או קוד תלמיד/);
  assert.ok(out.get('quiz').classList.contains('hidden'));
  assert.deepEqual(Object.keys(out.roster('').students), []);
});

test('a finished pre and post check become ordinary teacherStore sessions and one before/after row', () => {
  const out = runPage();
  out.take('דנה', 'pre', 3).take('דנה', 'post', 6);
  const student = out.roster('').students['דנה'];
  assert.deepEqual(student.sessions.map((s) => s.kind), [uc.checkKind(UNIT, 'pre'), uc.checkKind(UNIT, 'post')]);
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
  assert.match(out.get('setupStatus').textContent, /6 מתוך/);
  // Items are filed under the Hebrew skill label the teacher report groups by.
  const [item] = student.sessions[0].items;
  assert.equal(item.skill, uc.UNIT_CHECK_SKILL_HE[uc.formItems(UNIT, 'pre')[0].skill]);
});

test('stopping in the middle leaves no score, and the student is remembered for next time', () => {
  const out = runPage();
  out.take('יואב', 'pre', 2, 2);
  assert.match(out.get('setupStatus').textContent, /לא נספרה/);
  assert.ok(out.get('quiz').classList.contains('hidden'));
  const [session] = out.roster('').students['יואב'].sessions;
  assert.equal(session.items.length, 2, 'the two answered items are still on record');
  assert.ok(!session.ended, 'a stopped check is not ended');
  assert.equal(uc.latestCheck(out.roster('').students['יואב'], UNIT, 'pre'), null);
  assert.equal(uc.checkReport(out.roster('').students, UNIT).rows.length, 0);
  assert.equal(store.loadWho(out.localStorage).name, 'יואב');
});

test('the check gives no right/wrong feedback and makes no efficacy claim', () => {
  const out = runPage();
  out.get('studentName').value = 'מאיה';
  out.get('startPre').onclick();
  const [item] = uc.formItems(UNIT, 'pre');
  const wrong = out.choices().filter((b) => b.textContent !== String(item.answer))[0];
  wrong.onclick();
  assert.ok(wrong.classes.has('picked'), 'the tap is acknowledged');
  assert.ok(!wrong.classes.has('good') && !wrong.classes.has('bad'), 'but not as right or wrong');
  assert.equal(out.get('quizEcho').textContent, 'נרשם.');
  assert.doesNotMatch(page, /לא הפעם|תשובה נכונה|כל הכבוד|משפר|מוכח|סוגרים פערים/);
  assert.doesNotMatch(page, /playFreq|AudioContext|src\/lib\/sonify\.js/, 'the check is silent');
});

test('a second tap on the same item cannot answer the next one', () => {
  const out = runPage();
  out.get('studentName').value = 'עומר';
  out.get('startPre').onclick();
  const first = out.choices();
  first[0].onclick();
  // The double tap a tablet delivers before the next item is painted.
  first.forEach((b) => {
    assert.ok(b.disabled, 'the answered row is locked');
    b.onclick();
  });
  out.drain();
  assert.equal(out.get('quizProgress').textContent, 'שאלה 2 מתוך ' + uc.formItems(UNIT, 'pre').length);
  assert.equal(out.roster('').students['עומר'].sessions[0].items.length, 1);
});

test('a sitting started right after one was stopped still gets asked its first item', () => {
  const out = runPage();
  out.get('studentName').value = 'תמר';
  out.get('startPre').onclick();
  out.choices()[0].onclick();
  // Leaving the check inside the 350 ms before the next item is painted: the
  // pending advance belongs to the sitting that is over and must not survive it.
  out.get('quizQuit').onclick();
  assert.equal(out.pending(), 0, 'stopping a check cancels its pending advance');
  out.get('startPre').onclick();
  out.drain();
  assert.equal(out.get('quizProgress').textContent, 'שאלה 1 מתוך ' + uc.formItems(UNIT, 'pre').length);
  assert.equal(out.choices().length, uc.formItems(UNIT, 'pre')[0].choices.length);
});

test('focus has somewhere to land when the answered row locks', () => {
  const out = runPage();
  out.get('studentName').value = 'אורי';
  out.get('startPre').onclick();
  assert.ok(out.choices()[0].focused, 'a new item focuses its first choice');
  out.choices()[0].onclick();
  // Every choice is disabled now, so focus cannot stay on the tapped button.
  assert.ok(out.get('quizEcho').focused, 'focus moves to the status line');
  assert.match(page, /id="quizEcho"[^>]*tabindex="-1"/, 'which needs to be focusable');
});

test('every choice carries a name, and the report table is navigable', () => {
  const out = runPage();
  out.take('רות', 'pre', 4);
  assert.ok(out.choices().length >= 2, 'an item offers tap-targets to name');
  out.choices().forEach((b) => assert.match(b.getAttribute('aria-label'), /^תשובה /));
  assert.match(out.get('reportBody').innerHTML, /<caption class="sr-only">/);
  assert.match(out.get('reportBody').innerHTML, /<th scope="col">תלמיד\/ה<\/th>/);
});

// test/unitCheck.test.js pins the bank and the precache entry; what it cannot see
// is whether a teacher can reach the page at all.
test('the check is reachable from the teacher report, and ships in the offline cache', () => {
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /href="check\.html"/);
  assert.match(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'), /'\.\/check\.html'/);
});
