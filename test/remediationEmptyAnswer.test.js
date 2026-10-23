const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const BANKS = require('../src/lib/banks');
const { normalizeAnswer } = require('../src/lib/adaptive');

// #459 end to end: start the diagnostic through rmBegin, press בדיקה with
// nothing typed, and the child gets an announced hint, keeps the cursor and
// leaves no trace in the diagnostic answers or the teacher log.
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const lines = indexHtml.split(/\r?\n/);
const line = prefix => {
  const found = lines.find(l => l.startsWith(prefix));
  assert.ok(found, `${prefix} found in index.html`);
  return found;
};

function boot() {
  const els = {};
  const doc = { activeElement: null, getElementById: id => el(id) };
  function el(id) {
    if (els[id]) return els[id];
    const e = els[id] = {
      id, value: '', className: id === 'rmFeedback' ? 'feedback hidden' : '', textContent: '', innerHTML: '',
      disabled: false, style: {}, onclick: null, onkeydown: null,
      focus() { doc.activeElement = e; },
      click() { doc.activeElement = e; if (e.onclick) e.onclick(); },
      classList: {
        contains: c => e.className.split(/\s+/).includes(c),
        toggle(c, on) {
          const rest = e.className.split(/\s+/).filter(x => x && x !== c);
          e.className = (on ? rest.concat(c) : rest).join(' ');
        },
      },
    };
    return e;
  }
  const logged = [];
  const ctx = {
    document: doc,
    setTimeout: fn => fn(),
    normalizeAnswer,
    currentDiag: () => BANKS.diagnosticItems('א'),
    rmHe: s => s,
    setItemTag() {}, renderWidget() {}, revealWidget() {}, maybeHear() {}, maybeSpeak() {}, noteMetro() {}, rmAdvance() {},
    setMath: (node, text) => { node.textContent = String(text); },
    mathHtml: s => String(s),
    answerHint: () => 'רמז',
    answerOk: (q, v) => String(q.answer) === normalizeAnswer(v),
    logTeacherItem: x => logged.push(x),
  };
  vm.createContext(ctx);
  vm.runInContext([
    line('const $=id=>'),
    line('function askForAnswer('),
    line('let rmIdx=0,rmAns=[]'),
    line('function rmRender(){'),
    line('function musicWayHtml('),
    line('function setMusicWay('),
    line('function musicEvHe('),
    line('function musicSourceHtml('),
    line('function rmCheck(){'),
    line("$('rmBegin').onclick="),
    line("$('rmCheck').onclick=rmCheck;"),
    'globalThis.rmState=()=>({rmAns,rmAnswered,q:RM_DIAG[rmIdx]});',
  ].join('\n'), ctx);
  el('rmBegin').click();
  return { el, doc, ctx, logged };
}

for (const [label, typed, submit] of [
  ['an empty answer', '', ({ el }) => el('rmCheck').click()],
  ['a spaces-only answer', '   ', ({ el }) => el('rmCheck').click()],
  ['an empty answer submitted with Enter', '', ({ el }) => el('rmAnswer').onkeydown({ key: 'Enter' })],
]) {
  test(`diagnostic: ${label} gives a visible hint, keeps focus on #rmAnswer and records nothing`, () => {
    const env = boot();
    const { el, doc, ctx, logged } = env;
    assert.equal(doc.activeElement, el('rmAnswer'), 'rmRender focuses the answer box');
    assert.equal(el('rmFeedback').classList.contains('hidden'), true, 'no feedback before checking');

    el('rmAnswer').value = typed;
    submit(env);

    const fb = el('rmFeedback');
    assert.equal(fb.classList.contains('hidden'), false, 'hint is visible');
    assert.ok(fb.textContent.trim().length > 0, 'hint is not empty');
    assert.match(fb.textContent, /[֐-׿]/, 'hint is Hebrew');
    assert.equal(doc.activeElement, el('rmAnswer'), 'focus returns to the answer box');
    const st = ctx.rmState();
    assert.equal(st.rmAns.length, 0, 'rmAns did not grow');
    assert.equal(st.rmAnswered, false, 'the question stays open');
    assert.deepEqual(logged, [], 'nothing reaches the teacher log');
    assert.equal(el('rmAnswer').disabled, false);
    assert.equal(el('rmCheck').disabled, false);
  });
}

test('diagnostic: after the hint, a real answer is recorded exactly once', () => {
  const { el, ctx, logged } = boot();
  el('rmAnswer').value = '';
  el('rmCheck').click();
  el('rmAnswer').value = String(ctx.rmState().q.answer);
  el('rmCheck').click();
  el('rmCheck').click();
  const st = ctx.rmState();
  assert.equal(st.rmAns.length, 1);
  assert.equal(st.rmAns[0].correct, true);
  assert.equal(logged.length, 1);
  assert.equal(el('rmFeedback').classList.contains('hidden'), false);
});
