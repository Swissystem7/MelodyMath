const fs = require('node:fs');
// Tests for No-Music Mastery Check (Refs #681, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');
const Mastery = require('../src/lib/masteryCheck.js');
const prog = require('../src/lib/curriculum/progression.js');

test('topic mastery fades sound -> picture -> symbol -> plain in plural Hebrew', () => {
  const m = Mastery.createTopicMastery('mm-cur-3');
  assert.equal(m.currentStage, 'sound');
  assert.equal(m.mastered, false);

  const res1 = Mastery.recordAttempt(m, { stage: 'sound', correct: true, muted: false });
  assert.equal(res1.nextStage, 'picture');
  assert.equal(m.soundSolvedCount, 1);

  const res2 = Mastery.recordAttempt(m, { stage: 'picture', correct: true });
  assert.equal(res2.nextStage, 'symbol');

  const res3 = Mastery.recordAttempt(m, { stage: 'symbol', correct: true });
  assert.equal(res3.nextStage, 'plain');

  const res4 = Mastery.recordAttempt(m, { stage: 'plain', correct: true });
  assert.equal(res4.mastered, true);
  assert.equal(m.mastered, true);
  assert.match(res4.messageHe, /בעצמכם/);
});

test('stage progression cannot be skipped: jumping straight to plain requires prior musical stages', () => {
  const m = Mastery.createTopicMastery('mm-cur-18');
  assert.equal(m.currentStage, 'sound');
  assert.equal(m.soundSolvedCount, 0);

  const res = Mastery.recordAttempt(m, { stage: 'plain', correct: true });
  assert.equal(res.mastered, false);
  assert.equal(m.mastered, false);
  assert.equal(m.currentStage, 'picture', 'first solve moves sound to picture, not instant plain mastery');
});

test('failure on plain check routes back to musical version (stage sound) for remediation', () => {
  const m = Mastery.createTopicMastery('mm-cur-25');
  Mastery.recordAttempt(m, { stage: 'sound', correct: true });
  Mastery.recordAttempt(m, { stage: 'picture', correct: true });
  Mastery.recordAttempt(m, { stage: 'symbol', correct: true });
  assert.equal(m.currentStage, 'plain');

  const failRes = Mastery.recordAttempt(m, { stage: 'plain', correct: false });
  assert.equal(failRes.mastered, false);
  assert.equal(m.currentStage, 'sound');
  assert.match(failRes.messageHe, /להקה/);

  Mastery.recordAttempt(m, { stage: 'sound', correct: true });
  Mastery.recordAttempt(m, { stage: 'picture', correct: true });
  Mastery.recordAttempt(m, { stage: 'symbol', correct: true });
  const retryRes = Mastery.recordAttempt(m, { stage: 'plain', correct: true });
  assert.equal(retryRes.mastered, true);
  assert.equal(m.plainAttempts, 2);
  assert.equal(m.plainSuccesses, 1);
});

test('progression buildsTo unlock: topic unlocked only when all prereqs pass no-music plain check', () => {
  const tracker = Mastery.createMasteryTracker();
  assert.equal(tracker.isUnlocked('mm-cur-32', prog), false);

  const t18 = tracker.get('mm-cur-18');
  ['sound', 'picture', 'symbol', 'plain'].forEach(s => Mastery.recordAttempt(t18, { stage: s, correct: true }));
  assert.equal(tracker.isMastered('mm-cur-18'), true);
  assert.equal(tracker.isUnlocked('mm-cur-32', prog), false, 'still locked because mm-cur-25 not mastered');

  const t25 = tracker.get('mm-cur-25');
  ['sound', 'picture', 'symbol', 'plain'].forEach(s => Mastery.recordAttempt(t25, { stage: s, correct: true }));
  assert.equal(tracker.isMastered('mm-cur-25'), true);
  assert.equal(tracker.isUnlocked('mm-cur-32', prog), true);
});

test('mountMasteryCheck mounts in screen and handles answers', () => {
  let answered = null;
  const mockContainer = {
    classList: { remove: () => {}, add: () => {} }, innerHTML: '',
    querySelector: () => null,
    querySelectorAll: sel => sel.includes('data-plain-choice') ? [{ getAttribute: () => '5', onclick: null }] : []
  };
  const handle = Mastery.mountMasteryCheck(mockContainer, { prompt: '3 + 2 = ?', choices: ['4', '5'], answer: 5 }, {
    onAnswer: (val, ok) => { answered = { val, ok }; }
  });
  assert.ok(handle);
});

