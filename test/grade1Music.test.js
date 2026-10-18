const test = require('node:test');
const assert = require('node:assert/strict');
const g1 = require('../src/lib/grade1Music');

test('countBeats generates skip counting beats with accented multiples', () => {
  const byTwo = g1.countBeats(0, 2, 8);
  assert.equal(byTwo.length, 5);
  assert.deepEqual(byTwo.map((b) => b.value), [0, 2, 4, 6, 8]);
  assert.equal(byTwo[0].accented, false);
  assert.equal(byTwo[1].accented, true);
  assert.equal(byTwo[2].accented, true);

  const byFive = g1.countBeats(5, 5, 20);
  assert.deepEqual(byFive.map((b) => b.value), [5, 10, 15, 20]);
  assert.ok(byFive.every((b) => b.accented));

  assert.equal(g1.predictNextAccented(15, 5), 20);
  assert.equal(g1.predictNextAccented(8, 2), 10);
  assert.equal(g1.predictNextAccented(30, 10), 40);
});

test('scaleStepFreq and numberLineScaleJump implement scale steps where 10 steps is an octave', () => {
  const base = 220;
  const line = require('../src/lib/numberLine');
  assert.equal(line.scaleStepFreq(base, 10), 440);
  assert.equal(line.scaleStepFreq(base, -10), 110);
  assert.equal(line.scaleStepFreq(base, 0), 220);

  const jump10 = g1.numberLineScaleJump(5, 15, base);
  assert.equal(jump10.jump, 10);
  assert.equal(jump10.frequency, 440);
  assert.equal(jump10.isOctave, true);

  const jump1 = g1.numberLineScaleJump(3, 4, base);
  assert.equal(jump1.jump, 1);
  assert.equal(jump1.isOctave, false);
  assert.equal(jump1.frequency, Math.round(base * Math.pow(2, 1 / 10) * 100) / 100);
});

test('chart100Sound encodes tens as low frequency tone and ones as clicks with Hebrew label', () => {
  const n7 = g1.chart100Sound(7, 110);
  assert.equal(n7.tens, 0);
  assert.equal(n7.ones, 7);
  assert.equal(n7.tensFreq, null);
  assert.equal(n7.clickCount, 7);
  assert.equal(n7.label, '7 יחידות');

  const n30 = g1.chart100Sound(30, 110);
  assert.equal(n30.tens, 3);
  assert.equal(n30.ones, 0);
  assert.equal(n30.tensFreq, 143);
  assert.equal(n30.clickCount, 0);
  assert.equal(n30.label, '3 עשרות');

  const n42 = g1.chart100Sound(42, 110);
  assert.equal(n42.tens, 4);
  assert.equal(n42.ones, 2);
  assert.equal(n42.tensFreq, 154);
  assert.equal(n42.clickCount, 2);
  assert.equal(n42.label, '4 עשרות ו־2 יחידות');

  // Hebrew, not placeholders: no label or narration may carry a bare '?'.
  assert.equal(g1.chart100Sound(18, 110).label, 'עשרת אחת ו־8 יחידות');
  assert.equal(g1.chart100Sound(21, 110).label, '2 עשרות ויחידה אחת');

  const n100 = g1.chart100Sound(100, 110);
  assert.equal(n100.tens, 10);
  assert.equal(n100.ones, 0);
  assert.equal(n100.tensFreq, 220);
});

test('melodyPattern and createPatternChallenge produce repeating AB, AAB and ABC patterns with shapes and notes', () => {
  const ab = g1.melodyPattern('AB', 4);
  assert.equal(ab.length, 4);
  assert.deepEqual(ab.map((p) => p.name), ['עיגול', 'משולש', 'עיגול', 'משולש']);
  assert.deepEqual(ab.map((p) => p.note), ['דו', 'מי', 'דו', 'מי']);

  const aab = g1.melodyPattern('AAB', 6);
  assert.equal(aab.length, 6);
  assert.deepEqual(aab.map((p) => p.id), ['A', 'A', 'B', 'A', 'A', 'B']);

  const abc = g1.melodyPattern('ABC', 6);
  assert.equal(abc.length, 6);
  assert.deepEqual(abc.map((p) => p.name), ['עיגול', 'משולש', 'ריבוע', 'עיגול', 'משולש', 'ריבוע']);

  const challenge = g1.createPatternChallenge('AB', 5);
  assert.equal(challenge.sequence.length, 4);
  assert.equal(challenge.expected.name, 'עיגול');
  assert.ok(challenge.choices.some((c) => c.name === challenge.expected.name));
});

