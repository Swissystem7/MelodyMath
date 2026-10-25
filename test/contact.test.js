const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const contact = require('../src/lib/contact');

function read(rel) {
  return fs.readFileSync(path.join(root, rel), 'utf8');
}

test('one CONTACT config holds the only contact value', () => {
  assert.equal(typeof contact.CONTACT, 'object');
  assert.ok(Object.prototype.hasOwnProperty.call(contact.CONTACT, 'email'));
  assert.match(contact.ISSUE_FORM_URL, /^https:\/\/github\.com\/Swissystem7\/MelodyMath\/issues\/new\?template=pilot\.yml$/);
  // No other file may carry its own address: offer.js reads it from contact.js.
  const offer = read('src/lib/offer.js');
  assert.doesNotMatch(offer, /@[a-z0-9-]+\.[a-z]{2,}'/i, 'offer.js must not hard-code an address');
});

test('an empty email hides the email link and leaves only the Hebrew issue form', () => {
  const html = contact.renderContactHtml({ email: '' });
  assert.doesNotMatch(html, /mailto:/);
  assert.match(html, /issues\/new\?template=pilot\.yml/);
  assert.match(html, /ציבורי/);
  assert.match(html, /אל תכתבו שמות של ילדים/);
  assert.equal(contact.contactChannels({ email: '' }).email, '');
  assert.equal(contact.contactChannels({ email: 'not an address' }).email, '');
});

test('a filled email shows a mailto link next to the issue form', () => {
  const html = contact.renderContactHtml({ email: 'owner@example.org' });
  assert.match(html, /href="mailto:owner%40example\.org\?subject=/);
  assert.match(html, /issues\/new\?template=pilot\.yml/);
  const sneaky = contact.renderContactHtml({ email: '"><img src=x onerror=alert(1)>@x.io' });
  assert.doesNotMatch(sneaky, /<img/);
});

test('the pilot issue form is Hebrew, warns it is public, and asks the one end-of-pilot question', () => {
  const formPath = path.join(root, '.github', 'ISSUE_TEMPLATE', 'pilot.yml');
  assert.ok(fs.existsSync(formPath), 'missing .github/ISSUE_TEMPLATE/pilot.yml');
  const form = fs.readFileSync(formPath, 'utf8');
  assert.match(form, /^name: /m);
  assert.match(form, /ציבורי/);
  assert.match(form, /שמות של ילדים/);
  assert.match(form, /דף עבודה לא נותן/);
  assert.doesNotMatch(form, /id: (phone|email|school_name|child)/);
});

test('offer and landing pages mount the contact block and load contact.js', () => {
  for (const page of ['offer.html', 'landing.html']) {
    const html = read(page);
    assert.match(html, /data-mm-contact/, page);
    assert.match(html, /src="src\/lib\/contact\.js"/, page);
  }
});

// index.html is the page that moves most, so a master→main sync is where its
// contact block is most likely to be dropped. Every page that mounts a block
// needs contact.js and the .mm-contact-links rule, or the block renders unstyled.
test('every page with a contact block loads contact.js and styles it', () => {
  for (const page of ['index.html', 'offer.html', 'landing.html']) {
    const html = read(page);
    assert.match(html, /data-mm-contact/, page);
    assert.match(html, /src="src\/lib\/contact\.js"/, page);
    assert.match(html, /\.mm-contact-links\{/, page + ' is missing the contact-block CSS');
  }
  // The week-4 question in the pilot kit points at the block right below it.
  assert.match(read('index.html'), /data-mm-contact data-subject="MelodyMath · שאלת הסיום"/);
});

test('contact.js loads before offer.js, which reads the address from it', () => {
  const html = read('offer.html');
  const contactAt = html.indexOf('src="src/lib/contact.js"');
  const offerAt = html.indexOf('src="src/lib/offer.js"');
  assert.ok(contactAt > -1 && offerAt > -1, 'both scripts are on the page');
  assert.ok(contactAt < offerAt, 'offer.js reads globalThis.projectEmail, so contact.js must run first');
});

// The owner decided on 28.9: the public contact channel for all his apps is his Google Form
// "משוב על האפליקציות", with the app field pre-filled as MelodyMath (an exact option of the form).
const OWNER_FORM = 'https://docs.google.com/forms/d/e/1FAIpQLSdT8YduNx-VWKM3bWGUJdiSj4Sw9D-EA6R6c-oYVYCQmOVXxQ/viewform?usp=pp_url&entry.368039752=MelodyMath';

test('CONTACT.form is the owner\'s Google Form; the pages link to it instead of the public GitHub form', () => {
  assert.equal(contact.CONTACT.form, OWNER_FORM);
  assert.equal(contact.contactChannels().formUrl, OWNER_FORM);
  const html = contact.renderContactHtml(contact.CONTACT);
  assert.ok(html.includes('href="' + OWNER_FORM.replace(/&/g, '&amp;') + '"'), 'the block links to the form');
  assert.match(html, /target="_blank" rel="noopener"/);
  assert.match(html, /טופס Google/);
  assert.doesNotMatch(html, /issues\/new|בגיטהאב/, 'the GitHub form and its "public" note step aside');
  assert.match(html, /אל תכתבו שמות של ילדים/, 'the no-personal-details warning stays');
  // A non-https value is ignored and the GitHub form comes back.
  const bad = contact.renderContactHtml({ email: '', form: 'javascript:alert(1)' });
  assert.match(bad, /issues\/new\?template=pilot\.yml/);
  assert.doesNotMatch(bad, /javascript:/);
});

// mountContactBlocks is the only part that runs in the browser, so the pages'
// markup is checked above but the filling itself needs a stand-in document.
test('mountContactBlocks fills every block on the page with its own subject', () => {
  const made = [];
  const fake = {
    querySelectorAll: () => made,
  };
  for (const subject of ['MelodyMath · ניסוי כיתתי', 'MelodyMath · שאלת הסיום']) {
    made.push({ innerHTML: '', getAttribute: (n) => (n === 'data-subject' ? subject : null) });
  }
  assert.equal(contact.mountContactBlocks(fake), 2);
  assert.match(made[0].innerHTML, /mm-contact-links/);
  assert.ok(made[0].innerHTML.includes(encodeURIComponent('MelodyMath · ניסוי כיתתי')), 'the offer block keeps its own subject');
  assert.ok(made[1].innerHTML.includes(encodeURIComponent('MelodyMath · שאלת הסיום')), 'the week-4 block keeps its own subject');
  // A document without blocks is not an error, and a non-document is ignored.
  assert.equal(contact.mountContactBlocks({ querySelectorAll: () => [] }), 0);
  assert.equal(contact.mountContactBlocks({}), 0);
});

test('contact.js changed, so the service worker cache moved to v9 or later', () => {
  const m = read('sw.js').match(/const CACHE = 'melodymath-offline-v(\d+)'/);
  assert.ok(m, 'CACHE constant not found');
  assert.ok(Number(m[1]) >= 9, 'CACHE should be at least v9');
  assert.ok(read('sw.js').includes("'./src/lib/contact.js'"), 'contact.js is in ASSETS');
});
