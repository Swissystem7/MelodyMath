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
  assert.equal(typeof core.loadAccess, 'function');
  assert.equal(typeof core.describeGraphHe, 'function');
  assert.equal(typeof core.buildParentNote, 'function');
  assert.equal(typeof core.buildCertificate, 'function');
  assert.equal(typeof core.checkListenAnswer, 'function');
  assert.equal(typeof core.shouldShowOnboard, 'function');
  assert.equal(typeof core.playCountClicks, 'function');
  assert.equal(typeof core.tabIndexAfterKey, 'function');
  assert.equal(typeof core.refreshSpeakNow, 'function');
  assert.ok(core.isCorrect('1,25', 1.25));
  assert.equal(core.tabIndexAfterKey(0, 3, 'ArrowLeft', true), 1);
});
