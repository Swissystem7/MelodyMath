// #671 / #693 (6): the elementary home covers grades א׳–ו׳ and says so, and the
// child-facing copy carries no middle-school topics, product jargon or age-inappropriate math.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const banks = require('../src/lib/banks.js');

test('all inline scripts in index.html compile without SyntaxError', () => {
  const scriptRegex = /<script(?![^>]*src=)([^>]*)>([\s\S]*?)<\/script>/gi;
  let match;
  let count = 0;
  while ((match = scriptRegex.exec(indexHtml)) !== null) {
    const code = match[2];
    count++;
    assert.doesNotThrow(() => {
      new vm.Script(code);
    }, 'Inline script ' + count + ' has syntax errors');
  }
  assert.ok(count > 0, 'at least one inline script found');
});

test('index.html renders elementary grade buttons א׳ through ו׳ in #gradePick', () => {
  const fnMatch = indexHtml.match(/const GRADE_NOTE[\s\S]*?function paintGrade\(\)\{[\s\S]*?\n\}/);
  assert.ok(fnMatch, 'paintGrade found in index.html');

  const elements = {
    gradePick: {
      innerHTML: '',
      querySelectorAll() { return []; }
    },
    gradeNote: { textContent: '' },
    rmGradeTag: { textContent: '' },
    gateNote: { classList: { toggle() {} } },
    gateNoteDiag: { classList: { toggle() {} } },
    rmStruggleList: { innerHTML: '', appendChild() {} }
  };

  const sandbox = {
    GRADES: ['א', 'ב', 'ג', 'ד', 'ה', 'ו'],
    isGrade: g => ['א', 'ב', 'ג', 'ד', 'ה', 'ו'].includes(g),
    $: id => elements[id] || null,
    renderStruggleButtons: () => {},
    localStorage: {
      _data: {},
      getItem(k) { return this._data[k] || null; },
      setItem(k, v) { this._data[k] = String(v); }
    }
  };

  vm.createContext(sandbox);
  vm.runInContext(fnMatch[0], sandbox);
  sandbox.paintGrade();

  const renderedHtml = elements.gradePick.innerHTML;
  for (const g of ['א', 'ב', 'ג', 'ד', 'ה', 'ו']) {
    assert.match(renderedHtml, new RegExp(`data-grade="${g}"`), `Grade button ${g} missing from rendered gradePick`);
    assert.match(renderedHtml, new RegExp(`>${g}׳</button>`), `Label ${g}׳ missing from rendered gradePick`);
  }
  assert.match(renderedHtml, /data-grade="א" aria-pressed="true"/);
});

test('the banks really reach ו׳, so the title may claim א׳–ו׳', () => {
  for (const g of ['ה', 'ו']) {
    assert.ok(banks.allItems().some(i => i.grade === g), 'no items for grade ' + g);
  }
});

test('index.html names the range א׳–ו׳ in the title, banner and footer', () => {
  assert.match(indexHtml, /<title>MelodyMath \| תרגול יסודי א׳–ו׳<\/title>/);
  assert.match(indexHtml, /<b>תרגול יסודי א׳–ו׳\.<\/b>/);
  assert.match(indexHtml, /MelodyMath · תרגול יסודי א׳–ו׳ בעברית/);
  assert.doesNotMatch(indexHtml, /תרגול יסודי א׳–ד׳|תוכנית הלימודים א׳–ד׳/);
});

test('the child home has no middle-school topic or sonification jargon', () => {
  assert.doesNotMatch(indexHtml, /שיפוע פונקציה/);
  assert.doesNotMatch(indexHtml, /סוניפיקציית גרפים היא מוצר אחר/);
  assert.doesNotMatch(indexHtml, /לפסינג/);
  assert.doesNotMatch(indexHtml, /המורה שולטת/);
  assert.doesNotMatch(indexHtml, /<label>BPM <input/);
});

