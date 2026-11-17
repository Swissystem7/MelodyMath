// MelodyMath — DivisionBeats: the two meanings of division, grades ב׳–ג׳
// (phraseShare, mechanism M2; das2023). Research:
// docs/research/division-hocket-2026-11-13.md (Perplexity + Meta AI).
//
// Two different musical acts, so the two meanings are never confused:
//   measurement (חילוק להכלה) — N equal beats with an accent every k: the
//     child counts the GROUPS. "12 cookies, 3 on each plate: how many plates".
//   sharing (חילוק לחלקים) — hocket: the notes of ONE melody are dealt in
//     turn to k players, each playing every k-th note, like dealing cards
//     round the table. First the whole melody (it sounds like one tune),
//     then one player alone: the child counts that player's notes.
// One world per exercise, and the two meanings use different worlds. The
// tempo is locked. Up to 40 notes and 5 players: beyond that the ear loses
// the count and the item keeps its text. 0 : k is honest silence (nothing
// to share); k = 1 is one player playing every note.
// The widget shows only when the notes give exactly the item's answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_DIVISION_BEATS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const MECHANISM = 'M2';
  const TAG = 'phraseShare';
  const MAX_NOTES = 40;
  const MAX_PLAYERS = 5;
  const STEP = 0.28;
  const GAP = 0.9;
  const TUNE = [262, 294, 330, 392, 440, 392, 330, 294];

  // One voice family per world (Meta AI): the players differ by turn and
  // colour, not by instrument, so the melody stays one melody.
  const WORLDS = Object.freeze({
    baaka: { he: 'בהשראת הפוליפוניה הקולית של קהילות הבא־אקה / באיאקה, אגן קונגו, מרכז אפריקה', voice: 'voiceAh',
      why: 'מסורת חיה: כל קול תורם מוטיב קטן, והמנגינה השלמה קיימת רק ביחד. המנגינה כאן מקורית, בסגנון הוקט קולי' },
    siku: { he: 'סיקו, חלילי פאן מהאנדים', voice: 'breathy',
      why: 'שני נגנים, איירה וארקה, משלימים יחד מנגינה אחת: כל אחד מנגן רק חלק מהצלילים' },
    drumPath: { he: 'שביל התוף', beat: 'frameDrum', accent: 'drumLow',
      why: 'מתופף אחד על תוף מסגרת: טק־טק־בום. הבום סוגר כל קבוצה, ואין מנגינה בכלל' },
  });
  function shareWorld(k) { return k === 2 ? WORLDS.siku : WORLDS.baaka; }

  function answerOf(v) { const n = Number(v); return Number.isInteger(n) ? n : null; }

  // Reads N and k from the item. The meaning comes from the standard the item
  // teaches (חילוק לחלקים = sharing, חילוק להכלה = measurement).
  function plan(item) {
    if (!item || item.noMusic || item.music !== TAG) return null;
    const p = String(item.prompt || ''), std = String(item.standard || '');
    const meaning = /לחלקים/.test(std) ? 'share' : /להכלה/.test(std) ? 'measure' : null;
    if (!meaning) return null;
    let m, n = null, k = null;
    if ((m = /(\d+)\s*÷\s*(\d+)\s*=\s*\?/.exec(p))) { n = Number(m[1]); k = Number(m[2]); }
    else if (meaning === 'share' && (m = /(\d+)\s+\S+\s+ל[־-](\d+)\s+ילדים/.exec(p))) { n = Number(m[1]); k = Number(m[2]); }
    else if (meaning === 'measure' && (m = /(\d+)\s+\S+,\s*(\d+)\s+בכל/.exec(p))) { n = Number(m[1]); k = Number(m[2]); }
    const ans = answerOf(item.answer);
    if (n == null || k == null || ans == null || k < 1 || n % k !== 0 || n / k !== ans) return null;
    if (n > MAX_NOTES) return null;
    if (meaning === 'share' && k > MAX_PLAYERS) return null;
    if (meaning === 'measure' && k < 2 && n > 0) return null;
    return { kind: meaning, n: n, k: k, answer: ans, world: meaning === 'share' ? shareWorld(k) : WORLDS.drumPath };
  }
  function specForItem(item) { return plan(item); }

  // ---------------------------------------------------------------- sound
  // measure: tak-tak-BOOM, the boom closes each group (count the booms).
  // share, mode 'whole': the melody in one voice, then the same melody dealt
  //   in turn (hocket), so the split never sounds like a broken tune.
  // share, mode 'solo': player 1 at full volume, the others as soft ghosts.
  function soundEvents(spec, mode) {
    if (!spec || spec.n === 0) return [];   // 0 : k — nothing to share, honest silence
    const ev = [];
    if (spec.kind === 'measure') {
      for (let b = 0; b < spec.n; b++) {
        const close = b % spec.k === spec.k - 1;
        ev.push({ at: b * STEP, voice: close ? spec.world.accent : spec.world.beat, hz: close ? 130 : 523, dur: close ? 0.22 : 0.08, gain: close ? 0.3 : 0.12,
          stage: close ? 'boom' : 'tak', beat: b, group: Math.floor(b / spec.k) });
      }
      return ev;
    }
    const voice = spec.world.voice;
    if (mode === 'solo') {
      for (let i = 0; i < spec.n; i++) {
        const mine = i % spec.k === 0;
        ev.push({ at: i * STEP, voice: voice, hz: TUNE[i % TUNE.length], dur: 0.2, gain: mine ? 0.28 : 0.04, stage: mine ? 'solo' : 'ghost', note: i, player: i % spec.k });
      }
      return ev;
    }
    for (let i = 0; i < spec.n; i++) ev.push({ at: i * STEP, voice: voice, hz: TUNE[i % TUNE.length], dur: 0.2, gain: 0.22, stage: 'unison', note: i });
    const t0 = spec.n * STEP + GAP;
    for (let i = 0; i < spec.n; i++) ev.push({ at: t0 + i * STEP, voice: voice, hz: TUNE[i % TUNE.length], dur: 0.2, gain: 0.22, stage: 'hocket', note: i, player: i % spec.k });
    return ev;
  }

  function play(spec, env, mode) {
    const e = env || {};
    const events = soundEvents(spec, mode);
    if (!spec) return null;
    const pv = e.playVoice || (root && root.playVoice);
    const ac = e.audioContext || (root && typeof root.getSharedAudioContext === 'function' ? root.getSharedAudioContext() : null);
    if (events.length && typeof pv === 'function' && ac) {
      if (ac.state === 'suspended' && ac.resume) { try { ac.resume(); } catch (err) { /* autoplay */ } }
      const start = ac.currentTime + 0.05;
      events.forEach((n) => pv(ac, n.voice, n.hz, start + n.at, null, { dur: n.dur, gain: n.gain }));
      return { notes: events.length };
    }
    return { notes: events.length, silent: true };
  }

  // ---------------------------------------------------------------- picture
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    let body = '', buttons = '';
    if (spec.n === 0) {
      // five empty trays: nothing to share, each gets nothing (Meta AI)
      body = '<p class="band-note">אין תווים לחלק. כל אחד קיבל 0 — כולם מחכים.</p><div class="db-trays">'
        + Array.from({ length: spec.k }, (_, i) => '<span class="db-tray">נגן ' + (i + 1) + ': —</span>').join('') + '</div>';
    } else if (spec.kind === 'measure') {
      // stones on a path; the brackets of the groups show after the answer
      const cells = Array.from({ length: spec.n }, (_, b) => '<span class="nb-cell ' + (revealed ? (Math.floor(b / spec.k) % 2 ? 'nb-n2' : 'nb-n0') : '') + (b % spec.k === 0 && b > 0 && revealed ? ' nb-barline' : '') + '"></span>');
      body = '<div class="nb-bar" dir="ltr" style="grid-template-columns:repeat(' + Math.min(spec.n, 20) + ',1fr)">' + cells.join('') + '</div>';
      buttons = '<button type="button" class="snd-play db-play" data-mode="whole">▶ שמעו את השביל</button>';
    } else {
      // one row per player. Player 1's notes light up once the child has
      // heard the solo (class db-listened on the host), so they count in a frozen picture.
      body = Array.from({ length: spec.k }, (_, pl) => {
        const cells = Array.from({ length: spec.n }, (_, i) => '<span class="nb-cell ' + (i % spec.k === pl ? (pl === 0 ? 'db-mine' : '') + (revealed ? ' nb-n' + (pl % 3) : '') : '') + '"></span>').join('');
        return '<div class="ms-try"><span class="ms-label">נגן ' + (pl + 1) + '</span><div class="nb-bar" dir="ltr" style="grid-template-columns:repeat(' + spec.n + ',1fr)">' + cells + '</div></div>';
      }).join('');
      buttons = '<button type="button" class="snd-play db-play" data-mode="whole">▶ כל המנגינה</button>'
        + (spec.k > 1 ? '<button type="button" class="snd-play db-play" data-mode="solo">▶ רק נגן 1</button>' : '');
    }
    const how = spec.n === 0 ? 'אפס חלקי כל מספר הוא אפס.'
      : spec.kind === 'measure' ? 'סופרים בומים: כמה קבוצות?'
        : spec.k === 1 ? 'כשיש נגן אחד בלבד אין חלוקה: הוא מנגן את כל המנגינה לבד.'
          : 'קודם המנגינה בקול אחד, ואז אותה מנגינה מחולקת בתור בין הנגנים. אחר כך "רק נגן 1" — והאחרים בשקט־שקט. סופרים את הצלילים שלו.';
    const ans = String(spec.answer);
    return '<div class="division-beats">'
      + '<p class="band-note">' + esc(spec.world ? spec.world.he + ': ' + spec.world.why + '. ' + how : how) + '</p>'
      + (revealed ? '' : '<p class="band-predict">לפני שלוחצים — נחשו.</p>')
      + body + buttons
      + (revealed ? '<span class="snd-answer">' + esc(ans) + '</span>' : '<span class="snd-answer" data-reveal="' + esc(ans) + '">?</span>')
      + '</div>';
  }

  return { MECHANISM: MECHANISM, TAG: TAG, WORLDS: WORLDS, MAX_NOTES: MAX_NOTES, MAX_PLAYERS: MAX_PLAYERS, STEP: STEP,
    plan: plan, specForItem: specForItem, soundEvents: soundEvents, play: play, html: html };
});
