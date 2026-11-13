// MelodyMath — MoneyMarket: shekels and agorot, heard (grades א׳–ד׳; tags
// coinGroups, agoraSkip, billBars, agorotTenGroups, shekelHundredGroups).
// Research: docs/research/money-market-2026-11-13.md (Perplexity + Meta AI).
//
// Two layers, never mixed up (Perplexity: a timbre alone is only a label; it
// does not say why a 5-shekel coin equals five 1-shekel coins):
//   the piece — ONE sound per coin or bill (a heavier coin sounds lower and
//     longer; a bill rustles), so "how many coins" is heard on its own;
//   the value — right after each piece, its value in a fixed code: a click is
//     one shekel, a low thump is ten shekels.
// Then: change is counted UP from the price (the shopkeeper's way) — the price
// is one long sound, not a step, and the change is the sum of the steps; agorot
// gather ten clicks into one shekel before anything is counted; price × quantity
// is one bar per item; sharing is dealt in rounds. One world per exercise, never
// more than 12 sounds in a row, and the widget shows only when the sounds give
// exactly the item's answer.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_MONEY_MARKET = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const TAGS = Object.freeze(['coinGroups', 'agoraSkip', 'billBars', 'agorotTenGroups', 'shekelHundredGroups']);
  const MAX_RUN = 12;
  const STEP = 0.28;
  const GAP = 0.55;     // a boundary: between pieces, bars, rounds

  const WORLDS = Object.freeze({
    tray: { he: 'מגש המטבעות בדוכן', why: 'כל מטבע נופל על המגש בצליל אחד — מטבע כבד נשמע נמוך וארוך יותר. מיד אחריו נשמע כמה הוא שווה' },
    seller: { he: 'מוכר שסופר עודף כלפי מעלה', why: 'בהשראת מוכרים בשוק שסופרים את העודף מהמחיר עד השטר. הצליל הארוך הוא המחיר — הוא לא צעד' },
    cup: { he: 'כוס המטבעות בקיוסק', why: 'מטבעות קטנים נופלים לכוס, וכשהכוס מתמלאת היא שווה שקל שלם' },
    stall: { he: 'דוכן בגדים בשוק', why: 'כל פריט שנמכר הוא תיבה אחת, ובכל תיבה אותו מחיר' },
    rounds: { he: 'חלוקה בסבבים', why: 'בכל סבב כל ילד מקבל מטבע אחד, לכל ילד צליל משלו' },
    till: { he: 'קופת המוכר', why: 'מכל מכירה נשאר למוכר אותו רווח קטן' },
  });

  const LEGEND = {
    shekel: 'נקישה = שקל אחד. חבטה נמוכה = עשרה שקלים.',
    agorot: 'צליל דק = מטבע של עשר אגורות. כוס מלאה = שקל, שהוא מאה אגורות. שק כבד = עשרה שקלים.',
    halves: 'צליל קטן = מטבע של חצי שקל. כוס מלאה = שקל שלם.',
  };

  const WORDS = { 'אחד': 1, 'אחת': 1, 'שני': 2, 'שתי': 2, 'שלוש': 3, 'שלושה': 3, 'ארבע': 4, 'ארבעה': 4, 'חמש': 5, 'חמישה': 5, 'שש': 6, 'שישה': 6 };
  const count = (w) => (w == null ? 1 : /^\d+$/.test(w) ? +w : WORDS[w] || null);
  const num = (s) => +String(s).replace(/,/g, '');
  const ansOf = (v) => { const n = num(v); return Number.isFinite(n) ? n : null; };

  // "מטבע של 5 ₪", "שני מטבעות של 2 ₪", "3 מטבעות של 1 ₪", "שטר של 50 ₪"
  const PIECE = /(?:(\d+|שני|שתי|שלושה|שלוש|ארבעה|ארבע) )?(מטבע|מטבעות|שטר|שטרות)(?: אחד)? של (\d+) ₪/g;
  function pieces(text) {
    const out = [];
    let m;
    PIECE.lastIndex = 0;
    while ((m = PIECE.exec(text))) {
      const n = count(m[1]), v = +m[3], bill = /^שטר/.test(m[2]);
      for (let i = 0; i < n; i++) out.push({ value: v, bill: bill });
    }
    return out.sort((a, b) => b.value - a.value);   // the biggest first: count on from it
  }
  const total = (ps) => ps.reduce((s, p) => s + p.value, 0);
  const tensOnes = (v) => ({ tens: Math.floor(v / 10), ones: v % 10 });

  // Reads the item into a listening plan, or null.
  function plan(item) {
    if (!item || item.noMusic || TAGS.indexOf(item.music) < 0) return null;
    const p = String(item.prompt || ''), ans = ansOf(item.answer);
    if (ans == null) return null;
    let m, s = null;
    if ((m = /חילקנו (\d+) ₪ שווה בשווה בין (\d+) ילדים/.exec(p))) {
      const sum = +m[1], kids = +m[2];
      const coin = [10, 5, 2, 1].find((c) => sum % c === 0 && (sum / c) % kids === 0 && sum / c <= MAX_RUN);
      if (coin) s = { kind: 'share', sum: sum, kids: kids, coin: coin, rounds: sum / coin / kids, value: sum / kids, world: WORLDS.rounds, legend: 'כל צליל הוא מטבע של ' + (coin === 5 ? 'חמישה' : coin === 10 ? 'עשרה' : coin === 2 ? 'שני' : 'שקל אחד') + (coin === 1 ? '' : ' שקלים') + '.' };
    } else if ((m = /קנה (\d+) מוצרים ב־(\d+) ₪ כל אחד, ומכר כל אחד מהם ב־(\d+) ₪/.exec(p))) {
      const n = +m[1], gain = +m[3] - +m[2];
      if (gain === 1) s = { kind: 'profit', items: n, value: n * gain, world: WORLDS.till, legend: LEGEND.shekel };
    } else if (/למי שיש לו יותר כסף/.test(p)) {
      const parts = p.split(/, ול/);
      if (parts.length === 2) {
        const a = pieces(parts[0]), b = pieces(parts[1]);
        if (a.length && b.length) s = { kind: 'compare', sides: [a, b], value: Math.max(total(a), total(b)), world: WORLDS.tray, legend: LEGEND.shekel };
      }
    } else if (/עודף|יישארו/.test(p)) {
      let price = null, paid = null;
      if ((m = /שילמנו (\d+) ₪ על קנייה של (\d+) ₪/.exec(p))) { paid = +m[1]; price = +m[2]; }
      else if ((m = /שילמנו (\d+) ₪ על (\d+) \S+ ב־(\d+) ₪ כל/.exec(p))) { paid = +m[1]; price = +m[2] * +m[3]; }
      else if ((m = /קנינו (?:(\d+|שני|שתי|שלושה|שלוש|ארבעה|ארבע) )?\S+ ב־(\d+) ₪(?: כל \S+)? ושילמנו (?:במטבע של |בשטר של |ב־)(\d+) ₪/.exec(p))) { price = count(m[1]) * +m[2]; paid = +m[3]; }
      else if ((m = /^ל\S+ (\d+) ₪\./.exec(p))) {
        paid = +m[1];
        price = (p.match(/ב־(\d+) ₪/g) || []).map((x) => +x.replace(/\D/g, '')).reduce((a, b) => a + b, 0);
      }
      if (price != null && paid > price) {
        const up = Math.min(paid, Math.ceil(price / 10) * 10), ones = up - price, tens = (paid - up) / 10;
        if (Number.isInteger(tens) && ones + tens <= MAX_RUN) s = { kind: 'change', price: price, paid: paid, ones: ones, tens: tens, value: paid - price, world: WORLDS.seller, legend: LEGEND.shekel };
      }
    } else if ((m = /כמה מטבעות של (\d+) (₪|אגורות) (?:שווים|צריך כדי לשלם) (\d+) ₪/.exec(p))) {
      const c = +m[1], unit = m[2], target = +m[3];
      if (unit === '₪' && target % c === 0) {
        s = { kind: 'fill', coin: c, target: target, value: target / c, world: WORLDS.tray, legend: LEGEND.shekel };
      } else if (unit === 'אגורות' && c === 10) {
        s = { kind: 'cupCount', shekels: target, value: target * 10, world: WORLDS.cup, legend: LEGEND.agorot };
      }
    } else if ((m = /^(\S+) מטבעות של 50 אגורות\. כמה ₪ ביחד/.exec(p))) {
      const n = count(m[1]);
      if (n && n % 2 === 0) s = { kind: 'halves', coins: n, value: n / 2, world: WORLDS.cup, legend: LEGEND.halves };
    } else if ((m = /^כמה אגורות יש ב־(\d+) ₪(?: ועוד (\d+) אגורות)?\?/.exec(p))) {
      const sh = +m[1], extra = +(m[2] || 0);
      if (extra % 10 === 0) s = { kind: 'toAgorot', shekels: sh, extra: extra, value: sh * 100 + extra, world: WORLDS.cup, legend: LEGEND.agorot };
    } else if ((m = /^(?:בקופה )?([\d,]+) אגורות(?: הם)?\.? כמה ₪/.exec(p))) {
      const ag = num(m[1]);
      if (ag % 100 === 0) s = { kind: 'toShekels', agorot: ag, value: ag / 100, world: WORLDS.cup, legend: LEGEND.agorot };
    } else if ((m = /^(\S+) \S+ ב־(\d+) ₪ כל (?:אחת|אחד)\. כמה ₪ בסך הכול/.exec(p)) || (m = /^\S+ עולה (\d+) ₪\. כמה ₪ יעלו (\d+) /.exec(p))) {
      const qty = m.length === 3 && /עולה/.test(p) ? +m[2] : count(m[1]);
      const price = /עולה/.test(p) ? +m[1] : +m[2];
      if (qty) s = { kind: 'times', qty: qty, price: price, value: qty * price, world: WORLDS.stall, legend: LEGEND.shekel };
    } else if (/כמה ₪/.test(p)) {
      const ps = pieces(p);
      if (ps.length >= 2 || (ps.length === 1 && /ביחד|בסך הכול/.test(p))) s = { kind: 'sum', pieces: ps, value: total(ps), world: WORLDS.tray, legend: LEGEND.shekel };
    }
    if (!s || s.value !== ans) return null;    // the sounds give exactly the answer
    s.answer = String(s.value);
    const ev = soundEvents(s);
    if (!ev.length || longestRun(ev) > MAX_RUN || ev.length > 32) return null;
    return s;
  }
  function specForItem(item) { return plan(item); }

  // beats closer than 0.45 s are one run (two voices together are one beat)
  function longestRun(ev) {
    let best = 0, run = 0, last = -9;
    [...new Set(ev.map((n) => Math.round(n.at * 1000)))].sort((a, b) => a - b).forEach((ms) => {
      const at = ms / 1000; run = at - last < 0.45 ? run + 1 : 1; last = at; best = Math.max(best, run);
    });
    return best;
  }

  // ---------------------------------------------------------------- sound
  const COIN_HZ = { 1: 1760, 2: 1397, 5: 1047, 10: 784 };
  function soundEvents(spec) {
    if (!spec) return [];
    const ev = [];
    let t = 0;
    const hit = (voice, hz, dur, gain, stage, extra) => { ev.push(Object.assign({ at: t, voice: voice, hz: hz, dur: dur, gain: gain, stage: stage }, extra || {})); };
    const click = (stage, extra, hz) => { hit('woodClick', hz || 1200, 0.06, 0.2, stage, Object.assign({ worth: 1 }, extra)); t += STEP; };
    const thump = (stage, extra, hz) => { hit('drumLow', hz || 110, 0.3, 0.3, stage, Object.assign({ worth: 10 }, extra)); t += STEP * 1.3; };
    const value = (v, extra) => { const tv = tensOnes(v); for (let i = 0; i < tv.tens; i++) thump('value', extra); for (let i = 0; i < tv.ones; i++) click('value', extra); };
    const piece = (pc, extra) => {
      if (pc.bill) hit('shaker', 420, 0.25, 0.18, 'piece', Object.assign({ bill: true }, extra));
      else hit('metalBell', COIN_HZ[pc.value] || 988, 0.12 + 0.02 * (pc.value || 1), 0.22, 'piece', extra);
      t += 0.4;
    };
    // the agorot cup: ten thin coins gather into one shekel — shown once, not counted
    const gatherShekel = () => {
      for (let i = 0; i < 10; i++) { hit('tine', 2093, 0.06, 0.12, 'legend'); t += 0.14; }
      hit('jingle', 523, 0.45, 0.28, 'legendCup'); t += 0.45 + GAP + 0.3;
    };
    const cup = (stage, extra) => { hit('jingle', 523, 0.4, 0.28, stage, Object.assign({ worth: 100 }, extra)); t += STEP * 1.6; };
    const bag = (stage, extra) => { hit('gong', 131, 0.6, 0.3, stage, Object.assign({ worth: 1000 }, extra)); t += STEP * 2; };

    switch (spec.kind) {
      case 'sum':
        spec.pieces.forEach((pc, i) => { piece(pc, { n: i }); value(pc.value, { n: i }); t += GAP; });
        break;
      case 'compare':
        spec.sides.forEach((side, k) => {
          side.forEach((pc, i) => { piece(pc, { side: k, n: i }); value(pc.value, { side: k, n: i }); t += 0.3; });
          t += GAP * 2;
        });
        break;
      case 'fill': {
        // the same coin again and again, its value after it, until the register
        // reaches the amount: a bell. The coins are counted, the bell is not.
        for (let i = 0; i < spec.value; i++) { piece({ value: spec.coin }, { n: i }); value(spec.coin, { n: i }); t += 0.3; }
        hit('metalBell', 2093, 0.5, 0.2, 'reached');
        break;
      }
      case 'change': {
        hit('bowed', 196, STEP * 2.2, 0.24, 'price'); t += STEP * 2.2 + 0.35;   // the price: one long sound, not a step
        let k = 0;
        for (let i = 0; i < spec.ones; i++) click('step', { k: k }, 1200 * Math.pow(2, k++ / 12));    // the seller's count rises
        if (spec.ones && spec.tens) t += 0.3;
        for (let i = 0; i < spec.tens; i++) thump('step', { k: k }, 110 * Math.pow(2, k++ / 12));
        t += 0.2;
        hit('metalBell', 1568, 0.4, 0.2, 'paid');   // the paid amount is reached
        break;
      }
      case 'cupCount':
        gatherShekel();
        for (let i = 0; i < spec.shekels; i++) cup('count', { n: i });
        break;
      case 'halves':
        for (let i = 0; i < spec.coins; i++) {
          hit('metalBell', 1319, 0.12, 0.18, 'half', { n: i }); t += STEP;
          if (i % 2 === 1) { cup('cup', { n: i }); t += 0.25; }
        }
        break;
      case 'toAgorot':
        gatherShekel();
        for (let i = 0; i < spec.shekels; i++) cup('count', { n: i });
        if (spec.extra) { t += 0.3; for (let i = 0; i < spec.extra / 10; i++) { hit('tine', 2093, 0.06, 0.16, 'count', { worth: 10 }); t += STEP; } }
        break;
      case 'toShekels': {
        gatherShekel();
        const sh = spec.value, tv = sh > MAX_RUN ? tensOnes(sh) : { tens: 0, ones: sh };
        for (let i = 0; i < tv.tens; i++) bag('count', { n: i });
        if (tv.tens) t += 0.3;
        for (let i = 0; i < tv.ones; i++) cup('count', { n: i });
        break;
      }
      case 'times':
        for (let b = 0; b < spec.qty; b++) { value(spec.price, { bar: b }); t += GAP; }
        break;
      case 'share': {
        const hz = [523, 659, 784, 1047];
        for (let r = 0; r < spec.rounds; r++) {
          for (let k = 0; k < spec.kids; k++) { hit('metalBell', hz[k % 4], 0.14, 0.22, 'deal', { kid: k, round: r }); t += STEP; }
          t += 0.35;
        }
        break;
      }
      case 'profit':
        for (let i = 0; i < spec.items; i++) { click('gain', { n: i }); if (i % 5 === 4) t += 0.3; }
        break;
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
    sum: 'שתי שאלות שונות: כמה מטבעות ושטרות שמעתם? וכמה כסף זה? מתחילים מהגדול וסופרים הלאה.',
    compare: 'קודם הכסף של הראשון, אחר כך של השני. יותר צלילי מטבע לא אומר יותר כסף — מקשיבים לערך.',
    fill: 'אותו מטבע שוב ושוב, ואחריו כמה הוא שווה. הפעמון מצלצל כשמגיעים לסכום — סופרים את המטבעות, לא את הפעמון.',
    change: 'לא סופרים אחורה מהשטר: סופרים קדימה מהמחיר. העודף הוא כל מה שהוספנו — לא המספר שהגענו אליו.',
    cupCount: 'קודם שומעים איך עשרה מטבעות קטנים ממלאים כוס אחת. אחר כך כל כוס היא שקל — כמה מטבעות קטנים בכל הכוסות?',
    halves: 'כל שני מטבעות קטנים ממלאים כוס אחת. סופרים כוסות.',
    toAgorot: 'קודם שומעים איך כוס מתמלאת. אחר כך כל כוס היא שקל, מאה אגורות. סופרים כוסות ואז את המטבעות הקטנים.',
    toShekels: 'קודם שומעים איך כוס מתמלאת. אחר כך כל כוס היא שקל וכל שק הוא עשרה שקלים.',
    times: 'כל פריט הוא תיבה, ובכל תיבה אותו מחיר. אחרי כל תיבה אומרים את הסכום עד עכשיו.',
    share: 'בכל סבב כל ילד מקבל מטבע אחד. הקשיבו לצליל הנמוך — הילד הראשון — כמה מטבעות קיבל?',
    profit: 'כל נקישה היא הרווח ממכירה אחת.',
  };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    return '<div class="money-market">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '.') + '</p>'
      + '<p class="mm-legend">' + esc(spec.legend) + '</p>'
      + '<p class="band-note">' + esc(HOW[spec.kind]) + '</p>'
      + (revealed
        ? '<p class="band-predict mm-silent">עכשיו בלי צליל: בנו את הסכום עם מטבעות משחק או ציירו אותו — ובדקו שוב.</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו וספרו.</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { TAGS: TAGS, WORLDS: WORLDS, MAX_RUN: MAX_RUN, plan: plan, specForItem: specForItem, soundEvents: soundEvents, longestRun: longestRun, play: play, html: html, pieces: pieces };
});
