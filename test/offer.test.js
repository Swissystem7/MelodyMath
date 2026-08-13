const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const offer = require('../src/lib/offer');

const sample = {
  teacher: 'נועה כהן',
  role: 'מחנכת שילוב',
  school: 'יסודי הגליל',
  grade: 'שילוב ב׳–ג׳',
  groupSize: 5,
  principal: 'רותי לוי',
  principalEmail: 'principal@example.school.il',
};

test('a complete request builds a principal email with no efficacy claim', () => {
  const mail = offer.buildPrincipalEmail(sample);
  assert.equal(mail.ok, true);
  assert.equal(mail.to, sample.principalEmail);
  assert.match(mail.subject, /4 שבועות/);
  assert.match(mail.subject, /יסודי הגליל/);
  assert.match(mail.body, /נועה כהן/);
  assert.match(mail.body, /רותי לוי/);
  assert.match(mail.body, /ארבעה שבועות/);
  assert.match(mail.body, /חינם/);
  assert.match(mail.body, /אין חשבונית/);
  assert.match(mail.body, /localStorage|בטאבלט/);
  assert.match(mail.body, /swissystem7\.github\.io\/MelodyMath/);
  assert.match(mail.body, /אין כאן «טיפול»/);
  assert.doesNotMatch(mail.body, /מחקרים מוכיחים|סוגר פערים|15–20%|15-20%/);
  assert.doesNotMatch(mail.body, /₪|תשלום עכשיו|גפ״ן ירוק/);
  assert.match(mail.mailto, /^mailto:/);
});

test('a reply email is named in the letter and copied on the mailto', () => {
  const mail = offer.buildPrincipalEmail(Object.assign({}, sample, { replyEmail: 'teacher@example.school.il' }));
  assert.match(mail.body, /לחזרה: teacher@example\.school\.il/);
  assert.match(mail.mailto, /cc=teacher%40example\.school\.il/);
});

test('missing teacher school or grade blocks the email', () => {
  const mail = offer.buildPrincipalEmail({ teacher: 'נועה' });
  assert.equal(mail.ok, false);
  assert.ok(mail.missing.includes('school'));
  assert.ok(mail.missing.includes('grade'));
});

test('group size is clamped to a small class', () => {
  assert.equal(offer.normalizeTrialRequest({ groupSize: 99 }).groupSize, 12);
  assert.equal(offer.normalizeTrialRequest({ groupSize: 0 }).groupSize, 1);
  assert.equal(offer.normalizeTrialRequest({}).role, 'מחנכת שילוב');
});

test('the paid boundary is that there is no paid product', () => {
  const b = offer.offerBoundary();
  assert.equal(b.paid.exists, false);
  assert.equal(b.trial.weeks, 4);
  assert.equal(b.trial.priceHe, 'חינם');
  assert.match(b.paid.reasonHe, /אין מוצר בתשלום/);
  assert.ok(b.freeForever.length >= 3);
  const blob = b.freeForever.join(' ');
  assert.match(blob, /נגישות/);
  assert.doesNotMatch(blob, /מנוי|חשבונית|₪/);
});

test('the one-pager names the school and refuses a sales pitch', () => {
  const html = offer.renderOnePagerHtml(sample);
  assert.match(html, /יסודי הגליל/);
  assert.match(html, /נועה כהן/);
  assert.match(html, /רותי לוי/);
  assert.match(html, /לא תוכנית במאגר/);
  assert.match(html, /אין טענת יעילות/);
  assert.match(html, /4 שבועות/);
  assert.doesNotMatch(html, /<script/);
  assert.doesNotMatch(html, /מחקרים מוכיחים|49 ₪|299 ₪|בתי ספר משתמשים/);
  const sneaky = offer.renderOnePagerHtml({
    teacher: '<img src=x onerror=alert(1)>',
    school: 'בית ספר',
    grade: 'ב',
  });
  assert.doesNotMatch(sneaky, /<img/);
  assert.match(sneaky, /&lt;img/);
});

test('the offer page is Hebrew RTL and has no checkout', () => {
  const page = fs.readFileSync(path.join(__dirname, '..', 'offer.html'), 'utf8');
  assert.match(page, /lang="he"/);
  assert.match(page, /dir="rtl"/);
  assert.match(page, /id="trialForm"/);
  assert.match(page, /id="onePager"/);
  assert.match(page, /הזמן ניסוי כיתתי/);
  assert.match(page, /אין מוצר בתשלום/);
  assert.match(page, /src\/lib\/offer\.js/);
  assert.doesNotMatch(page, /checkout|stripe|paypal|תשלום עכשיו|49 ₪|רישיון כיתתי/i);
  assert.doesNotMatch(page, /סוגר פערים|מחקרים מוכיחים|טיפול ADHD/);
});
