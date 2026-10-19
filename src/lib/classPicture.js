// MelodyMath — one class picture for the teacher tab (#418).
//
// The teacher tab already counts answers per child (classBoard) and builds one
// personal plan for the child at the bar (#357 / #383). What was missing is the
// group view a מחנכת שילוב actually opens before a lesson: for every child on
// this tablet — the diagnostic percentage, the leading gaps, and where the
// personal plan stands.
//
// Three rules this module keeps:
//   1. It reads. It never starts a session and never writes an answer.
//   2. The grade comes from the child's roster row when the teacher set one,
//      and otherwise from the grade the tablet is showing — and the screen says
//      which of the two it was. A plan built on the wrong grade names the wrong
//      topic, so the fallback is never silent.
//   3. The CSV carries no name and no class code. It is a local file for the
//      teacher's own desk; a copy that leaves the tablet points at no child.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const NODE = typeof module === 'object' && !!module.exports;
  const GLOBAL = typeof globalThis !== 'undefined' ? globalThis : {};
  const STORE = NODE ? require('./teacherStore') : GLOBAL;
  const PLAN = NODE ? require('./learnerPlan') : GLOBAL;

  // The branch #383 picked, in the teacher's words. The branch name itself is
  // an implementation detail and never reaches the screen.
  const STATUS_HE = {
    fresh: 'נקודת פתיחה',
    weak: 'חזרה ליסודות',
    mixed: 'תרגול לפי פערים',
    strong: 'העשרה',
    invalid: 'אין כיתה',
  };
  const NO_GAPS = 'אין פער במדגם הזה';
  const NO_DIAG = 'לא נרשם';
  const DEVICE_GRADE = 'כיתת המכשיר';
  const NOTE = 'מבט על הקבוצה בטאבלט הזה בלבד. האחוזים הם ספירה של תשובות — לא ציון, לא אבחון קליני, ואין טענה שהתרגול סוגר פערים.';
  const CSV_HEAD = ['שורה', 'כיתה', 'אחוז אבחון', 'פער 1', 'פער 2', 'פער 3', 'סטטוס תוכנית', 'מפגשים השבוע', 'יעד שבועי'];
  const COLS = ['שם או כינוי', 'כיתה', 'אחוז אבחון', 'שלושה פערים מובילים', 'סטטוס תוכנית'];
  const GRADES = ['א', 'ב', 'ג', 'ד', 'ה', 'ו'];

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }

  function gradeOf(value) {
    if (typeof STORE.gradeLabel === 'function') return STORE.gradeLabel(value);
    const first = String(value == null ? '' : value).trim().slice(0, 1);
    return GRADES.indexOf(first) >= 0 ? first : '';
  }

  function rosterStudents(classCode, storage) {
    if (typeof STORE.listClassStudents !== 'function' || typeof STORE.getStudent !== 'function') return [];
    return STORE.listClassStudents(classCode, storage).map(function (row) {
      return STORE.getStudent(classCode, row.name, storage);
    }).filter(Boolean);
  }

  function pictureRow(student, deviceGrade, now) {
    const name = (student && student.name) || '';
    const own = gradeOf(student && student.grade);
    const grade = own || gradeOf(deviceGrade);
    const plan = typeof PLAN.buildLearnerPlan === 'function'
      ? PLAN.buildLearnerPlan({ grade: grade, student: student, name: name, now: now })
      : { branch: 'invalid' };
    const gaps = grade && typeof PLAN.topGaps === 'function'
      ? PLAN.topGaps({ grade: grade, student: student })
      : [];
    const diag = plan.diagPercent == null || plan.diagPercent === '' ? '' : plan.diagPercent;
    return {
      name: name,
      grade: grade,
      ownGrade: own,
      diag: diag,
      gaps: gaps,
      branch: plan.branch || 'invalid',
      status: STATUS_HE[plan.branch] || STATUS_HE.invalid,
      topic: plan.topic || '',
      paceDone: plan.paceDone || 0,
      paceExpected: plan.paceExpected || 0,
      plan: plan,
    };
  }

  // `students` is for callers that already hold the rows (and for tests).
  // Without it the rows come off the roster for this class code.
  function buildClassPicture(input) {
    const src = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const now = Number.isFinite(Number(src.now)) ? Number(src.now) : Date.now();
    const list = Array.isArray(src.students) ? src.students : rosterStudents(src.classCode, src.storage);
    const rows = list.filter(function (s) {
      return !!s && typeof s === 'object' && !Array.isArray(s) && !!(s.name || '');
    }).map(function (s) { return pictureRow(s, src.grade, now); });
    return {
      classCode: String(src.classCode == null ? '' : src.classCode),
      deviceGrade: gradeOf(src.grade),
      rows: rows,
      note: NOTE,
    };
  }

  function findPictureRow(picture, name) {
    const rows = (picture && picture.rows) || [];
    const wanted = String(name == null ? '' : name);
    for (let i = 0; i < rows.length; i++) if (rows[i].name === wanted) return rows[i];
    return null;
  }

  function gradePicker(row) {
    const options = ['<option value="">' + esc(DEVICE_GRADE) + '</option>'].concat(GRADES.map(function (g) {
      return '<option value="' + esc(g) + '"' + (row.ownGrade === g ? ' selected' : '') + '>כיתה ' + esc(g) + '׳</option>';
    })).join('');
    // The select is chrome: a printed picture shows the grade it resolved to.
    return '<span class="cp-grade">' + (row.grade ? 'כיתה ' + esc(row.grade) + '׳' : 'לא נבחרה')
      + (row.grade && !row.ownGrade ? ' · ' + esc(DEVICE_GRADE) : '') + '</span>'
      + '<select class="no-print cp-grade-pick" data-grade-kid="' + esc(row.name) + '"'
      + ' aria-label="כיתה של ' + esc(row.name) + '">' + options + '</select>';
  }

  // Curriculum topics are long sentences, so three of them join as a list and
  // not as one run-on cell.
  function gapsCell(row) {
    const gaps = row.gaps || [];
    if (!gaps.length) return esc(NO_GAPS);
    return '<ol class="cp-gaps">' + gaps.map(function (g) {
      return '<li>' + esc(g) + '</li>';
    }).join('') + '</ol>';
  }

  function statusCell(row) {
    const pace = row.paceExpected ? ' · ' + row.paceDone + '/' + row.paceExpected + ' מפגשים השבוע' : '';
    const topic = row.topic ? '<span class="cp-topic">' + esc(row.topic) + '</span>' : '';
    return esc(row.status) + esc(pace) + (topic ? '<br>' + topic : '');
  }

  function renderClassPictureHtml(picture) {
    const rows = (picture && picture.rows) || [];
    if (!rows.length) return '';
    const head = COLS.map(function (c) { return '<th scope="col">' + esc(c) + '</th>'; }).join('');
    const body = rows.map(function (row) {
      return '<tr>'
        + '<th scope="row"><button type="button" class="secondary cp-open" data-plan-kid="' + esc(row.name) + '">'
        + esc(row.name) + '</button></th>'
        + '<td>' + gradePicker(row) + '</td>'
        + '<td>' + (row.diag === '' ? esc(NO_DIAG) : esc(row.diag + '%')) + '</td>'
        + '<td>' + gapsCell(row) + '</td>'
        + '<td>' + statusCell(row) + '</td>'
        + '</tr>';
    }).join('');
    return '<table class="class-board class-picture" id="classPictureTable">'
      + '<caption class="sr-only">תמונת כיתה: אחוז אבחון, פערים מובילים וסטטוס התוכנית לכל תלמיד/ה בטאבלט הזה</caption>'
      + '<thead><tr>' + head + '</tr></thead><tbody>' + body + '</tbody></table>';
  }

  function renderStudentPlanHtml(row) {
    if (!row) return '<p class="note">בחרו שם בטבלה כדי לפתוח את התוכנית האישית.</p>';
    const plan = typeof PLAN.renderLearnerPlanHtml === 'function' ? PLAN.renderLearnerPlanHtml(row.plan) : '';
    const gaps = (row.gaps || []).map(function (g) { return '<li>' + esc(g) + '</li>'; }).join('');
    const grade = row.grade ? ' · כיתה ' + esc(row.grade) + '׳' + (row.ownGrade ? '' : ' (' + esc(DEVICE_GRADE) + ')') : '';
    return '<article class="cp-sheet" dir="rtl" data-plan-for="' + esc(row.name) + '">'
      + '<p class="sheet-kicker">תוכנית אישית · ' + esc(row.name) + grade + '</p>'
      + plan
      + '<p><b>אחוז אבחון בטאבלט הזה:</b> ' + (row.diag === '' ? esc(NO_DIAG) : esc(row.diag + '%')) + '</p>'
      + '<p><b>פערים מובילים</b></p>'
      + (gaps ? '<ul class="err-list">' + gaps + '</ul>' : '<p>' + esc(NO_GAPS) + '</p>')
      + '<p class="sheet-note">' + esc(NOTE) + '</p>'
      + '</article>';
  }

  function csvCell(value) {
    const s = String(value == null ? '' : value);
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  // Row number, grade, percentages and topic names only. No name, no nickname
  // and no class code, so the file identifies no child even off the tablet.
  function classPictureCsv(rows) {
    const lines = [CSV_HEAD.join(',')];
    (Array.isArray(rows) ? rows : []).forEach(function (row, i) {
      if (!row) return;
      const gaps = Array.isArray(row.gaps) ? row.gaps : [];
      lines.push([
        i + 1,
        row.grade || '',
        row.diag == null || row.diag === '' ? '' : row.diag,
        gaps[0] || '', gaps[1] || '', gaps[2] || '',
        row.status || '',
        row.paceDone || 0,
        row.paceExpected || 0,
      ].map(csvCell).join(','));
    });
    return lines.join('\n');
  }

  return {
    buildClassPicture: buildClassPicture,
    findPictureRow: findPictureRow,
    renderClassPictureHtml: renderClassPictureHtml,
    renderStudentPlanHtml: renderStudentPlanHtml,
    classPictureCsv: classPictureCsv,
    CLASS_PICTURE_COLS: COLS,
    CLASS_PICTURE_CSV_HEAD: CSV_HEAD,
    CLASS_PICTURE_STATUS_HE: STATUS_HE,
    CLASS_PICTURE_NOTE: NOTE,
  };
});
