// MelodyMath — takeAwayBeats & tenExchange, interactive additions (Refs #689). takeAwayBeats is primary only for SUB10, SUB20 and WORD_REMOVE; tenExchange is EXTRA for place value (alternateDrums stays primary), as tensBarsBack stays primary for SUB2D
// (Refs #665).
//
// takeAwayBeats: a row of beats sounds, then beats disappear one by one
// (silence in their place); what still sounds is the difference.
// tenExchange: bells sound one by one; every 10 bells become one drum.
// One circle per sound: each beat/bell/drum on screen is exactly one circle,
// so the child counts circles, not a picture of a count. Pure logic — the
// page plays the sounds and greys the circles in step with them.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_TAKEAWAY_TEN = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const MAX_CIRCLES = 99; // two-digit exercises included; past this the method stays text

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
    const b = wholeIn(bells, 0, 999);
    if (b == null) return null;
    const hundreds = Math.floor(b / 100);
    const drums = Math.floor((b % 100) / 10);
    const left = b % 10;
    const circles = [];
    for (let i = 0; i < hundreds; i++) circles.push({ index: circles.length, kind: 'hundred', gone: false });
    for (let i = 0; i < drums; i++) circles.push({ index: circles.length, kind: 'drum', gone: false });
    for (let i = 0; i < left; i++) circles.push({ index: circles.length, kind: 'bell', gone: false });
    return { kind: 'tenExchange', bells: b, hundreds: hundreds, drums: drums, left: left, circles: circles };
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
    if (item.music === 'tenExchange' && nums.length === 1) {
      const x = tenExchange(nums[0]);
      return x && x.bells >= 10 ? x : null;
    }
    return null;
  }

  const GLYPH = { beat: '🥁', bell: '🔔', drum: '🪘', hundred: '🛢️' };
  const NAME = { beat: 'פעימה', bell: 'פעמון', drum: 'תוף של עשרה פעמונים', hundred: 'תוף של מאה פעמונים' };

  // One circle per sound. Gone beats stay visible but silent (data-gone),
  // so the child sees what disappeared and counts what still sounds.
  function circlesHtml(spec, opts) { const revealed = !!(opts && opts.revealed);
    if (!spec || !Array.isArray(spec.circles)) return '';
    const shown = revealed || spec.kind !== 'tenExchange' ? spec.circles : Array.from({ length: Math.min(spec.bells, 99) }, function (_, i) { return { index: i, kind: 'bell', gone: false }; }); const parts = shown.map(function (c) {
      const cls = 'snd-circle snd-' + (revealed ? c.kind : 'beat') + (revealed && c.gone ? ' snd-gone' : '');
      const label = revealed ? NAME[c.kind] + (c.gone ? ' — שקט' : '') : 'צליל';
      return '<span class="' + cls + '" role="img" aria-label="' + label + '" data-gone="' + (revealed && c.gone ? '1' : '0') + '"' + (!revealed && c.gone ? ' data-reveal-gone="1"' : '') + '>' + (revealed ? GLYPH[c.kind] : '🎵') + '</span>';
    });
    const ans = answerText(spec); return '<div class="snd-wrap"><button type="button" class="snd-play">▶ האזינו וספרו</button><div class="snd-circles' + (shown.length > 20 ? ' snd-many' : '') + '" dir="ltr">' + parts.join('') + '</div>' + (revealed ? '<span class="snd-answer">' + ans + '</span>' : '<span class="snd-answer" data-reveal="' + ans + '">?</span>') + '</div>';
  }
  function answerText(spec) { if (!spec) return ''; if (spec.kind === 'takeAway') return 'נשארו ' + spec.remaining; return (spec.hundreds ? spec.hundreds + ' מאות, ' : '') + spec.drums + ' עשרות ו־' + spec.left + ' יחידות'; }
  const STEP_HZ = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
  function soundEvents(spec) {
    if (!spec || !Array.isArray(spec.circles)) return [];
    const ev = [];
    if (spec.kind === 'takeAway') {
      spec.circles.forEach(function (c, i) { ev.push({ at: i * 0.35, hz: STEP_HZ[i % 8], kind: 'beat' }); });
      const off = spec.circles.length * 0.35 + 0.4;
      spec.circles.forEach(function (c, i) { if (!c.gone) ev.push({ at: off + i * 0.35, hz: STEP_HZ[i % 8], kind: 'beat' }); });
      return ev;
    }
    const step = spec.bells > 50 ? 0.05 : 0.22;
    for (let i = 0; i < spec.bells; i++) ev.push({ at: i * step, hz: STEP_HZ[i % 8], kind: 'bell' });
    const off2 = spec.bells * step + 0.3;
    spec.circles.forEach(function (c, i) { ev.push({ at: off2 + i * 0.3, hz: c.kind === 'bell' ? STEP_HZ[i % 8] : 130, kind: c.kind }); });
    return ev;
  }
  function myInst() { if (root && root.MM_MY_INSTRUMENT) return root.MM_MY_INSTRUMENT; try { return require('../myInstrument.js'); } catch (e) { return null; } }
  function instData() { if (root && typeof root.instrumentById === 'function') return root; try { return require('../instruments.js'); } catch (e) { return null; } }
  function instrumentIdFor(spec, storage) { const mi = myInst(); const fb = spec && spec.kind === 'tenExchange' ? 'handbells' : 'taiko'; return mi ? mi.instrumentFor(fb, null, storage) : fb; }
  function voiceFor(spec, storage) { const d = instData(); const x = d && d.instrumentById(instrumentIdFor(spec, storage)); return x && x.voice ? x.voice : (spec && spec.kind === 'tenExchange' ? 'metalBell' : 'drumLow'); }
  function play(spec, env) {
    const e = env || {}; const events = soundEvents(spec); if (!events.length) return null;
    const voice = e.voice || voiceFor(spec, e.storage); const id = instrumentIdFor(spec, e.storage);
    const pv = e.playVoice || (root && root.playVoice);
    const ac = e.audioContext || (root && typeof root.getSharedAudioContext === 'function' ? root.getSharedAudioContext() : null);
    if (typeof pv === 'function' && ac) {
      if (ac.state === 'suspended' && ac.resume) { try { ac.resume(); } catch (err) { /* autoplay */ } }
      const t0 = ac.currentTime + 0.05;
      events.forEach(function (ev) { pv(ac, voice, ev.hz, t0 + ev.at); });
      return { instrument: id, voice: voice, notes: events.length };
    }
    const ps = e.playSequence || (root && root.playSequence) || (root && root.musicEngine && root.musicEngine.playSequence);
    if (typeof ps === 'function') { const r = ps(events.map(function (ev) { return { at: ev.at, dur: 0.18, hz: ev.hz, gain: 0.16, type: 'triangle' }; })); return r ? { instrument: id, voice: voice, notes: events.length } : null; }
    return null;
  }

  return {
    MAX_CIRCLES: MAX_CIRCLES,
    takeAwayCircles: takeAwayCircles,
    takeAwaySteps: takeAwaySteps,
    tenExchange: tenExchange,
    specForItem: specForItem,
    circlesHtml: circlesHtml, answerText: answerText, soundEvents: soundEvents, instrumentIdFor: instrumentIdFor, voiceFor: voiceFor, play: play,
  };
});
