// MelodyMath — interactive rhythm gameplay engine.
// Combines 4/4 bar fraction subdivisions with progressive musical accompaniment layers.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  // Stage thresholds based on rhythm streak:
  // Stage 1: פעימת מקצב יסוד (Just Drums)
  // Stage 2: בס מוזיקלי מצטרף (Bass Joins)
  // Stage 3: הרמוניה ואקורדים נפתחים (Chords Bloom)
  // Stage 4: תזמורת מלאה ומלודיה (Full Ensemble Melody)
  const STAGES = [
    { level: 1, name: 'פעימת מקצב', desc: 'תופים ומקצב יסוד (רבעים ושמיניות)' },
    { level: 2, name: 'בס מוזיקלי', desc: 'צלילי בס מצטרפים לקצב' },
    { level: 3, name: 'הרמוניה ואקורדים', desc: 'אקורדים עשירים נפתחים ברצף' },
    { level: 4, name: 'מלודיה מלאה', desc: 'מנגינה מלאה והאצת טמפו!' }
  ];

  function stageForStreak(streak) {
    const s = Math.max(0, Math.round(Number(streak) || 0));
    if (s >= 10) return STAGES[3];
    if (s >= 6) return STAGES[2];
    if (s >= 3) return STAGES[1];
    return STAGES[0];
  }

  // Pre-defined 4/4 musical rhythm patterns with fractions:
  const PATTERNS = [
    {
      id: 'four-quarters',
      name: 'ארבעה רבעים (4/4)',
      durations: [0.25, 0.25, 0.25, 0.25],
      fractions: ['1/4', '1/4', '1/4', '1/4'],
      beats: [0, 1, 2, 3]
    },
    {
      id: 'half-and-quarters',
      name: 'חצי ושני רבעים',
      durations: [0.5, 0.25, 0.25],
      fractions: ['1/2', '1/4', '1/4'],
      beats: [0, 2, 3]
    },
    {
      id: 'quarters-and-eighths',
      name: 'רבע, שתי שמיניות ושני רבעים',
      durations: [0.25, 0.125, 0.125, 0.25, 0.25],
      fractions: ['1/4', '1/8', '1/8', '1/4', '1/4'],
      beats: [0, 1, 1.5, 2, 3]
    },
    {
      id: 'syncopated-groove',
      name: 'מקצב מסונכרן (שמיניות ורבעים)',
      durations: [0.125, 0.25, 0.125, 0.25, 0.25],
      fractions: ['1/8', '1/4', '1/8', '1/4', '1/4'],
      beats: [0, 0.5, 1.5, 2, 3]
    }
  ];

  function evaluateTap(expectedTimeMs, tapTimeMs, toleranceMs) {
    const tol = toleranceMs || 150;
    const diff = Math.abs(tapTimeMs - expectedTimeMs);
    if (diff <= tol * 0.5) {
      return { hit: true, rating: 'perfect', text: '🎯 בול בפעימה!', delta: Math.round(tapTimeMs - expectedTimeMs) };
    }
    if (diff <= tol) {
      return { hit: true, rating: 'good', text: '🎵 קרוב מאוד!', delta: Math.round(tapTimeMs - expectedTimeMs) };
    }
    return { hit: false, rating: 'miss', text: 'פספוס קל', delta: Math.round(tapTimeMs - expectedTimeMs) };
  }

  function bpmForStreak(baseBpm, streak) {
    const base = Math.min(140, Math.max(50, Math.round(Number(baseBpm) || 80)));
    const s = Math.max(0, Math.round(Number(streak) || 0));
    const bonus = Math.floor(s / 4) * 4;
    return Math.min(140, base + bonus);
  }

  function patternProgressFraction(hitIndex, totalHits) {
    if (!totalHits || totalHits <= 0) return 0;
    return Math.min(1, Math.max(0, hitIndex / totalHits));
  }

  return {
    STAGES: STAGES,
    PATTERNS: PATTERNS,
    stageForStreak: stageForStreak,
    evaluateTap: evaluateTap,
    bpmForStreak: bpmForStreak,
    patternProgressFraction: patternProgressFraction
  };
});
