// MelodyMath — Unit tests for topic diagnostic & fast start (Issue #678, Refs #665).
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const TopicDiag = require('../src/lib/topicDiagnostic.js');
const { diagnosticItems } = require('../src/lib/banks.js');
const progression = require('../src/lib/curriculum/progression.js');

test('diagnostic blocks have at most 4 items per block and include an unassisted item', () => {
  const g1Items = diagnosticItems('א');
  assert.equal(g1Items.length, 16);
  const blocks = TopicDiag.createDiagnosticBlocks(g1Items);
  assert.equal(blocks.length, 4);
  blocks.forEach((block, idx) => {
    assert.ok(block.items.length <= TopicDiag.MAX_DIAGNOSTIC_BLOCK_SIZE && block.items.length > 0);
    assert.equal(block.index, idx + 1);
    assert.equal(block.hasUnassistedItem, true);
    assert.ok(block.items.filter(it => it.noMusic).length >= 1);
  });
});

test('each diagnostic block is embedded in play with an inviting spoken explanation and immediate feedback', () => {
  const sample = [{ prompt: '1 + 1 = ?', answer: '2' }, { prompt: '2 + 2 = ?', answer: '4' }];
  let spokenText = null;
  const blocks = TopicDiag.createDiagnosticBlocks(sample, { grade: 'א' });
  assert.equal(blocks.length, 1);
  assert.match(blocks[0].spokenExplanation, /בואו נשחק ונפתור ביחד/);
  assert.equal(blocks[0].isPlayEmbedded, true);
  assert.equal(blocks[0].immediateFeedback, true);
  TopicDiag.openTopic({ id: 'sample', grade: 'א', items: sample }, { speak: text => { spokenText = text; } });
  assert.match(spokenText, /בואו נשחק ונפתור ביחד/);
});

test('no self-report questionnaire for grades א׳ and ב׳ with normalization', () => {
  ['א', 'א׳', ' ב ', 'ב׳', '1', '2', 'grade1', 'grade2'].forEach(g => assert.equal(TopicDiag.isSelfReportAllowed(g), false));
  ['ג', 'ג׳', 'ד'].forEach(g => assert.equal(TopicDiag.isSelfReportAllowed(g), true));
  assert.equal(TopicDiag.openTopic({ id: 'counting', grade: 'א׳', items: [{ prompt: '1+1' }] }, { allowSelfReport: true }).hasSelfReport, false);
  assert.equal(TopicDiag.openTopic({ id: 'addition', grade: 'ב׳', items: [{ prompt: '2+2' }] }, { allowSelfReport: true }).hasSelfReport, false);
});

test('time from topic open to first interactive exercise is under 10 seconds (Rule 3)', () => {
  const t0 = Date.now(), res = TopicDiag.openTopic({ id: 'mm-cur-0', grade: 'א', items: diagnosticItems('א') });
  assert.ok((Date.now() - t0) < 10000 && res.playableImmediately && res.withinTargetLatency && res.firstExercise && res.firstBlock.items.length <= 4);
});

test('prerequisite check enforces progression requirements before starting a new topic', () => {
  const links = progression.linksForTopic('mm-cur-33');
  assert.ok(links.prereq.includes('mm-cur-32') && links.prereq.includes('mm-cur-16'));
  const blocked = TopicDiag.openTopic({ id: 'mm-cur-33', grade: 'ד' }, { progressionModule: progression, tracker: { isMastered: () => false } });
  assert.equal(blocked.playableImmediately, false);
  assert.equal(blocked.redirectTo, 'mm-cur-0');
  assert.ok(blocked.redirectTopicTitle.length > 0 && !blocked.redirectTopicTitle.includes('mm-cur-'));
  const allowed = TopicDiag.openTopic({ id: 'mm-cur-33', grade: 'ד' }, { progressionModule: progression, tracker: { isMastered: id => id === 'mm-cur-32' || id === 'mm-cur-16' } });
  assert.equal(allowed.playableImmediately, true);
  assert.equal(allowed.redirectTo, null);
});

test('checkPrerequisites locks unknown topic IDs and traces deepest missing prerequisite root (#721, Refs #591)', () => {
  const unk = TopicDiag.checkPrerequisites('unknown-topic-id', null, progression);
  assert.equal(unk.ok, false);
  assert.ok(unk.missing.includes('unknown_topic'));
  const chainCheck = TopicDiag.checkPrerequisites('mm-cur-33', { isMastered: id => ['mm-cur-16', 'mm-cur-18', 'mm-cur-22', 'mm-cur-24'].includes(id) }, progression);
  assert.equal(chainCheck.ok, false);
  assert.equal(chainCheck.redirectTo, 'mm-cur-25');
  assert.doesNotMatch(chainCheck.redirectTopicTitle, /mm-cur-/);
  assert.match(chainCheck.redirectTopicTitle, /שארית/);
});

test('topic and item order strictly matches progression.js (no topic before its prerequisite, #721, Refs #665)', () => {
  const blocks = TopicDiag.createDiagnosticBlocks(diagnosticItems('ב'), { grade: 'ב', progressionModule: progression });
  assert.equal(blocks[0].items[0].skill, 'place_value');
  assert.deepEqual(TopicDiag.orderTopics(['mm-cur-14', 'mm-cur-13', 'mm-cur-31', 'mm-cur-3', 'mm-cur-0'], progression), ['mm-cur-0', 'mm-cur-3', 'mm-cur-13', 'mm-cur-14', 'mm-cur-31']);
});

