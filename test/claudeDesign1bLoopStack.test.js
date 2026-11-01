const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/components/LoopStackScreen.js');

test('Screen 1b LoopStack renders faithful Claude Design phone frame', () => {
  const st = S.createState(0, true);
  const names = ['תופים', 'בס'];
  const html = S.renderHtml(st, names);

  // Chassis
  assert.match(html, /width:390px/);
  assert.match(html, /background:#EAF7F3/);
  assert.match(html, /border:10px solid #15102E/);

  // Status bar
  assert.match(html, /9:41/);

  // Header
  assert.match(html, /לופ־סטאק/);
  assert.match(html, /שכבות של קוביות, שכבות של צלילים/);

  // Equation card
  assert.match(html, /#C2410C/);
  assert.match(html, /#0F766E/);
  assert.match(html, /#5B3FD9/);

  // 3D Isometric container
  assert.match(html, /background:#D3EFE6/);
  assert.match(html, /rotateX\(58deg\)\s*rotateZ\(45deg\)/);

  // Steppers
  assert.match(html, /הוספת שורה/);
  assert.match(html, /הסרת שורה/);
  assert.match(html, /הוספת עמודה/);
  assert.match(html, /הסרת עמודה/);

  // Bottom action bar
  assert.match(html, /הסרת שכבה/);
  assert.match(html, /\+ שכבה/);
  assert.match(html, /data-act="play"/);
});
