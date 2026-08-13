const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const { eligibleExercises } = require('../src/lib/adaptive');

test('every shipped item is tagged with grade, strand and a specific standard', () => {
  const all = banks.allItems();
  assert.ok(all.length >= 80, 'bank too thin: ' + all.length);
  all.forEach((it) => {
    assert.equal(banks.isShippable(it), true, it.id + ' not shippable');
    assert.ok(banks.GRADES.includes(it.grade), it.id + ' bad grade');
    assert.ok(it.strand && it.strand.length > 2, it.id + ' missing strand');
    assert.ok(it.standard && it.standard.length > 6, it.id + ' missing standard');
    assert.match(it.id, new RegExp('^' + it.grade + '-' + it.skill + '-'));
  });
});

test('banks are split per grade — not one א–ד dump', () => {
  banks.GRADES.forEach((g) => {
    const items = banks.itemsForGrade(g);
    assert.ok(items.length >= 8, 'grade ' + g + ' empty');
    assert.ok(items.every((it) => it.grade === g));
    const skills = banks.skillsForGrade(g);
    assert.ok(skills.length >= 1);
    skills.forEach((sk) => {
      assert.ok(banks.rowsOf(sk, g).length >= 4, g + ' ' + sk);
    });
  });
  assert.deepEqual(banks.skillsForGrade('א'), ['counting', 'addition', 'subtraction', 'number_line']);
  assert.ok(banks.skillsForGrade('ב').includes('division'));
  assert.ok(!banks.skillsForGrade('א').includes('multiplication'));
  assert.ok(!banks.skillsForGrade('ב').includes('basic_fractions'));
  assert.deepEqual(banks.skillsForGrade('ד'), ['basic_fractions']);
});

test('an untagged stub does not ship', () => {
  assert.equal(banks.isShippable({ prompt: '1+1', answer: 2, skill: 'addition' }), false);
  assert.equal(banks.isShippable({
    grade: 'א', skill: 'addition', strand: 'מספרים ופעולות',
    standard: 'פירוקי 10', prompt: '1+1', answer: 2,
  }), true);
});

test('grade-א counting reaches 100, goes backwards, skip-counts, and groups to 10', () => {
  const prompts = banks.rowsOf('counting', 'א').map((x) => x.prompt).join('\n');
  assert.match(prompts, /99, ואז המספר הבא/);
  assert.equal(banks.rowsOf('counting', 'א').find((x) => /99, ואז/.test(x.prompt)).answer, 100);
  assert.match(prompts, /ספירה אחורה/);
  assert.match(prompts, /50, 52, 54/);
  assert.match(prompts, /50, 48, 46/);
  assert.match(prompts, /5, 10, 15/);
  assert.match(prompts, /קבוצות של 10/);
  assert.ok(banks.rowsOf('counting', 'א').some((x) => x.standard.indexOf('דילוגים של 2') !== -1));
});

test('addition and subtraction include decompositions, left-hand =, extra addends, and whole tens', () => {
  const add = banks.rowsOf('addition');
  const sub = banks.rowsOf('subtraction');
  assert.ok(add.some((x) => x.prompt === '6 + 4 = ?' && x.answer === 10 && x.standard.indexOf('פירוק') !== -1));
  assert.ok(add.some((x) => /10 = 6 \+ ☐/.test(x.prompt) && x.answer === 4));
  assert.ok(add.some((x) => /2 \+ 3 \+ 4/.test(x.prompt) && x.answer === 9));
  assert.ok(add.some((x) => x.prompt === '20 + 60 = ?' && x.answer === 80));
  assert.ok(sub.some((x) => /4 = 6 − ☐/.test(x.prompt) && x.answer === 2));
  assert.ok(sub.some((x) => /80 − 20/.test(x.prompt) && x.answer === 60));
});

test('grade-ב multiplication is only 2/4/5/10; 3/6/7/8/9 live in grade ג', () => {
  banks.rowsOf('multiplication', 'ב').forEach((it) => {
    assert.ok([2, 4, 5, 10].includes(it.table), it.prompt);
  });
  const g3 = banks.rowsOf('multiplication', 'ג');
  assert.ok(g3.some((x) => x.prompt === '7 × 8 = ?' && x.answer === 56 && x.table === 7));
  assert.ok(g3.every((x) => [3, 6, 7, 8, 9].includes(x.table)));
});

