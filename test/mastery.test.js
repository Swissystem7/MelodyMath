const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');
const mastery = require('../src/lib/mastery');

const catalog = banks.rowsOf('multiplication').concat(banks.rowsOf('division'));

function hitsFor(tables, n) {
  const hist = [];
  tables.forEach((t) => {
    const items = catalog.filter((it) => it.table === t && it.skill === 'multiplication').slice(0, n);
    items.forEach((it) => hist.push({ id: it.id, correct: true }));
  });
  return hist;
}

test('3/6/7/8/9 stay closed until each of 2/4/5/10 has two distinct hits', () => {
  const mixed = catalog;
  const closed = mastery.gateItems(mixed, [], mixed);
  assert.ok(closed.every((it) => !mastery.isBlockedItem(it)));
  assert.ok(closed.some((it) => it.table === 2));
  assert.ok(!closed.some((it) => it.prompt === '7 × 8 = ?'));

  const partial = hitsFor([2, 4, 5], 2);
  assert.equal(mastery.coreTablesMastered(partial, mixed), false);
  assert.deepEqual(mastery.missingCoreTables(partial, mixed), [10]);
  assert.ok(!mastery.gateItems(mixed, partial, mixed).some((it) => it.table === 7));

  const open = hitsFor([2, 4, 5, 10], 2);
  assert.equal(mastery.coreTablesMastered(open, mixed), true);
  const unlocked = mastery.gateItems(mixed, open, mixed);
  assert.ok(unlocked.some((it) => it.prompt === '7 × 8 = ?'));
});

test('a blocked item is identified by its table, not by the prompt wording', () => {
  const seven = catalog.find((x) => x.prompt === '7 × 8 = ?');
  assert.equal(mastery.itemTable(seven), 7);
  assert.equal(mastery.isBlockedItem(seven), true);
  const two = catalog.find((x) => x.prompt === '5 × 2 = ?');
  assert.equal(mastery.isCoreTable(two.table), true);
  assert.equal(mastery.isBlockedItem(two), false);
});

test('grade-ג practice can borrow core 2/4/5/10 facts to unlock the gate', () => {
  const g3 = banks.rowsOf('multiplication', 'ג');
  const core = banks.coreFactItems();
  const merged = mastery.withCoreIfNeeded(g3, core);
  assert.ok(merged.length > g3.length);
  assert.ok(merged.some((it) => it.table === 2 && it.grade === 'ב'));
  assert.ok(merged.some((it) => it.table === 7 && it.grade === 'ג'));
});
