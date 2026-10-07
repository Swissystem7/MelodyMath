const test = require('node:test');
const assert = require('node:assert');
const tabs = require('../src/lib/tabs');

const getNextTabId = tabs.getNextTabId || function () { return undefined; };

test('exports getNextTabId function', () => {
  assert.strictEqual(typeof tabs.getNextTabId, 'function');
});

test('navigates to next tab with ArrowRight', () => {
  const ids = ['tab-home', 'tab-lessons', 'tab-practice'];
  assert.strictEqual(getNextTabId(ids, 'tab-home', 'ArrowRight'), 'tab-lessons');
  assert.strictEqual(getNextTabId(ids, 'tab-lessons', 'ArrowRight'), 'tab-practice');
});

test('wraps around to first tab with ArrowRight at end', () => {
  const ids = ['tab-home', 'tab-lessons', 'tab-practice'];
  assert.strictEqual(getNextTabId(ids, 'tab-practice', 'ArrowRight'), 'tab-home');
});

test('navigates to previous tab with ArrowLeft', () => {
  const ids = ['tab-home', 'tab-lessons', 'tab-practice'];
  assert.strictEqual(getNextTabId(ids, 'tab-practice', 'ArrowLeft'), 'tab-lessons');
  assert.strictEqual(getNextTabId(ids, 'tab-lessons', 'ArrowLeft'), 'tab-home');
});

test('wraps around to last tab with ArrowLeft at beginning', () => {
  const ids = ['tab-home', 'tab-lessons', 'tab-practice'];
  assert.strictEqual(getNextTabId(ids, 'tab-home', 'ArrowLeft'), 'tab-practice');
});

test('navigates to first tab with Home key', () => {
  const ids = ['tab-home', 'tab-lessons', 'tab-practice'];
  assert.strictEqual(getNextTabId(ids, 'tab-practice', 'Home'), 'tab-home');
  assert.strictEqual(getNextTabId(ids, 'tab-lessons', 'Home'), 'tab-home');
});

test('navigates to last tab with End key', () => {
  const ids = ['tab-home', 'tab-lessons', 'tab-practice'];
  assert.strictEqual(getNextTabId(ids, 'tab-home', 'End'), 'tab-practice');
  assert.strictEqual(getNextTabId(ids, 'tab-lessons', 'End'), 'tab-practice');
});

test('handles single tab list', () => {
  const ids = ['tab-only'];
  assert.strictEqual(getNextTabId(ids, 'tab-only', 'ArrowRight'), 'tab-only');
  assert.strictEqual(getNextTabId(ids, 'tab-only', 'ArrowLeft'), 'tab-only');
  assert.strictEqual(getNextTabId(ids, 'tab-only', 'Home'), 'tab-only');
  assert.strictEqual(getNextTabId(ids, 'tab-only', 'End'), 'tab-only');
});

test('returns current tab ID when key is not a navigation key', () => {
  const ids = ['tab-home', 'tab-lessons', 'tab-practice'];
  assert.strictEqual(getNextTabId(ids, 'tab-lessons', 'Enter'), 'tab-lessons');
  assert.strictEqual(getNextTabId(ids, 'tab-lessons', 'Tab'), 'tab-lessons');
});

test('supports RTL mode reversing ArrowLeft and ArrowRight', () => {
  const ids = ['tab-home', 'tab-lessons', 'tab-practice'];
  assert.strictEqual(getNextTabId(ids, 'tab-home', 'ArrowLeft', true), 'tab-lessons');
  assert.strictEqual(getNextTabId(ids, 'tab-practice', 'ArrowLeft', true), 'tab-home');
  assert.strictEqual(getNextTabId(ids, 'tab-practice', 'ArrowRight', true), 'tab-lessons');
  assert.strictEqual(getNextTabId(ids, 'tab-home', 'ArrowRight', true), 'tab-practice');
});

test('handles empty or invalid inputs gracefully', () => {
  assert.strictEqual(getNextTabId([], 'tab-home', 'ArrowRight'), null);
  assert.strictEqual(getNextTabId(null, 'tab-home', 'ArrowRight'), null);
});

test('aliases nextTabId and tabIdAfterKey work identically', () => {
  const ids = ['tab-home', 'tab-lessons', 'tab-practice'];
  const nextFn = tabs.nextTabId || function () { return undefined; };
  const afterKeyFn = tabs.tabIdAfterKey || function () { return undefined; };
  assert.strictEqual(typeof tabs.nextTabId, 'function');
  assert.strictEqual(typeof tabs.tabIdAfterKey, 'function');
  assert.strictEqual(nextFn(ids, 'tab-home', 'ArrowRight'), 'tab-lessons');
  assert.strictEqual(afterKeyFn(ids, 'tab-practice', 'ArrowRight'), 'tab-home');
});
