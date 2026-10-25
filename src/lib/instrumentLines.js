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

  return { FAMILIES, PARAMS, MECHANISM, LINES, lineFor, instrumentsFor };
});
