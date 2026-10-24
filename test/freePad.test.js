// #591 goal A.3: the instruments of every exercise can be played freely
// before answering, with several fingers at once.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const M = require('../src/lib/musicEngine');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('each strong way gets its own timbre; weak or unmapped ways get the neutral xylophone', () => {
  assert.ok(M.padFor('M1').keys.every((k) => k.voice === 'bell'), 'steady beat: handbells');
  assert.ok(M.padFor('M2').keys.some((k) => k.voice === 'kick'), 'accented groups: drums');
  assert.ok(M.padFor('M3').keys.some((k) => k.voice === 'hihat'), 'note lengths: drum and hi-hat');
  assert.ok(M.padFor('M6').keys.every((k) => k.voice === 'xylo'), 'patterns: xylophone bars');
  for (const weak of ['M4', 'M5', 'M7', 'M9', null, undefined]) {
    assert.deepEqual(M.padFor(weak).keys.map((k) => k.voice), ['xylo', 'xylo', 'xylo', 'xylo', 'xylo']);
  }
});

test('every key is a real tap voice, so it sounds through installTapFeedback', () => {
  for (const m of Object.keys(M.PAD_SETS).concat(['none'])) {
    for (const k of M.padFor(m).keys) {
      assert.ok(M.tapPlan(k.voice, k.step).length > 0, m + ' ' + k.voice);
    }
  }
});

test('extra voices are appended once, unknown ones are ignored', () => {
  const keys = M.padFor('M1', ['clap', 'bell', 'nope', 'clap']).keys;
  assert.equal(keys.filter((k) => k.voice === 'clap').length, 1);
  assert.equal(keys.filter((k) => k.voice === 'bell').length, 5, 'bell is already there');
  assert.ok(!keys.some((k) => k.voice === 'nope'));
  assert.ok(keys.find((k) => k.voice === 'clap').extra);
});

test('the strip is plain buttons with data-tap, data-step and a Hebrew name', () => {
  const out = M.padHtml(M.padFor('M6'));
  const keys = out.match(/<button [^>]*>/g);
  assert.equal(keys.length, 6);
  for (const b of keys) {
    assert.match(b, /type="button"/);
    assert.match(b, /data-tap="xylo"/);
    assert.match(b, /data-step="\d"/);
    assert.match(b, /aria-label="קסילופון [^"]+"/);
  }
  assert.match(M.padHtml(M.padFor('M2', ['bell'])), /class="mm-pad-key mm-pad-new" data-tap="bell"/);
});

function fakeDom() {
  function el(tag) {
    const cls = new Set();
    return {
      tag, attrs: {}, innerHTML: '', parentNode: null, nextSibling: null, nextElementSibling: null,
      set className(v) { cls.clear(); String(v).split(/\s+/).filter(Boolean).forEach((c) => cls.add(c)); },
      classList: {
        contains: (c) => cls.has(c), add: (c) => cls.add(c),
        toggle: (c, on) => { if (on) cls.add(c); else cls.delete(c); return on; },
      },
      setAttribute(k, v) { this.attrs[k] = String(v); },
    };
  }
  const parent = {
    kids: [],
    insertBefore(node, ref) {
      const i = ref ? this.kids.indexOf(ref) : this.kids.length;
      this.kids.splice(i < 0 ? this.kids.length : i, 0, node);
      node.parentNode = this;
      this.kids.forEach((k, j) => { k.nextSibling = this.kids[j + 1] || null; k.nextElementSibling = k.nextSibling; });
    },
  };
  const anchor = el('p');
  parent.insertBefore(anchor, null);
  return { document: { createElement: el }, parent, anchor };
}

test('mountFreePad puts one strip after the music-way line and hides it when sound is off', () => {
  const dom = fakeDom();
  global.document = dom.document;
  try {
    const box = M.mountFreePad(dom.anchor, { mechanism: 'M1' });
    assert.equal(dom.parent.kids.length, 2);
    assert.equal(dom.anchor.nextElementSibling, box);
    assert.equal(box.attrs.role, 'group');
    assert.match(box.attrs['aria-label'], /לפני שעונים/);
    assert.match(box.innerHTML, /data-tap="bell"/);
    assert.equal(box.classList.contains('hidden'), false);
    // The next exercise reuses the same strip.
    assert.equal(M.mountFreePad(dom.anchor, { mechanism: 'M6' }), box);
    assert.equal(dom.parent.kids.length, 2);
    assert.match(box.innerHTML, /data-tap="xylo"/);
    M.mountFreePad(dom.anchor, { mechanism: 'M6', quiet: true });
    assert.equal(box.classList.contains('hidden'), true);
    assert.equal(box.innerHTML, '');
    M.setMuted(true);
    M.mountFreePad(dom.anchor, { mechanism: 'M1' });
    assert.equal(box.classList.contains('hidden'), true, 'the mute switch hides it too');
    M.setMuted(false);
    assert.equal(M.mountFreePad(null, {}), null);
  } finally {
    delete global.document;
  }
});

test('index.html mounts the strip in every exercise screen and sizes it for thumbs', () => {
  assert.match(html, /function setMusicWay\(id,it\)\{[^\n]*show\(id,!!html\);if\(typeof mountFreePad==='function'\)mountFreePad\(el,\{mechanism:it&&typeof mechanismOf==='function'\?mechanismOf\(it\.music\):null,quiet:typeof prefsNow==='function'&&!!prefsNow\(\)\.quiet\}\)\}/, 'setMusicWay mounts the strip');
  for (const id of ['rmWay', 'rmPlanWay', 'classWay']) assert.match(html, new RegExp("setMusicWay\\('" + id + "'"));
  assert.match(html, /\.mm-pad-key\{min-width:48px;min-height:48px/);
  assert.match(html, /\.mm-pad\{display:flex;flex-wrap:wrap;align-items:center;gap:8px/);
});
