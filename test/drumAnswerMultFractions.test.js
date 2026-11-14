'use strict';
// MM-AUTO-753: הרחבת משטח התוף האינטראקטיבי לנגינת תשובה בכפל ושברים
const test = require('node:test');
const assert = require('node:assert/strict');

const M = require('../src/lib/musicEngine.js');
const U = require('../pilot/js/units.js');
const UX = require('../pilot/js/units-extra.js');
const Cov = require('../pilot/js/coverage.js');

test('configureDrumAnswer normalizes multiplication and fraction options safely', () => {
  const mult = M.configureDrumAnswer({ mode: 'mult', per: 4, groups: 3 });
  assert.equal(mult.mode, 'mult');
  assert.equal(mult.per, 4);
  assert.equal(mult.groups, 3);
  assert.equal(mult.remainder, 0);
  assert.equal(mult.target, 12);
  assert.equal(mult.voice, 'woodBar');

  const frac = M.configureDrumAnswer({ mode: 'fraction', per: 4, barBeats: 4, unit: 'half', beats: 2, hold: true });
  assert.equal(frac.mode, 'fraction');
  assert.equal(frac.barBeats, 4);
  assert.equal(frac.unit, 'half');
  assert.equal(frac.hold, true);
  assert.equal(frac.voice, 'organ');
  assert.equal(frac.target, 2);

  // Default fallback clamps and handles invalid inputs
  const def = M.configureDrumAnswer(null);
  assert.equal(def.per, 4);
  assert.equal(def.mode, 'beats');
  assert.equal(def.barBeats, 4);
});

test('createDrumAnswerPad manages rhythm groups for multiplication with accented downbeats', () => {
  const pad = M.createDrumAnswerPad({ mode: 'mult', per: 4, groups: 3, answer: 12 });
  assert.equal(pad.state.beats, 0);
  assert.equal(pad.state.groups, 0);

  // Beat 1: bar downbeat (accented with drum voice)
  const t1 = pad.tap(1);
  assert.equal(t1.beats, 1);
  assert.equal(t1.isBarStart, true);
  assert.equal(t1.isCompleteGroup, false);
  assert.ok(t1.notes.some((n) => n.voice === 'frameDrum' && n.role === 'drum'));

  // Beats 2, 3: inner beats (woodBar voice, no drum)
  const t2 = pad.tap(1);
  assert.equal(t2.isBarStart, false);
  const t3 = pad.tap(1);
  assert.equal(t3.isBarStart, false);

  // Beat 4: bar end, completes group 1
  const t4 = pad.tap(1);
  assert.equal(t4.beats, 4);
  assert.equal(t4.groups, 1);
  assert.equal(t4.isCompleteGroup, true);
  assert.ok(t4.notes.some((n) => n.role === 'groupEnd'));

  // Untap steps backwards
  pad.untap(1);
  assert.equal(pad.state.beats, 3);
  assert.equal(pad.state.groups, 0);
});

test('tapGroup advances by an entire equal-beat bar at once', () => {
  const pad = M.createDrumAnswerPad({ mode: 'mult', per: 5, groups: 4, answer: 20 });
  const g1 = pad.tapGroup();
  assert.equal(g1.beats, 5);
  assert.equal(g1.groups, 1);
  assert.equal(g1.isBarStart, true);
  assert.equal(g1.isCompleteGroup, true);

  pad.tapGroup();
  pad.tapGroup();
  pad.tapGroup();
  assert.equal(pad.state.beats, 20);
  assert.equal(pad.state.groups, 4);

  const evalRes = pad.evaluate();
  assert.equal(evalRes.correct, true);
  assert.match(evalRes.feedback, /20/);
});

test('createDrumAnswerPad supports holding note durations for fractions', () => {
  const pad = M.createDrumAnswerPad({ mode: 'fraction', per: 4, barBeats: 4, unit: 'half', answer: 2, hold: true });
  assert.equal(pad.spec.mode, 'fraction');

  // Hold a half note (2 beats out of 4)
  const h1 = pad.holdDuration(2, 800);
  assert.equal(h1.beats, 2);
  assert.deepEqual(h1.fraction, { n: 1, d: 2 });
  assert.ok(h1.notes.some((n) => n.voice === 'organ' && n.role === 'held'));
  assert.equal(pad.getState().fractionText, '1/2');

  // Holding another quarter note (1 beat) fills to 3 beats (3/4 of bar)
  const h2 = pad.holdDuration(1, 400);
  assert.equal(h2.beats, 3);
  assert.equal(pad.getState().fractionText, '3/4');
});

