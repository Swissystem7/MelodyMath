// MelodyMath — check.html, run the way a browser runs it (#241).
//
// test/unitCheck.test.js covers the item bank and the pre/post arithmetic, and
// it greps check.html for a few strings. Nothing until now actually ran the
// page, so every rule the page itself owns — which form a button starts, what
// reaches storage, what the child is told after a tap — was unpinned.
//
// Why this file exists on its own: PR #239 re-landed the whole check page plus
// its tests in one 606-line change, over auto_merger's 400-line cap. Issue #241
// splits it in two along the only seam that leaves both halves green on master
// by themselves — the contract, then the redesign that must keep it:
//
//   slice 1 (this PR)  338 lines: this harness and contract, plus the one
//                      check.html fix the contract exposed (a finished sitting
//                      claimed "נשמר במכשיר הזה" even when the write failed).
//   slice 2            ~370 lines: the card/stats redesign of check.html from
//                      #239's head (branch claude/MelodyMath-232-20261013-202143,
//                      commit 5aa3c6b), the discovery link from the teacher tab
//                      in index.html, the reachability note for prepost.js, and
//                      the selector updates this file needs once the ids move
//                      from quiz*/classCode/studentName to play*/check*.
//
// The three defects #239 fixed belong to slice 2 and not here, because none of
// them exists on master: the stale "next item" timer (the redesign paces items
// with setTimeout, master advances synchronously), the access prefs lost when
// the page stops loading core.js, and the per-item focus lost when the choice
// group replaces its buttons. The focus one already has a contract test below
// to land into, written so it passes either way: it asserts the focus stays
// somewhere inside the choices, not on a particular button. The access prefs
// are untested here on purpose — on master they arrive through core.js at
// DOMContentLoaded, and firing that in this harness would mean faking enough
// of the shared chrome to install a nav and an access bar.
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
// uses: elements appear on demand and localStorage is a Map, so a run leaves a
// real roster the assertions can read back through teacherStore. readyState
// 'loading' keeps core.js from installing the shared chrome.
function stripTags(s) {
  let res = "";
  let inTag = false;
  const str = String(s == null ? "" : s);
  for (let i = 0; i < str.length; i++) {
    if (str[i] === "<") inTag = true;
    else if (str[i] === ">") inTag = false;
    else if (!inTag) res += str[i];
  }
  return res;
}

function runPage(seed) {
  const data = new Map(seed ? Object.entries(seed) : []);
  const localStorage = {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
  const els = {};

  const unentity = (s) => String(s).replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&');

  // The page writes its choices as an innerHTML string and then queries the
  // buttons back out of it, so the fake innerHTML has to produce children the
  // way a browser's parser would.
  function parseButtons(html) {
    return Array.from(html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g)).map((m) => {
      const b = makeEl('button');
      const choice = /data-choice="([^"]*)"/.exec(m[1]);
      if (choice) b.dataset.choice = unentity(choice[1]);
      b.textContent = unentity(stripTags(m[2]));
      return b;
    });
  }

  function makeEl(tag, initialClasses) {
    const classes = new Set(initialClasses || []);
    let html = '';
    let kids = [];
    const el = {
      tagName: tag, dataset: {}, attrs: {}, style: {}, classes,
      textContent: '', value: '', type: '', dir: '', disabled: false, focused: false,
      classList: {
        add: (c) => classes.add(c),
        remove: (c) => classes.delete(c),
        contains: (c) => classes.has(c),
        toggle: (c, on) => (on ? classes.add(c) : classes.delete(c)),
      },
      setAttribute(k, v) { el.attrs[k] = String(v); },
      getAttribute(k) { return el.attrs[k] == null ? null : el.attrs[k]; },
      appendChild(child) { kids.push(child); return child; },
      focus() { el.focused = true; },
      querySelectorAll(sel) { return sel === 'button' ? kids.slice() : []; },
      querySelector(sel) { return el.querySelectorAll(sel)[0] || null; },
      get children() { return kids.slice(); },
      get innerHTML() { return html; },
      // A <select> that gets options takes the first one as its value, which is
      // how the page knows which unit is being checked.
      set innerHTML(v) {
        html = String(v);
        kids = parseButtons(html);
        if (tag === 'select') el.value = (/value="([^"]*)"/.exec(html) || ['', ''])[1];
      },
    };
    return el;
  }

  const body = makeEl('body');
  const document = {
    readyState: 'loading',
    body,
    // Start each element from the tag and the classes the markup declares, so a
    // <select> behaves like one and a card that ships hidden starts hidden.
    getElementById(id) {
      if (!els[id]) {
        const open = new RegExp('<([a-z0-9]+)[^>]*\\sid="' + id + '"[^>]*>').exec(page);
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
    setTimeout: (fn) => { fn(); return 0; }, clearTimeout() {},
  });
  ctx.globalThis = ctx;
  Array.from(page.matchAll(/<script\b(?:\s+src="([^"]+)")?[^>]*>([\s\S]*?)<\/script[^>]*>/gi)).forEach((m) => {
    if (m[1]) vm.runInContext(fs.readFileSync(path.join(root, m[1]), 'utf8'), ctx, { filename: m[1] });
    else vm.runInContext(m[2], ctx, { filename: 'check.html inline script' });
  });

  const api = {
    els, errors, localStorage,
    // `body` is where applyAccessToDocument puts mm-contrast / mm-large, which
    // is what slice 2 asserts once the page applies the prefs itself.
    body,
    get: (id) => document.getElementById(id),
    roster: (classCode) => store.loadRoster(classCode, localStorage),
    // The live choices of the item on screen.
    choices: () => api.get('quizChoices').children,
    // Tap the choice carrying this value. Tapping by value and not by position
    // is the only way that works: the page reshuffles the choices per item.
    tap(value) {
      const btn = api.choices().filter((b) => b.dataset.choice === String(value))[0];
      assert.ok(btn, 'a choice reading ' + value + ' is on screen');
      btn.onclick();
      return btn;
    },
    // One whole sitting: answer the first `correct` items right and the rest
    // wrong, so the stored score is known exactly.
    take(name, form, correct) {
      api.get('studentName').value = name;
      api.get(form === 'pre' ? 'startPre' : 'startPost').onclick();
      uc.formItems(UNIT, form).forEach((item, i) => {
        const want = String(item.answer);
        const value = i < correct ? want
          : api.choices().map((b) => b.dataset.choice).filter((c) => c !== want)[0];
        api.tap(value);
      });
      return api;
    },
  };
  return api;
}

