// MelodyMath — NumberPlay module (Issue #686, Refs #665).
// Plays the numbers of any arithmetic exercise with visual circles and distinct instruments.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_NUMBER_PLAY = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  function need(p) { try { return require(p); } catch (e) { return null; } }
  function getJam() { return (root && root.MM_JAM) || need('./jamKit.js'); }

  const DEFAULT_VOICES = [
    { voice: 'drumLow', hz: 220, instrument: 'darbuka', he: 'דרבוקה' },
    { voice: 'woodBar', hz: 330, instrument: 'marimba', he: 'מרימבה' },
    { voice: 'metalBell', hz: 440, instrument: 'handbells', he: 'פעמונים' },
    { voice: 'tine', hz: 550, instrument: 'kalimba', he: 'קלימבה' }
  ];

  function cap(n) { return Math.max(1, Math.min(12, Math.round(Number(n) || 1))); }

  function parseNumberGroups(it) {
    if (!it) return null;
    if (typeof it === 'object' && Array.isArray(it.hear) && it.hear.length > 0) return it.hear.map(cap);
    const p = typeof it === 'string' ? it : (it.prompt || '');
    if (!p) return null;

    const mAdd = p.match(/(\d+)\s*\+\s*(\d+)/);
    if (mAdd) return [+mAdd[1], +mAdd[2]].map(cap);
    const mSub = p.match(/(\d+)\s*[-−–]\s*(\d+)/);
    if (mSub) return [+mSub[1], +mSub[2]].map(cap);
    const mMul = p.match(/(\d+)\s*[×*]\s*(\d+)/);
    if (mMul) {
      const a = +mMul[1], b = +mMul[2];
      if (a >= 1 && b >= 1 && a * b <= 16) {
        const res = [];
        for (let i = 0; i < a; i++) res.push(cap(b));
        return res;
      }
      return [cap(a), cap(b)];
    }
    const mDiv = p.match(/(\d+)\s*[:/]\s*(\d+)/);
    if (mDiv) return [+mDiv[1], +mDiv[2]].map(cap);
    const mCmp = p.match(/(\d+)\s*(?:[><=]|מול|לעומת|או)\s*(\d+)/);
    if (mCmp) return [+mCmp[1], +mCmp[2]].map(cap);

    const emoji = p.match(/[🥁👏♪•]+/g);
    if (emoji && emoji.length) {
      const c = emoji.map(s => Array.from(s).length).filter(n => n > 0);
      if (c.length) return c.slice(0, 4).map(cap);
    }
    const nums = p.match(/\b\d+\b/g);
    if (nums && nums.length >= 2) return [+nums[0], +nums[1]].map(cap);
    if (nums && nums.length === 1) return [+nums[0]].map(cap);
    if (typeof it === 'object' && it.answer != null && Number.isInteger(+it.answer) && +it.answer > 0 && +it.answer <= 20) {
      return [cap(+it.answer)];
    }
    return null;
  }

  function extractNumberPlan(it, options) {
    const raw = parseNumberGroups(it);
    if (!raw || !raw.length) return null;
    const bpm = Number(options && options.bpm) || 110;
    const beat = 60 / bpm;
    const pause = beat * 1.5;
    const groups = [], notes = [];
    let t = 0, gIdx = 0;

    raw.forEach(function (count, gi) {
      const v = DEFAULT_VOICES[gi % DEFAULT_VOICES.length];
      groups.push({ index: gi, count: count, startIndex: gIdx, voice: v.voice, hz: v.hz, instrument: v.instrument, he: v.he });
      for (let k = 0; k < count; k++) {
        notes.push({ index: gIdx++, at: t, groupIndex: gi, noteInGroup: k + 1, groupCount: count, voice: v.voice, hz: v.hz });
        t += beat;
      }
      if (gi < raw.length - 1) t += pause;
    });

    return { bpm: bpm, beat: beat, totalSounds: notes.length, groups: groups, notes: notes, duration: t };
  }

  function renderHtml(plan) {
    if (!plan || !plan.totalSounds) return '';
    const groupsHtml = plan.groups.map(function (g, gi) {
      const dots = [];
      for (let k = 0; k < g.count; k++) dots.push('<span class="np-dot" data-group="' + gi + '" data-note-idx="' + (g.startIndex + k) + '" aria-hidden="true"></span>');
      return '<div class="np-group" data-group="' + gi + '" aria-label="קבוצה ' + (gi + 1) + '">' + dots.join('') + '</div>';
    }).join('<span class="np-gap" aria-hidden="true">|</span>');

    return '<div class="number-play-strip np-strip" dir="rtl" data-total-sounds="' + plan.totalSounds + '" role="region" aria-label="השמעת המספרים">'
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
      dots.forEach(d => d.classList.remove('lit'));
      if (btn) btn.setAttribute('aria-pressed', 'true');
      activeHandle = play(plan, {
        onNote: (n, idx) => {
          if (dots[idx]) dots[idx].classList.add('lit');
          if (announcer) announcer.textContent = 'קבוצה ' + (n.groupIndex + 1) + ': צליל ' + n.noteInGroup + ' מתוך ' + n.groupCount;
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

  return { parseNumberGroups, extractNumberPlan, renderHtml, play, mount, DEFAULT_VOICES };
});
