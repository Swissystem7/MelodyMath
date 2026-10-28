// MelodyMath — NoteLengthLine (#591): fraction size on the number line through
// note length. The fillBar bar is the 0–1 segment of the line; the card is in
// the music games tab and ends with a no-music check (#665).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const NLL = require('../src/lib/noteLengthLine.js');
const S = require('../src/components/NoteLengthLineScreen.js');
const banks = require('../src/lib/banks.js');
const g4 = require('../src/lib/curriculum/grade4.js');
const g5 = require('../src/lib/curriculum/grade5.js');

test('position -> fraction -> exact duration for every denominator (2,3,4,5,6,8,10,100)', () => {
  assert.deepEqual(NLL.DENOMINATORS, [2, 3, 4, 5, 6, 8, 10, 100]);
  NLL.DENOMINATORS.forEach((d) => {
    [1, 3].forEach((max) => {
      for (let n = 1; n < d * max; n += Math.max(1, Math.floor(d / 4))) {
        const f = n / d, x = NLL.valueToPosition(n + '/' + d, max);
        assert.equal(NLL.positionToValue(x, max), (x * max), d + ' ' + n);
        const back = NLL.fractionAt(x, max, d);
        assert.equal(NLL.value(back), f, n + '/' + d + ' on 0-' + max);
        assert.equal(NLL.durationOf(back), (n * NLL.BAR_SECONDS) / d, 'not rounded: ' + n + '/' + d);
      }
    });
  });
  assert.equal(NLL.durationOf('3/4'), 1.5);
  assert.equal(NLL.durationOf('1/3'), 2 / 3);
  assert.equal(NLL.durationOf('0.45'), 0.9);
  assert.equal(NLL.durationOf('3.55'), 7.1, 'no rounding (#805)');
  assert.equal(NLL.durationOf(0.6173), 0.6173 * 2, 'a raw drag point keeps every digit');
});

test('the note plays for the exact length and pitch never carries size', () => {
  const plan = NLL.playPlan(['1/3', '7/3', 0.42], 'pluck');
  assert.deepEqual(plan.map((n) => n.dur), [2 / 3, 14 / 3, 0.84]);
  assert.ok(plan.every((n) => n.held && n.hz === NLL.HZ && n.voice === 'pluck'));
  for (let i = 1; i < plan.length; i++) assert.ok(plan[i].at >= plan[i - 1].at + plan[i - 1].dur, 'no note is cut by the next');
});

test('two instrument families: ukulele holds the note, darbuka counts the beats (child review)', () => {
  const band = NLL.ensemble('ukulele'), plan = NLL.withBeat(NLL.playPlan(['3/4'], band.primary.voice), band.beat.voice);
  assert.deepEqual([band.primary.id, band.beat.id], ['ukulele', 'darbuka']);
  assert.notEqual(band.primary.family, band.beat.family, 'a second, different family');
  const held = plan.filter((n) => n.held), beats = plan.filter((n) => n.kind === 'beat');
  assert.ok(held.length === 1 && held[0].voice === band.primary.voice && held[0].hz === NLL.HZ);
  assert.deepEqual(beats.map((n) => n.at), [0, 0.5, 1], '3 pitchless darbuka beats under 3/4 of the bar');
  assert.ok(beats.every((n) => n.voice === band.beat.voice && n.hz === undefined));
});

