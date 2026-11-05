// MM-7xx lesson registry contract (stream B; stream C depends on it): any
// file may push lessons to globalThis.MMLessonRegistry, in any load order, and
// interactiveLessons.js serves them next to its built-in lessons.
const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('../src/lib/interactiveLessons');

const lesson = (id, extra) => Object.assign({
  id, title: 'שיעור בדיקה', grade: 'א', strand: 'מספרים ופעולות', topicId: 'mm-cur-3',
  steps: [
    { title: 'מסבירים', body: 'גוף' },
    { title: 'בודקים', body: 'שאלה', options: ['א', 'ב'], correctIndex: 1, explanation: 'כי' },
  ],
}, extra || {});

function withRegistry(list, fn) {
  const had = Object.prototype.hasOwnProperty.call(globalThis, 'MMLessonRegistry');
  const before = globalThis.MMLessonRegistry;
  globalThis.MMLessonRegistry = list;
  try { fn(); } finally { if (had) globalThis.MMLessonRegistry = before; else delete globalThis.MMLessonRegistry; }
}

test('without a registry the built-in lessons are served unchanged', () => {
  withRegistry(undefined, () => {
    assert.equal(L.getAllLessons(), L.LESSONS);
    assert.equal(L.getLessonById('zz-test-a'), null);
  });
});

test('registry lessons are served by all three getters, whenever they were pushed', () => {
  withRegistry([], () => {
    const n = L.getAllLessons().length;
    // Pushed after interactiveLessons.js loaded: still picked up.
    (globalThis.MMLessonRegistry = globalThis.MMLessonRegistry || []).push(lesson('zz-test-a'));
    assert.equal(L.getAllLessons().length, n + 1);
    assert.equal(L.getLessonById('zz-test-a').topicId, 'mm-cur-3');
    assert.ok(L.getLessonsForGrade('א').some((l) => l.id === 'zz-test-a'));
    assert.ok(!L.getLessonsForGrade('ד').some((l) => l.id === 'zz-test-a'));
    assert.deepEqual(L.evaluateStepAnswer('zz-test-a', 1, 1), { valid: true, correct: true, correctIndex: 1, explanation: 'כי' });
  });
});

test('invalid entries, built-in ids and repeated ids are ignored', () => {
  const builtIn = L.LESSONS[0].id;
  withRegistry([
    null, { id: 'zz-no-steps', title: 'x', grade: 'א', steps: [] },
    lesson('zz-bad-quiz', { steps: [{ title: 't', body: 'b', options: ['a'], correctIndex: 3 }] }),
    lesson(builtIn, { title: 'מחליף' }),
    lesson('zz-dup', { title: 'ראשון' }), lesson('zz-dup', { title: 'שני' }),
  ], () => {
    const ids = L.getAllLessons().map((l) => l.id);
    assert.ok(!ids.includes('zz-no-steps') && !ids.includes('zz-bad-quiz'));
    assert.equal(ids.filter((id) => id === builtIn).length, 1);
    assert.notEqual(L.getLessonById(builtIn).title, 'מחליף');
    assert.equal(ids.filter((id) => id === 'zz-dup').length, 1);
    assert.equal(L.getLessonById('zz-dup').title, 'ראשון');
  });
});
