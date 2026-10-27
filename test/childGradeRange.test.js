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
  // Levels 1–3 stay elementary. The replaced items return only as EXTRA, level 4.
  assert.doesNotMatch(indexHtml, /75:64/);
  assert.doesNotMatch(indexHtml, /45:32/);
  assert.doesNotMatch(indexHtml, /64:45/);
  const rows = vm.runInNewContext(indexHtml.match(/const exercises=(\[[\s\S]*?\])\.map/)[1]);
  const live = rows.filter(r => r[7] !== 'EXTRA');
  const extra = rows.filter(r => r[7] === 'EXTRA');
  assert.equal(live.some(r => r[2] === 'חזקות'), false);
  assert.equal(live.some(r => typeof r[5] === 'number' && r[5] < 0), false);
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
  assert.match(indexHtml, /data-level="4"[^>]*>\s*<strong>אתגר ו׳<\/strong>/);
  const raw = vm.runInNewContext(indexHtml.match(/const exercises=(\[[\s\S]*?\])\.map/)[1]);
  assert.equal(raw.filter(r => r[7] === 'EXTRA').some(r => String(r[4]).includes('BPM')), false);
  const exercises = raw.map(([id, level, mathTopic, musicConcept, prompt, answer, hint, extra, ref]) => (
    { id, level, mathTopic, musicConcept, prompt, answer, hint, extra: extra === 'EXTRA', ref }
  ));
  const lines = ['practicePool', 'extraTempoPreview'].map((name) => {
    const line = indexHtml.split('\n').find((l) => l.startsWith('function ' + name + '('));
    assert.ok(line, name);
    return line;
  });
  const sandbox = { exercises, chosenLevel: 1 };
  vm.createContext(sandbox);
  vm.runInContext(lines.join('\n'), sandbox);
  assert.equal(sandbox.practicePool().some((x) => x.extra), false);
  sandbox.chosenLevel = 4;
  const challenge = sandbox.practicePool();
  assert.equal(challenge.length, 10);
  assert.equal(challenge.every((x) => x.extra && x.level === 4), true);
  const fast = exercises.find((x) => x.answer === 240);
  assert.equal(JSON.stringify(sandbox.extraTempoPreview(fast)), JSON.stringify({ groups: [4], bpm: 240 }));
  assert.equal(sandbox.extraTempoPreview(exercises.find((x) => x.answer === 8)), null);
  assert.match(indexHtml, /playCountClicks\(tempo\.groups,tempo\.bpm\)/);
});
