const test = require('node:test');
const assert = require('node:assert/strict');
const metro = require('../src/lib/metro');

test('BPM stays inside 40–140 and defaults when garbage arrives', () => {
  assert.equal(metro.clampBpm(80), 80);
  assert.equal(metro.clampBpm(10), 40);
  assert.equal(metro.clampBpm(400), 140);
  assert.equal(metro.clampBpm('nope'), 80);
});

test('a streak of three raises BPM only when the teacher asked for acceleration', () => {
  assert.equal(metro.nextBpm(80, 3, false), 80);
  assert.equal(metro.nextBpm(80, 2, true), 80);
  assert.equal(metro.nextBpm(80, 3, true), 84);
  assert.equal(metro.nextBpm(80, 6, true), 84);
  assert.equal(metro.nextBpm(138, 3, true), 140);
});

test('ms per beat is 750 at 80 BPM', () => {
  assert.equal(metro.msPerBeat(80), 750);
});
