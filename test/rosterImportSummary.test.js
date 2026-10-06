// The import message is the only feedback a teacher gets after moving a
// roster JSON between tablets. It has to name everything importRoster did:
// notes and tasks that rode along, and rows dropped for an unusable name.
const test = require('node:test');
const assert = require('node:assert/strict');
const store = require('../src/lib/teacherStore');

function memory() {
  const m = Object.create(null);
  return {
    getItem: (k) => (k in m ? m[k] : null),
    setItem: (k, v) => { m[k] = String(v); },
    removeItem: (k) => { delete m[k]; },
  };
}

test('summarizeImport names every counter that is above zero', () => {
  const text = store.summarizeImport({ ok: true, added: 2, merged: 3, notes: 1, assignments: 4, skipped: 0 });
  assert.equal(text, 'יובא: 2 תלמידים חדשים, 3 מפגשים שמוזגו, 1 הערות מורה, 4 משימות.');
});

test('summarizeImport leaves out zero counters and says when nothing changed', () => {
  assert.equal(store.summarizeImport({ ok: true, added: 1, merged: 0, notes: 0, assignments: 0, skipped: 0 }),
    'יובא: 1 תלמידים חדשים.');
  assert.equal(store.summarizeImport({ ok: true, added: 0, merged: 0, notes: 0, assignments: 0, skipped: 0 }),
    'הקובץ נקרא, אבל לא היה בו דבר חדש למכשיר הזה.');
});

test('summarizeImport reports rows skipped for an unusable name', () => {
  const text = store.summarizeImport({ ok: true, added: 0, merged: 0, notes: 0, assignments: 0, skipped: 2 });
  assert.ok(text.includes('2 שורות לא תקינות (שם או מבנה) לא יובאו.'));
  assert.match(text, /^הקובץ נקרא/);
});

test('summarizeImport keeps the two error messages for a bad file', () => {
  assert.equal(store.summarizeImport({ ok: false, error: 'not-json' }), 'הקובץ אינו JSON תקין.');
  assert.equal(store.summarizeImport({ ok: false, error: 'shape' }), 'מבנה הקובץ לא מתאים.');
  assert.equal(store.summarizeImport(null), 'מבנה הקובץ לא מתאים.');
});

test('summarizeImport agrees with a real importRoster round trip', () => {
  const src = memory();
  store.upsertStudent('שילוב', 'תמר', src);
  store.addNote('שילוב', 'תמר', 'מתקדמת יפה', src);
  const raw = JSON.parse(store.exportRoster('שילוב', src));
  raw.students = Object.assign(Object.create(null), raw.students);
  raw.students['__proto__'] = { name: '__proto__', sessions: [] };
  const dst = memory();
  const res = store.importRoster('שילוב', JSON.stringify(raw), dst);
  assert.equal(res.ok, true);
  assert.equal(store.summarizeImport(res), 'יובא: 1 תלמידים חדשים, 1 הערות מורה. 1 שורות לא תקינות (שם או מבנה) לא יובאו.');
});
