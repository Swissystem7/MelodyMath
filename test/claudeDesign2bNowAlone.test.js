const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/components/NowAloneScreen.js');

test('Screen 2b Now Alone renders faithful Claude Design phone chassis and elements', () => {
  const st = S.createState(0);
  const html = S.renderHtml(st);

  // Chassis
  assert.match(html, /width:390px/);
  assert.match(html, /background:#F4F1FF/);
  assert.match(html, /border:10px solid #15102E/);
  assert.match(html, /border-radius:52px/);

  // Status bar
  assert.match(html, /9:41/);

  // Header
  assert.match(html, /עכשיו לבד/);
  assert.match(html, /סוף הנושא · בלי מוזיקה/);
  assert.match(html, /בשקט/);

  // Progress & Question card
  assert.match(html, /שאלה 1 מתוך 3/);
  assert.match(html, /שטח/);
  assert.match(html, /במלבן יש 4 שורות ו־6 עמודות/);

  // Keypad
  assert.match(html, /data-key="1"/);
  assert.match(html, /data-key="9"/);
  assert.match(html, /data-key="0"/);
  assert.match(html, /data-key="del"/);
  assert.match(html, /data-key="clr"/);
  assert.match(html, /⌫/);
  assert.match(html, /נקה/);

  // Idle message
  assert.match(html, /כתבו תשובה ולחצו ״בדיקה״/);
  assert.match(html, /בדיקה/);
});

test('Screen 2b keypad typing and submit handling', () => {
  let st = S.createState(0);

  // Type wrong answer '1', '2' (Q1 answer is 24)
  st = S.pressKey(st, '1');
  st = S.pressKey(st, '2');
  assert.equal(st.qIn, '12');

  st = S.submit(st);
  assert.equal(st.qState, 'wrong');
  assert.equal(st.qTries, 1);

  const wrongHtml = S.renderHtml(st);
  assert.match(wrongHtml, /כמעט! זו לא התשובה/);
  assert.match(wrongHtml, /רמז: 4 קבוצות של 6/);

  // Type correct answer '2', '4'
  st = S.pressKey(st, 'clr');
  st = S.pressKey(st, '2');
  st = S.pressKey(st, '4');
  assert.equal(st.qIn, '24');

  st = S.submit(st);
  assert.equal(st.qState, 'right');

  const rightHtml = S.renderHtml(st);
  assert.match(rightHtml, /✓ נכון! 24 משבצות/);
  assert.match(rightHtml, /לשאלה הבאה ←/);

  // Advance to question 2
  st = S.submit(st);
  assert.equal(st.qi, 1);
  assert.equal(st.qIn, '');
  assert.equal(st.qState, 'idle');
});
