// MelodyMath — MusicianshipPath logic (#591, owner comment 6376067230 part 2).
//
// A short optional path (2-3 minutes, offered after a maths session, always
// skippable) that teaches four real music skills for their own sake:
//   1. rhythm   - reading whole, half, quarter and eighth notes
//   2. pitch    - hearing a tone (or an interval) and finding it again
//   3. families - sorting instruments into percussion/strings/winds/keys
//   4. timbre   - "which instrument is playing now?" from 2-4 choices
//
// Music is the goal here, not a route to maths: Sala & Gobet (2020) found
// about zero transfer from music training to maths once study quality is
// controlled, so no text in this path says otherwise, and its progress lives
// under its own storage key, apart from every maths mastery/progress record.
// It never touches a topic's one primary music way (dosage rules,
// comment 6368976807): instruments here are only heard and named.
//
// Everything is pure: item generators are deterministic for a given seed
// (mulberry32), scoring returns plain objects, and load/save take an
// injectable storage (localStorage in the browser, a Map-like stub in tests).
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_MUSICIANSHIP = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';

  function need(path) {
    try { return require(path); } catch (e) { return null; }
  }
  function instrumentsLib() {
    if (root && Array.isArray(root.INSTRUMENTS) && Array.isArray(root.FAMILIES)) return { INSTRUMENTS: root.INSTRUMENTS, FAMILIES: root.FAMILIES };
    return need('../instruments.js');
  }

  const STORAGE_KEY = 'mm.musicianship.progress';
  const SKILLS = [
    { id: 'rhythm', he: 'קריאת קצב', icon: '🎼' },
    { id: 'pitch', he: 'התאמת גובה צליל', icon: '🎹' },
    { id: 'families', he: 'משפחות כלים', icon: '🪗' },
    { id: 'timbre', he: 'זיהוי גוון', icon: '👂' },
  ];
  const SKILL_IDS = SKILLS.map(function (s) { return s.id; });
  const ITEMS_PER_SKILL = 2; // 8 short items, about 15-20 s each = 2-3 minutes

  const FAMILY_HE = { percussion: 'כלי הקשה', strings: 'כלי מיתר', winds: 'כלי נשיפה', keys: 'כלי מקלדת' };

  // Note values in beats of a 4/4 bar.
  const NOTES = [
    { id: 'whole', he: 'תו שלם', beats: 4, sym: '𝅝' },
    { id: 'half', he: 'חצי', beats: 2, sym: '𝅗𝅥' },
    { id: 'quarter', he: 'רבע', beats: 1, sym: '♩' },
    { id: 'eighth', he: 'שמינית', beats: 0.5, sym: '♪' },
  ];
  const NOTE = {};
  NOTES.forEach(function (n) { NOTE[n.id] = n; });

  // C major, C4..C5: the eight keys the child plays back on.
  const SCALE = [
    { step: 0, he: 'דו', hz: 261.63 },
    { step: 1, he: 'רה', hz: 293.66 },
    { step: 2, he: 'מי', hz: 329.63 },
    { step: 3, he: 'פה', hz: 349.23 },
    { step: 4, he: 'סול', hz: 392.0 },
    { step: 5, he: 'לה', hz: 440.0 },
    { step: 6, he: 'סי', hz: 493.88 },
    { step: 7, he: 'דו גבוה', hz: 523.25 },
  ];

  // ---------- deterministic randomness ----------
  function rng(seed) {
    let a = (Number(seed) >>> 0) || 1;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function pick(rand, list) { return list[Math.floor(rand() * list.length)]; }
  function shuffle(rand, list) {
    const a = list.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  // ---------- 1. rhythm reading ----------
  // A 4/4 bar of note values that adds up to exactly 4 beats.
  function randomBar(rand, kinds) {
    const bar = [];
    let left = 4;
    while (left > 0) {
      const fit = kinds.filter(function (k) { return NOTE[k].beats <= left; });
      const k = pick(rand, fit);
      // eighths come in pairs so every beat stays whole and easy to read
      if (k === 'eighth') { bar.push('eighth', 'eighth'); left -= 1; } else { bar.push(k); left -= NOTE[k].beats; }
    }
    return bar;
  }
  function barBeats(bar) {
    return bar.reduce(function (s, k) { return s + (NOTE[k] ? NOTE[k].beats : 0); }, 0);
  }
  function barKey(bar) { return bar.join(','); }
  function barHe(bar) { return bar.map(function (k) { return NOTE[k].he; }).join(', '); }

  // Hear one bar, pick the written bar that matches (3 choices).
  function rhythmItem(rand, level) {
    const kinds = level > 0 ? ['whole', 'half', 'quarter', 'eighth'] : ['half', 'quarter', 'eighth'];
    const target = rand() < 0.15 ? ['whole'] : randomBar(rand, kinds);
    const seen = {}; seen[barKey(target)] = true;
    const options = [target];
    let guard = 0;
    while (options.length < 3 && guard++ < 50) {
      const b = randomBar(rand, ['whole', 'half', 'quarter', 'eighth']);
      if (!seen[barKey(b)]) { seen[barKey(b)] = true; options.push(b); }
    }
    const shuffled = shuffle(rand, options);
    return { skill: 'rhythm', bar: target, options: shuffled, answer: shuffled.indexOf(target) };
  }

  // Notes to play a bar: one stroke per note on `voice`, one click per beat.
  function rhythmPlan(bar, bpm, voice) {
    const beat = 60 / (bpm || 80);
    const notes = [];
    let pos = 0;
    bar.forEach(function (k, i) {
      notes.push({ at: pos * beat, voice: voice || 'woodBar', hz: 392, kind: 'note', i: i });
      pos += NOTE[k].beats;
    });
    for (let b = 0; b < 4; b++) notes.push({ at: b * beat, voice: 'woodClick', hz: 1800, kind: 'click' });
    return notes.sort(function (a, b) { return a.at - b.at || (a.kind === 'click' ? 1 : -1); });
  }

  // ---------- 2. pitch matching ----------
  // 'tone': hear one note, find it on the keys. 'interval': hear a reference
  // and a second note; the reference key is marked, find the second one.
  function pitchItem(rand, level) {
    const mode = level > 0 && rand() < 0.5 ? 'interval' : 'tone';
    if (mode === 'tone') return { skill: 'pitch', mode: mode, ref: null, target: Math.floor(rand() * SCALE.length) };
    const ref = Math.floor(rand() * 5); // 0..4 so a third/fifth above still fits
    const span = pick(rand, [2, 4]); // a third or a fifth
    return { skill: 'pitch', mode: mode, ref: ref, target: Math.min(SCALE.length - 1, ref + span) };
  }
  function pitchPlan(item, voice) {
    const v = voice || 'woodBar';
    const notes = [];
    if (item.ref != null) notes.push({ at: 0, voice: v, hz: SCALE[item.ref].hz, kind: 'ref' });
    notes.push({ at: item.ref != null ? 0.8 : 0, voice: v, hz: SCALE[item.target].hz, kind: 'target' });
    return notes;
  }
  function cents(targetHz, answerHz) {
    return 1200 * Math.log2(answerHz / targetHz);
  }
  // answer: a key step (0..7) or { hz }. Within a quarter tone = exact (1),
  // within a whole tone = close (0.5) with the direction to move, else 0.
  function scorePitchMatch(item, answer) {
    const targetHz = SCALE[item.target].hz;
    const hz = answer && typeof answer === 'object' ? Number(answer.hz) : (SCALE[answer] ? SCALE[answer].hz : NaN);
    if (!(hz > 0)) return { skill: 'pitch', correct: false, score: 0, cents: null, move: null };
    const c = Math.round(cents(targetHz, hz));
    const off = Math.abs(c);
    const score = off <= 50 ? 1 : off <= 200 ? 0.5 : 0;
    return { skill: 'pitch', correct: score === 1, score: score, cents: c, move: score === 1 ? null : c > 0 ? 'lower' : 'higher' };
  }

  // ---------- 3. instrument families ----------
  function familyItem(rand, lib) {
    const L = lib || instrumentsLib();
    const x = pick(rand, L.INSTRUMENTS);
    return { skill: 'families', instrument: x.id, he: x.instrument.he, voice: x.voice, options: L.FAMILIES.slice(), answer: L.FAMILIES.indexOf(x.family) };
  }

  // ---------- 4. timbre ID ----------
  // 2 choices at first, 3 after 3 right answers, 4 after 6. Every choice has
  // a different synthesised voice, so the ear can really tell them apart.
  function timbreChoices(correctSoFar) {
    return Math.min(4, 2 + Math.floor((correctSoFar || 0) / 3));
  }
  function timbreItem(rand, n, lib) {
    const L = lib || instrumentsLib();
    const count = Math.max(2, Math.min(4, n || 2));
    const target = pick(rand, L.INSTRUMENTS);
    const usedVoices = {}; usedVoices[target.voice] = true;
    const options = [target];
    shuffle(rand, L.INSTRUMENTS).forEach(function (x) {
      if (options.length < count && !usedVoices[x.voice]) { usedVoices[x.voice] = true; options.push(x); }
    });
    const ids = shuffle(rand, options.map(function (x) { return x.id; }));
    return { skill: 'timbre', instrument: target.id, voice: target.voice, options: ids, answer: ids.indexOf(target.id) };
  }
  function scoreTimbreQuiz(item, chosen) {
    const idx = typeof chosen === 'number' ? chosen : item.options.indexOf(chosen);
    const correct = idx === item.answer;
    return { skill: 'timbre', correct: correct, score: correct ? 1 : 0, chosen: item.options[idx] || null, answerId: item.options[item.answer] };
  }

  // Any item: the chosen option index (or a key step for pitch).
  function scoreItem(item, answer) {
    if (item.skill === 'pitch') return scorePitchMatch(item, answer);
    if (item.skill === 'timbre') return scoreTimbreQuiz(item, answer);
    const correct = answer === item.answer;
    return { skill: item.skill, correct: correct, score: correct ? 1 : 0 };
  }

  // ---------- the path ----------
  // 8 items, two per skill, interleaved (rhythm, pitch, families, timbre, ...).
  // Difficulty grows with this path's own progress only.
  function buildPath(seed, progress, lib) {
    const rand = rng(seed);
    const p = progress || initialProgress();
    const items = [];
    for (let r = 0; r < ITEMS_PER_SKILL; r++) {
      items.push(rhythmItem(rand, skillLevel(p, 'rhythm')));
      items.push(pitchItem(rand, skillLevel(p, 'pitch')));
      items.push(familyItem(rand, lib));
      items.push(timbreItem(rand, timbreChoices(p.skills.timbre.correct), lib));
    }
    return items;
  }

  // ---------- progress (its own key, never mixed with maths) ----------
  function initialProgress() {
    const skills = {};
    SKILL_IDS.forEach(function (id) { skills[id] = { tries: 0, correct: 0 }; });
    return { v: 1, paths: 0, skills: skills };
  }
  function skillLevel(progress, id) {
    const s = progress && progress.skills && progress.skills[id];
    return s && s.correct >= 4 ? 1 : 0;
  }
  // Never mutates; a close pitch (0.5) counts as a try, not a correct.
  function recordResult(progress, result) {
    const p = JSON.parse(JSON.stringify(progress || initialProgress()));
    const s = p.skills[result.skill];
    if (!s) return p;
    s.tries += 1;
    if (result.correct) s.correct += 1;
    return p;
  }
  function finishPath(progress) {
    const p = JSON.parse(JSON.stringify(progress || initialProgress()));
    p.paths += 1;
    return p;
  }
  function loadProgress(storage) {
    try {
      const raw = storage && storage.getItem(STORAGE_KEY);
      const v = raw ? JSON.parse(raw) : null;
      if (v && v.v === 1 && v.skills) {
        const p = initialProgress();
        p.paths = Number.isInteger(v.paths) ? v.paths : 0;
        SKILL_IDS.forEach(function (id) {
          const s = v.skills[id];
          if (s && Number.isInteger(s.tries) && Number.isInteger(s.correct)) p.skills[id] = { tries: s.tries, correct: Math.min(s.correct, s.tries) };
        });
        return p;
      }
    } catch (e) { /* unreadable storage -> start fresh */ }
    return initialProgress();
  }
  function saveProgress(storage, progress) {
    if (!storage) return false;
    try { storage.setItem(STORAGE_KEY, JSON.stringify(progress)); return true; } catch (e) { return false; }
  }

  return {
    STORAGE_KEY: STORAGE_KEY,
    SKILLS: SKILLS,
    SKILL_IDS: SKILL_IDS,
    ITEMS_PER_SKILL: ITEMS_PER_SKILL,
    FAMILY_HE: FAMILY_HE,
    NOTES: NOTES,
    SCALE: SCALE,
    rng: rng,
    randomBar: randomBar,
    barBeats: barBeats,
    barHe: barHe,
    rhythmItem: rhythmItem,
    rhythmPlan: rhythmPlan,
    pitchItem: pitchItem,
    pitchPlan: pitchPlan,
    cents: cents,
    scorePitchMatch: scorePitchMatch,
    familyItem: familyItem,
    timbreChoices: timbreChoices,
    timbreItem: timbreItem,
    scoreTimbreQuiz: scoreTimbreQuiz,
    scoreItem: scoreItem,
    buildPath: buildPath,
    initialProgress: initialProgress,
    skillLevel: skillLevel,
    recordResult: recordResult,
    finishPath: finishPath,
    loadProgress: loadProgress,
    saveProgress: saveProgress,
  };
});
