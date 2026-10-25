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
