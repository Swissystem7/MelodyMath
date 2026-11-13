// MelodyMath — FenceFloor: perimeter vs area of the SAME rectangle, grade ה׳
// (PERIMETER). Research: docs/research/perimeter-area-fence-floor-2026-11-13.md
// (Perplexity + Meta AI, 13.11.2026).
//
// The misconception: perimeter and area grow together (same tiles, same
// fence; a longer fence, a bigger floor). Kidman 1999: 19 of 36 pupils in
// grades 4, 6 and 8 judged area by adding the sides. The child hears one
// rectangle two ways, in one musical world:
//   fence (perimeter): a walking line around the border, one note per unit
//     edge, grouped by side (1+8+1+8) with a short uncounted pause between
//     sides. It climbs on the first side, holds on the second, comes down on
//     the third and holds on the fourth, so every corner is a turn you hear,
//     and its last note lands on the home note. No extra "home" note is
//     added, so the child never counts 19 for 18 (Perplexity + Meta AI).
//   floor (area): row after row, one held note marks the row (not counted)
//     and one click sounds per square.
// Both listens take the same total time, so a longer sound tells nothing:
// the child counts steps and squares, never seconds. Pitch only organises;
// it never stands for size. The world changes between exercises only.
//
// Mechanism M7 (walking and turning around a shape; moore2012), like
// perimeterWalk, with the counted rows of M2 on the floor. An EXTRA way
// marked weak: M7 has weak evidence and no study tests this sound mapping.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_FENCE_FLOOR = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const WAY = 'fenceFloor';
  const MECHANISM = 'M7';
  const MAX_SIDE = 12;
  const LISTEN_SEC = 6;     // every listen, fence or floor, takes this long
  const SIDE_GAP = 0.35;    // uncounted pause between sides / rows
  const SCALE = [262, 294, 330, 392, 440, 523, 587, 659, 784, 880, 1047, 1175, 1319];

  const V = function (voice, he) { return { voice: voice, he: he }; };
  // One world per exercise: who walks the fence, who holds a row, who clicks a square.
  const WORLDS = Object.freeze({
    jazz: { he: 'ג׳אז', walk: V('pluck', 'בס מהלך'), row: V('keys', 'אקורד פסנתר'), cell: V('shaker', 'היי־האט'),
      why: 'בס מהלך צועד רבע אחרי רבע וחוזר לצליל הבית בסוף, כמו שחוזרים לפינה הראשונה' },
    balkan: { he: 'ריקוד מעגל בלקני', walk: V('breathy', 'קאבאל'), row: V('organ', 'אקורדיון'), cell: V('frameDrum', 'טאפאן'),
      why: 'ריקוד המעגל הולך סביב וחוזר הביתה' },
    andes: { he: 'מוזיקה מהאנדים', walk: V('breathy', 'חליל פאן'), row: V('pluck', 'צ׳רנגו'), cell: V('shaker', 'רעשן'),
      why: 'חליל הפאן עולה ויורד במדרגות, צעד לכל קנה' },
    mande: { he: 'מוזיקה מנדינקה ממערב אפריקה', walk: V('woodBar', 'בלפון'), row: V('pluck', 'קורה'), cell: V('drumHigh', 'ג׳מבה'),
      why: 'הבלפון מנגן צעד לכל קליד עץ' },
    japan: { he: 'מוזיקה יפנית', walk: V('breathy', 'שאקוהאצ׳י'), row: V('drone', 'שו'), cell: V('drumLow', 'טאיקו'),
      why: 'השאקוהאצ׳י הולך לאט ובבירור, והטאיקו מכה מכה אחת לכל משבצת' },
    gospel: { he: 'גוספל', walk: V('voiceAh', 'זמר סולו'), row: V('voiceAh', 'מקהלה מחזיקה'), cell: V('clap', 'מחיאת כף'),
      why: 'הסולן הולך בצעדים והמקהלה מחזיקה, ומחיאת כף לכל משבצת' },
  });

  function side(n) { const v = Number(n); return Number.isInteger(v) && v >= 1 && v <= MAX_SIDE ? v : null; }

  function rect(dims) {
    const r = Array.isArray(dims) ? side(dims[0]) : null, c = Array.isArray(dims) ? side(dims[1]) : null;
    if (!r || !c) return null;
    // LRI…PDI keeps «1×8» from showing as «8×1» inside Hebrew text.
    return { rows: r, cols: c, area: r * c, perimeter: 2 * (r + c), sides: [c, r, c, r], label: '⁦' + r + '×' + c + '⁩' };
  }

  // ask: perimeterDiff (first minus second), perimeterOf (the rect at `index`),
  // areaMax (largest area among the rects).
  function build(raw) {
    const r = raw || {};
    const world = WORLDS[r.world];
    if (!world || !Array.isArray(r.rects) || r.rects.length < 2 || r.rects.length > 3) return null;
    const rects = r.rects.map(rect);
    if (rects.some(function (x) { return !x; })) return null;
    let answer = null;
    if (r.ask === 'perimeterDiff') answer = rects[0].perimeter - rects[1].perimeter;
    else if (r.ask === 'perimeterOf' && rects[r.index]) answer = rects[r.index].perimeter;
    else if (r.ask === 'areaMax') answer = Math.max.apply(null, rects.map(function (x) { return x.area; }));
    if (answer == null || answer < 0) return null;
    return { kind: 'fenceFloor', world: r.world, worldHe: world.he, why: world.why, ask: r.ask, index: r.index, rects: rects, answer: answer,
      hearCheck: { q: 'כמה צעדים שמעתם סביב כל מלבן, וכמה משבצות בכל רצפה?', a: rects.map(function (x) { return [x.perimeter, x.area]; }) } };
  }

  function specForItem(item) {
    if (!item || typeof item !== 'object' || item.noMusic || !item.fence) return null;
    const way = item.music === WAY || item.widget === WAY
      || (Array.isArray(item.musicExtra) && item.musicExtra.some(function (w) { return w && w.music === WAY; }));
    return way ? build(item.fence) : null;
  }

  // ------------------------------------------------------------- sound
  // The fence: c up, r held, c down, r held at home. One note per unit edge.
  function fenceEvents(x, world) {
    const steps = x.perimeter, step = (LISTEN_SEC - 3 * SIDE_GAP) / steps, ev = [];
    let t = 0, pitch = 0;
    x.sides.forEach(function (len, s) {
      for (let k = 0; k < len; k++) {
        if (s === 0) pitch += 1;
        else if (s === 2) pitch -= 1;
        ev.push({ at: t, voice: world.walk.voice, hz: SCALE[Math.max(0, Math.min(SCALE.length - 1, pitch))], dur: Math.min(0.3, step * 0.85),
          gain: 0.24, stage: 'fence', side: s, step: ev.length, accent: k === 0 });
        t += step;
      }
      if (s < 3) t += SIDE_GAP;
    });
    return ev;
  }

  // The floor: one held note per row (a frame, not counted), one click per square.
  function floorEvents(x, world) {
    const slot = (LISTEN_SEC - (x.rows - 1) * SIDE_GAP) / x.rows, step = slot / x.cols, ev = [];
    for (let row = 0; row < x.rows; row++) {
      const t0 = row * (slot + SIDE_GAP);
      ev.push({ at: t0, voice: world.row.voice, hz: SCALE[(row % 2) * 2], dur: slot, gain: 0.1, held: true, stage: 'row', row: row });
      for (let c = 0; c < x.cols; c++) {
        ev.push({ at: t0 + c * step, voice: world.cell.voice, hz: 1800, dur: 0.08, gain: 0.2, stage: 'floor', row: row, cell: row * x.cols + c });
      }
    }
    return ev;
  }

  function soundEvents(spec, which, mode) {
    if (!spec || !spec.rects[which]) return [];
    const world = WORLDS[spec.world];
    return mode === 'floor' ? floorEvents(spec.rects[which], world) : fenceEvents(spec.rects[which], world);
  }

  function counted(spec, which, mode) {
    return soundEvents(spec, which, mode).filter(function (n) { return n.stage === (mode === 'floor' ? 'floor' : 'fence'); }).length;
  }

  function play(spec, which, mode, env) {
    const e = env || {};
    const events = soundEvents(spec, which, mode);
    if (!events.length) return null;
    const pv = e.playVoice || (root && root.playVoice);
    const ac = e.audioContext || (root && typeof root.getSharedAudioContext === 'function' ? root.getSharedAudioContext() : null);
    if (typeof pv === 'function' && ac) {
      if (ac.state === 'suspended' && ac.resume) { try { ac.resume(); } catch (err) { /* autoplay */ } }
      const start = ac.currentTime + 0.05;
      events.forEach(function (n) { pv(ac, n.voice, n.hz, start + n.at, null, { dur: n.dur, gain: n.gain }); });
      return { notes: events.length };
    }
    const ps = e.playSequence || (root && root.playSequence);
    if (typeof ps === 'function') {
      ps(events.map(function (n) { return { at: n.at, dur: n.dur, hz: n.hz, gain: n.gain, type: 'triangle', voice: n.voice }; }));
      return { notes: events.length };
    }
    return { notes: events.length, silent: true };
  }

  // ------------------------------------------------------------- picture
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  // A rectangle of unit squares (the floor) with a thick border (the fence).
  // Its counts stay hidden until the child answers.
  function rectHtml(x, i, revealed) {
    const cells = Array.from({ length: x.area }, function () { return '<span class="ff-cell"></span>'; }).join('');
    const fence = revealed ? x.sides.join('+') + ' = ' + x.perimeter : '?';
    const floor = revealed ? x.rows + ' שורות של ' + x.cols + ' = ' + x.area : '?';
    return '<div class="ff-rect" data-i="' + i + '">'
      + '<div class="ff-title">מלבן ' + esc(x.label) + '</div>'
      + '<div class="ff-grid" dir="ltr" style="grid-template-columns:repeat(' + x.cols + ',1fr);aspect-ratio:' + x.cols + '/' + x.rows + '">' + cells + '</div>'
      + '<div class="ff-btns"><button type="button" class="snd-play ff-play" data-i="' + i + '" data-mode="fence">🚶 גדר (היקף)</button>'
      + '<button type="button" class="snd-play ff-play" data-i="' + i + '" data-mode="floor">🟩 רצפה (שטח)</button></div>'
      + '<div class="ff-count">צעדים: <b>' + esc(fence) + '</b> · משבצות: <b>' + esc(floor) + '</b></div></div>';
  }

  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    const ans = answerText(spec);
    return '<div class="fence-floor">'
      + '<p class="band-note">' + esc('אותו מלבן, מקשיבים אחרת: פעם הולכים סביבו (גדר = היקף), פעם ממלאים אותו מבפנים (רצפה = שטח). ' + spec.worldHe + ': ' + spec.why + '.') + '</p>'
      + '<p class="band-note">⏱️ כל האזנה נמשכת אותו זמן — סופרים צעדים ומשבצות, לא שניות.</p>'
      + (revealed ? '' : '<p class="band-predict">לפני שלוחצים — נחשו: לאיזה מלבן גדר ארוכה יותר? ולאיזה רצפה גדולה יותר?</p>')
      + '<div class="ff-rects">' + spec.rects.map(function (x, i) { return rectHtml(x, i, revealed); }).join('') + '</div>'
      + (revealed ? '<span class="snd-answer">' + esc(ans) + '</span>' : '<span class="snd-answer" data-reveal="' + esc(ans) + '">?</span>')
      + '</div>';
  }

  function answerText(spec) {
    if (!spec) return '';
    const list = spec.rects.map(function (x) { return x.label + ': גדר ' + x.perimeter + ', רצפה ' + x.area; }).join(' · ');
    if (spec.ask === 'perimeterDiff') return list + '. אותה רצפה יכולה לקבל גדר אחרת: ההפרש ' + spec.answer + '.';
    if (spec.ask === 'perimeterOf') return list + '. סיבוב לא מוסיף ולא מוריד צלע: ההיקף נשאר ' + spec.answer + '.';
    return list + '. הגדר והרצפה לא גדלות יחד: הרצפה הגדולה ביותר היא ' + spec.answer + '.';
  }

  // Feedback for the expected wrong answers; it never names the answer.
  function feedbackFor(spec, typed) {
    if (!spec) return '';
    const n = Number(String(typed == null ? '' : typed).trim());
    if (!Number.isFinite(n) || n === spec.answer) return '';
    const areas = spec.rects.map(function (x) { return x.area; }), fences = spec.rects.map(function (x) { return x.perimeter; });
    if (spec.ask === 'perimeterDiff' && n === 0) return 'אותה רצפה — אבל הקשיבו לגדר: ספרו צעדים צלע אחרי צלע בכל מלבן.';
    if (spec.ask === 'areaMax' && fences.indexOf(n) >= 0) return 'זה מספר הצעדים סביב הגדר. השטח הוא המשבצות שבפנים.';
    if (spec.ask === 'areaMax' && areas.indexOf(n) >= 0) return 'זו רצפה של אחד המלבנים. האם יש מלבן שהרצפה שלו גדולה יותר?';
    if (spec.ask === 'perimeterOf' && areas.indexOf(n) >= 0) return 'אלה המשבצות שבפנים. ההיקף הוא הצעדים סביב.';
    return 'הקשיבו שוב לכל מלבן לחוד: קודם הגדר, אחר כך הרצפה.';
  }

  // Transfer check with no sound and no music words.
  const NO_MUSIC_CHECK_ITEMS = [
    ['ל־2×6 ול־3×4 אותו שטח. מה ההפרש בין ההיקפים שלהם?', 2],
    ['ל־1×7 ול־3×5 אותו היקף. מה השטח הגדול מבין השניים?', 15],
    ['מלבן 3×5 מסובב ל־5×3. מה ההיקף שלו?', 16],
    ['מלבנים בהיקף 16. מה השטח הגדול ביותר?', 16],
  ].map(function (q, i) {
    return { id: 'ff-nm-' + (i + 1), topic: 'geometry', grade: 'ה', standard: 'PERIMETER', skill: 'geometry',
      prompt: q[0], answer: q[1], noMusic: true, plain: true, musicStage: 'no_music_check' };
  });

  return {
    WAY: WAY, MECHANISM: MECHANISM, WORLDS: WORLDS, LISTEN_SEC: LISTEN_SEC, MAX_SIDE: MAX_SIDE, NO_MUSIC_CHECK_ITEMS: NO_MUSIC_CHECK_ITEMS,
    rect: rect, build: build, specForItem: specForItem, soundEvents: soundEvents, counted: counted, play: play,
    html: html, answerText: answerText, feedbackFor: feedbackFor,
  };
});
