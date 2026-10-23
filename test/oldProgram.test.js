// #591: ד׳–ו׳ still learn by the 2006 programme in תשפ"ז, so every app row of
// those grades has a second mapping to it — verbatim quotes with a PDF page,
// or an explicit 'לא אומת'. The quotes themselves are re-checked against the
// PDFs by tools/verify-old-program-quotes.js (needs network).
const test = require('node:test');
const assert = require('node:assert/strict');
const cur = require('../src/lib/curriculum');
const banks = require('../src/lib/banks');
const old = require('../src/lib/curriculum/oldProgram');

const MEYDA = /^https:\/\/meyda\.education\.gov\.il\//;

test('every ד׳–ו׳ row has a 2006 entry: quotes, or an explicit unverified marker', () => {
  let rows = 0;
  old.GRADES.forEach(function (g) {
    cur.rowsForGrade(g).forEach(function (r) {
      rows += 1;
      const e = old.forTopic(g, r.topic);
      assert.ok(e, 'no 2006 entry for ' + g + '׳ ' + r.topic);
      if (e.verified) {
        assert.ok(e.old.length > 0, r.topic);
        assert.notEqual(e.label, old.UNVERIFIED_HE, r.topic);
      } else {
        assert.equal(e.old.length, 0, r.topic);
        assert.equal(e.label, old.UNVERIFIED_HE, r.topic);
      }
    });
  });
  assert.ok(rows >= 28, 'ד׳–ו׳ rows: ' + rows);
});

test('no 2006 entry points at a row the app does not have', () => {
  old.MAP.forEach(function (m) {
    assert.ok(old.GRADES.includes(m.grade), m.topic);
    assert.ok(cur.rowsForGrade(m.grade).some(function (r) { return r.topic === m.topic; }), 'stale: ' + m.grade + '׳ ' + m.topic);
  });
  const keys = old.MAP.map(function (m) { return m.grade + ':' + m.topic; });
  assert.equal(new Set(keys).size, keys.length, 'duplicate rows');
});

test('each quote names its grade PDF, heading and page on meyda.education.gov.il', () => {
  const quotes = old.allQuotes();
  assert.ok(quotes.length > 0);
  quotes.forEach(function (q) {
    assert.ok(['א', 'ב', 'ג', 'ד', 'ה', 'ו'].includes(q.grade), q.quote);
    assert.equal(typeof q.quote, 'string');
    assert.ok(q.quote.trim().length >= 4, q.quote);
    assert.ok(q.section && q.section.length > 0, q.quote);
    assert.ok(Number.isInteger(q.page) && q.page > 0, q.quote);
    assert.match(q.url, MEYDA);
    assert.ok(q.url.endsWith('kita' + (['א', 'ב', 'ג', 'ד', 'ה', 'ו'].indexOf(q.grade) + 1) + '.pdf#page=' + q.page), q.url);
  });
});

test('the sources: the programme page, its title page and the תשפ"ז notice', () => {
  assert.match(old.PAGE, /^https:\/\/pop\.education\.gov\.il\//);
  assert.match(old.TITLE_PDF, MEYDA);
  assert.match(old.STILL_OLD_PDF, MEYDA);
  assert.match(old.STILL_OLD_QUOTE, /תשפ"ז/);
  assert.ok(Number.isInteger(old.STILL_OLD_PAGE));
});

test('every ד׳–ו׳ exercise with a verified new-programme tag also has a 2006 entry', () => {
  old.GRADES.forEach(function (g) {
    banks.itemsForGrade(g).forEach(function (it) {
      const s = cur.sectionForItem(it);
      if (!s || !s.verified) return;
      assert.ok(old.forTopic(g, s.topic), g + '׳ ' + it.standard);
    });
  });
});

test('an old grade can differ from the app grade, and says so', () => {
  const primes = old.forTopic('ה', 'ראשוניים ופריקים; פירוק לגורמים; סימני התחלקות');
  assert.deepEqual(primes.oldGrades, ['ד']);
  const mean = old.forTopic('ו', 'ממוצע');
  assert.deepEqual(mean.oldGrades, ['ה']);
  assert.equal(old.forTopic('ג', 'איסוף, ארגון, דיאגרמות'), null);
});
