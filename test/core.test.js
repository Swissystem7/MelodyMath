const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/lib/core');

test('core.js is the Node facade for audio, answers, and storage', () => {
  assert.equal(typeof core.isCorrect, 'function');
  assert.equal(typeof core.closeEnough, 'function');
  assert.equal(typeof core.getAudioContext, 'function');
  assert.equal(typeof core.playValueSweep, 'function');
  assert.equal(typeof core.loadJson, 'function');
  assert.equal(typeof core.buildReport, 'function');
  assert.equal(typeof core.installSharedChrome, 'function');
  assert.ok(core.isCorrect('1,25', 1.25));
});
