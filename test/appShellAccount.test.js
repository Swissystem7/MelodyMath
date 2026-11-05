// MM-717 — local roles + picture PIN (src/lib/account/account.js).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const A = require('../src/lib/account/account.js');

function memStorage(seed) {
  const m = new Map(Object.entries(seed || {}));
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
}
function fakeWin() {
  const h = [];
  return { addEventListener: (t, fn) => { if (t === 'storage') h.push(fn); }, fire: (e) => h.forEach((fn) => fn(e)) };
}

test('current() is null until a role is chosen, then follows the contract shape', () => {
  const ls = memStorage({ 'mm-who-v1': JSON.stringify({ classCode: 'שילוב-ג', name: 'נועה' }) });
  const acc = A.createAccount(ls, null);
  assert.equal(acc.current(), null);
  assert.equal(acc.setRole('student'), true);
  assert.deepEqual(acc.current(), { id: 'student:שילוב-ג:נועה', name: 'נועה', role: 'student', classCode: 'שילוב-ג' });
  acc.setRole('teacher');
  assert.equal(acc.current().role, 'teacher');
  assert.equal(acc.current().classCode, 'שילוב-ג');
  acc.setRole('parent');
  assert.equal(acc.current().role, 'parent');
  for (const r of ['student', 'teacher', 'parent']) {
    acc.setRole(r);
    assert.deepEqual(Object.keys(acc.current()).sort(), ['classCode', 'id', 'name', 'role']);
  }
});

test('a student with no name yet is a guest, and unknown roles are refused', () => {
  const acc = A.createAccount(memStorage(), null);
  assert.equal(acc.setRole('admin'), false);
  assert.equal(acc.current(), null);
  acc.setRole('student');
  assert.deepEqual(acc.current(), { id: 'student:guest', name: '', role: 'student', classCode: '' });
});

test('the role survives a new instance (reload) and clearRole forgets it', () => {
  const ls = memStorage();
  A.createAccount(ls, null).setRole('teacher');
  const again = A.createAccount(ls, null);
  assert.equal(again.current().role, 'teacher');
  again.clearRole();
  assert.equal(A.createAccount(ls, null).current(), null);
});

test('onChange fires on a real change only, survives a throwing listener, and unsubscribes', () => {
  const ls = memStorage();
  const acc = A.createAccount(ls, null);
  const seen = [];
  acc.onChange(() => { throw new Error('bad listener'); });
  const off = acc.onChange((c) => seen.push(c && c.role));
  acc.setRole('student');
  acc.setRole('student');
  ls.setItem('mm-who-v1', JSON.stringify({ classCode: 'x', name: 'דנה' }));
  acc.notify();
  off();
  acc.setRole('teacher');
  assert.deepEqual(seen, ['student', 'student']);
});

test('a storage event from another tab notifies listeners', () => {
  const ls = memStorage();
  const win = fakeWin();
  const acc = A.createAccount(ls, win);
  let calls = 0;
  acc.onChange(() => { calls++; });
  ls.setItem('mm-account-v1', JSON.stringify({ v: 1, role: 'parent' }));
  win.fire({ key: 'mm-account-v1' });
  win.fire({ key: 'unrelated' });
  assert.equal(calls, 1);
});

test('picture PIN: right pictures pass, wrong ones and wrong length fail, nothing stored in clear', () => {
  const ls = memStorage();
  const acc = A.createAccount(ls, null);
  const pin = ['🐶', '🐱', '🦊', '🐸'];
  assert.equal(acc.setPin('c1', 'נועה', ['🐶']), false);
  assert.equal(acc.setPin('c1', 'נועה', ['🐶', '🐱', '🦊', 'X']), false);
  assert.equal(acc.setPin('c1', 'נועה', pin), true);
  assert.equal(acc.hasPin('c1', 'נועה'), true);
  assert.equal(acc.checkPin('c1', 'נועה', pin), true);
  assert.equal(acc.checkPin('c1', 'נועה', ['🐱', '🐶', '🦊', '🐸']), false);
  assert.equal(acc.checkPin('c1', 'נועה', pin.slice(0, 3)), false);
  const raw = ls.getItem('mm-account-pin-v1');
  assert.ok(!pin.some((p) => raw.includes(p)), 'pictures are stored in clear');
  acc.clearPin('c1', 'נועה');
  assert.equal(acc.hasPin('c1', 'נועה'), false);
});

test('needsPin: asked when switching to a child with a PIN, not for the same child or a teacher', () => {
  const ls = memStorage({ 'mm-who-v1': JSON.stringify({ classCode: 'c1', name: 'דנה' }) });
  const acc = A.createAccount(ls, null);
  acc.setPin('c1', 'נועה', ['🐶', '🐱', '🦊', '🐸']);
  assert.equal(acc.needsPin('c1', 'נועה'), true);
  assert.equal(acc.needsPin('c1', 'דנה'), false);
  acc.setRole('teacher');
  assert.equal(acc.needsPin('c1', 'נועה'), false);
  acc.setRole('student');
  ls.setItem('mm-who-v1', JSON.stringify({ classCode: 'c1', name: 'נועה' }));
  assert.equal(acc.needsPin('c1', 'נועה'), false);
});

test('index.html loads the account module, sw.js precaches it, and a teacher or parent role waits for the adult gate', () => {
  const root = path.join(__dirname, '..');
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
  assert.match(html, /<script src="src\/lib\/account\/account\.js"><\/script>/);
  assert.match(sw, /'\.\/src\/lib\/account\/account\.js'/);
  for (const r of ['student', 'teacher', 'parent']) assert.match(html, new RegExp('data-role="' + r + '"'));
  assert.match(html, /mmRoleAfterGate\(adultOk\)/);
  assert.match(html, /mmPinGate\(code,name\)/);
});
