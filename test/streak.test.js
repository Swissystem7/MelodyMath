'use strict';
// Task F4 (Refs #591): mastery streak - 5 correct in a row in a topic
// unlocks one new short musical phrase on the current instrument; soft reset keeps unlocks.

const test = require('node:test');
const assert = require('node:assert/strict');
const streakModule = require('../src/lib/streak');

function createMockStorage() {
  const store = new Map();
  return {
    getItem: (k) => (store.has(k) ? store.get(k) : null),
    setItem: (k, v) => store.set(k, String(v)),
    removeItem: (k) => store.delete(k),
  };
}

test('mastery streak unlocks on 5th consecutive correct answer, not on 4th', () => {
  streakModule.resetAll();
  const topic = 'mm-cur-15';
  for (let i = 1; i <= 4; i++) {
    const res = streakModule.recordAnswer(topic, true, { instrument: 'drums' });
    assert.equal(res.streak, i);
    assert.equal(res.unlocked, false);
    assert.equal(streakModule.getUnlocks(topic).length, 0);
  }
  const res5 = streakModule.recordAnswer(topic, true, { instrument: 'drums' });
  assert.equal(res5.streak, 5);
  assert.equal(res5.unlocked, true);
  assert.ok(res5.phrase);
  assert.equal(res5.phrase.id, 'phrase_1');
  assert.equal(streakModule.getUnlocks(topic).length, 1);
});

test('wrong answer resets streak to 0 but keeps unlocks (soft reset)', () => {
  streakModule.resetAll();
  const topic = 'mm-cur-24';
  for (let i = 1; i <= 5; i++) streakModule.recordAnswer(topic, true, { instrument: 'flute' });
  assert.equal(streakModule.getUnlocks(topic).length, 1);

  const resWrong = streakModule.recordAnswer(topic, false);
  assert.equal(resWrong.streak, 0, 'wrong answer resets streak to 0');
  assert.equal(resWrong.unlocked, false);
  assert.equal(resWrong.keepsUnlocks, true);
  assert.equal(streakModule.getUnlocks(topic).length, 1, 'unlocks preserved');

  // Another 5 in a row unlocks the second phrase
  for (let i = 1; i <= 5; i++) streakModule.recordAnswer(topic, true);
  assert.equal(streakModule.getUnlocks(topic).length, 2);
  assert.equal(streakModule.getUnlocks(topic)[1].id, 'phrase_2');
});

test('streaks are tracked per topic independently and survive reload', () => {
  const mockStorage = createMockStorage();
  streakModule.setStorage(mockStorage);
  streakModule.resetAll();

  streakModule.recordAnswer('tA', true);
  streakModule.recordAnswer('tA', true);
  streakModule.recordAnswer('tB', true);
  assert.equal(streakModule.getStreak('tA'), 2);
  assert.equal(streakModule.getStreak('tB'), 1);

  streakModule.recordAnswer('tA', false);
  assert.equal(streakModule.getStreak('tA'), 0);
  assert.equal(streakModule.getStreak('tB'), 1);

  for (let i = 1; i <= 4; i++) streakModule.recordAnswer('tB', true); // tB reaches 5
  assert.equal(streakModule.getUnlocks('tB').length, 1);

  streakModule.setStorage(mockStorage); // reload
  assert.equal(streakModule.getUnlocks('tB').length, 1);
  assert.equal(streakModule.playPhrase({ notes: [440] }), null);
});

// #739 (FIX-739 #756): one reward on every practice screen, on the child's instrument, kept in "השיר שלי".
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function fakeAudio() {
  const node = () => ({ connect(n) { return n || node(); }, start() {}, stop() {}, type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} },
    gain: { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} } });
  return { state: 'running', currentTime: 1, destination: {}, createOscillator: node, createGain: node };
}

test('getSharedAudioContext exists in musicEngine and loads before streak.js', () => {
  const M = require('../src/lib/musicEngine');
  assert.equal(typeof M.getSharedAudioContext, 'function');
  const at = (s) => indexHtml.indexOf('<script src="' + s + '"></script>');
  assert.ok(at('src/lib/musicEngine.js') > 0 && at('src/lib/musicEngine.js') < at('src/lib/streak.js'));
});

test('the phrase plays on the voice of the instrument the child picked', () => {
  const storage = createMockStorage();
  streakModule.setStorage(storage);
  streakModule.resetAll();
  const iv = require('../src/lib/instrumentVoices');
  const ins = require('../src/lib/instruments');
  const played = [];
  Object.assign(globalThis, { instrumentById: ins.instrumentById, forTopic: ins.forTopic, VOICES: iv.VOICES, window: {},
    playVoice: (ac, voice, hz, when) => played.push({ voice, hz, when }) });
  try {
    const flute = ins.INSTRUMENTS.find((x) => x.voice === 'breathy');
    assert.equal(streakModule.instrumentFor('fractions'), ins.forTopic('fractions')[0].id, 'no pick: the topic instrument');
    storage.setItem('mm-tap-instrument', flute.id);
    assert.equal(streakModule.instrumentFor('fractions'), flute.id, 'the pick wins');
    assert.equal(streakModule.voiceFor(flute.id), 'breathy');
    assert.equal(streakModule.voiceFor('nope'), 'keys');
    const r = streakModule.playPhrase(streakModule.PHRASES[0], flute.id, fakeAudio(), 0.4);
    assert.equal(r.voice, 'breathy');
    assert.equal(played.length, streakModule.PHRASES[0].notes.length);
    assert.ok(played.every((p) => p.voice === 'breathy'));
    assert.ok(played[0].when >= 1.4, 'starts after the right-answer sound');
  } finally {
    ['instrumentById', 'forTopic', 'VOICES', 'window', 'playVoice'].forEach((k) => delete globalThis[k]);
  }
});

