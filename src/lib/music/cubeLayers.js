// MelodyMath — the cube-layer widget for box-volume items (Refs #864, #665).
// One way, cubeLayerGroups (same sound as LoopStack, grade2Music.cubeLayerSounds):
// a layer is a group, and layers play one after another, never together. Up to
// 12 a layer is one beat per cube; above 12 a ten is one held sound and the
// ones are clicks. Layers alternate two instrument families. Round 1 «ביחד»
// plays; round 2 «עכשיו לבד» is silent, and is reached only by a checked right
// answer. The opening sound is openCue → playItemMusic → playFor, not bind.
(function (root, factory) {
  const IN_NODE = typeof module === 'object' && !!module.exports;
  const api = factory(IN_NODE ? require('./loopStack.js') : root.MM_LOOP_STACK, root);
  if (IN_NODE) module.exports = api;
  else root.MM_CUBE_LAYERS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (LS, root) {
  'use strict';

  const WAY = 'cubeLayerGroups';
  const STEP = 0.22, BEAT_DUR = 0.18, TEN_STEP = 0.5, TEN_DUR = 0.4, LAYER_GAP = 0.44;
  // Two families, so a child hears where one layer ends and the next begins.
  const FAMILIES = [['djembe', 'percussion', 'drumHigh', 330], ['charango', 'strings', 'pluck', 392]];
  const ROUNDS = ['together', 'alone', 'done'];
  const MIN_HZ = 220; // a held ten below this is lost on phone speakers
  let current = null;

  function n(s) { const v = Number(s); return Number.isInteger(v) && v > 0 ? v : null; }

  // Layers and cubes per layer from the prompt. Two boxes, or cubes taken
  // out, are not one stack of equal layers: no widget.
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

  // Which family plays group i. One layer: its rows alternate instead.
  function familyOf(i) { return FAMILIES[i % FAMILIES.length]; }

  // The notes of one group, from `start`: LoopStack's split (beats up to 12,
  // tens and ones above) with its own timing, so each note ends before the next.
  function groupNotes(cubes, fam, start, group) {
    const out = [];
    let at = start;
    if (cubes <= 12) {
      for (let i = 0; i < cubes; i++) { out.push({ at: at, dur: BEAT_DUR, voice: fam[2], hz: fam[3], family: fam[1], group: group, place: 'unit' }); at += STEP; }
      return out;
    }
    const tens = Math.floor(cubes / 10), ones = cubes % 10;
    const tenHz = Math.max(MIN_HZ, LS && LS.audibleHz ? LS.audibleHz(fam[2], 110) : MIN_HZ);
    for (let t = 0; t < tens; t++) { out.push({ at: at, dur: TEN_DUR, voice: fam[2], hz: tenHz, family: fam[1], group: group, place: 'ten', gain: 0.28 }); at += TEN_STEP; }
    const oneHz = LS && LS.audibleHz ? LS.audibleHz('woodClick', 1173) : 1173;
    for (let j = 0; j < ones; j++) { out.push({ at: at, dur: BEAT_DUR, voice: 'woodClick', hz: oneHz, family: fam[1], group: group, place: 'one' }); at += STEP; }
    return out;
  }

  // The whole plan for a round. «עכשיו לבד» has no notes at all.
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

  // Right answer moves on one round; a wrong one stays where it is.
  function nextRound(round, correct) {
    const i = ROUNDS.indexOf(round);
    if (i < 0) return ROUNDS[0];
    return correct ? ROUNDS[Math.min(i + 1, ROUNDS.length - 1)] : round;
  }

  // noGo: no answer box to check (class and beat screens), so no «עכשיו לבד».
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

  // Per audio context, until when layers sound: a double tap never stacks them.
  const busy = typeof WeakMap === 'function' ? new WeakMap() : null;

  function play(spec, round, env) {
    const notes = plan(spec, round);
    if (!notes.length) return null;
    const e = env || {};
    const pv = e.playVoice || (root && root.playVoice);
    const ac = e.audioContext || (root && typeof root.getSharedAudioContext === 'function' ? root.getSharedAudioContext() : null);
    if (typeof pv !== 'function' || !ac) return null;
    if (ac.state === 'suspended' && ac.resume) { try { ac.resume(); } catch (err) { /* autoplay */ } }
    // Still playing counts as sounding, so openCue adds no chime on top.
    if (busy && ac.currentTime < (busy.get(ac) || -1)) return { notes: 0, busy: true };
    const t0 = ac.currentTime + 0.05, last = notes[notes.length - 1];
    if (busy) busy.set(ac, t0 + last.at + last.dur);
    notes.forEach(function (x) { pv(ac, x.voice, x.hz, t0 + x.at, null, { dur: x.dur, gain: x.gain || 0.16 }); });
    return { notes: notes.length };
  }

  // The child's answer, read from the page; empty is never right.
  function given(env) { const v = env && typeof env.read === 'function' ? env.read() : ''; return String(v == null ? '' : v).trim(); }
  function answerIsRight(env) {
    const g = given(env);
    if (!g || env.answer == null) return false;
    return typeof env.check === 'function' ? !!env.check(g) : Number(g.replace(/,/g, '')) === Number(env.answer);
  }

  // Binds the widget to a host element; round 2 replaces the play button.
  function bind(host, spec, env) {
    if (!host || !spec) return false;
    let round = 'together';
    const noGo = !(env && typeof env.read === 'function');
    const draw = function () { host.innerHTML = html(spec, round, noGo); };
    draw();
    host.onclick = function (ev) {
      const t = ev && ev.target && ev.target.closest ? ev.target : null;
      if (t && t.closest('.snd-play')) play(spec, round, env);
      else if (t && t.closest('.cube-go-alone')) {
        const ok = answerIsRight(env);
        round = nextRound(round, ok); draw();
        // An empty box is asked for, not called wrong (same line as askForAnswer).
        if (!ok) host.innerHTML += '<p class="cube-try" role="status">' + (given(env) ?'עוד לא. הקשיבו שוב לשכבות ונסו שוב.' : 'כתבו תשובה קודם 🙂') + '</p>';
      }
    };
    current = { item: (env || {}).item, spec: spec, round: function () { return round; }, env: env };
    return true;
  }

  // The opening sound (openCue → playItemMusic → playFor): the bound item in
  // its round, or, with no widget on screen (practice), the item's own layers.
  function playFor(item) {
    if (current && item && current.item === item) return play(current.spec, current.round(), current.env);
    const s = specForItem(item);
    return s ? play(s, 'together') : null;
  }

  return { WAY, FAMILIES, ROUNDS, MIN_HZ, parse, specForItem, plan, nextRound, html, play, bind, playFor, answerIsRight };
});
