// A prompt belongs to one grade. A child who moves up a grade must not meet
// the same question again, unless a decision keeps it (#1096).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const banks = require('../src/lib/banks');

const all = banks.allItems();
const byPrompt = new Map();
for (const it of all) byPrompt.set(it.prompt, (byPrompt.get(it.prompt) || []).concat(it));
const repeats = [...byPrompt.values()].filter((its) => its.length > 1);

const dir = path.join(__dirname, '../src/lib/music');
const mods = fs.readdirSync(dir).filter((f) => f.endsWith('.js')).map((f) => {
  try { return require(path.join(dir, f)); } catch { return null; }
}).filter((m) => m && typeof m.specForItem === 'function');
const sounds = (it) => mods.some((m) => { try { return !!m.specForItem(it); } catch { return false; } });

test('a prompt repeats only where a decision keeps it', () => {
  // #751 keeps the twelve grade ב׳ cube counts in grade ד׳ too (test/musicWays.test.js).
  const cubes = (its) => its.length === 2
    && its.every((it) => it.standard === banks.ST.MASS_VOL && /תיבה|קובי/.test(it.prompt))
    && its.map((it) => it.grade).sort().join('') === 'בד';
  // One wording over another clock face: the question is in the picture.
  const faces = (its) => its.every((it) => it.widget === 'clock')
    && new Set(its.map((it) => JSON.stringify(it.clock))).size === its.length;
  const left = repeats.filter((its) => !cubes(its) && !faces(its));
  assert.deepEqual(left.map((its) => its.map((it) => it.id).join(' = ')), []);
  assert.equal(repeats.filter(cubes).length, 12);
});

test('23.11.2026: the five replaced items keep their ids, are worked out here, and sound', () => {
  const by = (id) => { const it = all.find((x) => x.id === id); assert.ok(it, id); return it; };
  const corner = by('א-geometry-306');
  assert.match(corner.prompt, /^פינת שולחן ריבועי/);
  assert.equal(corner.answer, 'כן', 'the corner of a square is a right angle');
  const sixty = by('א-geometry-307');
  assert.match(sixty.prompt, /60 מעלות/);
  assert.equal(sixty.answer, 'לא', 'only 90 degrees is a right angle');
  // grade ה׳: denominators that need a common one
  const add = by('ה-fractions-437');
  assert.equal(add.prompt, '1/2 + 1/5 = ?');
  assert.equal(add.answer, (1 * 5 + 1 * 2) + '/' + (2 * 5));
  const sub = by('ה-fractions-439');
  assert.equal(sub.prompt, '3/4 − 1/3 = ?');
  assert.equal(sub.answer, (3 * 3 - 1 * 4) + '/' + (4 * 3));
  const isPrime = (n) => n > 1 && Array.from({ length: n - 2 }, (_, i) => i + 2).every((d) => n % d);
  const prime = by('ו-division-1077');
  assert.match(prime.prompt, /שקטן מ־20\?$/);
  assert.equal(prime.answer, Array.from({ length: 20 }, (_, i) => i).filter(isPrime).pop());
  [corner, sixty, add, sub, prime].forEach((it) => {
    assert.ok(sounds(it), 'silent: ' + it.prompt);
    assert.ok(it.hint && !String(it.hint).includes(String(it.answer)), 'the hint gives the answer away: ' + it.prompt);
  });
  // the questions they replaced still live in the grade they belong to
  assert.equal(byPrompt.get('1/2 + 1/4 = ?').map((it) => it.grade).join(''), 'ד');
  assert.equal(byPrompt.get('מהו המספר הראשוני הזוגי היחיד?').map((it) => it.grade).join(''), 'ה');
  assert.equal(byPrompt.get('זווית ישרה שווה לכמה מעלות?').map((it) => it.grade).join(''), 'ב');
});