test('"השיר שלי" keeps every phrase from every topic in order and can replay it', () => {
  const storage = createMockStorage();
  streakModule.setStorage(storage);
  streakModule.resetAll();
  for (let i = 0; i < 5; i++) streakModule.recordAnswer('a', true, { audio: false });
  for (let i = 0; i < 5; i++) streakModule.recordAnswer('b', true, { audio: false });
  for (let i = 0; i < 5; i++) streakModule.recordAnswer('a', true, { audio: false });
  streakModule.setStorage(storage); // reload
  assert.deepEqual(streakModule.mySong().map((p) => p.id), ['phrase_1', 'phrase_1', 'phrase_2']);
  const html = streakModule.mySongHtml();
  assert.match(html, /data-song="all"/);
  assert.equal((html.match(/data-song="\d"/g) || []).length, 3);
  assert.ok(streakModule.playSong() > 0);
  streakModule.resetAll();
  assert.match(streakModule.mySongHtml(), /5 תשובות נכונות ברצף/);
});

test('index.html: exactly one streak reward, after the right-answer sound', () => {
  const block = indexHtml.slice(indexHtml.indexOf('function noteMetro('), indexHtml.indexOf("if($('metroToggle'))$('metroToggle').onclick"))
    + indexHtml.slice(indexHtml.indexOf('function streakReward('), indexHtml.indexOf('function paintMySong('));
  const calls = [];
  const sandbox = {
    MM_MASTERY_STREAK: Object.assign({}, streakModule, {
      instrumentFor: () => 'flute', playPhrase: (p, i, ac, delay) => calls.push('phrase@' + delay),
    }),
    metroStreak: 0, $: () => null, prefsNow: () => ({}), paintMySong: () => calls.push('song'),
    playTap: (v) => calls.push('tap:' + v), playStreakMelody: () => calls.push('melody'),
    recordCorrect: () => null, setMetroBpm() {}, nextBpm() {}, metroBpmNow: () => 80, setTimeout,
  };
  streakModule.setStorage(createMockStorage());
  streakModule.resetAll();
  vm.createContext(sandbox);
  vm.runInContext(block + '\nthis.noteMetro=noteMetro;', sandbox);
  for (let i = 0; i < 5; i++) sandbox.noteMetro(true, 'fractions');
  assert.deepEqual(calls, ['melody', 'melody', 'melody', 'melody', 'tap:correct', 'phrase@0.4', 'song']);
  assert.equal(streakModule.getUnlocks('fractions')[0].instrument, 'flute');
});

test('index.html: with music off the 5th right answer still saves the phrase, silently', () => {
  const block = indexHtml.slice(indexHtml.indexOf('function streakReward('), indexHtml.indexOf('function paintMySong('));
  const calls = [];
  const spyAudio = (k) => function () { calls.push(k); return fakeAudio(); };
  const sandbox = {
    MM_MASTERY_STREAK: Object.assign({}, streakModule, { playPhrase: (...a) => calls.push('phrase') && streakModule.playPhrase(...a) }),
    prefsNow: () => ({ quiet: true }), paintMySong: (p) => calls.push('song:' + (p && p.id)),
    playTap: (v) => calls.push('tap:' + v), rpHoldStreak: false,
    AudioContext: spyAudio('new AudioContext'), webkitAudioContext: spyAudio('new webkitAudioContext'),
  };
  const saved = { AudioContext: globalThis.AudioContext, getSharedAudioContext: globalThis.getSharedAudioContext };
  Object.assign(globalThis, { AudioContext: sandbox.AudioContext, getSharedAudioContext: spyAudio('getSharedAudioContext') });
  try {
    streakModule.setStorage(createMockStorage());
    streakModule.resetAll();
    vm.createContext(sandbox);
    vm.runInContext(block + '\nthis.streakReward=streakReward;', sandbox);
    const won = [1, 2, 3, 4, 5].map(() => sandbox.streakReward('fractions', true));
    assert.deepEqual(won, [false, false, false, false, true], 'the 5th answer still unlocks');
    assert.deepEqual(calls, ['song:phrase_1'], 'no playTap, no playPhrase, no AudioContext');
    assert.deepEqual(streakModule.mySong().map((p) => p.id), ['phrase_1'], 'kept in "השיר שלי"');
  } finally {
    Object.assign(globalThis, saved);
    if (saved.AudioContext === undefined) delete globalThis.AudioContext;
    if (saved.getSharedAudioContext === undefined) delete globalThis.getSharedAudioContext;
  }
});

test('index.html: every practice screen feeds its topic into the streak', () => {
  assert.match(indexHtml, /history\.push\(\{id:current\.id,correct\}\);noteMetro\(correct,current\.mathTopic\|\|current\.skill,current\)/, 'main practice');
  assert.match(indexHtml, /noteMetro\(correct,st\.skill\|\|st\.he,it\)/, 'personal plan');
  assert.match(indexHtml, /noteMetro\(correct,classCurrent\.skill,classCurrent\)/, 'class');
  assert.match(indexHtml, /noteMetro\(correct,q\.skill,q\)/, 'diagnostic');
  assert.match(indexHtml, /streakReward\(beatCurrent\.skill,correct && !late\)/, 'beat, paced');
  assert.match(indexHtml, /noteMetro\(correct && !late,beatCurrent\.skill,beatCurrent\)/, 'beat');
  assert.doesNotMatch(indexHtml, /MM_MASTERY_STREAK\.recordAnswer\(st\./, 'no second hook in rpCheck');
  assert.match(indexHtml, /id="mySong"[\s\S]{0,200}id="mySongList"/);
});