test('single item diagnostic block includes unassisted pure math item (#721, Refs #591)', () => {
  const blocks = TopicDiag.createDiagnosticBlocks([{ prompt: '5 + 5 = ?', answer: '10' }], { grade: 'א' });
  assert.equal(blocks.length, 1 && blocks[0].items.length, 1);
  assert.equal(blocks[0].hasUnassistedItem, true);
  assert.equal(blocks[0].items[0].noMusic, true);
  assert.equal(blocks[0].items[0].plain, true);
});

test('full diagnostic assessment is restored: all items reachable across blocks, no technical IDs (#721, Refs #678)', () => {
  const opened = TopicDiag.openTopic({ id: 'mm-cur-0', grade: 'א', items: diagnosticItems('א') });
  assert.equal(opened.blocks.length, 4);
  assert.equal(opened.allItems.length, 16);
  const reachable = [];
  opened.blocks.forEach(b => {
    assert.ok(b.items.length <= TopicDiag.MAX_DIAGNOSTIC_BLOCK_SIZE);
    b.items.forEach(it => reachable.push(it));
  });
  assert.equal(reachable.length, 16);
  assert.ok(TopicDiag.topicTitle('mm-cur-0').includes('ספירה'));
  assert.equal(TopicDiag.topicTitle('unknown-id'), '');
});

test('index.html integrates topicDiagnostic, supports multi-block progression and hides technical IDs', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  ['src/lib/topicDiagnostic.js', 'MM_TOPIC_DIAGNOSTIC.openTopic', 'realTopicId', 'if(!q.noMusic', 'rmBlocks', 'rmBlockIdx', 'המשך לבלוק הבא', 'redirectTopicTitle'].forEach(s => assert.ok(html.includes(s)));
  assert.equal(html.includes("'mm-cur-diag-'+"), false);
  assert.doesNotMatch(html, /'נפתח תחילה את שלב הקדם: '\s*\+\s*opened\.redirectTo/);
});

test('index.html rmBegin and rmAdvance cover all 16 items across 4 micro-blocks', () => {
  const els = {}, el = id => els[id] || (els[id] = { id, value: '1', style: {}, textContent: '', innerHTML: '', classList: { remove() {}, add() {} }, focus() {} });
  let reported = false;
  const ctx = {
    $: el, setTimeout: fn => fn(), show() {}, setMath() {}, renderWidget() {}, revealWidget() {}, askForAnswer() {}, setMusicWay() {}, setItemTag() {}, maybeHear() {}, maybeSpeak() {},
    answerOk: () => true, noteMetro() {}, logTeacherItem() {}, mathHtml: s => s, musicSourceHtml: () => '',
    answerHint: () => '', normalizeAnswer: s => s, currentDiag: () => diagnosticItems('א'), rmHe: s => s, selectedGrade: 'א', MM_TOPIC_DIAGNOSTIC: TopicDiag,
    rmReport: () => { reported = true; }
  };
  vm.createContext(ctx);
  const lines = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').split(/\r?\n/);
  const pick = prefix => lines.find(l => l.startsWith(prefix));
  vm.runInContext([pick('let rmIdx=0,rmAns=[]'), pick('function rmRender(){'), pick('function rmCheck(){'), pick('function rmAdvance(){'), pick("$('rmBegin').onclick="), 'globalThis.getRmState=()=>({rmBlocks,rmBlockIdx,RM_DIAG,rmAns});'].join('\n'), ctx);
  el('rmBegin').onclick();
  assert.equal(ctx.getRmState().rmBlocks.length, 4);
  assert.equal(ctx.getRmState().RM_DIAG.length, 4);
  for (let i = 0; i < 16; i++) {
    el('rmAnswer').value = '1';
    ctx.rmCheck();
    if (i < 15) {
      assert.equal(el('rmNext').textContent, (i + 1) % 4 === 0 ? 'המשך לבלוק הבא' : 'הבא');
      ctx.rmAdvance();
    } else {
      assert.equal(el('rmNext').textContent, 'לדוח הפערים');
      ctx.rmAdvance();
    }
  }
  assert.equal(reported, true);
  assert.equal(ctx.getRmState().rmAns.length, 16);
});

test('prerequisite redirect in index.html hides technical item IDs and never overwrites Hebrew prompt', () => {
  const els = {}, el = id => els[id] || (els[id] = { id, value: '1', style: {}, textContent: '', innerHTML: '', classList: { remove() {}, add() {} }, focus() {} });
  const ctx = {
    $: el, setTimeout: fn => fn(), show() {}, setMath() {}, renderWidget() {}, revealWidget() {}, askForAnswer() {}, setMusicWay() {}, setItemTag() {}, maybeHear() {}, maybeSpeak() {},
    answerOk: () => true, noteMetro() {}, logTeacherItem() {}, mathHtml: s => s, musicSourceHtml: () => '', answerHint: () => '', normalizeAnswer: s => s,
    currentDiag: () => [{ prompt: '1+1', skill: 'addition', answer: '2' }], rmHe: s => s, selectedGrade: 'ד',
    MM_TOPIC_DIAGNOSTIC: { openTopic: () => ({ playableImmediately: false, redirectTo: 'mm-cur-25', redirectTopicTitle: 'חילוק עם שארית', blocks: [] }) },
    startTopicPractice: () => false,
  };
  vm.createContext(ctx);
  const lines = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').split(/\r?\n/);
  const pick = prefix => lines.find(l => l.startsWith(prefix));
  vm.runInContext([pick('let rmIdx=0,rmAns=[]'), pick('function rmRender(){'), pick("$('rmBegin').onclick=")].join('\n'), ctx);
  el('rmBegin').onclick();
  assert.equal(el('rmPrompt').textContent, 'נפתח תחילה את שלב הקדם: חילוק עם שארית');
  assert.doesNotMatch(el('rmPrompt').textContent, /mm-cur-/);
});
