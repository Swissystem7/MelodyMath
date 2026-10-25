// MelodyMath — polyrhythm as an optional challenge track only (#683, Refs #665).
//
// Polyrhythm (M4) has weak evidence (#591), so it is never the way a topic is
// taught: common multiples and factors keep their strong primary mechanism,
// M2 accented / grouped beats. This track is an extra for grades ה׳-ו׳ and
// stays locked until the child has mastered M2 (two rows of accents).
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
  const M2_MASTERY_KEY = 'mm.mastery.M2';
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

  // flags: { M2: true } once M2 (two rows of accents) is mastered.
  function isUnlocked(grade, flags) {
    return GRADES.indexOf(Number(grade)) !== -1 && !!(flags && flags.M2 === true);
  }

  function readFlags(storage) {
    try {
      return { M2: !!storage && storage.getItem(M2_MASTERY_KEY) === '1' };
    } catch (e) {
      return { M2: false };
    }
  }

  function markM2Mastered(storage) {
    if (!storage) return false;
    try {
      storage.setItem(M2_MASTERY_KEY, '1');
      return true;
    } catch (e) {
      return false;
    }
  }

  // Level i (0-based): voices with colour and side, the meeting beat, the
  // reason question and the silent check. null when out of range.
  function level(i) {
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
      optional: true,
      voices: voices,
      meet: meet,
      reason: {
        question: 'בחרו סיבה: למה התופים נפגשים בפעימה ' + meet + '?',
        choices: [
          meet + ' היא הכפולה הקטנה ביותר של ' + list,
          'כי ' + steps.reduce(function (a, b) { return a + b; }, 0) + ' פעימות עברו',
          'כי התוף המהיר תמיד מחכה לאיטי',
        ],
        answer: 0,
      },
      check: { music: false, question: 'מהי הכפולה המשותפת הקטנה ביותר של ' + list + '?', answer: meet },
    };
  }

  function levels() {
    return LEVELS.map(function (s, i) { return level(i); });
  }

  // The track for a child: null while locked, else every level in order.
  function track(grade, flags) {
    return isUnlocked(grade, flags) ? levels() : null;
  }

  return {
    MECHANISM: MECHANISM,
    EVIDENCE: EVIDENCE,
    TOPIC: TOPIC,
    TOPIC_PRIMARY: TOPIC_PRIMARY,
    GRADES: GRADES,
    M2_MASTERY_KEY: M2_MASTERY_KEY,
    MAX_REASON_WORDS: MAX_REASON_WORDS,
    wordCount: wordCount,
    isUnlocked: isUnlocked,
    readFlags: readFlags,
    markM2Mastered: markM2Mastered,
    level: level,
    levels: levels,
    track: track,
  };
});
