#!/usr/bin/env node
// Demo check for 21.10 (#414): a simulated diagnostic with mistakes turns into
// a personal plan on one curriculum topic, and the plan is kept on the device.
//
//   node tools/demo-diagnosis-plan.js                  grade ג׳, misses כפל and חילוק
//   node tools/demo-diagnosis-plan.js ד basic_fractions
//   node tools/demo-diagnosis-plan.js --json           print the result as JSON
//
// It walks the same path as the remediation tab in index.html: the real
// diagnostic items from banks.js, one teacherStore 'diag' session with the
// skill logged under its Hebrew name, then buildLearnerPlan on the stored
// child. The plan is saved with teacherStore.saveJson and read back from a
// fresh load. Storage is an in-memory localStorage, so nothing is written to
// disk. Exits 1 when a check fails. No install, Node 22+.
'use strict';
const banks = require('../src/lib/banks');
const store = require('../src/lib/teacherStore');
const learner = require('../src/lib/learnerPlan');
const cur = require('../src/lib/curriculum');

function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(String(k)) ? map.get(String(k)) : null),
    setItem: (k, v) => { map.set(String(k), String(v)); },
    removeItem: (k) => { map.delete(String(k)); },
    key: (i) => Array.from(map.keys())[i] || null,
    get length() { return map.size; },
  };
}

function planKey(classCode, name) {
  return 'plan:' + store.normalizeCode(classCode) + ':' + store.studentLabel(name);
}

// A wrong answer that can never be right, whatever the item's answer format.
function wrongAnswer(answer) {
  const n = Number(answer);
  return Number.isFinite(n) ? String(n + 1) : '?';
}

function runDemo(opts) {
  const o = opts || {};
  const grade = o.grade || 'ג';
  const miss = new Set(o.miss || ['multiplication', 'division']);
  const storage = o.storage || memoryStorage();
  const classCode = o.classCode || 'demo2110';
  const name = o.name || 'ילד/ה לדוגמה';

  const items = banks.diagnosticItems(grade);
  store.upsertStudent(classCode, name, storage);
  store.setStudentGrade(classCode, name, grade, storage);
  const session = store.startSession(classCode, name, 'diag', storage);
  const answers = items.map((q) => {
    const correct = !miss.has(q.skill);
    store.addItem(classCode, name, session.id, {
      skill: banks.skillHe(q.skill), prompt: q.prompt, answer: q.answer,
      given: correct ? q.answer : wrongAnswer(q.answer), correct,
    }, storage);
    return { skill: q.skill, correct };
  });
  store.endSession(classCode, name, session.id, storage);

  const student = store.getStudent(classCode, name, storage);
  const plan = learner.buildLearnerPlan({ grade, student, name, now: o.now });
  store.saveJson(planKey(classCode, name), {
    grade: plan.grade, branch: plan.branch, topic: plan.topic, gaps: plan.gaps,
    childLine: plan.childLine, adultLine: plan.adultLine, savedAt: Date.now(),
  }, storage);

  // Read everything back as a new page load would.
  const saved = store.loadJson(planKey(classCode, name), null, storage);
  const reloaded = store.getStudent(classCode, name, storage);
  const rebuilt = learner.buildLearnerPlan({ grade, student: reloaded, name, now: o.now });
  const row = cur.MATRIX.find((r) => r.topic === plan.topic);
  const wrong = answers.filter((a) => !a.correct).length;

  const checks = {
    diagnosticHasMistakes: wrong > 0 && wrong < answers.length,
    planOk: plan.ok === true,
    planTargetsGap: plan.branch === 'weak',
    topicInCurriculum: !!row && row.status !== cur.GAP,
    sessionStored: !!reloaded && reloaded.sessions.length === 1 && reloaded.sessions[0].items.length === answers.length,
    planStored: !!saved && saved.topic === plan.topic && rebuilt.topic === plan.topic,
  };
  return {
    grade, classCode, name, missed: Array.from(miss),
    answered: answers.length, wrong, storageKey: store.jsonKey(planKey(classCode, name)),
    plan, saved, curriculumRow: row || null, checks,
    pass: Object.keys(checks).every((k) => checks[k]),
  };
}

function report(r) {
  const lines = [
    'אבחון מדומה · כיתה ' + r.grade + '׳ · ' + r.answered + ' שאלות, ' + r.wrong + ' טעויות (' + r.missed.map(banks.skillHe).join(', ') + ')',
    'ענף: ' + r.plan.branch + ' · נושא: ' + r.plan.topic,
    'פערים: ' + (r.plan.gaps.join(' | ') || '—'),
    'לילד/ה: ' + r.plan.childLine,
    'למבוגר/ת: ' + r.plan.adultLine,
    'נשמר ב-localStorage: ' + r.storageKey,
    '',
  ];
  Object.keys(r.checks).forEach((k) => lines.push((r.checks[k] ? 'PASS ' : 'FAIL ') + k));
  lines.push(r.pass ? 'OK' : 'FAILED');
  return lines.join('\n');
}

if (require.main === module) {
  const argv = process.argv.slice(2);
  const json = argv.includes('--json');
  const rest = argv.filter((a) => a !== '--json');
  const opts = {};
  if (rest[0]) opts.grade = rest[0];
  if (rest.length > 1) opts.miss = rest.slice(1);
  if (opts.grade && !banks.isGrade(opts.grade)) {
    console.error('כיתה לא מוכרת: ' + opts.grade + ' (א–ו)');
    process.exit(2);
  }
  const result = runDemo(opts);
  console.log(json ? JSON.stringify(result, null, 2) : report(result));
  process.exit(result.pass ? 0 : 1);
}

module.exports = { runDemo, memoryStorage, planKey, report };
