const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

function childSection() {
  const start = indexHtml.indexOf('id="childStart"');
  assert.notEqual(start, -1, 'child start section exists');
  const end = indexHtml.indexOf('</section>', start);
  return indexHtml.slice(start, end);
}

test('child start is the first actionable block, before teacher bars', () => {
  const child = indexHtml.indexOf('id="childStart"');
  assert.ok(child < indexHtml.indexOf('id="whoBar"'), 'before who bar');
  assert.ok(child < indexHtml.indexOf('id="smartboardToggle"'), 'before quick tools');
  assert.ok(child < indexHtml.indexOf('id="firstRun"'), 'before teacher walkthrough');
  assert.match(indexHtml, /id="childStart"[^>]*aria-labelledby="childStartTitle"/);
  assert.match(indexHtml, /id="childStartTitle">שלום! מתחילים לתרגל\?</);
});

test('child start asks for no name, class code, or typed input', () => {
  const section = childSection();
  assert.doesNotMatch(section, /<input|studentName|classCode|שם או קוד/);
  assert.match(section, /id="childGradePick"[^>]*role="group"[^>]*aria-label="בחירת כיתה לתרגול"/);
  assert.match(section, /id="childStartBtn"[^>]*>▶ מתחילים לתרגל</);
});

test('child grade choice renders full Hebrew labels for grades 1-6 with pressed state', () => {
  const src = indexHtml.match(/function paintGrade\(\)[\s\S]*?\n\}/)[0];
  function fakeEl() {
    return {
      innerHTML: '', textContent: '',
      classList: { toggle: () => {} },
      setAttribute: function (k, v) { this[k] = v; },
      querySelectorAll: function () {
        return [...this.innerHTML.matchAll(/data-grade="([^"]+)"/g)].map((m) => ({
          dataset: { grade: m[1] }, onclick: null,
        }));
      },
    };
  }
  const els = {};
  const ctx = {
    GRADES: ['א', 'ב', 'ג', 'ד', 'ה', 'ו'],
    GRADE_NOTE: {}, selectedGrade: 'ב',
    $: (id) => (els[id] || (els[id] = fakeEl())),
    saveGrade: () => {}, renderStruggleButtons: () => {},
  };
  vm.createContext(ctx);
  vm.runInContext(src + '\npaintGrade();', ctx);
  const html = els.childGradePick.innerHTML;
  for (const g of ctx.GRADES) assert.match(html, new RegExp('כיתה ' + g + '׳'));
  assert.match(html, /data-grade="ב" aria-pressed="true" aria-label="כיתה ב׳"/);
  assert.equal((html.match(/aria-pressed="true"/g) || []).length, 1);
  assert.equal(els.childStartBtn['aria-label'], 'מתחילים לתרגל, כיתה ב׳');
  // teacher grade bar keeps its compact buttons, now with spoken labels
  assert.match(els.gradePick.innerHTML, /aria-label="כיתה א׳"/);
});

test('child CTA enters the existing practice start; teacher entry is unchanged', () => {
  assert.match(indexHtml, /\$\('childStartBtn'\)\$\('childStartBtn'\)\.onclick|childStartBtn'\)\)\$\('childStartBtn'\)\.onclick/);
  assert.match(indexHtml, /activateHomeTab\(tab\)/);
  assert.match(indexHtml, /\$\('rmBegin'\)\.click\(\)/);
  // the diagnostic start itself is untouched
  assert.match(indexHtml, /id="rmBegin" class="primary">מתחילים אבחון</);
  // teacher / class-mode entries still present with the same ids
  assert.match(indexHtml, /id="tab-classMode"/);
  assert.match(indexHtml, /id="classMode"/);
  assert.match(indexHtml, /id="whoBar"/);
  assert.match(indexHtml, /childTeacherBtn'\)\)\$\('childTeacherBtn'\)\.onclick/);
  assert.match(indexHtml, /tab-classMode/);
});

test('child controls meet tap-target and focus contracts', () => {
  assert.match(indexHtml, /\.child-grades button\{[^}]*min-height:56px/);
  assert.match(indexHtml, /\.child-start \.primary\{[^}]*min-height:60px/);
  assert.match(indexHtml, /\.child-grades button\[aria-pressed="true"\]/);
});
