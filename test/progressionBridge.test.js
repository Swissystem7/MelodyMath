'use strict';
// Task R2 (Refs #665): for every topic in progression.js with buildsTo,
// add one bridge exercise at the start of the next topic reusing the
// previous topic's musical mechanism with the new math.

const test = require('node:test');
const assert = require('node:assert/strict');
const prog = require('../src/lib/curriculum/progression');
const bridges = require('../src/lib/curriculum/bridges');

test('bridges module exports all 104 bridges matching progression BUILDS_TO links', () => {
  assert.equal(bridges.RAW_BRIDGES.length, 104);
  assert.equal(Object.keys(bridges.BRIDGES).length, 104);
  assert.equal(Object.keys(prog.BRIDGES).length, 104);
});

test('every topic with buildsTo has a bridge for each outgoing link', () => {
  let linkCount = 0;
  for (const fromId of Object.keys(prog.BUILDS_TO)) {
    const targets = prog.BUILDS_TO[fromId];
    if (!targets || targets.length === 0) continue;

    const topicBridges = prog.bridgesForTopic(fromId);
    assert.equal(topicBridges.length, targets.length, fromId + ' bridges count must match buildsTo count');

    for (const toId of targets) {
      linkCount++;
      const bridge = prog.bridgeForLink(fromId, toId);
      assert.ok(bridge, 'Missing bridge for link ' + fromId + ' -> ' + toId);
      assert.equal(bridge.from, fromId, 'bridge.from must match link source');
      assert.equal(bridge.to, toId, 'bridge.to must match link target');
      assert.ok(typeof bridge.mechanism === 'string' && bridge.mechanism.length > 0, 'bridge mechanism must be a non-empty string');
      assert.ok(typeof bridge.prompt === 'string' && bridge.prompt.length > 5, 'bridge prompt must be a non-empty Hebrew string');
      assert.ok(bridge.answer !== undefined && bridge.answer !== null, 'bridge answer must be defined');
      assert.ok(typeof bridge.hint === 'string' && bridge.hint.length > 3, 'bridge hint must be a non-empty string');
    }
  }
  assert.equal(linkCount, 104, 'Total traversed buildsTo links must be exactly 104');
});

test('bridgesEnteringTopic returns all bridges whose prerequisite target is toId', () => {
  const enteringMmCur1 = bridges.bridgesEnteringTopic('mm-cur-1');
  assert.ok(enteringMmCur1.length >= 1);
  assert.equal(enteringMmCur1[0].from, 'mm-cur-0');
  assert.equal(enteringMmCur1[0].to, 'mm-cur-1');
});

test('bridgeForLink returns null for invalid or non-existent links', () => {
  assert.equal(prog.bridgeForLink('mm-cur-0', 'mm-cur-999'), null);
  assert.equal(prog.bridgeForLink('unknown', 'unknown'), null);
});


test('every bridge exercise prompt integrates the prerequisite musical mechanism and terms', () => {
  const musicalKeywords = [
    'פעימ', 'צליל', 'מקצב', 'תוף', 'תיב', 'סולם',
    'קצב', 'טמפו', 'מנגנ', 'נגינ', 'שיר', 'אקורד',
    'הקש', 'נקיש', 'תווי', 'אוקטב'
  ];

  for (const bridge of Object.values(bridges.BRIDGES)) {
    const hasMusic = musicalKeywords.some(keyword => bridge.prompt.includes(keyword));
    assert.ok(
      hasMusic,
      `Bridge ${bridge.from} -> ${bridge.to} prompt must include musical terminology: "${bridge.prompt}"`
    );
    assert.ok(
      typeof bridge.mechanism === 'string' && bridge.mechanism.length > 0,
      `Bridge ${bridge.from} -> ${bridge.to} must specify the musical mechanism`
    );
  }
});
