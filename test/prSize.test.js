const test = require('node:test');
const assert = require('node:assert/strict');
const prSize = require('../tools/pr-size');

test('parseShortstat reads files, insertions and deletions, and sums the changed lines', () => {
  const full = prSize.parseShortstat(' 17 files changed, 575 insertions(+), 15 deletions(-)');
  assert.deepEqual(full, { files: 17, insertions: 575, deletions: 15, changed: 590 });

  const insertionsOnly = prSize.parseShortstat(' 2 files changed, 39 insertions(+)');
  assert.deepEqual(insertionsOnly, { files: 2, insertions: 39, deletions: 0, changed: 39 });

  const deletionsOnly = prSize.parseShortstat(' 1 file changed, 4 deletions(-)');
  assert.deepEqual(deletionsOnly, { files: 1, insertions: 0, deletions: 4, changed: 4 });

  const singular = prSize.parseShortstat(' 1 file changed, 1 insertion(+), 1 deletion(-)');
  assert.deepEqual(singular, { files: 1, insertions: 1, deletions: 1, changed: 2 });
});

test('parseShortstat treats no difference as zero, not as an error', () => {
  for (const empty of ['', '\n', undefined, null]) {
    assert.deepEqual(prSize.parseShortstat(empty), {
      files: 0,
      insertions: 0,
      deletions: 0,
      changed: 0,
    });
  }
});

test('verdict separates a real split from a merge-base that fell behind', () => {
  // PR #305: GitHub shows 590 because slice 8 landed as a squash, but only 331 lines
  // are missing from main. Merging main into the branch is the whole fix.
  const stale = prSize.verdict(590, 331);
  assert.equal(stale.kind, 'stale-base');
  assert.equal(stale.ok, false);
  assert.match(stale.message, /590/);
  assert.match(stale.message, /331/);

  // Over the ceiling against the target itself — here splitting is the only way.
  const big = prSize.verdict(1163, 904);
  assert.equal(big.kind, 'split');
  assert.equal(big.ok, false);
  assert.match(big.message, /904/);

  const fits = prSize.verdict(292, 292);
  assert.equal(fits.kind, 'ok');
  assert.equal(fits.ok, true);
});

test('verdict separates a branch cut from the wrong integration branch from a real split', () => {
  // PR #342: נחתך מעל master אבל פתוח מול main, ולכן גורר את כל הפער ביניהם.
  // הקומיט שלו עצמו 50 שורות, והוא נספר כ-1573 מול main וכ-6717 מנקודת הפיצול.
  const forked = prSize.verdict(6717, 1573, 400, 50);
  assert.equal(forked.kind, 'wrong-base');
  assert.equal(forked.ok, false);
  assert.match(forked.message, /50/);
  assert.match(forked.message, /1523/);

  // כשגם הענף עצמו מעל התקרה, בסיס החיתוך לא מציל אותו — זה פיצול אמיתי.
  const stillBig = prSize.verdict(6717, 1573, 400, 904);
  assert.equal(stillBig.kind, 'split');

  // בלי בסיס חיתוך ההתנהגות לא משתנה בכלל.
  assert.equal(prSize.verdict(6717, 1573).kind, 'split');
  assert.equal(prSize.verdict(590, 331, 400, 331).kind, 'stale-base');
  assert.equal(prSize.verdict(292, 292, 400, 292).kind, 'ok');
});

test('verdict puts exactly 400 lines inside the ceiling and honours a custom limit', () => {
  assert.equal(prSize.verdict(400, 400).kind, 'ok');
  assert.equal(prSize.verdict(401, 401).kind, 'split');
  assert.equal(prSize.LIMIT, 400);

  assert.equal(prSize.verdict(250, 250, 200).kind, 'split');
  assert.equal(prSize.verdict(250, 150, 200).kind, 'stale-base');
  assert.equal(prSize.verdict(150, 150, 200).kind, 'ok');
});

test('report names both counts so the stale-base case is readable at a glance', () => {
  const text = prSize.report({
    branch: 'origin/factory/laptop-claude-263-sync-9',
    base: 'origin/main',
    displayed: prSize.parseShortstat(' 17 files changed, 575 insertions(+), 15 deletions(-)'),
    real: prSize.parseShortstat(' 8 files changed, 329 insertions(+), 2 deletions(-)'),
    verdict: prSize.verdict(590, 331),
  });
  assert.match(text, /origin\/main\.\.\.origin\/factory\/laptop-claude-263-sync-9/);
  assert.match(text, /590 שורות ב-17 קבצים/);
  assert.match(text, /331 שורות ב-8 קבצים/);
  assert.match(text, /נקודת הפיצול מיושנת/);
  assert.doesNotMatch(text, /של הענף/, 'בלי בסיס חיתוך אין שורה שלישית');
});

test('report adds the branch-only count only when a fork base was given', () => {
  const text = prSize.report({
    branch: 'origin/factory/laptop-agy-unitcheck-cancel-a11y',
    base: 'origin/main',
    forkBase: 'origin/master',
    displayed: prSize.parseShortstat(' 79 files changed, 6455 insertions(+), 326 deletions(-)'),
    real: prSize.parseShortstat(' 26 files changed, 1441 insertions(+), 132 deletions(-)'),
    own: prSize.parseShortstat(' 2 files changed, 47 insertions(+), 3 deletions(-)'),
    verdict: prSize.verdict(6781, 1573, 400, 50),
  });
  assert.match(text, /של הענף \(origin\/master\.\.\.origin\/factory\/laptop-agy-unitcheck-cancel-a11y\): 50 שורות ב-2 קבצים/);
  assert.match(text, /הבסיס הלא נכון/);
});
