const test = require('node:test');
const assert = require('node:assert/strict');
const ENCORE = require('../src/components/PersonalBestEncoreScreen.js');

test('Screen 1c PersonalBestEncore renders faithful Claude Design celebration screen', () => {
  const st = ENCORE.createState(14, 18);
  const html = ENCORE.renderHtml(st);

  // Chassis & colors
  assert.match(html, /width:390px/);
  assert.match(html, /background:#2A1B6B/);
  assert.match(html, /border:10px solid #15102E/);

  // Status bar
  assert.match(html, /9:41/);

  // Big titles
  assert.match(html, /שיא אישי חדש!/);
  assert.match(html, /הדרן!/);
  assert.match(html, /ניצחת את התוצאה הכי טובה שלך/);

  // Stat cards
  assert.match(html, /השיא הקודם/);
  assert.match(html, />14<\/div>/);
  assert.match(html, /\+4<\/span><span[^>]*>נקודות<\/span>/);
  assert.match(html, /השיא החדש/);
  assert.match(html, />18<\/div>/);

  // Melody card
  assert.match(html, /המנגינה הכי טובה שלך/);
  assert.equal((html.match(/data-act="col"/g) || []).length, 12);

  // Buttons
  assert.match(html, /נגנו שוב את המנגינה/);
  assert.match(html, /לשלב הבא ←/);

  // Confetti
  assert.match(html, /animation:mmFall/);
});
