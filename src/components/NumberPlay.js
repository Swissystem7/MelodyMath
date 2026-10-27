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
  const sources = { gelman1978: ['Gelman & Gallistel 1978 — The Child\'s Understanding of Number (Harvard University Press)', 'https://www.hup.harvard.edu/books/9780674116375'] };
  function itemOf(it) { return typeof it === 'string' ? { prompt: it } : (it || {}); }
  function inRange(n) { return Number.isInteger(n) && n >= 1 && n <= 20; }
  function ints(p) { const m = String(p).match(/\d+/g); return m ? m.map(Number) : []; }
  function groupsOf(n, size) { return Array.from({ length: n }, function () { return size; }); }
  function asTens(total) {
    const tens = Math.floor(total / 10), ones = total % 10, out = [];
    if (tens) out.push({ n: tens, v: 10 });
    if (ones) out.push({ n: ones, v: 1 });
    return out;
  }
  // One entry per original group. Tens and ones stay inside that group so a
  // product such as 5×20 is five groups of two tens, not ten loose tens.
  function bundle(groups) {
    return groups.map(function (c) { return c > 12 ? asTens(c) : [{ n: c, v: 1 }]; });
  }
  function skip(it) {
    const p = String(it.prompt || '');
    if (/fraction|decimal|percent/.test(String(it.skill || ''))) return true;
    return /\d+\s*\/\s*\d+/.test(p) || /%/.test(p) || /\d+\.\d+/.test(p) || /\d{1,2}:\d{2}/.test(p);
  }
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
    // Fair sharing (Carpenter et al. 1999): a ÷ b deals a sounds into b equal groups.
    const div = p.match(/(\d+)\s*[÷:]\s*(\d+)/);
    if (div) {
      const a = +div[1], b = +div[2];
      return inRange(b) && a <= 100 && a % b === 0 && inRange(a / b) ? { op: 'division', groups: groupsOf(b, a / b) } : null;
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
      if (op === 'multiplication' && heard.length >= 2) return heard[0] * heard[1] <= 100 ? { op: op, groups: groupsOf(heard[0], heard[1]) } : null;
      return { op: op, groups: heard.slice(0, 4) };
    }
    const nums = ints(p).filter(inRange);
    if ((item.wordType === 'compare' || /גדול|קטן|השוו/.test(p)) && nums.length === 2 && !/[+×xX*\-−–]/.test(p)) return { op: 'compare', groups: nums };
    if (skill === 'multiplication' && nums.length === 2 && nums[0] * nums[1] <= 100 && !/☐/.test(p)) return { op: 'multiplication', groups: groupsOf(nums[0], nums[1]) };
    if (skill === 'counting' && nums.length === 1 && /^\s*\d+\s*$/.test(p)) return { op: 'counting', groups: nums };
    return null;
  }
  function chosenInstrument(opts) {
    const byId = instruments() && instruments().instrumentById;
    function ok(id) { return byId && id ? byId(id) : null; }
    const explicit = opts && (opts.instrument || opts.chosenInstrument);
    if (explicit) return ok(explicit);
    const mine = (root && root.MM_MY_INSTRUMENT) || need('../lib/myInstrument.js');
    try { if (mine && mine.instrumentFor) return ok(mine.instrumentFor(null, null, opts && opts.storage)); } catch (e) { /* store absent */ }
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
      out.push({ instrument: x.id, family: x.family, voice: x.voice, he: x.instrument.he, hz: Math.max(120, HZ[x.voice] || 330) });
    }
    return out;
  }
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
    const counts = bundle(parsed.groups);
    const voices = voicesFor(counts.length, opts);
    const groups = [];
    const notes = [];
    let t = 0;
    counts.forEach(function (parts, gi) {
      const v = voices[gi] || voices[0];
      const sounds = parts.reduce(function (s, p) { return s + p.n; }, 0);
      const value = parts.reduce(function (s, p) { return s + p.n * p.v; }, 0);
      const pure = parts.length === 1;
      const take = parsed.op === 'subtraction' && gi === 1;
      const hzGroup = pure && parts[0].v === 10 ? Math.max(120, Math.round(v.hz / 2)) : v.hz;
      groups.push({ index: gi, count: pure ? parts[0].n : sounds, each: pure ? parts[0].v : 1, value: value, startIndex: notes.length, instrument: v.instrument, family: v.family, voice: v.voice, hz: hzGroup, he: v.he, take: take });
      let heard = 0;
      parts.forEach(function (p) {
        const hz = p.v === 10 ? Math.max(120, Math.round(v.hz / 2)) : v.hz;
        for (let k = 0; k < p.n; k++) {
          heard += 1;
          notes.push({ index: notes.length, at: t, groupIndex: gi, voice: v.voice, hz: hz, value: p.v, inGroup: heard, groupCount: sounds, take: take });
          t += beat;
        }
      });
      if (gi < counts.length - 1) t += beat;
    });
    const totalValue = notes.reduce(function (s, n) { return s + n.value; }, 0);
    return { op: parsed.op, bpm: bpm, beat: beat, grade: grade, totalSounds: notes.length, totalValue: totalValue, groups: groups, notes: notes, duration: t };
  }
  function renderHtml(plan) {
    if (!plan || !plan.totalSounds) return '';
    const groups = plan.groups.map(function (g, gi) {
      let dots = '';
      plan.notes.forEach(function (n) {
        if (n.groupIndex !== gi) return;
        dots += '<span class="np-dot' + (n.value === 10 ? ' np-ten' : '') + (n.take ? ' np-take' : '') + '" data-value="' + n.value + '" data-group="' + gi + '" data-i="' + n.index + '">' + (n.value === 10 ? '10' : '') + '</span>';
      });
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
      Array.prototype.forEach.call(dots, function (d) { d.classList.remove('lit'); d.classList.remove('taken'); });
      let heard = 0, taken = 0;
      const lit = [];
      handle = play(plan, function (n, i) {
        if (n.take) {
          // Take-from: each taken sound dims one circle of the same value counted before it.
          taken += n.value || 1;
          if (dots[i]) dots[i].classList.add('taken');
          let k = lit.length - 1;
          while (k >= 0 && plan.notes[lit[k]].value !== n.value) k--;
          const d = k >= 0 ? dots[lit.splice(k, 1)[0]] : null;
          if (d) { d.classList.remove('lit'); d.classList.add('taken'); }
          if (live) live.textContent = 'לקחנו ' + taken + ', נשארו ' + (heard - taken);
          return;
        }
        if (dots[i]) dots[i].classList.add('lit');
        lit.push(i);
        heard += n.value || 1;
        if (live) live.textContent = 'נשמעו ' + heard + ' מתוך ' + plan.totalValue;
      }, function () { if (live) live.textContent = plan.op === 'subtraction' ? 'נשארו ' + (heard - taken) : 'נגמרו ' + plan.totalValue + ' צלילים'; });
    }
    if (btn) btn.addEventListener('click', go);
    return { plan: plan, play: go, stop: function () { if (handle && handle.stop) handle.stop(); } };
  }
  return { parseNumberGroups: parseNumberGroups, extractNumberPlan: extractNumberPlan, renderHtml: renderHtml, play: play, mount: mount, tempoFor: tempoFor, chosenInstrument: chosenInstrument, sources: sources };
});
