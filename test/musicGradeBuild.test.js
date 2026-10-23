'use strict';
// #591 audit item 5: grade ו׳ builds on the musical mechanism of the earlier
// grade instead of repeating it. Order of operations (ד׳ ORDER_OPS → ו׳
// G6_NAT_OPS) and number properties (ה׳ PRIME_FACTOR → ו׳ G6_NAT_PROPS) must
// not share a way tag.
const test = require('node:test');
const assert = require('node:assert/strict');

const g4 = require('../src/lib/curriculum/grade4');
const g5 = require('../src/lib/curriculum/grade5');
const g6 = require('../src/lib/curriculum/grade6');

const tags = (ways) => ways.map((w) => w[0]);

[
  ['ORDER_OPS → G6_NAT_OPS', g4.music.ORDER_OPS, g6.music.G6_NAT_OPS],
  ['PRIME_FACTOR → G6_NAT_PROPS', g5.music.PRIME_FACTOR, g6.music.G6_NAT_PROPS],
].forEach(([name, before, after]) => {
  test('grade ו׳ uses new mechanisms for ' + name, () => {
    assert.ok(before.length && after.length, name);
    assert.deepEqual(tags(after).filter((t) => tags(before).includes(t)), []);
    after.forEach((w) => assert.ok(g6.sources[w[2]], w[0] + ' ' + w[2]));
  });
});
