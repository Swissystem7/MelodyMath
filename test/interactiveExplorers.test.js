// MelodyMath — Interactive Explorer Exercises tests (Issue #688, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const banks = require('../src/lib/banks.js');
const explorers = require('../src/lib/exercises/interactiveExplorers.js');

test('all explorer exercise kinds exist in banks, tagged to official curriculum standards', () => {
  const all = banks.allItems();
  const singingLineD = all.filter(it => it.kind === 'singing_line' && it.grade === 'ד');
  const singingLineV = all.filter(it => it.kind === 'singing_line' && it.grade === 'ו');
  const groupsMult = all.filter(it => it.kind === 'groups_mult');
  const evenOdd = all.filter(it => it.kind === 'even_odd');

  assert.ok(singingLineD.length >= 2, 'Grade ד singing line exercises must exist in bank');
  assert.ok(singingLineV.length >= 2, 'Grade ו singing line exercises must exist in bank');
  assert.ok(groupsMult.length >= 2, 'groups multiplication exercises must exist in bank');
  assert.ok(evenOdd.length >= 2, 'even/odd exercises must exist in bank');

  singingLineD.forEach(it => {
    assert.equal(it.standard, banks.ST.FRAC_BAR);
    assert.equal(it.grade, 'ד');
    assert.ok(it.prompt.includes('ישר המספרים'));
    assert.equal(it.prompt.includes('%'), false, 'Grade ד prompt must not contain %');
    assert.equal(String(it.answer).includes('%'), false, 'Grade ד answer must not contain %');
    assert.equal(it.hint.includes('%'), false, 'Grade ד hint must not contain %');
  });

  singingLineV.forEach(it => {
    assert.equal(it.standard, banks.ST.PERCENT);
    assert.equal(it.grade, 'ו');
    assert.ok(it.prompt.includes('אחוז') || it.prompt.includes('%'));
    assert.ok(String(it.answer).includes('%'));
  });

  groupsMult.forEach(it => {
    assert.equal(it.standard, banks.ST.MUL_B);
    assert.equal(it.grade, 'ב');
    assert.ok(it.prompt.includes('קבוצות'));
  });

  evenOdd.forEach(it => {
    assert.equal(it.standard, banks.ST.PLACE_VALUE);
    assert.equal(it.grade, 'ב');
    assert.ok(it.prompt.includes('זוגי או אי'));
  });
});

test('percentages belong to grade ו per progression.js (mm-cur-53) and are not allowed in grade ד', () => {
  const exD = explorers.createSingingLineExercise({ grade: 'ד', pct: 50 });
  assert.equal(exD.grade, 'ד');
  assert.equal(exD.skill, 'fractions');
  assert.equal(exD.prompt.includes('%'), false);
  assert.equal(exD.answer, '1/2');
  assert.equal(exD.hint.includes('%'), false);

  const exV = explorers.createSingingLineExercise({ grade: 'ו', pct: 50 });
  assert.equal(exV.grade, 'ו');
  assert.equal(exV.skill, 'percent');
  assert.equal(exV.answer, '50%');
  assert.ok(exV.prompt.includes('אחוז') || exV.prompt.includes('%'));
});

test('every explorer exercise has at most 15 words per card (kid screen requirement)', () => {
  const all = banks.allItems().filter(it => ['singing_line', 'groups_mult', 'even_odd'].includes(it.kind));
  assert.ok(all.length >= 8);

  all.forEach(ex => {
    const res = explorers.validateExerciseCard(ex);
    assert.equal(res.valid, true, `Exercise ${ex.id} failed validation: ${res.reason}`);
    assert.ok(res.wordCount <= 15, `Exercise prompt "${ex.prompt}" has ${res.wordCount} words; must be <= 15`);
  });
});

test('interactiveExplorers module generates compliant exercise models', () => {
  const exLine = explorers.createSingingLineExercise({ pct: 50 });
  assert.equal(exLine.kind, 'singing_line');
  assert.equal(exLine.grade, 'ד');
  assert.equal(exLine.answer, '1/2');
  assert.ok(exLine.wordCount <= 15);
  assert.equal(exLine.hasMusic, true);

  const exMult = explorers.createGroupsMultExercise({ groups: 3, size: 5 });
  assert.equal(exMult.kind, 'groups_mult');
  assert.equal(exMult.answer, 15);
  assert.ok(exMult.wordCount <= 15);

  const exEven = explorers.createEvenOddExercise({ count: 8 });
  assert.equal(exEven.kind, 'even_odd');
  assert.equal(exEven.answer, 'זוגי');
  assert.ok(exEven.wordCount <= 15);

  const exOdd = explorers.createEvenOddExercise({ count: 7 });
  assert.equal(exOdd.answer, 'אי-זוגי');
});

