// The child sees the bridge when the next topic opens (Refs #665 #718).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const bridges = require('../src/lib/curriculum/bridges');
const prog = require('../src/lib/curriculum/progression');
const cur = require('../src/lib/curriculum');
const banks = require('../src/lib/banks');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');

function pageFns() {
  const lines = ['topicIdForStep', 'topicTransitionText', 'nextTopicChoice', 'showTopicBridge'].map((name) => {
    const line = html.split('\n').find((l) => l.startsWith('function ' + name + '('));
    assert.ok(line, name + ' is in index.html');
    return line;
  });
  const topicBridge = {
    textContent: '',
    classList: {
      toggle(cls, on) { this.hidden = !!on; },
      hidden: true,
    },
  };
  const sandbox = {
    MM_BRIDGES: bridges,
    MM_PROGRESSION: prog,
    MATRIX: cur.MATRIX,
    sectionForItem: cur.sectionForItem,
    topicBridge: topicBridge,
    $(id) { return id === 'topicBridge' ? topicBridge : null; },
    show(id, on) { topicBridge.classList.toggle('hidden', !on); },
  };
  vm.createContext(sandbox);
  vm.runInContext(lines.join('\n'), sandbox);
  return sandbox;
}

test('index.html loads progression.js and bridges.js, and sw.js caches them', () => {
  assert.match(html, /<script src="src\/lib\/curriculum\/progression\.js"><\/script>/);
  assert.match(html, /<script src="src\/lib\/curriculum\/bridges\.js"><\/script>/);
  assert.match(html, /id="topicBridge"/);
  assert.match(html, /showTopicBridge\(rpStep\?rmPlan\[rpStep-1\]:null,st\)/);
  assert.match(sw, /'\.\/src\/lib\/curriculum\/progression\.js'/);
  assert.match(sw, /'\.\/src\/lib\/curriculum\/bridges\.js'/);
});

test('opening the next topic shows one bridge in every grade', () => {
  const sandbox = pageFns();
  ['א', 'ב', 'ג', 'ד', 'ה', 'ו'].forEach((grade) => {
    const row = bridges.RAW_BRIDGES.find((r) => cur.topicById(r[1]).grade === grade);
    assert.ok(row, 'a bridge enters grade ' + grade);
    assert.ok(prog.linksForTopic(row[0]).buildsTo.includes(row[1]), grade);
    assert.equal(sandbox.topicTransitionText(row[0], row[1]), row[3], grade);
    sandbox.showTopicBridge({ topicId: row[0] }, { topicId: row[1], history: [] });
    assert.equal(sandbox.topicBridge.textContent, row[3], grade);
    assert.equal(sandbox.topicBridge.classList.hidden, false, grade);
  });
  sandbox.showTopicBridge({ topicId: 'mm-cur-8' }, { topicId: 'mm-cur-0' });
  assert.equal(sandbox.topicBridge.textContent, '');
  assert.equal(sandbox.topicBridge.classList.hidden, true);
});

test('a bank item shows the bridge of its topic when the next topic opens', () => {
  const sandbox = pageFns();
  const from = banks.allItems().find((it) => sandbox.topicIdForStep({ items: [it] }) === 'mm-cur-0');
  const to = banks.allItems().find((it) => sandbox.topicIdForStep({ items: [it] }) === 'mm-cur-1');
  assert.ok(from && to);
  sandbox.showTopicBridge({ items: [from] }, { items: [to], history: [] });
  assert.equal(sandbox.topicBridge.textContent, bridges.bridgeForLink('mm-cur-0', 'mm-cur-1').prompt);
});

test('the next topic comes from getNextUnlockedTopics, and practice is not labeled locked', () => {
  const sandbox = pageFns();
  sandbox.topicById = (id) => cur.topicById(id);
  sandbox.MelodyMathMasteryCheck = {
    getMasteryTracker: () => ({}),
    getNextUnlockedTopics: () => ['mm-cur-2'],
    isTopicUnlocked: (id) => id !== 'mm-cur-5',
  };
  sandbox.showTopicBridge({ topicId: 'mm-cur-0' }, { topicId: 'mm-cur-1' });
  assert.equal(sandbox.topicBridge.textContent, bridges.bridgeForLink('mm-cur-0', 'mm-cur-2').prompt);
  sandbox.showTopicBridge({ topicId: 'mm-cur-0' }, { topicId: 'mm-cur-5' });
  assert.equal(/נושא נעול|🔒/.test(sandbox.topicBridge.textContent), false);
  assert.equal(sandbox.topicBridge.textContent, '');
  assert.equal(sandbox.topicBridge.classList.hidden, true);
});

test('every bridge has a sound, an answer check, and a real source', () => {
  const heard = [];
  bridges.RAW_BRIDGES.forEach((row) => {
    const b = bridges.bridgeForLink(row[0], row[1]);
    const n = Number(row[4]);
    const whole = n > 0 && n === Math.round(n);
    const want = whole && n <= 12 ? n : whole ? Math.min(12, Math.floor(n / 10)) : 3;
    assert.equal(b.sound.length, want, row[0] + '->' + row[1] + ' beats');
    assert.equal(b.sound[b.sound.length - 1].at < 1, true, row[0]);
    assert.equal(/BPM|אוקטבה/.test(b.prompt + ' ' + b.hint), false, row[0]);
    assert.equal(b.check(row[4]), true, row[0] + '->' + row[1]);
    assert.equal(b.check('___nope___'), false);
    assert.equal(b.source.doi, '10.1007/s10648-014-9249-3');
    assert.equal(b.source.url, 'https://doi.org/10.1007/s10648-014-9249-3');
    assert.equal(b.source.music.doi, '10.1080/00220973.2020.1799316');
  });
  const one = bridges.bridgeForLink('mm-cur-0', 'mm-cur-1');
  const played = bridges.play(one, { playTap: (v) => heard.push(v), later: (fn) => fn() });
  assert.equal(played.length, one.sound.length);
  assert.equal(heard.length, one.sound.length);
  assert.equal(one.sound.length, 10);
});

test('a bridge question can be answered, and a miss shows the hint', () => {
  const entry = bridges.bridgeForLink('mm-cur-0', 'mm-cur-1');
  const made = [];
  const d = { createElement: (tag) => { const node = { tag: tag, className: '', hidden: true, textContent: '', value: '', children: [], setAttribute() {}, onclick: null }; made.push(node); return node; } };
  const box = { ownerDocument: d, _bridgeOk: null, appendChild(ch) { this.children = this.children || []; this.children.push(ch); } };
  const ui = bridges.mountAnswer(box, entry);
  ui.input.value = '3'; ui.button.onclick();
  assert.equal(box._bridgeOk, false);
  assert.equal(ui.hint.hidden, false);
  assert.match(ui.hint.textContent, /10/);
  ui.input.value = '10'; ui.button.onclick();
  assert.equal(box._bridgeOk, true);
  assert.equal(ui.hint.hidden, true);
});