test('anti-skip guard: attempt passing stage plain is rejected when currentStage is picture even if soundSolvedCount is 3 (#718, Refs #591)', () => {
  const m = Mastery.createTopicMastery('mm-cur-15');
  Mastery.recordAttempt(m, { stage: 'sound', correct: true });
  m.soundSolvedCount = 3;
  m.currentStage = 'picture';

  const res = Mastery.recordAttempt(m, { stage: 'plain', correct: true });
  assert.equal(res.mastered, false, 'must not be marked mastered');
  assert.equal(m.mastered, false);
  assert.equal(m.currentStage, 'symbol', 'advances from picture to symbol, ignoring external plain stage');
});

test('isTopicUnlocked locks unknown ids and resolves grade:skill via linksForSkill (#718, Refs #591)', () => {
  const tracker = Mastery.createMasteryTracker();
  assert.equal(tracker.isUnlocked('unknown-topic-id', prog), false, 'unknown topic id is locked');
  assert.equal(tracker.isUnlocked('ב:nonexistent_skill', prog), false, 'unknown skill is locked');
  assert.equal(tracker.isUnlocked('', prog), false, 'empty topic id is locked');
  assert.equal(tracker.isUnlocked('mm-cur-0', prog), true, 'foundational topic is unlocked');
  assert.equal(tracker.isUnlocked('א:NUMBER_LINE_APPROX', prog), false, 'locked before mm-cur-0 mastered');

  const t0 = tracker.get('mm-cur-0');
  ['sound', 'picture', 'symbol', 'plain'].forEach(s => Mastery.recordAttempt(t0, { stage: s, correct: true }));
  assert.equal(tracker.isMastered('mm-cur-0'), true);
  assert.equal(tracker.isUnlocked('א:NUMBER_LINE_APPROX', prog), true, 'unlocked once mm-cur-0 mastered');
});

test('orderTopics sorts to match progression.js (no topic before its prerequisite, #718, Refs #665)', () => {
  const sample = ['mm-cur-32', 'mm-cur-14', 'mm-cur-0', 'mm-cur-25', 'mm-cur-18', 'mm-cur-13'];
  const ordered = Mastery.orderTopics(sample, prog);
  assert.deepEqual(ordered, ['mm-cur-0', 'mm-cur-13', 'mm-cur-14', 'mm-cur-18', 'mm-cur-25', 'mm-cur-32']);

  // Prerequisite check across all topics in progression.PREREQ
  const allTopics = Object.keys(prog.PREREQ).reverse();
  const sortedAll = Mastery.orderTopics(allTopics, prog);
  sortedAll.forEach((tid, idx) => {
    prog.PREREQ[tid][0].forEach(pId => {
      const pIdx = sortedAll.indexOf(pId);
      assert.ok(pIdx < idx, 'prerequisite ' + pId + ' must come before ' + tid + ' in progression order');
    });
  });
});

test('getNextUnlocked returns unmastered topics in progression order (#718, Refs #665)', () => {
  const tracker = Mastery.createMasteryTracker();
  const unlocked = tracker.getNextUnlocked(prog);
  assert.ok(unlocked.length > 0);
  assert.equal(unlocked[0], 'mm-cur-0');
  assert.equal(unlocked.includes('mm-cur-32'), false);

  const t0 = tracker.get('mm-cur-0');
  ['sound', 'picture', 'symbol', 'plain'].forEach(s => Mastery.recordAttempt(t0, { stage: s, correct: true }));
  const nextUnlocked = tracker.getNextUnlocked(prog);
  assert.equal(nextUnlocked.includes('mm-cur-0'), false, 'mastered topic excluded');
  assert.ok(nextUnlocked.includes('mm-cur-1'), 'unlocked child topic included in order');
});

test('index.html runs mastery check at the end of each topic without grade-1 fallback (#718, Refs #591)', () => {
  const indexHtml = fs.readFileSync('index.html', 'utf8');
  assert.equal(indexHtml.includes("{prompt:'3 + 2 = ?',answer:5}"), false, 'fallback item removed');
  assert.ok(indexHtml.includes('checkItem='), 'picks item from current topic');
  assert.ok(indexHtml.includes("mountMasteryCheck($('masteryCheckHost'),checkItem"), 'mounts check at end of each topic');
});
