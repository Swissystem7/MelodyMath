const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { adultQuestion, adultAnswerOk, holdLongEnough, HOLD_MS } = require('../src/lib/adultGate.js');

// #737: a child must not reach the teacher tab without an adult answering
// a fresh three-digit × two-digit product and a 3-second hold.
const root = path.join(__dirname, '..');
const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const grab = name => {
  const m = indexHtml.match(new RegExp(`^function ${name}\\(.*$`, 'm'));
  assert.ok(m, `${name} found in index.html`);
  return m[0];
};

function classList() {
  const set = new Set();
  return {
    add: c => set.add(c), remove: c => set.delete(c), contains: c => set.has(c),
    toggle: (c, on) => { (on === undefined ? !set.has(c) : on) ? set.add(c) : set.delete(c); },
  };
}

function page() {
  const attrs = () => { const a = {}; return { setAttribute(k, v) { a[k] = String(v); }, getAttribute: k => (k in a ? a[k] : null) }; };
  const ids = ['remediation', 'practice', 'teacherReport'];
  const tabs = ids.map(id => Object.assign({ dataset: { tab: id }, classList: classList(), tabIndex: -1, focus() {} }, attrs()));
  const panels = ids.map(id => Object.assign({ id, hidden: id !== 'remediation', classList: classList() }, attrs()));
  tabs[0].setAttribute('aria-selected', 'true');
  const els = {};
  const $ = id => els[id] || (els[id] = { id, value: '', textContent: '', classList: classList(), focus() {} });
  $('adultGate').classList.add('hidden');
  const ctx = {
    $,
    show: (id, on) => $(id).classList.toggle('hidden', !on),
    setTimeout: fn => fn(),
    adultQuestion: () => adultQuestion(() => 0.5),
    adultAnswerOk,
    holdLongEnough,
    document: {
      body: { classList: classList() },
      querySelectorAll: sel => (sel === '.panel' ? panels : tabs),
      querySelector: () => tabs.find(t => t.getAttribute('aria-selected') === 'true') || null,
    },
  };
  vm.createContext(ctx);
  vm.runInContext(['askAdult', 'openAdultGate', 'confirmAdultGate', 'holdAdultGate', 'cancelAdultGate', 'activateHomeTab'].map(grab).join('\n')
    + '\nlet adultOk=false,adultQ=null,adultTab=null,adultHoldAt=null;', ctx);
  const report = panels[2];
  return { ctx, tabs, report, gate: $('adultGate'), input: $('adultGateAnswer'), msg: $('adultGateMsg'), q: $('adultGateQ') };
}

test('the question is three-digit × two-digit, never a round ten, new each time', () => {
  const seen = new Set();
  for (let i = 0; i < 500; i++) {
    const q = adultQuestion();
    assert.ok(q.a >= 101 && q.a <= 999 && q.a % 10 !== 0, `${q.a} is three-digit and not round`);
    assert.ok(q.b >= 13 && q.b <= 99 && q.b % 10 !== 0, `${q.b} is two-digit and not round`);
    assert.equal(q.answer, q.a * q.b);
    assert.match(q.text, /^כמה זה \d{3} × \d\d\?$/);
    seen.add(q.text);
  }
  assert.ok(seen.size > 400, 'randomized on every open');
  const lo = adultQuestion(() => 0), hi = adultQuestion(() => 0.9999);
  assert.deepEqual([lo.a, lo.b, hi.a, hi.b], [101, 13, 999, 99]);
});

test('only the exact product passes', () => {
  const q = adultQuestion(() => 0.5); // 551 × 56
  assert.equal(q.answer, 30856);
  assert.equal(adultAnswerOk(q, '30856'), true);
  assert.equal(adultAnswerOk(q, ' 30,856 '), true);
  for (const bad of ['30855', '', '308 56x', '-30856', '30856.5', null]) assert.equal(adultAnswerOk(q, bad), false, String(bad));
  assert.equal(adultAnswerOk(null, '30856'), false);
});

test('confirming needs a 3-second hold', () => {
  assert.equal(HOLD_MS, 3000);
  assert.equal(holdLongEnough(1000, 4000), true);
  assert.equal(holdLongEnough(1000, 3999), false);
  assert.equal(holdLongEnough(null, 4000), false);
  const { ctx, tabs, report, input, msg } = page();
  ctx.activateHomeTab(tabs[2]);
  input.value = '30856';
  ctx.holdAdultGate('start', 0);
  assert.equal(ctx.holdAdultGate('end', 500), false, 'a quick tap is not enough');
  assert.equal(report.hidden, true);
  assert.match(msg.textContent, /3 שניות/);
  assert.equal(ctx.holdAdultGate('end', 9000), false, 'a release without a press does nothing');
  ctx.holdAdultGate('start', 1000);
  ctx.holdAdultGate('start', 2500); // key repeat does not restart the timer
  assert.equal(ctx.holdAdultGate('end', 4000), true);
  assert.equal(report.hidden, false);
});

