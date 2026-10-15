const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const g3 = require('../src/lib/grade3Music');
const engine = require('../src/lib/musicEngine');

const root = path.join(__dirname, '..');

// A fake DOM just big enough for bindGrade3: it creates elements, appends them,
// sets attributes and reads .textContent back. Like the real thing, reading
// textContent walks the children and writing it drops them.
function makeEl(tag) {
  let text = '';
  const el = {
    tagName: tag, className: '', type: '', dir: '', children: [], attrs: {}, handlers: {},
    style: { props: {}, setProperty(k, v) { this.props[k] = v; } },
    classList: { toggle(c, on) { el.className = (on ? el.className + ' ' + c : el.className.replace(c, '')).trim(); } },
    setAttribute(k, v) { el.attrs[k] = String(v); },
    getAttribute(k) { return el.attrs[k] == null ? null : el.attrs[k]; },
    addEventListener(ev, fn) { (el.handlers[ev] = el.handlers[ev] || []).push(fn); },
    appendChild(c) { el.children.push(c); return c; },
    insertBefore(c, at) { el.children.splice(Math.max(0, el.children.indexOf(at)), 0, c); return c; },
    get firstChild() { return el.children[0] || null; },
    querySelector(sel) { return find(el, sel)[0] || null; },
    fire(ev) { (el.handlers[ev] || []).forEach((fn) => fn({ target: el })); },
    get textContent() { return el.children.length ? el.children.map((c) => c.textContent).join('') : text; },
    set textContent(v) { text = String(v); el.children.length = 0; },
  };
  return el;
}

// Only the ".class" selectors the widgets and these tests use.
function find(el, sel) {
  const all = [];
  (function walk(n) { n.children.forEach(function (c) { all.push(c); walk(c); }); })(el);
  return all.filter((c) => (' ' + c.className + ' ').includes(' ' + sel.slice(1) + ' '));
}

// Runs `fn` with a document in scope and playback captured, then puts the
// globals back: the pure tests next door still want a Node with no DOM.
function withDom(fn) {
  const played = [];
  const realPlay = engine.playSequence;
  global.document = { createElement: makeEl };
  engine.playSequence = (events) => { played.push(events); return events; };
  try {
    return fn(played, makeEl('div'));
  } finally {
    engine.playSequence = realPlay;
    delete global.document;
    delete global.loadAccess;
  }
}

test('bindGrade3 is a no-op without a document, a host, a spec or a known kind', () => {
  assert.equal(g3.bindGrade3(makeEl('div'), { kind: 'meter', table: 3, bars: 2 }), false);
  withDom((played, h) => {
    assert.equal(g3.bindGrade3(h, null), false);
    assert.equal(g3.bindGrade3(h, { kind: 'nope' }), false);
    // A known kind the pure half rejects draws no pads, no note and no play
    // button: the box stays empty instead of showing a broken picture.
    [{ kind: 'meter', table: 5, bars: 2 }, { kind: 'remainder', beats: 14, perBar: 0 }, { kind: 'grid', rows: 99, steps: 8 }].forEach((spec) => {
      g3.bindGrade3(h, spec);
      assert.equal(find(h, '.g3-row').length + find(h, '.g3-grid').length, 0, spec.kind + ' draws nothing');
      assert.equal(find(h, '.g3-play').length, 0, spec.kind + ' has nothing to play');
    });
  });
});

test('the meter widget draws one box per bar, the accent carrying the multiple', () => {
  withDom((played, h) => {
    assert.equal(g3.bindGrade3(h, { kind: 'meter', table: 3, bars: 4, bpm: 96 }), true);
    assert.deepEqual(find(h, '.g3-bar').map((b) => b.children.length), [3, 3, 3, 3]);
    // Only the last beat of each bar is accented, and it shows 3, 6, 9, 12.
    assert.deepEqual(find(h, '.on').map((i) => i.textContent), ['3', '6', '9', '12']);
    assert.equal(find(h, '.g3-note')[0].textContent, g3.meterNarration(3, 4));
    find(h, '.g3-play')[0].fire('click');
    assert.deepEqual(played[0], g3.meterEvents(3, 4, 96), 'the button sounds what the pure half planned');
  });
});

test('the remainder widget shows the full bars and the beats that never filled one', () => {
  withDom((played, h) => {
    assert.equal(g3.bindGrade3(h, { kind: 'remainder', beats: 14, perBar: 4, bpm: 96 }), true);
    assert.deepEqual(find(h, '.g3-bar').map((b) => b.children.length), [4, 4, 4, 2]);
    // The leftover beats are styled apart, so they do not read as a fourth full bar.
    assert.equal(find(h, '.left').length, 2);
    assert.match(find(h, '.g3-note')[0].textContent, /3 תיבות שלמות/);
    find(h, '.g3-play')[0].fire('click');
    assert.deepEqual(played[0], g3.remainderEvents(14, 4, 96));
    g3.bindGrade3(h, { kind: 'remainder', beats: 12, perBar: 4 });
    assert.equal(find(h, '.left').length, 0, 'a zero remainder draws no leftover beats');
  });
});