// The module shipped with every Hebrew string mangled into '?' bytes. Colour
// alone may not carry the shape either (§4.7), so each shape needs a name.
test('every shape and narration is real Hebrew, never a mojibake placeholder', () => {
  const hebrew = /[֐-׿]/;
  Object.keys(g1.PATTERN_SHAPES).forEach((key) => {
    const shape = g1.PATTERN_SHAPES[key];
    assert.match(shape.name, hebrew, `shape ${key} name`);
    assert.match(shape.note, hebrew, `shape ${key} note`);
    assert.doesNotMatch(shape.name, /\?/);
    assert.doesNotMatch(shape.icon, /\?/);
  });
  const names = Object.keys(g1.PATTERN_SHAPES).map((k) => g1.PATTERN_SHAPES[k].name);
  assert.equal(new Set(names).size, names.length, 'shape names must be distinguishable');

  const texts = [
    g1.chart100Sound(34, 110).speech,
    g1.metronomeNarration(0, 5, 4),
    g1.scaleJumpNarration(5, 15, 220),
    g1.patternNarration('AAB', 6),
  ];
  texts.forEach((t) => {
    assert.match(t, hebrew);
    // A '?' is only ever the question mark that ends a prompt; mojibake put
    // them mid-string and in runs.
    assert.doesNotMatch(t, /\?(?!$)/, t);
  });
});

