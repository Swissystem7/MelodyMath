// #665 example exercise: SoundAdd (addition heard as sounds, grades א׳–ב׳),
// with the child-eye rules from the #666 review.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const SA = require('../src/components/SoundAdd.js');
const page = fs.readFileSync(path.join(__dirname, '..', 'exercise.html'), 'utf8');

function taps(state, n) {
  let s = state;
  for (let i = 0; i < n; i++) s = SA.tap(s);
  return s;
}

test('numbersToBeats: one sound per unit, low sounds then a pause then high sounds', () => {
  SA.ITEMS.forEach(([a, b]) => {
    const notes = SA.numbersToBeats(a, b);
    assert.equal(notes.length, a + b, a + ' + ' + b);
    assert.equal(notes.filter((n) => n.voice === 'drumLow').length, a);
    assert.equal(notes.filter((n) => n.voice === 'drumHigh').length, b);
    assert.deepEqual(notes.map((n) => n.dot), [...Array(a + b).keys()], 'every sound lights its own circle');
  });
  const n = SA.numbersToBeats(3, 2, 0.4, 0.5);
  assert.ok(n[3].at - n[2].at > n[1].at - n[0].at, 'the gap between the groups is longer than a beat');
  assert.equal(n[0].at, 0, 'the first sound is at once, well inside one second');
});

test('a right answer plays a rising scale, one note per dot, and is spoken', () => {
  const s = SA.check(taps(SA.createState({ stage: 'sound', item: [3, 2] }), 5));
  assert.equal(s.status, 'right');
  assert.equal(s.sound, 'scale');
  assert.equal(s.speak, 'right');
  assert.match(s.message, /3 \+ 2 = 5/);
  const scale = SA.scalePlan(5);
  assert.equal(scale.length, 5);
  assert.deepEqual(scale.map((x) => x.count), [1, 2, 3, 4, 5], 'the merged group is counted up');
  scale.slice(1).forEach((x, i) => assert.ok(x.hz > scale[i].hz, 'rising'));
});

test('a right answer merges the two groups into one group of the total', () => {
  ['sound', 'picture', 'symbol', 'silent'].forEach((stage) => {
    const s = SA.check(taps(SA.createState({ stage, item: [3, 2] }), 5));
    const html = SA.renderHtml(s);
    assert.match(html, /class="sa-dots sa-merge"/, stage);
    assert.match(html, /<span class="sa-total" aria-hidden="true">5<\/span>/, stage);
    assert.equal((html.match(/data-dot=/g) || []).length, 5, stage + ': five circles');
    assert.match(html, /aria-label="3 ועוד 2 הם 5 עיגולים"/);
  });
  const wrong = SA.renderHtml(SA.check(taps(SA.createState({ stage: 'sound', item: [3, 2] }), 4)));
  assert.doesNotMatch(wrong, /sa-merge/);
});

test('a wrong answer: a gentle word, a counted replay, what is missing, a second try', () => {
  const s = SA.check(taps(SA.createState({ stage: 'sound', item: [3, 2] }), 4));
  assert.equal(s.status, 'retry');
  assert.equal(s.sound, 'hint');
  assert.equal(s.speak, 'retry', 'the encouragement is spoken');
  assert.deepEqual(s.hint, { missing: 1 });
  assert.match(s.message, /^כמעט!/);
  assert.match(s.message, /חסרה הקשה אחת/);
  assert.match(s.message, /ננסה שוב עם צלילים/);
  const html = SA.renderHtml(s);
  assert.match(html, /data-act="tap" data-tap="drumLow" aria-label/, 'the pad stays active for the second try');
  assert.equal((html.match(/sa-missing/g) || []).length, 1, 'the missing dot is drawn');
  assert.match(html, /data-act="listen"/, 'the counted replay is offered');
  const plan = SA.countPlan([3, 2]);
  assert.deepEqual(plan.map((n) => n.count), [1, 2, 3, 4, 5], 'the replay counts every sound');

  const over = SA.check(taps(SA.createState({ stage: 'sound', item: [3, 2] }), 7));
  assert.deepEqual(over.hint, { extra: 2 });
  assert.equal((SA.renderHtml(over).match(/sa-extra/g) || []).length, 2);
});

test('the second try can be right; two wrong tries show the solution, step back and encourage', () => {
  let s = SA.check(taps(SA.createState({ stage: 'picture', item: [4, 1] }), 3));
  s = SA.check(SA.tap(SA.tap(s)));
  assert.equal(s.status, 'right');
  assert.equal(s.streak, 0, 'a hinted answer does not count towards the next stage');

  let w = SA.check(taps(SA.createState({ stage: 'picture', item: [4, 1] }), 3));
  w = SA.check(w);
  assert.equal(w.status, 'shown');
  assert.equal(w.sound, 'solution');
  assert.match(w.message, /4 \+ 1 = 5/);
  assert.match(w.message, /לא נורא/);
  const back = SA.next(w);
  assert.equal(back.stage, 'sound', 'support comes back after a miss');
  assert.ok(back.back);
  assert.match(SA.promptOf(back), /נתרגל עוד קצת עם צלילים/);
  assert.equal(SA.speechKey(back), 'back');
});