test('validation rejects prompts exceeding 15 words or missing standard', () => {
  const longPrompt = 'זהו תרגיל ארוך במיוחד שנועד לבדוק האם המערכת חוסמת כרטיסים שיש בהם יותר מדי מילים לילד בכיתה א או ב';
  const invalid = explorers.validateExerciseCard({
    prompt: longPrompt,
    standard: banks.ST.NLINE,
    kind: 'singing_line'
  });
  assert.equal(invalid.valid, false);
  assert.match(invalid.reason, /exceeds 15 words/);

  const missingStd = explorers.validateExerciseCard({
    prompt: 'קצר ולעניין',
    kind: 'singing_line'
  });
  assert.equal(missingStd.valid, false);
  assert.match(missingStd.reason, /missing curriculum standard/);
});

test('renderExplorerWidget mounts reachable interactive elements with sound on tap', () => {
  const dummyContainer = {
    children: [],
    innerHTML: '',
    appendChild(c) { this.children.push(c); }
  };
  globalThis.document = {
    createElement(tag) {
      return {
        className: '',
        innerHTML: '',
        children: [],
        querySelectorAll() { return []; }
      };
    }
  };

  try {
    explorers.renderExplorerWidget(dummyContainer, { kind: 'singing_line', grade: 'ד', pct: 50 });
    assert.equal(dummyContainer.children.length, 1);
    assert.match(dummyContainer.children[0].className, /explorer-exercise-widget/);
    assert.match(dummyContainer.children[0].innerHTML, /data-tap="woodBar"/);
    assert.match(dummyContainer.children[0].innerHTML, /data-val="1\/2"/);

    // Grade ו renders percentage buttons
    dummyContainer.children = [];
    explorers.renderExplorerWidget(dummyContainer, { kind: 'singing_line', grade: 'ו', pct: 50 });
    assert.equal(dummyContainer.children.length, 1);
    assert.match(dummyContainer.children[0].innerHTML, /data-val="50%"/);
  } finally {
    delete globalThis.document;
  }
});

test('index.html loads interactiveExplorers.js and renders explorer widgets', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('src/lib/exercises/interactiveExplorers.js'), 'script must be included in index.html');
  assert.ok(indexHtml.includes('MM_INTERACTIVE_EXPLORERS.renderExplorerWidget'), 'widget must be wired into renderWidget');
  assert.ok(indexHtml.includes('id="singingLine"'), 'singingLine slider remains intact');
  assert.ok(indexHtml.includes('id="mgGroupBtns"'), 'mgGroupBtns remains intact');
  assert.ok(indexHtml.includes('id="mgSizeBtns"'), 'mgSizeBtns remains intact');
  assert.ok(indexHtml.includes('id="eoNumBtns"'), 'eoNumBtns remains intact');
});

test('groups multiplication and division wire into variety.js dynamic number generation (Task 23, Refs #665)', () => {
  const mockVariety = {
    generateNumberSet(type, round) {
      if (type === 'multiplication') return { a: 5, b: 4, answer: 20 };
      if (type === 'division') return { a: 18, b: 3, answer: 6 };
      return null;
    }
  };

  const exMult = explorers.createGroupsMultExercise({ variety: mockVariety, roundIndex: 1 });
  assert.equal(exMult.groups, 5);
  assert.equal(exMult.size, 4);
  assert.equal(exMult.answer, 20);
  assert.ok(exMult.wordCount <= 15);

  const exDiv = explorers.createGroupsDivExercise({ variety: mockVariety, roundIndex: 1 });
  assert.equal(exDiv.dividend, 18);
  assert.equal(exDiv.divisor, 3);
  assert.equal(exDiv.answer, 6);
  assert.equal(exDiv.kind, 'groups_div');
  assert.ok(exDiv.wordCount <= 15);
});
