// MelodyMath — TimeCycles: time units as nested musical cycles, grades ב׳–ד׳
// (hourTwelveGroups, minuteGroups, weekBars, and the half-hour items of
// fillBar; mechanism M2, grouped beats). Research:
// docs/research/time-cycles-2026-11-13.md (Perplexity + Meta AI).
//
// A small unit is one stroke; a big unit is a cycle that closes on a strong
// cycle sound. An hour is 12 strokes of 5 minutes — the 12 numbers of the
// clock — so the child never counts 60 beats; a minute is 12 strokes of 5
// seconds; a day is two rounds of 12 hours; a week is 7 strokes; a year is
// 12 months. Elapsed time across the hour is heard as strokes up to the
// cycle sound and on after it (4:30 → 6:00 = 6 strokes, the hour, 12 more).
// The base-60 trap (1.30 hours = 130 minutes) is answered by the sound: an
// hour closes after 12 strokes of 5, never after 10 or 100.
// Not played: 365 days, months of unequal length and the Hebrew calendar.
// The widget shows only when the strokes give exactly the item's answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_TIME_CYCLES = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const MECHANISM = 'M2';
  const TAGS = Object.freeze(['hourTwelveGroups', 'minuteGroups', 'weekBars', 'fillBar']);
  const STEP = 0.26;
  const MAX_STROKES = 48;

  // unit → what one stroke is worth, how many strokes close a cycle, names.
  const UNITS = Object.freeze({
    min: { per: 12, worth: 5, small: 'דקות', big: 'שעה', strokeHe: '5 דקות' },
    sec: { per: 12, worth: 5, small: 'שניות', big: 'דקה', strokeHe: '5 שניות' },
    hour: { per: 12, worth: 1, small: 'שעות', big: 'סיבוב של השעון', strokeHe: 'שעה' },
    day: { per: 7, worth: 1, small: 'ימים', big: 'שבוע', strokeHe: 'יום' },
    month: { per: 12, worth: 1, small: 'חודשים', big: 'שנה', strokeHe: 'חודש' },
  });

  // One world per unit (Meta AI). Gamelan is kept out of the clock: its
  // cycles are 8, 16, 32 or 64 beats and the gong ageng is not a timer.
  // `group`: a short uncounted pause after every `group` strokes, so no run
  // is longer than 12 and a quarter hour is heard as a group of 3.
  const WORLDS = Object.freeze({
    tower: { he: 'מגדל שעון', stroke: 'metalBell', cycle: 'gong', group: 3,
      why: 'מכה קטנה לכל 5 דקות, קבוצה של 3 לכל רבע שעה, ופעמון גדול, נמוך וארוך לשעה שלמה — 12 מכות, כמו 12 המספרים בשעון' },
    tick: { he: 'שעון מתקתק', stroke: 'woodClick', cycle: 'metalBell', group: 3,
      why: 'תיק לכל 5 שניות, קבוצה של 3 לכל רבע דקה, ופעמון לכל דקה שלמה' },
    dayNight: { he: 'יום ולילה', stroke: 'tine', strokeNight: 'drone', cycle: 'gong', group: 6,
      why: '12 שעות של יום ו־12 של לילה; זריחה ושקיעה הן התחנות' },
    week: { he: 'השבוע היהודי', stroke: 'woodBar', shabbat: 'organ', group: 7,
      why: 'שישה ימים דומים, והיום השביעי — שבת — הוא צליל אחר לגמרי, ארוך ושקט' },
    year: { he: 'שנה של חודשים', stroke: 'pluck', cycle: 'metalBell', group: 3,
      why: 'מכה לכל חודש, קבוצה של 3 לכל עונה, ופעמון לשנה שלמה' },
  });
  const WORLD_OF = { min: 'tower', sec: 'tick', hour: 'dayNight', day: 'week', month: 'year' };

  const hm = (s) => { const m = /(\d{1,2}):(\d{2})/.exec(s); return m ? Number(m[1]) * 60 + Number(m[2]) : null; };

  // Reads the item into { unit, strokes, startAt (in strokes, inside the
  // first cycle), answer, answerFmt }. Returns null when it cannot.
  function read(p, ans) {
    let m;
    const U = UNITS;
    // durations on the clock: "התחיל ב־8:00 ונגמר ב־8:45", "יוצא ב־10:40. עכשיו 10:25", "יצאנו ב־4:00 וחזרנו ב־5:30"
    const times = (p.match(/\d{1,2}:\d{2}/g) || []).map(hm);
    if (times.length === 2 && /התחיל|יצאנו|יוצא|נגמר/.test(p)) {
      const a = Math.min(times[0], times[1]), b = Math.max(times[0], times[1]);
      if ((b - a) % 5 || a % 5) return null;
      const halves = /חצאי שעה/.test(p);
      if (halves && (b - a) % 30) return null;
      return { unit: 'min', strokes: (b - a) / 5, startAt: (a % 60) / 5, value: halves ? (b - a) / 30 : b - a, asked: halves ? 'halves' : 'small' };
    }
    if ((m = /השעון מראה (\d{1,2}):(\d{2})\. כמה דקות עברו מאז \1:00/.exec(p))) {
      const n = Number(m[2]); if (n % 5) return null;
      return { unit: 'min', strokes: n / 5, startAt: 0, value: n, asked: 'small' };
    }
    if (/כמה חצאי שעה יש בשעה/.test(p)) return { unit: 'min', strokes: 12, startAt: 0, value: 2, asked: 'halves' };
    if (/חצי שעה ועוד שיר ארוך חצי שעה/.test(p)) return { unit: 'min', strokes: 12, startAt: 0, value: 60, asked: 'small' };
    if ((m = /כמה דקות יש (ב־(\d+) שעות|ב־1 שעה|בחצי שעה|ברבע שעה)/.exec(p))) {
      const strokes = m[2] ? Number(m[2]) * 12 : /ב־1 שעה/.test(m[1]) ? 12 : /בחצי/.test(m[1]) ? 6 : 3;
      return { unit: 'min', strokes: strokes, startAt: 0, value: strokes * 5, asked: 'small' };
    }
    // seconds and minutes
    if ((m = /(?:שיר נמשך|מנגינה של|כמה שניות יש ב־)\s*(\d+\s*דקות?|דקה אחת)/.exec(p)) && /שניות/.test(p) && !/ו־\d+ שניות/.test(p)) {
      const mins = m[1] === 'דקה אחת' ? 1 : parseInt(m[1], 10);
      return { unit: 'sec', strokes: mins * 12, startAt: 0, value: mins * 60, asked: 'small' };
    }
    if ((m = /(\d+) דקות? ו־(\d+) שניות/.exec(p)) || (m = /(\d+) דקה ו־(\d+) שניות/.exec(p)) || (m = /שיר של (\d+):(\d{2})\. כמה שניות/.exec(p))) {
      const s = Number(m[1]) * 60 + Number(m[2]); if (s % 5) return null;
      return { unit: 'sec', strokes: s / 5, startAt: 0, value: s, asked: 'small' };
    }
    if ((m = /קטע של (\d+) שניות\. כמה דקות ושניות/.exec(p))) {
      const s = Number(m[1]); if (s % 5) return null;
      return { unit: 'sec', strokes: s / 5, startAt: 0, value: Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'), asked: 'mixed' };
    }
    if ((m = /נמשך (\d+) שניות\. כמה דקות/.exec(p))) {
      const s = Number(m[1]); if (s % 60) return null;
      return { unit: 'sec', strokes: s / 5, startAt: 0, value: s / 60, asked: 'big' };
    }
    if ((m = /שני שירים, כל אחד (\d+):(\d{2})\. כמה דקות/.exec(p))) {
      const s = 2 * (Number(m[1]) * 60 + Number(m[2])); if (s % 60) return null;
      return { unit: 'sec', strokes: s / 5, startAt: 0, value: s / 60, asked: 'big' };
    }
    // hours in days, days in weeks, months in a year
    if ((m = /כמה שעות יש ב־(\d+) יממ/.exec(p))) { const d = Number(m[1]); return { unit: 'hour', strokes: 24 * d, startAt: 0, value: 24 * d, asked: 'small' }; }
    if ((m = /כמה ימים יש ב־(\d+) שבועות/.exec(p))) { const w = Number(m[1]); return { unit: 'day', strokes: 7 * w, startAt: 0, value: 7 * w, asked: 'small' }; }
    if ((m = /בעוד (\d+) שבועות ו־(\d+) ימים\. בעוד כמה ימים/.exec(p))) { const d = Number(m[1]) * 7 + Number(m[2]); return { unit: 'day', strokes: d, startAt: 0, value: d, asked: 'small' }; }
    if (/כמה חודשים יש בשנה לועזית/.test(p)) return { unit: 'month', strokes: 12, startAt: 0, value: 12, asked: 'small' };
    return null;
  }

  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    const p = String(item.prompt || '');
    if (/לוח העברי|עברית|בכסלו|בטבת|בשבט|בעומר|365|שנה לועזית רגילה/.test(p)) return null;
    const r = read(p);
    if (!r || !r.strokes || r.strokes > MAX_STROKES) return null;
    if (String(r.value) !== String(item.answer).trim()) return null;   // the strokes give exactly the answer
    const unit = UNITS[r.unit];
    return Object.assign({}, r, { per: unit.per, worth: unit.worth, unitHe: unit, world: WORLDS[WORLD_OF[r.unit]], answer: String(r.value) });
  }
  function specForItem(item) { return plan(item); }

  // ---------------------------------------------------------------- sound
  // One stroke per small unit, a short uncounted pause after every group,
  // and a different, low and long sound when a big unit closes. The week
  // has no extra sound: its seventh stroke IS Shabbat, in its own voice.
  // Time runs on: the closing sound is a stop on a line, never a return.
  const PAUSE = 0.35;
  function soundEvents(spec) {
    if (!spec) return [];
    const ev = [], w = spec.world;
    let t = 0;
    for (let i = 0; i < spec.strokes; i++) {
      const pos = (spec.startAt + i) % spec.per;
      const closes = pos === spec.per - 1;
      if (spec.unit === 'day' && closes) {
        ev.push({ at: t, voice: w.shabbat, hz: 196, dur: 0.6, gain: 0.16, stage: 'cycle', stroke: i, pos: pos, shabbat: true });
        t += STEP + PAUSE;
        continue;
      }
      const night = spec.unit === 'hour' && Math.floor((spec.startAt + i) / 12) % 2 === 1;
      ev.push({ at: t, voice: night ? w.strokeNight : w.stroke, hz: night ? 330 : 523, dur: 0.1, gain: 0.2, stage: 'stroke', stroke: i, pos: pos, night: night });
      t += STEP;
      if (closes) { ev.push({ at: t, voice: w.cycle, hz: 130, dur: 0.6, gain: 0.3, stage: 'cycle', after: i + 1 }); t += PAUSE * 2; }
      else if ((pos + 1) % w.group === 0) t += PAUSE;
    }
    return ev;
  }
  function cyclesClosed(spec) { return soundEvents(spec).filter((e) => e.stage === 'cycle').length; }
  function strokesHeard(spec) { return soundEvents(spec).filter((e) => e.stage === 'stroke' || e.shabbat).length; }

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
  // One row per big unit (cycle); a lit cell is one stroke heard.
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    const rows = [];
    let left = spec.strokes, first = spec.startAt;
    while (left > 0 || !rows.length) {
      const cells = Array.from({ length: spec.per }, (_, i) => {
        const lit = i >= first && i < first + left;
        const label = revealed && spec.worth > 1 ? (i + 1) * spec.worth : '';
        return '<span class="nb-cell ' + (lit ? 'nb-n0' : '') + '">' + esc(label) + '</span>';
      });
      rows.push('<div class="nb-bar" dir="ltr" style="grid-template-columns:repeat(' + spec.per + ',1fr)" aria-label="' + esc(spec.unitHe.big) + '">' + cells.join('') + '</div>');
      left -= spec.per - first;
      first = 0;
      if (rows.length > 6) break;
    }
    const u = spec.unitHe;
    const how = 'במשחק הזה כל מכה היא ' + u.strokeHe + '. ' + (spec.per === 12 && spec.worth === 5 ? 'אחרי 12 מכות נשמע הצליל הנמוך: ' + u.big + ' שלמה — לא אחרי 10 ולא אחרי 100.' : 'אחרי ' + spec.per + ' מכות: ' + u.big + ' שלם.')
      + ' הזמן ממשיך קדימה — הצליל הנמוך הוא תחנה בדרך, לא חזרה להתחלה.';
    return '<div class="time-cycles">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '. ' + how) + '</p>'
      + (revealed ? '' : '<p class="band-predict">לפני שלוחצים — נחשו. ספרו מכות וגונגים.</p>')
      + rows.join('')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '<span class="snd-answer" data-reveal="' + esc(spec.answer) + '">?</span>')
      + '</div>';
  }

  return { MECHANISM: MECHANISM, TAGS: TAGS, UNITS: UNITS, WORLDS: WORLDS, MAX_STROKES: MAX_STROKES, STEP: STEP,
    plan: plan, specForItem: specForItem, soundEvents: soundEvents, cyclesClosed: cyclesClosed, strokesHeard: strokesHeard, play: play, html: html };
});
