// MM-601 pilot — the music of every exercise: what is played, what is shown,
// and what the caption says. The math IS the music here:
//   counting  = notes you hear and see (one note = 1)
//   addition  = two short phrases joined into one melody (piano, then xylophone)
//   subtraction = notes taken off the end of a melody (shown with ✕, played softer)
//   tens      = one low organ note for a whole ten, xylophone notes for the ones
//               (the tens-and-ones sound model of src/lib/grade1Music.js chart100)
//   fractions = a 4/4 bar: a quarter note lasts 1/4 of the bar, a half note 1/2
// A right answer plays the joined melody and lets it "come home" (a soft tonic
// chord); a wrong answer replays the parts slowly and stops before home.
//
// The tune is "Twinkle, Twinkle" (the French folk song "Ah! vous dirai-je,
// maman", 1761, public domain): melody only, no lyrics. No audio file is used.
//
// Sound: the app's own engine and instrument voices, loaded read-only by
// index.html — src/lib/musicEngine.js (the shared AudioContext, exact note
// fractions) and src/lib/instrumentVoices.js (piano, xylophone, organ, wood click).
// Every played plan is also written to window.__mmPilotMusic (a test hook: the
// E2E tests read note counts and pitches there, never a speaker).
//
// The planning half is pure and runs in Node (test/pilotMusic.test.js).
(function (root, factory) {
  const IN_NODE = typeof module === 'object' && !!module.exports;
  const engine = IN_NODE ? require('../../src/lib/musicEngine.js') : (root.musicEngine || null);
  const api = factory(engine, root);
  if (IN_NODE) module.exports = api;
  else root.MMPilotMusic = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (engine, root) {
  'use strict';

  const HZ = {
    C3: 130.81, C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0, A4: 440.0, C5: 523.25
  };
  // Scale step of each note, for the height of a note on screen.
  const STEP = { C3: -3, C4: 0, D4: 1, E4: 2, F4: 3, G4: 4, A4: 5, C5: 7 };
  const TUNE = ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4', 'G4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4'];
  const HOME = ['C4', 'E4', 'G4']; // the tonic chord: the melody "comes home"

  const VOICE = { a: 'keys', b: 'woodBar', removed: 'pluck', ten: 'organ', one: 'woodBar', click: 'woodClick', home: 'keys' };
  const VOICE_HE = { keys: 'פסנתר', woodBar: 'קסילופון', organ: 'עוגב', pluck: 'פריטה חרישית', woodClick: 'נקישת מטרונום' };

  const STEP_SEC = 0.3;     // one counted note
  const PHRASE_GAP = 0.35;  // between the two phrases of an addition
  const SLOW = 1.6;         // the hint plays the same notes this much slower
  const RHYTHM_BPM = 90;

  function note(name, at, dur, voice, role, chip, gain) {
    return { note: name, hz: HZ[name], at: Math.round(at * 1000) / 1000, dur: Math.round(dur * 1000) / 1000, voice: voice, role: role, chip: chip == null ? null : chip, gain: gain == null ? 0.2 : gain };
  }

  function home(at, chip) {
    return HOME.map(function (n) { return note(n, at, 0.9, VOICE.home, 'home', chip, 0.12); });
  }

  // ---------------------------------------------------------------- chips (what is seen)
  // role: a | b (two phrases), removed (taken away), ten, one, home
  function chips(q, stage) {
    const solved = stage === 'right' || stage === 'reveal';
    const out = [];
    if (q.music === 'join') {
      for (let i = 0; i < q.a + q.b; i++) out.push({ role: i < q.a ? 'a' : 'b', note: TUNE[i] });
    } else if (q.music === 'remove') {
      for (let i = 0; i < q.a; i++) out.push({ role: i < q.a - q.b ? 'a' : 'removed', note: TUNE[i] });
    } else if (q.music === 'tens') {
      const tensA = Math.floor(q.a / 10), onesA = q.a % 10;
      if (q.op === '+') {
        // 6 + 10: before the answer, the ones first and the ten after them;
        // once solved, in place-value order: the ten, then the ones.
        const ten = { role: 'ten', note: 'C3' };
        const ones = [];
        for (let i = 0; i < onesA; i++) ones.push({ role: 'one', note: TUNE[i] });
        for (let t = 0; t < tensA; t++) out.push({ role: 'ten', note: 'C3' });
        if (solved) { out.push(ten); ones.forEach(function (c) { out.push(c); }); } else { ones.forEach(function (c) { out.push(c); }); out.push(ten); }
      } else {
        for (let t = 0; t < tensA; t++) out.push({ role: t < tensA - q.b / 10 ? 'ten' : 'removed-ten', note: 'C3' });
        for (let i = 0; i < onesA; i++) out.push({ role: 'one', note: TUNE[i] });
      }
    }
    if (solved && out.length) out.push({ role: 'home', note: 'C4' });
    return out.map(function (c, i) { c.index = i; c.step = STEP[c.note]; return c; });
  }

  // ---------------------------------------------------------------- notes (what is heard)
  // stage: 'question' (opening the exercise / the replay button), 'hint'
  // (after a wrong answer), 'right' or 'reveal' (after the answer).
  function plan(q, stage, choice) {
    if (q.kind === 'rhythm') return rhythmPlan(q, stage, choice);
    const cs = chips(q, stage);
    const solved = stage === 'right' || stage === 'reveal';
    const slow = stage === 'hint' ? SLOW : 1;
    const out = [];
    let at = 0;
    let prevRole = null;
    cs.forEach(function (c) {
      if (c.role === 'home') return;
      // Solved: the removed notes stay silent (they are gone) — only what is left plays.
      if (solved && (c.role === 'removed' || c.role === 'removed-ten')) return;
      if (!solved && prevRole && prevRole !== c.role && q.music === 'join') at += PHRASE_GAP * slow;
      const isTen = c.role === 'ten' || c.role === 'removed-ten';
      const dur = isTen ? 0.7 : 0.26;
      const voice = c.role === 'removed' || c.role === 'removed-ten' ? VOICE.removed : VOICE[c.role] || VOICE.a;
      const gain = c.role === 'removed' || c.role === 'removed-ten' ? 0.09 : (isTen ? 0.24 : 0.2);
      // Joined (solved) melody: one instrument per phrase still, but no gap between them.
      out.push(note(c.note, at, dur * slow, voice, c.role, c.index, gain));
      at += (isTen ? 0.85 : STEP_SEC) * slow;
      prevRole = c.role;
    });
    if (solved) {
      const h = cs.filter(function (c) { return c.role === 'home'; })[0];
      home(at + 0.1, h ? h.index : null).forEach(function (n) { out.push(n); });
    }
    return out;
  }

  // ---------------------------------------------------------------- the fraction bar
  // A 4/4 bar is one whole. Two quarter notes are already in it (beats 1–2);
  // the child picks the rhythm that fills exactly the rest.
  const CHOICES = Object.freeze([
    Object.freeze({ id: 'quarter', symbol: '♩', fraction: '1/4', he: 'רבע תיבה' }),
    Object.freeze({ id: 'half', symbol: '𝅗𝅥', fraction: '1/2', he: 'חצי תיבה' }),
    Object.freeze({ id: 'whole', symbol: '𝅝', fraction: '1', he: 'תיבה שלמה' })
  ]);
  const GIVEN = Object.freeze([{ note: 'E4', fraction: '1/4' }, { note: 'D4', fraction: '1/4' }]);

  function frac(text) {
    if (engine && typeof engine.toFraction === 'function') return engine.toFraction(text);
    const p = String(text).split('/');
    return { n: Number(p[0]), d: Number(p[1] || 1) };
  }
  function add(a, b) {
    if (engine && typeof engine.addFractions === 'function') return engine.addFractions(a, b);
    return { n: a.n * b.d + b.n * a.d, d: a.d * b.d };
  }
  function cmp(a, b) {
    if (engine && typeof engine.compareFractions === 'function') return engine.compareFractions(a, b);
    return Math.sign(a.n * b.d - b.n * a.d);
  }

  // How the bar ends with this choice: 'full' | 'short' | 'over', and the beats it takes.
  function barFill(choiceId) {
    const c = CHOICES.filter(function (x) { return x.id === choiceId; })[0];
    let sum = GIVEN.reduce(function (s, g) { return add(s, frac(g.fraction)); }, { n: 0, d: 1 });
    if (c) sum = add(sum, frac(c.fraction));
    const k = cmp(sum, { n: 1, d: 1 });
    return { status: k === 0 ? 'full' : k < 0 ? 'short' : 'over', total: sum, beats: sum.n * 4 / sum.d, choiceBeats: c ? frac(c.fraction).n * 4 / frac(c.fraction).d : 0 };
  }

  function beatSec() { return 60 / RHYTHM_BPM; }

  function rhythmPlan(q, stage, choice) {
    const beat = beatSec();
    const out = [];
    const pick = stage === 'right' || stage === 'reveal' ? q.answer : (stage === 'hint' ? choice : null);
    const fill = barFill(pick);
    const bars = Math.max(4, Math.ceil(fill.beats));
    for (let b = 0; b < bars; b++) {
      const click = note('C5', b * beat, 0.06, VOICE.click, b < 4 ? 'click' : 'click-over', null, b === 0 ? 0.16 : 0.1);
      click.beat = b;
      out.push(click);
    }
    let at = 0;
    GIVEN.forEach(function (g, i) {
      const f = frac(g.fraction);
      const dur = f.n / f.d * 4 * beat;
      out.push(note(g.note, at, dur * 0.92, VOICE.a, 'given', i, 0.2));
      at += dur;
    });
    if (pick) {
      const c = CHOICES.filter(function (x) { return x.id === pick; })[0];
      const f = frac(c.fraction);
      out.push(note('C4', at, f.n / f.d * 4 * beat * 0.95, VOICE.b, 'chosen', 2, 0.22));
    }
    return out;
  }

  // ---------------------------------------------------------------- captions (what is said)
  // Before the answer a caption names what is heard, never the result
  // (answer-leak rule, test/widgetNoAnswerLeak.test.js); after it, the full sentence.
  function caption(q, stage) {
    const solved = stage === 'right' || stage === 'reveal';
    const r = q.op === '+' ? q.a + q.b : q.a - q.b;
    if (q.kind === 'rhythm') {
      return solved
        ? '1/4 + 1/4 + 1/2 = 1: שני רבעים ועוד חצי תיבה ממלאים תיבה שלמה, והמנגינה חוזרת הביתה.'
        : 'בתיבה יש 4 פעמות = שלם אחד. 2 פעמות כבר מנוגנות. איזה קצב ממלא בדיוק את מה שחסר עד סוף התיבה?';
    }
    if (q.music === 'join') {
      return solved
        ? q.a + ' צלילים ועוד ' + q.b + ' צלילים = ' + r + ' צלילים. המנגינה התחברה וחזרה הביתה.'
        : 'שומעים ' + q.a + ' צלילים בפסנתר ועוד ' + q.b + ' צלילים בקסילופון. כמה צלילים בכל המנגינה?';
    }
    if (q.music === 'remove') {
      return solved
        ? q.a + ' צלילים פחות ' + q.b + ' = ' + r + ' צלילים — אלה הצלילים שנשארו במנגינה.'
        : 'שומעים מנגינה של ' + q.a + ' צלילים. מורידים את ' + q.b + ' הצלילים האחרונים (✕). כמה צלילים נשארים?';
    }
    if (q.music === 'tens' && q.op === '+') {
      return solved
        ? 'צליל נמוך אחד (עשרת) ועוד ' + (q.a % 10) + ' צלילי קסילופון = ' + r + ': עשרת אחת ו־' + (q.a % 10) + ' יחידות.'
        : 'שומעים ' + (q.a % 10) + ' צלילי קסילופון (יחידות) ועוד צליל נמוך אחד בעוגב — עשרת שלמה. כמה ביחד?';
    }
    if (q.music === 'tens') {
      return solved
        ? q.a + ' פחות ' + q.b + ' = ' + r + ': נשאר צליל נמוך אחד, עשרת אחת.'
        : 'שומעים 2 צלילים נמוכים בעוגב — 2 עשרות. מורידים צליל נמוך אחד (✕). כמה נשאר?';
    }
    return '';
  }

  // The musical hint after a wrong answer. Never the answer.
  function hint(q, choice) {
    if (q.kind === 'rhythm') {
      const f = barFill(choice).status;
      if (f === 'short') return 'הקשיבו: אחרי הקצב שבחרתם עוד יש שקט לפני סוף התיבה. צריך קצב ארוך יותר.';
      if (f === 'over') return 'הקשיבו: הקצב שבחרתם ממשיך אחרי סוף התיבה. צריך קצב קצר יותר.';
      return 'הקשיבו לתיבה שוב וספרו 4 פעמות.';
    }
    if (q.music === 'join') return 'התחילו מ־' + q.a + ' וספרו קדימה עוד ' + q.b + ' צלילים. הקשיבו שוב — המנגינה עוד לא הגיעה הביתה.';
    if (q.music === 'remove') return 'התחילו מ־' + q.a + ' וספרו אחורה ' + q.b + ' צלילים, צליל אחד לכל ✕.';
    if (q.music === 'tens' && q.op === '+') return 'צליל נמוך אחד הוא עשרת שלמה. ספרו מהעשרת קדימה את צלילי הקסילופון.';
    return 'כל צליל נמוך הוא עשרת. כמה צלילים נמוכים נשארים אחרי שמורידים אחד?';
  }

  // A short line for screen readers and for "no sound": the same picture in words.
  function describe(q, stage) {
    if (q.kind === 'rhythm') return 'תיבה של 4 פעמות. בפעמה 1 ובפעמה 2 יש תו רבע. פעמות 3 ו־4 עוד ריקות.';
    const cs = chips(q, stage);
    const count = function (role) { return cs.filter(function (c) { return c.role === role; }).length; };
    if (q.music === 'join') return 'מנגינה: ' + count('a') + ' צלילים בפסנתר, ואחריהם ' + count('b') + ' צלילים בקסילופון.';
    if (q.music === 'remove') return 'מנגינה של ' + cs.filter(function (c) { return c.role !== 'home'; }).length + ' צלילים; ' + count('removed') + ' האחרונים מסומנים ✕.';
    if (q.op === '+') return count('one') + ' צלילי קסילופון וצליל עוגב נמוך אחד.';
    return '2 צלילי עוגב נמוכים; האחרון מסומן ✕.';
  }

  // ---------------------------------------------------------------- browser player
  const hook = root && typeof root === 'object' ? (root.__mmPilotMusic = root.__mmPilotMusic || { plays: [] }) : { plays: [] };
  let bus = null;
  let timers = [];
  let muted = false;

  function setMuted(on) { muted = !!on; if (muted) stop(); }
  function isMuted() { return muted; }

  function stop() {
    timers.forEach(function (t) { clearTimeout(t); });
    timers = [];
    if (bus) { try { bus.disconnect(); } catch (e) { /* gone */ } bus = null; }
    try { if (engine && typeof engine.stopAll === 'function') engine.stopAll(); } catch (e) { /* nothing playing */ }
  }

  // Plays the notes with the instrument voices and calls onNote(note) as each
  // one starts (for the on-screen highlight, which runs with or without sound).
  // Returns 'played' when notes were scheduled on Web Audio, 'silent' otherwise.
  function play(id, notes, onNote) {
    stop();
    let audio = 'silent';
    if (!muted && engine && typeof engine.getSharedAudioContext === 'function') {
      try {
        const ac = engine.getSharedAudioContext();
        if (ac) {
          if (typeof engine.unlockAudio === 'function') engine.unlockAudio();
          bus = ac.createGain();
          bus.gain.value = 0.9;
          bus.connect(ac.destination);
          const t0 = ac.currentTime + 0.06;
          if (typeof root.playVoice === 'function') {
            // Quiet notes (taken-away notes, the home chord) go through a softer bus.
            const soft = ac.createGain();
            soft.gain.value = 0.4;
            soft.connect(bus);
            notes.forEach(function (n) {
              root.playVoice(ac, n.voice, n.hz, t0 + n.at, n.gain < 0.15 ? soft : bus, { dur: n.dur, gain: 0.17 });
            });
          } else if (typeof engine.playSequence === 'function') {
            // No instrument voices: the engine's plain tones, same notes and timing.
            engine.playSequence(notes.map(function (n) { return { at: n.at, dur: n.dur, hz: n.hz, gain: n.gain, type: 'triangle' }; }));
          }
          audio = 'played';
        }
      } catch (e) { audio = 'silent'; }
    }
    hook.plays.push({ id: id, audio: audio, notes: notes.map(function (n) { return { note: n.note, hz: n.hz, at: n.at, dur: n.dur, voice: n.voice, role: n.role }; }) });
    if (typeof onNote === 'function' && typeof setTimeout === 'function') {
      notes.forEach(function (n) {
        timers.push(setTimeout(function () { onNote(n); }, Math.round(n.at * 1000) + 60));
      });
      const end = notes.reduce(function (m, n) { return Math.max(m, n.at + n.dur); }, 0);
      timers.push(setTimeout(function () { onNote(null); }, Math.round(end * 1000) + 160));
    }
    return audio;
  }

  return {
    HZ: HZ, TUNE: TUNE, HOME: HOME, VOICE: VOICE, VOICE_HE: VOICE_HE, CHOICES: CHOICES, GIVEN: GIVEN, RHYTHM_BPM: RHYTHM_BPM,
    chips: chips, plan: plan, barFill: barFill, caption: caption, hint: hint, describe: describe,
    play: play, stop: stop, setMuted: setMuted, isMuted: isMuted
  };
});
