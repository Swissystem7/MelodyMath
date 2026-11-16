'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const TS = require('../src/lib/teacherStore.js');
const UX = require('../pilot/js/units-extra.js');
function memStorage() { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v); }, removeItem: (k) => { delete m[k]; } }; }

test('save/load resume restores exact question, stage and class session', () => {
  const s = memStorage();
  const saved = TS.saveUnitResume('כיתה-א', 'נועה', { unitId: 'frac-4', questionIndex: 3, questionId: 'fr4', stage: 'why', view: 'exercise', sessionKind: 'class', classSession: true }, s);
  assert.equal(saved.questionIndex, 3); assert.equal(saved.stage, 'why'); assert.equal(saved.classSession, true);
  assert.deepEqual(TS.loadUnitResume('כיתה-א', 'נועה', 'frac-4', s), saved);
});
test('invalid stage/view/index normalize safely without losing unit', () => {
  const r = TS.normalizeUnitResume({ unitId: 'u1', questionIndex: -4, stage: 'bogus', view: 'bogus' });
  assert.equal(r.questionIndex, 0); assert.equal(r.stage, 'think'); assert.equal(r.view, 'exercise');
  assert.equal(TS.normalizeUnitResume(null), null); assert.equal(TS.normalizeUnitResume({}), null);
  assert.equal(TS.normalizeResumeStage('hear'), 'hear'); assert.equal(TS.normalizeResumeStage('x'), 'think');
});
test('resume save preserves session/test history and report counts', () => {
  const s = memStorage();
  TS.upsertStudent('c1', 'דנה', s);
  const sess = TS.startSession('c1', 'דנה', 'practice', s);
  TS.addItem('c1', 'דנה', sess.id, { skill: 'חיבור', prompt: '1+1', answer: 2, given: 2, correct: true }, s);
  TS.saveUnitResume('c1', 'דנה', { unitId: 'times-1', questionIndex: 2, stage: 'hear' }, s);
  const st = TS.getStudent('c1', 'דנה', s);
  assert.equal(st.sessions.length, 1); assert.equal(TS.buildReport(st).total, 1); assert.equal(TS.buildReport(st).correct, 1);
  assert.equal(TS.loadUnitResume('c1', 'דנה', 'times-1', s).questionIndex, 2);
});
test('clear resume removes only that unit and keeps student history', () => {
  const s = memStorage();
  TS.saveUnitResume('c1', 'אבי', { unitId: 'a', questionIndex: 1 }, s);
  TS.saveUnitResume('c1', 'אבי', { unitId: 'b', questionIndex: 4 }, s);
  assert.equal(TS.clearUnitResume('c1', 'אבי', 'a', s), true);
  assert.equal(TS.loadUnitResume('c1', 'אבי', 'a', s), null);
  assert.equal(TS.loadUnitResume('c1', 'אבי', 'b', s).questionIndex, 4);
  assert.equal(TS.clearUnitResume('c1', 'אבי', 'a', s), false);
});
test('list resumes newest first and progress percent clamps', () => {
  const s = memStorage();
  TS.saveUnitResume('c1', 'מיה', { unitId: 'a', questionIndex: 1 }, s);
  TS.saveUnitResume('c1', 'מיה', { unitId: 'b', questionIndex: 2 }, s);
  assert.deepEqual(TS.listUnitResumes('c1', 'מיה', s).map((r) => r.unitId), ['b', 'a']);
  assert.equal(TS.unitProgressPercent(1, 4), 25); assert.equal(TS.unitProgressPercent(9, 4), 100); assert.equal(TS.unitProgressPercent(0, 0), 0);
  assert.equal(TS.resumeProgressPercent({ questionIndex: 3 }, 6), 50); assert.equal(TS.renderResumeProgressHtml({ questionIndex: 1 }, 4).includes('aria-valuenow="25"'), true);
});
test('controlled skip only allows recommended or already-started unit (teacherStore)', () => {
  const units = [{ id: 'u1', questions: [1, 2] }, { id: 'u2', questions: [1] }, { id: 'u3', questions: [1] }];
  const prog = { u1: { completedAt: 1, results: {} }, u2: { results: {} }, u3: { results: {} } };
  assert.equal(TS.recommendedUnitId(units, prog), 'u2');
  assert.equal(TS.canSkipToUnit(units, prog, 'u2'), true); assert.equal(TS.canSkipToUnit(units, prog, 'u3'), false);
  assert.equal(TS.canSkipToUnit(units, { u3: { index: 1, results: {} } }, 'u3'), true);
});
test('units-extra progress bar shows done/total/percent from real pilot units', () => {
  const unit = UX.UNITS[0];
  const p = { index: 2, results: {} }; unit.questions.slice(0, 2).forEach((q) => { p.results[q.id] = { correct: true }; });
  const info = UX.unitProgress(unit, p);
  assert.equal(info.done, 2); assert.equal(info.percent, Math.round((2 / unit.questions.length) * 100));
  const html = UX.progressBarHtml(unit, p);
  assert.match(html, /data-testid="unit-progress-bar"/); assert.match(html, /role="progressbar"/); assert.ok(html.includes(info.percent + '%'));
});
test('units-extra recommended skip is controlled and button is wired with data-act', () => {
  const units = UX.UNITS.slice(0, 3);
  const prog = {}; prog[units[0].id] = { completedAt: 1, results: {} };
  const rec = UX.recommendedUnit(units, prog);
  assert.equal(rec.id, units[1].id);
  assert.equal(UX.canSkipTo(units[0].id, units[1].id, units, prog), true);
  assert.equal(UX.canSkipTo(units[0].id, units[2].id, units, prog), false);
  const btn = UX.skipButtonHtml(units[0].id, units, prog);
  assert.match(btn, /data-act="skip-unit"/); assert.match(btn, /data-testid="skip-to-recommended"/); assert.ok(btn.includes(units[1].id));
});
test('import roster carries unitResume without dropping sessions', () => {
  const s = memStorage();
  const raw = JSON.stringify({ students: { 'תלמיד1': { name: 'תלמיד1', created: 1, sessions: [{ id: 's1', kind: 'practice', started: 1, items: [{ skill: 'x', prompt: 'p', correct: true }] }], assignments: [], notes: [], unitResume: { 'frac-4': { unitId: 'frac-4', questionIndex: 5, stage: 'hear', view: 'exercise' } } } } });
  const res = TS.importRoster('c9', raw, s);
  assert.equal(res.ok, true);
  assert.equal(TS.loadUnitResume('c9', 'תלמיד1', 'frac-4', s).questionIndex, 5);
  assert.equal(TS.buildReport(TS.getStudent('c9', 'תלמיד1', s)).total, 1);
});
test('real pages wire resume bar, skip button and save/restore flow', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'pilot/js/app.js'), 'utf8');
  const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(app, /saveResumePosition/); assert.match(app, /loadResumePosition/); assert.match(app, /skip-unit/); assert.match(app, /progressBarHtml/);
  assert.match(index, /unitResumeBar/); assert.match(index, /unitSkipBtn/); assert.match(index, /teacherStore\.js/);
});
