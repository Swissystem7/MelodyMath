// The child sees the bridge when the next topic opens (Refs #665 #718).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const bridges = require('../src/lib/curriculum/bridges');
const instruments = require('../src/lib/instruments');
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
  assert.match(html, /<div id="topicBridge" class="note hidden"><\/div>/);
  assert.doesNotMatch(html, /<p id="topicBridge"/);
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

function soundCount(answer) {
  const s = String(answer == null ? '' : answer).trim().replace(/,/g, '.');
  if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(s)) return 0;
  const n = Number(s);
  if (!(n > 0) || !Number.isFinite(n)) return 0;
  let whole = Math.floor(n + 1e-9);
  let tenths = Math.round((n - whole) * 10);
  if (tenths >= 10) { whole += Math.floor(tenths / 10); tenths %= 10; }
  if (tenths === 0 && whole <= 12) return whole;
  if (whole < 100) return Math.floor(whole / 10) + (whole % 10) + tenths;
  if (Math.floor(whole / 100) <= 12) return Math.floor(whole / 100) + (Math.floor(whole / 10) % 10) + (whole % 10) + tenths;
  return 0;
}

test('every bridge has a sound, an answer check, and a real source', () => {
  const heard = [];
  const voices = new Set();
  bridges.RAW_BRIDGES.forEach((row) => {
    const b = bridges.bridgeForLink(row[0], row[1]);
    const counted = soundCount(row[4]);
    assert.ok(b.sound.length >= 1, row[0] + '->' + row[1]);
    if (counted === 0) {
      assert.equal(b.sound.length, 1, row[0] + ' listen tone');
      assert.equal(b.sound[0].listen, true, row[0]);
      assert.equal(b.sound[0].held, false, row[0]);
    } else {
      assert.equal(b.sound.length, counted, row[0] + '->' + row[1] + ' ' + row[4]);
      assert.equal(b.sound.some((ev) => ev.listen), false, row[0]);
    }
    assert.equal(b.sound[b.sound.length - 1].at < 1, true, row[0]);
    b.sound.forEach((ev) => voices.add(ev.voice));
    assert.equal(/BPM|אוקטבה/.test(b.prompt + ' ' + b.hint), false, row[0]);
    assert.equal(b.check(row[4]), true, row[0] + '->' + row[1]);
    assert.equal(b.check('___nope___'), false);
    assert.equal(b.source.doi, '10.1007/s10648-014-9249-3');
    assert.equal(b.source.url, 'https://doi.org/10.1007/s10648-014-9249-3');
    assert.equal(b.source.music.doi, '10.1080/00220973.2020.1799316');
  });
  assert.equal(voices.has('drum') && voices.has('bell') && voices.has('xylo'), true);
  const teens = bridges.bridgeForLink('mm-cur-1', 'mm-cur-3');
  assert.equal(teens.answer, 14);
  assert.equal(teens.sound.length, 5);
  assert.equal(teens.sound.filter((ev) => ev.held).length, 1);
  assert.equal(teens.sound.filter((ev) => !ev.held).length, 4);
  const thirteen = bridges.bridgeForLink('mm-cur-3', 'mm-cur-7');
  assert.equal(thirteen.sound.length, 4);
  const thousand = bridges.bridgeForLink('mm-cur-35', 'mm-cur-56');
  assert.equal(thousand.answer, 1000);
  assert.equal(thousand.sound.length, 10);
  assert.equal(thousand.sound.every((ev) => ev.voice === 'lowFlute' && ev.place === 'hundred' && ev.held), true);
  assert.equal(thousand.sound.some((ev) => ev.voice === 'xylo' || ev.place === 'tenth'), false);
  const sung = [], taps = [];
  bridges.play(thousand, {
    playVoice: (_ac, voice) => sung.push(voice),
    playTap: (v) => taps.push(v),
    audioContext: { currentTime: 0 },
    later: (fn) => fn(),
  });
  assert.equal(sung.length, 10);
  assert.equal(sung.every((v) => v === 'lowFlute'), true);
  assert.equal(taps.includes('xylo'), false);
  const twenty = bridges.bridgeForLink('mm-cur-1', 'mm-cur-12');
  assert.equal(twenty.answer, 20);
  assert.equal(twenty.sound.length, 2);
  assert.equal(twenty.sound.every((ev) => ev.voice === 'lowClarinet' && ev.place === 'ten'), true);
  const hundred = bridges.soundPlan('units', 100);
  assert.equal(hundred.length, 1);
  assert.equal(hundred[0].voice, 'lowFlute');
  assert.equal(hundred[0].place, 'hundred');
  const mixed = bridges.soundPlan('steady beat', 111.1);
  assert.deepEqual(mixed.map((ev) => ev.place), ['hundred', 'ten', 'one', 'tenth']);
  assert.deepEqual(mixed.map((ev) => ev.voice), ['lowFlute', 'lowClarinet', 'drum', 'xylo']);
  const usedByTopic = new Set();
  Object.keys(instruments.TOPICS).forEach((topic) => {
    instruments.forTopic(topic).forEach((inst) => usedByTopic.add(inst.voice));
  });
  assert.equal(usedByTopic.has('lowFlute'), false);
  assert.equal(usedByTopic.has('lowClarinet'), false);
  assert.equal(mixed[0].voice === 'pluck' || mixed[1].voice === 'breathy', false);
  assert.equal(mixed[1].voice === 'breathy', false);
  const carried = bridges.soundPlan('steady beat', 0.999);
  assert.equal(carried.length, 1);
  assert.equal(carried[0].place, 'one');
  assert.equal(carried[0].voice === 'xylo', false);
  const money = bridges.bridgeForLink('mm-cur-36', 'mm-cur-46');
  assert.equal(money.answer, '7.70');
  assert.equal(money.check('7.7'), true);
  assert.equal(money.check('7.70'), true);
  assert.equal(money.sound.length, 14);
  assert.equal(money.sound.filter((ev) => ev.voice === 'xylo').length, 7);
  const word = bridges.bridgeForLink('mm-cur-8', 'mm-cur-17');
  assert.equal(word.answer, 'כן');
  assert.equal(word.sound.length, 1);
  assert.equal(word.sound[0].listen, true);
  assert.equal(word.sound[0].held, false);
  const cue = [];
  const wordPlayed = bridges.play(word, { playTap: (v) => cue.push(v), later: (fn) => fn() });
  assert.equal(wordPlayed.length, 1);
  assert.equal(cue.length, 1);
  assert.equal(cue[0], 'bell');
  assert.equal(word.check('כן'), true);
  const time = bridges.bridgeForLink('mm-cur-10', 'mm-cur-18');
  assert.equal(time.answer, '3:30');
  assert.equal(time.sound.length, 1);
  assert.equal(time.sound[0].listen, true);
  const huge = bridges.bridgeForLink('mm-cur-31', 'mm-cur-38');
  assert.equal(huge.answer, 1000000);
  assert.equal(huge.sound.length, 1);
  assert.equal(huge.sound[0].listen, true);
  assert.equal(huge.sound[0].held, false);
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
  assert.match(ui.key.textContent, /חליל נמוך = 100/);
  assert.match(ui.key.textContent, /קלרינט נמוך = 10/);
  assert.equal(/יוקללה|ukulele|pluck|זמרה|breathy/.test(ui.key.textContent), false);
  assert.match(ui.key.textContent, /נקישה קצרה = 1/);
  assert.match(ui.key.textContent, /קסילופון = עשיריות/);
  assert.match(ui.key.textContent, /7\.70/);
  ui.input.value = '3'; ui.button.onclick();
  assert.equal(box._bridgeOk, false);
  assert.equal(ui.hint.hidden, false);
  assert.match(ui.hint.textContent, /10/);
  ui.input.value = '10'; ui.button.onclick();
  assert.equal(box._bridgeOk, true);
  assert.equal(ui.hint.hidden, true);
});
