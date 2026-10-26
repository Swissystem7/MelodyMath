// MelodyMath - takeAwayBeats & tenExchange, interactive additions (Refs #689). takeAwayBeats is primary only for SUB10, SUB20 and WORD_REMOVE; tenExchange is PRIMARY for PLACE_VALUE (ten bells become one drum), tensBarsBack stays primary for SUB2D and alternateDrums for EVEN_ODD (Refs #665).
// (Refs #665).
//
// takeAwayBeats: a row of beats sounds, then beats disappear one by one
// (silence in their place); what still sounds is the difference.
// tenExchange: bells counted with asTens (tens as one drum sound each, ones as single bells); every 10 bells become one drum.
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

  // Same helper as PR #778 (NumberPlay asTens): tens as ONE sound each ({n:1,v:10}), ones single ({n:ones,v:1}). Addition/subtraction counts only; multiplication keeps equal groups (#778).
  function asTens(total) { const tens = Math.floor(total / 10), ones = total % 10, out = [];
    for (let i = 0; i < tens; i++) out.push({ n: 1, v: 10 }); if (ones) out.push({ n: ones, v: 1 }); return out;
  }
  function countGroups(total) { return total > 12 ? asTens(total) : [{ n: total, v: 1 }]; }

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
  function tenWidget(item) { return item.widget === 'tenExchange' || (Array.isArray(item.musicExtra) && item.musicExtra.some(function (w) { return w && w.music === 'tenExchange'; })); }
  function specForItem(item) {
    if (!item || typeof item !== 'object') return null;
    const nums = numbersOf(item.prompt);
    if (item.music === 'takeAwayBeats' && nums.length >= 2) return takeAwayCircles(nums[0], nums[1]);
    if ((item.music === 'tenExchange' || tenWidget(item)) && nums.length === 1) {
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
  function pushCount(ev, total, t, step, oneKind) { countGroups(total).forEach(function (g) { for (let k = 0; k < g.n; k++) { ev.push({ at: t, hz: g.v === 10 ? 130 : STEP_HZ[ev.length % 8], kind: g.v === 10 ? 'drum' : oneKind, v: g.v }); t += step; } }); return t; }
  function soundEvents(spec) { if (!spec || !Array.isArray(spec.circles)) return []; const ev = [];
    if (spec.kind === 'takeAway') { const t1 = pushCount(ev, spec.start, 0, 0.35, 'beat'); pushCount(ev, spec.remaining, t1 + 0.4, 0.35, 'beat'); return ev; }
    const t2 = pushCount(ev, spec.bells, 0, 0.22, 'bell'); spec.circles.forEach(function (c, i) { ev.push({ at: t2 + 0.3 + i * 0.3, hz: c.kind === 'bell' ? STEP_HZ[i % 8] : 130, kind: c.kind, v: c.kind === 'bell' ? 1 : 10 }); }); return ev; }
  function myInst() { if (root && root.MM_MY_INSTRUMENT) return root.MM_MY_INSTRUMENT; try { return require('../myInstrument.js'); } catch (e) { return null; } }
  function instData() { if (root && typeof root.instrumentById === 'function') return root; try { return require('../instruments.js'); } catch (e) { return null; } }
  function instrumentIdFor(spec, storage) { const mi = myInst(); const fb = spec && spec.kind === 'tenExchange' ? 'handbells' : 'taiko'; return mi ? mi.instrumentFor(fb, null, storage) : fb; }
  function voiceFor(spec, storage) { const d = instData(); const x = d && d.instrumentById(instrumentIdFor(spec, storage)); return x && x.voice ? x.voice : (spec && spec.kind === 'tenExchange' ? 'metalBell' : 'drumLow'); }
  function voicesFor(spec, storage) { const chosen = voiceFor(spec, storage); if (!spec || spec.kind !== 'tenExchange') return { beat: chosen, drum: chosen, bell: chosen, hundred: chosen }; return /[Dd]rum/.test(chosen) ? { beat: chosen, drum: chosen, hundred: chosen, bell: 'metalBell' } : { beat: chosen, bell: chosen, drum: 'drumLow', hundred: 'drumLow' }; }
  function play(spec, env) {
    const e = env || {}; const events = soundEvents(spec); if (!events.length) return null;
    const voices = e.voices || voicesFor(spec, e.storage); const voice = e.voice || voiceFor(spec, e.storage); const id = instrumentIdFor(spec, e.storage);
    const pv = e.playVoice || (root && root.playVoice);
    const ac = e.audioContext || (root && typeof root.getSharedAudioContext === 'function' ? root.getSharedAudioContext() : null);
    if (typeof pv === 'function' && ac) {
      if (ac.state === 'suspended' && ac.resume) { try { ac.resume(); } catch (err) { /* autoplay */ } }
      const t0 = ac.currentTime + 0.05;
      events.forEach(function (ev) { pv(ac, e.voice || voices[ev.kind] || voice, ev.hz, t0 + ev.at); });
      return { instrument: id, voice: voice, notes: events.length };
    }
    const ps = e.playSequence || (root && root.playSequence) || (root && root.musicEngine && root.musicEngine.playSequence);
    if (typeof ps === 'function') { const r = ps(events.map(function (ev) { return { at: ev.at, dur: 0.18, hz: ev.hz, gain: 0.16, type: 'triangle', voice: voices[ev.kind] || voice, v: ev.v }; })); return r ? { instrument: id, voice: voice, notes: events.length } : null; }
    return null;
  }

  return {
    MAX_CIRCLES: MAX_CIRCLES,
    takeAwayCircles: takeAwayCircles,
    takeAwaySteps: takeAwaySteps,
    tenExchange: tenExchange,
    specForItem: specForItem,
    circlesHtml: circlesHtml, answerText: answerText, soundEvents: soundEvents, asTens: asTens, voicesFor: voicesFor, instrumentIdFor: instrumentIdFor, voiceFor: voiceFor, play: play,
  };
});
