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

function createMockDoc() {
  const nodes = {
    stats: { innerHTML: '', parentNode: null },
    summaryText: { textContent: '' },
    quiz: { classList: { toggle(_cls, hidden) { this.hidden = hidden; }, hidden: false } },
    summary: { classList: { toggle(_cls, hidden) { this.hidden = hidden; }, hidden: true } },
    exerciseCorrectCount: null,
  };
  nodes.stats.parentNode = {
    insertBefore(el, ref) {
      if (ref === nodes.stats.nextSibling || ref == null) nodes.exerciseCorrectCount = el;
    },
  };
  nodes.stats.nextSibling = null;
  return {
    nodes,
    getElementById(id) {
      return nodes[id] || null;
    },
    createElement(tag) {
      return {
        tagName: String(tag).toUpperCase(),
        id: '',
        className: '',
        textContent: '',
        setAttribute() {},
      };
    },
  };
}

test('core functions handle null and undefined input safely without throwing TypeError', () => {
  assert.equal(core.countSessionCorrectAnswers(null), 0);
  assert.equal(core.countSessionCorrectAnswers(undefined), 0);
  assert.equal(core.countSessionCorrectAnswers([null, undefined, { id: 1, correct: null }, { id: 2, correct: undefined }]), 0);

  assert.deepEqual(core.showExerciseSessionSummary(null, null), { correct: 0, total: 0 });
  assert.deepEqual(core.showExerciseSessionSummary(undefined, undefined), { correct: 0, total: 0 });

  const doc = createMockDoc();
  assert.deepEqual(core.showExerciseSessionSummary(doc, null), { correct: 0, total: 0 });
  assert.deepEqual(core.showExerciseSessionSummary(doc, undefined), { correct: 0, total: 0 });

  const malformedHistory = [null, undefined, { id: 'q1', correct: true }, { id: 'q2', correct: false }];
  const res = core.showExerciseSessionSummary(doc, malformedHistory, { levelForId: null });
  assert.equal(res.correct, 1);
  assert.equal(res.total, 4);
  assert.match(doc.nodes.stats.innerHTML, /<strong>1\/4<\/strong>/);
  assert.ok(doc.nodes.exerciseCorrectCount);
  assert.match(doc.nodes.exerciseCorrectCount.textContent, /1/);

  const navNull = core.siteNavHtml(null);
  const navUndef = core.siteNavHtml(undefined);
  assert.match(navNull, /aria-current="page"/);
  assert.match(navUndef, /aria-current="page"/);
});

test('core functions handle NaN and Infinity without throwing and prevent NaN in the UI', () => {
  assert.equal(core.countSessionCorrectAnswers(NaN), 0);
  assert.equal(core.countSessionCorrectAnswers(Infinity), 0);
  assert.equal(core.countSessionCorrectAnswers(-Infinity), 0);
  assert.equal(core.countSessionCorrectAnswers([{ id: 1, correct: NaN }, { id: 2, correct: Infinity }]), 0);

  const doc = createMockDoc();
  const emptyRes = core.showExerciseSessionSummary(doc, [], {
    levelForId: () => NaN,
  });
  assert.equal(emptyRes.correct, 0);
  assert.equal(emptyRes.total, 0);
  assert.doesNotMatch(doc.nodes.stats.innerHTML, /NaN/);
  assert.doesNotMatch(doc.nodes.stats.innerHTML, /Infinity/);
  assert.match(doc.nodes.stats.innerHTML, /0%<\/strong>דיוק/);
  assert.ok(doc.nodes.exerciseCorrectCount);
  assert.match(doc.nodes.exerciseCorrectCount.textContent, /0/);

  const doc2 = createMockDoc();
  const res = core.showExerciseSessionSummary(doc2, [{ id: 'q1', correct: true }], {
    levelForId: () => Infinity,
  });
  assert.equal(res.correct, 1);
  assert.doesNotMatch(doc2.nodes.stats.innerHTML, /Infinity/);
  assert.match(doc2.nodes.stats.innerHTML, /100%<\/strong>דיוק/);

  const navNan = core.siteNavHtml(NaN);
  const navInf = core.siteNavHtml(Infinity);
  assert.doesNotMatch(navNan, /NaN/);
  assert.doesNotMatch(navInf, /infinity/);
  assert.match(navNan, /href="index\.html"/);
  assert.match(navInf, /href="index\.html"/);
});

test('core functions handle empty strings safely and preserve valid fallback behavior', () => {
  assert.equal(core.countSessionCorrectAnswers(''), 0);
  assert.equal(core.countSessionCorrectAnswers(['', 'bad', { id: 1, correct: '' }]), 0);

  const doc = createMockDoc();
  const res = core.showExerciseSessionSummary(doc, [{ id: 1, correct: true }], {
    statsId: '',
    summaryTextId: '',
    summaryText: '',
  });
  assert.equal(res.correct, 1);
  assert.equal(res.total, 1);
  assert.match(doc.nodes.stats.innerHTML, /<strong>1\/1<\/strong>/);
  assert.match(doc.nodes.summaryText.textContent, /ספירה של הסבב הזה/);

  const navEmpty = core.siteNavHtml('');
  const navWhitespace = core.siteNavHtml('   ');
  assert.match(navEmpty, /href="index\.html" aria-current="page"/);
  assert.match(navWhitespace, /href="index\.html" aria-current="page"/);
});
