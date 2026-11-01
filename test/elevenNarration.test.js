const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
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

test('generatePreRecordedNarration writes audio buffer on successful response', async () => {
  const origFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({
      ok: true,
      status: 200,
      arrayBuffer: async () => Buffer.from('fake-mp3-bytes')
    });
    const fakeDir = path.join(__dirname, '..', 'tmp-test-voice');
    const origDir = ELEVEN_CONFIG.outputDir;
    ELEVEN_CONFIG.outputDir = fakeDir;
    const res = await generatePreRecordedNarration('test-key', { prompts: [HEBREW_VOICE_PROMPTS[0]] });
    assert.equal(res.skipped, false);
    assert.equal(res.generatedCount, 1);
    assert.equal(res.results[0].status, 'generated');
    fs.rmSync(fakeDir, { recursive: true, force: true });
    ELEVEN_CONFIG.outputDir = origDir;
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('generatePreRecordedNarration handles HTTP error and network exception', async () => {
  const origFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({
      ok: false,
      status: 401
    });
    const res1 = await generatePreRecordedNarration('test-key', { prompts: [HEBREW_VOICE_PROMPTS[0]] });
    assert.equal(res1.results[0].status, 'error');
    assert.equal(res1.results[0].statusCode, 401);

    globalThis.fetch = async () => { throw new Error('network down'); };
    const res2 = await generatePreRecordedNarration('test-key', { prompts: [HEBREW_VOICE_PROMPTS[0]] });
    assert.equal(res2.results[0].status, 'error');
    assert.equal(res2.results[0].message, 'network down');
  } finally {
    globalThis.fetch = origFetch;
  }
});

test('tools/elevenNarration runs as standalone CLI and reports missing key', () => {
  const r = spawnSync(process.execPath, [path.join(__dirname, '..', 'tools', 'elevenNarration.js')], {
    env: { ...process.env, ELEVENLABS_API_KEY: '' }
  });
  assert.equal(r.status, 0);
  assert.match(r.stdout.toString(), /ELEVENLABS_API_KEY absent/);
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

test('NarrationPlayer playNarration in browser environment with mock Audio', () => {
  let playCalled = false;
  let listeners = {};
  class MockAudio {
    constructor(src) {
      this.src = src;
    }
    addEventListener(evt, fn) {
      listeners[evt] = fn;
    }
    play() {
      playCalled = true;
      return Promise.resolve();
    }
  }
  const origAudio = globalThis.Audio;
  try {
    globalThis.Audio = MockAudio;
    let ended = false;
    const a = NarrationPlayer.playNarration('addition', () => { ended = true; });
    assert.ok(a instanceof MockAudio);
    assert.equal(playCalled, true);
    listeners['ended']();
    assert.equal(ended, true);

    // Test error listener
    let errorEnded = false;
    NarrationPlayer.playNarration('addition', () => { errorEnded = true; });
    listeners['error']();
    assert.equal(errorEnded, true);
  } finally {
    globalThis.Audio = origAudio;
  }
});

test('NarrationPlayer handles browser play rejection and Audio constructor error', async () => {
  const origAudio = globalThis.Audio;
  try {
    let rejectEnded = false;
    class RejectAudio {
      constructor(src) { this.src = src; }
      addEventListener() {}
      play() {
        return Promise.reject(new Error('play-error'));
      }
    }
    globalThis.Audio = RejectAudio;
    NarrationPlayer.playNarration('addition', () => { rejectEnded = true; });
    await new Promise(r => setTimeout(r, 10));
    assert.equal(rejectEnded, true);

    globalThis.Audio = function() { throw new Error('audio-init-failed'); };
    let initFailedEnded = false;
    const res = NarrationPlayer.playNarration('addition', () => { initFailedEnded = true; });
    assert.equal(res, null);
    assert.equal(initFailedEnded, true);
  } finally {
    globalThis.Audio = origAudio;
  }
});

test('NarrationPlayer supports non-CommonJS window root global', () => {
  const code = fs.readFileSync(path.join(__dirname, '..', 'src', 'lib', 'narrationPlayer.js'), 'utf8');
  const fn = new Function('module', code);
  fn(undefined);
  assert.ok(globalThis.NarrationPlayer);
  assert.equal(typeof globalThis.NarrationPlayer.playNarration, 'function');
  delete globalThis.NarrationPlayer;
});
