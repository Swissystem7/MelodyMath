const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { adultQuestion, adultAnswerOk, holdLongEnough, HOLD_MS, pickNum } = require('../src/lib/adultGate.js');

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
  const $ = id => {
    if (!els[id]) {
      els[id] = { id, value: '', textContent: '', classList: classList(), focus() {} };
    }
    return els[id];
  };
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

test('pickNum clamps rand edge values and keeps non-round-ten adjustments within bounds', () => {
  // Clamping rand() >= 1 or float rounding to hi
  assert.equal(pickNum(() => 1, 10, 20), 19); // 20 % 10 === 0 -> adjusted down to 19, within [10, 20]
  assert.equal(pickNum(() => 1.5, 10, 20), 19);
  assert.equal(pickNum(() => -0.5, 10, 20), 11); // 10 % 10 === 0 -> adjusted up to 11, within [10, 20]
  assert.equal(pickNum(() => 0, 10, 20), 11);
  assert.equal(pickNum(() => 0.999, 10, 20), 19);

  // When clamped to boundary that is round ten, does not exceed hi
  assert.equal(pickNum(() => 1, 10, 10), 10);
  assert.equal(pickNum(() => 1, 100, 100), 100);

  // Exact bounds when non-round
  assert.equal(pickNum(() => 1, 13, 99), 99);
  assert.equal(pickNum(() => 0, 13, 99), 13);
  assert.equal(pickNum(() => 1, 101, 999), 999);
  assert.equal(pickNum(() => 0, 101, 999), 101);
});

test('adultAnswerOk rejects invalid or malformed q', () => {
  assert.equal(adultAnswerOk(null, '30856'), false);
  assert.equal(adultAnswerOk(undefined, '30856'), false);
  assert.equal(adultAnswerOk('string', '30856'), false);
  assert.equal(adultAnswerOk(12345, '30856'), false);
  assert.equal(adultAnswerOk([], '30856'), false);
  assert.equal(adultAnswerOk({}, '30856'), false);
  assert.equal(adultAnswerOk({ answer: NaN }, '30856'), false);
  assert.equal(adultAnswerOk({ answer: Infinity }, '30856'), false);
  assert.equal(adultAnswerOk({ answer: -Infinity }, '30856'), false);
  assert.equal(adultAnswerOk({ answer: null }, '30856'), false);
  assert.equal(adultAnswerOk({ answer: undefined }, '30856'), false);
  assert.equal(adultAnswerOk({ answer: '30856' }, '30856'), false);
});

test('adultAnswerOk rejects invalid given inputs (objects, booleans, decimals, negatives, letters, exponential notation)', () => {
  const q = { answer: 30856 };
  // Objects
  assert.equal(adultAnswerOk(q, {}), false);
  assert.equal(adultAnswerOk(q, { value: 30856 }), false);
  assert.equal(adultAnswerOk(q, [30856]), false);
  assert.equal(adultAnswerOk(q, new Date()), false);

  // Booleans
  assert.equal(adultAnswerOk(q, true), false);
  assert.equal(adultAnswerOk(q, false), false);

  // Decimals
  assert.equal(adultAnswerOk(q, '30856.0'), false);
  assert.equal(adultAnswerOk(q, '30856.5'), false);
  assert.equal(adultAnswerOk(q, 30856.5), false);
  assert.equal(adultAnswerOk(q, '.30856'), false);

  // Negatives
  assert.equal(adultAnswerOk(q, '-30856'), false);
  assert.equal(adultAnswerOk(q, -30856), false);

  // Letters and non-digits
  assert.equal(adultAnswerOk(q, 'abc'), false);
  assert.equal(adultAnswerOk(q, '30856a'), false);
  assert.equal(adultAnswerOk(q, 'a30856'), false);
  assert.equal(adultAnswerOk(q, '308 56x'), false);

  // Exponential notation
  assert.equal(adultAnswerOk(q, '1e5'), false);
  assert.equal(adultAnswerOk(q, '30856e0'), false);
  assert.equal(adultAnswerOk(q, '3.0856e4'), false);
  assert.equal(adultAnswerOk(q, '1E5'), false);

  // Null, undefined, empty
  assert.equal(adultAnswerOk(q, null), false);
  assert.equal(adultAnswerOk(q, undefined), false);
  assert.equal(adultAnswerOk(q, ''), false);
  assert.equal(adultAnswerOk(q, '   '), false);

  // Valid integers and whitespace/comma-formatted inputs
  assert.equal(adultAnswerOk(q, '30856'), true);
  assert.equal(adultAnswerOk(q, 30856), true);
  assert.equal(adultAnswerOk(q, ' 30,856 '), true);
  assert.equal(adultAnswerOk(q, '30 856'), true);
});

