// MelodyMath — play the numbers of an exercise (#686) through jamKit.playNotes.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_NUMBER_PLAY = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  function need(p) { try { return require(p); } catch (e) { return null; } }
  function jam() { return (root && root.MM_JAM) || need('./jamKit.js'); }
  function instruments() { return (root && root.instrumentById) ? root : need('../lib/instruments.js'); }
  function metro() { return (root && root.nextBpm) ? root : need('../lib/metro.js'); }

  const HZ = { drumLow: 120, drumHigh: 180, frameDrum: 150, woodClick: 330, metalBell: 494, woodBar: 392, pluck: 220, breathy: 523, keys: 262, organ: 294, bowed: 330, reed: 349, horn: 233, drone: 130, jingle: 660, tine: 440 };
  const ORDER = ['handbells', 'balalaika', 'recorder', 'piano'];
  const LOW = { 'א': 72, 'ב': 72, 'ג': 76, 'ד': 84, 'ה': 92, 'ו': 96 };
  // One-one principle: one distinct tag per item (Gelman & Gallistel 1978, Harvard University Press).
  const sources = { gelman1978: ['Gelman & Gallistel 1978 — The Child\'s Understanding of Number (Harvard University Press)', 'https://www.hup.harvard.edu/books/9780674116375'] };

  function itemOf(it) { return typeof it === 'string' ? { prompt: it } : (it || {}); }
  function inRange(n) { return Number.isInteger(n) && n >= 1 && n <= 20; }
  function ints(p) { const m = String(p).match(/\d+/g); return m ? m.map(Number) : []; }
  function groupsOf(n, size) { return Array.from({ length: n }, function () { return size; }); }

  function skip(it) {
    const p = String(it.prompt || '');
    if (/fraction|decimal|percent/.test(String(it.skill || ''))) return true;
    return /\d+\s*\/\s*\d+/.test(p) || /%/.test(p) || /\d+\.\d+/.test(p) || /\d{1,2}:\d{2}/.test(p);
  }

  // Each sounded number is 1–20. A product may run up to 100 (the 10×10 table).
  function parseNumberGroups(it) {
    const item = itemOf(it);
    if (item.noMusic) return null;
    if (skip(item)) return null;
    const p = String(item.prompt || '');
    const skill = String(item.skill || '');
    const add = p.match(/(\d+)\s*\+\s*(\d+)(?:\s*\+\s*(\d+))?(?:\s*\+\s*(\d+))?/);
    if (add) {
      const g = [add[1], add[2], add[3], add[4]].filter(Boolean).map(Number);
      return g.every(inRange) ? { op: 'addition', groups: g } : null;
    }
    const sub = p.match(/(\d+)\s*[-−–]\s*(\d+)/);
    if (sub) {
      const a = +sub[1], b = +sub[2];
      return inRange(a) && inRange(b) && b <= a ? { op: 'subtraction', groups: [a, b] } : null;
    }
    const mul = p.match(/(\d+)\s*[×xX*]\s*(\d+)/);
    if (mul) {
      const a = +mul[1], b = +mul[2];
      return inRange(a) && inRange(b) && a * b <= 100 ? { op: 'multiplication', groups: groupsOf(a, b) } : null;
    }
    const cmp = p.match(/(\d+)\s*(?:<|>|≤|≥|=)\s*(\d+)/);
    if (cmp && inRange(+cmp[1]) && inRange(+cmp[2])) return { op: 'compare', groups: [+cmp[1], +cmp[2]] };
    if (skill === 'subtraction' && !/☐/.test(p)) {
      const pair = ints(p).filter(inRange);
      if (pair.length === 2 && pair[0] >= pair[1]) return { op: 'subtraction', groups: pair };
    }
    const heard = Array.isArray(item.hear) ? item.hear.map(Number) : null;
    if (heard && heard.length && heard.every(inRange)) {
      const op = /mult/.test(skill) ? 'multiplication' : /sub/.test(skill) ? 'subtraction' : item.wordType === 'compare' ? 'compare' : heard.length > 1 ? 'addition' : 'counting';
      return { op: op, groups: heard.slice(0, 4) };
    }
    const nums = ints(p).filter(inRange);
    if ((item.wordType === 'compare' || /גדול|קטן|השוו/.test(p)) && nums.length === 2 && !/[+×xX*\-−–]/.test(p)) return { op: 'compare', groups: nums };
    if (skill === 'multiplication' && nums.length === 2 && nums[0] * nums[1] <= 100 && !/☐/.test(p)) return { op: 'multiplication', groups: groupsOf(nums[0], nums[1]) };
    if (skill === 'counting' && nums.length === 1 && /^\s*\d+\s*$/.test(p)) return { op: 'counting', groups: nums };
    return null;
  }

  // The child's instrument (#762, then the #717 key) leads, even when forTopic
  // would not offer it. No lock check.
  function chosenInstrument(opts) {
    const byId = instruments() && instruments().instrumentById;
    function ok(id) { return byId && id ? byId(id) : null; }
    const explicit = opts && (opts.instrument || opts.chosenInstrument);
    if (explicit) return ok(explicit);
    const mine = (root && root.MM_MY_INSTRUMENT) || need('../lib/myInstrument.js');
    try {
      if (mine && mine.getMyInstrument) { const hit = ok(mine.getMyInstrument(opts && opts.storage)); if (hit) return hit; }
    } catch (e) { /* store absent */ }
    let ls = opts && opts.storage;
    if (!ls) { try { ls = root.localStorage; } catch (e) { ls = null; } }
    if (!ls || !ls.getItem) return null;
    const direct = ok(ls.getItem('mm.myInstrument') || ls.getItem('mm-tap-instrument'));
    if (direct) return direct;
    const who = (opts && opts.who) || {};
    const name = who.name ? String(who.name) : '';
    const code = String(who.classCode || '');
    const keys = [
      opts && opts.childId ? 'mm_child_inst_' + opts.childId : '',
      name ? 'mm_child_inst_' + name : '',
      name ? 'mm_child_inst_' + code + ':' + name : '',
      name ? 'mm_child_inst_' + encodeURIComponent(code) + ':' + encodeURIComponent(name) : ''
    ];
    for (let i = 0; i < keys.length; i++) { const hit = keys[i] && ok(ls.getItem(keys[i])); if (hit) return hit; }
    return null;
  }

  function voicesFor(count, opts) {
    const mod = instruments();
    const seq = [];
    const chosen = chosenInstrument(opts);
    if (chosen) seq.push(chosen);
    ORDER.forEach(function (id) {
      const x = mod.instrumentById(id);
      if (x && !seq.some(function (s) { return s.id === x.id; })) seq.push(x);
    });
    const out = [];
    while (out.length < count) {
      let x = seq[out.length % seq.length];
      if (out.length && x.family === out[out.length - 1].family) {
        const alt = seq.find(function (s) { return s.family !== out[out.length - 1].family; });
        if (alt) x = alt;
      }
      const reuse = out.filter(function (v) { return v.instrument === x.id; }).length;
      out.push({ instrument: x.id, family: x.family, voice: x.voice, he: x.instrument.he, hz: Math.max(120, Math.round((HZ[x.voice] || 330) * Math.pow(1.25, reuse))) });
    }
    return out;
  }

  // One tempo per grade. It rises with the mastery streak (metro.nextBpm),
  // never from a hash of the prompt.
  function tempoFor(grade, streak, explicit) {
    if (Number(explicit) > 0) return Math.min(140, Math.max(40, Math.round(Number(explicit))));
    const g = LOW[grade] ? grade : 'ד';
    let bpm = LOW[g];
    const m = metro();
    const steps = Math.floor(Math.max(0, Number(streak) || 0) / 3);
    for (let i = 1; i <= steps; i++) bpm = m && m.nextBpm ? m.nextBpm(bpm, i * 3, true) : bpm + 4;
    return bpm;
  }

  function extractNumberPlan(it, options) {
    const parsed = parseNumberGroups(it);
    if (!parsed) return null;
    const item = itemOf(it);
    const opts = options || {};
    const grade = opts.grade || item.grade || 'א';
    const bpm = tempoFor(grade, opts.streak, opts.bpm);
    const beat = 60 / bpm;
    const voices = voicesFor(parsed.groups.length, opts);
    const groups = [];
    const notes = [];
    let t = 0;
    parsed.groups.forEach(function (count, gi) {
      const v = voices[gi] || voices[0];
      groups.push({ index: gi, count: count, startIndex: notes.length, instrument: v.instrument, family: v.family, voice: v.voice, hz: v.hz, he: v.he });
      for (let k = 0; k < count; k++) {
        notes.push({ index: notes.length, at: t, groupIndex: gi, voice: v.voice, hz: v.hz, inGroup: k + 1, groupCount: count });
        t += beat;
      }
      if (gi < parsed.groups.length - 1) t += beat;
    });
    return { op: parsed.op, bpm: bpm, beat: beat, grade: grade, totalSounds: notes.length, groups: groups, notes: notes, duration: t };
  }

  function renderHtml(plan) {
    if (!plan || !plan.totalSounds) return '';
    const groups = plan.groups.map(function (g, gi) {
      let dots = '';
      for (let k = 0; k < g.count; k++) dots += '<span class="np-dot" data-group="' + gi + '" data-i="' + (g.startIndex + k) + '"></span>';
      return '<span class="np-group" data-group="' + gi + '">' + dots + '</span>' + (gi < plan.groups.length - 1 ? '<span class="np-gap" aria-hidden="true"></span>' : '');
    }).join('');
    const src = sources.gelman1978;
    return '<div class="np-strip" dir="rtl" data-total-sounds="' + plan.totalSounds + '" data-op="' + plan.op + '">'
      + '<button type="button" class="np-btn" data-act="play-numbers" aria-label="השמעת המספרים" style="min-width:48px;min-height:48px"><span aria-hidden="true">▶</span></button>'
      + '<span class="np-circles" aria-hidden="true">' + groups + '</span>'
      + '<span class="sr-only np-live" role="status" aria-live="polite" aria-atomic="true"></span>'
      + '<div class="music-src">מקור הדרך המוזיקלית: <a href="' + src[1] + '" target="_blank" rel="noopener">' + src[0].replace(/&/g, '&amp;') + '</a> · התאמה שעדיין לא נבדקה בנפרד</div></div>';
  }

  function play(plan, onNote, onEnd) {
    const kit = jam();
    if (!plan || !plan.notes || !plan.notes.length || !kit || !kit.playNotes) return { stop: function () {} };
    return kit.playNotes(plan.notes, onNote, onEnd);
  }

  function mount(container, item, options) {
    if (!container) return null;
    const plan = extractNumberPlan(item, options);
    if (!plan) {
      container.innerHTML = '';
      if (container.classList) container.classList.add('hidden');
      return null;
    }
    if (container.classList) container.classList.remove('hidden');
    container.innerHTML = renderHtml(plan);
    const btn = container.querySelector('[data-act="play-numbers"]');
    const live = container.querySelector('.np-live');
    let handle = null;
    function go() {
      if (handle && handle.stop) handle.stop();
      const dots = container.querySelectorAll('.np-dot');
      Array.prototype.forEach.call(dots, function (d) { d.classList.remove('lit'); });
      handle = play(plan, function (n, i) {
        if (dots[i]) dots[i].classList.add('lit');
        if (live) live.textContent = 'נשמעו ' + (i + 1) + ' מתוך ' + plan.totalSounds;
      }, function () { if (live) live.textContent = 'נגמרו ' + plan.totalSounds + ' צלילים'; });
    }
    if (btn) btn.addEventListener('click', go);
    return { plan: plan, play: go, stop: function () { if (handle && handle.stop) handle.stop(); } };
  }

  return { parseNumberGroups: parseNumberGroups, extractNumberPlan: extractNumberPlan, renderHtml: renderHtml, play: play, mount: mount, tempoFor: tempoFor, chosenInstrument: chosenInstrument, sources: sources };
});
