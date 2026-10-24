// MelodyMath — Unit tests for topic diagnostic & fast start (Issue #678, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const TopicDiag = require('../src/lib/topicDiagnostic.js');
const { diagnosticItems } = require('../src/lib/banks.js');
const progression = require('../src/lib/curriculum/progression.js');

test('diagnostic blocks have at most 4 items per block and include an unassisted item', () => {
  const g1Items = diagnosticItems('א');
  assert.equal(g1Items.length, 16);

  const blocks = TopicDiag.createDiagnosticBlocks(g1Items);
  assert.equal(blocks.length, 4);

  blocks.forEach((block, idx) => {
    assert.ok(block.items.length <= TopicDiag.MAX_DIAGNOSTIC_BLOCK_SIZE, `Block ${idx} has ${block.items.length} items; must be <= 4`);
    assert.ok(block.items.length > 0);
    assert.equal(block.index, idx + 1);
    assert.equal(block.hasUnassistedItem, true, 'Each block must have an unassisted item to verify pure math');
    const unassisted = block.items.filter(it => it.noMusic);
    assert.ok(unassisted.length >= 1, 'At least one item per block must have noMusic');
  });
});

test('each diagnostic block is embedded in play with an inviting spoken explanation and immediate feedback', () => {
  const sample = [{ prompt: '1 + 1 = ?', answer: '2' }, { prompt: '2 + 2 = ?', answer: '4' }];
  let spokenText = null;
  const blocks = TopicDiag.createDiagnosticBlocks(sample, { grade: 'א' });

  assert.equal(blocks.length, 1);
  const b = blocks[0];
  assert.equal(b.hasSpokenExplanation, true);
  assert.match(b.spokenExplanation, /בואו נשחק ונפתור ביחד/);
  assert.equal(b.isPlayEmbedded, true);
  assert.equal(b.immediateFeedback, true);

  TopicDiag.openTopic({ id: 'sample', grade: 'א', items: sample }, {
    speak: text => { spokenText = text; }
  });
  assert.match(spokenText, /בואו נשחק ונפתור ביחד/);
});

test('no self-report questionnaire for grades א׳ and ב׳ with normalization', () => {
  const earlyGrades = ['א', 'א׳', ' ב ', 'ב׳', '1', '2', 'grade1', 'grade2'];
  for (const g of earlyGrades) {
    assert.equal(TopicDiag.isSelfReportAllowed(g), false, `Self-report must not be allowed for ${g}`);
  }

  // Upper grades allow self report
  assert.equal(TopicDiag.isSelfReportAllowed('ג'), true);
  assert.equal(TopicDiag.isSelfReportAllowed('ג׳'), true);
  assert.equal(TopicDiag.isSelfReportAllowed('ד'), true);

  const resA = TopicDiag.openTopic({ id: 'counting', grade: 'א׳', items: [{ prompt: '1+1' }] }, { allowSelfReport: true });
  assert.equal(resA.hasSelfReport, false, 'Grade א׳ must never show self-report');

  const resB = TopicDiag.openTopic({ id: 'addition', grade: 'ב׳', items: [{ prompt: '2+2' }] }, { allowSelfReport: true });
  assert.equal(resB.hasSelfReport, false, 'Grade ב׳ must never show self-report');
});

test('time from topic open to first interactive exercise is under 10 seconds (Rule 3)', () => {
  const g1Items = diagnosticItems('א');
  const t0 = Date.now();
  const res = TopicDiag.openTopic({ id: 'mm-cur-0', grade: 'א', items: g1Items });
  const latency = Date.now() - t0;

  assert.ok(latency < 10000, `Topic open latency must be under 10s, got ${latency}ms`);
  assert.equal(res.playableImmediately, true);
  assert.equal(res.withinTargetLatency, true);
  assert.ok(res.firstExercise, 'First exercise must be immediately available');
  assert.ok(res.firstExercise.prompt);
  assert.ok(res.firstBlock.items.length <= 4);
});

test('prerequisite check enforces progression requirements before starting a new topic', () => {
  // mm-cur-33 (fractions of quantity) requires mm-cur-32 and mm-cur-16
  const topicId = 'mm-cur-33';
  const links = progression.linksForTopic(topicId);
  assert.ok(links.prereq.includes('mm-cur-32'));
  assert.ok(links.prereq.includes('mm-cur-16'));

  // Without prerequisites mastered -> redirects to missing prereq
  const blocked = TopicDiag.openTopic({ id: topicId, grade: 'ד' }, {
    progressionModule: progression,
    tracker: { isMastered: () => false }
  });
  assert.equal(blocked.playableImmediately, false);
  assert.equal(blocked.prereqCheck.ok, false);
  assert.equal(blocked.redirectTo, 'mm-cur-32');

  // With prerequisites mastered -> starts immediately
  const allowed = TopicDiag.openTopic({ id: topicId, grade: 'ד' }, {
    progressionModule: progression,
    tracker: { isMastered: id => id === 'mm-cur-32' || id === 'mm-cur-16' }
  });
  assert.equal(allowed.playableImmediately, true);
  assert.equal(allowed.prereqCheck.ok, true);
  assert.equal(allowed.redirectTo, null);
});

test('index.html integrates topicDiagnostic on rmBegin and rmRender', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('src/lib/topicDiagnostic.js'), 'topicDiagnostic.js script must be included');
  assert.ok(indexHtml.includes('MM_TOPIC_DIAGNOSTIC.openTopic'), 'rmBegin must wire MM_TOPIC_DIAGNOSTIC.openTopic');
  assert.ok(indexHtml.includes('if(!q.noMusic'), 'rmRender must respect noMusic items');
});