test('exercises in index.html are age-appropriate for elementary school (grades א–ו)', () => {
  // Levels 1–3 stay elementary. Powers, negatives and the old ratios return only as EXTRA.
  const rows = vm.runInNewContext(indexHtml.match(/const exercises=(\[[\s\S]*?\])\.map/)[1]);
  const live = rows.filter(r => r[7] !== 'EXTRA');
  const extra = rows.filter(r => r[7] === 'EXTRA');
  assert.equal(live.some(r => r[2] === 'חזקות'), false);
  assert.equal(live.some(r => typeof r[5] === 'number' && r[5] < 0), false);
  for (const ratio of ['75:64', '45:32', '64:45']) {
    assert.equal(live.some(r => String(r[4]).includes(ratio) || String(r[5]) === ratio), false, ratio);
    assert.equal(extra.some(r => String(r[5]) === ratio), true, ratio);
  }
  const kept = live.filter(r => [7, 11, 14, 15, 17, 18, 20, 21, 22, 24].includes(r[0])).map(r => r[2]);
  assert.equal(JSON.stringify(kept), JSON.stringify(['כפל', 'כפל', 'יחסים', 'כפל', 'שברים', 'סדרות', 'חילוק', 'יחסים', 'חיסור', 'כפל']));
  const back = {
    7: ['חזקות', 'טמפו', 8], 11: ['חזקות', 'טמפו', 240], 15: ['חזקות', 'טמפו', 1080],
    20: ['חזקות', 'טמפו', 200], 24: ['חזקות', 'טמפו', 960],
    14: ['יחסים', 'מרווחים', '5:4'], 17: ['יחסים', 'מרווחים', '5:3'], 21: ['יחסים', 'מרווחים', '15:8'],
    18: ['פונקציות', 'מלודיה', 10], 22: ['פונקציות', 'מלודיה', -12]
  };
  for (const [id, want] of Object.entries(back)) {
    const row = extra.find(r => r[8] === Number(id));
    assert.ok(row, 'missing EXTRA for ' + id);
    assert.equal(row[1], 4);
    assert.equal(JSON.stringify([row[2], row[3], row[5]]), JSON.stringify(want));
  }
});

