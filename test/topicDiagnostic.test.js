// MelodyMath — Unit tests for topic diagnostic & fast start (Issue #678, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');
const TopicDiag = require('../src/lib/topicDiagnostic.js');
const { diagnosticItems } = require('../src/lib/banks.js');

test('diagnostic blocks have at most 4 items per block', () => {
  const g1Items = diagnosticItems('א');
  assert.equal(g1Items.length, 16);

  const blocks = TopicDiag.createDiagnosticBlocks(g1Items);
  assert.equal(blocks.length, 4);

  blocks.forEach((block, idx) => {
    assert.ok(block.items.length <= TopicDiag.MAX_DIAGNOSTIC_BLOCK_SIZE, `Block ${idx} has ${block.items.length} items; must be <= 4`);
    assert.ok(block.items.length > 0);
    assert.equal(block.index, idx + 1);
  });
});

test('each diagnostic block is embedded in play with a spoken explanation and immediate feedback', () => {
  const sample = [{ prompt: '1 + 1 = ?', answer: '2' }, { prompt: '2 + 2 = ?', answer: '4' }];
  const blocks = TopicDiag.createDiagnosticBlocks(sample, { grade: 'א' });

  assert.equal(blocks.length, 1);
  const b = blocks[0];
  assert.equal(b.hasSpokenExplanation, true);
  assert.match(b.spokenExplanation, /תרגילים קצרים/);
  assert.equal(b.isPlayEmbedded, true);
  assert.equal(b.immediateFeedback, true);
});

test('no self-report questionnaire for grades א׳ and ב׳', () => {
  assert.equal(TopicDiag.isSelfReportAllowed('א'), false);
  assert.equal(TopicDiag.isSelfReportAllowed('ב'), false);
  assert.equal(TopicDiag.isSelfReportAllowed('1'), false);
  assert.equal(TopicDiag.isSelfReportAllowed('2'), false);

  const resA = TopicDiag.openTopic({ id: 'counting', grade: 'א', items: [{ prompt: '1+1' }] }, { allowSelfReport: true });
  assert.equal(resA.hasSelfReport, false, 'Grade א must never show self-report');

  const resB = TopicDiag.openTopic({ id: 'addition', grade: 'ב', items: [{ prompt: '2+2' }] }, { allowSelfReport: true });
  assert.equal(resB.hasSelfReport, false, 'Grade ב must never show self-report');
});

test('time from topic open to first interactive exercise is under 10 seconds (Rule 3)', () => {
  const g1Items = diagnosticItems('א');
  const t0 = Date.now();
  const res = TopicDiag.openTopic({ id: 'g1_diag', grade: 'א', items: g1Items });
  const latency = Date.now() - t0;

  assert.ok(latency < 10000, `Topic open latency must be under 10s, got ${latency}ms`);
  assert.equal(res.playableImmediately, true);
  assert.equal(res.withinTargetLatency, true);
  assert.ok(res.firstExercise, 'First exercise must be immediately available');
  assert.ok(res.firstExercise.prompt);
});
