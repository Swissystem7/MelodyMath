// takeAwayBeats & tenExchange (Refs #689, Refs #665). takeAwayBeats is primary only for SUB10, SUB20 and WORD_REMOVE; tenExchange is primary for PLACE_VALUE; tensBarsBack stays primary for SUB2D and its EXTRA paths stay; alternateDrums stays primary for EVEN_ODD. One circle per sound (a drum per ten above 12). The 10→1 grouping plays only after the child answers.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_TAKEAWAY_TEN = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const MAX_CIRCLES = 99; // two-digit exercises included; past this the method stays text

  function wholeIn(v, lo, hi) { const n = Number(v); return Number.isInteger(n) && n >= lo && n <= hi ? n : null; }

  // Same helper as PR #778 (NumberPlay asTens): tens as ONE sound each ({n:1,v:10}), ones single ({n:ones,v:1}). Addition/subtraction counts only; multiplication keeps equal groups (#778).
  function asTens(total) { const tens = Math.floor(total / 10), ones = total % 10, out = [];
    for (let i = 0; i < tens; i++) out.push({ n: 1, v: 10 }); if (ones) out.push({ n: ones, v: 1 }); return out;
  }
  function countGroups(total) { return total > 12 ? asTens(total) : [{ n: total, v: 1 }]; }

  function circlesFor(total, oneKind) { const circles = []; countGroups(total).forEach(function (g) { const kind = g.v === 10 ? 'drum' : oneKind; for (let k = 0; k < g.n; k++) circles.push({ index: circles.length, kind: kind, v: g.v, gone: false }); }); return circles; }
  function markTail(circles, kind, n) { for (let i = circles.length - 1; i >= 0 && n > 0; i--) if (circles[i].kind === kind && !circles[i].gone) { circles[i].gone = true; n--; } }
  function takeAwayCircles(start, take) {
    const s = wholeIn(start, 1, MAX_CIRCLES), t = wholeIn(take, 0, s == null ? 0 : s);
    if (s == null || t == null) return null;
    const circles = circlesFor(s, 'beat');
    if (s <= 12) markTail(circles, 'beat', t);
    else { let goneTens = Math.floor(t / 10), goneOnes = t % 10; if (goneOnes > s % 10) { goneTens += 1; goneOnes = s % 10; } markTail(circles, 'beat', goneOnes); markTail(circles, 'drum', goneTens); }
    return { kind: 'takeAway', start: s, take: t, remaining: s - t, circles: circles };
  }
  function takeAwaySteps(start, take) { const c = takeAwayCircles(start, take); if (!c) return null; const steps = []; for (let n = c.start; n >= c.remaining; n--) steps.push(n); return steps; }
  function tenExchange(bells) {
    const b = wholeIn(bells, 0, 999); if (b == null) return null;
    const hundreds = Math.floor(b / 100), drums = Math.floor((b % 100) / 10), left = b % 10, circles = [];
    function add(n, kind) { for (let i = 0; i < n; i++) circles.push({ index: circles.length, kind: kind, gone: false }); }
    add(hundreds, 'hundred'); add(drums, 'drum'); add(left, 'bell');
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

  function circlesHtml(spec, opts) { const revealed = !!(opts && opts.revealed);
    if (!spec || !Array.isArray(spec.circles)) return '';
    const shown = spec.circles; const parts = shown.map(function (c) {
      const cls = 'snd-circle snd-' + c.kind + (revealed && c.gone ? ' snd-gone' : '');
      const label = NAME[c.kind] + (revealed && c.gone ? ' — שקט' : '');
      return '<span class="' + cls + '" role="img" aria-label="' + label + '" data-gone="' + (revealed && c.gone ? '1' : '0') + '"' + (!revealed && c.gone ? ' data-reveal-gone="1"' : '') + '>' + GLYPH[c.kind] + '</span>';
    });
    const ans = answerText(spec); return '<div class="snd-wrap"><button type="button" class="snd-play">▶ האזינו וספרו</button><div class="snd-circles' + (shown.length > 20 ? ' snd-many' : '') + '" dir="ltr">' + parts.join('') + '</div>' + (revealed ? '<span class="snd-answer">' + ans + '</span>' : '<span class="snd-answer" data-reveal="' + ans + '">?</span>') + '</div>';
  }
  function answerText(spec) { if (!spec) return ''; if (spec.kind === 'takeAway') return 'נשארו ' + spec.remaining; return (spec.hundreds ? spec.hundreds + ' מאות, ' : '') + spec.drums + ' עשרות ו־' + spec.left + ' יחידות'; }
  const STEP_HZ = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25, 587.33, 659.25];
  function pushCount(ev, total, t, step, oneKind, phase) { countGroups(total).forEach(function (g) { for (let k = 0; k < g.n; k++) { ev.push({ at: t, hz: g.v === 10 ? 130 : STEP_HZ[ev.length % 8], kind: g.v === 10 ? 'drum' : oneKind, v: g.v, phase: phase }); t += step; } }); return t; }
  function groupingEvents(spec) {
    const ev = [], step = 0.16; let t = 0; const tens = spec.hundreds * 10 + spec.drums; const exchanged = tens > 0 && spec.bells >= 10;
    function push(n, kind, v) { for (let i = 0; i < n; i++) { ev.push({ at: t, hz: v === 1 ? STEP_HZ[ev.length % 8] : 130, kind: kind, v: v, phase: 'group' }); t += step; } }
    push(exchanged ? 10 : Math.min(spec.left, 12), 'bell', 1); if (exchanged) push(1, 'drum', 10); push(Math.max(0, tens - (exchanged ? 1 : 0)), 'drum', 10); push(spec.left, 'bell', 1);
    return ev;
  }
  function soundEvents(spec, opts) { if (!spec || !Array.isArray(spec.circles)) return []; const ev = [];
    if (spec.kind === 'takeAway') { const t1 = pushCount(ev, spec.start, 0, 0.35, 'beat', 'start'); pushCount(ev, spec.remaining, t1 + 0.4, 0.35, 'beat', 'remain'); return ev; }
    if (!(opts && opts.revealed)) { spec.circles.forEach(function (c, i) { const v = c.kind === 'hundred' ? 100 : (c.kind === 'drum' ? 10 : 1); ev.push({ at: i * 0.22, hz: v === 1 ? STEP_HZ[i % 8] : 130, kind: c.kind, v: v, phase: 'start' }); }); return ev; }
    return groupingEvents(spec); }
  function myInst() { if (root && root.MM_MY_INSTRUMENT) return root.MM_MY_INSTRUMENT; try { return require('../myInstrument.js'); } catch (e) { return null; } }
  function instData() { if (root && typeof root.instrumentById === 'function') return root; try { return require('../instruments.js'); } catch (e) { return null; } }
  function instrumentIdFor(spec, storage) { const mi = myInst(); const fb = spec && spec.kind === 'tenExchange' ? 'handbells' : 'taiko'; return mi ? mi.instrumentFor(fb, null, storage) : fb; }
  function voiceFor(spec, storage) { const d = instData(); const x = d && d.instrumentById(instrumentIdFor(spec, storage)); return x && x.voice ? x.voice : (spec && spec.kind === 'tenExchange' ? 'metalBell' : 'drumLow'); }
  function voicesFor(spec, storage) { const chosen = voiceFor(spec, storage); if (!spec || spec.kind !== 'tenExchange') return { beat: chosen, drum: chosen, bell: chosen, hundred: chosen }; return /[Dd]rum/.test(chosen) ? { beat: chosen, drum: chosen, hundred: chosen, bell: 'metalBell' } : { beat: chosen, bell: chosen, drum: 'drumLow', hundred: 'drumLow' }; }
  function play(spec, env) {
    const e = env || {}; const events = soundEvents(spec, e); if (!events.length) return null;
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
