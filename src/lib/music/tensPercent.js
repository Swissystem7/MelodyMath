// MelodyMath — TensPercent: crossing a ten and whole tens (grades א׳–ב׳; tags
// countOnBeats, accentTens, tensAccentJumps, rowAccent) and percent (grade ו׳;
// tags wholeFromTenth, shortenByPercent), heard. Research:
// docs/research/tens-percent-2026-11-14.md (Perplexity + Meta AI).
//
// Meta AI: "a ten stays a tombak gather in the whole app" — new worlds add new
// meanings, they never redefine a ten. So values are always the Persian tombak
// of grade 1: bak (high) = one, tom (low) = ten, a deep long tom = a hundred;
// ten baks gather into a tom, ten toms into a hundred.
//   crossing a ten — the one more bak makes ten baks, which flip into a tom.
//   whole tens — toms only; taking away leaves silent slots (silence is zero).
//   the hundred chart — a row is a tom, a cell a bak.
//   percent — Jamaican reggae: a guitar skank is a tenth, a nyabinghi drum a
//     quarter; a percent block is always followed by its tombak value, so 10%
//     never sounds like 10.
// Only items with nothing else to hear (no widget, no `hear` line). Never more
// than 12 sounds in a row; the widget shows only when the sounds (with the
// numbers in the text) give exactly the item's answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_TENS_PERCENT = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TAGS = Object.freeze(['countOnBeats', 'accentTens', 'tensAccentJumps', 'rowAccent', 'wholeFromTenth', 'shortenByPercent']);
  const MAX_RUN = 12;
  const MAX_EVENTS = 56;
  const STEP = 0.24, TOM = 0.32, GAP = 0.6;

  const WORLDS = {
    tombak: { he: 'טומבק פרסי', why: 'לטומבק שני צלילים אמיתיים: תום נמוך הוא קבוצה של עשר, בק גבוה הוא אחד, ותום עמוק וארוך הוא מאה. כאן נמוך לא אומר קטן — נמוך אומר עשר' },
    reggae: { he: 'רגאיי ג׳מייקני', why: 'מוזיקה מג׳מייקה: סקאנק של גיטרה הוא עשירית, ותוף ניאבינגי הוא רבע. הערך שאחרי כל אחד מהם תמיד בטומבק — תום הוא עשר, בק הוא אחד, ותום עמוק וארוך הוא מאה' },
  };
  const OTHER_SOUND = ['widget', 'g1', 'g2', 'g3', 'bar', 'line', 'ruler', 'clock', 'vert', 'chart', 'grid'];

  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    if (OTHER_SOUND.some((k) => item[k]) || (item.hear && item.hear.length)) return null;   // it already has something to hear
    const p = String(item.prompt || '').trim();
    const raw = String(item.answer).trim();
    let m, s = null;
    if ((m = /^(\d+), ואז המספר הבא\?$/.exec(p))) { const n = +m[1]; if (n % 10 === 9) s = { kind: 'cross', n: n, value: n + 1 }; }
    else if ((m = /^(\d+) − (\d+) = \?$/.exec(p))) {
      const a = +m[1], b = +m[2];
      if (a % 10 === 0 && b % 10 === 0 && a <= 100 && b <= a) s = { kind: 'tensMinus', a: a, b: b, value: a - b };
    } else if ((m = /^בלוח המאה: 1 עשרת ו־(\d) יחידות — איזה מספר (?:זה|נשמע)\?$/.exec(p))) {
      // only the singular form: "N עשרות" is already played by DragPlace
      s = { kind: 'chart', n: 10 + +m[1], value: 10 + +m[1] };
    } else if ((m = /^במספר (\d+) בלוח המאה: כמה (עשרות נמוכות|נקישות יחידות) נשמעות\?$/.exec(p))) {
      const n = +m[1], ask = /עשרות/.test(m[2]) ? 'tens' : 'ones';
      s = { kind: 'chart', n: n, ask: ask, value: ask === 'tens' ? Math.floor(n / 10) : n % 10 };
    } else if ((m = /^(\d+)% ממספר הם (\d+)\. מהו המספר\?$/.exec(p)) || (m = /^(\d+)% מה\S+ ב\S+ הם (\d+) \S+\. כמה \S+ ב\S+\?$/.exec(p))) {
      s = wholePlan(+m[1], +m[2]);
    } else if ((m = /^כמה אחוזים הם (\d+) מתוך (\d+)\? \(מספר בלבד\)$/.exec(p))) {
      const part = +m[1], whole = +m[2];
      if (whole % 4 === 0 && part === whole / 4 && whole <= 99) s = { kind: 'whatPercent', part: part, whole: whole, value: 25 };
    } else if ((m = /^\S+ עולה (\d+) ש״ח, ויש הנחה של 10%\. כמה משלמים\?$/.exec(p))) {
      const price = +m[1]; if (price % 10 === 0 && price <= 90) s = { kind: 'discount', price: price, tenth: price / 10, value: price - price / 10 };
    } else if ((m = /^מחיר של (\d+) ש״ח התייקר ב־(\d)0%\. מה המחיר החדש\?$/.exec(p))) {
      const price = +m[1], k = +m[2]; if (price % 10 === 0 && price <= 90 && k <= 3) s = { kind: 'markup', price: price, k: k, tenth: price / 10, value: price + k * price / 10 };
    } else if ((m = /^מחיר ירד מ־(\d+) ש״ח ל־(\d+) ש״ח\. בכמה אחוזים ירד\? \(מספר בלבד\)$/.exec(p))) {
      const a = +m[1], b = +m[2];
      if (a % 100 === 0 && a <= 300 && (a - b) * 4 === a) s = { kind: 'change', a: a, b: b, value: 25 };
    }
    if (!s || String(s.value) !== raw) return null;   // the sounds give exactly the answer
    s.world = WORLDS[/^(cross|tensMinus|chart)$/.test(s.kind) ? 'tombak' : 'reggae'];
    s.answer = String(s.value);
    let ev;
    try { ev = soundEvents(s); } catch (e) { return null; }
    if (!ev.length || longestRun(ev) > MAX_RUN || ev.length > MAX_EVENTS) return null;
    return s;
  }

  // p% is v: blocks of a tenth (skank) or a quarter (drum); one block's share; all the blocks
  function wholePlan(pct, v) {
    const unit = pct % 25 === 0 && pct % 10 !== 0 ? 25 : pct % 10 === 0 ? 10 : 0;
    if (!unit) return null;
    const k = pct / unit, share = v / k;
    if (!Number.isInteger(share) || share > 99) return null;
    const whole = share * (100 / unit);
    if (whole > 199) return null;
    return { kind: 'whole', pct: pct, v: v, unit: unit, k: k, share: share, value: whole };
  }
  function specForItem(item) { return plan(item); }

  function longestRun(ev) {
    let best = 0, run = 0, last = -9;
    [...new Set(ev.map((e) => Math.round(e.at * 1000)))].sort((a, b) => a - b).forEach((ms) => {
      const at = ms / 1000; run = at - last < 0.3 ? run + 1 : 1; last = at; best = Math.max(best, run);
    });
    return best;
  }

  // ---------------------------------------------------------------- sound
  function soundEvents(spec) {
    if (!spec) return [];
    const ev = [];
    let t = 0;
    const hit = (voice, hz, dur, gain, stage, extra) => { ev.push(Object.assign({ at: t, voice: voice, hz: hz, dur: dur, gain: gain, stage: stage }, extra || {})); };
    const bak = (stage, extra) => { hit('drumHigh', 523, 0.1, 0.2, stage, extra); t += STEP; };
    const tom = (stage, extra) => { hit('drumLow', 98, 0.35, 0.3, stage, extra); t += TOM; };
    const hundred = (stage, extra) => { hit('drumLow', 65, 0.7, 0.3, stage, extra); t += 0.8; };
    // a value in the tombak: hundreds, toms, baks — a short silence between kinds
    const value = (n, stage) => {
      const h = Math.floor(n / 100), tn = Math.floor((n % 100) / 10), o = n % 10;
      for (let i = 0; i < h; i++) hundred(stage, { worth: 100 });
      if (h && (tn || o)) t += 0.2;
      for (let i = 0; i < tn; i++) tom(stage, { worth: 10 });
      if (tn && o) t += 0.2;
      for (let i = 0; i < o; i++) bak(stage, { worth: 1 });
      t += GAP;
    };
    const gather = () => { for (let i = 0; i < 10; i++) { hit('drumHigh', 523, 0.06, 0.12, 'gather'); t += 0.12; } hit('drumLow', 98, 0.4, 0.3, 'gatherTom'); t += 0.9; };
    const skank = (stage, extra) => { hit('pluck', 440, 0.08, 0.18, stage, extra); hit('pluck', 554, 0.08, 0.18, stage + 'Chord', extra); t += 0.4; };
    const drum = (stage, extra) => { hit('frameDrum', 150, 0.3, 0.2, stage, extra); t += 0.45; };
    switch (spec.kind) {
      case 'cross': {
        gather();
        value(spec.n, 'start');
        bak('plusOne'); t += 0.3;
        hit('drumLow', 98, 0.4, 0.3, 'flipTen'); t += 0.6;                                   // ten baks flip into a tom
        if (spec.value % 100 === 0) { hit('drumLow', 65, 0.7, 0.3, 'flipHundred'); t += 0.9; }   // and ten toms into a hundred
        value(spec.value, 'result');
        break;
      }
      case 'tensMinus': {
        gather();
        // a hundred opens into its ten toms first
        if (spec.a === 100) { hundred('start'); for (let i = 0; i < 10; i++) { hit('drumLow', 98, 0.2, 0.2, 'open'); t += 0.12; } t += GAP; }
        else { for (let i = 0; i < spec.a / 10; i++) tom('start', { i: i }); t += GAP; }
        // the same slots again: the ones taken away are silent — what is left sounds
        const keep = (spec.a - spec.b) / 10;
        for (let i = 0; i < spec.a / 10; i++) { if (i < keep) tom('left', { i: i }); else t += TOM; }
        break;
      }
      case 'chart':
        gather();
        value(spec.n, spec.ask ? 'number' : 'chart');
        break;
      case 'whole': {
        const block = spec.unit === 10 ? skank : drum, all = 100 / spec.unit;
        for (let i = 0; i < spec.k; i++) block('given', { i: i });
        t += 0.2; value(spec.v, 'givenValue');
        block('one'); t += 0.2; value(spec.share, 'share');                                    // one block, and its share
        for (let i = 0; i < all; i++) block('all', { i: i });                                  // the whole: all the blocks
        t += 0.3; value(spec.value, 'whole');
        break;
      }
      case 'whatPercent':
        value(spec.whole, 'whole');
        for (let i = 0; i < 4; i++) { drum('quarter', { i: i }); if (i === 0) value(spec.part, 'share'); }
        break;
      case 'discount':
        value(spec.price, 'price');
        skank('tenth'); t += 0.2; value(spec.tenth, 'off');                                    // a tenth: one bak from every tom
        value(spec.value, 'pay');
        t += spec.tenth * STEP;                                                                // what was taken away: silence
        break;
      case 'markup':
        value(spec.price, 'price');
        for (let i = 0; i < spec.k; i++) { skank('tenth', { i: i }); value(spec.tenth, 'add'); }
        value(spec.value, 'newPrice');
        break;
      case 'change':
        value(spec.a, 'before');
        value(spec.b, 'after');
        value(spec.a - spec.b, 'drop');
        for (let i = 0; i < 4; i++) { drum('quarter', { i: i }); if (i === 0) value((spec.a) / 4, 'quarterValue'); }   // the price before, in quarters
        break;
      default: break;
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
    cross: 'קודם עשרה בקים מתקבצים לתום אחד. אחר כך המספר, ועוד בק אחד — עשרה בקים מתהפכים לתום. כמה תומים עכשיו?',
    tensMinus: 'קודם עשרה בקים מתקבצים לתום אחד. אחר כך התומים של המספר הראשון, ושוב באותם מקומות — מה שהורד הוא שקט. כמה תומים נשארו?',
    chart: 'בלוח המאה שורה היא תום ומשבצת היא בק. כמה מכל אחד?',
    whole: 'הבלוקים של האחוז, ואחריהם הערך שלהם בטומבק. אחר כך בלוק אחד והחלק שלו, ובסוף כל הבלוקים של השלם.',
    whatPercent: 'השלם בטומבק, ואחריו ארבעה תופים שווים — הראשון עם הערך שלו. כמה תופים הוא החלק?',
    discount: 'המחיר. אחר כך סקאנק — עשירית: בק אחד מכל תום. ואז מה שמשלמים, ושקט במקום מה שירד.',
    markup: 'המחיר. אחר כך סקאנק לכל עשירית שנוספת, עם הערך שלה. ואז המחיר החדש.',
    change: 'המחיר לפני, המחיר אחרי, וההפרש. אחר כך המחיר שלפני בארבעה תופים שווים — הראשון עם הערך שלו. כמה תופים הוא ההפרש?',
  };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    return '<div class="tens-percent">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '.') + '</p>'
      + '<p class="band-note">' + esc(HOW[spec.kind]) + '</p>'
      + (revealed
        ? '<p class="band-predict tp-silent">עכשיו בלי צליל: ציירו את התומים והבקים, ובדקו שוב.</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו: כמה תומים, כמה בקים?</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { TAGS: TAGS, MAX_RUN: MAX_RUN, plan: plan, specForItem: specForItem, soundEvents: soundEvents, longestRun: longestRun, play: play, html: html };
});