test('division ships partitive and quotative items on the same numbers', () => {
  const div = banks.rowsOf('division', 'ב');
  assert.ok(div.some((x) => x.meaning === 'partitive'));
  assert.ok(div.some((x) => x.meaning === 'quotative'));
  assert.ok(div.some((x) => /ל־2 ילדים/.test(x.prompt)));
  assert.ok(div.some((x) => /בכל צלחת|בכל תיבה|בכל קבוצה|בכל שורה/.test(x.prompt)));
  assert.ok(div.every((x) => [2, 4, 5, 10].includes(x.table)));
});

test('fractions are 1/2 1/4 1/8 against a 4/4 bar — not “half of 8 = 4”', () => {
  const rows = banks.rowsOf('basic_fractions');
  assert.ok(rows.length >= 12);
  rows.forEach((it) => {
    assert.equal(it.grade, 'ד');
    assert.equal(it.strand, 'שברים');
    assert.match(it.standard, /4\/4/);
    assert.doesNotMatch(it.prompt, /חצי מתוך \d+/);
    assert.doesNotMatch(it.prompt, /רבע מתוך \d+/);
  });
  assert.ok(rows.some((x) => x.answer === '1/2'));
  assert.ok(rows.some((x) => x.answer === '1/4'));
  assert.ok(rows.some((x) => x.answer === '1/8'));
  assert.ok(rows.every((x) => x.widget === 'bar44'));
});

test('number-line items exist and carry a line widget', () => {
  const rows = banks.rowsOf('number_line', 'א');
  assert.ok(rows.length >= 12);
  rows.forEach((it) => {
    assert.equal(it.widget, 'numberLine');
    assert.ok(it.line && it.line.max > it.line.min);
  });
  assert.ok(rows.some((x) => x.line && x.line.max === 100));
});

test('each grade-skill still has items at levels 1, 2 and 3', () => {
  const cov = banks.coverageByGrade();
  banks.GRADES.forEach((g) => {
    Object.keys(cov[g]).forEach((skill) => {
      const row = cov[g][skill];
      assert.ok(row.total >= 8, g + ' ' + skill + ' too thin');
      assert.ok(row.byLevel[1] >= 2, g + ' ' + skill + ' L1');
      assert.ok(row.byLevel[2] >= 2, g + ' ' + skill + ' L2');
      assert.ok(row.byLevel[3] >= 2, g + ' ' + skill + ' L3');
    });
  });
});

test('rows still carry id and level so adaptive selection can run', () => {
  const add = banks.rowsOf('addition', 'א');
  add.forEach((it) => {
    assert.match(it.id, /^א-addition-\d+$/);
    assert.ok(it.level >= 1 && it.level <= 3);
    assert.equal(it.he, 'חיבור');
  });
  const L2 = banks.itemsAtLevel('addition', 2, 'א');
  assert.ok(L2.length >= 2);
  assert.ok(L2.every((x) => x.level === 2));
});

test('eligibleExercises can pace a curriculum skill by level', () => {
  const bank = banks.rowsOf('addition', 'א');
  const pool = eligibleExercises(bank, [], null, 1);
  assert.ok(pool.length);
  assert.ok(pool.every((x) => x.level === 1));
  const afterTwoRight = eligibleExercises(
    bank,
    [{ id: pool[0].id, correct: true }, { id: pool[0].id, correct: true }],
    pool[0].id,
    1
  );
  assert.ok(afterTwoRight.every((x) => x.level === 2));
});

test('grade-א diagnostic keeps the five-drum hear cue', () => {
  const d = banks.diagnosticItems('א');
  assert.ok(d.length >= 8);
  assert.equal(d[0].skill, 'counting');
  assert.equal(d[0].prompt.indexOf('🥁🥁🥁🥁🥁') !== -1, true);
  assert.deepEqual(d[0].hear, [5]);
  const plus = banks.rowsOf('addition', 'א').find((x) => x.prompt.indexOf('3 פעימות') !== -1);
  assert.deepEqual(plus.hear, [3, 2]);
});
