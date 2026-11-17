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

test('resumeStageLabel returns correct Hebrew labels and fallback', () => {
  assert.equal(TS.resumeStageLabel('think'), 'שלב 1 · חושבים');
  assert.equal(TS.resumeStageLabel('hear'), 'שלב 2 · שומעים');
  assert.equal(TS.resumeStageLabel('why'), 'שלב 3 · למה');
  assert.equal(TS.resumeStageLabel('unknown'), 'שלב 1 · חושבים');
});

test('quickResumeUnit returns latest unfinished resume or recommended fallback', () => {
  const s = memStorage();
  const units = [{ id: 'u1', total: 5 }, { id: 'u2', total: 5 }];
  assert.deepEqual(TS.quickResumeUnit('c1', 'טל', units, s), { unitId: 'u1', questionIndex: 0, stage: 'think', view: 'exercise' });
  TS.saveUnitResume('c1', 'טל', { unitId: 'u2', questionIndex: 2, stage: 'why' }, s);
  const q = TS.quickResumeUnit('c1', 'טל', units, s);
  assert.equal(q.unitId, 'u2');
  assert.equal(q.questionIndex, 2);
  assert.equal(q.stage, 'why');
});

test('renderResumeProgressHtml includes stage badge with data-testid', () => {
  const html = TS.renderResumeProgressHtml({ questionIndex: 2, stage: 'why' }, 10);
  assert.match(html, /data-testid="unit-resume-stage"/);
  assert.match(html, /שלב 3 · למה/);
  assert.match(html, /aria-valuenow="20"/);
});

test('units-extra quickSwitchHtml renders navigation pills with active unit and percentages', () => {
  const units = UX.UNITS.slice(0, 3);
  const prog = {};
  prog[units[0].id] = { index: 1, results: { q1: { correct: true } } };
  const html = UX.quickSwitchHtml(units[0].id, units, prog);
  assert.match(html, /data-testid="unit-quick-switch"/);
  assert.match(html, /data-testid="quick-unit-btn-/);
  assert.match(html, /mm-btn--active/);
});

test('units-extra resumeStageName translates think, hear, why into Hebrew', () => {
  assert.equal(UX.resumeStageName('think'), 'חושבים');
  assert.equal(UX.resumeStageName('hear'), 'שומעים');
  assert.equal(UX.resumeStageName('why'), 'למה');
  assert.equal(UX.resumeStageName('other'), 'חושבים');
});

test('saving multiple units independently preserves student sessions and tests', () => {
  const s = memStorage();
  TS.upsertStudent('c1', 'איתי', s);
  const sess = TS.startSession('c1', 'איתי', 'class', s);
  TS.addItem('c1', 'איתי', sess.id, { skill: 'כפל', prompt: '2x3', answer: 6, given: 6, correct: true }, s);
  TS.saveUnitResume('c1', 'איתי', { unitId: 'unit-a', questionIndex: 4, stage: 'why', classSession: true }, s);
  TS.saveUnitResume('c1', 'איתי', { unitId: 'unit-b', questionIndex: 1, stage: 'think', classSession: true }, s);
  assert.equal(TS.loadUnitResume('c1', 'איתי', 'unit-a', s).questionIndex, 4);
  assert.equal(TS.loadUnitResume('c1', 'איתי', 'unit-b', s).questionIndex, 1);
  const st = TS.getStudent('c1', 'איתי', s);
  assert.equal(st.sessions.length, 1);
  assert.equal(TS.buildReport(st).correct, 1);
});

test('controlled skip rejects units that are neither recommended nor started', () => {
  const units = [{ id: 'a', questions: [1] }, { id: 'b', questions: [1] }, { id: 'c', questions: [1] }];
  const prog = { a: { completedAt: 1, results: {} }, b: { results: {} }, c: { results: {} } };
  assert.equal(TS.canSkipToUnit(units, prog, 'c'), false);
  assert.equal(UX.canSkipTo('a', 'c', units, prog), false);
});

test('pilot app and index wire quickSwitchHtml and resumeStageLabel', () => {
  const app = fs.readFileSync(path.join(__dirname, '..', 'pilot/js/app.js'), 'utf8');
  const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  assert.match(app, /quickSwitchHtml/);
  assert.match(app, /resumeStageName/);
  assert.match(index, /unitQuickNavPills/);
  assert.match(index, /resumeStageLabel/);
});

test('canSkipTo allows revisiting completed units without losing progress', () => {
  const units = UX.UNITS.slice(0, 3);
  const prog = {};
  prog[units[0].id] = { completedAt: 100, results: {} };
  prog[units[1].id] = { completedAt: 200, results: {} };
  assert.equal(UX.canSkipTo(units[0].id, units[1].id, units, prog), true);
  const btn = UX.skipButtonHtml(units[0].id, units, prog);
  assert.ok(btn.length > 0);
  assert.match(btn, /data-act="skip-unit"/);
});