test('אתגר ו׳ draws the EXTRA exercises, and a fast tempo is four beats', () => {
  assert.match(indexHtml, /data-level="4"[^>]*>\s*<strong>אתגר ו׳<\/strong>מעבר לתוכנית/);
  const raw = vm.runInNewContext(indexHtml.match(/const exercises=(\[[\s\S]*?\])\.map/)[1]);
  assert.equal(raw.filter(r => r[7] === 'EXTRA').some(r => String(r[4]).includes('BPM')), false);
  const exercises = raw.map(([id, level, mathTopic, musicConcept, prompt, answer, hint, extra, ref]) => (
    { id, level, mathTopic, musicConcept, prompt, answer, hint, extra: extra === 'EXTRA', ref }
  ));
  const lines = ['practicePool', 'extraTempoPreview', 'beyondLabel', 'childPrompt', 'extraMusic'].map((name) => {
    const line = indexHtml.split('\n').find((l) => l.startsWith('function ' + name + '('));
    assert.ok(line, name);
    return line;
  });
  const sandbox = { exercises, chosenLevel: 1, Array, Math, Number, String };
  vm.createContext(sandbox);
  vm.runInContext(lines.join('\n'), sandbox);
  assert.equal(sandbox.practicePool().some((x) => x.extra), false);
  sandbox.chosenLevel = 4;
  const challenge = sandbox.practicePool();
  assert.equal(challenge.length, 18);
  assert.equal(challenge.every((x) => x.extra && x.level === 4), true);
  const fast = exercises.find((x) => x.answer === 240);
  assert.equal(JSON.stringify(sandbox.extraTempoPreview(fast)), JSON.stringify({ groups: [4], bpm: 240 }));
  assert.equal(sandbox.extraTempoPreview(exercises.find((x) => x.answer === 8)), null);
  assert.match(indexHtml, /playCountClicks\(music\.clicks,music\.bpm\)/);
  assert.equal(sandbox.beyondLabel(exercises.find((x) => x.answer === -12)), 'מעבר לתוכנית');
  assert.equal(sandbox.beyondLabel(exercises.find((x) => x.answer === 1080)), 'מעבר לתוכנית');
  assert.equal(sandbox.beyondLabel(exercises.find((x) => x.answer === '5:4')), '');
  const third = exercises.find((x) => x.answer === '5:4');
  const tri = exercises.find((x) => x.answer === '45:32');
  const aug4 = sandbox.childPrompt(tri);
  assert.match(aug4, /קוורטה מוגדלת/);
  assert.match(sandbox.childPrompt(third), /טרצה היא קפיצה של שלושה תווים/);
  assert.match(sandbox.childPrompt(exercises.find((x) => x.answer === '5:3')), /סקסטה/);
  assert.match(sandbox.childPrompt(exercises.find((x) => x.answer === '15:8')), /ספטימה/);
  assert.match(sandbox.childPrompt(exercises.find((x) => String(x.prompt).includes('חצאי טונים'))), /חצי טון הוא הצעד/);
  const thirdSound = sandbox.extraMusic(third);
  assert.equal(JSON.stringify(thirdSound.notes.map((n) => n.voice)), JSON.stringify(['bell', 'xylo']));
  assert.equal(thirdSound.notes[1].hz > thirdSound.notes[0].hz, true);
  assert.equal(JSON.stringify(sandbox.extraMusic(tri).notes.map((n) => n.voice)), JSON.stringify(['bell', 'xylo']));
  const melody = sandbox.extraMusic(exercises.find((x) => String(x.prompt).includes('אחרי 7 צעדים')));
  assert.equal(melody.notes.length, 8);
  assert.equal(melody.notes[0].voice, 'xylo');
  assert.equal(sandbox.extraMusic(exercises.find((x) => x.answer === 240)).clicks[0], 4);
  const originals = ["רבע מנוקד שווה לכמה שמיניות?","כמה רבעים יש בתיבה בזמן 4/4?","מה היחס בין תדר של דו לתדר של סול במרווח קווינטה?","כמה שמיניות יש בתיבה בזמן 3/4?","מה היחס בין תדר של דו לתדר של פה במרווח קוורטה?","כמה רבעים שווה חצי מנוקד?","אם מהירות הקצב מוכפלת פי 2 בכל דקה, כמה פעמים תגדל המהירות אחרי 3 דקות?","כמה שש־עשריות יש בתיבה בזמן 2/4?","מה היחס בין תדר של דו לתדר של דו באוקטבה?","משך תיבה במשקל 6/8 שווה לכמה רבעים?","קצב מתחיל ב־60 BPM ומוכפל כל 2 דקות. מה הקצב אחרי 4 דקות?","כמה חצאים יש בתיבה בזמן 4/4?","כמה רבעים שווה שלם מנוקד?","מה יחס התדרים בטרצה גדולה?","קצב מתחיל ב־40 BPM ומשולש כל דקה. מה הקצב אחרי 3 דקות?","כמה שמיניות שווה חצי מנוקד?","מה יחס התדרים בסקסטה גדולה?","תו עולה ב־2 חצאי טונים בכל צעד. מה השינוי אחרי 5 צעדים?","כמה שש־עשריות יש בתיבה בזמן 3/4?","קצב מתחיל ב־50 BPM ומוכפל כל 3 דקות. מה הקצב אחרי 6 דקות?","מה יחס התדרים בספטימה גדולה?","תו יורד ב־3 חצאי טונים בכל צעד. מה השינוי אחרי 4 צעדים?","כמה רבעים שווה שמינית מנוקדת?","קצב מתחיל ב־30 BPM ומוכפל כל דקה. מה הקצב אחרי 5 דקות?","כמה שמיניות יש בתיבה בזמן 12/8?","מה יחס התדרים בסקונדה מוגדלת בכיוון עולה?","תו עולה ב־4 חצאי טונים ואז יורד ב־2. מה השינוי אחרי 3 חזרות?","קצב מתחיל ב־20 BPM ומשולש כל 2 דקות. מה הקצב אחרי 6 דקות?","כמה רבעים שווה שלם עם שתי נקודות הארכה?","מה יחס התדרים בטריטון בכיוון עולה?","תו עולה ב־5 חצאי טונים בכל צעד. מה השינוי אחרי 7 צעדים?","קצב מתחיל ב־10 BPM ומוכפל כל 5 דקות. מה הקצב אחרי 15 דקות?","כמה שמיניות שווה רבע עם שתי נקודות הארכה?","מה יחס התדרים בקווינטה מוקטנת בכיוון עולה?","תו יורד ב־6 חצאי טונים ואז עולה ב־3. מה השינוי אחרי 4 חזרות?"];
  const norm = (s) => String(s).replaceAll('BPM', 'פעימות בדקה');
  const prompts = raw.map((r) => norm(r[4]));
  originals.forEach((orig) => {
    assert.equal(prompts.some((p) => p.startsWith(norm(orig))), true, orig);
  });
  assert.equal(originals.length, 35);
});
