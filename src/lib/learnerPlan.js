// One topic per child, on a path from grade א׳ to ו׳.
// The last playable topic of a grade opens the first playable topic of the next.
// Gaps stay gaps. No mastery claim and no claim that rhythm improves math.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const CUR = (typeof module === 'object' && module.exports)
    ? require('./curriculum')
    : (typeof globalThis !== 'undefined' ? globalThis : {});
  const WEEK = 7 * 24 * 60 * 60 * 1000;
  const NOTE = 'ספירה במכשיר הזה בלבד. לא ציון ולא אבחון. אין טענה שהקצב משפר מתמטיקה.';
  const HOOKS = [
    ['ספירה עד 100', 'פעימה במטרונום, וסופרים'],
    ['מנייה עד 100', 'עשר פעימות, ואז בס לעשרת'],
    ['מיקום מקורב', 'קרוב מספיק — כל 10 הוא אוקטבה'],
    ['ישר המספרים', 'כל קפיצה היא צעד בסולם'],
    ['בתחום 10', 'תרגיל אחד לפעימה איטית'],
    ['דגמים', 'דגם צלילי שחוזר'],
    ['דו־ספרתי', 'יחידות בתוף, עשרת בבס'],
    ['1,000', 'תוף ליחידות, בס לעשרת'],
    ['כפולות 2', 'תיבות כפול פעימות'],
    ['לוח כפל', 'משקל 3/4 או 6/8 ללוח שנפתח'],
    ['כפולות בקצב', 'אומרים את הכפולות, והצליל עוצר לפני הבאה'],
    ['שארית', 'פעמות שנשארות מחוץ לתיבה'],
    ['דו־שלבי', 'קודם מה מחשבים, ואז הקצב'],
    ['10,000', 'משווים שני תדרים'],
    ['1/2, 1/4, 1/8', 'תיבה 4/4: שלם, חצי, רבע, שמינית'],
    ['הרחבה, צמצום', 'אותו שבר, שם אחר'],
    ['כפל וחילוק שברים', 'תו מנוקד מול שלישייה'],
    ['אחוזים', '100% הוא התיבה השלמה'],
  ];
  // [topic fragment, sessions/week, minutes/session, weeks-range, source-label]
  const PACE = [
    ['ספירה עד 100', 3, 8, '2–4', 'הערכה'],
    ['מנייה עד 100', 3, 8, '2–4', 'הערכה'],
    ['ישר המספרים', 3, 8, '2–3', 'הערכה'],
    ['בתחום 10', 3, 8, '3–5', 'הערכה'],
    ['דו־ספרתי', 3, 8, '3–5', 'הערכה'],
    ['כפולות 2', 3, 8, '2–3', 'הערכה'],
    ['לוח כפל', 3, 8, '4–8', 'הערכה'],
    ['שארית', 3, 8, '2–4', 'הערכה'],
    ['דו־שלבי', 3, 8, '3–5', 'הערכה'],
    ['1/2, 1/4, 1/8', 3, 8, '4–6', 'Azaryahu et al. 2020 (12 מפגשים)'],
  ];
  // Fresh card: the domain RAMA's early instrument actually opens with.
  // No published fail-rate for grades א׳–ג׳ was found, so none is shown.
  const FRESH = {
    'א': ['ספירה עד 100', 'מבדק «יסודות» לכיתה א׳, ראמ״ה', 'https://rama.gov.il/tools/math-basics', 'הפעימה הראשונה בודקת מנייה וספירה.'],
    'ב': ['דו־ספרתי', 'מבדק מתמטיקה לכיתה ג׳, ראמ״ה', 'https://rama.gov.il/tools/mivdak-math-heb-grade3', 'המבדק בודק חיבור, חיסור ומבנה עשרוני שנבנים בכיתות א׳–ב׳.'],
    'ג': ['לוח כפל', 'מבדק מתמטיקה לכיתה ג׳, ראמ״ה', 'https://rama.gov.il/tools/mivdak-math-heb-grade3', 'כפל וחילוק הם אחד מארבעת התחומים במבדק.'],
    'ד': ['1/2, 1/4, 1/8', 'Courey et al. 2012; Azaryahu et al. 2020', 'https://doi.org/10.1111/desc.12882', 'שברים דרך ערכי תווים נבדקו בכיתות ג׳–ד׳. אין כאן טענה על הכלי הזה.'],
    'ה': ['הרחבה, צמצום', 'המשך מסלול השברים', 'https://doi.org/10.1111/desc.12882', 'השלב שאחרי תיבה 4/4. מה שאין בבנק נשאר פער.'],
    'ו': ['כפל וחילוק שברים', 'מיצ״ב מתפרסם מכיתה ה׳, לא מכיתה ו׳', 'https://rama.gov.il/reports/math-studies-2', 'המשך המסלול. אין כאן אחוז ארצי חדש לכיתה ו׳.'],
  };
  const KEY = {
    counting: 'counting', 'מנייה': 'counting', addition: 'addition', 'חיבור': 'addition',
    subtraction: 'subtraction', 'חיסור': 'subtraction', number_line: 'number_line', 'ישר מספרים': 'number_line',
    multiplication: 'multiplication', 'כפל': 'multiplication', division: 'division', 'חילוק': 'division',
    basic_fractions: 'fractions', 'שברים — תיבה 4/4': 'fractions', fractions: 'fractions', 'שברים': 'fractions',
    word_problems: 'words', 'שאלות מילוליות': 'words', place_value: 'place', 'מבנה עשרוני': 'place',
    geometry: 'geo', 'גאומטריה': 'geo', measurement: 'measure', 'מדידה': 'measure',
    data: 'data', 'נתונים': 'data', decimals: 'dec', 'שברים עשרוניים': 'dec', percent: 'percent', 'אחוזים': 'percent',
  };
  const FRAG = {
    'א': { counting: 'ספירה עד 100', addition: 'בתחום 10', subtraction: 'בתחום 10', number_line: 'ישר המספרים', words: 'מצבי חיבור', geo: 'מצולעים', measure: 'מדידת אורך', data: 'דיאגרמת' },
    'ב': { place: '1,000', addition: 'דו־ספרתי', subtraction: 'דו־ספרתי', multiplication: 'כפולות 2', division: 'חילוק לחלקים', geo: 'מצולעים', measure: 'ס״מ', data: 'טבלה', words: 'דו־ספרתי' },
    'ג': { addition: 'עד רבבה', subtraction: 'עד רבבה', multiplication: 'לוח כפל', division: 'שארית', place: '10,000', words: 'השוואה כפליות', geo: 'זווית', measure: 'שטח מלבן', data: 'איסוף, ארגון' },
    // ד׳–ו׳ diagnose geometry, measurement and data too (banks.GRADE_SKILLS).
    // Without a row here those answers landed on no topic and fell out of the plan.
    'ד': { fractions: '1/2, 1/4, 1/8', geo: 'מקבילים', measure: 'יחידות אורך' },
    'ה': { fractions: 'הרחבה, צמצום', dec: 'עשרוניים', data: 'דיאגרמות' },
    'ו': { fractions: 'כפל וחילוק שברים', percent: 'אחוזים', dec: 'עשרוניים', data: 'ממוצע', geo: 'מעגל' },
  };
  function hookFor(topic) {
    const text = String(topic || '');
    for (let i = 0; i < HOOKS.length; i++) if (text.indexOf(HOOKS[i][0]) !== -1) return HOOKS[i][1];
    return 'תרגיל קצר אחד מהבנק';
  }
  // Returns the row without its topic fragment: [sessions/week, minutes/session, weeks-range, source-label].
  // Index from 0 here, not with the PACE column numbers.
  function paceFor(topic) {
    const text = String(topic || '');
    for (let i = 0; i < PACE.length; i++) if (text.indexOf(PACE[i][0]) !== -1) return [PACE[i][1], PACE[i][2], PACE[i][3], PACE[i][4]];
    return [3, 8, '—', 'הערכה'];
  }
  let cached = null;
  function learningPath() {
    if (cached) return cached;
    const steps = [];
    (CUR.MATRIX || []).forEach(function (row) {
      steps.push({
        id: row.topicId, grade: row.grade, topic: row.topic, status: row.status,
        playable: row.status !== CUR.GAP, hook: hookFor(row.topic), index: steps.length,
      });
    });
    steps.forEach(function (step, i) {
      let n = i + 1;
      while (n < steps.length && !steps[n].playable) n += 1;
      const nxt = n < steps.length ? steps[n] : null;
      step.nextId = nxt ? nxt.id : '';
      step.nextGrade = nxt ? nxt.grade : '';
      step.nextTopic = nxt ? nxt.topic : '';
    });
    cached = steps;
    return steps;
  }
  function ofGrade(grade) {
    return learningPath().filter(function (s) { return s.grade === grade; });
  }
  function findFrag(grade, fragment) {
    const list = ofGrade(grade);
    const playable = list.filter(function (s) { return s.playable; });
    if (!fragment) return playable[0] || list[0] || null;
    for (let i = 0; i < list.length; i++) if (list[i].topic.indexOf(fragment) !== -1) return list[i];
    return playable[0] || list[0] || null;
  }
  function onward(step) {
    if (!step) return null;
    if (step.playable) return step;
    if (!step.nextId) return null;
    const all = learningPath();
    for (let i = 0; i < all.length; i++) if (all[i].id === step.nextId) return all[i];
    return null;
  }
  function stepFor(grade, skill) {
    const raw = String(skill || '');
    const key = KEY[raw];
    const frag = key && FRAG[grade] ? FRAG[grade][key] : '';
    if (frag) return findFrag(grade, frag);
    const list = ofGrade(grade);
    for (let i = 0; i < list.length; i++) {
      if (raw && (list[i].topic.indexOf(raw) !== -1 || raw.indexOf(list[i].topic) !== -1)) return list[i];
    }
    return null;
  }
  function knownGrade(value) {
    if (value == null || String(value).trim() === '') return '';
    const s = String(value).trim();
    return (CUR.grades() || []).indexOf(s) >= 0 ? s : null;
  }
  function skillRows(grade, list) {
    const out = [];
    list.forEach(function (row) {
      if (!row || typeof row !== 'object' || Array.isArray(row)) return;
      const total = Number(row.total);
      const correct = Number(row.correct);
      if (!Number.isFinite(total) || !Number.isFinite(correct) || total < 0 || correct < 0 || correct > total) return;
      const step = stepFor(grade, row.skill);
      if (!step) return;
      out.push({ total: total, correct: correct, accuracy: total ? correct / total : 0, step: step });
    });
    return out;
  }
  function fromStudent(grade, student) {
    const bucket = Object.create(null);
    ((student && student.sessions) || []).forEach(function (sess) {
      ((sess && sess.items) || []).forEach(function (it) {
        if (!it || !it.skill) return;
        const g = bucket[it.skill] || (bucket[it.skill] = { skill: String(it.skill), total: 0, correct: 0 });
        g.total += 1;
        if (it.correct) g.correct += 1;
      });
    });
    return skillRows(grade, Object.keys(bucket).map(function (k) { return bucket[k]; }));
  }
  function weekCount(student, sessions, now) {
    const list = Array.isArray(sessions) ? sessions : ((student && student.sessions) || []);
    let n = 0;
    list.forEach(function (s) {
      const at = Number(s && s.started);
      if (Number.isFinite(at) && at <= now && now - at <= WEEK) n += 1;
    });
    return n;
  }
  function diagPercent(student) {
    let t = 0;
    let c = 0;
    ((student && student.sessions) || []).forEach(function (s) {
      if (!s || !/diag|pre|post|check/i.test(String(s.kind || ''))) return;
      (s.items || []).forEach(function (it) { if (!it) return; t += 1; if (it.correct) c += 1; });
    });
    return t ? Math.round(100 * c / t) : '';
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (ch) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch];
    });
  }
  function bad(message) {
    return {
      ok: false, branch: 'invalid', grade: '', topic: '', hook: '', name: '',
      childLine: message, adultLine: message, boardLine: '—',
      paceExpected: 0, paceDone: 0, minutes: 8, weeksRange: '—', paceSource: 'הערכה', sourceTitle: '', sourceUrl: '', why: '',
      nextGrade: '', nextTopic: '', disclaimer: NOTE, gaps: [], diagPercent: '',
    };
  }
  function pack(s) {
    const who = s.name ? s.name + ' · ' : '';
    const moved = s.advanced ? ' הנושא הקודם מולא. עכשיו נושא אחד חדש.' : '';
    const pace = paceFor(s.topic);
    return {
      ok: true, branch: s.branch, grade: s.grade, topic: s.topic, hook: s.hook, name: s.name || '',
      childLine: 'היום: ' + s.topic + '. ' + s.hook + '.',
      adultLine: who + s.topic + '. ' + s.why + moved + ' הקצב: ' + s.expected + ' מפגשים של 8 דקות השבוע. התקדמות: ' + s.done + ' מתוך ' + s.expected + '.',
      boardLine: s.topic + ' · ' + s.done + '/' + s.expected,
      paceExpected: s.expected, paceDone: s.done, minutes: pace[1], weeksRange: pace[2], paceSource: pace[3],
      sourceTitle: s.sourceTitle || '', sourceUrl: s.sourceUrl || '', why: s.why,
      nextGrade: s.nextGrade || '', nextTopic: s.nextTopic || '', disclaimer: NOTE,
      gaps: s.gaps || [], diagPercent: s.diagPercent == null ? '' : s.diagPercent,
    };
  }
  function buildLearnerPlan(input) {
    const src = input && typeof input === 'object' && !Array.isArray(input) ? input : null;
    if (!src) return bad('בחרו כיתה א׳ עד ו׳.');
    const grade = knownGrade(src.grade);
    if (!grade) return bad('בחרו כיתה א׳ עד ו׳.');
    if (src.perSkill != null && !Array.isArray(src.perSkill)) return bad('הנתונים לא בפורמט של תוצאות.');
    const now = Number.isFinite(Number(src.now)) ? Number(src.now) : Date.now();
    let rows = [];
    if (Array.isArray(src.perSkill)) {
      rows = skillRows(grade, src.perSkill);
      if (src.perSkill.length && !rows.length) return bad('הנתונים לא בפורמט של תוצאות.');
    } else if (src.student) rows = fromStudent(grade, src.student);
    const done = weekCount(src.student, src.sessions, now);
    const name = String(src.name || (src.student && src.student.name) || '').trim();
    const diag = diagPercent(src.student);
    if (!rows.length) {
      const fresh = FRESH[grade];
      const step = onward(findFrag(grade, fresh[0]));
      if (!step) return bad('אין נושא לכיתה הזו.');
      return pack({
        branch: 'fresh', grade: grade, name: name, topic: step.topic, hook: step.hook, why: fresh[3],
        expected: 3, done: done, sourceTitle: fresh[1], sourceUrl: fresh[2],
        nextGrade: step.nextGrade, nextTopic: step.nextTopic, diagPercent: diag,
      });
    }
    const weak = rows.filter(function (r) { return r.total >= 1 && r.accuracy < 0.6; })
      .sort(function (a, b) { return a.step.index - b.step.index; });
    if (weak.length) {
      const step = onward(weak[0].step) || weak[0].step;
      const skipped = step.id !== weak[0].step.id;
      return pack({
        branch: 'weak', grade: step.grade, name: name, topic: step.topic, hook: step.hook,
        why: (skipped ? weak[0].step.topic + ' עדיין לא בבנק. בינתיים ' : '') + weak[0].correct + ' מתוך ' + weak[0].total + ' בתרגול שבמכשיר.',
        expected: 3, done: done, nextGrade: step.nextGrade, nextTopic: step.nextTopic, diagPercent: diag,
        gaps: weak.slice(0, 3).map(function (r) { return r.step.topic; }),
      });
    }
    const practiced = rows.filter(function (r) { return r.total > 0; });
    const strong = practiced.length && practiced.every(function (r) { return r.total >= 4 && r.accuracy >= 0.8; });
    if (strong) {
      practiced.sort(function (a, b) { return a.step.index - b.step.index; });
      const far = practiced[practiced.length - 1].step;
      const nxt = far.nextId ? learningPath().filter(function (s) { return s.id === far.nextId; })[0] : null;
      const step = nxt || far;
      return pack({
        branch: 'strong', grade: step.grade, name: name, topic: step.topic, hook: step.hook,
        why: nxt ? 'מה שתורגל עד כאן עבר את 80% (לפחות 4 תשובות).' : 'זה הנושא האחרון שיש לו תרגיל במסלול.',
        expected: 2, done: done, advanced: !!nxt, nextGrade: step.nextGrade, nextTopic: step.nextTopic, diagPercent: diag,
      });
    }
    rows.sort(function (a, b) { return a.accuracy - b.accuracy || a.step.index - b.step.index; });
    const step = onward(rows[0].step) || rows[0].step;
    return pack({
      branch: 'mixed', grade: step.grade, name: name, topic: step.topic, hook: step.hook,
      why: 'עדיין אין מספיק תשובות כדי לעבור נושא.', expected: 3, done: done,
      nextGrade: step.nextGrade, nextTopic: step.nextTopic, diagPercent: diag,
    });
  }
  // The leading gaps a teacher board names for one child: every practised
  // skill that lands on a topic and is still under 80%, weakest first, at most
  // three. Two skills can land on the same topic (in grade א׳ both חיבור and
  // חיסור are «בתחום 10»), so a topic is named once. An unknown grade or a
  // child with no usable rows has no gaps — not a made-up one.
  function topGaps(input) {
    const src = input && typeof input === 'object' && !Array.isArray(input) ? input : null;
    const grade = src ? knownGrade(src.grade) : null;
    if (!grade) return [];
    if (src.perSkill != null && !Array.isArray(src.perSkill)) return [];
    const rows = Array.isArray(src.perSkill) ? skillRows(grade, src.perSkill) : fromStudent(grade, src.student);
    const seen = Object.create(null);
    const out = [];
    rows.filter(function (r) { return r.total >= 1 && r.accuracy < 0.8; })
      .sort(function (a, b) { return a.accuracy - b.accuracy || a.step.index - b.step.index; })
      .forEach(function (r) {
        if (out.length >= 3 || seen[r.step.topic]) return;
        seen[r.step.topic] = true;
        out.push(r.step.topic);
      });
    return out;
  }
  function renderLearnerPlanHtml(plan) {
    const p = plan || bad('בחרו כיתה א׳ עד ו׳.');
    const max = p.paceExpected || 0;
    const width = max ? Math.min(100, Math.round(100 * p.paceDone / max)) : 0;
    const source = p.sourceUrl ? '<a class="mm-plan-source" href="' + esc(p.sourceUrl) + '">' + esc(p.sourceTitle) + '</a>' : '';
    // A typical range belongs to a topic. The error card has no topic, so it borrows no range.
    const range = p.ok === false || !p.topic ? ''
      : ' טווח טיפוסי: ' + esc(p.weeksRange || '—') + ' שבועות (' + esc(p.paceSource || 'הערכה') + ').';
    const adult = esc(p.adultLine) + range;
    return '<article class="mm-plan" data-branch="' + esc(p.branch) + '" data-grade="' + esc(p.grade) + '" data-topic="' + esc(p.topic) + '" dir="rtl">'
      + '<p class="mm-plan-kicker">תוכנית אחת</p><h2 class="mm-plan-topic">' + esc(p.childLine) + '</h2>'
      + '<p class="mm-plan-adult">' + adult + '</p><p class="mm-plan-pace">' + (max ? esc(p.paceDone + ' מתוך ' + max + ' מפגשים השבוע') : '') + '</p>'
      + '<div class="mm-plan-track" role="progressbar" aria-valuemin="0" aria-valuemax="' + max + '" aria-valuenow="' + p.paceDone + '" aria-label="התקדמות בנושא" aria-valuetext="' + esc(p.paceDone + ' מתוך ' + max) + '"><span style="width:' + width + '%"></span></div>'
      + source + '<p class="mm-plan-note">' + esc(p.disclaimer) + '</p></article>';
  }
  function bridgeSentence() {
    return 'המסלול רציף: הנושא האחרון שיש לו תרגיל בכיתה נפתח אל הנושא הראשון בכיתה הבאה, מא׳ עד ו׳. פער נשאר פער.';
  }
  return {
    learningPath: learningPath,
    buildLearnerPlan: buildLearnerPlan,
    topGaps: topGaps,
    renderLearnerPlanHtml: renderLearnerPlanHtml,
    bridgeSentence: bridgeSentence,
    hookFor: hookFor,
    paceFor: paceFor,
    PACE: PACE,
  };
});
