'use strict';
// Grade ד׳ needs box volume (length × width × height) and litre conversions
// that are not the grade-ב׳ cube-counting copies. New items are appended,
// so the ids #751 already locked do not move (#1096).
const test = require('node:test');
const assert = require('node:assert/strict');
const banks = require('../src/lib/banks');

const idx = (id) => +String(id).split('-').pop();

const BOXES = [
  ['תיבה שאורכה 5 ס״מ, רוחבה 3 ס״מ וגובהה 2 ס״מ. מה נפחה בסמ״ק?', 5 * 3 * 2],
  ['תיבה שאורכה 4 ס״מ, רוחבה 4 ס״מ וגובהה 3 ס״מ. מה נפחה בסמ״ק?', 4 * 4 * 3],
  ['נפח תיבה הוא 36 סמ״ק. אורכה 6 ס״מ ורוחבה 3 ס״מ. מה גובהה בס״מ?', 36 / (6 * 3)],
  ['תיבה של 8 ס״מ על 5 ס״מ על 2 ס״מ. כמה סמ״ק היא מכילה?', 8 * 5 * 2],
  ['קובייה שצלעה 3 ס״מ. מה נפחה בסמ״ק?', 3 * 3 * 3],
  ['תיבה 5×4×2 ס״מ. כמה מ״ל מים היא מכילה? (1 סמ״ק = 1 מ״ל)', 5 * 4 * 2],
  ['שתי תיבות: 6×2×2 ו־5×3×2 ס״מ. בכמה סמ״ק השנייה גדולה יותר?', (5 * 3 * 2) - (6 * 2 * 2)],
];
const LITRES = [
  ['כמה מ״ל חסרים ל־750 מ״ל כדי להגיע לליטר אחד?', 1000 - 750],
  ['בבקבוק 2 ליטר ו־250 מ״ל. כמה מ״ל בסך הכול?', 2 * 1000 + 250],
  ['3,000 מ״ל הם כמה ליטר?', 3000 / 1000],
];

test('grade ד׳ box and litre items are appended after the locked cube counts', () => {
  const all = banks.allItems();
  const locked = all.find((it) => it.prompt === 'תיבה בנויה מ־2 שכבות של 6 קוביות. כמה קוביות יש בה?' && it.grade === 'ד');
  assert.ok(locked, 'the grade-ב׳ wording kept by #751 is still there');
  const fresh = [...BOXES, ...LITRES].map(([prompt, answer]) => {
    const it = all.find((x) => x.prompt === prompt);
    assert.ok(it, prompt);
    assert.equal(it.grade, 'ד');
    assert.equal(it.standard, banks.ST.MASS_VOL);
    assert.equal(it.answer, answer, prompt);
    assert.ok(idx(it.id) > idx(locked.id), it.id + ' is after ' + locked.id);
    return it;
  });
  const ids = fresh.map((it) => it.id);
  assert.equal(new Set(ids).size, ids.length);
  const g2 = new Set(banks.itemsForGrade('ב').map((it) => it.prompt));
  fresh.forEach((it) => assert.ok(!g2.has(it.prompt), it.prompt));
  fresh.filter((it) => /תיבה|קובי/.test(it.prompt)).forEach((it) => {
    assert.equal(it.music, 'cubeLayerGroups', it.prompt);
  });
  fresh.filter((it) => !/תיבה|קובי/.test(it.prompt)).forEach((it) => {
    assert.equal(it.music, 'kiloGroupsTen', it.prompt);
    assert.match(it.musicNote, /ק״ג|ליטר/);
  });
});
