const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../src/components/NoteLengthLineScreen.js');

test('Screen 2a fractions line renders faithful Claude Design phone frame', () => {
  const st = S.createState(0, true);
  const html = S.renderHtml(st, 'יוקללה');

  // Chassis
  assert.match(html, /width:390px/);
  assert.match(html, /background:#FFF6E5/);
  assert.match(html, /border:10px solid #15102E/);

  // Status bar
  assert.match(html, /9:41/);

  // Header
  assert.match(html, /קו הצלילים/);
  assert.match(html, /שברים באורכי תווים/);

  // Instrument buttons
  assert.match(html, /יוקללה/);
  assert.match(html, /כלי ראשי · מנגינה/);
  assert.match(html, /תוף/);
  assert.match(html, /כלי נוסף · פעימה/);

  // Target banner
  assert.match(html, /בנו קו באורך של/);
  assert.match(html, /תיבה/);

  // Drum beat row
  assert.match(html, /שורת התוף/);

  // 4 Notes
  assert.match(html, /שלמה/);
  assert.match(html, /חצי/);
  assert.match(html, /רבע/);
  assert.match(html, /שמינית/);

  // Controls
  assert.match(html, /data-act="play"/);
  assert.match(html, /data-act="clear"/);
  assert.match(html, /data-act="check"/);
});
