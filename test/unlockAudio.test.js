const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');

test('unlockAudio is inert in Node and says so', () => {
  const { unlockAudio } = require('../src/lib/sonify');
  assert.equal(typeof unlockAudio, 'function');
  assert.equal(unlockAudio(), false);
});

test('unlockAudio resumes a suspended context and plays one silent sample, once', () => {
  const calls = [];
  class FakeAC {
    constructor() { this.state = 'suspended'; this.destination = {}; }
    resume() { calls.push('resume'); this.state = 'running'; }
    createBuffer(ch, len, rate) { calls.push(`buffer ${ch} ${len} ${rate}`); return {}; }
    createBufferSource() {
      return { connect() { calls.push('connect'); }, start(t) { calls.push(`start ${t}`); } };
    }
  }
  const saved = global.window;
  global.window = { AudioContext: FakeAC };
  const modPath = require.resolve('../src/lib/sonify');
  delete require.cache[modPath];
  try {
    const { unlockAudio } = require('../src/lib/sonify');
    assert.equal(unlockAudio(), true);
    assert.deepEqual(calls, ['resume', 'buffer 1 1 22050', 'connect', 'start 0']);
    assert.equal(unlockAudio(), true);
    assert.equal(calls.length, 4);
  } finally {
    if (saved === undefined) delete global.window; else global.window = saved;
    delete require.cache[modPath];
  }
});

test('index.html unlocks audio on the first pointerdown only', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  assert.match(html, /addEventListener\('pointerdown',function\(\)\{if\(typeof unlockAudio==='function'\)unlockAudio\(\)\},\{once:true/);
});
