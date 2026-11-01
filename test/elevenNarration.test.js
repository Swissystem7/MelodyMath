const { test } = require('node:test');
const assert = require('node:assert/strict');
const { generatePreRecordedNarration, HEBREW_VOICE_PROMPTS, ELEVEN_CONFIG } = require('../tools/elevenNarration');
const NarrationPlayer = require('../src/lib/narrationPlayer');

test('elevenNarration exports valid config and Hebrew voice prompts', () => {
  assert.ok(Array.isArray(HEBREW_VOICE_PROMPTS));
  assert.ok(HEBREW_VOICE_PROMPTS.length >= 6);
  assert.match(ELEVEN_CONFIG.apiUrl, /elevenlabs\.io/);
  assert.equal(ELEVEN_CONFIG.modelId, 'eleven_multilingual_v2');
});

test('generatePreRecordedNarration skips silently when API key is missing', async () => {
  const res = await generatePreRecordedNarration('');
  assert.equal(res.skipped, true);
  assert.match(res.reason, /skipped silently/);
});

test('generatePreRecordedNarration handles dry-run mode without network calls', async () => {
  const res = await generatePreRecordedNarration('dummy-key', { dryRun: true });
  assert.equal(res.skipped, false);
  assert.equal(res.results.length, HEBREW_VOICE_PROMPTS.length);
  assert.equal(res.results[0].status, 'dry_run');
});

test('NarrationPlayer returns asset paths and handles unknown keys', () => {
  assert.equal(NarrationPlayer.getAudioPath('addition'), 'sounds/voice/he/prompt_addition.mp3');
  assert.equal(NarrationPlayer.getAudioPath('feedback_good'), 'sounds/voice/he/feedback_good.mp3');
  assert.equal(NarrationPlayer.getAudioPath('non_existent'), null);
});

test('NarrationPlayer playNarration invokes callback safely in non-browser Node runtime', () => {
  let called = false;
  NarrationPlayer.playNarration('addition', () => {
    called = true;
  });
  assert.equal(called, true);
});
