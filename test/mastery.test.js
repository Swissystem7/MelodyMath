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

// ---------------------------------------------------------------------------
// M1 — Bayesian Knowledge Tracing.
//
// Every number below was computed from the recurrence, not copied from the
// escalation backlog. Where the backlog disagrees the arithmetic is spelled
// out in the test so the next reader can check it without running anything.
// ---------------------------------------------------------------------------

const D = mastery.BKT_DEFAULTS;

test('BKT: one correct answer from pInit 0.2 gives P(known) = 0.5526, not the backlog 0.5407', () => {
  // evidence stage: 0.2*0.9 / (0.2*0.9 + 0.8*0.25) = 0.18/0.38 = 9/19
  const evidence = mastery.bktPosterior(D.pInit, true);
  assert.equal(Math.abs(evidence - 9 / 19) < 1e-12, true);
  assert.equal(evidence.toFixed(4), '0.4737');

  // learning stage: 9/19 + (10/19)*0.15 = 10.5/19 = 21/38
  const p = mastery.bktUpdate(D.pInit, true);
  assert.equal(Math.abs(p - 21 / 38) < 1e-12, true);
  assert.equal(p.toFixed(4), '0.5526');

  // The 2026-09-07 backlog pinned 0.5407 for this exact case. It is wrong:
  // 21/38 = 0.552631578..., off by 0.0119. Recorded here on purpose so nobody
  // "fixes" the implementation back towards the hand-written number.
  assert.equal(Math.abs(p - 0.5407) > 0.01, true);
  assert.equal(mastery.masteryFromHistory([true]).toFixed(4), '0.5526');
});

test('BKT: a wrong answer pushes P(known) down, and the two stages compose', () => {
  // evidence: 0.2*0.1 / (0.2*0.1 + 0.8*0.75) = 0.02/0.62 = 1/31
  const evidence = mastery.bktPosterior(D.pInit, false);
  assert.equal(Math.abs(evidence - 1 / 31) < 1e-12, true);
  // learning: 1/31 + (30/31)*0.15 = 5.5/31 = 11/62
  const p = mastery.bktUpdate(D.pInit, false);
  assert.equal(Math.abs(p - 11 / 62) < 1e-12, true);
  assert.equal(p.toFixed(6), '0.177419');
  assert.equal(mastery.masteryFromHistory([false]).toFixed(6), '0.177419');
});

test('BKT: more correct answers never lower P(known)', () => {
  let p = D.pInit;
  for (let i = 0; i < 25; i++) {
    const next = mastery.bktUpdate(p, true);
    assert.equal(next >= p, true);
    p = next;
  }
  // and folding a growing prefix of a correct history is monotone too
  const hist = [];
  let prev = mastery.masteryFromHistory(hist);
  for (let i = 0; i < 12; i++) {
    hist.push(true);
    const now = mastery.masteryFromHistory(hist);
    assert.equal(now >= prev, true);
    prev = now;
  }
});

test('BKT: ten consecutive correct answers exceed 0.95', () => {
  const ten = mastery.masteryFromHistory(Array(10).fill(true));
  assert.equal(ten > 0.95, true);
  assert.equal(ten.toFixed(4), '1.0000');
  // it is already past 0.95 on the third answer
  assert.equal(mastery.masteryFromHistory([true, true, true]) > 0.95, true);
  assert.equal(mastery.masteryFromHistory([true, true]) < 0.95, true);
});

test('BKT: ten wrong answers settle at 0.1731 — below 0.1 is unreachable with pLearn 0.15', () => {
  const ten = mastery.masteryFromHistory(Array(10).fill(false));
  assert.equal(ten.toFixed(4), '0.1731');

  // The backlog asked for "< 0.1". That cannot happen: the evidence stage is a
  // probability, so it is >= 0, and the learning stage then returns
  //   P_next = post + (1 - post) * pLearn  >=  0 + 1 * 0.15  =  pLearn.
  // pLearn = 0.15 is therefore a hard floor, and the wrong-answer fixed point
  // is 9/52 = 0.17307692...  Pinning "< 0.1" would pin an impossible claim.
  assert.equal(ten >= D.pLearn, true);
  assert.equal(Math.abs(ten - 9 / 52) < 1e-6, true);
  for (let n = 1; n <= 40; n++) {
    assert.equal(mastery.masteryFromHistory(Array(n).fill(false)) >= D.pLearn, true);
  }
  // The floor is pLearn, so it IS reachable below 0.1 with a smaller pLearn.
  const gentle = { pLearn: 0.02 };
  assert.equal(mastery.masteryFromHistory(Array(10).fill(false), gentle) < 0.1, true);
});