test('the child\'s own instrument (the one picker) holds the note; the beat is another family (regression of a6f55a6)', () => {
  const INST = require('../src/lib/instruments.js');
  const MINE = require('../src/lib/myInstrument.js');
  const mem = { d: {}, getItem(k) { return k in this.d ? this.d[k] : null; }, setItem(k, v) { this.d[k] = String(v); }, removeItem(k) { delete this.d[k]; } };
  assert.equal(MINE.setMyInstrument('darbuka', mem), true);
  const chosen = MINE.instrumentFor('ukulele', null, mem);
  assert.equal(chosen, 'darbuka');
  const check = (id, primaryId, beatId) => {
    const band = NLL.ensemble(id);
    assert.deepEqual([band.primary.id, band.beat.id], [primaryId, beatId], String(id));
    assert.equal(band.primary.voice, INST.instrumentById(primaryId).voice);
    assert.notEqual(band.primary.family, band.beat.family, 'two different families for ' + id);
  };
  check(chosen, 'darbuka', 'ukulele');
  check('ukulele', 'ukulele', 'darbuka');
  const wind = INST.byFamily('winds')[0].id;
  check(wind, wind, 'darbuka');
  check(null, 'ukulele', 'darbuka');
  check('nope', 'ukulele', 'darbuka');
  const src = fs.readFileSync(require.resolve('../src/components/NoteLengthLineScreen.js'), 'utf8');
  assert.match(src, /MINE\.instrumentFor\(/, 'the screen reads the existing picker');
  assert.match(src, /MINE\.EVENT/, 'and redraws when the child switches instrument');
});

test('magnitudeError and distance feedback (close / near / far)', () => {
  assert.equal(NLL.magnitudeError(0.75, '3/4', 1), 0);
  assert.ok(Math.abs(NLL.magnitudeError(0.5, '3/4', 1) - 0.25) < 1e-12);
  assert.ok(Math.abs(NLL.magnitudeError(2, '3/2', 2) - 0.25) < 1e-12, 'scaled by the line length');
  assert.equal(NLL.feedback(0.74, '3/4', 1).level, 'close');
  assert.match(NLL.feedback(0.65, '3/4', 1).he, /קצר מדי/);
  assert.equal(NLL.feedback(0.86, '3/4', 1).level, 'near');
  assert.equal(NLL.feedback(0.2, '3/4', 1).level, 'far');
  const mem = { d: {}, getItem(k) { return this.d[k] || null; }, setItem(k, v) { this.d[k] = v; } };
  assert.equal(NLL.meanError('kid', mem), null);
  NLL.recordError(0.3, 'kid', mem);
  assert.ok(Math.abs(NLL.recordError(0.1, 'kid', mem) - 0.2) < 1e-12);
  assert.ok(Math.abs(NLL.meanError('kid', mem) - 0.2) < 1e-12);
  assert.equal(NLL.meanError('other', mem), null, 'kept per child');
});

test('compare mode: order on the line; 0.75 and 3/4 share one point', () => {
  assert.equal(NLL.orderRight([0.66, 0.6], ['2/3', '3/5'], 1), true);
  assert.equal(NLL.orderRight([0.5, 0.7], ['2/3', '3/5'], 1), false);
  assert.equal(NLL.orderRight([0.75, 0.76], ['0.75', '3/4'], 1), true);
  assert.ok(NLL.ITEMS.some((it) => it.kind === 'compare' && it.values.includes('0.75') && it.values.includes('3/4')));
  assert.ok(NLL.ITEMS.some((it) => it.max === 2) && NLL.ITEMS.some((it) => it.max === 3), 'mixed-number lines 0-2 and 0-3');
});

test('the line and the bar are one object: the point is the share of the bar that plays', () => {
  let st = S.createState(0, true);
  st = S.place(st, 0.6);
  const html = S.renderHtml(st, 'יוקלילי');
  assert.match(html, /class="nll-fill"[^>]*width:60%/);
  assert.match(html, /data-mark="0"[^>]*left:60%/);
  const plan = S.placedPlan(st, 'pluck');
  assert.deepEqual(plan.map((n) => n.dur), [0.6 * NLL.BAR_SECONDS, 1.5], 'chosen length, then the true 3/4');
  assert.equal(st.status, 'done');
  let c = S.createState(NLL.ITEMS.findIndex((it) => it.kind === 'compare'), true);
  c = S.place(c, 0.66);
  assert.equal(c.status, 'open');
  c = S.place(S.createState(c.index, true), 0.5);
  c = S.place(c, 0.7);
  assert.match(c.message, /הסדר הפוך/);
});

test('music on/off, and the no-music check comes last with no sound buttons', () => {
  assert.match(S.renderHtml(S.createState(0, true), ''), /data-act="play"/);
  assert.match(S.renderHtml(S.createState(0, false), ''), /data-line/, 'solvable without music');
  assert.doesNotMatch(S.renderHtml(S.createState(0, false), ''), /data-act="play"/);
  const plain = S.createState(NLL.ITEMS.length, true);
  const ph = S.renderHtml(plain, '');
  assert.match(ph, /בדיקה בלי מוזיקה/);
  assert.doesNotMatch(ph, /data-tap|data-act="play"|data-line/);
  const answers = {};
  NLL.NO_MUSIC_CHECK_ITEMS.forEach((it) => { answers[it.id] = it.answer; });
  assert.match(S.checkPlain(plain, answers).message, /^3 מתוך 3/);
  assert.ok(!/lock|locked|נעול/.test(fs.readFileSync(require.resolve('../src/components/NoteLengthLineScreen.js'), 'utf8')), 'no locks (#717)');
});

test('fillBar stays MAIN in every fraction table that had it; no pitch for size', () => {
  assert.equal(NLL.WAY, 'fillBar');
  const had = { FRAC_BAR: g4, FRAC_OF_QTY: g4, FRAC_NAMES: g4, FRAC_ADD_D: g4, FRAC_MIXED_D: g4, FRAC_EQUIV: g5, FRAC_ADD: g5, FRAC_OF: g5, FRAC_MIXED: g5 };
  Object.keys(had).forEach((k) => assert.ok(banks.primaryWays(had[k].music[k]).some((w) => w[0] === 'fillBar'), k));
  const src = fs.readFileSync(require.resolve('../src/lib/noteLengthLine.js'), 'utf8');
  assert.doesNotMatch(src, /hzFor|pitchFor|valueToHz/);
});

test('NoteLengthLine is reachable: card in the music games tab, scripts after fillBar, precache', () => {
  const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
  assert.match(html, /id="musicGames"[\s\S]*id="fbpCard"[\s\S]*id="nllCard"[\s\S]*#591 music games end/);
  assert.match(html, /jamKit\.js[\s\S]*fractionBar\.js[\s\S]*noteLengthLine\.js"><\/script><script src="src\/components\/NoteLengthLineScreen\.js/);
  assert.equal((html.match(/id="nllCard"/g) || []).length, 1);
  assert.equal((html.match(/NoteLengthLineScreen\.js/g) || []).length, 1);
  assert.equal((html.match(/id="myInstCard"/g) || []).length, 1, 'one instrument picker');
  const sw = fs.readFileSync(require.resolve('../sw.js'), 'utf8');
  ['noteLengthLine.js', 'NoteLengthLineScreen.js'].forEach((f) => assert.ok(sw.includes(f), f));
});

test('mounted: a wrong answer stays on the item, play stops prior sound, works with music off / no AudioContext', () => {
  const JAM = require('../src/components/jamKit.js'), MINE = require('../src/lib/myInstrument.js');
  const on = {}, el = { innerHTML: '', addEventListener(t, f) { on[t] = f; }, querySelectorAll: () => [] };
  const real = JAM.playNotes, calls = []; // real playNotes: Node has no AudioContext (audio unavailable)
  JAM.playNotes = (notes) => { const h = real(notes); calls.push({ notes, h }); return h; };
  const click = (act) => on.click({ target: { closest: () => ({ getAttribute: () => act }) } });
  const drag = (v) => on.change({ target: { hasAttribute: (a) => a === 'data-line', value: String(v) } });
  try {
    const ui = S.mount(el), band = NLL.ensemble(MINE.instrumentFor('ukulele'));
    drag(200); // 0.2 for 3/4: far
    assert.equal(ui.state.index, 0, 'a wrong answer does not advance');
    assert.equal(ui.state.feedback[0].level, 'far');
    assert.ok(calls[0].notes.some((n) => n.held && n.voice === band.primary.voice), 'chosen instrument is the main voice');
    assert.ok(calls[0].notes.some((n) => n.kind === 'beat' && n.voice === band.beat.voice), 'second family beats');
    click('play'); click('play');
    assert.equal(calls.length, 3);
    assert.ok(calls[0].h.stopped && calls[1].h.stopped && !calls[2].h.stopped, 'no overlapping sounds');
    click('music');
    assert.ok(calls[2].h.stopped && ui.state.showMusic === false);
    click('play'); click('next'); drag(500);
    assert.equal(calls.length, 3, 'silent with music off');
    assert.equal(ui.state.index, 1);
    assert.equal(ui.state.feedback[0].level, 'close', 'still solvable without sound');
    assert.doesNotMatch(el.innerHTML, /data-act="play"/);
  } finally { JAM.playNotes = real; JAM.saveShowMusic('noteLengthLine', true); }
});

test('no number above 12: line ends, fraction parts, and beats per note', () => {
  NLL.ITEMS.forEach((it) => {
    assert.ok(it.max <= 12);
    it.values.forEach((v) => {
      String(v).split('/').forEach((p) => assert.ok(v.includes('.') || Number(p) <= 12, v));
      assert.ok(NLL.withBeat(NLL.playPlan([v], 'a'), 'b').filter((n) => n.kind === 'beat').length <= 12, v);
    });
  });
});
