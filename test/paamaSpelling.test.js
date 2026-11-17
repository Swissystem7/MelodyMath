'use strict';
// The Academy's music term is פַּעֲמָה / פְּעָמוֹת. "פעימה" is the pulse of
// physics and sport, and the bank used to mix the two.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const D = require('../src/lib/music/dataWorlds');

const SING = '\u05e4\u05bc\u05b7\u05e2\u05b2\u05de\u05b8\u05d4';
const PLUR = '\u05e4\u05b0\u05e2\u05b8\u05de\u05d5\u05b9\u05ea';
const BARE = /פעימות|פעימת|פעימה|פעמות|פעמה/g;

function filesUnder(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) out.push(...filesUnder(p));
    else if (/\.(js|html|css)$/.test(name)) out.push(p);
  }
  return out;
}

test('src, tests and pages use פַּעֲמָה / פְּעָמוֹת, not פעימה or an unvocalized פעמה', () => {
  const root = path.join(__dirname, '..');
  const hits = [];
  for (const dir of ['src', 'test']) {
    for (const file of filesUnder(path.join(root, dir))) {
      const text = fs.readFileSync(file, 'utf8');
      const bad = text.match(BARE);
      if (file.endsWith('paamaSpelling.test.js')) continue;
      if (bad) hits.push(path.relative(root, file) + ': ' + bad.slice(0, 3).join(', '));
    }
  }
  assert.deepEqual(hits, []);
  const bank = fs.readFileSync(path.join(root, 'src/lib/banks.js'), 'utf8');
  assert.ok(bank.includes(SING) && bank.includes(PLUR));
});

test('an odd answer with a maqaf still matches the ASCII hyphen in the sound plan', () => {
  const maqaf = D.specForItem({
    music: 'alternateDrums',
    prompt: '2 + 3 — זוגי או אי־זוגי?',
    answer: 'אי־זוגי',
  });
  const ascii = D.specForItem({
    music: 'alternateDrums',
    prompt: '2 + 3 — זוגי או אי-זוגי?',
    answer: 'אי-זוגי',
  });
  assert.equal(maqaf && maqaf.kind, 'sumParity');
  assert.equal(ascii && ascii.kind, 'sumParity');
  assert.equal(maqaf.answer, 'אי־זוגי');
  assert.equal(ascii.answer, 'אי-זוגי');
  assert.equal(D.specForItem({
    music: 'alternateDrums',
    prompt: '2 + 3 — זוגי או אי־זוגי?',
    answer: 'זוגי',
  }), null, 'a wrong parity is not played');
});
