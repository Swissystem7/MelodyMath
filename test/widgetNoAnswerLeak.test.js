const test = require('node:test');
const assert = require('node:assert/strict');

const BANKS = require('../src/lib/banks');
const g1 = require('../src/lib/grade1Music');
const g2 = require('../src/lib/grade2Music');
const g3 = require('../src/lib/grade3Music');

// #457 acceptance: for every shipped grade א–ג practice item with a music
// widget, neither the visible note nor its sr-only twin (the first child a
// screen reader hears) may contain the answer while the question is open.
function makeEl(tag) {
  return {
    tag, className: '', textContent: '', innerHTML: '',
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
const all = (root) => root.children.flatMap((c) => [c].concat(all(c)));

const BIND = { g1: g1.bindGrade1, g2: g2.bindGrade2, g3: g3.bindGrade3 };
const escape = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const leaks = (text, answer) => new RegExp('(^|[^0-9])' + escape(answer) + '([^0-9]|$)').test(text);

function widgetItems(grade) {
  return BANKS.practiceItems(null, grade).filter((it) => BIND[it.widget] && it[it.widget]);
}

for (const grade of ['א', 'ב', 'ג']) {
  test(`grade ${grade}: widget note and sr-only line keep the answer back until the child answers`, (t) => {
    global.document = { createElement: makeEl };
    t.after(() => { delete global.document; });
    const items = widgetItems(grade);
    assert.ok(items.length > 0, `grade ${grade} ships widget items`);
    let checked = 0;
    items.forEach((it) => {
      const host = makeEl('div');
      if (!BIND[it.widget](host, it[it.widget])) return;
      // The prompt itself already names it (a "which is higher" pair).
      if (leaks(it.prompt, it.answer)) return;
      const box = host.children[0];
      const sr = box.children[0];
      const note = box.querySelector('.g3-note');
      assert.equal(sr.className, 'sr-only', it.id);
      assert.ok(note, it.id + ' has a note');
      assert.ok(!leaks(note.textContent, it.answer), `${it.id} note says ${it.answer}: ${note.textContent}`);
      assert.ok(!leaks(sr.textContent, it.answer), `${it.id} sr-only says ${it.answer}: ${sr.textContent}`);
      checked++;
    });
    assert.ok(checked > 0, `grade ${grade}: ${checked} widgets checked`);
  });
}

test('the pending narration functions themselves leave the predicted number out', () => {
  // Grade 1: the next accent and the chart number.
  assert.ok(!leaks(g1.metronomeNarration(0, 5, 3), 20));
  assert.ok(!leaks(g1.chart100Sound(34, 110).cue, 34));
  // Grade 2: registers cue drops each voice's count.
  assert.ok(!leaks(g2.registerCue({ h: 6, t: 1, o: 8 }), 6));
  // Grade 3: the grid cue drops the cell total.
  assert.ok(!leaks(g3.gridCue(3, 7), 21));
  assert.ok(leaks(g3.gridNarration(3, 7), 21), 'full narration still names it after answering');
});
