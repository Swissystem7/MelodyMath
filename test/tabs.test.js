const test = require('node:test');
const assert = require('node:assert/strict');
const tabs = require('../src/lib/tabs');

test('in RTL, ArrowLeft is next and ArrowRight is previous', () => {
  assert.equal(tabs.tabIndexAfterKey(0, 4, 'ArrowLeft', true), 1);
  assert.equal(tabs.tabIndexAfterKey(0, 4, 'ArrowRight', true), 3);
  assert.equal(tabs.tabIndexAfterKey(3, 4, 'ArrowLeft', true), 0);
});

test('in LTR, ArrowRight is next and ArrowLeft is previous', () => {
  assert.equal(tabs.tabIndexAfterKey(0, 4, 'ArrowRight', false), 1);
  assert.equal(tabs.tabIndexAfterKey(0, 4, 'ArrowLeft', false), 3);
  assert.equal(tabs.tabIndexAfterKey(3, 4, 'ArrowRight', false), 0);
});

test('Home and End jump to the ends', () => {
  assert.equal(tabs.tabIndexAfterKey(2, 6, 'Home', true), 0);
  assert.equal(tabs.tabIndexAfterKey(2, 6, 'End', true), 5);
});

test('a single tab stays put', () => {
  assert.equal(tabs.tabIndexAfterKey(0, 1, 'ArrowLeft', true), 0);
  assert.equal(tabs.tabIndexAfterKey(0, 1, 'ArrowRight', true), 0);
});

test('garbage count does not throw', () => {
  assert.equal(tabs.tabIndexAfterKey(0, 0, 'ArrowLeft', true), 0);
  assert.equal(tabs.tabIndexAfterKey('x', 'nope', 'Home', false), 0);
});

test('syncRovingTabindex leaves only the selected tab in the tab order', () => {
  const nodes = [
    { getAttribute: () => 'false', tabIndex: 0, setAttribute() {} },
    { getAttribute: () => 'true', tabIndex: 0, setAttribute() {} },
    { getAttribute: () => 'false', tabIndex: 0, setAttribute() {} },
  ];
  tabs.syncRovingTabindex(nodes);
  assert.equal(nodes[0].tabIndex, -1);
  assert.equal(nodes[1].tabIndex, 0);
  assert.equal(nodes[2].tabIndex, -1);
});

test('isTabKey only accepts the four APG keys', () => {
  assert.equal(tabs.isTabKey('ArrowLeft'), true);
  assert.equal(tabs.isTabKey('Home'), true);
  assert.equal(tabs.isTabKey(' '), false);
  assert.equal(tabs.isTabKey('Enter'), false);
});
