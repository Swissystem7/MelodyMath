// MelodyMath — NumberPlay module (Issue #686, Refs #665).
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_NUMBER_PLAY = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  function need(p) { try { return require(p); } catch (e) { return null; } }
  function getJam() { return (root && root.MM_JAM) || need('./jamKit.js'); }
  function getInstruments() {
    if (root && root.MM_INSTRUMENTS) return root.MM_INSTRUMENTS;
    if (root && typeof root.forTopic === 'function') return root;
    return need('../lib/instruments.js');
  }
  const DEFAULT_VOICES = [
    { voice: 'drumLow', hz: 220, instrument: 'darbuka', he: 'דרבוקה' },
    { voice: 'woodClick', hz: 330, instrument: 'cajon', he: 'קחון' },
    { voice: 'woodBar', hz: 392, instrument: 'marimba', he: 'מרימבה' },
    { voice: 'metalBell', hz: 440, instrument: 'handbells', he: 'פעמוני יד' }
  ];
  function cap(n) { return Math.max(1, Math.min(20, Math.round(Number(n) || 1))); }
  function hashStr(str) {
    let h = 0, s = String(str || '');
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0x7fffffff;
    return h;
  }
  function resolveTopicKey(it, parsedOp) {
    const raw = String((it && (it.mathTopic || it.skill || it.topicId)) || '').toLowerCase();
    if (raw.includes('mult') || raw.includes('כפל') || parsedOp === 'multiplication') return 'multiplication';
    if (raw.includes('div') || raw.includes('חילוק') || parsedOp === 'division') return 'division';
    if (raw.includes('skip') || raw.includes('דילוג')) return 'skipCounting';
    if (raw.includes('pattern') || raw.includes('דגם')) return 'patterns';
    if (raw.includes('line') || raw.includes('ישר')) return 'numberLine';
    return 'counting';
  }
  function getPersistedInstrument(options) {
    if (options && options.instrument) return options.instrument;
    if (options && options.chosenInstrument) return options.chosenInstrument;
    try {
      if (typeof localStorage !== 'undefined') {
        const direct = localStorage.getItem('mm_chosen_instrument') || localStorage.getItem('mm_instrument');
        if (direct) return direct;
        for (let i = 0; i < localStorage.length; i++) {
          const k = localStorage.key(i);
          if (k && k.startsWith('mm_child_inst_')) {
            const v = localStorage.getItem(k);
            if (v) return v;
          }
        }
      }
    } catch (_) {}
    return null;
  }
  function savePersistedInstrument(instrumentId) {
    if (!instrumentId) return false;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('mm_chosen_instrument', instrumentId);
        return true;
      }
    } catch (_) {}
    return false;
  }
  function getVoicesForExercise(it, parsedOp, options) {
    const instMod = getInstruments();
    const key = resolveTopicKey(it, parsedOp);
    if (!instMod || typeof instMod.forTopic !== 'function') return DEFAULT_VOICES;
    let list = instMod.forTopic(key) || [];
    if (!list.length) return DEFAULT_VOICES;
    const chosen = getPersistedInstrument(options);
    if (chosen) {
      const idx = list.findIndex(x => x.id === chosen);
      if (idx > 0) {
        list = [list[idx]].concat(list.slice(0, idx), list.slice(idx + 1));
      } else if (idx === -1 && typeof instMod.instrumentById === 'function') {
        const inst = instMod.instrumentById(chosen);
        if (inst) list = [inst].concat(list);
      }
    }
    const hzMap = { drumLow: 220, drumHigh: 330, woodClick: 330, woodBar: 392, metalBell: 440, jingle: 494, tine: 523, frameDrum: 247, drone: 165 };
    return list.map((x, i) => ({
      voice: x.voice || 'drumLow', hz: hzMap[x.voice] || (260 + (i * 45) % 200),
      instrument: x.id, he: (x.instrument && x.instrument.he) || x.id
    }));
  }
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
      return it.hear.some(x => x > 20) ? null : { op: 'hear', groups: it.hear.map(cap) };
    }
    const p = typeof it === 'string' ? it : (it.prompt || '');
    if (!p) return null;
    const mAdd = p.match(/^(\d+)\s*\+\s*(\d+)(?:\s*\+\s*(\d+))?/);
    if (mAdd) {
      const vals = [mAdd[1], mAdd[2], mAdd[3]].filter(Boolean).map(Number);
      return (vals.some(v => v > 20) || (vals[0] + vals[1] + (vals[2] || 0) > 30)) ? null : { op: 'addition', groups: vals.map(cap) };
    }
    const mSub = p.match(/(\d+)\s*[-−–]\s*(\d+)/);
    if (mSub) {
      const a = +mSub[1], b = +mSub[2];
      return (a > 20 || b > 20 || b > a) ? null : { op: 'subtraction', minuend: cap(a), subtrahend: cap(b), groups: [cap(a)] };
    }
    const mMul = p.match(/(\d+)\s*[×*]\s*(\d+)/);
    if (mMul) {
      const a = +mMul[1], b = +mMul[2];
      if (a > 10 || b > 10 || a * b > 20) return null;
      return { op: 'multiplication', groups: Array.from({ length: a }, () => cap(b)), singleVoice: true };
    }
    const mDiv = p.match(/(\d+)\s*:\s*(\d+)/);
    if (mDiv) {
      const a = +mDiv[1], b = +mDiv[2];
      if (a > 20 || b <= 0 || a % b !== 0) return null;
      return { op: 'division', groups: Array.from({ length: b }, () => cap(a / b)), singleVoice: true };
    }
    const mCmp = p.match(/(\d+)\s*(?:[><=]|מול|לעומת|או)\s*(\d+)/);
    if (mCmp) return (+mCmp[1] > 20 || +mCmp[2] > 20) ? null : { op: 'compare', groups: [cap(+mCmp[1]), cap(+mCmp[2])] };
    const emoji = p.match(/[🥁👏♪•]+/g);
    if (emoji && emoji.length) {
      const c = emoji.map(s => Array.from(s).length).filter(n => n > 0 && n <= 20);
      if (c.length) return { op: 'counting', groups: c.slice(0, 4).map(cap) };
    }
    const nums = p.match(/\b\d+\b/g);
    if (nums && nums.length === 1 && +nums[0] <= 20) return { op: 'counting', groups: [cap(+nums[0])] };
    return null;
  }
  function extractNumberPlan(it, options) {
    const parsed = parseNumberGroups(it);
    if (!parsed || !parsed.groups || !parsed.groups.length) return null;
    const idSeed = (it && (it.id || it.prompt)) ? hashStr(it.id || it.prompt) : 0;
    const rawBpm = (options && options.seed ? 86 + (options.seed % 34) : (idSeed ? 86 + (idSeed % 34) : 96));
    const bpm = Number(options && options.bpm) || (rawBpm === 110 ? 108 : rawBpm);
    const beat = 60 / bpm, pause = beat * 1.5;
    const groups = [], notes = [];
    let t = 0, gIdx = 0;
    const topicVoices = getVoicesForExercise(it, parsed.op, options);

    if (parsed.op === 'subtraction') {
      const a = parsed.minuend, b = parsed.subtrahend;
      const v = topicVoices[0] || DEFAULT_VOICES[0], takeVoice = topicVoices[1] || DEFAULT_VOICES[1];
      groups.push({ index: 0, count: a, startIndex: 0, voice: v.voice, hz: v.hz, instrument: v.instrument, he: v.he });
      for (let k = 0; k < a; k++) { notes.push({ index: gIdx++, at: t, groupIndex: 0, noteInGroup: k + 1, groupCount: a, voice: v.voice, hz: v.hz, action: 'count' }); t += beat; }
      t += pause;
      for (let k = 0; k < b; k++) { notes.push({ index: gIdx++, at: t, groupIndex: 0, targetDot: a - 1 - k, noteInGroup: k + 1, groupCount: b, voice: takeVoice.voice, hz: 220 - k * 15, action: 'takeaway' }); t += beat; }
      return { op: parsed.op, bpm, beat, totalSounds: a, groups, notes, duration: t, minuend: a, subtrahend: b };
    }
    const useSingleVoice = Boolean(parsed.singleVoice);
    const baseVoice = topicVoices[0] || DEFAULT_VOICES[parsed.op === 'multiplication' ? 2 : 0];
    parsed.groups.forEach(function (count, gi) {
      const v = useSingleVoice ? baseVoice : topicVoices[gi % topicVoices.length];
      const hasTens = parsed.op === 'addition' && count >= 10;
      const tens = hasTens ? Math.floor(count / 10) : 0, ones = hasTens ? (count % 10) : count;
      groups.push({ index: gi, count, tens, ones, startIndex: gIdx, voice: v.voice, hz: v.hz, instrument: v.instrument, he: v.he });
      for (let k = 0; k < tens; k++) { notes.push({ index: gIdx++, at: t, groupIndex: gi, noteInGroup: (k + 1) * 10, groupCount: count, voice: 'drumLow', hz: 110, kind: 'ten', isTen: true, action: 'count' }); t += beat; }
      for (let k = 0; k < ones; k++) { notes.push({ index: gIdx++, at: t, groupIndex: gi, noteInGroup: (tens ? '10+' : '') + (k + 1), groupCount: count, voice: v.voice, hz: v.hz, kind: 'one', isTen: false, action: 'count' }); t += beat; }
      if (gi < parsed.groups.length - 1) t += pause;
    });
    return { op: parsed.op, bpm, beat, totalSounds: notes.length, groups, notes, duration: t };
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
    plan.notes.forEach((n, i) => { timers.push(setTimeout(() => { if (!stopped && cb.onNote) cb.onNote(n, i); }, Math.max(0, n.at * 1000))); });
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
    const dots = container.querySelectorAll('.np-dot'), announcer = container.querySelector('.np-announcer');
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
    return { plan, play: handlePlay, stop: () => { if (activeHandle && activeHandle.stop) activeHandle.stop(); } };
  }
  return { parseNumberGroups, extractNumberPlan, renderHtml, play, mount, DEFAULT_VOICES, shouldSkip, getVoicesForExercise, resolveTopicKey, getPersistedInstrument, savePersistedInstrument };
});
