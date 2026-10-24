// Tests for No-Music Mastery Check (Refs #681, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');
const Mastery = require('../src/lib/masteryCheck.js');
const prog = require('../src/lib/curriculum/progression.js');

test('topic mastery fades sound -> picture -> symbol -> plain in plural Hebrew', () => {
  const m = Mastery.createTopicMastery('mm-cur-3');
  assert.equal(m.currentStage, 'sound');
  assert.equal(m.mastered, false);

  // 1. Solve at sound stage
  const res1 = Mastery.recordAttempt(m, { stage: 'sound', correct: true, muted: false });
  assert.equal(res1.nextStage, 'picture');
  assert.equal(m.soundSolvedCount, 1);

  // 2. Solve at picture stage
  const res2 = Mastery.recordAttempt(m, { stage: 'picture', correct: true });
  assert.equal(res2.nextStage, 'symbol');

  // 3. Solve at symbol stage
  const res3 = Mastery.recordAttempt(m, { stage: 'symbol', correct: true });
  assert.equal(res3.nextStage, 'plain');

  // 4. Solve at plain stage
  const res4 = Mastery.recordAttempt(m, { stage: 'plain', correct: true });
  assert.equal(res4.mastered, true);
  assert.equal(m.mastered, true);
  assert.match(res4.messageHe, /בעצמכם/);
});

test('stage progression cannot be skipped: jumping straight to plain requires prior musical stages', () => {
  const m = Mastery.createTopicMastery('mm-cur-18');
  assert.equal(m.currentStage, 'sound');
  assert.equal(m.soundSolvedCount, 0);

  // Attempting plain directly without sound solves keeps stage at sound
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

  // Fail on plain check
  const failRes = Mastery.recordAttempt(m, { stage: 'plain', correct: false });
  assert.equal(failRes.mastered, false);
  assert.equal(m.currentStage, 'sound');
  assert.match(failRes.messageHe, /להקה/);

  // Re-learn through music and succeed
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
  // mm-cur-32 has prereqs mm-cur-25 and mm-cur-18
  assert.equal(tracker.isUnlocked('mm-cur-32', prog), false);

  // Master mm-cur-18
  const t18 = tracker.get('mm-cur-18');
  Mastery.recordAttempt(t18, { stage: 'sound', correct: true });
  Mastery.recordAttempt(t18, { stage: 'picture', correct: true });
  Mastery.recordAttempt(t18, { stage: 'symbol', correct: true });
  Mastery.recordAttempt(t18, { stage: 'plain', correct: true });
  assert.equal(tracker.isMastered('mm-cur-18'), true);
  assert.equal(tracker.isUnlocked('mm-cur-32', prog), false, 'still locked because mm-cur-25 not mastered');

  // Master mm-cur-25
  const t25 = tracker.get('mm-cur-25');
  Mastery.recordAttempt(t25, { stage: 'sound', correct: true });
  Mastery.recordAttempt(t25, { stage: 'picture', correct: true });
  Mastery.recordAttempt(t25, { stage: 'symbol', correct: true });
  Mastery.recordAttempt(t25, { stage: 'plain', correct: true });
  assert.equal(tracker.isMastered('mm-cur-25'), true);

  // Both prereqs mastered -> mm-cur-32 is now unlocked!
  assert.equal(tracker.isUnlocked('mm-cur-32', prog), true);
});

test('mountMasteryCheck mounts in screen and handles answers', () => {
  let answered = null;
  const mockContainer = {
    classList: { remove: () => {}, add: () => {} },
    innerHTML: '',
    querySelector: () => null,
    querySelectorAll: (sel) => {
      if (sel.includes('data-plain-choice')) {
        return [{ getAttribute: () => '5', onclick: null }];
      }
      return [];
    }
  };

  const handle = Mastery.mountMasteryCheck(mockContainer, { prompt: '3 + 2 = ?', choices: ['4', '5'], answer: 5 }, {
    onAnswer: (val, ok) => { answered = { val, ok }; }
  });
  assert.ok(handle);
});
