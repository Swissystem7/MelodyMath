'use strict';
// #591: two ways of one standard must not reuse a musical mechanism. The
// mechanism is the way's tag. The Hebrew explanation must not be a near copy
// of its sibling: the same letters once digits and punctuation are removed,
// a shared run of 40 letters, or character-trigram Dice at or above NEAR.
// A level that has items must also receive its own way. Grades א׳ and ו׳ only;
// grade ד׳ is a different round.
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');

const FILES = {
  'א': require('../src/lib/curriculum/grade1'),
  'ו': require('../src/lib/curriculum/grade6'),
};

const NEAR = 0.72;

function canon(note) {
  return String(note).replace(/[0-9]/g, '').replace(/[^\u0590-\u05FFa-zA-Z]/g, '');
}

function trigrams(text) {
  const grams = [];
  for (let i = 0; i < text.length - 2; i++) grams.push(text.slice(i, i + 3));
  return grams;
}

function dice(a, b) {
  const left = trigrams(a);
  const right = trigrams(b);
  if (!left.length || !right.length) return 0;
  const counts = new Map();
  left.forEach((gram) => counts.set(gram, (counts.get(gram) || 0) + 1));
  let shared = 0;
  right.forEach((gram) => {
    const n = counts.get(gram) || 0;
    if (n) {
      shared += 1;
      counts.set(gram, n - 1);
    }
  });
  return (2 * shared) / (left.length + right.length);
}

function sharedRun(a, b) {
  let best = 0;
  const row = new Array(b.length + 1).fill(0);
  for (let i = 1; i <= a.length; i++) {
    let prev = 0;
    for (let j = 1; j <= b.length; j++) {
      const saved = row[j];
      row[j] = a[i - 1] === b[j - 1] ? prev + 1 : 0;
      if (row[j] > best) best = row[j];
      prev = saved;
    }
  }
  return best;
}

function nearCopy(a, b) {
  const left = canon(a);
  const right = canon(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (dice(left, right) >= NEAR) return true;
  if (sharedRun(left, right) >= 40) return true;
  return false;
}

test('near-copy detection flags a reused sentence and lets a different method pass', () => {
  const kept = 'נגנו תיבה שלמה וספרו את הפעימות שנשמעו עד הסוף.';
  const copied = 'נגנו תיבה שלמה וספרו את הפעימות שנשארו עד הסוף.';
  const other = 'כל חצי תו נמשך שתי פעימות, וסופרים את החצאים קדימה.';
  assert.equal(nearCopy(kept, kept), true);
  assert.equal(nearCopy(kept, copied), true);
  assert.equal(nearCopy(kept, other), false);
});

Object.keys(FILES).forEach((grade) => {
  const file = FILES[grade];

  test('grade ' + grade + ': ways of one standard do not share a mechanism tag or a near-copy explanation', () => {
    Object.keys(file.music).forEach((key) => {
      const ways = file.music[key];
      for (let i = 0; i < ways.length; i++) {
        for (let j = i + 1; j < ways.length; j++) {
          assert.notEqual(ways[i][0], ways[j][0], key + ' reuses ' + ways[i][0]);
          assert.equal(
            nearCopy(ways[i][1], ways[j][1]),
            false,
            key + ' ' + ways[i][0] + ' ~ ' + ways[j][0]
          );
        }
      }
    });
  });

  test('grade ' + grade + ': two levels of one standard do not receive the same way', () => {
    const levelsByStd = {};
    banks.itemsForGrade(grade).forEach((item) => {
      if (!item.musicNote) return;
      const levels = levelsByStd[item.standard] || (levelsByStd[item.standard] = new Set());
      levels.add(item.level);
    });
    Object.keys(file.music).forEach((key) => {
      const levels = levelsByStd[banks.ST[key]];
      if (!levels) return;
      const ways = banks.primaryWays(file.music[key]);
      const seen = new Map();
      levels.forEach((level) => {
        // Past the last primary way the level keeps it (dosage rule 4).
        if (level > ways.length) return;
        const way = ways[Math.min(level, ways.length) - 1];
        const previous = seen.get(way[0]);
        assert.equal(
          previous,
          undefined,
          key + ' level ' + level + ' reuses ' + way[0] + ' from level ' + previous
        );
        seen.set(way[0], level);
      });
    });
  });
});