test('metronomeBeats ticks every beat and accents each n-th one', () => {
  const track = g1.metronomeBeats(0, 5, 3);
  assert.deepEqual(track.accented, [5, 10, 15]);
  // Every integer beat is present, not only the accented rungs.
  assert.deepEqual(track.beats.map((b) => b.value), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
  assert.equal(track.beats.filter((b) => b.accented).length, 3);
  assert.equal(track.next, 20);

  assert.deepEqual(g1.metronomeBeats(0, 2, 4).accented, [2, 4, 6, 8]);
  assert.deepEqual(g1.metronomeBeats(0, 10, 3).accented, [10, 20, 30]);
  assert.equal(g1.metronomeBeats(0, 0, 3), null);
  assert.equal(g1.metronomeBeats(0, 5, 99), null);

  // The narration must not hand over the number the child has to predict.
  const says = g1.metronomeNarration(0, 5, 3);
  assert.doesNotMatch(says, /20/);
});

test('sound events stay inside the engine hearing-safe band and never precede the prompt', () => {
  const engine = require('../src/lib/musicEngine');

  const all = [].concat(
    g1.metronomeEvents(0, 2, 4, 96),
    g1.chart100Events(47, 110, 96),
    g1.scaleJumpEvents(5, 15, 220, 96),
    g1.patternEvents('ABC', 6, 96)
  );
  assert.ok(all.length > 0);
  all.forEach((e) => {
    assert.ok(e.hz >= engine.HZ_MIN && e.hz <= engine.HZ_MAX, `hz out of band: ${e.hz}`);
    assert.ok(e.gain > 0 && e.gain <= engine.MAX_GAIN);
    assert.ok(e.at >= 0 && e.dur > 0);
  });

  // An octave jump sounds the tick it left from, then the tick it landed on.
  const octave = g1.scaleJumpEvents(0, 10, 220, 96);
  assert.equal(octave.length, 2);
  assert.equal(octave[1].hz, 440);
  assert.equal(g1.scaleJumpEvents(2, 3, 220, 96).length, 1);

  // Playing the expected shape would give the answer away.
  const challenge = g1.createPatternChallenge('AB', 5);
  assert.equal(g1.patternEvents('AB', 5, 96).length, challenge.sequence.length);

  // No AudioContext in Node, so nothing sounds during a test run.
  assert.equal(g1.playEvents(all), null);
  assert.equal(g1.playEvents([]), null);
});

test('the number line scale is delegated to numberLine.js, not forked', () => {
  const line = require('../src/lib/numberLine');
  assert.deepEqual(g1.numberLineScaleJump(4, 14, 220), line.scaleJumpSound(4, 14, 220));

  // In the browser every module Object.assigns onto the same globalThis, so
  // a name exported by both would overwrite the original — and grade1Music's
  // delegation would then recurse into itself. Node's require() hides that,
  // so the overlap is asserted here instead.
  const shared = Object.keys(g1).filter((k) => Object.keys(line).indexOf(k) !== -1);
  assert.deepEqual(shared, [], `grade1Music shadows numberLine exports: ${shared}`);

  // A jump of 100 steps would ask for ~220 kHz; it is clamped instead.
  const engine = require('../src/lib/musicEngine');
  assert.equal(line.scaleStepFreq(220, 100), engine.HZ_MAX);
  assert.equal(line.scaleStepFreq(220, -100), engine.HZ_MIN);

  // jumpOnLine is pure arithmetic — it must not emit sound by itself.
  assert.doesNotMatch(String(line.jumpOnLine), /playJumpSound/);
});

const banks = require('../src/lib/banks');

test('each of the four כיתה א׳ music activities ships at least 12 tagged, hinted items', () => {
  const g1Items = banks.itemsForGrade('א');
  const beats = g1Items.filter(it => it.prompt.includes('מקצב'));
  const chart = g1Items.filter(it => it.standard === banks.ST.CHART100);
  const patterns = g1Items.filter(it => it.standard === banks.ST.PATTERN);
  const scale = g1Items.filter(it =>
    it.skill === 'number_line' && /סולם|אוקטבה|צלילים|צעדים/.test(it.prompt));

  [['beats', beats], ['chart100', chart], ['patterns', patterns], ['scale', scale]]
    .forEach(([name, items]) => {
      assert.ok(items.length >= 12, `${name}: ${items.length} items, need 12`);
      items.forEach((it) => {
        assert.ok(it.hint && String(it.hint).trim(), `${name} item without a hint: ${it.prompt}`);
        assert.equal(it.grade, 'א');
        assert.ok(it.strand && String(it.strand).trim());
        assert.ok(it.standard && String(it.standard).trim());
      });
      // A ladder, not a flat pile: every activity reaches level 3.
      assert.deepEqual(
        [1, 2, 3].filter(l => items.some(it => it.level === l)), [1, 2, 3], `${name} levels`);
    });
});

test('the כיתה א׳ mastery path is consistent with mastery.js — nothing here is gated', () => {
  const mastery = require('../src/lib/mastery');
  const g1Items = banks.itemsForGrade('א');

  // mastery.js gates on `table` (the 3/6/7/8/9 multiplication gate). No
  // כיתה א׳ item carries one, so none of them may ever be withheld.
  g1Items.forEach((it) => {
    assert.equal(mastery.itemTable(it), null, `grade א item tagged table: ${it.prompt}`);
    assert.equal(mastery.isBlockedItem(it), false);
  });

  // With an empty history — a child on their first session — the whole
  // כיתה א׳ bank is still reachable.
  assert.equal(mastery.gateItems(g1Items, [], g1Items).length, g1Items.length);
});

function makeEl(tag) {
  return {
    tag: tag, className: '', textContent: '', innerHTML: '',
    children: [], attrs: {}, clicks: [],
    appendChild(c) { this.children.push(c); return c; },
    insertBefore(c) { this.children.unshift(c); return c; },
    setAttribute(k, v) { this.attrs[k] = v; },
    addEventListener(ev, fn) { if (ev === 'click') this.clicks.push(fn); },
    querySelector(sel) { return findEl(this, sel.replace('.', '')); },
  };
}

function findEl(root, cls) {
  for (const c of root.children) {
    if (String(c.className).split(' ').indexOf(cls) !== -1) return c;
    const deep = findEl(c, cls);
    if (deep) return deep;
  }
  return null;
}

test('bindGrade1 renders play button, visible note and screen-reader narration for all four kinds', (t) => {
  global.document = { createElement: makeEl };
  t.after(() => { delete global.document; });

  const specs = [
    { kind: 'beats', from: 0, step: 5, accents: 3 },
    { kind: 'scale', from: 0, to: 10, baseFreq: 220 },
    { kind: 'chart100', number: 34 },
    { kind: 'pattern', type: 'ABC', length: 6 },
  ];

  specs.forEach((spec) => {
    const host = makeEl('div');
    assert.equal(g1.bindGrade1(host, spec), true, `bindGrade1 failed for ${spec.kind}`);
    const box = host.children[0];
    const play = findEl(box, 'g3-play');
    assert.equal(play.tag, 'button');
    assert.match(play.textContent, /^▶ השמע שוב/);
    assert.equal(play.clicks.length, 1);
    play.clicks.forEach((fn) => fn());

    const note = box.querySelector('.g3-note');
    assert.ok(note && note.textContent.length > 0);
    assert.equal(note.attrs['aria-hidden'], 'true');

    const sr = box.children[0];
    assert.equal(sr.className, 'sr-only');
    assert.equal(sr.textContent, note.textContent);
  });

  assert.equal(g1.bindGrade1(makeEl('div'), { kind: 'unknown' }), false);
  assert.equal(g1.bindGrade1(makeEl('div'), { kind: 'beats', from: 0, step: 0, accents: 3 }), false);
  assert.equal(g1.bindGrade1(makeEl('div'), { kind: 'chart100', number: 0 }), false);
  assert.equal(g1.bindGrade1(null, { kind: 'beats', from: 0, step: 2, accents: 3 }), false);
});

