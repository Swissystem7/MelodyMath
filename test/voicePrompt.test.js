// MelodyMath — Spoken Instructions & Audio Fallback Unit Tests (Issue #676, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const VP = require('../src/lib/voicePrompt.js');

test('each exercise type has a voicePrompt and a recorded asset; missing asset fails CI', () => {
  const types = Object.keys(VP.EXERCISE_VOICE_MAP);
  assert.ok(types.length >= 8, 'covers all curriculum exercise types');

  types.forEach(type => {
    const entry = VP.EXERCISE_VOICE_MAP[type];
    assert.ok(entry.voicePrompt, `${type} must have a voicePrompt string`);
    assert.ok(entry.fallbackAsset, `${type} must have a fallbackAsset filename`);

    const assetPath = path.join(__dirname, '..', 'sounds', 'voice', 'he', entry.fallbackAsset);
    assert.ok(fs.existsSync(assetPath), `Recorded asset missing for ${type}: ${assetPath}`);
    assert.ok(fs.statSync(assetPath).size > 44, `Recorded asset must be non-empty valid audio: ${entry.fallbackAsset}`);
  });
});

test('each feedback line has a voicePrompt and a recorded asset', () => {
  const feedbacks = Object.keys(VP.FEEDBACK_VOICE_MAP);
  assert.ok(feedbacks.length >= 3, 'covers correct, retry, shown');

  feedbacks.forEach(key => {
    const entry = VP.FEEDBACK_VOICE_MAP[key];
    assert.ok(entry.voicePrompt, `${key} feedback must have voicePrompt string`);
    assert.ok(entry.fallbackAsset, `${key} feedback must have fallbackAsset filename`);

    const assetPath = path.join(__dirname, '..', 'sounds', 'voice', 'he', entry.fallbackAsset);
    assert.ok(fs.existsSync(assetPath), `Feedback asset missing: ${assetPath}`);
  });
});

test('no child string is longer than 15 words (strict child-eye constraint)', () => {
  // Exercise prompts
  Object.keys(VP.EXERCISE_VOICE_MAP).forEach(type => {
    const entry = VP.EXERCISE_VOICE_MAP[type];
    const words = VP.countWords(entry.voicePrompt);
    assert.ok(words <= 15, `Exercise ${type} prompt exceeds 15 words: "${entry.voicePrompt}" (${words} words)`);
  });

  // Feedback strings
  Object.keys(VP.FEEDBACK_VOICE_MAP).forEach(key => {
    const entry = VP.FEEDBACK_VOICE_MAP[key];
    const words = VP.countWords(entry.voicePrompt);
    assert.ok(words <= 15, `Feedback ${key} exceeds 15 words: "${entry.voicePrompt}" (${words} words)`);
  });
});

test('abstract instructions replaced with concrete child action', () => {
  const raw = 'ספרו את הפעימות ואז הקישו את המספר';
  const cleaned = VP.cleanChildPrompt(raw);
  assert.doesNotMatch(cleaned, /הקישו את המספר/);
  assert.match(cleaned, /הקישו 3 פעמים על התוף/);
  assert.ok(VP.countWords(cleaned) <= 15);
});

test('speechRoute correctly handles TTS vs fallback audio clip', () => {
  // With Hebrew voice available -> 'tts'
  assert.equal(VP.speechRoute('addition', true), 'tts');
  assert.equal(VP.speechRoute('fractions', true), 'tts');

  // With TTS disabled or no Hebrew voice -> 'clip'
  assert.equal(VP.speechRoute('addition', false), 'clip');
  assert.equal(VP.speechRoute('fractions', false), 'clip');
  assert.equal(VP.speechRoute('correct', false), 'clip');

  // Unknown key -> 'none'
  assert.equal(VP.speechRoute('unknown_xyz', false), 'none');
});

test('speakInstruction routes to clip and invokes Audio when TTS is disabled', () => {
  let playedUrl = null;
  const mockAudio = function (url) {
    this.url = url;
    this.play = () => { playedUrl = url; return Promise.resolve(); };
    this.pause = () => {};
  };

  const res = VP.speakInstruction({ skill: 'addition' }, {
    mockVoice: null,
    basePath: 'sounds/voice/he/'
  });

  assert.equal(res.route, 'clip');
  assert.equal(res.asset, 'prompt_addition.wav');
});

test('replay button mounts with accessible semantics and minimum 44px touch target', () => {
  const mockDoc = {
    createElement: function (tag) {
      const attrs = {};
      return {
        tag: tag,
        style: {},
        setAttribute: function (k, v) { attrs[k] = v; },
        getAttribute: function (k) { return attrs[k]; }
      };
    }
  };

  const domContainer = {
    children: [],
    appendChild: function (el) { this.children.push(el); },
    querySelector: function () { return null; }
  };

  let clicked = false;
  const btn = VP.mountReplayButton(domContainer, () => { clicked = true; }, mockDoc);

  assert.ok(btn);
  assert.equal(btn.getAttribute('aria-label'), 'השמעת ההוראה שוב');
  assert.equal(btn.style.minWidth, '44px');
  assert.equal(btn.style.minHeight, '44px');
  btn.onclick();
  assert.equal(clicked, true);
});