test('holdByMs quantizes hold times to standard musical note durations', () => {
  const pad = M.createDrumAnswerPad({ mode: 'fraction', per: 4, barBeats: 4, hold: true });

  // ~200ms -> eighth note (0.5 beat)
  const e1 = pad.holdByMs(200, 400);
  assert.equal(e1.beats, 0.5);

  // ~400ms -> quarter note (+1 beat = 1.5)
  const e2 = pad.holdByMs(420, 400);
  assert.equal(e2.beats, 1.5);

  // ~800ms -> half note (+2 beats = 3.5)
  const e3 = pad.holdByMs(820, 400);
  assert.equal(e3.beats, 3.5);

  // ~1600ms -> whole note (+4 beats = 7.5)
  const e4 = pad.holdByMs(1600, 400);
  assert.equal(e4.beats, 7.5);
});

test('renderDrumAnswerPad produces real-time visual feedback with bar groups and fraction ruler', () => {
  // Multiplication rendering
  const multHtml = M.renderDrumAnswerPad({ mode: 'mult', per: 4, groups: 3, answer: 12 }, { beats: 8 });
  assert.match(multHtml, /data-testid="tap-pad"/);
  assert.match(multHtml, /data-mode="mult"/);
  assert.match(multHtml, /data-count="8"/);
  assert.match(multHtml, /data-groups="2"/);
  assert.match(multHtml, /data-act="tap-group"/);
  assert.match(multHtml, /class="mm-tap__bar is-complete-group"/);
  assert.match(multHtml, /2 תיבות של 4 פעימות/);

  // Fraction rendering
  const fracHtml = M.renderDrumAnswerPad({ mode: 'fraction', per: 4, barBeats: 4, answer: 2, hold: true }, { beats: 2 });
  assert.match(fracHtml, /data-mode="fraction"/);
  assert.match(fracHtml, /class="mm-fraction-ruler"/);
  assert.match(fracHtml, /data-fraction="1\/2"/);
  assert.match(fracHtml, /data-act="hold-drum"/);
  assert.match(fracHtml, /משך בתיבה: 2 מתוך 4 פעימות/);
});

test('evaluateDrumAnswer validates multiplication rhythm answers with rich Hebrew feedback', () => {
  const spec = { mode: 'mult', per: 4, groups: 3, answer: 12 };

  // Correct product
  const right = M.evaluateDrumAnswer(spec, 12);
  assert.equal(right.correct, true);
  assert.equal(right.value, 12);
  assert.equal(right.target, 12);
  assert.match(right.feedback, /נכון מאוד/);
  assert.match(right.feedback, /3 תיבות של 4 פעימות/);

  // Too few beats
  const under = M.evaluateDrumAnswer(spec, 8);
  assert.equal(under.correct, false);
  assert.match(under.feedback, /עדיין חסרות פעימות/);
  assert.match(under.feedback, /2 מתוך 3/);

  // Too many beats
  const over = M.evaluateDrumAnswer(spec, 14);
  assert.equal(over.correct, false);
  assert.match(over.feedback, /יותר מדי פעימות/);
});

test('evaluateDrumAnswer validates fraction durations against bar parts with informative feedback', () => {
  const spec = { mode: 'fraction', per: 4, barBeats: 4, answer: 2, hold: true };

  const right = M.evaluateDrumAnswer(spec, 2);
  assert.equal(right.correct, true);
  assert.match(right.feedback, /מצוין/);
  assert.match(right.feedback, /2 פעימות/);

  const wrong = M.evaluateDrumAnswer(spec, 1);
  assert.equal(wrong.correct, false);
  assert.match(wrong.feedback, /אינו תואם/);
});

