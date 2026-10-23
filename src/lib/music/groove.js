// MelodyMath — TimesTableGroove: a times-table column as a rhythmic groove
// (#591, owner feature proposal 2/5, mechanism M2 only).
//
// buildGroove(4, 90) is a run of steady beats where every 4th beat is
// accented; the accented beats carry the running products 4, 8, 12, ...
// stopAt() freezes the groove after k accents and asks factor × k. The same
// groove is skip counting in grade ב׳ and division in grade ד׳ (how many
// accented groups fit), so the method never changes between grades.
// Pure logic: the touch layer plays the beats.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_GROOVE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MECHANISM = 'M2';
  const DEFAULT_BPM = 90;
  const DEFAULT_GROUPS = 10;

  function wholeIn(v, lo, hi) {
    const n = Number(v);
    return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
  }

  // factor 1-12; bpm 40-240 (default 90); groups = how many accents (1-12).
  // beats: [{ index (1-based), timeMs, accent, product }] — product is the
  // running multiple on an accented beat and null on the others.
  function buildGroove(factor, bpm, groups) {
    const f = wholeIn(factor, 1, 12);
    if (f == null) return null;
    const tempo = bpm == null ? DEFAULT_BPM : wholeIn(bpm, 40, 240);
    if (tempo == null) return null;
    const g = groups == null ? DEFAULT_GROUPS : wholeIn(groups, 1, 12);
    if (g == null) return null;
    const beatMs = 60000 / tempo;
    const beats = [];
    for (let i = 1; i <= f * g; i++) {
      const accent = i % f === 0;
      beats.push({ index: i, timeMs: Math.round((i - 1) * beatMs), accent: accent, product: accent ? i : null });
    }
    return { mechanism: MECHANISM, factor: f, bpm: tempo, beatMs: beatMs, groups: g, beats: beats };
  }

  // The beat numbers that are accented: 4, 8, 12, ... for factor 4.
  function accentedBeats(groove) {
    return groove ? groove.beats.filter(function (b) { return b.accent; }).map(function (b) { return b.index; }) : [];
  }

  // Stop the groove after k accented groups and ask "factor × k = ?". The
  // played part is every beat before the k-th accent; the child completes it.
  function stopAt(groove, k) {
    const n = groove ? wholeIn(k, 1, groove.groups) : null;
    if (n == null) return null;
    const answer = groove.factor * n;
    return {
      played: groove.beats.filter(function (b) { return b.index < answer; }),
      question: groove.factor + ' × ' + n,
      answer: answer,
    };
  }

  // Division read off the same groove: how many accented groups fill
  // `total` beats (grade ד׳). Null when it does not divide evenly.
  function groupsIn(groove, total) {
    const t = Number(total);
    if (!groove || !Number.isInteger(t) || t < 0 || t % groove.factor !== 0) return null;
    return t / groove.factor;
  }

  return {
    MECHANISM: MECHANISM,
    DEFAULT_BPM: DEFAULT_BPM,
    buildGroove: buildGroove,
    accentedBeats: accentedBeats,
    stopAt: stopAt,
    groupsIn: groupsIn,
  };
});
