const test = require('node:test');
const assert = require('node:assert');
const offer = require('../src/lib/offer.js');

test('safeMailHref returns input string if starting with mailto:, and empty string for javascript: or other prefixes', () => {
  assert.strictEqual(typeof offer.safeMailHref, 'function');
  assert.strictEqual(offer.safeMailHref('mailto:aviran2606@gmail.com'), 'mailto:aviran2606@gmail.com');
  assert.strictEqual(offer.safeMailHref('mailto:principal@school.edu?subject=trial'), 'mailto:principal@school.edu?subject=trial');
  assert.strictEqual(offer.safeMailHref('mailto:'), 'mailto:');
  assert.strictEqual(offer.safeMailHref('javascript:alert(1)'), '');
  assert.strictEqual(offer.safeMailHref('javascript:void(0)'), '');
  assert.strictEqual(offer.safeMailHref('https://swissystem7.github.io/'), '');
  assert.strictEqual(offer.safeMailHref('http://example.com'), '');
  assert.strictEqual(offer.safeMailHref('data:text/html,<script>alert(1)</script>'), '');
  assert.strictEqual(offer.safeMailHref('blob:https://example.com'), '');
  assert.strictEqual(offer.safeMailHref(''), '');
  assert.strictEqual(offer.safeMailHref(null), '');
  assert.strictEqual(offer.safeMailHref(undefined), '');
  assert.strictEqual(offer.safeMailHref(123), '');
});