test('pilot multiplication units integrate with drum answer mechanism', () => {
  const timesUnit = Cov.unitById('times-1');
  const m5Unit = Cov.unitById('mult-5-strategy');
  const m9Unit = Cov.unitById('mult-9-strategy');

  assert.ok(timesUnit, 'times-1 exists');
  assert.ok(m5Unit, 'mult-5-strategy exists');
  assert.ok(m9Unit, 'mult-9-strategy exists');

  // times-1 questions with tap
  ['tm1', 'tm2', 'tm3', 'tm4', 'tm6'].forEach((id) => {
    const q = timesUnit.questions.find((x) => x.id === id);
    assert.ok(q && q.tap, id + ' has tap');
    assert.equal(q.tap.mode, 'mult', id + ' mode is mult');
    assert.ok(Number.isInteger(q.tap.per) && q.tap.per >= 2, id + ' per is valid');
    const ev = M.evaluateDrumAnswer(q, q.answer);
    assert.equal(ev.correct, true, id + ' correctly evaluated');
  });

  // mult-5 questions
  ['m5-1', 'm5-2', 'm5-3', 'm5-4'].forEach((id) => {
    const q = m5Unit.questions.find((x) => x.id === id);
    assert.ok(q && q.tap, id + ' has tap');
    assert.equal(q.tap.per, 5, id + ' per is 5');
    assert.equal(q.tap.mode, 'mult', id + ' mode is mult');
    const ev = M.evaluateDrumAnswer(q, q.answer);
    assert.equal(ev.correct, true, id + ' correctly evaluated');
  });

  // mult-9 m9-1 question
  const m9_1 = m9Unit.questions.find((x) => x.id === 'm9-1');
  assert.ok(m9_1 && m9_1.tap);
  assert.equal(m9_1.tap.per, 9);
  assert.equal(M.evaluateDrumAnswer(m9_1, 18).correct, true);
});

test('pilot fraction units integrate with drum answer mechanism', () => {
  const frac4 = Cov.unitById('frac-4');
  const fbi = Cov.unitById('fractions-bar-intro');

  assert.ok(frac4, 'frac-4 exists');
  assert.ok(fbi, 'fractions-bar-intro exists');

  ['fr2', 'fr3', 'fr5', 'fr6'].forEach((id) => {
    const q = frac4.questions.find((x) => x.id === id);
    assert.ok(q && q.tap, id + ' has tap');
    assert.equal(q.tap.mode, 'fraction');
    assert.equal(q.tap.hold, true);
    assert.equal(M.evaluateDrumAnswer(q, q.answer).correct, true, id + ' correct');
  });

  ['fbi-1', 'fbi-2', 'fbi-3', 'fbi-4'].forEach((id) => {
    const q = fbi.questions.find((x) => x.id === id);
    assert.ok(q && q.tap, id + ' has tap');
    assert.equal(q.tap.mode, 'fraction');
    assert.equal(q.tap.hold, true);
    assert.equal(M.evaluateDrumAnswer(q, q.answer).correct, true, id + ' correct');
  });
});

test('mountDrumAnswerPad wires live interaction, updates UI in real time, and fires onChange', () => {
  const buttons = {
    tap: { onclick: null },
    group: { onclick: null },
    untap: { onclick: null },
    hold: { onpointerdown: null, onpointerup: null },
  };

  function fakeElement(tag) {
    let content = '';
    const el = {
      tagName: tag.toUpperCase(),
      insertAdjacentHTML(pos, html) {
        content = (pos === 'afterbegin' ? (html + content) : (content + html));
      },
      querySelector(sel) {
        if (sel === '[data-act="tap"]') return buttons.tap;
        if (sel === '[data-act="tap-group"]') return buttons.group;
        if (sel === '[data-act="untap"]') return buttons.untap;
        if (sel === '[data-act="hold-drum"]') return buttons.hold;
        return null;
      },
      querySelectorAll() { return []; },
    };
    Object.defineProperty(el, 'innerHTML', {
      get() { return content; },
      set(v) { content = v; },
      configurable: true
    });
    Object.defineProperty(el, 'textContent', {
      get() { return content; },
      set(v) { content = v; },
      configurable: true
    });
    return el;
  }

  global.document = { createElement: fakeElement };
  try {
    const container = fakeElement('div');
    const changes = [];
    const mounted = M.mountDrumAnswerPad(container, { mode: 'mult', per: 4, groups: 3, answer: 12 }, {
      onChange: (info) => changes.push(info)
    });

    assert.ok(mounted);
    assert.match(container.innerHTML, /data-testid="tap-pad"/);
    assert.equal(changes.length, 1);
    assert.equal(changes[0].state.beats, 0);

    // Simulate clicking wired buttons
    buttons.tap.onclick();
    assert.equal(mounted.getState().beats, 1);

    buttons.group.onclick();
    assert.equal(mounted.getState().beats, 5);

    buttons.untap.onclick();
    assert.equal(mounted.getState().beats, 4);

    mounted.destroy();
    assert.equal(container.innerHTML, '');

    // Now test fraction hold button wiring
    const fracContainer = fakeElement('div');
    const mountedFrac = M.mountDrumAnswerPad(fracContainer, { mode: 'fraction', per: 4, barBeats: 4, hold: true, answer: 2 });
    assert.ok(mountedFrac);
    assert.ok(buttons.hold.onpointerdown && buttons.hold.onpointerup);
    buttons.hold.onpointerdown();
    buttons.hold.onpointerup();
    assert.ok(mountedFrac.getState().beats > 0);
    mountedFrac.destroy();
  } finally {
    delete global.document;
  }
});

