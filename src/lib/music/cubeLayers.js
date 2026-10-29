// Cube-layer widget for box volume (Refs #864, #665). Layers never overlap. «עכשיו לבד» is silent.
(function (root, factory) {
  const IN_NODE = typeof module === 'object' && !!module.exports;
  const api = factory(IN_NODE ? require('./loopStack.js') : root.MM_LOOP_STACK, root);
  if (IN_NODE) module.exports = api;
  else root.MM_CUBE_LAYERS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (LS, root) {
  'use strict';
  const WAY = 'cubeLayerGroups';
  const STEP = 0.22, BEAT_DUR = 0.18, TEN_STEP = 0.5, TEN_DUR = 0.4, LAYER_GAP = 0.44;
  const FAMILIES = [['djembe', 'percussion', 'drumHigh', 330], ['charango', 'strings', 'pluck', 392]];
  const ROUNDS = ['together', 'alone', 'done'];
  function grade1() { if (root && typeof root.chart100Events === 'function') return root; try { return require('../grade1Music.js'); } catch (e) { return {}; } }
  const SHARED = (function () { const ev = grade1().chart100Events ? grade1().chart100Events(10) : []; const t = ev.filter(function (e) { return e && Array.isArray(e.partials) && e.hz; })[0]; return t || { hz: 110, partials: [[2, 0.8], [3, 0.55], [4, 0.35]] }; })(), TEN_HZ = SHARED.hz, TEN_PARTIALS = SHARED.partials;
  let current = null;
  const busy = typeof WeakMap === 'function' ? new WeakMap() : null;
  const outs = typeof WeakMap === 'function' ? new WeakMap() : null;
  function n(s) { const v = Number(s); return Number.isInteger(v) && v > 0 ? v : null; }
  function parse(prompt) {
    const p = String(prompt == null ? '' : prompt);
    if (!/שכב/.test(p) || /תיבה שנייה|הוצאנו/.test(p)) return null;
    let per = null, rows = null, m;
    if ((m = p.match(/(\d+) שורות של (\d+) קוביות/)) || (m = p.match(/(\d+) שורות, ובכל שורה (\d+) קוביות/))) {
      rows = n(m[1]); per = rows && n(m[2]) ? rows * n(m[2]) : null;
    } else if ((m = p.match(/שכבות של (\d+) קוביות/)) || (m = p.match(/בכל שכבה (\d+) קוביות/))) {
      per = n(m[1]);
    }
    let layers = null;
    if (/משכבה אחת/.test(p)) layers = 1;
    else if ((m = p.match(/מ־?(\d+) שכבות/))) layers = n(m[1]);
    else if ((m = p.match(/בתיבה (\d+) קוביות/)) && per && n(m[1]) % per === 0) layers = n(m[1]) / per;
    if (layers && /עוד שכבה/.test(p)) layers += 1;
    if (!per || !layers || per > 100 || layers > 10) return null;
    return { layers: layers, perLayer: per, rows: rows, total: layers * per };
  }
  function specForItem(item) {
    if (!item || typeof item !== 'object' || item.music !== WAY) return null;
    return parse(item.prompt);
  }
  function familyOf(i) { return FAMILIES[i % FAMILIES.length]; }
  function groupNotes(cubes, fam, start, group) {
    const out = [];
    let at = start;
    if (cubes <= 12) {
      for (let i = 0; i < cubes; i++) { out.push({ at: at, dur: BEAT_DUR, voice: fam[2], hz: fam[3], family: fam[1], group: group, place: 'unit' }); at += STEP; }
      return out;
    }
    const tens = Math.floor(cubes / 10), ones = cubes % 10;
    for (let t = 0; t < tens; t++) { out.push({ at: at, dur: TEN_DUR, voice: fam[2], hz: TEN_HZ, family: fam[1], group: group, place: 'ten', gain: 0.28, partials: TEN_PARTIALS }); at += TEN_STEP; }
    const oneHz = LS && LS.audibleHz ? LS.audibleHz('woodClick', 1173) : 1173;
    for (let j = 0; j < ones; j++) { out.push({ at: at, dur: BEAT_DUR, voice: 'woodClick', hz: oneHz, family: fam[1], group: group, place: 'one' }); at += STEP; }
    return out;
  }
  function plan(spec, round) {
    if (!spec || round !== 'together') return [];
    const split = spec.layers === 1 && spec.rows > 1;
    const groups = split ? spec.rows : spec.layers, size = split ? spec.perLayer / spec.rows : spec.perLayer;
    const notes = [];
    let at = 0;
    for (let g = 0; g < groups; g++) {
      const part = groupNotes(size, familyOf(g), at, g);
      Array.prototype.push.apply(notes, part);
      const last = part[part.length - 1];
      at = last.at + last.dur + LAYER_GAP;
    }
    return notes;
  }
  function nextRound(round, correct) {
    const i = ROUNDS.indexOf(round);
    if (i < 0) return ROUNDS[0];
    return correct ? ROUNDS[Math.min(i + 1, ROUNDS.length - 1)] : round;
  }
  function choiceStep(round, correct) {
    const r = round === 'alone' ? 'alone' : 'together';
    if (!correct) return { round: r, advance: false, silent: r === 'alone' };
    if (r === 'together') return { round: 'alone', advance: false, silent: true };
    return { round: 'done', advance: true, silent: true };
  }
  function html(spec, round, noGo) {
    if (!spec) return '';
    const alone = round === 'alone';
    const chips = [];
    for (let i = 0; i < spec.layers; i++) chips.push('<span class="snd-circle snd-beat" role="img" aria-label="שכבה ' + (i + 1) + '">🧊</span>');
    return '<div class="snd-wrap cube-layers" data-round="' + (alone ? 'alone' : 'together') + '">'
      + (alone ? '<p class="cube-alone">עכשיו לבד: בלי צלילים. כמה קוביות בכל שכבה, וכמה שכבות?</p>'
        : '<button type="button" class="snd-play">▶ שכבה אחרי שכבה</button>' + (noGo ? '' : '<button type="button" class="cube-go-alone">עכשיו לבד</button>'))
      + '<div class="snd-circles" dir="ltr">' + chips.join('') + '</div></div>';
  }
  function audioOf(env) {
    const e = env || {};
    return e.audioContext || (root && typeof root.getSharedAudioContext === 'function' ? root.getSharedAudioContext() : null);
  }
  function hush(ac) {
    const g = outs && ac && outs.get(ac);
    if (g && g.gain && g.gain.setValueAtTime) { try { g.gain.setValueAtTime(0, ac.currentTime || 0); } catch (err) { /* gone */ } }
    if (busy && ac) busy.set(ac, -1);
  }
  function play(spec, round, env) {
    const notes = plan(spec, round);
    if (!notes.length) return null;
    const e = env || {};
    const pv = e.playVoice || (root && root.playVoice);
    const ac = audioOf(e);
    if (typeof pv !== 'function' || !ac) return null;
    if (ac.state === 'suspended' && ac.resume) { try { ac.resume(); } catch (err) { /* autoplay */ } }
    if (busy && ac.currentTime < (busy.get(ac) || -1)) return { notes: 0, busy: true };
    const t0 = ac.currentTime + 0.05, last = notes[notes.length - 1];
    if (busy) busy.set(ac, t0 + last.at + last.dur);
    let bus = null;
    if (typeof ac.createGain === 'function') {
      bus = ac.createGain();
      if (bus.gain) bus.gain.value = 1;
      if (ac.destination && bus.connect) bus.connect(ac.destination);
      if (outs) outs.set(ac, bus);
    }
    notes.forEach(function (x) {
      const parts = x.partials || [], share = (x.gain || 0.16) / (1 + parts.reduce(function (s, p) { return s + p[1]; }, 0));
      pv(ac, x.voice, x.hz, t0 + x.at, bus, { dur: x.dur, gain: share }); parts.forEach(function (p) { pv(ac, 'organ', x.hz * p[0], t0 + x.at, bus, { dur: x.dur, gain: share * p[1] }); });
    });
    return { notes: notes.length };
  }
  function given(env) { const v = env && typeof env.read === 'function' ? env.read() : ''; return String(v == null ? '' : v).trim(); }
  function answerIsRight(env) {
    const g = given(env);
    if (!g || env.answer == null) return false;
    return typeof env.check === 'function' ? !!env.check(g) : Number(g.replace(/,/g, '')) === Number(env.answer);
  }
  function quietCard(host) {
    const card = host && host.closest && host.closest('.card');
    if (card && card.querySelectorAll) card.querySelectorAll('.number-play-slot, .music-way, .mm-pad, .mm-pad-key, .snd-play, .np-btn, .g3-play, .way-play-btn, [data-act="play-numbers"]').forEach(function (el) { if (el.classList) el.classList.add('hidden'); });
  }
  function bind(host, spec, env) {
    if (!host || !spec) return false;
    let round = env && env.round === 'alone' ? 'alone' : 'together';
    const noGo = !(env && typeof env.read === 'function');
    const draw = function () { host.innerHTML = html(spec, round, noGo); if (round === 'alone') quietCard(host); };
    draw();
    host.onclick = function (ev) {
      const t = ev && ev.target && ev.target.closest ? ev.target : null;
      if (t && t.closest('.snd-play')) play(spec, round, env);
      else if (t && t.closest('.cube-go-alone')) {
        const ok = answerIsRight(env);
        round = nextRound(round, ok);
        if (round === 'alone') hush(audioOf(env));
        draw();
        if (!ok) host.innerHTML += '<p class="cube-try" role="status">' + (given(env) ? 'עוד לא. הקשיבו שוב לשכבות ונסו שוב.' : 'כתבו תשובה קודם 🙂') + '</p>';
      }
    };
    current = { item: (env || {}).item, spec: spec, round: function () { return round; }, env: env };
    return true;
  }
  function playFor(item) {
    if (current && item && current.item === item) return play(current.spec, current.round(), current.env);
    const s = specForItem(item);
    return s ? play(s, 'together') : null;
  }
  return { WAY, FAMILIES, ROUNDS, TEN_HZ, TEN_PARTIALS, parse, specForItem, plan, nextRound, choiceStep, html, play, hush, bind, playFor, answerIsRight };
});