test('check.html loads without throwing, lists the units and shows the disclaimer', () => {
  let out;
  assert.doesNotThrow(() => { out = runPage(); });
  assert.deepEqual(out.errors, []);
  assert.match(out.get('unit').innerHTML, new RegExp('value="' + UNIT + '"'));
  assert.equal(out.get('unit').value, UNIT);
  // The one line that must never be dropped: it says in words what these
  // numbers are not.
  assert.equal(out.get('disclaimer').textContent, uc.UNIT_CHECK_DISCLAIMER);
  assert.ok(out.get('quiz').classes.has('hidden'), 'no check is running yet');
});

test('a check needs a student name before it stores anything', () => {
  const out = runPage();
  out.get('startPre').onclick();
  assert.match(out.get('setupStatus').textContent, /שם/);
  assert.ok(out.get('quiz').classes.has('hidden'));
  assert.deepEqual(Object.keys(out.roster('').students), [], 'nothing was written');
});

test('the started form decides the session kind, so pre and post never mix', () => {
  const out = runPage();
  out.get('studentName').value = 'דנה';
  out.get('startPost').onclick();
  const [session] = out.roster('').students['דנה'].sessions;
  assert.equal(session.kind, uc.checkKind(UNIT, 'post'));
  assert.equal(stripTags(out.get('quizPrompt').innerHTML),
    uc.formItems(UNIT, 'post')[0].prompt, 'and the post form is the one on screen');
});

test('a finished pre and post check become teacherStore sessions and a pre/post row', () => {
  const out = runPage();
  out.take('דנה', 'pre', 3).take('דנה', 'post', 6);
  const student = out.roster('').students['דנה'];
  assert.deepEqual(student.sessions.map((s) => s.kind),
    [uc.checkKind(UNIT, 'pre'), uc.checkKind(UNIT, 'post')]);
  student.sessions.forEach((s) => {
    assert.ok(s.ended, 'a finished check is ended, so latestCheck counts it as a score');
    assert.equal(s.items.length, uc.formItems(UNIT, 'pre').length, 'every slot was asked');
  });

  const r = uc.checkReport(out.roster('').students, UNIT);
  assert.equal(r.n, 1);
  assert.equal(r.rows[0].pre.correct, 3);
  assert.equal(r.rows[0].post.correct, 6);
  assert.equal(r.rows[0].change, 3);
  assert.match(out.get('reportBody').innerHTML, /דנה/);
  assert.match(out.get('reportBody').innerHTML, /\+3/, 'the change is signed');
  assert.match(out.get('setupStatus').textContent, /נשמר/);
  assert.equal(store.loadWho(out.localStorage).name, 'דנה', 'the name is remembered');
});

test('the report only counts a check that was finished', () => {
  const out = runPage();
  out.get('studentName').value = 'יואב';
  out.get('startPre').onclick();
  out.tap(uc.formItems(UNIT, 'pre')[0].answer);
  const [session] = out.roster('').students['יואב'].sessions;
  assert.equal(session.ended, null, 'a check still in progress is not ended');
  assert.equal(uc.latestCheck(out.roster('').students['יואב'], UNIT, 'pre'), null);
  assert.equal(uc.checkReport(out.roster('').students, UNIT).rows.length, 0);
});

