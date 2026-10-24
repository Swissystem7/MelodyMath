// Every plain arithmetic prompt in the bank ("<expression> = ?" and nothing
// else) is recomputed here and compared with its stored answer, for every
// grade. A bank item whose answer disagrees with its own prompt is the one
// mistake no music, hint or widget can hide from a child. Prompts that go on
// to ask something else ("= ? כמה רבעים ...") are a different question and
// are left out on purpose. Split out of #579 (#585) so it stands on its own.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');

// 3 ו־1/2 -> (3+(1/2)); 2/5 -> (2/5); 1,000 -> 1000; × : − -> * / -
const frac = (s) => s.replace(/(\d+)\/(\d+)/g, '($1/$2)').replace(/(\d+) ו־\(/g, '($1+(').replace(/\+\((\d+\/\d+)\)/g, '+($1))');
const calc = (s) => Function('return (' + frac(s).replace(/,/g, '').replace(/×/g, '*').replace(/:/g, '/').replace(/−/g, '-') + ')')();
const value = (a) => (typeof a === 'number' ? a : calc(String(a)));
const PLAIN = /^([\d,.()+−×:/ ו־]+) = \?\s*$/;

function plainItems(grade) {
  return banks.itemsForGrade(grade)
    .map((it) => ({ it, m: PLAIN.exec(it.prompt) }))
    .filter((x) => x.m)
    .map((x) => ({ it: x.it, expr: x.m[1] }));
}

test('every plain arithmetic prompt agrees with its stored answer, in every grade', () => {
  let checked = 0;
  for (const grade of banks.GRADES) {
    const mine = plainItems(grade);
    assert.ok(mine.length >= 10, 'grade ' + grade + ' has only ' + mine.length + ' plain arithmetic items');
    for (const { it, expr } of mine) {
      let got;
      assert.doesNotThrow(() => { got = calc(expr); }, it.id + ': cannot evaluate ' + expr);
      assert.ok(Number.isFinite(got), it.id + ': ' + expr + ' is not a number');
      assert.ok(Math.abs(got - value(it.answer)) < 1e-9, it.id + ': ' + it.prompt + ' => ' + it.answer + ' (computed ' + got + ')');
      checked += 1;
    }
  }
  // 169 on master at 23.10.2026; the floor only guards against the regex
  // silently matching nothing after a prompt-format change.
  assert.ok(checked >= 150, 'only ' + checked + ' prompts checked');
});

test('the expression parser reads the bank\'s own notation', () => {
  assert.equal(calc('1,000 + 250'), 1250);
  assert.equal(calc('12 × 3'), 36);
  assert.equal(calc('4,312 : 7'), 616);
  assert.equal(calc('9 − 4'), 5);
  assert.equal(calc('3/4 + 1/4'), 1);
  assert.equal(calc('2 ו־1/2 × 2'), 5);
  assert.equal(calc('(2 + 3) × 4'), 20);
  // A number stored as a string is evaluated the same way.
  assert.equal(value('1/2'), 0.5);
  assert.equal(value(7), 7);
  // A prompt that asks a second question is not a plain arithmetic prompt.
  assert.equal(PLAIN.test('1/2 + 1/4 = ? כמה רבעים מלאים בתיבה?'), false);
  assert.equal(PLAIN.test('5 + 4 = ?'), true);
});
