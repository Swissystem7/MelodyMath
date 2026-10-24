// Tests for No-Music Mastery Check (Refs #681, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');
const Mastery = require('../src/lib/masteryCheck.js');

test('topic mastery fades sound -> picture -> symbol -> plain, mastered remains false until plain passes', () => {
  const m = Mastery.createTopicMastery('multiplication_4');
  assert.equal(m.currentStage, 'sound');
  assert.equal(m.mastered, false);

  // 1. Solve at sound stage
  const res1 = Mastery.recordAttempt(m, { stage: 'sound', correct: true, muted: false });
  assert.equal(res1.nextStage, 'picture');
  assert.equal(m.currentStage, 'picture');
  assert.equal(m.mastered, false);
  assert.equal(m.soundSolvedCount, 1);

  // 2. Solve at picture stage
  const res2 = Mastery.recordAttempt(m, { stage: 'picture', correct: true });
  assert.equal(res2.nextStage, 'symbol');
  assert.equal(m.currentStage, 'symbol');
  assert.equal(m.mastered, false);

  // 3. Solve at symbol stage
  const res3 = Mastery.recordAttempt(m, { stage: 'symbol', correct: true });
  assert.equal(res3.nextStage, 'plain');
  assert.equal(m.currentStage, 'plain');
  assert.equal(m.mastered, false);

  // 4. Solve at plain stage
  const res4 = Mastery.recordAttempt(m, { stage: 'plain', correct: true });
  assert.equal(res4.mastered, true);
  assert.equal(m.mastered, true);
  assert.match(res4.messageHe, /בעצמכם/);
});

test('failure on plain check routes back to musical version (stage sound) for remediation', () => {
  const m = Mastery.createTopicMastery('fractions_half');
  // Advance through sound, picture, symbol to plain
  Mastery.recordAttempt(m, { stage: 'sound', correct: true });
  Mastery.recordAttempt(m, { stage: 'picture', correct: true });
  Mastery.recordAttempt(m, { stage: 'symbol', correct: true });
  assert.equal(m.currentStage, 'plain');

  // Fail on plain check
  const failRes = Mastery.recordAttempt(m, { stage: 'plain', correct: false });
  assert.equal(failRes.mastered, false);
  assert.equal(m.mastered, false);
  assert.equal(m.currentStage, 'sound'); // routed back to musical stage
  assert.doesNotMatch(failRes.messageHe, /נכשלת|מבחן/); // never negative or punitive
  assert.match(failRes.messageHe, /להקה/);

  // Retry: re-learn through music, advance, and succeed on plain
  Mastery.recordAttempt(m, { stage: 'sound', correct: true });
  Mastery.recordAttempt(m, { stage: 'picture', correct: true });
  Mastery.recordAttempt(m, { stage: 'symbol', correct: true });
  const retryRes = Mastery.recordAttempt(m, { stage: 'plain', correct: true });
  assert.equal(retryRes.mastered, true);
  assert.equal(m.mastered, true);
  assert.equal(m.plainAttempts, 2);
  assert.equal(m.plainSuccesses, 1);
});

test('solving in muted mode does not count toward solved-by-sound coverage', () => {
  const m = Mastery.createTopicMastery('skipCounting_3');

  // Solved with muted = true
  Mastery.recordAttempt(m, { stage: 'sound', correct: true, muted: true });
  assert.equal(m.soundSolvedCount, 0, 'Muted solve must not count toward sound coverage');

  const rep1 = Mastery.getTopicReport(m);
  assert.equal(rep1.hasSoundCoverage, false);

  // Solved with sound active (muted = false)
  Mastery.recordAttempt(m, { stage: 'sound', correct: true, muted: false });
  assert.equal(m.soundSolvedCount, 1);

  const rep2 = Mastery.getTopicReport(m);
  assert.equal(rep2.hasSoundCoverage, true);
});

test('plain check renders with suspended audio context and zero music icons or tap attributes', () => {
  let suspended = false;
  const mockAudioContext = {
    suspend: () => { suspended = true; }
  };

  const item = { prompt: '3 + 2 = ?', choices: ['4', '5', '6'] };
  const html = Mastery.renderPlainCheckHtml(item, { audioContext: mockAudioContext });

  // Audio context was suspended
  assert.equal(suspended, true);

  // Contains framing "עכשיו בלי להקה, רק אתה!"
  assert.match(html, /עכשיו בלי להקה, רק אתה!/);

  // Zero musical icons or audio tap attributes
  [/data-tap/, /data-hz/, /drum/i, /darbuka/i, /🎸/, /🥁/, /🎺/, /🎷/, /🎹/, /🎵/, /🎶/].forEach((re) => {
    assert.doesNotMatch(html, re, `Plain check must not contain musical artifact matching ${re}`);
  });

  // Never uses scary or formal test words
  assert.doesNotMatch(html, /מבחן|בחינה|ציון/);
});

test('mastery tracker tracks success rates per topic', () => {
  const tracker = Mastery.createMasteryTracker();

  // Topic A: 1 attempt, 1 success -> 100%
  const tA = tracker.get('topic_A');
  Mastery.recordAttempt(tA, { stage: 'plain', correct: true });
  const repA = tracker.getReport('topic_A');
  assert.equal(repA.plainSuccessRate, 1.0);
  assert.equal(repA.mastered, true);

  // Topic B: 2 attempts, 1 success -> 50%
  const tB = tracker.get('topic_B');
  Mastery.recordAttempt(tB, { stage: 'plain', correct: false });
  Mastery.recordAttempt(tB, { stage: 'plain', correct: true });
  const repB = tracker.getReport('topic_B');
  assert.equal(repB.plainSuccessRate, 0.5);
  assert.equal(repB.mastered, true);

  const all = tracker.getAllReports();
  assert.equal(all.length, 2);
});