test('the check gives no right/wrong feedback and makes no efficacy claim', () => {
  const out = runPage();
  out.get('studentName').value = 'מאיה';
  out.get('startPre').onclick();
  const [item] = uc.formItems(UNIT, 'pre');
  const wrong = out.choices().map((b) => b.dataset.choice)
    .filter((c) => c !== String(item.answer))[0];
  const btn = out.tap(wrong);

  assert.deepEqual([...btn.classes], [], 'no colour tells the child it was wrong');
  assert.doesNotMatch(out.get('quizProgress').textContent, /נכון|שגוי|טעות/);
  const [stored] = out.roster('').students['מאיה'].sessions[0].items;
  assert.equal(stored.correct, false, 'it is still recorded as wrong');
  assert.equal(stored.given, wrong);
  // A check that praises, corrects or sounds is practice, and then the post
  // form no longer measures the same thing the pre form did.
  assert.doesNotMatch(page, /תשובה נכונה|לא הפעם|כל הכבוד|מוכח|משפר/);
  assert.doesNotMatch(page, /AudioContext|playFreq|src\/lib\/sonify\.js/, 'the check is silent');
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
  out.get('studentName').value = 'איתי';
  out.get('startPre').onclick();
  for (let i = 0; i < at; i++) out.tap(items[i].answer);
  const shown = out.get('quizPrompt').innerHTML;
  assert.match(shown, /<span class="math-ltr" dir="ltr">/, 'the expression run is wrapped');
  assert.equal(stripTags(shown), items[at].prompt, 'and no text was lost');
});

// teacherStore.buildReport groups items by `skill` and the teacher tab prints
// that string verbatim, so the bank's English key must not reach storage.
test('a stored item is filed under the Hebrew skill label, not the bank key', () => {
  const labels = Object.keys(uc.UNIT_CHECK_SKILL_HE).map((k) => uc.UNIT_CHECK_SKILL_HE[k]);
  const out = runPage();
  out.take('רות', 'pre', uc.formItems(UNIT, 'pre').length);
  const student = out.roster('').students['רות'];
  student.sessions[0].items.forEach((it) => {
    assert.ok(labels.includes(it.skill), 'skill must be Hebrew, got ' + it.skill);
  });
  const stray = store.buildReport(student).perSkill.filter((g) => !labels.includes(g.skill));
  assert.deepEqual(stray, [], 'the per-skill report has no Latin bank keys in it');
});

// Every item replaces the choices, which drops the focus of whoever tapped one.
// Without putting it back, a keyboard or switch user is returned to the top of
// the document on every item of the check.
test('each item keeps the keyboard place inside the choices and is announced', () => {
  assert.match(page, /id="quizProgress"[^>]*aria-live="polite"/, 'the progress is a live region');
  const total = uc.formItems(UNIT, 'pre').length;
  const out = runPage();
  out.get('studentName').value = 'הדר';
  out.get('startPre').onclick();

  const landed = () => out.get('quizChoices').focused || out.choices().some((b) => b.focused);
  assert.ok(landed(), 'the first item puts the focus in the choices');
  assert.equal(out.get('quizProgress').textContent, 'שאלה 1 מתוך ' + total);

  out.get('quizChoices').focused = false;
  out.tap(uc.formItems(UNIT, 'pre')[0].answer);
  assert.ok(landed(), 'and so does every item after it');
  assert.equal(out.get('quizProgress').textContent, 'שאלה 2 מתוך ' + total);
});

// teacherStore.startSession keeps a check running off an in-memory row when the
// tablet cannot persist, so the child is not stopped mid-way. The page must not
// then tell the teacher the result was kept: on a measurement page that is a
// false record, and the pre score it is compared against is simply gone.
test('a tablet that cannot save is told so, not told the check was kept', () => {
  const out = runPage();
  out.localStorage.setItem = () => { throw new Error('quota exceeded'); };
  out.take('עומר', 'pre', 4);

  assert.ok(out.get('quiz').classes.has('hidden'), 'the check still reached its end');
  assert.match(out.get('setupStatus').textContent, /4 מתוך 8/, 'the tally is still shown');
  assert.doesNotMatch(out.get('setupStatus').textContent, /נשמר במכשיר הזה/);
  assert.match(out.get('setupStatus').textContent, /לא אפשר שמירה/);
  assert.deepEqual(Object.keys(out.roster('').students), [], 'because nothing was written');
  assert.match(out.get('reportBody').innerHTML, /אין עדיין בדיקות/, 'and the report stays empty');
});

test('a sitting that was saved does say so', () => {
  const out = runPage();
  out.take('נועה', 'pre', 8);
  assert.match(out.get('setupStatus').textContent, /8 מתוך 8\. נשמר במכשיר הזה\./);
});
