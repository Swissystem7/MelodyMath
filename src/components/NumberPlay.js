// MelodyMath — NumberPlay module (Issue #686, Refs #665).
// Plays the numbers of elementary arithmetic exercises with visual circles and pedagogical timbres.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_NUMBER_PLAY = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  function need(p) { try { return require(p); } catch (e) { return null; } }
  function getJam() { return (root && root.MM_JAM) || need('./jamKit.js'); }

  // 4 primary instruments with verified sources: Darbuka, Cajon, Marimba, Handbells.
  const DEFAULT_VOICES = [
    { voice: 'drumLow', hz: 220, instrument: 'darbuka', he: 'דרבוקה' },
    { voice: 'woodClick', hz: 330, instrument: 'cajon', he: 'קחון' },
    { voice: 'woodBar', hz: 392, instrument: 'marimba', he: 'מרימבה' },
    { voice: 'metalBell', hz: 440, instrument: 'handbells', he: 'פעמוני יד' }
  ];

  function cap(n) { return Math.max(1, Math.min(20, Math.round(Number(n) || 1))); }

  function shouldSkip(it) {
    if (!it) return true;
    const p = typeof it === 'string' ? it : String(it.prompt || '');
    if (p.includes('/') || p.includes('%') || /\d+\.\d+/.test(p) || /\b\d{1,2}:\d{2}\b/.test(p)) return true;
    const tid = String((it && (it.topicId || it.id)) || '');
    if (/^mm-cur-(?:3[2-9]|[4-9]\d|\d{3,})/.test(tid)) return true;
    const skill = String((it && it.skill) || '');
    return skill.includes('fraction') || skill.includes('decimal') || skill.includes('percent');
  }

  function parseNumberGroups(it) {
    if (!it || shouldSkip(it)) return null;
    if (typeof it === 'object' && Array.isArray(it.hear) && it.hear.length > 0) {
      if (it.hear.some(x => x > 20)) return null;
      return { op: 'hear', groups: it.hear.map(cap) };
    }
    const p = typeof it === 'string' ? it : (it.prompt || '');
    if (!p) return null;

    // Addition: a + b (+ c)
    const mAdd = p.match(/^(\d+)\s*\+\s*(\d+)(?:\s*\+\s*(\d+))?/);
    if (mAdd) {
      const vals = [mAdd[1], mAdd[2], mAdd[3]].filter(Boolean).map(Number);
      if (vals.some(v => v > 20) || (vals[0] + vals[1] + (vals[2] || 0) > 30)) return null;
      return { op: 'addition', groups: vals.map(cap) };
    }
    // Subtraction: a - b (subtrahend taken away from minuend)
    const mSub = p.match(/(\d+)\s*[-−–]\s*(\d+)/);
    if (mSub) {
      const a = +mSub[1], b = +mSub[2];
      if (a > 20 || b > 20 || b > a) return null;
      return { op: 'subtraction', minuend: cap(a), subtrahend: cap(b), groups: [cap(a)] };
    }
    // Multiplication: a × b (a equal groups of b; single voice; cap <= 20)
    const mMul = p.match(/(\d+)\s*[×*]\s*(\d+)/);
    if (mMul) {
      const a = +mMul[1], b = +mMul[2];
      if (a > 10 || b > 10 || a * b > 20) return null;
      const res = [];
      for (let i = 0; i < a; i++) res.push(cap(b));
      return { op: 'multiplication', groups: res, singleVoice: true };
    }
    // Division: a : b (partitioned into b equal groups; single voice)
    const mDiv = p.match(/(\d+)\s*:\s*(\d+)/);
    if (mDiv) {
      const a = +mDiv[1], b = +mDiv[2];
      if (a > 20 || b <= 0 || a % b !== 0) return null;
      const each = a / b, res = [];
      for (let i = 0; i < b; i++) res.push(cap(each));
      return { op: 'division', groups: res, singleVoice: true };
    }
    // Comparison: a vs b
    const mCmp = p.match(/(\d+)\s*(?:[><=]|מול|לעומת|או)\s*(\d+)/);
    if (mCmp) {
      const a = +mCmp[1], b = +mCmp[2];
      if (a > 20 || b > 20) return null;
      return { op: 'compare', groups: [cap(a), cap(b)] };
    }
    // Emoji / counting symbols
    const emoji = p.match(/[🥁👏♪•]+/g);
    if (emoji && emoji.length) {
      const c = emoji.map(s => Array.from(s).length).filter(n => n > 0 && n <= 20);
      if (c.length) return { op: 'counting', groups: c.slice(0, 4).map(cap) };
    }
    // Single counting number
    const nums = p.match(/\b\d+\b/g);
    if (nums && nums.length === 1 && +nums[0] <= 20) return { op: 'counting', groups: [cap(+nums[0])] };
    return null;
  }

  function extractNumberPlan(it, options) {
    const parsed = parseNumberGroups(it);
    if (!parsed || !parsed.groups || !parsed.groups.length) return null;
    const bpm = Number(options && options.bpm) || (options && options.seed ? 90 + (options.seed % 35) : 105);
    const beat = 60 / bpm, pause = beat * 1.5;
    const groups = [], notes = [];
    let t = 0, gIdx = 0;

    if (parsed.op === 'subtraction') {
      const a = parsed.minuend, b = parsed.subtrahend;
      const v = DEFAULT_VOICES[0], takeVoice = DEFAULT_VOICES[1];
      groups.push({ index: 0, count: a, startIndex: 0, voice: v.voice, hz: v.hz, instrument: v.instrument, he: v.he });
      for (let k = 0; k < a; k++) {
        notes.push({ index: gIdx++, at: t, groupIndex: 0, noteInGroup: k + 1, groupCount: a, voice: v.voice, hz: v.hz, action: 'count' });
        t += beat;
      }
      t += pause;
      for (let k = 0; k < b; k++) {
        notes.push({ index: gIdx++, at: t, groupIndex: 0, targetDot: a - 1 - k, noteInGroup: k + 1, groupCount: b, voice: takeVoice.voice, hz: 220 - k * 15, action: 'takeaway' });
        t += beat;
      }
      return { op: parsed.op, bpm: bpm, beat: beat, totalSounds: a, groups: groups, notes: notes, duration: t, minuend: a, subtrahend: b };
    }

    const useSingleVoice = Boolean(parsed.singleVoice);
    const baseVoice = DEFAULT_VOICES[parsed.op === 'multiplication' ? 2 : 0];

    parsed.groups.forEach(function (count, gi) {
      const v = useSingleVoice ? baseVoice : DEFAULT_VOICES[gi % DEFAULT_VOICES.length];
      const hasTens = parsed.op === 'addition' && count >= 10;
      const tens = hasTens ? Math.floor(count / 10) : 0;
      const ones = hasTens ? (count % 10) : count;

      groups.push({ index: gi, count: count, tens: tens, ones: ones, startIndex: gIdx, voice: v.voice, hz: v.hz, instrument: v.instrument, he: v.he });
      for (let k = 0; k < tens; k++) {
        notes.push({ index: gIdx++, at: t, groupIndex: gi, noteInGroup: (k + 1) * 10, groupCount: count, voice: 'drumLow', hz: 110, kind: 'ten', isTen: true, action: 'count' });
        t += beat;
      }
      for (let k = 0; k < ones; k++) {
        notes.push({ index: gIdx++, at: t, groupIndex: gi, noteInGroup: (tens ? '10+' : '') + (k + 1), groupCount: count, voice: v.voice, hz: v.hz, kind: 'one', isTen: false, action: 'count' });
        t += beat;
      }
      if (gi < parsed.groups.length - 1) t += pause;
    });

    return { op: parsed.op, bpm: bpm, beat: beat, totalSounds: notes.length, groups: groups, notes: notes, duration: t };
  }

  function renderHtml(plan) {
    if (!plan || !plan.totalSounds) return '';
    const groupsHtml = plan.groups.map(function (g, gi) {
      const dots = [];
      const tens = g.tens || 0, ones = (g.ones != null) ? g.ones : g.count;
      for (let k = 0; k < tens; k++) dots.push('<span class="np-dot np-ten" data-group="' + gi + '" data-note-idx="' + (g.startIndex + k) + '" title="עשרת" aria-label="עשרת"></span>');
      for (let k = 0; k < ones; k++) dots.push('<span class="np-dot np-one" data-group="' + gi + '" data-note-idx="' + (g.startIndex + tens + k) + '" aria-hidden="true"></span>');
      return '<div class="np-group" data-group="' + gi + '" aria-label="קבוצה ' + (gi + 1) + '">' + dots.join('') + '</div>';
    }).join('<span class="np-gap" aria-hidden="true">|</span>');

    return '<div class="number-play-strip np-strip" dir="rtl" data-total-sounds="' + plan.totalSounds + '" data-op="' + (plan.op || '') + '" role="region" aria-label="השמעת המספרים">'
      + '<button type="button" class="number-play-btn np-btn" data-act="play-numbers" aria-label="השמעת המספרים" style="min-width:44px;min-height:44px">'
      + '<span class="np-icon" aria-hidden="true">▶</span> <span class="np-label">השמעת המספרים</span></button>'
      + '<div class="number-play-circles np-circles" aria-hidden="true">' + groupsHtml + '</div>'
      + '<div class="sr-only np-announcer" role="status" aria-live="polite"></div></div>';
  }

  function play(plan, callbacks, options) {
    if (!plan || !plan.notes || !plan.notes.length) return { stop: function () {} };
    const cb = callbacks || {}, jam = getJam();
    if (jam && typeof jam.playNotes === 'function') return jam.playNotes(plan.notes, cb.onNote, cb.onEnd);

    let stopped = false, timers = [];
    plan.notes.forEach((n, i) => {
      timers.push(setTimeout(() => { if (!stopped && cb.onNote) cb.onNote(n, i); }, Math.max(0, n.at * 1000)));
    });
    timers.push(setTimeout(() => { if (!stopped && cb.onEnd) cb.onEnd(); }, Math.max(0, plan.duration * 1000 + 100)));
    return { stop: () => { stopped = true; timers.forEach(clearTimeout); } };
  }

  function mount(container, item, options) {
    if (!container) return null;
    const plan = extractNumberPlan(item, options);
    if (!plan) { container.innerHTML = ''; container.classList.add('hidden'); return null; }
    container.classList.remove('hidden');
    container.innerHTML = renderHtml(plan);

    const btn = container.querySelector('[data-act="play-numbers"]');
    const dots = container.querySelectorAll('.np-dot');
    const announcer = container.querySelector('.np-announcer');
    let activeHandle = null;

    function handlePlay() {
      if (activeHandle && typeof activeHandle.stop === 'function') activeHandle.stop();
      dots.forEach(d => { d.classList.remove('lit'); d.classList.remove('taken'); });
      if (btn) btn.setAttribute('aria-pressed', 'true');
      activeHandle = play(plan, {
        onNote: (n, idx) => {
          if (n.action === 'takeaway') {
            if (dots[n.targetDot]) { dots[n.targetDot].classList.remove('lit'); dots[n.targetDot].classList.add('taken'); }
            if (announcer) announcer.textContent = 'הפחתה: נלקח צליל ' + n.noteInGroup + ' מתוך ' + n.groupCount;
          } else {
            if (dots[idx]) dots[idx].classList.add('lit');
            if (announcer) announcer.textContent = 'קבוצה ' + (n.groupIndex + 1) + ': צליל ' + n.noteInGroup + ' מתוך ' + n.groupCount;
          }
        },
        onEnd: () => {
          if (btn) btn.setAttribute('aria-pressed', 'false');
          if (announcer) announcer.textContent = 'סיום השמעה: ' + plan.totalSounds + ' צלילים';
        }
      }, options);
    }
    if (btn) btn.addEventListener('click', handlePlay);
    return { plan: plan, play: handlePlay, stop: () => { if (activeHandle && activeHandle.stop) activeHandle.stop(); } };
  }

  return { parseNumberGroups, extractNumberPlan, renderHtml, play, mount, DEFAULT_VOICES, shouldSkip };
});
