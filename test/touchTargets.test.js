// #591 goal A.5: e2e/musicEngine.spec.js asks for 44x44 targets 8px apart on
// the home panel. These are the three rules that make it pass at 360-820px.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const read = (f) => fs.readFileSync(path.join(__dirname, '..', f), 'utf8');

function rule(css, selector) {
  const at = css.indexOf(selector + ' {');
  assert.ok(at >= 0, selector + ' rule exists');
  return css.slice(at, css.indexOf('}', at));
}

test('the plan source link is a 44x44 target', () => {
  const r = rule(read('src/sefirot.css'), '.mm-plan-source');
  assert.match(r, /min-height: 44px/);
  assert.match(r, /min-width: 44px/);
  assert.match(r, /inline-flex/);
});

test('footer links are 44x44 and keep 8px between wrapped rows', () => {
  const r = rule(read('src/sefirot.css'), 'footer a');
  assert.match(r, /min-height: 44px/);
  assert.match(r, /min-width: 44px/);
  assert.match(r, /margin-block: 4px/);
});

test('tabs sit 8px apart', () => {
  assert.match(rule(read('src/theme.css'), '.tabs'), /gap: var\(--s-2\)/);
});