test('a child tapping the teacher tab gets the gate, not the report', () => {
  const { ctx, tabs, report, gate, q } = page();
  ctx.activateHomeTab(tabs[2]);
  assert.equal(report.hidden, true);
  assert.equal(tabs[2].getAttribute('aria-selected'), null);
  assert.equal(tabs[0].getAttribute('aria-selected'), 'true');
  assert.equal(gate.classList.contains('hidden'), false);
  assert.equal(q.textContent, 'כמה זה 551 × 56?');
  assert.equal(ctx.document.body.classList.contains('adult-ok'), false);
});

test('a wrong answer keeps the report closed and asks again', () => {
  const { ctx, tabs, report, gate, input, msg } = page();
  ctx.activateHomeTab(tabs[2]);
  input.value = '100';
  assert.equal(ctx.confirmAdultGate(), false);
  assert.equal(report.hidden, true);
  assert.equal(gate.classList.contains('hidden'), false);
  assert.match(msg.textContent, /נשאר סגור/);
  assert.equal(input.value, '');
  input.value = '';
  assert.equal(ctx.confirmAdultGate(), false);
  assert.equal(report.hidden, true);
});

test('the right answer opens the report; leaving the tab locks it again', () => {
  const { ctx, tabs, report, gate, input } = page();
  ctx.activateHomeTab(tabs[2]);
  input.value = '30856';
  assert.equal(ctx.confirmAdultGate(), true);
  assert.equal(report.hidden, false);
  assert.equal(tabs[2].getAttribute('aria-selected'), 'true');
  assert.equal(gate.classList.contains('hidden'), true);
  assert.equal(ctx.document.body.classList.contains('adult-ok'), true);
  ctx.activateHomeTab(tabs[0]);
  assert.equal(report.hidden, true);
  assert.equal(ctx.document.body.classList.contains('adult-ok'), false);
  ctx.activateHomeTab(tabs[2]);
  assert.equal(report.hidden, true, 'the next child cannot walk back in');
  assert.equal(gate.classList.contains('hidden'), false);
});

test('cancel closes the gate and leaves the report shut', () => {
  const { ctx, tabs, report, gate } = page();
  ctx.activateHomeTab(tabs[2]);
  ctx.cancelAdultGate();
  assert.equal(gate.classList.contains('hidden'), true);
  assert.equal(report.hidden, true);
});

test('every way into the teacher tab goes through activateHomeTab', () => {
  // Clicks: the home tabs are wired only to activateHomeTab.
  assert.match(indexHtml, /\.tabs \[role="tab"\]'\)\.forEach\(b=>b\.onclick=\(\)=>activateHomeTab\(b\)\)/);
  // Keyboard: tabs.js moves by calling click(), which lands on the same handler.
  const tabsJs = fs.readFileSync(path.join(root, 'src/lib/tabs.js'), 'utf8');
  assert.match(tabsJs, /tab\.click\(\)/);
  assert.doesNotMatch(indexHtml, /bindTablist\([^)]*onActivate/);
  // Nothing else in the page script names the panel or unhides it directly.
  const script = indexHtml.slice(indexHtml.indexOf('<script>'));
  const named = script.split('\n').filter(l => /['"]teacherReport['"]/.test(l));
  assert.deepEqual(named.map(l => l.slice(0, 24)), ['function activateHomeTab']);
  // Print: the report only prints once the gate is passed.
  for (const css of [indexHtml, fs.readFileSync(path.join(root, 'src/lib/print.css'), 'utf8')]) {
    assert.doesNotMatch(css, /(^\s*|[{}])#teacherReport\.panel\{display:block/m);
    assert.match(css, /body\.adult-ok #teacherReport\.panel\{display:block!important\}/);
  }
});

test('the gate is labelled, announced and keyboard-operable', () => {
  assert.match(indexHtml, /<script src="src\/lib\/adultGate\.js"><\/script>/);
  assert.match(indexHtml, /<label for="adultGateAnswer"/);
  assert.match(indexHtml, /id="adultGateAnswer" inputmode="numeric"[^>]*aria-label="[^"]+"/);
  assert.match(indexHtml, /<button type="button" id="adultGateOk"[^>]*aria-label="[^"]+">אישור<\/button>/);
  assert.match(indexHtml, /<button type="button" id="adultGateCancel"[^>]*aria-label="[^"]+">ביטול<\/button>/);
  assert.match(indexHtml, /id="adultGateMsg"[^>]*role="status" aria-live="polite"/);
  assert.match(indexHtml, /\$\('adultGateAnswer'\)\.onkeydown=e=>\{if\(e\.key==='Enter'\)\{[^}]*focus\(\)\}else if\(e\.key==='Escape'\)cancelAdultGate\(\)\};/);
  assert.match(indexHtml, /onpointerdown=\(\)=>holdAdultGate\('start'/);
  assert.match(indexHtml, /onkeyup=e=>\{if\(e\.key==='Enter'\|\|e\.key===' '\)holdAdultGate\('end'/);
});
