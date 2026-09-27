const test = require('node:test');
const assert = require('node:assert');
const offer = require('../src/lib/offer.js');

test('normalizeTrialRequest escapes HTML meta-characters in string fields before returning them', () => {
  const raw = {
    teacher: '<script>alert("teacher")</script>',
    role: 'Teacher & "Coordinator"',
    school: '<img src=x onerror=\'alert("school")\'>',
    grade: 'Grade <1> & "2"',
    principal: '<script>alert("principal")</script>',
    principalEmail: '<principal@school.org>',
    replyEmail: '<teacher@school.org>',
  };

  const normalized = offer.normalizeTrialRequest(raw);

  assert.strictEqual(
    normalized.teacher,
    '&lt;script&gt;alert(&quot;teacher&quot;)&lt;/script&gt;'
  );
  assert.strictEqual(
    normalized.role,
    'Teacher &amp; &quot;Coordinator&quot;'
  );
  assert.strictEqual(
    normalized.school,
    '&lt;img src=x onerror=&#39;alert(&quot;school&quot;)&#39;&gt;'
  );
  assert.strictEqual(
    normalized.grade,
    'Grade &lt;1&gt; &amp; &quot;2&quot;'
  );
  assert.strictEqual(
    normalized.principal,
    '&lt;script&gt;alert(&quot;principal&quot;)&lt;/script&gt;'
  );
  assert.strictEqual(
    normalized.principalEmail,
    '&lt;principal@school.org&gt;'
  );
  assert.strictEqual(
    normalized.replyEmail,
    '&lt;teacher@school.org&gt;'
  );
});

test('normalizeTrialRequest preserves default role and handles empty string inputs safely', () => {
  const normalized = offer.normalizeTrialRequest({});
  assert.strictEqual(normalized.teacher, '');
  assert.strictEqual(normalized.role, 'מחנכת שילוב');
  assert.strictEqual(normalized.school, '');
  assert.strictEqual(normalized.grade, '');
  assert.strictEqual(normalized.groupSize, 1);
  assert.strictEqual(normalized.principal, '');
  assert.strictEqual(normalized.principalEmail, '');
  assert.strictEqual(normalized.replyEmail, '');
});

test('renderOnePagerHtml escapes HTML characters without double-escaping when rendered for DOM', () => {
  const raw = {
    teacher: '<script>alert(1)</script>',
    role: 'Teacher & Specialist',
    school: '<b>School</b>',
    grade: '<img src=1>',
  };

  const html = offer.renderOnePagerHtml(raw);

  assert.ok(!html.includes('<script>'), 'HTML output must not include raw <script>');
  assert.ok(!html.includes('<b>School</b>'), 'HTML output must not include raw <b>School</b>');
  assert.ok(!html.includes('<img src=1>'), 'HTML output must not include raw <img>');
  assert.ok(html.includes('&lt;script&gt;alert(1)&lt;/script&gt;'), 'HTML output must contain escaped script tag');
  assert.ok(html.includes('Teacher &amp; Specialist'), 'HTML output must contain escaped ampersand');
  assert.ok(!html.includes('&amp;amp;'), 'HTML output must not double-escape ampersands');
  assert.ok(!html.includes('&amp;lt;'), 'HTML output must not double-escape <');

  const normalized = offer.normalizeTrialRequest(raw);
  const htmlFromNormalized = offer.renderOnePagerHtml(normalized);
  assert.strictEqual(htmlFromNormalized, html, 'renderOnePagerHtml should produce identical output for normalized inputs');
});