test('BKT: state may be a number, an object or absent, and params are clamped', () => {
  const fromNumber = mastery.bktUpdate(0.2, true);
  assert.equal(mastery.bktUpdate({ pKnown: 0.2 }, true), fromNumber);
  assert.equal(mastery.bktUpdate({ p: 0.2 }, true), fromNumber);
  assert.equal(mastery.bktUpdate(null, true), fromNumber);
  assert.equal(mastery.bktUpdate(undefined, true), fromNumber);
  // out-of-range and non-numeric params fall back / clamp instead of producing NaN
  assert.equal(Number.isFinite(mastery.bktUpdate(0.2, true, { pSlip: -3, pGuess: 9 })), true);
  assert.equal(Number.isFinite(mastery.bktUpdate('nonsense', true)), true);
  assert.equal(mastery.bktParams({}).pInit, D.pInit);
  assert.equal(mastery.bktParams({ pSlip: 2 }).pSlip, 1);
  assert.equal(mastery.bktParams({ pGuess: 'x' }).pGuess, D.pGuess);
});

test('BKT: masteryFromHistory folds booleans and {correct} records identically', () => {
  const flags = [true, false, true, true, false];
  const records = flags.map((c, i) => ({ id: i, correct: c }));
  assert.equal(mastery.masteryFromHistory(records), mastery.masteryFromHistory(flags));
  assert.equal(mastery.masteryFromHistory([]), D.pInit);
  assert.equal(mastery.masteryFromHistory(null), D.pInit);
  // folding is the same as stepping one at a time
  let step = D.pInit;
  flags.forEach((c) => { step = mastery.bktUpdate(step, c); });
  assert.equal(step, mastery.masteryFromHistory(flags));
});

test('BKT: the difficulty bands are < 0.4 easier, 0.4..0.85 same, > 0.85 harder', () => {
  assert.equal(mastery.masteryBand(0.39), 'easier');
  assert.equal(mastery.masteryBand(0.4), 'same');
  assert.equal(mastery.masteryBand(0.85), 'same');
  assert.equal(mastery.masteryBand(0.851), 'harder');
  assert.equal(mastery.masteryBand(NaN), 'same');
  // the bands a real run walks through
  assert.equal(mastery.masteryBand(mastery.masteryFromHistory([])), 'easier');
  assert.equal(mastery.masteryBand(mastery.masteryFromHistory([true])), 'same');
  assert.equal(mastery.masteryBand(mastery.masteryFromHistory([true, true])), 'same');
  assert.equal(mastery.masteryBand(mastery.masteryFromHistory([true, true, true])), 'harder');
  assert.equal(mastery.masteryBand(mastery.masteryFromHistory([false, false])), 'easier');
});

test('a P(known) that came back from storage as text is read, not silently replaced by pInit', () => {
  const m = require('../src/lib/mastery.js');
  assert.equal(m.bktUpdate('0.9', true), m.bktUpdate(0.9, true));
  assert.equal(m.bktUpdate({ pKnown: '0.9' }, false), m.bktUpdate(0.9, false));
  assert.notEqual(m.bktUpdate('0.9', true), m.bktUpdate(null, true), 'the text value must not collapse to pInit');
  // rubbish text still falls back to pInit, and an empty string is "no observations yet"
  assert.equal(m.bktUpdate('nonsense', true), m.bktUpdate(null, true));
  assert.equal(m.bktUpdate('   ', true), m.bktUpdate(null, true));
});
