// check.html: pressing "start" with no student name used to only write a
// message into the status line. The field itself gave no sign it was the
// problem, and keyboard / screen-reader users stayed on the button. Now the
// field is marked aria-invalid, is described by the status line, and gets
// focus, and the mark clears once a name is typed or the check starts.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'check.html'), 'utf8');

function el() {
  const attrs = {};
  return {
    value: '', textContent: '', focused: 0,
    classList: { add() {}, remove() {} },
    setAttribute(k, v) { attrs[k] = String(v); },
    removeAttribute(k) { delete attrs[k]; },
    getAttribute(k) { return k in attrs ? attrs[k] : null; },
    focus() { this.focused++; },
  };
}

function page() {
  const src = html.match(/function start\(form\) \{[\s\S]*?\r?\n  \}\r?\n/);
  assert.ok(src, 'start(form) is defined in check.html');
  const els = {};
  const ctx = {
    run: null,
    started: 0,
    $: (id) => (els[id] = els[id] || el()),
    normalizeCode: (s) => String(s || '').trim(),
    studentLabel: (s) => String(s || '').trim(),
    checkKind: (u, f) => f,
    startSession() { ctx.started++; return { id: 's1' }; },
    saveWho() {},
    formItems: () => [],
    showItem() {},
  };
  vm.createContext(ctx);
  vm.runInContext(src[0], ctx);
  ctx.els = els;
  return ctx;
}

test('the student-name field is described by the setup status line', () => {
  assert.match(html, /<input id="studentName"[^>]*aria-describedby="setupStatus"/);
  assert.match(html, /id="setupStatus"[^>]*role="status"/);
});

test('starting with no name marks the field invalid and moves focus to it', () => {
  const p = page();
  p.$('studentName').value = '   ';
  p.start('pre');
  assert.equal(p.started, 0, 'no session is opened without a name');
  assert.equal(p.$('setupStatus').textContent, 'צריך שם או קוד תלמיד/ה.');
  assert.equal(p.$('studentName').getAttribute('aria-invalid'), 'true');
  assert.equal(p.$('studentName').focused, 1);
});

test('starting with a name clears the invalid mark', () => {
  const p = page();
  p.$('studentName').value = '';
  p.start('pre');
  p.$('studentName').value = 'נועה';
  p.start('pre');
  assert.equal(p.started, 1);
  assert.equal(p.$('studentName').getAttribute('aria-invalid'), null);
});

test('typing a name clears the invalid mark before pressing start again', () => {
  assert.match(
    html,
    /\$\('studentName'\)\.oninput = function \(\) \{\s*if \(\$\('studentName'\)\.value\.trim\(\)\) \$\('studentName'\)\.removeAttribute\('aria-invalid'\);\s*\};/
  );
});
