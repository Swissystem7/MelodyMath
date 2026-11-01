const test = require('node:test');
const assert = require('node:assert/strict');
const SCREEN = require('../src/components/GrooveGridScreen.js');

function mem(init) {
  const m = Object.assign({}, init);
  return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } };
}

test('Screen 1a GrooveGrid renders faithful Claude Design phone frame', () => {
  const st = SCREEN.createState(0, true);
  const tr = SCREEN.tracks(mem({}));
  const html = SCREEN.renderHtml(st, tr);

  // Phone chassis styling
  assert.match(html, /width:390px/);
  assert.match(html, /border-radius:52px/);
  assert.match(html, /border:10px solid #15102E/);
  assert.match(html, /background:#FFF6E5/);
  assert.match(html, /box-shadow:0 20px 50px rgba\(27,20,70,\.25\)/);

  // Status bar
  assert.match(html, /9:41/);

  // Header and title
  assert.match(html, /גרוב־גריד/);
  assert.match(html, /המשך לשיטת השטח/);
  assert.match(html, /★/);

  // Equation card
  assert.match(html, /#C2410C[^>]*>3<\/span>/); // Rows
  assert.match(html, /#0F766E[^>]*>4<\/span>/); // Cols
  assert.match(html, /#5B3FD9[^>]*>12<\/span>/); // Area

  // 6x6 grid with row colors
  assert.match(html, /grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/);
  assert.match(html, /#FF8A3D/); // Row 0
  assert.match(html, /#2ED3A8/); // Row 1
  assert.match(html, /#B9A5FF/); // Row 2

  // Big orange play button with hard offset shadow
  assert.match(html, /background:#FF8A3D/);
  assert.match(html, /box-shadow:0 6px 0 #1B1446/);
  assert.match(html, /נגנו את השטח/);
});
