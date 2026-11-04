// MM-610 pilot — the coverage map: every grades 1–3 (א׳–ג׳) topic of the
// official programme, read from src/lib/curriculum.js at run time (never
// copied), and the pilot units and exercises that practise it.
// test/pilotCoverage.test.js fails if any of those topics has no exercise.
// The teacher view (js/app.js) draws the same map with links to each exercise.
(function (root, factory) {
  const IN_NODE = typeof module === 'object' && !!module.exports;
  const deps = IN_NODE
    ? { U: require('./unit.js'), X: require('./units.js'), C: require('../../src/lib/curriculum.js') }
    : { U: root.MMPilotUnit, X: root.MMPilotUnits, C: root };
  const api = factory(deps);
  if (IN_NODE) module.exports = api;
  else root.MMPilotCoverage = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (deps) {
  'use strict';

  const GRADES = ['א', 'ב', 'ג'];

  // The legacy unit ("סופרים צלילים", js/unit.js) first, then js/units.js.
  function allUnits() {
    const U = deps.U;
    const list = [];
    if (U && U.UNIT) {
      list.push({
        id: U.UNIT.id, title: U.UNIT.title, subtitle: U.UNIT.subtitle, grades: U.UNIT.grades, legacy: true,
        topics: U.topicsOf(), questions: U.UNIT.questions, lesson: U.UNIT.lesson, skill: U.UNIT.skill || null
      });
    }
    ((deps.X && deps.X.UNITS) || []).forEach(function (u) { list.push(u); });
    return list;
  }

  function unitById(id) { return allUnits().filter(function (u) { return u.id === id; })[0] || null; }

  // The curriculum ids one exercise practises: its own `curr`, plus its topic's.
  function currOf(unit, q) {
    const t = unit.topics.filter(function (x) { return x.id === q.topic; })[0];
    return (q.curr || []).concat(t ? (t.curr || []) : []).filter(function (v, i, a) { return a.indexOf(v) === i; });
  }

  function gradeRows() {
    const C = deps.C;
    if (!C || typeof C.rowsForGrade !== 'function') return [];
    return GRADES.reduce(function (all, g) { return all.concat(C.rowsForGrade(g)); }, []);
  }

  // { total, covered, rows: [{ id, grade, strand, topic, quote, sourceUrl, status, units: [{ id, title, questions: [qid] }] }] }
  function map() {
    const units = allUnits();
    const rows = gradeRows().map(function (r) {
      const hits = [];
      units.forEach(function (u) {
        const qs = u.questions.filter(function (q) { return currOf(u, q).indexOf(r.topicId) >= 0; }).map(function (q) { return q.id; });
        if (qs.length) hits.push({ id: u.id, title: u.title, questions: qs });
      });
      return {
        id: r.topicId, grade: r.grade, strand: r.strand, topic: r.topic, quote: r.quote || null, sourceUrl: r.sourceUrl || null,
        status: hits.length ? 'covered' : 'missing', units: hits
      };
    });
    return { total: rows.length, covered: rows.filter(function (r) { return r.status === 'covered'; }).length, rows: rows };
  }

  return { GRADES: GRADES, allUnits: allUnits, unitById: unitById, currOf: currOf, map: map };
});
