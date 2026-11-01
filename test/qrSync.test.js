const test = require('node:test');
const assert = require('node:assert/strict');
const qrSync = require('../src/lib/qrSync');
const teacherStore = require('../src/lib/teacherStore');

function fakeStorage() {
  const map = {};
  return {
    getItem: (k) => (Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null),
    setItem: (k, v) => { map[k] = String(v); },
    removeItem: (k) => { delete map[k]; }
  };
}

test('generateQrSvg creates a valid svg string with crispEdges and rects', () => {
  const svg = qrSync.generateQrSvg('https://example.com/test');
  assert.match(svg, /<svg xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
  assert.match(svg, /viewBox="0 0/);
  assert.match(svg, /shape-rendering="crispEdges"/);
  assert.match(svg, /<rect x="/);
});

test('packStudent and packRoster round-trip via unpackPayload', () => {
  const mem = fakeStorage();
  teacherStore.upsertStudent('class-1', 'נועה', mem);
  teacherStore.setStudentGrade('class-1', 'נועה', 'ב', mem);
  const p1 = qrSync.packStudent('נועה', 'class-1', mem);
  assert.ok(p1.hash.startsWith('#import='));
  const u1 = qrSync.unpackPayload(p1.url);
  assert.equal(u1.ok, true);
  assert.equal(u1.data.student.name, 'נועה');
  assert.equal(u1.data.student.grade, 'ב');

  const p2 = qrSync.packRoster('class-1', mem);
  const u2 = qrSync.unpackPayload(p2.hash);
  assert.equal(u2.ok, true);
  assert.ok(u2.data.students['נועה']);
});

test('importPayload imports student and roster or rejects corrupted data', () => {
  const memSrc = fakeStorage();
  teacherStore.upsertStudent('c-1', 'יונתן', memSrc);
  teacherStore.setStudentGrade('c-1', 'יונתן', 'ג', memSrc);
  const p1 = qrSync.packStudent('יונתן', 'c-1', memSrc);

  const memDest = fakeStorage();
  const res1 = qrSync.importPayload(p1.hash, 'c-dest', memDest);
  assert.equal(res1.ok, true);
  assert.equal(res1.type, 'student');
  assert.equal(teacherStore.loadRoster('c-dest', memDest).students['יונתן'].grade, 'ג');

  const p2 = qrSync.packRoster('c-1', memSrc);
  const res2 = qrSync.importPayload(p2.hash, 'c-1', memDest);
  assert.equal(res2.ok, true);
  assert.equal(res2.type, 'roster');

  assert.equal(qrSync.importPayload('#import=corrupted!').ok, false);
  assert.equal(qrSync.importPayload('{}').ok, false);
});
