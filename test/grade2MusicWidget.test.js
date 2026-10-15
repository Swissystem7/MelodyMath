const test = require('node:test');
const assert = require('node:assert/strict');

const g2 = require('../src/lib/grade2Music');

// A fake document, like frequencyLab.test.js: enough of the DOM to prove the
// widget draws a ▶ button, a visible note and a screen-reader copy of it.
function makeEl(tag) {
  return {
    tag: tag, className: '', textContent: '', innerHTML: '',
    children: [], attrs: {}, clicks: [],
    appendChild(c) { this.children.push(c); return c; },
    insertBefore(c) { this.children.unshift(c); return c; },
    setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(ev, fn) { if (ev === 'click') this.clicks.push(fn); },
    querySelector(sel) { return find(this, sel.replace('.', '')); },
  };
}

function find(root, cls) {
  for (const c of root.children) {
    if (String(c.className).split(' ').indexOf(cls) !== -1) return c;
    const deep = find(c, cls);
    if (deep) return deep;
  }
  return null;
}

test('the widget draws a play button and a screen-reader copy of its note', (t) => {
  global.document = { createElement: makeEl };
  t.after(() => { delete global.document; });

  const host = makeEl('div');
  assert.equal(g2.bindGrade2(host, { kind: 'duo', a: 38, b: 25, op: '+' }), true);
  const box = host.children[0];

  const play = find(box, 'g3-play');
  assert.equal(play.tag, 'button');
  assert.equal(play.type, 'button');
  assert.match(play.textContent, /^▶/);
  // Pressing it must not throw before any sound exists: in Node there is no
  // AudioContext, so the engine schedules nothing (iOS needs the gesture too).
  assert.equal(play.clicks.length, 1);
  play.clicks.forEach((fn) => fn());

  const note = box.querySelector('.g3-note');
  assert.match(note.textContent, /מכות תוף/);
  assert.match(note.textContent, /צלילי בס/);
  assert.match(note.textContent, new RegExp(g2.CARRY_HE));
  assert.equal(note.attrs['aria-hidden'], 'true');

  const sr = box.children[0];
  assert.equal(sr.className, 'sr-only');
  assert.equal(sr.textContent, note.textContent, 'the sound has no text equivalent');
  assert.equal(box.querySelector('.g3-row').attrs['aria-hidden'], 'true');
  // The column itself comes from vertical.js, isolated LTR so 38 + 25 never mirrors.
  assert.match(box.children.map((c) => c.innerHTML).join(''), /class="vert" dir="ltr"/);
});

test('the widget refuses a spec it cannot draw', (t) => {
  global.document = { createElement: makeEl };
  t.after(() => { delete global.document; });
  assert.equal(g2.bindGrade2(makeEl('div'), { kind: 'nope' }), false);
  assert.equal(g2.bindGrade2(makeEl('div'), null), false);
  assert.equal(g2.bindGrade2(null, { kind: 'evenOdd', beats: 4 }), false);
  assert.equal(g2.bindGrade2(makeEl('div'), { kind: 'evenOdd', beats: 7 }), true);
  // 24 − 58 would go negative: the activity refuses it and the host stays hidden.
  const host = makeEl('div');
  assert.equal(g2.bindGrade2(host, { kind: 'duo', a: 24, b: 58, op: '-' }), false);
  assert.equal(host.children.length, 0);
});
