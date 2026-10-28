// Child-facing label: the practice area speaks of צלילים, not the technical מרווחים.
// ("המרווחים שלכם" in the tap widget means time gaps and is intentionally out of scope.)
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

test('practice labels say צלילים and the old מרווחים labels are gone', () => {
  for (const s of ['data-tab="practice">צלילים וטמפו</button>', 'מעבר לתוכנית · צלילים וטמפו',
    'יחסים בין צלילים', 'פונקציות וצלילים']) assert.ok(indexHtml.includes(s), s);
  for (const s of ['מרווחים וטמפו', 'יחס מרווחים', 'פונקציות ומרווחים', "'מרווחים'"]) {
    assert.equal(indexHtml.includes(s), false, s);
  }
});

test('ratio rows keep their questions and extraMusic still matches צלילים', () => {
  const rows = indexHtml.match(/\[\d+,\d,'יחסים','צלילים','[^']*'/g) || [];
  assert.equal(rows.length, 12);
  assert.ok(indexHtml.includes('במרווח קווינטה'));
  assert.match(indexHtml, /function extraMusic\(item\)\{[^\n]*item\.musicConcept==='צלילים'/);
});

test('no-music path: ratio questions render and extra notes are a no-op without audio', () => {
  const raw = vm.runInNewContext(indexHtml.match(/const exercises=(\[[\s\S]*?\])\.map/)[1]);
  const ratio = raw.filter((r) => r[3] === 'צלילים')
    .map(([id, level, mathTopic, musicConcept, prompt, answer]) => ({ id, level, mathTopic, musicConcept, prompt, answer }));
  const code = ['childPrompt', 'extraMusic', 'playExtraNotes']
    .map((n) => indexHtml.split('\n').find((l) => l.startsWith('function ' + n + '(')));
  // No playTap, AudioContext or window: audio is unavailable/muted.
  const sandbox = { Array, Math, Number, String, setTimeout: () => assert.fail('no sound scheduled') };
  vm.createContext(sandbox);
  vm.runInContext(code.join('\n'), sandbox);
  assert.equal(ratio.length, 12);
  for (const item of ratio) {
    assert.ok(sandbox.childPrompt(item).includes(item.prompt), 'prompt shown for ' + item.id);
    assert.match(String(item.answer), /^\d+:\d+$/);
    const music = sandbox.extraMusic(item);
    assert.doesNotThrow(() => sandbox.playExtraNotes(music && music.notes));
  }
});
