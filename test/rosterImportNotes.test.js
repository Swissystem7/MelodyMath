// A teacher moves the roster JSON between two school tablets. Her own notes
// have to ride along — the parent letter quotes the last one, so losing them
// in the import empties the letter without anyone noticing.
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

const NOTE = 'היום ספרה על האצבעות';

function sourceJson() {
  const src = memory();
  const sess = store.startSession('שילוב', 'תמר', 'class', src);
  store.addItem('שילוב', 'תמר', sess.id, { skill: 'מנייה', prompt: '3', correct: true }, src);
  assert.ok(store.addNote('שילוב', 'תמר', NOTE, src));
  return store.exportRoster('שילוב', src);
}

test('import into an empty tablet keeps the teacher note', () => {
  const json = sourceJson();
  const dest = memory();
  const res = store.importRoster('שילוב', json, dest);
  assert.equal(res.ok, true);
  assert.equal(res.added, 1);
  assert.equal(res.notes, 1);
  const notes = store.listNotes(store.getStudent('שילוב', 'תמר', dest));
  assert.equal(notes.length, 1);
  assert.equal(notes[0].text, NOTE);
  assert.ok(Number.isFinite(notes[0].at));
  // the note survives a reload from storage, not just the in-memory object
  assert.equal(store.getStudent('שילוב', 'תמר', dest).sessions.length, 1);
});

test('importing the same file twice does not duplicate the note', () => {
  const json = sourceJson();
  const dest = memory();
  store.importRoster('שילוב', json, dest);
  const again = store.importRoster('שילוב', json, dest);
  assert.equal(again.ok, true);
  assert.equal(again.notes, 0);
  assert.equal(store.listNotes(store.getStudent('שילוב', 'תמר', dest)).length, 1);
});

test('merging into a tablet that already has the student keeps both notes', () => {
  const json = sourceJson();
  const dest = memory();
  store.upsertStudent('שילוב', 'תמר', dest);
  store.addNote('שילוב', 'תמר', 'בכיתה השנייה ביקשה עוד זמן', dest);
  const res = store.importRoster('שילוב', json, dest);
  assert.equal(res.ok, true);
  assert.equal(res.added, 0);
  const texts = store.listNotes(store.getStudent('שילוב', 'תמר', dest)).map((n) => n.text);
  assert.equal(texts.length, 2);
  assert.ok(texts.includes('בכיתה השנייה ביקשה עוד זמן'));
  assert.ok(texts.includes(NOTE));
  // re-importing on top of the merge stays at two
  store.importRoster('שילוב', json, dest);
  assert.equal(store.listNotes(store.getStudent('שילוב', 'תמר', dest)).length, 2);
});

test('the parent letter on the second tablet quotes the imported note', () => {
  const json = sourceJson();
  const dest = memory();
  store.importRoster('שילוב', json, dest);
  const letter = store.buildParentNote(store.getStudent('שילוב', 'תמר', dest), { classCode: 'שילוב' });
  assert.equal(letter.observation, NOTE);
  assert.ok(store.renderParentNoteHtml(letter).includes('הערת המורה'));
});

test('import ignores malformed note rows instead of carrying them over', () => {
  const dest = memory();
  const raw = JSON.stringify({
    students: {
      'תמר': {
        name: 'תמר',
        sessions: [],
        notes: [null, 'סתם מחרוזת', { at: 5 }, { at: 7, text: '   ' }, { at: 9, text: '  שתי   מילים  ' }],
      },
    },
  });
  assert.equal(store.importRoster('שילוב', raw, dest).ok, true);
  const notes = store.listNotes(store.getStudent('שילוב', 'תמר', dest));
  assert.equal(notes.length, 1);
  assert.equal(notes[0].text, 'שתי מילים');
  assert.equal(notes[0].at, 9);
});

test('import survives a notes field that is not an array', () => {
  const dest = memory();
  const raw = JSON.stringify({ students: { 'תמר': { name: 'תמר', sessions: [], notes: 'oops' } } });
  assert.equal(store.importRoster('שילוב', raw, dest).ok, true);
  assert.deepEqual(store.listNotes(store.getStudent('שילוב', 'תמר', dest)), []);
});