test('drumAnswerTapPlan generates notes for fraction bar start, inner beats, and multiplication groups', () => {
  const fracNotesBarStart = M.drumAnswerTapPlan({ mode: 'fraction', barBeats: 4 }, { beats: 1 }, { isBarStart: true });
  assert.ok(fracNotesBarStart.some((n) => n.role === 'held'));
  assert.ok(fracNotesBarStart.some((n) => n.role === 'drum' && n.voice === 'frameDrum'));

  const fracNotesInner = M.drumAnswerTapPlan({ mode: 'fraction', barBeats: 4 }, { beats: 2 }, { isBarStart: false });
  assert.ok(fracNotesInner.some((n) => n.role === 'held'));
  assert.equal(fracNotesInner.some((n) => n.role === 'drum'), false);

  const fracBeat1AutoDrum = M.drumAnswerTapPlan({ mode: 'fraction', barBeats: 4 }, { beats: 1 });
  assert.ok(fracBeat1AutoDrum.some((n) => n.role === 'drum'));
});

test('createDrumAnswerPad handles numeric and object initial states and resets properly', () => {
  const padNum = M.createDrumAnswerPad({ per: 4 }, 6);
  assert.equal(padNum.state.beats, 6);
  assert.equal(padNum.state.groups, 1);

  const padObj = M.createDrumAnswerPad({ per: 4 }, { beats: 8, groups: 2, notes: ['c4'] });
  assert.equal(padObj.state.beats, 8);
  assert.equal(padObj.state.groups, 2);
  assert.deepEqual(padObj.state.notes, ['c4']);

  padObj.reset();
  assert.equal(padObj.state.beats, 0);
  assert.equal(padObj.state.groups, 0);
  assert.deepEqual(padObj.state.notes, []);
  assert.deepEqual(padObj.state.history, []);
});

test('evaluateDrumAnswer handles default beats mode correctly and with error feedback', () => {
  const ok = M.evaluateDrumAnswer({ mode: 'beats' }, 4, 4);
  assert.equal(ok.correct, true);
  assert.match(ok.feedback, /נכון! 4 פעימות\./);

  const wrong = M.evaluateDrumAnswer({ mode: 'beats' }, 3, 4);
  assert.equal(wrong.correct, false);
  assert.match(wrong.feedback, /ניגנתם 3 פעימות, התשובה היא 4\./);
});

test('playDrumAnswerSound routes audio for hold, accent, downbeat, group, and tap, respecting muted state', () => {
  // when unmuted:
  M.setMuted(false);
  M.playDrumAnswerSound('hold', { voice: 'organ', hz: 300 });
  M.playDrumAnswerSound('accent');
  M.playDrumAnswerSound('downbeat');
  M.playDrumAnswerSound('group');
  M.playDrumAnswerSound('tap', { voice: 'woodBar', step: 2 });

  // when muted:
  M.setMuted(true);
  const mutedRes = M.playDrumAnswerSound('tap');
  assert.equal(mutedRes, null);
  M.setMuted(false);
});
