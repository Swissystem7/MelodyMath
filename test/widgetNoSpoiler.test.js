const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const banks = require('../src/lib/banks');
const g1 = require('../src/lib/grade1Music');
const g2 = require('../src/lib/grade2Music');
const g3 = require('../src/lib/grade3Music');

// #457: a music widget is drawn while the question is open, so nothing it
// prints — visible note, sr-only copy, pad labels — may hold the answer.
// Text that names it waits in data-reveal until the feedback step.
function makeEl(tag) {
  return {
    tag: tag, className: '', textContent: '', innerHTML: '',
    children: [], attrs: {}, style: { setProperty() {} },
    appendChild(c) { this.children.push(c); return c; },
    insertBefore(c) { this.children.unshift(c); return c; },
    setAttribute(k, v) { this.attrs[k] = String(v); },
    getAttribute(k) { return this.attrs[k] == null ? null : this.attrs[k]; },
    removeAttribute(k) { delete this.attrs[k]; },
    addEventListener() {},
    querySelector(sel) { return all(this).find((c) => c.className.split(' ').includes(sel.slice(1))) || null; },
    querySelectorAll() { return all(this).filter((c) => c.attrs['data-reveal'] != null); },
  };
}

function all(root) {
  return root.children.flatMap((c) => [c].concat(all(c)));
}

function shown(root) {
  return all(root).map((c) => c.textContent + ' ' + c.innerHTML).join(' ');
}

const numbers = (s) => ' ' + String(s).replace(/[^0-9]+/g, ' ') + ' ';
const BIND = { g1: g1.bindGrade1, g2: g2.bindGrade2, g3: g3.bindGrade3 };

test('no music widget in the banks prints the answer before the child answers', (t) => {
  global.document = { createElement: makeEl };
  t.after(() => { delete global.document; });
  const items = banks.allItems().filter((it) => BIND[it.widget] && it[it.widget]);
  assert.ok(items.length >= 60, items.length + ' widget items');
  items.forEach((it) => {
    const host = makeEl('div');
    if (!BIND[it.widget](host, it[it.widget])) return;
    const answer = ' ' + String(it.answer) + ' ';
    // The prompt already names it (e.g. "which is higher, 1200 Hz or 1020 Hz?").
    if (numbers(it.prompt).includes(answer)) return;
    assert.ok(!numbers(shown(host)).includes(answer), it.id + ' shows ' + it.answer + ': ' + shown(host));
  });
});

test('chart100 keeps the numeral out of the note and its sr-only copy until reveal', (t) => {
  global.document = { createElement: makeEl };
  t.after(() => { delete global.document; });
  const host = makeEl('div');
  assert.equal(g1.bindGrade1(host, { kind: 'chart100', number: 34 }), true);
  const box = host.children[0];
  const note = box.querySelector('.g3-note');
  const sr = box.children[0];
  assert.equal(sr.className, 'sr-only');
  [note, sr].forEach((el) => {
    assert.equal(el.textContent, '3 צלילים נמוכים לעשרות, 4 נקישות ליחידות.');
    assert.equal(el.getAttribute('data-reveal'), g1.chart100Sound(34).speech);
  });
  assert.match(g1.chart100Sound(34).speech, /^34: /);

  // revealWidget runs in the feedback step of beat, class and the diagnostic.
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  const src = html.match(/function revealWidget\(hostId\)\{[\s\S]*?\n\}/)[0];
  const reveal = vm.runInNewContext(src + '\nrevealWidget;', { $: () => host });
  reveal('beatWidget');
  [note, sr].forEach((el) => {
    assert.equal(el.textContent, g1.chart100Sound(34).speech);
    assert.equal(el.getAttribute('data-reveal'), null);
  });
  ['beatWidget', 'classWidget', 'rmWidget', 'rmPlanWidget'].forEach((id) => {
    assert.ok(html.includes("revealWidget('" + id + "')"), id + ' never reveals');
  });
});

test('the place-value registers note hides the counts but keeps the carries', () => {
  const cue = g2.registerCue({ h: 0, t: 0, o: 12 });
  assert.doesNotMatch(cue, /מנגן \d/);
  assert.ok(cue.includes(g2.ONES_TO_TEN_HE));
  assert.match(g2.registerNarration({ h: 6, t: 1, o: 8 }), /בס מנגן 6 צלילים/);
  assert.doesNotMatch(g2.registerCue({ h: 6, t: 1, o: 8 }), /6/);
});
