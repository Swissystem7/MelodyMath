// jamKit.dragToTarget (#671, part 1 of #848): drag a piece onto a target with
// a fake DOM. The helper makes no sound, so it works the same with music off.
const test = require('node:test');
const assert = require('node:assert');
const jam = require('../src/components/jamKit');
const HAD_DOC = 'document' in globalThis;
const ORIG_DOC = globalThis.document;

function fakeEl(className) {
  return {
    className, disabled: false,
    closest(sel) { return sel === '.' + this.className ? this : null; },
    setPointerCapture() {},
  };
}

// Builds a host, a source button, a target, a floor and a fake document.
function setup(t, opts) {
  t.after(() => { if (HAD_DOC) globalThis.document = ORIG_DOC; else delete globalThis.document; });
  const target = fakeEl('basket');
  const floor = fakeEl('floor');
  const ghosts = [];
  const doc = {
    body: { appendChild(g) { ghosts.push(g); } },
    createElement() { return { style: {}, remove() { this.removed = true; } }; },
    elementFromPoint(x) { return x >= 100 ? target : floor; },
  };
  globalThis.document = doc;
  const handlers = {};
  const host = { addEventListener(type, fn) { handlers[type] = fn; } };
  const btn = fakeEl('piece');
  const drops = [];
  const kit = jam.dragToTarget(host, Object.assign({
    source: '.piece', target: '.basket', ghostClass: 'mm-ghost',
    onDrop(over) { drops.push(over); },
  }, opts));
  const fire = (type, x, el, pointerId) => { if (handlers[type]) handlers[type]({ type, target: el || btn, clientX: x, clientY: 0, pointerId: pointerId == null ? 1 : pointerId }); };
  return { kit, fire, btn, target, ghosts, drops, doc, host };
}

test('jamKit still exports its previous members plus DRAG_MIN and dragToTarget', () => {
  ['tapPartsFor', 'registerTapVoices', 'instrument', 'musicKey', 'loadShowMusic', 'saveShowMusic',
    'musicToggleHtml', 'playNotes', 'feedback', 'cadence', 'stopWhenHidden', 'esc', 'dragToTarget']
    .forEach((k) => assert.strictEqual(typeof jam[k], 'function', k));
  assert.strictEqual(typeof jam.DRAG_MIN, 'number');
  assert.ok(jam.DRAG_MIN > 0);
});

test('a drag past DRAG_MIN dropped on the target calls onDrop once with one ghost', (t) => {
  const s = setup(t);
  s.fire('pointerdown', 0);
  s.fire('pointermove', jam.DRAG_MIN + 1);
  s.fire('pointermove', 120);
  s.fire('pointerup', 120);
  assert.deepStrictEqual(s.drops, [s.target]);
  assert.strictEqual(s.ghosts.length, 1);
  assert.strictEqual(s.ghosts[0].className, 'mm-ghost');
  assert.strictEqual(s.ghosts[0].style.left, '120px');
  assert.strictEqual(s.ghosts[0].removed, true);
});

test('a wrong drop never moves the child forward', (t) => {
  const s = setup(t);
  s.fire('pointerdown', 0);
  s.fire('pointermove', 50);
  s.fire('pointerup', 50); // beside the target: the floor
  assert.strictEqual(s.drops.length, 0);
  assert.strictEqual(s.ghosts[0].removed, true);
});

test('a plain tap makes no ghost and no drop, so the tap stays the click', (t) => {
  const s = setup(t);
  s.fire('pointerdown', 100);
  s.fire('pointermove', 100 + jam.DRAG_MIN - 1);
  s.fire('pointerup', 100 + jam.DRAG_MIN - 1);
  assert.strictEqual(s.ghosts.length, 0);
  assert.strictEqual(s.drops.length, 0);
  assert.strictEqual(s.kit.dragged(s.btn), false);
});

test('after a drag the trailing click is swallowed exactly once (one gesture, one action)', (t) => {
  const s = setup(t);
  s.fire('pointerdown', 0);
  s.fire('pointermove', 120);
  s.fire('pointerup', 120);
  assert.strictEqual(s.kit.dragged(s.btn), true);
  assert.strictEqual(s.kit.dragged(s.btn), false, 'the next real tap is a click again');
  assert.strictEqual(s.drops.length, 1);
});

test('pointercancel drops nothing', (t) => {
  const s = setup(t);
  s.fire('pointerdown', 0);
  s.fire('pointermove', 120);
  s.fire('pointercancel', 120);
  assert.strictEqual(s.drops.length, 0);
  assert.strictEqual(s.ghosts[0].removed, true);
});

test('a disabled source or enabled() false starts no drag', (t) => {
  const a = setup(t);
  a.btn.disabled = true;
  a.fire('pointerdown', 0); a.fire('pointermove', 120); a.fire('pointerup', 120);
  assert.strictEqual(a.ghosts.length + a.drops.length, 0);
  const b = setup(t, { enabled: () => false });
  b.fire('pointerdown', 0); b.fire('pointermove', 120); b.fire('pointerup', 120);
  assert.strictEqual(b.ghosts.length + b.drops.length, 0);
  assert.strictEqual(b.kit.dragged(b.btn), false);
});

test('a second finger cannot steal or orphan the drag', (t) => {
  const s = setup(t);
  s.fire('pointerdown', 0, s.btn, 1);
  s.fire('pointermove', 120, s.btn, 1);
  assert.strictEqual(s.ghosts.length, 1);
  s.fire('pointerdown', 0, s.btn, 2);
  s.fire('pointermove', 120, s.btn, 2);
  s.fire('pointerup', 120, s.btn, 2);
  assert.strictEqual(s.ghosts.length, 1, 'the second finger creates no ghost');
  assert.notStrictEqual(s.ghosts[0].removed, true, 'the first ghost is not removed');
  assert.strictEqual(s.drops.length, 0);
  s.fire('pointermove', 120, s.btn, 1);
  s.fire('pointerup', 120, s.btn, 1);
  assert.deepStrictEqual(s.drops, [s.target]);
  assert.strictEqual(s.ghosts[0].removed, true);
});

test('cancel() mid-drag removes the ghost; later move/up create nothing and dragged() is false', (t) => {
  const s = setup(t);
  s.fire('pointerdown', 0, s.btn, 1);
  s.fire('pointermove', 120, s.btn, 1);
  assert.strictEqual(s.ghosts.length, 1);
  s.kit.cancel();
  s.kit.cancel();
  assert.strictEqual(s.ghosts[0].removed, true);
  s.fire('pointermove', 120, s.btn, 1);
  s.fire('pointerup', 120, s.btn, 1);
  assert.strictEqual(s.ghosts.length, 1, 'no new ghost after cancel');
  assert.strictEqual(s.drops.length, 0);
  assert.strictEqual(s.kit.dragged(s.btn), false);
});

test('dragToTarget never writes an answer: it only hands the target to onDrop', (t) => {
  const s = setup(t);
  s.fire('pointerdown', 0); s.fire('pointermove', 120); s.fire('pointerup', 120);
  assert.strictEqual(s.drops[0], s.target);
  [s.target, s.btn, s.host, s.doc, s.doc.body].forEach((x) => assert.ok(!('value' in x)));
});
