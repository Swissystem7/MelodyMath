// MelodyMath — dashboard progress data aggregation logic.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.dashboardLogic = api;
    Object.assign(root, api);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // Raw roster JSON (storage, paste, import) may carry a null session, an
  // items field that is not an array, or a null item. Skip those rows so one
  // bad row does not blank the whole class dashboard with a TypeError.
  function isRow(x) {
    return !!x && typeof x === 'object';
  }

  function sessionsOf(student) {
    if (!student || !Array.isArray(student.sessions)) return [];
    return student.sessions.filter(isRow);
  }

  function allItems(student) {
    return sessionsOf(student).reduce(function (acc, session) {
      (Array.isArray(session.items) ? session.items : []).forEach(function (it) {
        if (isRow(it)) acc.push(it);
      });
      return acc;
    }, []);
  }

  function buildStudentReport(student) {
    const items = allItems(student);
    // Null-prototype maps: an imported item whose skill or prompt is a
    // prototype key (constructor, __proto__) must count like any other text
    // instead of vanishing from the report and writing into Object.prototype.
    const bySkill = Object.create(null);
    items.forEach(function (it) {
      const k = it.skill || 'אחר';
      const g = bySkill[k] || (bySkill[k] = { skill: k, total: 0, correct: 0 });
      g.total += 1;
      if (it.correct) g.correct += 1;
    });

    let current = 0;
    let best = 0;
    items.forEach(function (it) {
      if (it.correct) {
        current += 1;
        if (current > best) best = current;
      } else {
        current = 0;
      }
    });

    const missCount = Object.create(null);
    items.forEach(function (it) {
      if (it.correct) return;
      const key = it.prompt || it.skill || '?';
      if (!missCount[key]) missCount[key] = { prompt: key, skill: it.skill || '', count: 0 };
      missCount[key].count += 1;
    });

    const repeatingErrors = Object.keys(missCount)
      .map(function (k) { return missCount[k]; })
      .filter(function (x) { return x.count >= 2; })
      .sort(function (a, b) { return b.count - a.count; });

    const perSkill = Object.keys(bySkill).map(function (k) {
      const g = bySkill[k];
      const acc = g.total ? g.correct / g.total : 0;
      return {
        skill: g.skill,
        total: g.total,
        correct: g.correct,
        accuracy: acc,
        successRate: acc,
      };
    });

    const correctCount = items.filter(function (it) { return it.correct; }).length;
    const totalCount = items.length;
    const accuracy = totalCount ? correctCount / totalCount : 0;

    return {
      name: student && student.name ? student.name : '',
      total: totalCount,
      correct: correctCount,
      accuracy: accuracy,
      successRate: accuracy,
      perSkill: perSkill,
      repeatingErrors: repeatingErrors,
      streak: { current: current, best: best },
    };
  }

  function getDashboardData(rawStoreData) {
    let data = rawStoreData;
    if (typeof data === 'string') {
      try {
        data = JSON.parse(data);
      } catch (e) {
        data = null;
      }
    }

    let studentsMap = {};
    if (data && typeof data === 'object') {
      if (data.students && typeof data.students === 'object') {
        studentsMap = data.students;
      } else if (Array.isArray(data)) {
        data.forEach(function (st) {
          if (st && st.name) studentsMap[st.name] = st;
        });
      } else if (typeof data.getItem === 'function') {
        try {
          const raw = data.getItem('mm-roster-v1:default');
          if (raw) {
            const parsed = JSON.parse(raw);
            if (parsed && parsed.students) studentsMap = parsed.students;
          }
        } catch (e) {}
      } else {
        studentsMap = data;
      }
    }

    const names = Object.keys(studentsMap).sort(function (a, b) {
      return a.localeCompare(b, 'he');
    });

    return names.map(function (name) {
      const student = studentsMap[name] || {};
      const report = buildStudentReport(student);
      const sessions = sessionsOf(student);
      const last = sessions.length ? sessions[sessions.length - 1] : null;
      const notes = Array.isArray(student.notes) ? student.notes.length : 0;

      return {
        name: student.name || name,
        total: report.total,
        totalPractices: report.total,
        correct: report.correct,
        accuracy: report.accuracy,
        successRate: report.successRate,
        perSkill: report.perSkill,
        skills: report.perSkill,
        repeatingErrors: report.repeatingErrors,
        errors: report.repeatingErrors,
        repeating: report.repeatingErrors.length,
        sessions: sessions.length,
        sessionsCount: sessions.length,
        lastAt: last ? last.started : null,
        lastKind: last ? last.kind : '',
        notes: notes,
        streak: report.streak,
      };
    });
  }

  return {
    isRow: isRow,
    sessionsOf: sessionsOf,
    allItems: allItems,
    buildStudentReport: buildStudentReport,
    getDashboardData: getDashboardData,
    extractDashboardData: getDashboardData,
    formatDashboardData: getDashboardData,
  };
});
