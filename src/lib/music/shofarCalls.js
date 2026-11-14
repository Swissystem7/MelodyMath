// MelodyMath — ShofarCalls: the calls of the shofar as multiplication and the
// distributive law (grades ג׳–ד׳). Research: docs/research/instruments-catalog-
// 2026-11-14.md; integration advice: docs/research/meta-integration-2026-11-14.md
// (Meta AI: the first new world is the shofar — it is already an instrument of
// the app, and one only counts calls).
//
// A call (קול) is one unit of the count:
//   תקיעה — one long blast;
//   שברים — three medium blasts, heard and counted as ONE call;
//   תרועה — a rattle of short blasts, ONE call (the tradition asks for at least
//           nine; the child never has to count them).
// The order of the thirty calls is תשר״ת three times, תש״ת three times and
// תר״ת three times: 3 × 4 + 3 × 3 + 3 × 3. The same thirty calls as a round —
// תשר״ת, תש״ת, תר״ת is ten calls, three times — are 3 × (4 + 3 + 3). Two
// orders of the same calls: the distributive law, heard.
// A group heard once in full may then be repeated as one bell worth the whole
// group (the TimesTable bundle). Only items marked kind: 'shofar'; the widget
// shows only when the calls (and bells) give exactly the item's answer, and
// never more than 12 sounds in a row.
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_SHOFAR_CALLS = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  const MAX_RUN = 12;
  const MAX_EVENTS = 60;
  const SEQS = Object.freeze({ 'תשר״ת': ['T', 'S', 'R', 'T'], 'תש״ת': ['T', 'S', 'T'], 'תר״ת': ['T', 'R', 'T'] });
  const ROUND = ['תשר״ת', 'תש״ת', 'תר״ת'];
  const WORLD = { he: 'קריאות השופר', why: 'השופר הוא קרן של איל. כל קול נספר פעם אחת: תקיעה היא צליל ארוך, שברים הם שלושה צלילים בינוניים, ותרועה היא הרבה צלילים קצרצרים — וכל אחד מהם הוא קול אחד' };

  function plan(item) {
    if (!item || item.noMusic || item.kind !== 'shofar') return null;
    const p = String(item.prompt || '').trim();
    const raw = String(item.answer).trim();
    let m, s = null;
    if ((m = /^(תשר״ת|תש״ת|תר״ת) הם (?:ארבעה|שלושה) קולות: [^.]+\. תוקעים אותם ([23]) פעמים\. כמה קולות\?$/.exec(p))) {
      s = { kind: 'repeat', seq: m[1], times: +m[2], value: SEQS[m[1]].length * +m[2] };
    } else if (/^קולות השופר: 3 × 4 \+ 3 × 3 \+ 3 × 3 = \?$/.test(p)) {
      s = { kind: 'bySeq', value: 30 };
    } else if (/^3 × 4 \+ 3 × 3 \+ 3 × 3 = 3 × ☐$/.test(p)) {
      s = { kind: 'round', value: 10 };
    }
    if (!s || String(s.value) !== raw) return null;   // the calls give exactly the answer
    s.world = WORLD;
    s.answer = String(s.value);
    let ev;
    try { ev = soundEvents(s); } catch (e) { return null; }
    if (!ev.length || longestRun(ev) > MAX_RUN || ev.length > MAX_EVENTS || worth(ev) !== heardValue(s)) return null;
    return s;
  }
  function specForItem(item) { return plan(item); }

  // what the calls and bells add up to: the answer for repeat and bySeq; for a
  // round, the whole thirty (the answer is how many calls are in one round)
  function heardValue(s) { return s.kind === 'round' ? 30 : s.value; }
  function worth(ev) { return ev.reduce((sum, n) => sum + (n.worth || 0), 0); }

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
    let t = 0, calls = 0;
    const blast = (hz, dur, gain, stage, extra) => { ev.push(Object.assign({ at: t, voice: 'horn', hz: hz, dur: dur, gain: gain, stage: stage }, extra || {})); };
    const call = (c, stage) => {
      calls += 1;
      if (c === 'T') { blast(220, 0.9, 0.24, stage, { call: 'T', worth: 1 }); t += 1.0; }
      else if (c === 'S') { for (let i = 0; i < 3; i++) { blast(247, 0.26, 0.22, stage, i ? { call: 'S' } : { call: 'S', worth: 1 }); t += 0.34; } t += 0.1; }
      else { for (let i = 0; i < 9; i++) { blast(262, 0.07, 0.2, stage, i ? { call: 'R' } : { call: 'R', worth: 1 }); t += 0.1; } t += 0.2; }
      t += 0.4;   // a breath between calls, so calls never run together
    };
    const seq = (name, stage) => { SEQS[name].forEach((c) => call(c, stage)); t += 0.5; };
    const bell = (w, stage) => { ev.push({ at: t, voice: 'metalBell', hz: 660, dur: 0.6, gain: 0.2, stage: stage, worth: w }); t += 0.9; };
    switch (spec.kind) {
      case 'repeat':
        for (let i = 0; i < spec.times; i++) seq(spec.seq, 'rep' + i);
        break;
      case 'bySeq':   // 3 × 4 + 3 × 3 + 3 × 3: each sequence in full once, then a bell for each repeat
        ROUND.forEach((name) => { seq(name, name); bell(SEQS[name].length, 'again'); bell(SEQS[name].length, 'again'); t += 0.4; });
        break;
      case 'round':   // 3 × (4 + 3 + 3): the round of ten in full once, then a bell for each repeat
        ROUND.forEach((name) => seq(name, 'round'));
        bell(10, 'roundAgain'); bell(10, 'roundAgain');
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
    repeat: 'הסדר נשמע כמה פעמים. ספרו קולות, לא צלילים: שברים הם קול אחד, ותרועה היא קול אחד.',
    bySeq: 'כל סדר נשמע פעם אחת במלואו, ואחריו פעמון לכל פעם שהוא חוזר. ספרו קולות.',
    round: 'הפעם הסדרים באים יחד, כסבב אחד, ואחריו פעמון לכל פעם שהסבב חוזר. אלה אותם קולות בסדר אחר. כמה קולות בסבב אחד?',
  };
  function html(spec, opts) {
    if (!spec) return '';
    const revealed = !!(opts && opts.revealed);
    return '<div class="shofar-calls">'
      + '<p class="band-note">' + esc(spec.world.he + ': ' + spec.world.why + '.') + '</p>'
      + '<p class="band-note">' + esc(HOW[spec.kind]) + '</p>'
      + (revealed
        ? '<p class="band-predict sc-silent">עכשיו בלי צליל: כתבו את הקולות בשורה וספרו שוב.</p>'
        : '<p class="band-predict">לפני שלוחצים — נחשו. אחר כך הקשיבו וספרו קולות.</p>')
      + '<button type="button" class="snd-play">▶ שמעו</button>'
      + (revealed ? '<span class="snd-answer">' + esc(spec.answer) + '</span>' : '')
      + '</div>';
  }

  return { MAX_RUN: MAX_RUN, SEQS: SEQS, plan: plan, specForItem: specForItem, soundEvents: soundEvents, longestRun: longestRun, play: play, html: html };
});
