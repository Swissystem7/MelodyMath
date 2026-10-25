// MelodyMath — kid-level lines on how a maths fact lives in each instrument
// family (#673, content for the variation engine in #687, Refs #665).
//
// Content only: no picking, no randomising. #687's engine chooses the topic,
// family and numbers; this file supplies the words and which instruments
// (from instruments.js, #623) may voice them. Each topic keeps its one
// primary way (#665 rule): addition = steady beat (M1), multiplication =
// grouped beats (M2), fractions = note lengths in a bar (M3).
//
// `ask` never shows the answer; `tell` does, for after the child answers.
// Placeholders are {name}; PARAMS lists the ones each topic needs.
(function (root, factory) {
  const api = factory(typeof require === 'function' ? require('./instruments') : (root.instrumentById ? root : null));
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_INSTRUMENT_LINES = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (I) {
  'use strict';

  const FAMILIES = ['percussion', 'strings', 'winds', 'keys'];

  const PARAMS = {
    addition: ['a', 'b', 'sum'],
    multiplication: ['groups', 'size', 'product'],
    fractions: ['num', 'den'],
  };

  const MECHANISM = { addition: 'M1', multiplication: 'M2', fractions: 'M3' };

  // Peer-reviewed studies behind each primary way, same entries as
  // EVIDENCE_SOURCES / grade6.js sources so the app shows one citation.
  const SOURCES = {
    M1: [
      { id: 'mcdonel2015', authors: 'McDonel, J. S.', year: 2015,
        title: 'Exploring learning connections between music and mathematics in early childhood',
        venue: 'Bulletin of the Council for Research in Music Education, 203',
        url: 'https://doi.org/10.5406/bulcouresmusedu.203.0045' },
    ],
    M2: [
      { id: 'ribeiro2020', authors: 'Ribeiro, F. S., & Santos, F. H.', year: 2020,
        title: 'Persistent effects of musical training on mathematical skills of children with developmental dyscalculia',
        venue: 'Frontiers in Psychology',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC6965363/' },
    ],
    M3: [
      { id: 'courey2012', authors: 'Courey, S. J., Balogh, E., Siker, J. R., & Paik, J.', year: 2012,
        title: 'Academic Music: music instruction to engage third-grade students in learning basic fraction concepts',
        venue: 'Educational Studies in Mathematics, 81(2)',
        url: 'https://doi.org/10.1007/s10649-012-9395-9' },
      { id: 'azaryahu2020', authors: 'Azaryahu, L., Courey, S. J., Elkoshi, R., & Adi-Japha, E.', year: 2020,
        title: '\'MusiMath\' and \'Academic Music\' – two music-based intervention programs for fractions learning in fourth grade students',
        venue: 'Developmental Science, 23(4)',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7378943/' },
    ],
  };

  const LINES = {
    addition: {
      percussion: {
        instruments: ['tof', 'taiko', 'cajon', 'surdo'],
        ask: 'מתופפים {a} מכות על התוף, ואז עוד {b} מכות. כמה מכות יש ביחד?',
        tell: '{a} מכות ועוד {b} מכות הן {sum} מכות: {a} + {b} = {sum}.',
      },
      strings: {
        instruments: ['balalaika', 'ukulele', 'oud'],
        ask: 'פורטים על המיתרים {a} פעמים, ואז עוד {b} פעמים. כמה פריטות יש ביחד?',
        tell: '{a} פריטות ועוד {b} פריטות הן {sum} פריטות: {a} + {b} = {sum}.',
      },
      winds: {
        instruments: ['didgeridoo', 'recorder', 'shofar'],
        ask: 'נושפים {a} צלילים, ואז עוד {b} צלילים. כמה צלילים יש ביחד?',
        tell: '{a} צלילים ועוד {b} צלילים הם {sum} צלילים: {a} + {b} = {sum}.',
      },
      keys: {
        instruments: ['piano', 'accordion'],
        ask: 'לוחצים על קליד {a} פעמים, ואז עוד {b} פעמים. כמה לחיצות יש ביחד?',
        tell: '{a} לחיצות ועוד {b} לחיצות הן {sum} לחיצות: {a} + {b} = {sum}.',
      },
    },
    multiplication: {
      percussion: {
        instruments: ['djembe', 'tabla', 'mridangam'],
        ask: 'מתופפים {groups} קבוצות, ובכל קבוצה {size} מכות. כמה מכות יש בסך הכול?',
        tell: '{groups} קבוצות של {size} מכות הן {product} מכות: {groups} × {size} = {product}.',
      },
      strings: {
        instruments: ['charango', 'qanun'],
        ask: 'פורטים {groups} קבוצות, ובכל קבוצה {size} פריטות. כמה פריטות יש בסך הכול?',
        tell: '{groups} קבוצות של {size} פריטות הן {product} פריטות: {groups} × {size} = {product}.',
      },
      winds: {
        instruments: ['recorder', 'shakuhachi'],
        ask: 'מנגנים {groups} קבוצות, ובכל קבוצה {size} צלילים. כמה צלילים יש בסך הכול?',
        tell: '{groups} קבוצות של {size} צלילים הן {product} צלילים: {groups} × {size} = {product}.',
      },
      keys: {
        instruments: ['piano', 'harmonium'],
        ask: 'לוחצים {groups} קבוצות, ובכל קבוצה {size} לחיצות. כמה לחיצות יש בסך הכול?',
        tell: '{groups} קבוצות של {size} לחיצות הן {product} לחיצות: {groups} × {size} = {product}.',
      },
    },
    fractions: {
      percussion: {
        instruments: ['darbuka'],
        ask: 'התיבה מתחלקת ל-{den} מכות שוות. מתופפים {num} מהן. איזה חלק מהתיבה תופפנו?',
        tell: '{num} מכות מתוך {den} הן {num}/{den} מהתיבה.',
      },
      strings: {
        instruments: ['erhu', 'ukulele'],
        ask: 'התיבה מתחלקת ל-{den} חלקים שווים. הקשת זזה במשך {num} חלקים. איזה חלק מהתיבה הצליל נמשך?',
        tell: 'הצליל נמשך {num} חלקים מתוך {den}, כלומר {num}/{den} מהתיבה.',
      },
      winds: {
        instruments: ['recorder', 'ney', 'shofar'],
        ask: 'התיבה מתחלקת ל-{den} חלקים שווים. מחזיקים צליל במשך {num} חלקים. איזה חלק מהתיבה הצליל נמשך?',
        tell: 'הצליל נמשך {num} חלקים מתוך {den}, כלומר {num}/{den} מהתיבה.',
      },
      keys: {
        instruments: ['accordion'],
        ask: 'התיבה מתחלקת ל-{den} חלקים שווים. המפוח נפתח במשך {num} חלקים. איזה חלק מהתיבה הצליל נמשך?',
        tell: 'הצליל נמשך {num} חלקים מתוך {den}, כלומר {num}/{den} מהתיבה.',
      },
    },
  };

  function fill(template, params) {
    return template.replace(/\{(\w+)\}/g, function (_, k) {
      if (params[k] === undefined || params[k] === null) throw new Error('missing param ' + k);
      return String(params[k]);
    });
  }

  // The words for one topic and family with the engine's numbers filled in.
  function lineFor(topic, family, params) {
    const entry = LINES[topic] && LINES[topic][family];
    if (!entry) return null;
    const p = params || {};
    return {
      topic, family, mechanism: MECHANISM[topic],
      instruments: entry.instruments.slice(),
      ask: fill(entry.ask, p),
      tell: fill(entry.tell, p),
    };
  }

  function instrumentsFor(topic, family) {
    const entry = LINES[topic] && LINES[topic][family];
    if (!entry || !I) return [];
    return entry.instruments.map(I.instrumentById).filter(Boolean);
  }

  // The same fact with no music at all, to check the child can do it unaided.
  // #687's engine is not on master yet, so this takes the same topic and
  // params as lineFor and works the answer out itself.
  const NO_MUSIC = {
    addition: { ask: 'כמה זה {a} + {b}?', answer: (p) => p.a + p.b },
    multiplication: { ask: 'כמה זה {groups} × {size}?', answer: (p) => p.groups * p.size },
    fractions: {
      ask: 'שלם מחולק ל-{den} חלקים שווים. לוקחים {num} מהם. איזה חלק מהשלם לקחנו?',
      answer: (p) => p.num + '/' + p.den,
    },
  };
  const INPUTS = { addition: ['a', 'b'], multiplication: ['groups', 'size'], fractions: ['num', 'den'] };

  function noMusicCheck(topic, params) {
    const entry = NO_MUSIC[topic];
    if (!entry) return null;
    const p = params || {};
    INPUTS[topic].forEach(function (k) {
      if (!Number.isInteger(p[k]) || p[k] < 0) throw new Error('bad param ' + k);
    });
    if (topic === 'fractions' && (p.den < 1 || p.num > p.den)) throw new Error('bad fraction');
    return { ask: fill(entry.ask, p), answer: entry.answer(p) };
  }

  return { FAMILIES, PARAMS, MECHANISM, SOURCES, LINES, lineFor, instrumentsFor, noMusicCheck };
});
