// MelodyMath — BandShare: percent with a changing base, grade ו׳ (G6_PCT_WHOLE,
// G6_PCT_CHANGE). Research: docs/research/topics/f01-percent.md and
// docs/research/percent-band-share-2026-11-13.md (Perplexity + Meta AI).
//
// The most common percent mistake is to read a percent as a fixed amount and
// forget its whole: 25% of 20 and 25% of 40 "are the same". Here the whole is
// a band (100%) of one musical world, split into equal sections. The child:
//   1. hears the sections enter one after another and counts them: the
//      equal parts of the whole (4 sections, so each is 25%);
//   2. hears the asked part alone, one note per player, and counts the
//      players; a soft bell at the start of each section is a counting aid,
//      a separate layer, not part of the music;
//   3. hears the whole band again with the part inside it.
// Inside one exercise the world, tempo and counted timbre never change, so
// the only thing that changes is the size (Meta AI review, 13.11.2026). A
// silent section is silence and is dimmed on screen; it never knocks, so it
// cannot be counted as a player. The worlds change between exercises: a
// takht, a klezmer band, a gamelan, a chamber orchestra, a samba bateria, a
// rock festival and a symphony orchestra. Large bands are model bands
// inspired by the tradition and say so; the real size is given (`real`).
//
// Mechanism M2 (grouped, accented beats; das2023), adapted. It is an EXTRA
// way: no study tests percent through ensemble share, and the app says so.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_BAND_SHARE = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const WAY = 'bandShare';
  const MECHANISM = 'M2';
  const MAX_SECTIONS = 10;
  const MAX_COUNTED = 30;   // players counted by ear in one run
  const ENTRY_STEP = 0.32;  // one hit per section while they enter
  const PLAYER_STEP = 0.2;  // one note per player in the counted run
  const STAGE_GAP = 0.7;
  const BAND_GAP = 1.2;
  const TUTTI_DUR = 1.1;
  const BELL_VOICE = 'tine';
  const BELL_HZ = 1568;
  const SCALE = [262, 294, 330, 392, 440, 523, 587, 659];

  const S = function (he, voice) { return { he: he, voice: voice }; };

  // Model ensembles. `sections` are the equal parts the whole is split into;
  // the names are the real sections of the tradition. Voices are the app's
  // synthesized voices (instrumentVoices.js), not recordings, and say so.
  const ENSEMBLES = Object.freeze({
    takht: { he: 'תח׳ת', world: 'המוזיקה הערבית הקלאסית', real: 'תח׳ת הוא הרכב קטן של כ־6 נגנים',
      sections: [S('עוּד', 'pluck'), S('קאנון', 'pluck'), S('נאי', 'breathy'), S('כינור', 'bowed'), S('ריק', 'jingle'), S('דרבוקה', 'drumLow')] },
    klezmer: { he: 'להקת כליזמר', world: 'המוזיקה היהודית של מזרח אירופה', real: 'להקת כליזמר מונה 5 עד 8 נגנים',
      sections: [S('קלרינט', 'reed'), S('כינור', 'bowed'), S('אקורדיון', 'organ'), S('צימבל', 'pluck'), S('קונטרבס', 'drumLow')] },
    gamelan: { he: 'גמלן גונג קביאר', world: 'באלי, אינדונזיה', real: 'גמלן אחד מונה עשרות נגנים, ולפעמים שני גמלנים מנגנים יחד',
      sections: [S('גנגסה', 'metalBell'), S('גונג', 'gong'), S('קנדנג', 'drumHigh'), S('סולינג', 'breathy')] },
    chamber: { he: 'תזמורת קאמרית', world: 'המוזיקה הקלאסית האירופית', real: 'תזמורת קאמרית קטנה מתזמורת סימפונית',
      sections: [S('כלי קשת', 'bowed'), S('כלי נשיפה מעץ', 'breathy'), S('כלי נשיפה ממתכת', 'horn'), S('כלי הקשה', 'drumLow')] },
    samba: { he: 'בטריה של סמבה', world: 'בתי הספר לסמבה בברזיל', real: 'בטריה של בית ספר לסמבה מונה עשרות ועד מאות נגנים, רק בכלי הקשה',
      sections: [S('סורדו', 'drumLow'), S('סורדו', 'drumLow'), S('קאישה', 'drumHigh'), S('קאישה', 'drumHigh'), S('רפיניקי', 'frameDrum'),
        S('טמבורים', 'woodClick'), S('טמבורים', 'woodClick'), S('טמבורים', 'woodClick'), S('אגוגו', 'metalBell'), S('שוקאלו', 'shaker')] },
    rock: { he: 'פסטיבל רוק', world: 'רוק, משורשי הבלוז', real: 'להקת רוק מונה 4 עד 6 נגנים; פסטיבל הוא הרבה להקות יחד',
      sections: [S('להקה', 'pluck')] },
    symphony: { he: 'תזמורת סימפונית', world: 'המוזיקה הקלאסית האירופית', real: 'תזמורת סימפונית מונה 50 עד 100 נגנים',
      sections: [S('כלי קשת', 'bowed'), S('כלי נשיפה מעץ', 'breathy'), S('כלי נשיפה ממתכת', 'horn'), S('כלי הקשה', 'drumLow'), S('נבל ופסנתר', 'keys')] },
  });

  function int(v, lo, hi) {
    const n = Number(v);
    return Number.isInteger(n) && n >= lo && n <= hi ? n : null;
  }

  // n sections of the ensemble: its own list when it has n, else its first
  // section repeated (a festival of identical bands).
  function sectionsOf(ensembleId, n) {
    const e = ENSEMBLES[ensembleId];
    if (!e || !int(n, 1, MAX_SECTIONS)) return null;
    if (e.sections.length === n) return e.sections.map(function (s) { return Object.assign({}, s); });
    if (e.sections.length === 1) return Array.from({ length: n }, function (_, i) { return Object.assign({}, e.sections[0], { he: e.sections[0].he + ' ' + (i + 1) }); });
    if (e.sections.length > n) return e.sections.slice(0, n).map(function (s) { return Object.assign({}, s); });
    return null;
  }

  // A band: `whole` players (null when the child must find it) split into
  // `count` equal sections; `playing` are the indexes of the counted part.
  function band(ensembleId, count, whole, playing) {
    const secs = sectionsOf(ensembleId, count);
    if (!secs) return null;
    const w = whole == null ? null : int(whole, 1, 1000);
    if (whole != null && (w == null || w % count !== 0)) return null;
    const size = w == null ? null : w / count;
    const on = (playing || []).filter(function (i) { return int(i, 0, count - 1) != null; });
    secs.forEach(function (s, i) { s.players = size; s.playing = on.indexOf(i) >= 0; });
    return { ensemble: ensembleId, he: ENSEMBLES[ensembleId].he, whole: w, count: count, size: size, sections: secs, playing: on.length };
  }

  function playingIndexes(ensembleId, count, n, pick) {
    const secs = sectionsOf(ensembleId, count) || [];
    if (Array.isArray(pick) && pick.length === n) return pick.slice();
    const out = [];
    for (let i = 0; i < count && out.length < n; i++) if (!pick || secs[i].he === pick) out.push(i);
    for (let i = 0; i < count && out.length < n; i++) if (out.indexOf(i) < 0) out.push(i);
    return out;
  }

  function counted(b, part) {
    const p = int(part, 1, MAX_COUNTED);
    if (!b || p == null || !b.playing || p % b.playing !== 0) return null;
    const first = b.sections.filter(function (s) { return s.playing; })[0];
    return { players: p, group: p / b.playing, voice: first.voice, he: first.he };
  }

  // The four item kinds. Each returns null when its numbers do not fit.
  //   percentOf: the whole and the part are known; the child finds the percent.
  //   wholeFrom: the part and its percent are known; the child finds the whole.
  //   twoWholes: two bands of one world, each with a known part and percent;
  //              the child finds the second whole or the difference.
  //   change:    a band loses down% and then grows up% of the new size.
  function build(raw) {
    const r = raw || {};
    if (!ENSEMBLES[r.ensemble]) return null;
    if (r.kind === 'percentOf') {
      const count = int(r.sections, 1, MAX_SECTIONS), whole = int(r.whole, 1, 1000), part = int(r.part, 1, MAX_COUNTED);
      if (!count || !whole || !part || whole % count !== 0 || part % (whole / count) !== 0) return null;
      const n = part / (whole / count);
      const b = band(r.ensemble, count, whole, playingIndexes(r.ensemble, count, n, r.pick));
      const c = counted(b, part);
      if (!b || !c) return null;
      const percent = (part * 100) / whole;
      if (!Number.isInteger(percent)) return null;
      return finish({ kind: 'percentOf', bands: [b], counted: [c], answer: percent, unit: '%' }, r);
    }
    if (r.kind === 'wholeFrom') {
      const count = int(r.sections, 1, MAX_SECTIONS), percent = int(r.percent, 1, 100), part = int(r.part, 1, MAX_COUNTED);
      if (!count || !percent || !part || (percent * count) % 100 !== 0) return null;
      const n = (percent * count) / 100;
      if (part % n !== 0) return null;
      const b = band(r.ensemble, count, null, playingIndexes(r.ensemble, count, n, r.pick));
      const c = counted(b, part);
      if (!b || !c) return null;
      return finish({ kind: 'wholeFrom', bands: [b], counted: [c], answer: (part / n) * count, percent: percent, unit: 'נגנים' }, r);
    }
    if (r.kind === 'twoWholes') {
      const a = r.a || {}, z = r.b || {};
      const one = build({ kind: 'wholeFrom', ensemble: r.ensemble, sections: a.sections, percent: a.percent, part: a.part, pick: r.pick });
      const two = build({ kind: 'wholeFrom', ensemble: r.ensemble, sections: z.sections, percent: z.percent, part: z.part, pick: r.pick });
      if (!one || !two) return null;
      const wholes = [one.answer, two.answer];
      const ask = r.ask === 'difference' ? 'difference' : 'second';
      const answer = ask === 'difference' ? Math.abs(wholes[0] - wholes[1]) : wholes[1];
      return finish({ kind: 'twoWholes', bands: [one.bands[0], two.bands[0]], counted: [one.counted[0], two.counted[0]],
        percents: [a.percent, z.percent], wholes: wholes, ask: ask, answer: answer, unit: 'נגנים' }, r);
    }
    if (r.kind === 'change') {
      const count = int(r.sections, 1, MAX_SECTIONS), whole = int(r.whole, 1, 1000), down = int(r.down, 1, 100), up = int(r.up, 1, 1000);
      if (!count || !whole || !down || !up || whole % count !== 0) return null;
      const left = (whole * down) / 100, mid = whole - left, joined = (mid * up) / 100;
      if (!Number.isInteger(left) || !Number.isInteger(joined) || left > MAX_COUNTED || joined > MAX_COUNTED || left % (whole / count) !== 0) return null;
      const b = band(r.ensemble, count, whole, playingIndexes(r.ensemble, count, left / (whole / count), r.pick));
      const leave = counted(b, left);
      if (!b || !leave) return null;
      const join = { players: joined, group: joined, voice: leave.voice, he: leave.he };
      return finish({ kind: 'change', bands: [b], counted: [leave, join], whole: whole, left: left, mid: mid, joined: joined,
        down: down, up: up, answer: mid + joined, unit: 'נגנים' }, r);
    }
    return null;
  }

  function finish(spec, raw) {
    const e = ENSEMBLES[raw.ensemble];
    spec.ensemble = raw.ensemble;
    spec.world = e.world;
    spec.real = e.real;
    spec.model = spec.bands.some(function (b) { return b.whole == null || b.whole > 12; });
    spec.hearCheck = hearCheck(spec);
    return spec;
  }

  // The ear-only check (research §4): what the child must report from the
  // sound alone before the math question counts as learned through music.
  function hearCheck(spec) {
    const b = spec.bands[0], c = spec.counted[0];
    if (spec.kind === 'change') {
      return { q: 'כמה נגנים שמעתם יוצאים, וכמה חוזרים?', a: [spec.left, spec.joined] };
    }
    return { q: 'לכמה קטעים שווים נחלקה הלהקה, וכמה נגנים ניגנו לבד?', a: [b.count, c.players] };
  }

  function specForItem(item) {
    if (!item || typeof item !== 'object' || item.noMusic || !item.band) return null;
    const way = item.music === WAY || item.widget === WAY
      || (Array.isArray(item.musicExtra) && item.musicExtra.some(function (w) { return w && w.music === WAY; }));
    return way ? build(item.band) : null;
  }

  // ---------------------------------------------------------------- sound
  function chord(at, voices, dur, accentVoice) {
    const seen = {};
    return voices.filter(function (v) { if (seen[v]) return false; seen[v] = true; return true; }).map(function (v, i) {
      return { at: at, voice: v, hz: SCALE[(i * 2) % SCALE.length], dur: dur, gain: v === accentVoice ? 0.3 : 0.12, held: true, stage: 'tutti' };
    });
  }

  // One band: (1) sections enter one by one, (2) the counted part alone,
  // one note per player with a bell at each section start, (3) the whole
  // band again with the part on top.
  function bandEvents(b, c, t0, tag) {
    const ev = [];
    let t = t0;
    b.sections.forEach(function (s, i) {
      ev.push({ at: t, voice: s.voice, hz: SCALE[i % SCALE.length], dur: 0.25, gain: 0.2, stage: 'enter', section: i, band: tag });
      t += ENTRY_STEP;
    });
    t += STAGE_GAP;
    t = runEvents(ev, c, t, tag, 'part');
    t += STAGE_GAP;
    ev.push.apply(ev, chord(t, b.sections.map(function (s) { return s.voice; }), TUTTI_DUR, c.voice).map(function (n) { n.band = tag; return n; }));
    return { events: ev, end: t + TUTTI_DUR };
  }

  function runEvents(ev, c, t, tag, stage) {
    for (let p = 0; p < c.players; p++) {
      if (p % c.group === 0) ev.push({ at: t, voice: BELL_VOICE, hz: BELL_HZ, dur: 0.08, gain: 0.06, stage: 'countAid', band: tag });
      ev.push({ at: t, voice: c.voice, hz: SCALE[p % 5], dur: 0.16, gain: 0.22, stage: stage, player: p, band: tag });
      t += PLAYER_STEP;
    }
    return t;
  }

  function soundEvents(spec) {
    if (!spec || !Array.isArray(spec.bands)) return [];
    let ev = [], t = 0;
    if (spec.kind === 'change') {
      const b = spec.bands[0];
      const first = bandEvents(b, spec.counted[0], 0, 'start');
      ev = first.events.filter(function (n) { return n.stage !== 'part'; });
      t = first.end + STAGE_GAP;
      t = runEvents(ev, spec.counted[0], t, 'leave', 'leave');
      t += STAGE_GAP;
      t = runEvents(ev, spec.counted[1], t, 'join', 'join');
      return ev.sort(function (x, y) { return x.at - y.at; });
    }
    spec.bands.forEach(function (b, i) {
      const r = bandEvents(b, spec.counted[i], t, i === 0 ? 'a' : 'b');
      ev = ev.concat(r.events);
      t = r.end + BAND_GAP;
    });
    return ev.sort(function (x, y) { return x.at - y.at; });
  }

  function countedNotes(spec, stage) {
    return soundEvents(spec).filter(function (n) { return n.stage === (stage || 'part'); }).length;
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

  // ---------------------------------------------------------------- picture
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch];
    });
  }

  // A 100% bar split into the band's sections. The counted part is coloured;
  // the rest is dimmed (silence). Players per section stay hidden while the
  // child is still answering when the whole is unknown.
  function barHtml(b, revealed, label) {
    const known = b.whole != null || revealed;
    const head = b.he + ' · ' + (b.whole != null ? b.whole + ' נגנים' : (revealed ? '' : '? נגנים')) + ' = 100%';
    const cells = b.sections.map(function (s) {
      const n = s.players != null ? s.players : null;
      const count = known && n != null ? '<b>' + n + '</b>' : '<b>?</b>';
      return '<span class="band-sec ' + (s.playing ? 'band-on' : 'band-off') + '"'
        + ' aria-label="' + esc(s.he + (s.playing ? ' — מנגנים' : ' — שקט')) + '">' + esc(s.he) + ' ' + count + '</span>';
    }).join('');
    // Equal sections must look equal: an even grid, two rows of equal cells
    // when there are more than 6 (never a wider last row).
    const cols = b.count > 6 ? Math.ceil(b.count / 2) : b.count;
    return '<div class="band-box">' + (label ? '<div class="band-tag">' + esc(label) + '</div>' : '')
      + '<div class="band-head">' + esc(head) + '</div><div class="band-bar" dir="rtl" style="grid-template-columns:repeat(' + cols + ',1fr)">' + cells + '</div></div>';
  }

  function withWholes(spec) {
    if (spec.kind !== 'wholeFrom' && spec.kind !== 'twoWholes') return spec.bands;
    return spec.bands.map(function (b, i) {
      const whole = spec.kind === 'twoWholes' ? spec.wholes[i] : spec.answer;
      const size = whole / b.count;
      return Object.assign({}, b, { whole: whole, size: size,
        sections: b.sections.map(function (s) { return Object.assign({}, s, { players: size }); }) });
    });
  }

  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    const bands = revealed ? withWholes(spec) : spec.bands;
    const labels = spec.bands.length > 1 ? ['להקה א׳', 'להקה ב׳'] : [''];
    const bars = bands.map(function (b, i) { return barHtml(b, revealed, labels[i]); }).join('');
    const ans = answerText(spec);
    return '<div class="band-share" data-kind="' + spec.kind + '">' + bars
      + '<p class="band-note">' + esc(spec.world + ' — ' + spec.real + (spec.model ? '. כאן זו להקת מודל בהשראת המסורת.' : '.')) + '</p>'
      + '<p class="band-note">🔔 הפעמון העדין סופר בשבילכם קטעים — הוא עזרה לספירה, לא חלק מהשיר.</p>'
      + (revealed ? '' : '<p class="band-predict">לפני שלוחצים — נחשו: כמה נגנים תשמעו מנגנים לבד?</p>')
      + '<button type="button" class="snd-play">▶ ' + esc(spec.hearCheck.q) + '</button>'
      + (revealed ? '<span class="snd-answer">' + esc(ans) + '</span>' : '<span class="snd-answer" data-reveal="' + esc(ans) + '">?</span>')
      + '</div>';
  }

  // The explanation after the answer: through what was heard.
  function answerText(spec) {
    if (!spec) return '';
    const b = spec.bands[0], c = spec.counted[0];
    if (spec.kind === 'percentOf') {
      return 'שמעתם ' + b.count + ' קטעים שווים, ו־' + b.playing + ' מהם ניגנו: ' + c.players + ' מתוך ' + b.whole + ' הם ' + spec.answer + '%.';
    }
    if (spec.kind === 'wholeFrom') {
      return c.players + ' נגנים מילאו ' + b.playing + ' קטעים מתוך ' + b.count + ' (' + spec.percent + '%), כלומר ' + c.group
        + ' בכל קטע. ' + b.count + ' קטעים × ' + c.group + ' = ' + spec.answer + ' נגנים.';
    }
    if (spec.kind === 'twoWholes') {
      const lines = spec.bands.map(function (x, i) {
        return (i ? 'בלהקה ב׳ ' : 'בלהקה א׳ ') + spec.counted[i].players + ' נגנים הם ' + spec.percents[i] + '%, ולכן השלם ' + spec.wholes[i];
      });
      return lines.join('; ') + (spec.ask === 'difference' ? '. ההפרש: ' + spec.answer + '.' : '.');
    }
    return 'יצאו ' + spec.left + ' (' + spec.down + '% מ־' + spec.whole + '), נשארו ' + spec.mid + '. חזרו רק ' + spec.joined
      + ' (' + spec.up + '% מ־' + spec.mid + ', שלם חדש וקטן יותר). עכשיו ' + spec.answer + ', לא ' + spec.whole + '.';
  }

  // Feedback for the expected wrong answers. It never names the answer.
  function feedbackFor(spec, typed) {
    if (!spec) return '';
    const n = Number(String(typed == null ? '' : typed).replace(/[%\s]/g, ''));
    if (!Number.isFinite(n) || n === spec.answer) return '';
    const c = spec.counted[0];
    if (spec.kind === 'change' && n === spec.whole) return 'שמעו שוב: האם חזרו בדיוק כמה שיצאו? האחוז של החזרה נמדד מהלהקה הקטנה.';
    if (spec.kind === 'wholeFrom' && (n === spec.percent || n === c.players * spec.percent)) return 'ה־' + c.players + ' הם רק החלק שניגן. כמה קטעים כאלה יש בלהקה כולה?';
    if (spec.kind === 'wholeFrom' && n === c.players) return 'זה החלק, לא השלם: הוא מילא רק חלק מהקטעים בפס.';
    if (spec.kind === 'percentOf' && n === c.players) return 'זה מספר הנגנים. כמה קטעים מתוך כל הקטעים הם ניגנו?';
    if (spec.kind === 'twoWholes') return 'אותו מספר נגנים יכול להיות אחוז אחר מלהקה אחרת. בכל להקה לחוד: כמה קטעים יש בפס?';
    return 'הקשיבו שוב: ספרו קודם את הקטעים, ורק אחר כך את הנגנים שניגנו לבד.';
  }

  // Transfer check with no band, no sound and no music words (research §4).
  const NO_MUSIC_CHECK_ITEMS = [
    ['25% ממספר הם 9. מהו המספר?', 36],
    ['15 הם 30% ממספר אחד ו־50% ממספר אחר. מה ההפרש בין שני המספרים?', 20],
    ['בכיתה 40 תלמידים. 25% מהם יצאו, ואז מספר התלמידים בכיתה גדל ב־20%. כמה תלמידים בכיתה עכשיו?', 36],
    ['6 תלמידים הם 20% מהקבוצה. כמה תלמידים בקבוצה?', 30],
  ].map(function (q, i) {
    return { id: 'band-nm-' + (i + 1), topic: 'percent', grade: 'ו', standard: 'G6_PCT_WHOLE', skill: 'percent',
      prompt: q[0], answer: q[1], noMusic: true, plain: true, musicStage: 'no_music_check' };
  });

  return {
    WAY: WAY, MECHANISM: MECHANISM, ENSEMBLES: ENSEMBLES, MAX_SECTIONS: MAX_SECTIONS, MAX_COUNTED: MAX_COUNTED,
    BELL_VOICE: BELL_VOICE, NO_MUSIC_CHECK_ITEMS: NO_MUSIC_CHECK_ITEMS,
    sectionsOf: sectionsOf, build: build, specForItem: specForItem, hearCheck: hearCheck,
    soundEvents: soundEvents, countedNotes: countedNotes, play: play,
    html: html, answerText: answerText, feedbackFor: feedbackFor,
  };
});
