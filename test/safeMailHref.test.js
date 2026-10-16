// The mail button must navigate only to the mailto: link the script built,
// never to text read back from the DOM.
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const offer = require('../src/lib/offer.js');

test('safeMailHref returns input string if starting with mailto:, and empty string for javascript: or other prefixes', () => {
  assert.strictEqual(typeof offer.safeMailHref, 'function');
  // An empty To: is what a letter with no principal address now builds.
  assert.strictEqual(offer.safeMailHref('mailto:?subject=x'), 'mailto:?subject=x');
  assert.strictEqual(offer.safeMailHref('JavaScript:alert(1)'), '');
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

test('every mailto the letter builder makes passes safeMailHref unchanged', () => {
  const mail = offer.buildPrincipalEmail({ teacher: 'רות', school: 'בי"ס "אורים" & נוף', grade: 'ג', principal: 'דנה', principalEmail: 'a@b.org' });
  assert.ok(mail.ok);
  assert.strictEqual(offer.safeMailHref(mail.mailto), mail.mailto);
  // Hebrew school names carry quotes; the letter is plain text and must not be HTML-escaped.
  assert.match(decodeURIComponent(mail.mailto), /בי"ס "אורים" & נוף/);
  assert.doesNotMatch(decodeURIComponent(mail.mailto), /&quot;|&amp;/);
});

test('offer.html does not read the navigation target back from a DOM attribute', () => {
  const page = fs.readFileSync(path.join(__dirname, '..', 'offer.html'), 'utf8');
  assert.doesNotMatch(page, /location\.href\s*=\s*\$\('openMail'\)\.getAttribute/);
  assert.doesNotMatch(page, /getAttribute\('data-href'\)/);
  assert.match(page, /const href = safeMailHref\(currentMailto\);\s*if \(href\) location\.href = href;/);
});
