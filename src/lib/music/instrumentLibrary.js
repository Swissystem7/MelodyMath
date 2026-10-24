// MelodyMath — WorldInstrumentLibrary: 24 instruments in 4 families (#591,
// owner spec 6376067230, extending InstrumentStudio 6376023552 as corrected
// in 6376035473: everything is free, nothing is sold).
//
// This is the one instrument registry. Each entry is an InstrumentProfile
// {samples, feel, theme, mechanic} plus a short culture card (where it comes
// from, its family, how it is played, a 10-second demo phrase, its source).
// The facts and sources live in src/lib/instruments.js; this file only adds
// how each one is played on screen and its card.
//
// Mechanics by family (spec section 1): percussion is tapped, strings are
// plucked or swiped, winds are held (the hold is the note length), keys are
// tapped with several fingers. The six starting instruments keep their own
// richer mechanics from the studio. An instrument is timbre and mechanic
// only: it never changes a topic's one primary musical way (dosage rules
// 6368976807).
//
// Sounds are synthesised in code (instrumentVoices.js), so there is nothing
// to download: "loading" an instrument means planning its voices ahead of the
// first tap. createLoader() prepares only the chosen instrument and, when the
// page is idle, the next one to open. instruments/LICENSES.json has a record
// for every voice.
//
// The six starting instruments are open from the first visit; the other 18
// open one per topic practised well (5 correct), in a fixed order: no
// randomness, no timers, nothing to pay. Pure and tested in Node.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_LIBRARY = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const DATA = root && typeof root.instrumentById === 'function' ? root : require('../instruments.js');

  const FAMILIES = ['percussion', 'strings', 'winds', 'keys'];
  const FAMILY_HE = { percussion: 'כלי הקשה', strings: 'כלי מיתר', winds: 'כלי נשיפה', keys: 'כלי מקלדת' };
  // The kind of gesture each mechanic is (spec: tap, pluck/swipe, hold, multi-touch keys).
  const KIND = { tapZones: 'tap', barsByPitch: 'tap', pressSlide: 'tap', strikeDamp: 'tap', tapPads: 'tap', thumbPluck: 'pluck', strum: 'pluck', hold: 'hold', keys: 'keys' };
  const DEMO_SECONDS = 10;
  const DEMO_BPM = 96; // 16 beats = 10 seconds

  // L(id, family, mechanic, samples, feel, icon, color, origin, how, review)
  // TODO-source: the owner asks a cultural adviser to check the cards of the
  // gamelan, koto, sitar and qanun (review = true marks them, card.reviewTodo).
  // family follows the owner's list (6376067230), so the kalimba is with the
  // keys here although instruments.js files it under percussion.
  function L(id, family, mechanic, samples, feel, icon, color, origin, how, review) {
    const x = DATA.instrumentById(id);
    return { id: id, he: x ? x.instrument.he : id, family: family, mechanic: mechanic, samples: samples, voice: samples[0],
      feel: feel, theme: { icon: icon, color: color }, basic: false, opensAt: 0,
      card: { origin: origin, how: how, source: x ? x.source : 'TODO', reviewTodo: !!review } };
  }

  // The six the child starts with (the studio's first instruments).
  const BASICS = [
    L('darbuka', 'percussion', 'tapZones', ['drumLow', 'drumHigh'], { zones: ['דום', 'טק'] }, '🪘', 'yellow',
      'המזרח התיכון וצפון אפריקה', 'מכים בכף היד: דום עמוק במרכז העור, טק חד בשוליים.'),
    L('marimba', 'percussion', 'barsByPitch', ['woodBar'], { notes: [262, 294, 330, 392, 440, 523, 587, 659] }, '🪵', 'pink',
      'מרכז אמריקה (גואטמלה), שורשים באפריקה', 'מכים במקושים רכים על קורות עץ. קורה ארוכה נמוכה, קצרה גבוהה.'),
    L('piano', 'keys', 'keys', ['keys'], { notes: [262, 294, 330, 349, 392, 440, 494, 523] }, '🎹', 'ink',
      'איטליה (פירנצה, בערך 1700)', 'לוחצים על קלידים, ופטישים קטנים מכים במיתרים. אפשר כמה אצבעות יחד.'),
    L('kalimba', 'keys', 'thumbPluck', ['tine'], { notes: [523, 587, 659, 784, 880, 1047, 1175] }, '🎐', 'mint',
      'אפריקה (משפחת הלמלופון)', 'פורטים באגודלים על לשוניות מתכת. הלשונית הארוכה באמצע היא הנמוכה.'),
    L('tabla', 'percussion', 'pressSlide', ['tablaBol', 'frameDrum'], { slide: [110, 130, 150, 175, 200] }, '🥁', 'purple',
      'צפון הודו (מוזיקה הינדוסטנית)', 'זוג תופים: מקישים באצבעות על הקטן, ועל הגדול לוחצים בכף היד ומחליקים כדי שהצליל יעלה.'),
    L('gamelan', 'percussion', 'strikeDamp', ['gong'], { notes: [262, 294, 349, 392, 440] }, '🔔', 'good',
      'באלי, אינדונזיה (גנדר)', 'מכים בקורת מתכת ביד אחת ומעמעמים את הקודמת ביד השנייה.', true),
  ];

  // The 18 that open with progress, in this order (families alternate).
  const EXTRAS = [
    L('djembe', 'percussion', 'tapPads', ['drumHigh'], { pads: [['בס', 90], ['טון', 220], ['סלאפ', 0]] }, '🥁', 'yellow',
      'בני המנדה, מערב אפריקה (מאלי, גינאה)', 'מכים בידיים: בס במרכז, טון ליד השוליים, וסלאפ חד באצבעות פתוחות.'),
    L('oud', 'strings', 'strum', ['pluck'], { strings: [98, 131, 175, 220, 294, 392] }, '🪕', 'pink',
      'העולם הערבי והמזרח התיכון', 'פורטים במפרט (ריישה) על זוגות מיתרים, בלי סריגים על הצוואר.'),
    L('flute', 'winds', 'hold', ['flute'], { notes: [523, 587, 659, 698, 784, 880] }, '🪈', 'mint',
      'אירופה (חליל בם, מינכן 1832-1847)', 'מחזיקים את החליל לצד ונושפים מעל חור הנשיפה. הצליל נמשך כל עוד נושפים.'),
    L('cajon', 'percussion', 'tapPads', ['woodClick'], { pads: [['בס', 300], ['סלאפ', 0]] }, '📦', 'ink',
      'פרו (מוזיקה אפרו־פרואנית)', 'יושבים על התיבה ומכים בדופן הקדמית: במרכז בס, בפינה העליונה סלאפ.'),
    L('sitar', 'strings', 'strum', ['sitar'], { strings: [131, 175, 196, 262, 349] }, '🪕', 'purple',
      'צפון הודו (מוזיקה הינדוסטנית)', 'פורטים במפרט תיל על האצבע, ומיתרים נוספים מהדהדים לבד מתחת.', true),
    L('ney', 'winds', 'hold', ['breathy'], { notes: [294, 330, 370, 392, 440] }, '🎋', 'good',
      'איראן', 'נושפים בעדינות בקצה צינור פתוח ומכסים חורים באצבעות.'),
    L('taiko', 'percussion', 'tapPads', ['taiko'], { pads: [['דון', 60], ['קא', 420]] }, '🥁', 'pink',
      'יפן', 'מכים במקלות עבים (באצ׳י): דון במרכז העור, קא על שפת התוף.'),
    L('koto', 'strings', 'strum', ['koto'], { strings: [147, 165, 196, 220, 247, 294, 330, 392, 440] }, '🎏', 'mint',
      'יפן (הגיע מסין במאה ה־8)', 'פורטים בציפורניים על 13 מיתרים, וגשרים ניידים קובעים את גובה כל מיתר.', true),
    L('recorder', 'winds', 'hold', ['recorderPipe'], { notes: [523, 587, 659, 698, 784] }, '🪈', 'yellow',
      'אירופה (נירנברג)', 'נושפים בעדינות בפומית ומכסים 7 חורים באצבעות ואחד באגודל.'),
    L('xylophone', 'percussion', 'tapPads', ['xylo'], { pads: [['דו', 523], ['רה', 587], ['מי', 659], ['פה', 698], ['סול', 784], ['לה', 880]] }, '🎼', 'purple',
      'אירופה (תזמורת)', 'מכים במקושים קשים על קורות עץ. הצליל קצר ובהיר.'),
    L('guitar', 'strings', 'strum', ['nylon'], { strings: [82, 110, 147, 196, 247, 330] }, '🎸', 'yellow',
      'ספרד ואירופה', 'פורטים או מעבירים יד על שישה מיתרים, ולוחצים על הצוואר כדי לשנות צליל.'),
    L('trumpet', 'winds', 'hold', ['trumpet'], { notes: [233, 262, 294, 349, 392] }, '🎺', 'pink',
      'אירופה (חצוצרה עם שסתומים, המאה ה־19)', 'מזמזמים בשפתיים לתוך הפומית ולוחצים על שלושה שסתומים.'),
    L('steelPan', 'percussion', 'tapPads', ['steelPan'], { pads: [['דו', 523], ['רה', 587], ['מי', 659], ['סול', 784], ['לה', 880]] }, '🛢️', 'mint',
      'טרינידד וטובגו', 'מכים במקושים מגומי על אזורים מקומרים בתוף פלדה. כל אזור צליל אחר.'),
    L('violin', 'strings', 'strum', ['bowed'], { strings: [196, 294, 440, 659] }, '🎻', 'good',
      'איטליה ואירופה', 'מעבירים קשת על ארבעה מיתרים. מחליקים אצבע על המיתרים כמו משיכת קשת.'),
    L('clarinet', 'winds', 'hold', ['clarinet'], { notes: [147, 165, 196, 220, 262, 294] }, '🎷', 'ink',
      'אירופה (גרמניה, תחילת המאה ה־18)', 'נושפים לפומית עם עלעל אחד ומכסים חורים ומפתחות.'),
    L('harp', 'strings', 'strum', ['harp'], { strings: [131, 147, 165, 175, 196, 220, 247, 262, 294, 330] }, '🎼', 'ink',
      'אירופה (נבל דוושות, המאה ה־19)', 'פורטים באצבעות על 47 מיתרים, ושבע דוושות משנות את הצלילים.'),
    L('qanun', 'strings', 'strum', ['qanun'], { strings: [196, 220, 247, 262, 294, 330, 349, 392] }, '🎶', 'ink',
      'העולם הערבי והמזרח התיכון', 'מניחים על הברכיים ופורטים במפרטים על האצבעות המורות של שתי הידיים.', true),
    L('accordion', 'keys', 'keys', ['organ'], { notes: [262, 294, 330, 349, 392, 440, 494, 523] }, '🪗', 'good',
      'אירופה (גרמניה)', 'מותחים ולוחצים את המפוח ולוחצים על קלידים. הצליל נמשך כל עוד המפוח זז.'),
  ];
  BASICS.forEach(function (x) { x.basic = true; x.opensAt = 0; });
  EXTRAS.forEach(function (x, i) { x.opensAt = i + 1; });
  const LIBRARY = BASICS.concat(EXTRAS);

  function byId(id) {
    for (let i = 0; i < LIBRARY.length; i++) if (LIBRARY[i].id === id) return LIBRARY[i];
    return null;
  }
  function byFamily(f) { return LIBRARY.filter(function (x) { return x.family === f; }); }
  function basicIds() { return BASICS.map(function (x) { return x.id; }); }
  // Open instruments after `mastered` topics practised well (deterministic).
  function unlockedIds(mastered) {
    const n = Number(mastered) || 0;
    return LIBRARY.filter(function (x) { return x.opensAt <= n; }).map(function (x) { return x.id; });
  }
  // The next instrument to open, if any (the idle prefetch target).
  function nextToOpen(mastered) {
    const n = Number(mastered) || 0;
    return EXTRAS.filter(function (x) { return x.opensAt > n; }).map(function (x) { return x.id; })[0] || null;
  }

  // Every sound an instrument can make: [{voice, hz}] (hz 0 = the voice's own pitch).
  function sounds(x) {
    const f = x.feel;
    if (f.zones) return x.samples.map(function (v) { return { voice: v, hz: 0 }; });
    if (f.slide) return [{ voice: x.samples[0], hz: 0 }].concat(f.slide.map(function (hz) { return { voice: x.samples[1], hz: hz }; }));
    if (f.pads) return f.pads.map(function (p) { return { voice: x.voice, hz: p[1] }; });
    return (f.notes || f.strings).map(function (hz) { return { voice: x.voice, hz: hz }; });
  }

  // The card's 10-second demo: 16 beats at 96 bpm, its rhythm set by the
  // kind of gesture (taps: long-short-short, plucks: eighth arpeggios, holds:
  // half notes, keys: a quarter-note scale up and down).
  const RHYTHM = { tap: [1, 0.5, 0.5], pluck: [0.5], hold: [2], keys: [1] };
  function demoPlan(x) {
    const s = sounds(x);
    const beat = 60 / DEMO_BPM;
    const rh = RHYTHM[KIND[x.mechanic]];
    const out = [];
    let t = 0;
    let i = 0;
    while (t < 16 - 1e-9) {
      const d = Math.min(rh[i % rh.length], 16 - t);
      const k = KIND[x.mechanic] === 'keys' ? (Math.floor(i / s.length) % 2 ? s.length - 1 - (i % s.length) : i % s.length) : i % s.length;
      out.push({ at: t * beat, dur: d * beat, voice: s[k].voice, hz: s[k].hz });
      t += d;
      i++;
    }
    return out;
  }
  function demoSeconds(plan) { return plan.length ? plan[plan.length - 1].at + plan[plan.length - 1].dur : 0; }

  // Prepares (plans) only the chosen instrument, plus one idle prefetch.
  function createLoader(planVoice) {
    const plan = planVoice || (root && root.planVoice) || require('../instrumentVoices.js').planVoice;
    let cache = {};
    function build(id) {
      const x = byId(id);
      if (!x) return null;
      return cache[id] || (cache[id] = sounds(x).map(function (s) { return plan(s.voice, s.hz); }));
    }
    return {
      prepare: function (id) {
        const keep = {};
        if (cache[id]) keep[id] = cache[id];
        cache = keep;
        return build(id);
      },
      prefetch: function (id) { return id && byId(id) ? build(id) : null; },
      prepared: function () { return Object.keys(cache); },
    };
  }

  // Dosage rules (6368976807): an instrument is timbre and mechanic only.
  // withInstrument() dresses a task in an instrument: it may set only these
  // keys, and everything else (topic, method, question, answer, points) is
  // copied as is.
  const TIMBRE_KEYS = ['instrument', 'voice', 'samples', 'mechanic'];
  function withInstrument(task, id) {
    const x = byId(id);
    if (!x) return Object.assign({}, task);
    return Object.assign({}, task, { instrument: x.id, voice: x.voice, samples: x.samples.slice(), mechanic: x.mechanic });
  }
  // dosageGuard(task, ids): true when switching between these instruments
  // changes nothing but the timbre keys, so the topic's one primary musical
  // way, the answer and the score stay the same.
  function dosageGuard(task, ids) {
    const strip = function (t) {
      const out = {};
      Object.keys(t).sort().forEach(function (k) { if (TIMBRE_KEYS.indexOf(k) < 0) out[k] = t[k]; });
      return JSON.stringify(out);
    };
    const base = strip(task);
    return (ids || LIBRARY.map(function (x) { return x.id; })).every(function (id) { return strip(withInstrument(task, id)) === base; });
  }

  return {
    FAMILIES: FAMILIES, FAMILY_HE: FAMILY_HE, KIND: KIND, DEMO_SECONDS: DEMO_SECONDS, LIBRARY: LIBRARY, BASICS: BASICS, EXTRAS: EXTRAS,
    byId: byId, byFamily: byFamily, basicIds: basicIds, unlockedIds: unlockedIds, nextToOpen: nextToOpen,
    sounds: sounds, demoPlan: demoPlan, demoSeconds: demoSeconds, createLoader: createLoader,
    TIMBRE_KEYS: TIMBRE_KEYS, withInstrument: withInstrument, dosageGuard: dosageGuard,
  };
});
