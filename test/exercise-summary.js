const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../src/lib/core');

function mockDocument() {
  const nodes = {
    stats: { innerHTML: '', parentNode: null },
    summaryText: { textContent: '' },
    quiz: { classList: { toggle(_cls, hidden) { this.hidden = hidden; }, hidden: false } },
    summary: { classList: { toggle(_cls, hidden) { this.hidden = hidden; }, hidden: true } },
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
      const el = {
        tagName: String(tag).toUpperCase(),
        id: '',
        className: '',
        textContent: '',
        setAttribute() {},
      };
      return el;
    },
  };
}

test('after completing an exercise, the UI displays session correct-answer count', () => {
  assert.equal(typeof core.showExerciseSessionSummary, 'function');

  const history = [
    { id: 1, correct: true },
    { id: 2, correct: false },
    { id: 3, correct: true },
    { id: 4, correct: true },
  ];
  assert.equal(core.countSessionCorrectAnswers(history), 3);

  const doc = mockDocument();
  const result = core.showExerciseSessionSummary(doc, history, {
    showPanels: true,
    levelForId: function () { return 2; },
  });

  assert.equal(result.correct, 3);
  assert.equal(result.total, 4);
  assert.equal(doc.nodes.quiz.classList.hidden, true);
  assert.equal(doc.nodes.summary.classList.hidden, false);
  assert.match(doc.nodes.stats.innerHTML, /<strong>3\/4<\/strong>/);

  const countEl = doc.nodes.exerciseCorrectCount;
  assert.ok(countEl, 'expected a visible correct-count line in the summary UI');
  assert.match(countEl.textContent, /3/);
  assert.match(countEl.textContent, /פתרת נכון/);
});
