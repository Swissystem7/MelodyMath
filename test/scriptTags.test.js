const test = require('node:test');
const assert = require('node:assert/strict');
const { scriptTags } = require('./helpers/scriptTags');

test('scriptTags reads a src script and an inline script in document order', () => {
  const out = scriptTags('<p>x</p><script src="src/lib/core.js"></script><script>go(1)</script>');
  assert.equal(out.length, 2);
  assert.equal(out[0].src, 'src/lib/core.js');
  assert.equal(out[0].body, '');
  assert.equal(out[1].src, undefined);
  assert.equal(out[1].body, 'go(1)');
});

test('scriptTags keeps the body intact when it spans lines and holds < and >', () => {
  const [only] = scriptTags('<script>\nif (a < b && b > c) {\n  go();\n}\n</script>');
  assert.equal(only.src, undefined);
  assert.equal(only.body, '\nif (a < b && b > c) {\n  go();\n}\n');
});

// The spellings a browser honours but the old /<\/script>/ regex missed. Skipping a
// script here meant the page test quietly asserted against a half-run page.
test('scriptTags handles the closing-tag spellings a browser accepts', () => {
  assert.equal(scriptTags('<script>go()</SCRIPT>')[0].body, 'go()');
  assert.equal(scriptTags('<script>go()</script >')[0].body, 'go()');
  assert.equal(scriptTags('<SCRIPT SRC="a.js"></SCRIPT>')[0].src, 'a.js');
});

test('scriptTags reads src past extra attributes and spaces around the =', () => {
  assert.equal(scriptTags('<script defer src = "a.js" async></script>')[0].src, 'a.js');
  assert.equal(scriptTags('<script type="module" src="b.js"></script>')[0].src, 'b.js');
  assert.equal(scriptTags("<script src='c.js'></script>")[0].src, 'c.js');
});

test('scriptTags ignores a longer tag name that merely starts with "script"', () => {
  assert.deepEqual(scriptTags('<scripting>not a script</scripting>'), []);
  const out = scriptTags('<scripting>x</scripting><script>go()</script>');
  assert.equal(out.length, 1);
  assert.equal(out[0].body, 'go()');
});

test('scriptTags does not treat a nested "</scriptish" as the close', () => {
  const [only] = scriptTags('<script>var s = "</scriptish>"; go();</script>');
  assert.equal(only.body, 'var s = "</scriptish>"; go();');
});

test('scriptTags stops cleanly on an unclosed script instead of looping', () => {
  assert.deepEqual(scriptTags('<script>go()'), []);
  assert.deepEqual(scriptTags('<script'), []);
  assert.deepEqual(scriptTags(''), []);
});
