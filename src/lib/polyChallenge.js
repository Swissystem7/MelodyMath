// MelodyMath — polyrhythm as an optional challenge track only (#683, Refs #665).
//
// Polyrhythm (M4) has weak evidence (#591), so it is never the way a topic is
// taught: common multiples and factors keep their strong primary mechanism,
// M2 accented / grouped beats. This track is an extra for grades ה׳-ו׳ and,
// like everything in MelodyMath, it is never locked (#717).
// It starts with two drums at 2:3; the three-drum 2:3:5 waits for the end.
// Each voice has its own colour and its own side of the screen, so the child
// sees which drum is which. The magic moment: the two drums start apart and
// land together, with one flash, on beat 6.
// The "pick the reason" question and each of its choices are at most 15
// words, and the track ends with a check with no music.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_POLY_CHALLENGE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const POLY = root && typeof root.lcmOf === 'function' ? root : require('./polyrhythm.js');

  const MECHANISM = 'M4';
  const EVIDENCE = 'weak';
  // The topic the challenge rides on and its primary (taught) mechanism.
  const TOPIC = 'PRIME_FACTOR';
  const TOPIC_PRIMARY = 'M2';
  const GRADES = [5, 6];
  // Ids in banks.MUSIC_SOURCES: polyrhythm subdivisions are the LCM of the
  // parts (Rissman 2005); rhythm ratios built and heard (Bamberger & diSessa 2003).
  const SOURCES = ['rissman2005', 'bamberger2003'];
  const MAX_REASON_WORDS = 15;

  // Easiest first: 2:3 opens the track, 2:3:5 closes it.
  const LEVELS = [[2, 3], [3, 4], [2, 5], [2, 3, 5]];
  // RTL screen: the first drum on the right, the second on the left, a third
  // in the middle. Colours differ in hue and lightness.
  const VOICE_LOOK = [
    { colour: '#d9480f', name: 'כתום', side: 'right' },
    { colour: '#1c7ed6', name: 'כחול', side: 'left' },
    { colour: '#2b8a3e', name: 'ירוק', side: 'center' },
  ];

  function wordCount(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean).length;
  }

  function listHe(nums) {
    return nums.slice(0, -1).join(', ') + ' ו־' + nums[nums.length - 1];
  }

  // Open to every child in grades ה׳-ו׳; no mastery gate (#717).
  function isAvailable(grade) {
    return GRADES.indexOf(Number(grade)) !== -1;
  }

  // A new choice order each time, so the right one is not always first.
  function shuffleReason(reason, rand) {
    const r = typeof rand === 'function' ? rand : Math.random;
    const order = reason.choices.map(function (c, k) { return k; });
    for (let k = order.length - 1, j, t; k > 0; k--) { j = Math.floor(r() * (k + 1)); t = order[k]; order[k] = order[j]; order[j] = t; }
    return { question: reason.question, choices: order.map(function (k) { return reason.choices[k]; }), answer: order.indexOf(reason.answer) };
  }

  // Level i (0-based): voices with colour and side, the meeting beat, the
  // reason question (shuffled by rand) and the silent check, or null.
  function level(i, rand) {
    const steps = LEVELS[i];
    if (!steps) return null;
    const meet = POLY.lcmOf.apply(null, steps);
    const voices = steps.map(function (every, k) {
      return { every: every, colour: VOICE_LOOK[k].colour, name: VOICE_LOOK[k].name, side: VOICE_LOOK[k].side };
    });
    const list = listHe(steps);
    return {
      id: steps.join(':'),
      index: i,
      mechanism: MECHANISM,
      evidence: EVIDENCE,
      sources: SOURCES.slice(),
      optional: true,
      voices: voices,
      meet: meet,
      reason: shuffleReason({
        question: 'בחרו סיבה: למה התופים נפגשים בפעימה ' + meet + '?',
        choices: [
          meet + ' היא הכפולה הקטנה ביותר של ' + list,
          'כי ' + steps.reduce(function (a, b) { return a + b; }, 0) + ' פעימות עברו',
          'כי התוף המהיר תמיד מחכה לאיטי',
        ],
        answer: 0,
      }, rand),
      check: { music: false, question: 'מהי הכפולה המשותפת הקטנה ביותר של ' + list + '?', answer: meet },
    };
  }

  function levels(rand) {
    return LEVELS.map(function (s, i) { return level(i, rand); });
  }

  // The track for a child: every level in order, null outside grades ה׳-ו׳.
  function track(grade, rand) {
    return isAvailable(grade) ? levels(rand) : null;
  }

  return {
    MECHANISM: MECHANISM,
    EVIDENCE: EVIDENCE,
    TOPIC: TOPIC,
    TOPIC_PRIMARY: TOPIC_PRIMARY,
    GRADES: GRADES,
    SOURCES: SOURCES,
    MAX_REASON_WORDS: MAX_REASON_WORDS,
    wordCount: wordCount,
    shuffleReason: shuffleReason,
    isAvailable: isAvailable,
    level: level,
    levels: levels,
    track: track,
  };
});