test('the pair widget prints both values LTR and narrates the order', () => {
  withDom((played, h) => {
    const spec = { kind: 'pair', a: 220, b: 440, unit: 'hz' };
    assert.equal(g3.bindGrade3(h, spec), true);
    const values = find(h, '.g3-values')[0];
    assert.equal(values.textContent, '220 → 440 Hz');
    assert.equal(values.dir, 'ltr', 'a Hebrew page would otherwise reorder the pair');
    assert.equal(find(h, '.g3-note')[0].textContent, g3.pairNarration(spec));
    find(h, '.g3-play')[0].fire('click');
    assert.deepEqual(played[0], g3.pairEvents(spec));
    g3.bindGrade3(h, { kind: 'pair', a: 60, b: 120, unit: 'bpm' });
    assert.equal(find(h, '.g3-values')[0].textContent, '60 → 120 BPM');
  });
});

test('the grid widget is rows × steps of ≥44px cells, each one labelled and toggling', () => {
  withDom((played, h) => {
    assert.equal(g3.bindGrade3(h, { kind: 'grid', rows: 3, steps: 8, bpm: 96, width: 284 }), true);
    const rows = find(h, '.g3-grow');
    assert.deepEqual(rows.map((r) => r.children.length), [8, 8, 8]);
    const lay = g3.gridLayout(8, 284);
    assert.ok(lay.cell >= g3.MIN_CELL, 'cells never shrink below the touch target');
    assert.ok(lay.perRow < 8, '8 cells of 44px do not fit 284px, so the row wraps');
    assert.equal(find(h, '.g3-grid')[0].style.props['--g3-cell'], lay.cell + 'px');
    assert.equal(find(h, '.g3-grid')[0].style.props['--g3-cols'], String(lay.perRow));
    const first = rows[0].children[0];
    assert.equal(first.getAttribute('aria-label'), 'שורה 1, תא 1');
    first.fire('click');
    assert.equal(first.getAttribute('aria-pressed'), 'true');
    assert.match(first.className, /\bon\b/);
    assert.equal(played.length, 1, 'switching a cell on sounds its pitch once');
    first.fire('click');
    assert.equal(first.getAttribute('aria-pressed'), 'false');
    assert.doesNotMatch(first.className, /\bon\b/);
    assert.equal(played.length, 1, 'switching a cell off stays silent');
    find(h, '.g3-play')[0].fire('click');
    assert.deepEqual(played[1], g3.gridEvents(3, 8, 96));
  });
});

test('quiet mode mutes every widget but keeps the narration on screen', () => {
  withDom((played, h) => {
    global.loadAccess = () => ({ quiet: true });
    g3.bindGrade3(h, { kind: 'grid', rows: 2, steps: 4, width: 284 });
    find(h, '.g3-cell')[0].fire('click');
    find(h, '.g3-play')[0].fire('click');
    assert.deepEqual(played, [], 'quiet mode plays nothing at all');
    assert.ok(find(h, '.g3-note')[0].textContent.length > 10, 'the narration is still on screen');
    // A storage read that throws must not take the widget down with it.
    global.loadAccess = () => { throw new Error('no localStorage'); };
    assert.equal(g3.bindGrade3(h, { kind: 'meter', table: 3, bars: 2 }), true);
    find(h, '.g3-play')[0].fire('click');
    assert.equal(played.length, 1);
  });
});

test('the beat pads are hidden from the screen reader and the narration is read once', () => {
  withDom((played, h) => {
    g3.bindGrade3(h, { kind: 'meter', table: 3, bars: 2 });
    const note = find(h, '.g3-note')[0];
    assert.equal(find(h, '.g3-row')[0].getAttribute('aria-hidden'), 'true');
    assert.equal(note.getAttribute('aria-hidden'), 'true');
    const sr = h.children[0].children[0];
    assert.equal(sr.className, 'sr-only');
    assert.equal(sr.textContent, note.textContent, 'the sr-only line is the visible note');
    // The grid is interactive, so its cells stay in the accessibility tree.
    g3.bindGrade3(h, { kind: 'grid', rows: 2, steps: 4, width: 284 });
    assert.equal(find(h, '.g3-grid')[0].getAttribute('aria-hidden'), null);
  });
});

test('binding twice replaces the previous widget instead of stacking two', () => {
  withDom((played, h) => {
    g3.bindGrade3(h, { kind: 'meter', table: 3, bars: 2 });
    g3.bindGrade3(h, { kind: 'meter', table: 6, bars: 1 });
    assert.equal(h.children.length, 1);
    assert.equal(find(h, '.g3-bar').length, 1);
  });
});

test('index.html loads grade3Music.js, draws the g3 widget and styles its cells for touch', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /<script src="src\/lib\/grade3Music\.js"><\/script>/);
  assert.match(html, /item\.widget==='g3' && item\.g3 && typeof bindGrade3==='function'/);
  assert.match(html, /\.g3-cell\{[^}]*min-width:44px;min-height:44px/);
  // musicEngine.js has to be in scope before grade3Music.js asks it for a tempo.
  assert.ok(html.indexOf('src/lib/musicEngine.js') < html.indexOf('src/lib/grade3Music.js'));
});
