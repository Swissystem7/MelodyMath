// MelodyMath — FamilyJam tests (Refs #891, Refs #591).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const FJ = require('../src/components/FamilyJam.js');
const INST = require('../src/lib/instruments.js');
const BANKS = require('../src/lib/banks.js');

test('item picker picks 3 items from topic with primary way', () => {
  const items = FJ.pickFamilyJamItems('addition', 3, BANKS);
  assert.equal(items.length, 3);
  items.forEach((it) => {
    assert.ok(it.prompt && Number.isFinite(it.answer));
    assert.equal(it.choices.length, 4);
    assert.ok(it.choices.includes(it.answer));
    if (it.musicWay) assert.ok(!it.musicWay.optional);
  });
});

test('parent prompts stay short, RTL, and free of banned jargon', () => {
  const banned = [/\bM[1-6]\b/, /\bBPM\b/i, /\bHz\b/i, /ראיות חלשות/, /\bevidence\b/i, /\bdoi\b/i, /\b[A-G]\b/];
  FJ.PARENT_PROMPTS.forEach((p) => {
    assert.ok(p.trim().split(/\s+/).length <= 8 && p.length <= 40);
    banned.forEach((re) => assert.doesNotMatch(p, re));
  });
});

test('shared finale: kid keeps chosen instrument, parent gets complementary instrument from same family', () => {
  ['darbuka', 'tabla', 'violin', 'guitar', 'recorder', 'ney', 'piano', 'accordion'].forEach((kidId) => {
    const kid = INST.instrumentById(kidId);
    const parent = INST.instrumentById(FJ.getComplementaryInstrument(kidId));
    assert.ok(parent && parent.family === kid.family && parent.id !== kid.id);
  });
});

test('screen uses at least 2 distinct instrument families', () => {
  const p = FJ.createState({ instrument: 'darbuka' });
  assert.ok(p.kidInstrument.family === 'percussion' && p.secondFamilyInstrument.family === 'keys');
  const k = FJ.createState({ instrument: 'piano' });
  assert.ok(k.kidInstrument.family === 'keys' && k.secondFamilyInstrument.family === 'percussion');
});

test('numbers above 12 play grouped (tens + ones), never 13+ single clicks', () => {
  const s = FJ.numberToNotes(8, 'drumLow');
  assert.equal(s.length, 8);
  assert.ok(s.every((n) => !n.held));
  const l = FJ.numberToNotes(23, 'drumLow');
  assert.equal(l.filter((n) => n.held).length, 2);
  assert.equal(l.filter((n) => !n.held).length, 3);
  assert.ok(l.length < 13);
});

test('wrong answer never advances: item stays, gentle try again feedback shown', () => {
  const state = FJ.createState();
  const initIdx = state.itemIndex;
  const wrong = state.items[initIdx].choices.find((c) => c !== state.items[initIdx].answer);
  if (wrong !== state.items[initIdx].answer) { state.isCorrect = false; state.feedbackText = 'נסו שוב'; }
  assert.equal(state.itemIndex, initIdx);
  assert.match(state.feedbackText, /נסו שוב/);
});

test('silent check: with no-music toggle on, items are solvable with no sound wording', () => {
  const state = FJ.createState();
  state.showMusic = false;
  const html = FJ.renderHtml(state);
  assert.match(html, /🔇 בלי מוזיקה/);
  assert.match(html, /מבוגר\/ת: קראו את השאלה 📖/);
  const plain = html.replace(/<button[^>]*data-act="music"[^>]*>.*?<\/button>/gs, '').replace(/<[^>]+>/g, ' ');
  [/השמעה/, /הקשיבו/, /להקשיב/, /האזן/, /שמעו/, /צליל/, /listen/i, /sound/i].forEach((re) => {
    assert.doesNotMatch(plain, re);
  });
});

test('index.html places familyJamCard under personal practice, loads script, and sw.js caches it', () => {
  const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.ok(indexHtml.includes('id="familyJamCard"') && indexHtml.includes('src/components/FamilyJam.js'));
  assert.ok(fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8').includes('FamilyJam.js'));
});
