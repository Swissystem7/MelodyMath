// MM-7xx stream D: what the class board shows (boardModel.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const M = require('../src/lib/classBoard/boardModel');

const it = (skill, prompt, correct, at) => ({ skill, prompt, answer: '1', given: correct ? '1' : '2', correct, at });

function roster() {
  return {
    classCode: 'ג2',
    students: {
      'נועה': {
        name: 'נועה', grade: 'ב',
        sessions: [{ id: 's1', kind: 'diag', started: 100, items: [
          it('חיבור', '1+1', true, 101), it('חיבור', '2+2', true, 102), it('חיבור', '3+3', true, 103),
          it('חיסור', '5-2', false, 104), it('חיסור', '6-1', false, 105), it('חיסור', '7-2', true, 106),
        ] }],
        assignments: [{ id: 't1', title: 'חיסור', completed: true, completedAt: 200 }, { id: 't2', title: 'עוד', completed: false }],
        sync: { exportedAt: 1000, importedAt: 1100, via: 'code' },
      },
      'דן': {
        name: 'דן',
        sessions: [{ id: 's2', kind: 'practice', started: 300, items: [it('כפל', '3×4', false, 301), it('כפל', '3×4', false, 302), it('כפל', '2×2', true, 303), it('כפל', '2×3', true, 304), it('כפל', '2×5', true, 305)] }],
      },
      'גל': { name: 'גל', sessions: [] },
      'רון': { name: 'רון', sessions: [{ id: 's3', kind: 'diag', started: 400, items: [it('שברים', '½+½', false, 401), it('שברים', '¼+¼', false, 402)] }] },
    },
  };
}

test('per student: tries, accuracy, gaps by the stated rule, tasks and last sync', () => {
  const rows = M.studentRows(roster());
  assert.deepEqual(rows.map((r) => r.name), ['גל', 'דן', 'נועה', 'רון']);
  const noa = rows[2];
  assert.deepEqual(rows[3].gaps.map((g) => g.topic), ['שברים'], 'both diagnostic answers in a topic missed');
  assert.equal(M.gapReason(rows[3].gaps[0]), '0 נכונות מתוך 2');
  assert.equal(noa.tries, 6);
  assert.equal(noa.right, 4);
  assert.equal(noa.grade, 'ב');
  assert.deepEqual(noa.gaps.map((g) => g.topic), ['חיסור'], '1 of 3 right is under 60%');
  assert.equal(M.gapReason(noa.gaps[0]), '1 נכונות מתוך 3');
  assert.equal(noa.tasksDone, 1);
  assert.equal(noa.tasks.length, 2);
  assert.equal(noa.syncedAt, 1000);
  const dan = rows[1];
  assert.deepEqual(dan.gaps.map((g) => g.topic), ['כפל'], 'the same question missed twice is a gap even at 60%');
  assert.equal(M.gapReason(dan.gaps[0]), 'אותה שאלה פוספסה פעמיים');
  assert.equal(rows[0].tries, 0);
  assert.match(M.GAP_RULE, /3 פעמים/);
  assert.match(M.GAP_RULE, /60%/);
});

test('per topic: who practised, class accuracy, and who has a gap, worst first', () => {
  const topics = M.topicRows(M.studentRows(roster()));
  assert.equal(topics[0].gapNames.length, 1);
  assert.equal(topics[0].topic, 'שברים', 'worst topic first');
  const sub = topics.find((t) => t.topic === 'חיסור');
  assert.deepEqual(sub.gapNames, ['נועה']);
  assert.equal(sub.students, 1);
  const add = topics.find((t) => t.topic === 'חיבור');
  assert.equal(add.accuracy, 1);
  assert.deepEqual(add.gapNames, []);
  assert.equal(topics[topics.length - 1].topic, 'חיבור');
});

test('last-sync text: code time, this device, or not yet; stale after a week', () => {
  const now = new Date(2026, 10, 3, 12, 0).getTime();
  const today = new Date(2026, 10, 3, 9, 5).getTime();
  assert.equal(M.whenText(today, now), 'היום 09:05');
  assert.equal(M.whenText(today - 24 * 3600e3, now), 'אתמול 09:05');
  assert.equal(M.whenText(today - 3 * 24 * 3600e3, now), 'לפני 3 ימים');
  assert.equal(M.whenText(new Date(2026, 8, 1).getTime(), now), '1.9.2026');
  assert.equal(M.syncText({ syncedAt: today }, now), 'היום 09:05');
  assert.equal(M.syncText({ syncedAt: null, lastPracticeAt: today }, now), 'תרגל/ה במכשיר הזה');
  assert.equal(M.syncText({}, now), 'עוד לא התקבל קוד');
  assert.equal(M.syncStale({ syncedAt: today }, now), false);
  assert.equal(M.syncStale({ syncedAt: now - 8 * 24 * 3600e3 }, now), true);
  assert.equal(M.syncStale({}, now), true);
});

test('broken rows never throw', () => {
  const rows = M.studentRows({ students: { 'א': { sessions: [null, { items: [null, 'x', { skill: 'a', correct: true }] }], assignments: [null, { id: 1 }] } } });
  assert.equal(rows[0].tries, 1);
  assert.equal(rows[0].tasks.length, 0);
  assert.deepEqual(M.studentRows(null), []);
});

test('class list comes from the roster keys on this device', () => {
  const keys = ['mm-roster-v1:ג2', 'mm-who-v1', 'mm-roster-v1:א1', 'other'];
  const ls = { length: keys.length, key: (i) => keys[i] };
  assert.deepEqual(M.listClasses(ls), ['א1', 'ג2']);
  assert.deepEqual(M.listClasses(null), []);
});

test('class.html is Hebrew RTL, loads no outside script, and uses the identity contract', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'class.html'), 'utf8');
  assert.match(html, /<html lang="he" dir="rtl">/);
  assert.match(html, /name="viewport"/);
  assert.doesNotMatch(html, /src="https?:/);
  [...html.matchAll(/ src="([^"]+)"/g)].forEach((m) => assert.ok(fs.existsSync(path.join(root, m[1])), m[1]));
  const page = fs.readFileSync(path.join(root, 'src/lib/classBoard/classPage.js'), 'utf8');
  assert.match(page, /MMAccount/);
  assert.match(page, /\.current\(\)/);
  assert.match(page, /onChange/);
  assert.match(page, /loadWho/, 'falls back to the class code and name the app already keeps');
  assert.doesNotMatch(page, /\bfetch\(|XMLHttpRequest|sendBeacon/);
  assert.match(html, /id="empty"/);
  assert.match(html, /כך מוסיפים תלמידים/);
});
