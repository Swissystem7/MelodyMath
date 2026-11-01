const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const css = fs.readFileSync(path.join(__dirname, '..', 'src', 'components', 'jam.css'), 'utf8');

test('jam.css implements Claude Design neo-brutalist styling across game screens', () => {
  // Navy outline token
  assert.match(css, /#1B1446/);

  // Hard offset shadows
  assert.match(css, /box-shadow:\s*0\s+6px\s+0\s+#1B1446/);
  assert.match(css, /box-shadow:\s*0\s+4px\s+0\s+#1B1446/);

  // Active press displacement
  assert.match(css, /transform:\s*translateY\(3px\)/);
  assert.match(css, /box-shadow:\s*0\s+1px\s+0\s+#1B1446/);

  // Game surface styling
  assert.match(css, /\.mm-game\{[^}]*border:\s*3px solid #1B1446/);
  assert.match(css, /\.mm-game\{[^}]*background:\s*#FFF6E5/);

  // Button and pad styling
  assert.match(css, /\.jam-pad\{[^}]*border:\s*3px solid #1B1446/);
  assert.match(css, /\.jam-pad\{[^}]*box-shadow:\s*0\s+4px\s+0\s+#1B1446/);

  // Fractions bar, beats and ruler styling
  assert.match(css, /\.fbp-bar\{[^}]*border:\s*3px solid #1B1446/);
  assert.match(css, /\.ttg-beats\{[^}]*border:\s*3px solid #1B1446/);
  assert.match(css, /\.tr-line\{[^}]*border:\s*3px solid #1B1446/);
});
