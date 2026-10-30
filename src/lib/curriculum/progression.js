// MelodyMath — progression of the musical-math skills (#591, owner item 5).
//
// Every topic of the curriculum matrix (curriculum.js MATRIX) names the
// earlier topics it builds on (`prereq`); `buildsTo` is the same relation read
// the other way, so the two can never disagree. Keys are the stable topic ids
// ('mm-cur-' + original index; rows moved for teaching order keep their id,
// #616), never row text or way text, so the music ways in grade1-6.js can be
// rewritten without touching this file.
//
// A musical-math skill is a bank standard with music ways (grade<n>.js
// `music`, keyed by banks.js ST key). Its links are the links of its topic:
// curriculum.sectionForItem tags the standard with a row. A standard that has
// no tagged row yet is placed here, in SKILL_TOPIC, keyed 'grade:KEY'.
//
// Order rule (test/progression.test.js): a prereq is in an earlier grade, or
// in the same grade at an earlier MATRIX position. Grade א׳ topics may be
// roots; grade ו׳ topics may be leaves; every other topic has both.
//
// Gaps of the 14:44 sequencing analysis on #591 that are about order, and the
// links that encode them:
//   5  ד׳ סדר פעולות → ו׳ (mm-cur-31 → mm-cur-50); ה׳ ראשוניים → ו׳
//      (mm-cur-40 → mm-cur-50): grade ו׳ builds on the earlier mechanism (#613).
//   6  place value before two-digit addition: mm-cur-13 → mm-cur-14 (#614).
//   7  א׳ hundred chart before whole tens (mm-cur-5 → mm-cur-4); ה׳ fraction
//      models before equivalence (mm-cur-42 → mm-cur-41) (#616).
//   8  ג׳ remainder "1 out of 4" prepares ד׳ fractions: mm-cur-25 → mm-cur-32.
//   9  א׳-ב׳ equality → ד׳ equations → ה׳ (#710): mm-cur-3 and mm-cur-14 →
//      mm-cur-31 → mm-cur-39.
//  10 ה׳ perimeter before ו׳ circle circumference (#711): the sides of a
//      polygon fill one bar, then the circle is that bar with no corners
//      (mm-cur-47 → mm-cur-54).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_PROGRESSION = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // topicId → [prereq topic ids, what carries forward, primary music
  // mechanisms]. Dosage rule 4 (#591, owner 23.10 15:54): a topic keeps one
  // consistent musical method that is carried and built on across grades.
  // The third field lists the primary mechanisms (banks.js MUSIC_MECHANISMS)
  // of the music skills of the topic; each is carried from a prereq topic or
  // builds on a prereq's mechanism by MECHANISM_BUILDS_ON.
  const PREREQ = {
    // א׳
    'mm-cur-0': [[], 'steady beat, one count per beat', ['M1', 'M2']],
    'mm-cur-1': [['mm-cur-0'], 'beats grouped in tens', ['M1', 'M2']],
    'mm-cur-2': [['mm-cur-0'], 'counted steps on a line', ['M1']],
    'mm-cur-3': [['mm-cur-1', 'mm-cur-2'], 'joining and removing beats within 20', ['M1', 'M2', 'M3']],
    'mm-cur-5': [['mm-cur-1'], 'tens and ones of the hundred chart', ['M2']],
    'mm-cur-4': [['mm-cur-5', 'mm-cur-3'], 'whole tens as whole groups of ten beats', ['M2']],
    'mm-cur-6': [[], 'repeating patterns', ['M2']],
    'mm-cur-7': [['mm-cur-3'], 'addition and subtraction stories', ['M1']],
    'mm-cur-8': [[], 'sides and vertices', ['M3', 'M6']],
    'mm-cur-9': [[], 'length in units', ['M3']],
    'mm-cur-10': [[], 'whole hours', ['M2']],
    'mm-cur-11': [['mm-cur-3'], 'sums of coins', ['M2']],
    'mm-cur-12': [['mm-cur-1'], 'counted data', ['M2', 'M3']],
    // ב׳
    'mm-cur-13': [['mm-cur-5', 'mm-cur-1'], 'hundreds, tens and ones', ['M2']],
    'mm-cur-14': [['mm-cur-13', 'mm-cur-4', 'mm-cur-7'], 'two-digit addition with regrouping', ['M1', 'M2', 'M3']],
    'mm-cur-15': [['mm-cur-0', 'mm-cur-6'], 'accented beats: skip counting as multiples', ['M2']],
    'mm-cur-16': [['mm-cur-15'], 'beats shared into equal bars', ['M2']],
    'mm-cur-17': [['mm-cur-8'], 'polygons and the right angle', ['M3', 'M6']],
    'mm-cur-18': [['mm-cur-9', 'mm-cur-10', 'mm-cur-14'], 'perimeter and the half bar as half hour', ['M2', 'M3']],
    'mm-cur-19': [['mm-cur-11', 'mm-cur-14'], 'sums and change', ['M2']],
    'mm-cur-20': [['mm-cur-15'], 'layers of cubes as repeated groups', ['M2']],
    'mm-cur-21': [['mm-cur-12'], 'tables and bar charts', ['M2', 'M3']],
    // ג׳
    'mm-cur-22': [['mm-cur-13'], 'place value to 10,000', ['M2']],
    'mm-cur-23': [['mm-cur-22', 'mm-cur-14'], 'regrouping to 10,000', ['M2']],
    'mm-cur-24': [['mm-cur-15'], 'bars × beats for the full table', ['M2']],
    'mm-cur-25': [['mm-cur-16', 'mm-cur-24', 'mm-cur-22'], 'beats left outside the bar: remainder as part of a bar', ['M2']],
    'mm-cur-26': [['mm-cur-24', 'mm-cur-23'], 'how many times as fast', ['M2']],
    'mm-cur-27': [['mm-cur-17'], 'kinds of angles', ['M3', 'M6']],
    'mm-cur-28': [['mm-cur-18', 'mm-cur-20', 'mm-cur-24'], 'rows × columns; minutes', ['M2']],
    'mm-cur-29': [['mm-cur-19', 'mm-cur-25'], 'shekels as 100 agorot', ['M2']],
    'mm-cur-30': [['mm-cur-21'], 'collecting and charting data', ['M2', 'M3']],
    // ד׳
    'mm-cur-31': [['mm-cur-3', 'mm-cur-14', 'mm-cur-22', 'mm-cur-23', 'mm-cur-24', 'mm-cur-25'], 'the א׳-ב׳ equality balance, then place value to a million', ['M2', 'M3']],
    'mm-cur-32': [['mm-cur-25', 'mm-cur-18'], 'note values as parts of a 4/4 bar', ['M3']],
    'mm-cur-33': [['mm-cur-32', 'mm-cur-16'], 'fractions of a quantity, equal names', ['M3']],
    'mm-cur-34': [['mm-cur-27', 'mm-cur-28', 'mm-cur-20'], 'quadrilaterals and surface area', ['M2', 'M6']],
    'mm-cur-35': [['mm-cur-28', 'mm-cur-18'], 'unit changes and the calendar', ['M2']],
    'mm-cur-36': [['mm-cur-29', 'mm-cur-26'], 'purchase and change', ['M2']],
    'mm-cur-37': [['mm-cur-30', 'mm-cur-32'], 'charts with fractions', ['M2', 'M3']],
    // ה׳
    'mm-cur-38': [['mm-cur-31'], 'numbers beyond a million', ['M2']],
    'mm-cur-39': [['mm-cur-31'], 'four operations, rounding', ['M2', 'M3']],
    'mm-cur-40': [['mm-cur-31', 'mm-cur-24'], 'factors and common multiples', ['M2']],
    'mm-cur-42': [['mm-cur-32'], 'fraction models and the number line', ['M3']],
    'mm-cur-41': [['mm-cur-42', 'mm-cur-33', 'mm-cur-40'], 'equivalent fractions', ['M3']],
    'mm-cur-43': [['mm-cur-33', 'mm-cur-42'], 'fraction of a quantity', ['M3']],
    'mm-cur-44': [['mm-cur-41', 'mm-cur-33', 'mm-cur-40'], 'common denominators, mixed numbers', ['M3']],
    'mm-cur-45': [['mm-cur-42', 'mm-cur-38', 'mm-cur-35'], 'decimal place value', ['M3']],
    'mm-cur-46': [['mm-cur-45', 'mm-cur-36'], 'decimal addition', ['M3']],
    'mm-cur-47': [['mm-cur-28', 'mm-cur-34'], 'perimeter as sides in one bar, height and area', ['M2', 'M3']],
    'mm-cur-48': [['mm-cur-34'], 'solids and nets', ['M6']],
    'mm-cur-49': [['mm-cur-37'], 'frequency and mode', ['M2', 'M3']],
    // ו׳
    'mm-cur-50': [['mm-cur-31', 'mm-cur-39', 'mm-cur-40'], 'natural numbers, order of operations', ['M2']],
    'mm-cur-51': [['mm-cur-41', 'mm-cur-43', 'mm-cur-44'], 'fraction multiplication and division', ['M3']],
    'mm-cur-52': [['mm-cur-45', 'mm-cur-46', 'mm-cur-31'], 'decimal multiplication and division', ['M3']],
    'mm-cur-53': [['mm-cur-43', 'mm-cur-45'], 'percent', ['M3']],
    'mm-cur-54': [['mm-cur-47'], 'circle', ['M3']],
    'mm-cur-55': [['mm-cur-47', 'mm-cur-34'], 'composite polygons', ['M2']],
    'mm-cur-56': [['mm-cur-48', 'mm-cur-20', 'mm-cur-35'], 'volume', ['M2']],
    'mm-cur-57': [['mm-cur-49', 'mm-cur-39'], 'mean', ['M3']],
    'mm-cur-58': [['mm-cur-49', 'mm-cur-37'], 'reading and showing data', ['M3']],
  };

  // Music standards that curriculum.js does not tag with a row yet.
  // 'grade:KEY' → topic id, or [prereq ids, buildsTo ids] for a standard
  // outside its grade's program. ג׳ MASS_VOL is not here (#751): the ways
  // moved to ד׳ beside UNITS, and the kg/liter items sit on that grade's row.
  const SKILL_TOPIC = {
    'א:NUMBER_LINE_APPROX': 'mm-cur-2',
    'א:RIGHT_ANGLE': 'mm-cur-8',
    'ב:EQ_LEFT': 'mm-cur-14',
    'ב:MULTIADD': 'mm-cur-14',
    'ב:TENS': 'mm-cur-14',
    'ב:ADD20': 'mm-cur-14',
    'ב:WORD_COLLECT': 'mm-cur-14',
    'ב:WORD_REMOVE': 'mm-cur-14',
    'ב:WORD_COMPARE': 'mm-cur-14',
    'ב:MONEY': 'mm-cur-19',
  };

  // A new primary mechanism may only grow out of one the child already met:
  // grouped beats (M2) are accents on a steady beat (M1); note durations in
  // a bar (M3) split a bar of grouped beats (M2); melodic and rhythmic
  // patterns (M6) repeat counted beats (M1). Grade א׳ roots may start any.
  const MECHANISM_BUILDS_ON = { M1: [], M2: ['M1'], M3: ['M2'], M6: ['M1'] };

  const BUILDS_TO = {};
  Object.keys(PREREQ).forEach(function (id) { BUILDS_TO[id] = []; });
  Object.keys(PREREQ).forEach(function (id) {
    PREREQ[id][0].forEach(function (p) { if (BUILDS_TO[p]) BUILDS_TO[p].push(id); });
  });

  const bridgesModule = typeof require === 'function' ? require('./bridges.js') : (typeof globalThis !== 'undefined' && globalThis.MM_BRIDGES);

  // { prereq, buildsTo, carries, bridges } of a topic, or null for an unknown id.
  function linksForTopic(id) {
    if (!Object.prototype.hasOwnProperty.call(PREREQ, id)) return null;
    return {
      topicId: id,
      prereq: PREREQ[id][0].slice(),
      buildsTo: BUILDS_TO[id].slice(),
      carries: PREREQ[id][1],
      mechanisms: PREREQ[id][2].slice(),
      bridges: (bridgesModule && bridgesModule.bridgesForTopic) ? bridgesModule.bridgesForTopic(id) : [],
    };
  }

  // Links of a music skill. `taggedTopicId` is the row curriculum.js tags the
  // standard with (null if none); SKILL_TOPIC fills the rest.
  function linksForSkill(grade, key, taggedTopicId) {
    const own = taggedTopicId || SKILL_TOPIC[grade + ':' + key];
    if (typeof own === 'string') return linksForTopic(own);
    if (Array.isArray(own)) return { topicId: null, prereq: own[0].slice(), buildsTo: own[1].slice(), carries: null, mechanisms: null };
    return null;
  }

  return {
    PREREQ: PREREQ,
    BUILDS_TO: BUILDS_TO,
    MECHANISM_BUILDS_ON: MECHANISM_BUILDS_ON,
    SKILL_TOPIC: SKILL_TOPIC,
    linksForTopic: linksForTopic,
    linksForSkill: linksForSkill,
    BRIDGES: (bridgesModule && bridgesModule.BRIDGES) || {},
    bridgeForLink: (bridgesModule && bridgesModule.bridgeForLink) || function () { return null; },
    bridgesForTopic: (bridgesModule && bridgesModule.bridgesForTopic) || function () { return []; },
    bridgesEnteringTopic: (bridgesModule && bridgesModule.bridgesEnteringTopic) || function () { return []; },
  };
});
