// Mounts the one-topic plan on every practice surface. Stays quiet when the
// plan module is not on the page yet, and hides the card during a live quiz.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const SLOTS = ['remediation', 'lessons', 'practice', 'playground', 'classMode', 'beatMode', 'teacherReport'];
  const GRADES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];
  const TAB_WHY = {
    remediation: 'כאן בודקים מה חסר ומתרגלים את זה.',
    lessons: 'שיעור קצר עם צליל לפני התרגול.',
    practice: 'תרגול קצב ושברים.',
    playground: 'משחק חופשי בצליל — לא נמדד.',
    classMode: 'מפגש 8 דקות לקבוצה.',
    beatMode: 'תשובה בקצב הפעימה.',
    teacherReport: 'מה נרשם במכשיר, בלי ציון.',
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function classPlanCsv(plans) {
    const lines = ['כינוי,כיתה,ענף,נושא,מפגשים,יעד,דיוק אבחון'];
    (plans || []).forEach(function (p) {
      if (!p) return;
      lines.push([p.name || '', p.grade || '', p.branch || '', p.topic || '', p.paceDone, p.paceExpected, p.diagPercent].map(function (c) {
        const s = String(c == null ? '' : c);
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      }).join(','));
    });
    return lines.join('\n');
  }

  // A saved child plans from what the device logged. With no child saved (a
  // demo tablet), the diagnostic that just ended still picks the topic, but
  // only for the grade it was taken in.
  function planInput(grade, name, student, lastDiag) {
    const input = { grade: grade, student: student, name: name, now: Date.now() };
    const own = student && Array.isArray(student.sessions) && student.sessions.length;
    if (!own && lastDiag && lastDiag.grade === grade && Array.isArray(lastDiag.perSkill) && lastDiag.perSkill.length) {
      input.perSkill = lastDiag.perSkill;
    }
    return input;
  }

  // The card hides while a question is on screen, and comes back on the
  // drill's last screen, where the path ends.
  function hideOnRemediation(doc) {
    function open(id) {
      const el = doc.getElementById(id);
      return !!el && !el.classList.contains('hidden');
    }
    if (open('rmQuiz')) return true;
    return open('rmPlan') && !open('rmPlanDoneActions');
  }

  function mountLearnerPlans() {
    if (typeof document === 'undefined' || typeof buildLearnerPlan !== 'function' || typeof renderLearnerPlanHtml !== 'function') return;
    function gradeNow() {
      try {
        if (typeof selectedGrade === 'string' && GRADES.indexOf(selectedGrade) >= 0) return selectedGrade;
      } catch (e) { /* page still starting */ }
      return 'א';
    }
    function studentOf(name) {
      try {
        if (!name || typeof getStudent !== 'function' || typeof who !== 'object' || !who) return null;
        return getStudent(who.classCode, name);
      } catch (e) { return null; }
    }
    function nameNow() {
      try { return (typeof who === 'object' && who && who.name) || ''; } catch (e) { return ''; }
    }
    let painting = false;
    function paint() {
      if (painting) return;
      painting = true;
      try {
        const grade = gradeNow();
        const name = nameNow();
        const html = renderLearnerPlanHtml(buildLearnerPlan(planInput(grade, name, studentOf(name), globalThis.mmLastDiag)));
        const hideRem = hideOnRemediation(document);
        SLOTS.forEach(function (id) {
          const panel = document.getElementById(id);
          if (!panel) return;
          let slot = panel.querySelector('.mm-plan-slot');
          if (!slot || slot.parentNode !== panel) {
            slot = document.createElement('div');
            slot.className = 'mm-plan-slot';
            panel.insertBefore(slot, panel.firstChild);
          }
          const whyText = TAB_WHY[id] || '';
          const fullHtml = html + (whyText ? '<p class="mm-plan-why">' + esc(whyText) + '</p>' : '');
          if (slot.innerHTML !== fullHtml) slot.innerHTML = fullHtml;
          const hide = id === 'remediation' && !!hideRem;
          if (slot.classList.contains('hidden') !== hide) slot.classList.toggle('hidden', hide);
        });
        paintBoard(grade);
        const tables = document.getElementById('tables');
        if (tables && !document.getElementById('mm-path-note') && typeof bridgeSentence === 'function') {
          const note = document.createElement('p');
          note.id = 'mm-path-note';
          note.className = 'note';
          note.textContent = bridgeSentence();
          tables.parentNode.insertBefore(note, tables);
        }
      } finally { painting = false; }
    }
    function paintBoard(grade) {
      const table = document.getElementById('classBoard');
      if (!table) return;
      const head = table.querySelector('thead tr');
      if (head && !head.querySelector('.mm-plan-col')) {
        const th = document.createElement('th');
        th.scope = 'col';
        th.className = 'mm-plan-col';
        th.textContent = 'השבוע';
        head.appendChild(th);
      }
      table.querySelectorAll('tbody tr').forEach(function (tr) {
        const btn = tr.querySelector('[data-kid]');
        const kid = btn ? btn.getAttribute('data-kid') : '';
        let cell = tr.querySelector('.mm-plan-cell');
        if (!cell) {
          cell = document.createElement('td');
          cell.className = 'mm-plan-cell';
          tr.appendChild(cell);
        }
        const row = buildLearnerPlan({ grade: grade, student: studentOf(kid), name: kid, now: Date.now() });
        cell.textContent = row.boardLine;
      });
      const card = document.getElementById('classBoardCard');
      if (!card || document.getElementById('planCsv')) return;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.id = 'planCsv';
      btn.className = 'secondary no-print';
      btn.textContent = 'ייצוא CSV מקומי';
      btn.addEventListener('click', function () {
        const names = typeof listStudents === 'function' && typeof who === 'object' && who ? listStudents(who.classCode) : [];
        const plans = names.map(function (kid) {
          const row = buildLearnerPlan({ grade: gradeNow(), student: studentOf(kid), name: kid, now: Date.now() });
          row.name = kid;
          return row;
        });
        const blob = new Blob([classPlanCsv(plans)], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = 'melodymath-plans.csv';
        a.click();
      });
      const bar = card.querySelector('.no-print');
      if (bar) bar.appendChild(btn);
    }
    function hook(fnName) {
      const fn = globalThis[fnName];
      if (typeof fn !== 'function' || fn._mmPlan) return;
      function wrapped() {
        const out = fn.apply(this, arguments);
        paint();
        return out;
      }
      wrapped._mmPlan = true;
      globalThis[fnName] = wrapped;
    }
    // endTeacherSession closes every logged path (diagnostic, drill, class
    // round, beat), so the card shows the new count as soon as one ends.
    ['saveGrade', 'renderTeacherReport', 'renderClassBoard', 'saveWhoFromForm', 'endTeacherSession'].forEach(hook);
    const rem = document.getElementById('remediation');
    if (rem && typeof MutationObserver === 'function') {
      new MutationObserver(function () { paint(); }).observe(rem, { subtree: true, attributes: true, attributeFilter: ['class'] });
    }
    paint();
  }

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mountLearnerPlans);
    else mountLearnerPlans();
  }
  return {
    classPlanCsv: classPlanCsv, mountLearnerPlans: mountLearnerPlans, planInput: planInput,
    hideOnRemediation: hideOnRemediation, SLOTS: SLOTS, TAB_WHY: TAB_WHY,
  };
});
