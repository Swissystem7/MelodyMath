// MelodyMath — three enrichment explorers as exercise types (#688, Refs #665).
//
// #singingLine, mgGroupBtns/mgSizeBtns and eoNumBtns stay in the enrichment
// tab. Each also ships as a bank exercise: a question, an answer check, and
// the #680 retry — a miss replays that exercise, then one second try.
// A hit plays an animation and a scale. Card text is at most 15 words.
// No locks (#717).
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_EXPLORER_BANK = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const MAX_WORDS = 15;
  const SCALE = [262, 294, 330, 349, 392, 440, 494, 523];
  const FRACTIONS = { '1/4': 25, '1/2': 50, '3/4': 75 };
  const ANIM = {
    singingLine: { kind: 'glow_total', className: 'anim-math-glow', label: 'הדגשת הנקודה' },
    groupsSize: { kind: 'repeat_group', className: 'anim-math-repeat', label: 'קבוצות שוות' },
    evenOdd: { kind: 'bar_split', className: 'anim-math-split', label: 'זוגות' },
  };

  function cardWords(text) {
    const s = String(text == null ? '' : text).trim();
    return s ? s.split(/\s+/) : [];
  }

  function isCorrectFn(given, expected) {
    if (root && typeof root.isCorrect === 'function') return root.isCorrect(given, expected);
    return require('../adaptive').isCorrect(given, expected);
  }

  function answerOk(given, expected) {
    const g = String(given == null ? '' : given).trim().replace(/%$|٪$/, '');
    return isCorrectFn(g, expected);
  }

  function bellForPercent(pct) {
    const p = Number(pct) / 100;
    return {
      percent: pct,
      frequency: Math.round(130.81 * Math.pow(4, p) * 10) / 10,
    };
  }

  function expectedOf(item) {
    const e = item && item.explorer;
    if (!e) return undefined;
    if (e.type === 'singingLine') return e.percent;
    if (e.type === 'groupsSize') return e.groups * e.size;
    if (e.type === 'evenOdd') return e.n % 2 === 0 ? 'זוגי' : 'אי-זוגי';
    return undefined;
  }

  function checkAnswer(item, given) {
    const expected = expectedOf(item);
    if (expected == null) return false;
    return answerOk(given, expected);
  }

  function replayPlan(item) {
    const e = item && item.explorer;
    if (!e) return null;
    if (e.type === 'singingLine') {
      const bell = bellForPercent(e.percent);
      return { tool: 'singingLine', percent: e.percent, fraction: e.fraction, frequency: bell.frequency };
    }
    if (e.type === 'groupsSize') {
      const beats = [];
      for (let g = 0; g < e.groups; g++) {
        for (let s = 0; s < e.size; s++) beats.push(s === 0 ? 'kick' : 'snare');
      }
      return { tool: 'groupsSize', groups: e.groups, size: e.size, beats: beats };
    }
    if (e.type === 'evenOdd') {
      const events = [];
      let t = 0;
      const pairs = Math.floor(e.n / 2);
      for (let p = 0; p < pairs; p++) {
        events.push({ hz: 392, at: t });
        events.push({ hz: 440, at: t + 1 });
        t += 2.5;
      }
      if (e.n % 2) events.push({ hz: 880, at: t });
      return { tool: 'evenOdd', n: e.n, events: events };
    }
    return null;
  }

  function createState(item) {
    return { phase: 'ask', attempts: 0, item: item, secondTry: false, hasBuzzer: false, hasRedX: false, scoreLoss: false };
  }

  function submit(state, given) {
    const base = state || createState(null);
    const fresh = base.phase === 'correct' || base.phase === 'revealed';
    const attempts = (fresh ? 0 : base.attempts) + 1;
    const item = base.item;
    const shared = { item: item, attempts: attempts, hasBuzzer: false, hasRedX: false, scoreLoss: false, secondTry: false };
    if (checkAnswer(item, given)) {
      return Object.assign({}, base, shared, {
        phase: 'correct', tone: 'good', message: 'בדיוק!',
        animation: item && item.explorer ? ANIM[item.explorer.type] : null,
        scale: SCALE.slice(), replay: null,
      });
    }
    if (attempts <= 1) {
      return Object.assign({}, base, shared, {
        phase: 'hint_replay', tone: 'soft', message: 'כמעט! שומעים שוב.',
        replay: replayPlan(item), secondTry: true, animation: null, scale: null,
      });
    }
    const ans = expectedOf(item);
    return Object.assign({}, base, shared, {
      phase: 'revealed', tone: 'neutral', message: 'התשובה: ' + ans,
      replay: null, animation: null, scale: null,
    });
  }

  function startRetry(state) {
    if (!state || state.phase !== 'hint_replay') return state;
    return Object.assign({}, state, { phase: 'retry', secondTry: false, replay: null, message: 'נסו שוב.' });
  }

  function playScale(notes, schedule) {
    const play = root && root.playFreq;
    if (typeof play !== 'function' || !notes) return false;
    const at = schedule || function (fn, ms) { setTimeout(fn, ms); };
    notes.forEach(function (hz, i) { at(function () { play(hz, 160); }, i * 180); });
    return true;
  }

  function playReplay(plan, schedule) {
    if (!plan || !root) return false;
    const at = schedule || function (fn, ms) { setTimeout(fn, ms); };
    if (plan.tool === 'singingLine' && typeof root.updateSingingLine === 'function') {
      root.updateSingingLine(plan.percent, true);
      return true;
    }
    if (plan.tool === 'singingLine' && typeof root.playFreq === 'function') {
      root.playFreq(plan.frequency, 280);
      return true;
    }
    if (plan.tool === 'groupsSize' && typeof root.playDrumSound === 'function') {
      plan.beats.forEach(function (sound, i) { at(function () { root.playDrumSound(sound); }, i * 200); });
      return true;
    }
    if (plan.tool === 'evenOdd' && typeof root.playFreq === 'function') {
      plan.events.forEach(function (ev) { at(function () { root.playFreq(ev.hz, ev.hz === 880 ? 400 : 140); }, ev.at * 200); });
      return true;
    }
    return false;
  }

  function singingSpec(fraction) {
    const percent = FRACTIONS[fraction];
    if (percent == null) return null;
    return {
      type: 'singingLine', grade: 'א', skill: 'number_line', standard: 'NLINE', level: 1,
      topicId: 'mm-cur-2', prompt: 'איפה ' + fraction + ' על הישר?', answer: percent,
      hint: 'פעמון השבר על הישר', widget: 'numberLine', line: { min: 0, max: 100, step: 25 },
      explorer: { type: 'singingLine', topicId: 'mm-cur-2', fraction: fraction, percent: percent },
    };
  }

  function groupsSpec(groups, size) {
    const core = [2, 4, 5, 10];
    if ([2, 3, 4, 5].indexOf(groups) < 0 || [2, 3, 4, 5].indexOf(size) < 0) return null;
    if (core.indexOf(groups) < 0 && core.indexOf(size) < 0) return null;
    const table = core.indexOf(groups) >= 0 ? groups : size;
    return {
      type: 'groupsSize', grade: 'ב', skill: 'multiplication', standard: 'MUL_B', level: 1, table: table,
      topicId: 'mm-cur-15', prompt: groups + ' קבוצות של ' + size + '. כמה?', answer: groups * size,
      hint: 'סופרים את כל הנקודות',
      explorer: { type: 'groupsSize', topicId: 'mm-cur-15', groups: groups, size: size },
    };
  }

  function evenOddSpec(n) {
    if (n < 2 || n > 10) return null;
    const odd = n % 2 !== 0;
    return {
      type: 'evenOdd', grade: 'ב', skill: 'place_value', standard: 'PLACE_VALUE', level: 1,
      topicId: 'mm-cur-13', prompt: n + ' זוגי או אי־זוגי?', answer: odd ? 'אי-זוגי' : 'זוגי',
      hint: odd ? 'נשאר צליל בודד' : 'כולם בזוגות',
      explorer: { type: 'evenOdd', topicId: 'mm-cur-13', n: n },
    };
  }

  function bankSpecs() {
    return [singingSpec('3/4'), groupsSpec(4, 3), evenOddSpec(6)];
  }

  return {
    MAX_WORDS: MAX_WORDS,
    SCALE: SCALE,
    cardWords: cardWords,
    bellForPercent: bellForPercent,
    expectedOf: expectedOf,
    checkAnswer: checkAnswer,
    replayPlan: replayPlan,
    createState: createState,
    submit: submit,
    startRetry: startRetry,
    playScale: playScale,
    playReplay: playReplay,
    singingSpec: singingSpec,
    groupsSpec: groupsSpec,
    evenOddSpec: evenOddSpec,
    bankSpecs: bankSpecs,
  };
});
