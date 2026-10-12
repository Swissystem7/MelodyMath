const test = require('node:test');
const assert = require('node:assert/strict');
const unit = require('../src/lib/unitChecks');
const { makeChoices } = require('../src/lib/teacherStore');
const { isCorrect } = require('../src/lib/adaptive');

const UNIT = unit.UNIT_CHECK_UNIT_ID;
const TAG = unit.UNIT_CHECK_PARALLEL_TAG;
const forms = ['pre', 'post'].map((phase) => unit.getUnitForm(UNIT, phase));

test('grade ד׳ fractions pre and post are parallel: 6–8 items, matched levels, no shared item', () => {
  const v = unit.validateUnitParallelForms(UNIT);
  assert.equal(v.ok, true, JSON.stringify(v));
  assert.ok(v.n >= 6 && v.n <= 8);
  assert.equal(v.parallelForm, TAG);
  const [pre, post] = forms;
  assert.equal(pre.items.length, post.items.length);
  assert.equal(unit.parallelDifficultyMatch(pre.items, post.items), true);
  forms.forEach((form) => form.items.forEach((it) => {
    assert.deepEqual(
      [it.parallelForm, it.formPhase, it.formId],
      [TAG, form.phase, form.id],
      'untagged item: ' + it.prompt
    );
  }));
});

test('an unknown unit or a made-up phase gets null, not a half-built form', () => {
  assert.equal(unit.getUnitForm(UNIT, 'during'), null);
  assert.equal(unit.getUnitForm('no-such-unit', 'pre'), null);
  assert.equal(unit.getUnit('no-such-unit'), null);
  assert.equal(unit.validateUnitParallelForms('no-such-unit').error, 'unknown-unit');
});

test('parallelDifficultyMatch fails on a different spread of levels or a different count', () => {
  assert.deepEqual({ ...unit.levelHistogram([{ level: 1 }, { level: 2 }, { level: 2 }]) }, { 1: 1, 2: 2 });
  assert.equal(unit.parallelDifficultyMatch([{ level: 1 }, { level: 2 }], [{ level: 1 }, { level: 1 }]), false);
  assert.equal(unit.parallelDifficultyMatch([{ level: 1 }], [{ level: 1 }, { level: 1 }]), false);
});

test('scoreForm folds the glyphs a child may tap and charges unanswered items to the total', () => {
  const form = forms[0];
  const n = form.items.length;
  const answers = form.items.map((it) => it.answer);
  answers[1] = '½';
  assert.deepEqual(unit.scoreForm(form, answers), { correct: n, total: n });
  assert.deepEqual(unit.scoreForm(form, answers.slice(0, 3)), { correct: 3, total: n });
  assert.deepEqual(unit.scoreForm(form, []), { correct: 0, total: n });
  assert.deepEqual(unit.scoreForm(null, answers), { correct: 0, total: 0 });
  assert.equal(unit.normalizeCheckAnswer('⅛'), '1/8');
  assert.equal(unit.normalizeCheckAnswer('4/8'), '1/2');
  assert.equal(unit.normalizeCheckAnswer('04'), '4');
  assert.equal(unit.normalizeCheckAnswer(null), '');
  assert.equal(unit.normalizeCheckAnswer('חצי'), 'חצי');
});

test('the module does not take over a global adaptive.js or teacherStore already owns', () => {
  ['normalizeAnswer', 'isCorrect', 'escapeHtml', 'UNIT_ID', 'DISCLAIMER'].forEach((name) => {
    assert.equal(name in unit, false, 'unitChecks must not export the shared global ' + name);
  });
});

test('every item yields four distinct choices with exactly one correct, and never shows its answer', () => {
  let counting = 0;
  forms.forEach((form) => form.items.forEach((it) => {
    const opts = makeChoices(it.answer, () => 0.5).map(String);
    assert.equal(new Set(opts).size, 4, 'choices for ' + it.prompt + ': ' + opts.join(','));
    assert.equal(opts.filter((o) => isCorrect(o, it.answer)).length, 1, 'choices for ' + it.prompt);
    // A bar drawn with 6 of 8 cells filled next to "how many eighths?" is the
    // answer, not a prompt. Counting items are asked in words only.
    if (!/כמה/.test(it.prompt)) return;
    counting += 1;
    if (it.bar) assert.notEqual(it.bar.filled, Number(it.answer), 'bar reveals: ' + it.prompt);
  }));
  assert.ok(counting >= 2, 'expected a counting item in each form');
});