test('holdLongEnough rejects NaN, non-finite values, and inverted timestamps', () => {
  // Valid hold
  assert.equal(holdLongEnough(1000, 4000), true);
  assert.equal(holdLongEnough(0, 3000), true);
  assert.equal(holdLongEnough(1000, 5000), true);

  // Shorter than HOLD_MS
  assert.equal(holdLongEnough(1000, 3999), false);

  // Inverted timestamps (endMs < startMs)
  assert.equal(holdLongEnough(4000, 1000), false);
  assert.equal(holdLongEnough(3000, 0), false);
  assert.equal(holdLongEnough(100, 99), false);

  // NaN
  assert.equal(holdLongEnough(NaN, 4000), false);
  assert.equal(holdLongEnough(1000, NaN), false);
  assert.equal(holdLongEnough(NaN, NaN), false);

  // Non-finite (Infinity, -Infinity)
  assert.equal(holdLongEnough(Infinity, 4000), false);
  assert.equal(holdLongEnough(1000, Infinity), false);
  assert.equal(holdLongEnough(-Infinity, 4000), false);
  assert.equal(holdLongEnough(1000, -Infinity), false);
  assert.equal(holdLongEnough(Infinity, Infinity), false);

  // Non-numbers
  assert.equal(holdLongEnough(null, 4000), false);
  assert.equal(holdLongEnough(1000, null), false);
  assert.equal(holdLongEnough(undefined, 4000), false);
  assert.equal(holdLongEnough('1000', '4000'), false);
  assert.equal(holdLongEnough({}, {}), false);
});

test('adultQuestion supports dynamic options (operators and custom bounds) while preserving default compatibility', () => {
  // Default call backward compatibility
  const qDefault = adultQuestion();
  assert.ok(qDefault.a >= 101 && qDefault.a <= 999 && qDefault.a % 10 !== 0);
  assert.ok(qDefault.b >= 13 && qDefault.b <= 99 && qDefault.b % 10 !== 0);
  assert.equal(qDefault.answer, qDefault.a * qDefault.b);
  assert.match(qDefault.text, /^כמה זה \d{3} × \d\d\?$/);

  // Dynamic addition
  const qAdd = adultQuestion(() => 0.5, { op: '+' });
  assert.equal(qAdd.answer, qAdd.a + qAdd.b);
  assert.equal(qAdd.text, `כמה זה ${qAdd.a} + ${qAdd.b}?`);
  assert.equal(adultAnswerOk(qAdd, String(qAdd.answer)), true);

  // Dynamic subtraction (non-negative)
  const qSub = adultQuestion(() => 0.5, { op: '-' });
  assert.ok(qSub.a >= qSub.b, 'subtraction minuend >= subtrahend');
  assert.equal(qSub.answer, qSub.a - qSub.b);
  assert.equal(qSub.text, `כמה זה ${qSub.a} - ${qSub.b}?`);
  assert.equal(adultAnswerOk(qSub, String(qSub.answer)), true);

  // Dynamic operator selection
  const seenOps = new Set();
  for (let i = 0; i < 50; i++) {
    const qDyn = adultQuestion(Math.random, { op: 'dynamic' });
    assert.ok(adultAnswerOk(qDyn, String(qDyn.answer)));
    if (qDyn.text.includes('+')) seenOps.add('+');
    if (qDyn.text.includes('-')) seenOps.add('-');
    if (qDyn.text.includes('×')) seenOps.add('×');
  }
  assert.ok(seenOps.size >= 2, 'multiple operators selected across dynamic questions');

  // Custom bounds
  const qBounds = adultQuestion(Math.random, { minA: 200, maxA: 250, minB: 20, maxB: 30, op: '+' });
  assert.ok(qBounds.a >= 200 && qBounds.a <= 250);
  assert.ok(qBounds.b >= 20 && qBounds.b <= 30);
  assert.equal(qBounds.answer, qBounds.a + qBounds.b);

  // Array bounds [lo, hi]
  const qArrBounds = adultQuestion(Math.random, { boundsA: [301, 350], boundsB: [15, 25] });
  assert.ok(qArrBounds.a >= 301 && qArrBounds.a <= 350);
  assert.ok(qArrBounds.b >= 15 && qArrBounds.b <= 25);
  assert.equal(qArrBounds.answer, qArrBounds.a * qArrBounds.b);

  // Passing opts as first argument
  const qOptsFirst = adultQuestion({ op: '+', minA: 50, maxA: 60, minB: 50, maxB: 60 });
  assert.ok(qOptsFirst.a >= 50 && qOptsFirst.a <= 60);
  assert.ok(qOptsFirst.b >= 50 && qOptsFirst.b <= 60);
  assert.equal(qOptsFirst.answer, qOptsFirst.a + qOptsFirst.b);
  assert.equal(qOptsFirst.text, `כמה זה ${qOptsFirst.a} + ${qOptsFirst.b}?`);
});
