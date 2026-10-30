// Regression (Refs #665): a syntax error in index.html's inline <script> (#722, maybeHear)
// killed the whole home script on the live site: empty grade picker, ?topic= links
// ignored, guided-lessons tab dead. Compile every inline script so this can't ship again.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const inline = [...html.matchAll(/<script(?![^>]*\bsrc=)([^>]*)>([\s\S]*?)<\/script>/g)]
  .filter(m => !/type=["'](?:module|application\/(?:ld\+)?json)["']/.test(m[1]));

test('index.html has inline scripts', () => {
  assert.ok(inline.length > 0);
});

inline.forEach((m, i) => {
  test(`index.html inline script #${i} compiles`, () => {
    assert.doesNotThrow(() => new vm.Script(m[2], { filename: `index.html#inline${i}` }));
  });
});

test('home script still paints grade buttons and handles ?topic= links', () => {
  const src = inline.map(m => m[2]).join('\n');
  assert.match(html, /id="gradePick"/);
  assert.match(src, /gradePick/);
  assert.match(src, /topic/);
});
