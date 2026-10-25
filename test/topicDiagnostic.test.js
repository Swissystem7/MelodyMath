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
    assert.ok(block.items.length <= TopicDiag.MAX_DIAGNOSTIC_BLOCK_SIZE);
    assert.ok(block.items.length > 0);
    assert.equal(block.index, idx + 1);
    assert.equal(block.hasUnassistedItem, true);
    assert.ok(block.items.filter(it => it.noMusic).length >= 1);
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
    assert.equal(TopicDiag.isSelfReportAllowed(g), false);
  }
  assert.equal(TopicDiag.isSelfReportAllowed('ג'), true);
  assert.equal(TopicDiag.isSelfReportAllowed('ג׳'), true);
  assert.equal(TopicDiag.isSelfReportAllowed('ד'), true);

  const resA = TopicDiag.openTopic({ id: 'counting', grade: 'א׳', items: [{ prompt: '1+1' }] }, { allowSelfReport: true });
  assert.equal(resA.hasSelfReport, false);

  const resB = TopicDiag.openTopic({ id: 'addition', grade: 'ב׳', items: [{ prompt: '2+2' }] }, { allowSelfReport: true });
  assert.equal(resB.hasSelfReport, false);
});

test('time from topic open to first interactive exercise is under 10 seconds (Rule 3)', () => {
  const g1Items = diagnosticItems('א');
  const t0 = Date.now();
  const res = TopicDiag.openTopic({ id: 'mm-cur-0', grade: 'א', items: g1Items });
  const latency = Date.now() - t0;

  assert.ok(latency < 10000);
  assert.equal(res.playableImmediately, true);
  assert.equal(res.withinTargetLatency, true);
  assert.ok(res.firstExercise);
  assert.ok(res.firstBlock.items.length <= 4);
});

test('prerequisite check enforces progression requirements before starting a new topic', () => {
  const topicId = 'mm-cur-33';
  const links = progression.linksForTopic(topicId);
  assert.ok(links.prereq.includes('mm-cur-32'));
  assert.ok(links.prereq.includes('mm-cur-16'));

  const blocked = TopicDiag.openTopic({ id: topicId, grade: 'ד' }, {
    progressionModule: progression,
    tracker: { isMastered: () => false }
  });
  assert.equal(blocked.playableImmediately, false);
  assert.equal(blocked.prereqCheck.ok, false);
  assert.equal(blocked.redirectTo, 'mm-cur-0');

  const allowed = TopicDiag.openTopic({ id: topicId, grade: 'ד' }, {
    progressionModule: progression,
    tracker: { isMastered: id => id === 'mm-cur-32' || id === 'mm-cur-16' }
  });
  assert.equal(allowed.playableImmediately, true);
  assert.equal(allowed.prereqCheck.ok, true);
  assert.equal(allowed.redirectTo, null);
});

test('checkPrerequisites locks unknown topic IDs and traces deepest missing prerequisite root (#721, Refs #591)', () => {
  const unk = TopicDiag.checkPrerequisites('unknown-topic-id', null, progression);
  assert.equal(unk.ok, false);
  assert.equal(unk.missing.includes('unknown_topic'), true);

  const chainCheck = TopicDiag.checkPrerequisites('mm-cur-33', {
    isMastered: id => ['mm-cur-16', 'mm-cur-18', 'mm-cur-22', 'mm-cur-24'].includes(id)
  }, progression);
  assert.equal(chainCheck.ok, false);
  assert.equal(chainCheck.redirectTo, 'mm-cur-25');
});

test('topic and item order strictly matches progression.js (no topic before its prerequisite, #721, Refs #665)', () => {
  // In Grade ב, place_value (mm-cur-13) must precede addition (mm-cur-14)
  const g2Items = diagnosticItems('ב');
  const blocks = TopicDiag.createDiagnosticBlocks(g2Items, { grade: 'ב', progressionModule: progression });
  assert.ok(blocks.length > 0);
  const firstBlock = blocks[0];
  assert.equal(firstBlock.items[0].skill, 'place_value', 'first item in Grade ב diagnostic must be place_value, not addition');

  // orderTopics orders an inverted list of topics correctly
  const sample = ['mm-cur-14', 'mm-cur-13', 'mm-cur-31', 'mm-cur-3', 'mm-cur-0'];
  const ordered = TopicDiag.orderTopics(sample, progression);
  assert.deepEqual(ordered, ['mm-cur-0', 'mm-cur-3', 'mm-cur-13', 'mm-cur-14', 'mm-cur-31']);
});

test('single item diagnostic block includes unassisted pure math item (#721, Refs #591)', () => {
  const single = [{ prompt: '5 + 5 = ?', answer: '10' }];
  const blocks = TopicDiag.createDiagnosticBlocks(single, { grade: 'א' });
  assert.equal(blocks.length, 1);
  assert.equal(blocks[0].items.length, 1);
  assert.equal(blocks[0].hasUnassistedItem, true);
  assert.equal(blocks[0].items[0].noMusic, true);
  assert.equal(blocks[0].items[0].plain, true);
});

test('index.html integrates topicDiagnostic on rmBegin and rmRender', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('src/lib/topicDiagnostic.js'));
  assert.ok(indexHtml.includes('MM_TOPIC_DIAGNOSTIC.openTopic'));
  assert.equal(indexHtml.includes("'mm-cur-diag-'+"), false);
  assert.ok(indexHtml.includes('realTopicId'));
  assert.ok(indexHtml.includes('if(!q.noMusic'));
});
