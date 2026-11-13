// MelodyMath — CutCompose: cutting and composing shapes, heard (grades א׳–ב׳;
// tags shapeAsBar, piecesFillBar). Research:
// docs/research/cut-compose-2026-11-13.md (Perplexity + Meta AI).
//
// The hora walk we already use: a stamp is a corner, a step walks a side.
// Meta AI: the trap is counting without knowing whether a side or a point is
// counted once, twice or not at all. So:
//   a cut is a sharp click, nothing like a stamp, and it is never counted;
//   after the cut each piece is walked on its own; the side made by the cut is
//     heard in BOTH pieces, in its own timbre (it is one side, counted twice);
//   joining is the opposite: the pieces, a joining sound, then the new whole —
//     the shared side becomes a soft inner step (not silence, not gone), and a
//     joining point that lies on a straight line becomes a step, not a corner;
//   the Star of David is framed with respect (a symbol on the flag and in
//     synagogues — never cut, never a puzzle): two triangle voices, inspired by
//     klezmer, first one by one, then together.
// The widget shows only when the sounds give exactly the item's answer; never
// more than 12 sounds in a row; no answer in the picture before it is given.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_CUT_COMPOSE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TAGS = Object.freeze(['shapeAsBar', 'piecesFillBar']);
  const MAX_RUN = 12;
  const STEP = 0.3, GAP = 0.9;

  const WORLDS = Object.freeze({
    hora: { he: 'מעגל הורה', why: 'ריקוד עם ישראלי במעגל: דריכה היא פינה, וצעד הולך לאורך צלע' },
    klezmer: { he: 'בהשראת הכליזמר', why: 'מוזיקה יהודית כלית לשמחות. מגן דוד הוא סמל שמופיע על הדגל ובבתי כנסת — לא גוזרים אותו; רק מקשיבים איך שני משולשים חופפים יוצרים אותו' },
  });

  // a part: { corners, sides: [{shared}] }
  const tri = (sharedSide) => ({ corners: 3, sides: [{}, {}, { shared: !!sharedSide }] });
  const quad = (sharedSide) => ({ corners: 4, sides: [{}, {}, {}, { shared: !!sharedSide }] });

  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    const p = String(item.prompt || '').trim();
    const raw = String(item.answer).trim();
    let s = null;
    const diag = /(?:מפינה לפינה|לאורך האלכסון|באלכסון)/.test(p);
    if (/^(?:גוזרים|חותכים|חתכנו) (ריבוע|מלבן)/.test(p) && (diag || /לשני מלבנים קטנים/.test(p))) {
      const whole = 4, parts = diag ? [tri(true), tri(true)] : [quad(true), quad(true)];
      let value = null, ask = null;
      if (/כמה משולשים מתקבלים\?/.test(p)) { ask = 'pieces'; value = parts.filter((x) => x.corners === 3).length; }
      else if (/כמה מרובעים מתקבלים\?/.test(p)) { ask = 'pieces'; value = parts.filter((x) => x.corners === 4).length; }
      else if (/כמה קודקודים יש ל(?:שני החלקים|שני המשולשים) יחד\?/.test(p)) { ask = 'corners'; value = parts.reduce((a, x) => a + x.corners, 0); }
      else if (/כמה צלעות יש לשני החלקים יחד\?/.test(p)) { ask = 'sides'; value = parts.reduce((a, x) => a + x.sides.length, 0); }
      else if (/האם לכל חלק יש 4 קודקודים/.test(p)) { ask = 'keepFour'; value = parts.every((x) => x.corners === 4) ? 'כן' : 'לא'; }
      if (ask) s = { kind: 'cut', whole: whole, parts: parts, ask: ask, value: value, world: WORLDS.hora };
    } else if (/(?:מצמידים|מרכיבים) (?:מלבן מ)?שני ריבועים זהים/.test(p)) {
      const ask = /קודקודים/.test(p) ? 'corners' : /צלעות/.test(p) ? 'sides' : null;
      if (ask) s = { kind: 'join', parts: [quad(true), quad(true)], whole: { corners: 4, sides: 4, straightJoins: 2 }, ask: ask, value: 4, world: WORLDS.hora };
    } else if (/^מצמידים שני משולשים ישרי־זווית זהים לאורך הצלע הארוכה\. איזו צורה יכולה להתקבל: מלבן או מחומש\?$/.test(p)) {
      s = { kind: 'join', parts: [tri(true), tri(true)], mirror: true, whole: { corners: 4, sides: 4, straightJoins: 0 }, ask: 'shape', value: 'מלבן', world: WORLDS.hora };
    } else if (/^פירקו טרפז לריבוע ולשני משולשים\. מכמה חלקים מרכיבים אותו מחדש\?$/.test(p)) {
      s = { kind: 'join', parts: [quad(true), tri(true), tri(true)], whole: { corners: 4, sides: 4, straightJoins: 2 }, ask: 'pieces', value: 3, world: WORLDS.hora };
    } else if (/^במגן דוד מסתתרים משולשים גדולים\. כמה משולשים גדולים יש בו\?$/.test(p)) {
      s = { kind: 'star', value: 2, world: WORLDS.klezmer };
    }
    if (!s || String(s.value) !== raw) return null;   // the sounds give exactly the answer
    s.answer = String(s.value);
    const ev = soundEvents(s);
    if (!ev.length || longestRun(ev) > MAX_RUN) return null;
    return s;
  }
  function specForItem(item) { return plan(item); }

  function longestRun(ev) {
    let best = 0, run = 0, last = -9;
    [...new Set(ev.map((e) => Math.round(e.at * 1000)))].sort((a, b) => a - b).forEach((ms) => {
      const at = ms / 1000; run = at - last < 0.4 ? run + 1 : 1; last = at; best = Math.max(best, run);
    });
    return best;
  }

  // ---------------------------------------------------------------- sound
  function soundEvents(spec) {
    if (!spec) return [];
    const ev = [];
    let t = 0;
    const hit = (voice, hz, dur, gain, stage, extra) => { ev.push(Object.assign({ at: t, voice: voice, hz: hz, dur: dur, gain: gain, stage: stage }, extra || {})); };
    // walk one shape: for each side a step (the shared side in its own timbre), then the corner stamp
    const walkPart = (part, n, mirror) => {
      const sides = mirror ? part.sides.slice().reverse() : part.sides;
      sides.forEach((sd) => {
        if (sd.shared) hit('bowed', 330, 0.25, 0.2, 'sharedSide', { part: n });
        else hit('woodClick', 1300, 0.05, 0.18, 'side', { part: n });
        t += STEP;
        hit('stomp', 80, 0.2, 0.26, 'corner', { part: n }); t += STEP + 0.1;
      });
      t += GAP;
    };
    const walkWhole = (corners, stage, straightJoins, inner) => {
      for (let c = 0; c < corners; c++) {
        hit('woodClick', 1300, 0.05, 0.18, 'side', { part: -1 }); t += STEP;
        if (c < straightJoins) { hit('woodClick', 1300, 0.05, 0.18, 'joinPoint', { part: -1 }); t += STEP; }   // a joining point on a straight line is a step
        hit('stomp', 80, 0.2, 0.26, stage, { part: -1 }); t += STEP + 0.1;
      }
      for (let i = 0; i < inner; i++) { hit('bowed', 196, 0.3, 0.08, 'innerSide'); t += 0.45; }        // the shared side is now inside: soft
      t += GAP;
    };
    switch (spec.kind) {
      case 'cut': {
        const whole = { corners: spec.whole, sides: Array.from({ length: spec.whole }, () => ({})) };
        walkPart(whole, -1);
        hit('woodClick', 3200, 0.03, 0.3, 'cutClick'); t += 0.6 + GAP;                  // a sharp cut, never counted
        spec.parts.forEach((pt, i) => walkPart(pt, i));
        break;
      }
      case 'join':
        spec.parts.forEach((pt, i) => walkPart(pt, i, spec.mirror && i === 1));
        hit('metalBell', 784, 0.4, 0.18, 'joinSound'); t += 0.6 + GAP;
        walkWhole(spec.whole.corners, 'wholeCorner', spec.whole.straightJoins, spec.parts.length - 1);
        break;
      case 'star': {
        const up = [523, 659, 784], down = [784, 659, 523];
        up.forEach((hz) => { hit('reed', hz, 0.3, 0.18, 'triangleUp'); t += 0.4; }); t += GAP;
        down.forEach((hz) => { hit('bowed', hz / 2, 0.3, 0.18, 'triangleDown'); t += 0.4; }); t += GAP;
        for (let i = 0; i < 3; i++) { hit('reed', up[i], 0.3, 0.16, 'together', { voice: 0 }); hit('bowed', down[i] / 2, 0.3, 0.16, 'together', { voice: 1 }); t += 0.45; }
        break;
      }
      default:
        break;
    }
    return ev;
  }

  function play(spec, env) {
    const e = env || {};
    const events = soundEvents(spec);
    if (!events.length) return null;
    const pv = e.playVoice || (root && root.playVoice);
    const ac = e.audioContext || (root && typeof root.getSharedAudioContext === 'function' ? root.getSharedAudioContext() : null);
    if (typeof pv === 'function' && ac) {
      if (ac.state === 'suspended' && ac.resume) { try { ac.resume(); } catch (err) { /* autoplay */ } }
      const start = ac.currentTime + 0.05;
      events.forEach((n) => pv(ac, n.voice, n.hz, start + n.at, null, { dur: n.dur, gain: n.gain }));
      return { notes: events.length };
    }
    return { notes: events.length, silent: true };
  }

  // ---------------------------------------------------------------- picture
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  const HOW = {
    cut: 'קודם הולכים סביב הצורה השלמה. נקישה חדה — חותכים (הנקישה אינה נספרת). אחר כך הולכים סביב כל חלק לבד. הצלע של החיתוך נשמעת בצליל משלה בשני החלקים — זו אותה צלע.',
    join: 'קודם הולכים סביב כל חלק. פעמון — מצמידים. אחר כך הולכים סביב הצורה החדשה: הצלע המשותפת נשמעת עכשיו רכה, מבפנים, ונקודה שנמצאת על קו ישר היא צעד, אינה פינה.',
    star: 'קול אחד מנגן משולש, קול שני מנגן משולש הפוך, ואחר כך שניהם יחד — חופפים. כמה קולות שמעתם?',
  };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    return '<div class="cut-compose">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '.') + '</p>'
      + '<p class="band-note">' + esc(HOW[spec.kind]) + '</p>'
      + (revealed
        ? '<p class="band-predict cc-silent">עכשיו בלי צליל: גזרו נייר או ציירו, וספרו שוב — פינות, צלעות וחלקים.</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו וספרו.</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { TAGS: TAGS, WORLDS: WORLDS, MAX_RUN: MAX_RUN, plan: plan, specForItem: specForItem, soundEvents: soundEvents, longestRun: longestRun, play: play, html: html };
});
