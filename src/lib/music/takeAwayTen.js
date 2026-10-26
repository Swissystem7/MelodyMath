// MelodyMath — takeAwayBeats & tenExchange, the primary interactive methods
// of subtraction and place value (Refs #689, Refs #665).
//
// takeAwayBeats: a row of beats sounds, then beats disappear one by one
// (silence in their place); what still sounds is the difference.
// tenExchange: bells sound one by one; every 10 bells become one drum.
// One circle per sound: each beat/bell/drum on screen is exactly one circle,
// so the child counts circles, not a picture of a count. Pure logic — the
// page plays the sounds and greys the circles in step with them.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_TAKEAWAY_TEN = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const MAX_CIRCLES = 20; // bigger numbers keep the method as text, not a wall of circles

  function wholeIn(v, lo, hi) {
    const n = Number(v);
    return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
  }

  // start beats sound; the last `take` of them disappear. remaining = start - take.
  function takeAwayCircles(start, take) {
    const s = wholeIn(start, 1, MAX_CIRCLES);
    const t = wholeIn(take, 0, MAX_CIRCLES);
    if (s == null || t == null || t > s) return null;
    const circles = [];
    for (let i = 0; i < s; i++) circles.push({ index: i, kind: 'beat', gone: i >= s - t });
    return { kind: 'takeAway', start: s, take: t, remaining: s - t, circles: circles };
  }

  // The counts heard while beats disappear one by one: [start, ..., remaining].
  function takeAwaySteps(start, take) {
    const c = takeAwayCircles(start, take);
    if (!c) return null;
    const steps = [];
    for (let n = c.start; n >= c.remaining; n--) steps.push(n);
    return steps;
  }

  // `bells` single bells regroup: each full 10 becomes one drum.
  function tenExchange(bells) {
    const b = wholeIn(bells, 0, 99);
    if (b == null) return null;
    const drums = Math.floor(b / 10);
    const left = b % 10;
    const circles = [];
    for (let i = 0; i < drums; i++) circles.push({ index: circles.length, kind: 'drum', gone: false });
    for (let i = 0; i < left; i++) circles.push({ index: circles.length, kind: 'bell', gone: false });
    return { kind: 'tenExchange', bells: b, drums: drums, left: left, circles: circles };
  }

  function numbersOf(prompt) {
    const m = String(prompt == null ? '' : prompt).match(/\d+/g);
    return m ? m.map(Number) : [];
  }

  // A widget spec for an item solved with one of the two methods, else null.
  function specForItem(item) {
    if (!item || typeof item !== 'object') return null;
    const nums = numbersOf(item.prompt);
    if (item.music === 'takeAwayBeats' && nums.length >= 2) return takeAwayCircles(nums[0], nums[1]);
    if (item.music === 'tenExchange' && nums.length >= 1) {
      const x = tenExchange(nums[0]);
      return x && x.bells >= 10 ? x : null;
    }
    return null;
  }

  const GLYPH = { beat: '🥁', bell: '🔔', drum: '🪘' };
  const NAME = { beat: 'פעימה', bell: 'פעמון', drum: 'תוף של עשרה פעמונים' };

  // One circle per sound. Gone beats stay visible but silent (data-gone),
  // so the child sees what disappeared and counts what still sounds.
  function circlesHtml(spec) {
    if (!spec || !Array.isArray(spec.circles)) return '';
    const parts = spec.circles.map(function (c) {
      const cls = 'snd-circle snd-' + c.kind + (c.gone ? ' snd-gone' : '');
      const label = NAME[c.kind] + (c.gone ? ' — שקט' : '');
      return '<span class="' + cls + '" role="img" aria-label="' + label + '" data-gone="' + (c.gone ? '1' : '0') + '">' + GLYPH[c.kind] + '</span>';
    });
    return '<div class="snd-circles" dir="ltr">' + parts.join('') + '</div>';
  }

  return {
    MAX_CIRCLES: MAX_CIRCLES,
    takeAwayCircles: takeAwayCircles,
    takeAwaySteps: takeAwaySteps,
    tenExchange: tenExchange,
    specForItem: specForItem,
    circlesHtml: circlesHtml,
  };
});
