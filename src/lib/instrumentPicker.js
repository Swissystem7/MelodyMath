// MelodyMath — InstrumentPicker Core Logic (Refs #679, Refs #665).
// Free instrument choice for children across 4 child-facing families.
// Zero locked instruments, zero coins/levels, persistent per child.
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    const I = require('./instruments.js');
    module.exports = factory(I);
  } else {
    root.InstrumentPickerLogic = factory(root.MelodyMathInstruments || root);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function (I) {
  'use strict';

  const INSTRUMENTS = (I && I.INSTRUMENTS) || [];
  const instrumentById = (I && I.instrumentById) || function (id) {
    return INSTRUMENTS.find(function (x) { return x.id === id; }) || null;
  };

  const CHILD_FAMILIES = [
    { id: 'drums', labelHe: 'תופים', icon: '🥁', hasPitch: false, instruments: ['darbuka', 'djembe', 'tabla', 'cajon'] },
    { id: 'strings', labelHe: 'פריטה וקשת', icon: '🎸', hasPitch: true, instruments: ['guitar', 'oud', 'kora', 'sitar', 'violin'] },
    { id: 'keys', labelHe: 'קלידים ומקושים', icon: '🎹', hasPitch: true, instruments: ['piano', 'marimba', 'xylophone', 'accordion'] },
    { id: 'winds', labelHe: 'נשיפה', icon: '🎷', hasPitch: true, instruments: ['recorder', 'panFlute', 'ney', 'shakuhachi'] }
  ];

  function getFamilyForInstrument(instrumentId) {
    for (let i = 0; i < CHILD_FAMILIES.length; i++) {
      if (CHILD_FAMILIES[i].instruments.indexOf(instrumentId) >= 0) return CHILD_FAMILIES[i];
    }
    return null;
  }

  const STORAGE_PREFIX = 'mm_child_inst_';

  function getChildInstrument(childId, defaultId) {
    const fallback = defaultId || 'darbuka';
    if (!childId) return fallback;
    try {
      if (typeof localStorage !== 'undefined') {
        const val = localStorage.getItem(STORAGE_PREFIX + childId);
        if (val && instrumentById(val)) return val;
      }
    } catch (_) {}
    return fallback;
  }

  function saveChildInstrument(childId, instrumentId) {
    if (!childId || !instrumentById(instrumentId)) return false;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_PREFIX + childId, instrumentId);
        return true;
      }
    } catch (_) {}
    return false;
  }

  function resolveInstrumentVoice(instrumentId, options) {
    const opts = options || {};
    const inst = instrumentById(instrumentId);
    const fam = getFamilyForInstrument(instrumentId);
    const voice = (inst && inst.voice) || 'drumLow';

    if (opts.needsPitch && fam && !fam.hasPitch) {
      return {
        instrumentId: instrumentId,
        voice: opts.fallbackPitchVoice || 'woodBar',
        isSubstituted: true,
        noticeHe: 'לצליל עם גובה משתמשים בצליל קסילופון מותאם'
      };
    }
    return { instrumentId: instrumentId, voice: voice, isSubstituted: false, noticeHe: '' };
  }

  function pickEnsembleVoices(options) {
    const opts = options || {};
    const count = Math.max(1, Math.min(opts.voices || 1, 4));
    const firstId = getChildInstrument(opts.childId, opts.preferredInstrument || 'darbuka');
    const firstFam = getFamilyForInstrument(firstId) || CHILD_FAMILIES[0];
    const picked = [firstId];

    if (count > 1) {
      for (let i = 0; i < CHILD_FAMILIES.length && picked.length < count; i++) {
        if (CHILD_FAMILIES[i].id !== firstFam.id) picked.push(CHILD_FAMILIES[i].instruments[0]);
      }
    }
    return picked;
  }

  function perimeterExercisePlan(sides, options) {
    const opts = options || {};
    const sideInst = opts.instrumentId || 'recorder';
    const cornerInst = opts.cornerInstrumentId || 'darbuka';
    const sideVoice = resolveInstrumentVoice(sideInst, { needsPitch: true });
    const cornerVoice = resolveInstrumentVoice(cornerInst);
    const events = [];
    let total = 0;
    (sides || []).forEach(function (len, idx) {
      total += len;
      events.push({ type: 'corner', cornerIndex: idx, voice: cornerVoice.voice });
      events.push({ type: 'side', sideIndex: idx, length: len, voice: sideVoice.voice });
    });
    return {
      totalPerimeter: total,
      sideVoice: sideVoice,
      cornerVoice: cornerVoice,
      events: events
    };
  }

  return {
    CHILD_FAMILIES: CHILD_FAMILIES,
    getFamilyForInstrument: getFamilyForInstrument,
    getChildInstrument: getChildInstrument,
    saveChildInstrument: saveChildInstrument,
    resolveInstrumentVoice: resolveInstrumentVoice,
    pickEnsembleVoices: pickEnsembleVoices,
    perimeterExercisePlan: perimeterExercisePlan
  };
});