test('fading: sound, picture, symbol, plain; the first exercise is real solving', () => {
  let s = SA.createState();
  assert.equal(s.stage, 'sound', 'no worked example');
  assert.equal(s.taps, 0, 'the child taps every sound');
  assert.ok(!SA.STAGES.includes('example'));
  const seen = [s.stage];
  for (let round = 0; round < 12; round++) {
    s = SA.check(taps(s, s.item[0] + s.item[1]));
    s = SA.next(s);
    if (seen[seen.length - 1] !== s.stage) seen.push(s.stage);
  }
  assert.deepEqual(seen, ['sound', 'picture', 'symbol', 'silent']);
  assert.ok(SA.mastered(s), 'two right first tries in the plain stage = mastered');
  assert.ok(s.plainTried >= 2, 'the plain check is counted');
  assert.equal(SA.plainRate(s), 1);
});

test('the plain stage: no sound, no music cue; a miss goes back to the musical version', () => {
  const s0 = SA.createState({ stage: 'silent', item: [2, 2] });
  const html = SA.renderHtml(s0);
  assert.doesNotMatch(html, /data-tap=/);
  assert.doesNotMatch(html, /data-act="listen"/);
  assert.doesNotMatch(html, /data-act="family"/);
  assert.doesNotMatch(html, /sa-dot/);
  assert.match(html, /2 \+ 2 = \?/);
  assert.equal(SA.plainRate(s0), null);

  let s = SA.check(s0);
  assert.equal(s.status, 'retry');
  assert.equal(s.sound, null, 'still silent');
  s = SA.check(s);
  assert.equal(s.status, 'shown');
  assert.equal(s.plainTried, 1, 'one plain check, counted once');
  assert.equal(SA.plainRate(s), 0);
  const back = SA.next(s);
  assert.equal(back.stage, 'sound');
  assert.equal(back.plainTried, 1, 'the rate survives the next exercise');
});

test('every exercise plays on 4 instrument families with the same events', () => {
  assert.ok(SA.FAMILIES.length >= 2, 'at least 2 families (hard rule)');
  assert.deepEqual(SA.FAMILIES.map((f) => f.id), ['drums', 'keys', 'strings', 'winds']);
  const voices = require('../src/lib/instrumentVoices.js').VOICES;
  const ref = SA.numbersToBeats(3, 2).map((n) => [n.at, n.group, n.dot]);
  SA.FAMILIES.forEach((f) => {
    const notes = SA.numbersToBeats(3, 2, 0, null, f.id);
    assert.deepEqual(notes.map((n) => [n.at, n.group, n.dot]), ref, f.id + ': same events');
    notes.forEach((n) => assert.ok(voices[n.voice], f.id + ': ' + n.voice + ' is a real voice'));
    assert.ok(voices[f.tap], f.id + ' tap voice');
    const html = SA.renderHtml(SA.createState({ family: f.id }));
    assert.match(html, new RegExp('data-act="tap" data-tap="' + f.tap + '"'));
    assert.match(html, new RegExp('data-family="' + f.id + '" aria-pressed="true"'));
  });
  let s = taps(SA.createState({ item: [3, 2] }), 2);
  s = SA.setFamily(s, 'keys');
  assert.equal(s.family, 'keys');
  assert.equal(s.taps, 2, 'switching keeps the taps');
  assert.equal(s.sound, 'exercise', 'and replays the exercise on the new instrument');
  assert.equal(SA.next(SA.check(taps(s, 3))).family, 'keys', 'the choice carries to the next exercise');
});

test('speech: every line has words; Hebrew voice first, then a recorded clip, else nothing', () => {
  SA.STAGES.concat(['back', 'right', 'retry', 'shown']).forEach((k) => assert.ok(SA.SPEECH[k], k));
  for (let n = 1; n <= 10; n++) assert.ok(SA.SPEECH['count' + n], 'count' + n);
  assert.equal(SA.speechRoute('sound', true, {}), 'tts');
  assert.equal(SA.speechRoute('sound', false, { sound: 'sound.webm' }), 'clip');
  assert.equal(SA.speechRoute('sound', false, {}), 'none');
  assert.equal(SA.speechKey(SA.createState()), 'sound', 'the instruction is spoken when the exercise opens');
  Object.keys(SA.VOICE_CLIPS).forEach((k) => {
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'sounds', 'voice', 'he', SA.VOICE_CLIPS[k])), k);
  });
});

test('the child card stays under 15 words, with no sources or curriculum lines', () => {
  Object.keys(SA.PROMPTS).forEach((k) => assert.ok(SA.wordCount(SA.PROMPTS[k]) <= 15, k));
  SA.STAGES.forEach((stage) => {
    const s0 = SA.createState({ stage });
    [s0, SA.check(s0), SA.check(SA.check(s0)), SA.next(SA.check(SA.check(s0)))].forEach((s) => {
      const text = SA.renderHtml(s).replace(/<[^>]+>/g, ' ').replace(/[🥁🎹🎸🎷👂👆🎵▶↩←✔⭐+=?:!.,]/gu, ' ');
      assert.ok(SA.wordCount(text.replace(/\d+/g, ' ')) <= 15, stage + ': ' + text);
      assert.doesNotMatch(text, /doi|et al|תוכנית הלימודים|Hz|BPM|למורה/);
    });
  });
});

test('exercise.html: only the exercise, no teacher text, scripts precached', () => {
  assert.doesNotMatch(page, /למורה|<details|Hattie|et al/, 'teacher notes live in docs/exercises/SOUND-ADD.md');
  assert.ok(fs.existsSync(path.join(__dirname, '..', 'docs', 'exercises', 'SOUND-ADD.md')));
  const sw = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  [...page.matchAll(/(?:src|href)="(src\/[^"]+)"/g)].forEach((m) => assert.ok(sw.includes("'./" + m[1] + "'"), m[1] + ' not precached'));
});
