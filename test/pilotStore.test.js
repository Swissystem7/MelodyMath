const test = require('node:test');
const assert = require('node:assert/strict');
const MMPilotStore = require('../pilot/js/store.js');

function createMockStorage(initialData = {}) {
  const store = { ...initialData };
  const calls = { getItem: [], setItem: [], removeItem: [] };
  return {
    calls,
    getItem(k) { calls.getItem.push(k); return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
    setItem(k, v) { calls.setItem.push({ key: k, value: String(v) }); store[k] = String(v); },
    removeItem(k) { calls.removeItem.push(k); delete store[k]; }
  };
}

// 1. In-memory storage fallback: create() without an argument stores and reads keys in memory.
test('in-memory storage fallback stores and reads keys in memory', () => {
  const store = MMPilotStore.create();
  assert.equal(store.session(), null);
  assert.deepEqual(store.assignments(), []);
  assert.equal(store.lastUnit(), null);
  assert.equal(store.classSize(), 0);

  store.signIn('acc-inmem');
  assert.equal(store.session()?.accountId, 'acc-inmem');
  store.setLastUnit('unit-memory-1');
  assert.equal(store.lastUnit(), 'unit-memory-1');
  store.setClassSize(15);
  assert.equal(store.classSize(), 15);

  const asg = store.assign({ unitId: 'u-1', studentId: 's-1', by: 'teacher', note: 'test note' });
  assert.equal(asg.studentId, 's-1');
  assert.equal(store.assignments().length, 1);
  assert.equal(store.assignmentsFor('s-1').length, 1);

  store.saveProgress('s-1', 'u-1', { lessonDone: true, index: 2 });
  assert.equal(store.progress('s-1', 'u-1').lessonDone, true);
  assert.equal(store.progress('s-1', 'u-1').index, 2);

  const isolatedStore = MMPilotStore.create();
  assert.equal(isolatedStore.session(), null);
  assert.deepEqual(isolatedStore.assignments(), []);
  assert.equal(isolatedStore.lastUnit(), null);
  assert.equal(isolatedStore.classSize(), 0);
  assert.equal(isolatedStore.progress('s-1', 'u-1').lessonDone, false);
});

// 2. Custom / mock storage: verify interaction with storage implementing getItem, setItem, removeItem.
test('custom/mock storage interactions with getItem, setItem, removeItem', () => {
  const mock = createMockStorage();
  const store = MMPilotStore.create(mock);

  assert.equal(store.session(), null);
  assert.ok(mock.calls.getItem.includes(store.KEYS.session));

  store.signIn('teacher-42');
  const lastSet = mock.calls.setItem[mock.calls.setItem.length - 1];
  assert.equal(lastSet.key, store.KEYS.session);
  const parsed = JSON.parse(lastSet.value);
  assert.equal(parsed.accountId, 'teacher-42');
  assert.equal(typeof parsed.at, 'number');

  store.signOut();
  assert.ok(mock.calls.removeItem.includes(store.KEYS.session));
  assert.equal(store.session(), null);

  store.setLastUnit('unit-mock-alpha');
  assert.equal(mock.calls.setItem[mock.calls.setItem.length - 1].key, store.KEYS.lastUnit);
  assert.equal(store.lastUnit(), 'unit-mock-alpha');

  store.resetAll();
  for (const k of Object.values(store.KEYS)) {
    assert.ok(mock.calls.removeItem.includes(k), `Expected removeItem for ${k}`);
  }
});

// 3. Session: signIn(accountId) records { accountId, at }, session() retrieves it, signOut() removes it.
test('session records accountId and at timestamp, retrieves it, and signOut removes it', () => {
  const store = MMPilotStore.create();
  assert.equal(store.session(), null);

  const before = Date.now();
  store.signIn('teacher-77');
  const after = Date.now();

  const sess = store.session();
  assert.ok(sess, 'Session should exist after signIn');
  assert.equal(sess.accountId, 'teacher-77');
  assert.ok(sess.at >= before && sess.at <= after, 'Session "at" timestamp should match');

  store.signIn('student-12');
  assert.equal(store.session().accountId, 'student-12');

  store.signOut();
  assert.equal(store.session(), null);
});

// 4. Assignments: assign({ unitId, studentId, by, note }) returns an object with a generated id,
//    createdAt timestamp, unitId, studentId, by, and note sliced to 140 characters.
//    Verify assignments() returns all rows and assignmentsFor(studentId) filters by studentId.
test('assignments creates rows with expected attributes and filters by studentId', () => {
  const store = MMPilotStore.create();
  assert.deepEqual(store.assignments(), []);

  const longNote = 'A'.repeat(200);
  const before = Date.now();
  const row1 = store.assign({ unitId: 'unit-101', studentId: 'stud-1', by: 'teacher-dan', note: longNote });
  const after = Date.now();

  assert.match(row1.id, /^as-[0-9a-z]+-0$/);
  assert.equal(row1.unitId, 'unit-101');
  assert.equal(row1.studentId, 'stud-1');
  assert.equal(row1.by, 'teacher-dan');
  assert.equal(row1.note.length, 140);
  assert.equal(row1.note, 'A'.repeat(140));
  assert.ok(row1.createdAt >= before && row1.createdAt <= after);

  const row2 = store.assign({ unitId: 'unit-102', studentId: 'stud-2', by: 'teacher-dan', note: undefined });
  assert.match(row2.id, /^as-[0-9a-z]+-1$/);
  assert.equal(row2.note, '');

  const row3 = store.assign({ unitId: 'unit-103', studentId: 'stud-1', by: 'teacher-dan', note: 'Short note' });
  assert.equal(row3.note, 'Short note');

  const all = store.assignments();
  assert.equal(all.length, 3);
  assert.deepEqual(all.map((a) => a.id), [row1.id, row2.id, row3.id]);

  const stud1List = store.assignmentsFor('stud-1');
  assert.equal(stud1List.length, 2);
  assert.deepEqual(stud1List.map((a) => a.id), [row1.id, row3.id]);

  const stud2List = store.assignmentsFor('stud-2');
  assert.equal(stud2List.length, 1);
  assert.equal(stud2List[0].id, row2.id);

  assert.deepEqual(store.assignmentsFor('stud-unknown'), []);

  const corruptMock = createMockStorage({ [store.KEYS.assignments]: JSON.stringify({ not: 'an array' }) });
  const corruptStore = MMPilotStore.create(corruptMock);
  assert.deepEqual(corruptStore.assignments(), []);
});

// 5. Class size: classSize() defaults to 0. setClassSize(n) stores the integer value clamped between 2
//    and CLASS_MAX (40). Non-numbers, NaN, values less than 2, or negative numbers set/return 0.
test('classSize defaults to 0 and clamps between 2 and CLASS_MAX (40), setting 0 for invalid inputs', () => {
  const store = MMPilotStore.create();
  assert.equal(store.CLASS_MAX, 40);
  assert.equal(store.classSize(), 0);

  // In range [2, 40]
  store.setClassSize(2);
  assert.equal(store.classSize(), 2);
  store.setClassSize(25);
  assert.equal(store.classSize(), 25);
  store.setClassSize(40);
  assert.equal(store.classSize(), 40);

  // Numbers with fractions are floored
  store.setClassSize(18.9);
  assert.equal(store.classSize(), 18);

  // Strings containing numbers
  store.setClassSize('32');
  assert.equal(store.classSize(), 32);

  // Clamped to CLASS_MAX
  store.setClassSize(41);
  assert.equal(store.classSize(), 40);
  store.setClassSize(999);
  assert.equal(store.classSize(), 40);

  // Values less than 2
  store.setClassSize(1);
  assert.equal(store.classSize(), 0);
  store.setClassSize(0);
  assert.equal(store.classSize(), 0);
  store.setClassSize(-5);
  assert.equal(store.classSize(), 0);

  // Non-numeric, NaN, null, undefined
  store.setClassSize(NaN);
  assert.equal(store.classSize(), 0);
  store.setClassSize('not a number');
  assert.equal(store.classSize(), 0);
  store.setClassSize(null);
  assert.equal(store.classSize(), 0);
  store.setClassSize(undefined);
  assert.equal(store.classSize(), 0);

  // Out of range in raw storage defaults to 0
  const mockOver = createMockStorage({ [store.KEYS.classSize]: JSON.stringify(50) });
  assert.equal(MMPilotStore.create(mockOver).classSize(), 0);
  const mockUnder = createMockStorage({ [store.KEYS.classSize]: JSON.stringify(1) });
  assert.equal(MMPilotStore.create(mockUnder).classSize(), 0);
});

// 6. Last unit: setLastUnit(id) and lastUnit() store and retrieve the string identifier.
test('setLastUnit and lastUnit store and retrieve string identifiers', () => {
  const store = MMPilotStore.create();
  assert.equal(store.lastUnit(), null);

  store.setLastUnit('unit-fractions-step1');
  assert.equal(store.lastUnit(), 'unit-fractions-step1');

  store.setLastUnit('unit-multiplication-step2');
  assert.equal(store.lastUnit(), 'unit-multiplication-step2');
});

// 7. Progress and checkRow validation: progress(studentId, unitId) returns default structure when unset;
//    saveProgress persists state; valid pre/post/later rows require finite score and total > 0,
//    while invalid or malformed check rows normalize to null.
test('progress returns default structure when unset and persists valid states across multiple students', () => {
  const store = MMPilotStore.create();
  const defaultProg = store.progress('s-1', 'u-1');
  assert.deepEqual(defaultProg, {
    lessonDone: false,
    index: 0,
    results: {},
    completedAt: null,
    startedAt: null,
    pre: null,
    post: null,
    later: null
  });

  const rowData = {
    lessonDone: true,
    index: 4,
    results: { q1: true, q2: false },
    completedAt: 1700000000000,
    startedAt: 1699999900000,
    pre: { score: 3, total: 5, answers: { 0: 'a' }, at: 1699999910000 },
    post: { score: 5, total: 5, answers: { 0: 'b' }, at: 1700000000000 },
    later: null
  };
  assert.equal(store.saveProgress('s-1', 'u-1', rowData), true);

  assert.deepEqual(store.progress('s-1', 'u-1'), rowData);

  store.saveProgress('s-2', 'u-1', { lessonDone: false, index: 1 });
  store.saveProgress('s-1', 'u-2', { lessonDone: true, index: 2 });
  assert.equal(store.progress('s-2', 'u-1').lessonDone, false);
  assert.equal(store.progress('s-2', 'u-1').index, 1);
  assert.equal(store.progress('s-1', 'u-2').lessonDone, true);
  assert.equal(store.progress('s-1', 'u-1').index, 4);

  const arrayMock = createMockStorage({ [store.KEYS.progress]: JSON.stringify(['not', 'an', 'object']) });
  assert.deepEqual(MMPilotStore.create(arrayMock).progress('s-1', 'u-1'), defaultProg);
});

test('checkRow validation requires finite score and total > 0, normalizing invalid check rows to null', () => {
  const store = MMPilotStore.create();

  store.saveProgress('s-1', 'u-1', {
    pre: { score: 0, total: 10 },
    post: { score: '4', total: '5', answers: { 1: 'ok' }, at: 9999 },
    later: { score: 2.5, total: 3 }
  });
  const p1 = store.progress('s-1', 'u-1');
  assert.deepEqual(p1.pre, { score: 0, total: 10, answers: {}, at: null });
  assert.deepEqual(p1.post, { score: 4, total: 5, answers: { 1: 'ok' }, at: 9999 });
  assert.deepEqual(p1.later, { score: 2.5, total: 3, answers: {}, at: null });

  const invalidChecks = [
    null,
    undefined,
    'passed',
    123,
    true,
    {},
    { score: 3 },
    { total: 5 },
    { score: 3, total: 0 },
    { score: 3, total: -2 },
    { score: 'NaN', total: 5 },
    { score: 'Infinity', total: 5 },
    { score: '-Infinity', total: 5 },
    { score: 'abc', total: 5 },
    { score: 4, total: 'bad' }
  ];

  for (const invalid of invalidChecks) {
    store.saveProgress('s-test', 'u-test', { pre: invalid, post: invalid, later: invalid });
    const p = store.progress('s-test', 'u-test');
    assert.equal(p.pre, null, `Expected null for invalid checkRow ${JSON.stringify(invalid)}`);
    assert.equal(p.post, null, `Expected null for invalid checkRow ${JSON.stringify(invalid)}`);
    assert.equal(p.later, null, `Expected null for invalid checkRow ${JSON.stringify(invalid)}`);
  }

  store.saveProgress('s-norm', 'u-norm', {
    lessonDone: 1,
    index: '7',
    results: null,
    completedAt: undefined,
    startedAt: undefined
  });
  const pNorm = store.progress('s-norm', 'u-norm');
  assert.equal(pNorm.lessonDone, true);
  assert.equal(pNorm.index, 7);
  assert.deepEqual(pNorm.results, {});
  assert.equal(pNorm.completedAt, null);
  assert.equal(pNorm.startedAt, null);
});

// 8. Error handling and robustness: read fallback when getItem returns malformed JSON;
//    write returns false when setItem throws (e.g. QuotaExceededError);
//    signOut and resetAll handle removeItem throwing without unhandled exceptions.
test('read handles malformed JSON without crashing and returns fallbacks', () => {
  const malformedStorage = {
    getItem() { return '{ this is not valid json :'; },
    setItem() {},
    removeItem() {}
  };
  const store = MMPilotStore.create(malformedStorage);

  assert.equal(store.session(), null);
  assert.deepEqual(store.assignments(), []);
  assert.equal(store.lastUnit(), null);
  assert.equal(store.classSize(), 0);
  assert.deepEqual(store.progress('s1', 'u1'), {
    lessonDone: false,
    index: 0,
    results: {},
    completedAt: null,
    startedAt: null,
    pre: null,
    post: null,
    later: null
  });
});

test('write returns false when setItem throws (e.g. QuotaExceededError)', () => {
  const throwingStorage = {
    getItem() { return null; },
    setItem() { const err = new Error('QuotaExceededError'); err.name = 'QuotaExceededError'; throw err; },
    removeItem() {}
  };
  const store = MMPilotStore.create(throwingStorage);

  assert.equal(store.saveProgress('s-1', 'u-1', { lessonDone: true }), false);
  assert.equal(store.setClassSize(10), false);

  assert.doesNotThrow(() => {
    store.signIn('acc-fail');
    store.setLastUnit('unit-fail');
    store.assign({ unitId: 'u-fail', studentId: 's-fail' });
  });
});

test('signOut and resetAll handle removeItem throwing without unhandled exceptions', () => {
  const throwingRemoveStorage = {
    getItem() { return null; },
    setItem() {},
    removeItem() { const err = new Error('The operation is insecure'); err.name = 'SecurityError'; throw err; }
  };
  const store = MMPilotStore.create(throwingRemoveStorage);

  assert.doesNotThrow(() => { store.signOut(); });
  assert.doesNotThrow(() => { store.resetAll(); });
});

// 9. Reset: resetAll() removes all keys defined in KEYS (session, assignments, progress, lastUnit, classSize).
test('resetAll removes all keys defined in KEYS', () => {
  const mock = createMockStorage();
  const store = MMPilotStore.create(mock);

  store.signIn('teacher-reset');
  store.assign({ unitId: 'u-1', studentId: 's-1', by: 'me', note: 'work' });
  store.saveProgress('s-1', 'u-1', { lessonDone: true, index: 2 });
  store.setLastUnit('unit-1');
  store.setClassSize(25);

  assert.ok(store.session());
  assert.equal(store.assignments().length, 1);
  assert.equal(store.progress('s-1', 'u-1').lessonDone, true);
  assert.equal(store.lastUnit(), 'unit-1');
  assert.equal(store.classSize(), 25);

  store.resetAll();

  for (const key of Object.values(store.KEYS)) {
    assert.equal(mock.getItem(key), null);
    assert.ok(mock.calls.removeItem.includes(key), `Expected removeItem for ${key}`);
  }

  assert.equal(store.session(), null);
  assert.deepEqual(store.assignments(), []);
  assert.equal(store.progress('s-1', 'u-1').lessonDone, false);
  assert.equal(store.lastUnit(), null);
  assert.equal(store.classSize(), 0);
});
