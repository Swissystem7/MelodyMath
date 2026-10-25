'use strict';
// MelodyMath — Missing Factor End-of-Topic No-Music Check Tests (Refs #665 req 5).
// Verifies that missing_factor topics offer an unassisted plain math check
// after scaffolding fades ("עכשיו בלי להקה, רק אתם!"), with zero music cues.

const test = require('node:test');
const assert = require('node:assert/strict');
const exerciseTypes = require('../src/lib/curriculum/exerciseTypes.js');

function countWords(str) {
  if (!str) return 0;
  return String(str).trim().split(/\s+/).filter(Boolean).length;
}

test('MISSING_FACTOR_NO_MUSIC_CHECK exports valid items for missing factor topics (Refs #665)', () => {
  const items = exerciseTypes.MISSING_FACTOR_NO_MUSIC_CHECK;
  assert.ok(Array.isArray(items), 'Must be exported as an array');
  assert.ok(items.length >= 2, 'Must contain at least 2 check items');

  items.forEach(it => {
    assert.equal(it.exerciseType, 'missing_factor', 'Must be missing_factor type');
    assert.equal(it.noMusic, true, 'noMusic must be true');
    assert.equal(it.plain, true, 'plain must be true');
    assert.equal(it.musicStage, 'no_music_check', 'musicStage must be no_music_check');
    assert.ok(it.prompt && typeof it.prompt === 'string', 'Must have a prompt');
    assert.ok(countWords(it.prompt) <= 15, 'Prompt must be <= 15 words: ' + it.prompt);
    assert.ok(it.answer != null, 'Must have an answer');
    assert.ok(it.topicId, 'Must map to a curriculum topicId');
  });
});

test('noMusicCheckForTopic retrieves items by curriculum topicId (Refs #665)', () => {
  const t24 = exerciseTypes.noMusicCheckForTopic('mm-cur-24');
  assert.ok(t24.length >= 1, 'mm-cur-24 must have at least one no-music check item');
  t24.forEach(it => {
    assert.equal(it.topicId, 'mm-cur-24');
    assert.equal(it.exerciseType, 'missing_factor');
  });

  const t25 = exerciseTypes.noMusicCheckForTopic('mm-cur-25');
  assert.ok(t25.length >= 1, 'mm-cur-25 must have at least one no-music check item');

  const unknown = exerciseTypes.noMusicCheckForTopic('no-such-topic');
  assert.deepEqual(unknown, []);
});

test('noMusicCheckForType returns all items for missing_factor (Refs #665)', () => {
  const items = exerciseTypes.noMusicCheckForType('missing_factor');
  assert.equal(items.length, exerciseTypes.MISSING_FACTOR_NO_MUSIC_CHECK.length);
  assert.deepEqual(exerciseTypes.noMusicCheckForType('unknown_type'), []);
});

test('missing factor no-music check prompts are mathematically exact (Refs #665)', () => {
  exerciseTypes.MISSING_FACTOR_NO_MUSIC_CHECK.forEach(it => {
    if (it.prompt.includes('7 × ☐ = 42')) {
      assert.equal(7 * Number(it.answer), 42);
    } else if (it.prompt.includes('☐ × 8 = 56')) {
      assert.equal(Number(it.answer) * 8, 56);
    } else if (it.prompt.includes('70 × ☐ = 700')) {
      assert.equal(70 * Number(it.answer), 700);
    } else if (it.prompt.includes('6 × ☐ = 42')) {
      assert.equal(6 * Number(it.answer), 42);
    }
  });
});
