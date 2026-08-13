// MelodyMath — guided ear lessons for functions.html.
//
// Tasks are about THIS sampling: root click, asymptote jump, silence
// outside the domain, or "which of two sweeps matches X". Nothing here
// claims a student will learn algebra by listening.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const G = (typeof module === 'object' && module.exports)
    ? require('./graphListen')
    : (typeof globalThis !== 'undefined' ? globalThis : {});

  const LESSONS = [
    {
      id: 'root-click',
      kind: 'identify',
      titleHe: 'נקישה = שורש',
      promptHe: 'שמעו את הסריקה. מה מסמנת הנקישה הקצרה?',
      teachHe: 'כשהגרף חוצה את ציר האיקס, הצליל עובר מנמוך לגבוה (או להפך) ויש נקישה. זה סימן לדגימה, לא «קול השורש».',
      listenFor: 'root',
      family: 'quadratic',
      p: { a: 0.4, b: 0, c: -4 },
      choices: [
        { id: 'root', labelHe: 'שורש — חציית ציר איקס' },
        { id: 'asy', labelHe: 'אסימפטוטה — קפיצה חדה' },
        { id: 'undef', labelHe: 'שקט — מחוץ לתחום' },
      ],
      answer: 'root',
    },
    {
      id: 'asy-jump',
      kind: 'identify',
      titleHe: 'קפיצה = אסימפטוטה',
      promptHe: 'שמעו את הסריקה. מה קורה ליד איקס אפס?',
      teachHe: 'ב־1/x הצליל בורח לקצה ואז נקטע. זו אסימפטוטה אנכית בדגימה — לא הוכחה.',
      listenFor: 'asymptote',
      family: 'reciprocal',
      p: { a: 3, b: 0 },
      choices: [
        { id: 'root', labelHe: 'שורש — חציית ציר איקס' },
        { id: 'asy', labelHe: 'אסימפטוטה — קפיצה ואז שקט' },
        { id: 'flat', labelHe: 'גובה כמעט קבוע' },
      ],
      answer: 'asy',
    },
    {
      id: 'undef-sqrt',
      kind: 'identify',
      titleHe: 'שקט = מחוץ לתחום',
      promptHe: 'שמעו משמאל לימין. איפה השקט, ומה הוא אומר?',
      teachHe: '√(x) לא מוגדר לשליליים. משמאל יש שקט, מימין הצליל מתחיל נמוך ועולה לאט.',
      listenFor: 'undefined',
      family: 'sqrt',
      p: { a: 2, b: 0 },
      choices: [
        { id: 'undef', labelHe: 'שקט משמאל — מחוץ לתחום' },
        { id: 'asy', labelHe: 'קפיצה באמצע — אסימפטוטה' },
        { id: 'root', labelHe: 'נקישה באמצע — שורש' },
      ],
      answer: 'undef',
    },
    {
      id: 'trend-up',
      kind: 'identify',
      titleHe: 'עולה בקצב קבוע',
      promptHe: 'שמעו את הגליסנדו. לאן הולך הגובה?',
      teachHe: 'קו ישר עולה נשמע כגליסנדו בקצב קבוע. התלילות היא השיפוע.',
      listenFor: 'trend',
      family: 'linear',
      p: { a: 1.2, b: -2 },
      choices: [
        { id: 'up', labelHe: 'עולה בקצב קבוע' },
        { id: 'down', labelHe: 'יורד בקצב קבוע' },
        { id: 'updown', labelHe: 'עולה ואז יורד' },
      ],
      answer: 'up',
    },
    {
      id: 'compare-root',
      kind: 'compare',
      titleHe: 'למי יש שורש?',
      promptHe: 'שמעו א׳ ואז ב׳. לאיזה גרף יש נקישת שורש?',
      teachHe: 'א׳ הוא x²+1 (מעל הציר, בלי נקישה). ב׳ הוא x²−4 (שתי חציות). הנקישה היא הסימן.',
      listenFor: 'root',
      a: { family: 'quadratic', p: { a: 0.4, b: 0, c: 2 } },
      b: { family: 'quadratic', p: { a: 0.4, b: 0, c: -4 } },
      choices: [
        { id: 'A', labelHe: 'רק א׳' },
        { id: 'B', labelHe: 'רק ב׳' },
        { id: 'both', labelHe: 'שניהם' },
      ],
      answer: 'B',
    },
    {
      id: 'compare-asy',
      kind: 'compare',
      titleHe: 'למי יש אסימפטוטה?',
      promptHe: 'שמעו א׳ ואז ב׳. מי קופץ ונחתך?',
      teachHe: 'א׳ לינארי — גליסנדו רציף. ב׳ הוא 1/x — צוק ואז שקט.',
      listenFor: 'asymptote',
      a: { family: 'linear', p: { a: 0.8, b: 0 } },
      b: { family: 'reciprocal', p: { a: 3, b: 0 } },
      choices: [
        { id: 'A', labelHe: 'רק א׳' },
        { id: 'B', labelHe: 'רק ב׳' },
        { id: 'both', labelHe: 'שניהם' },
      ],
      answer: 'B',
    },
    {
      id: 'compare-trend',
      kind: 'compare',
      titleHe: 'מי עולה ומי יורד?',
      promptHe: 'שמעו א׳ ואז ב׳. מי הגליסנדו היורד?',
      teachHe: 'שיפוע חיובי עולה, שיפוע שלילי יורד. אותו ייצוג — לא קול הפונקציה.',
      listenFor: 'trend',
      a: { family: 'linear', p: { a: 1.4, b: 0 } },
      b: { family: 'linear', p: { a: -1.4, b: 0 } },
      choices: [
        { id: 'A', labelHe: 'א׳ יורד' },
        { id: 'B', labelHe: 'ב׳ יורד' },
        { id: 'same', labelHe: 'אותו כיוון' },
      ],
      answer: 'B',
    },
  ];

  function lessonById(id) {
    return LESSONS.find(function (L) { return L.id === id; }) || null;
  }

  function lessonIndex(id) {
    return LESSONS.findIndex(function (L) { return L.id === id; });
  }

  function nextLesson(id) {
    const i = lessonIndex(id);
    if (i < 0) return LESSONS[0];
    return LESSONS[(i + 1) % LESSONS.length];
  }

  function checkListenAnswer(lesson, given) {
    if (!lesson) return false;
    return String(given == null ? '' : given) === String(lesson.answer);
  }

  function classifyHearing(summary) {
    const s = summary || {};
    const roots = (s.roots || []).length;
    const asy = (s.asymptotes || []).length;
    const undef = (s.undefinedSpans || []).length;
    return {
      trend: s.trend || 'flat',
      hasRoot: roots > 0,
      rootCount: roots,
      hasAsymptote: asy > 0,
      hasUndefined: undef > 0,
    };
  }

  function compareHearing(sumA, sumB) {
    const a = classifyHearing(sumA);
    const b = classifyHearing(sumB);
    const bits = [];
    if (a.hasRoot !== b.hasRoot) {
      bits.push(a.hasRoot ? 'רק לא׳ יש שורש בדגימה.' : 'רק לב׳ יש שורש בדגימה.');
    } else if (a.hasRoot && b.hasRoot) {
      bits.push('לשניהם יש שורש.');
    } else {
      bits.push('לא נמצא שורש באף אחת מהדגימות.');
    }
    if (a.hasAsymptote !== b.hasAsymptote) {
      bits.push(a.hasAsymptote ? 'רק א׳ קופץ (אסימפטוטה).' : 'רק ב׳ קופץ (אסימפטוטה).');
    }
    if (a.trend !== b.trend) {
      bits.push('המגמה שונה: א׳ ' + a.trend + ', ב׳ ' + b.trend + '.');
    }
    bits.push('השוואה בין שתי דגימות — לא הוכחה ואין כאן «קול הפונקציה».');
    return {
      a: a,
      b: b,
      sameTrend: a.trend === b.trend,
      cueHe: bits.join(' '),
    };
  }

  function describeLessonHe(lesson) {
    if (!lesson) return '';
    return (lesson.titleHe || '') + '. ' + (lesson.promptHe || '') + ' '
      + 'זה תרגול האזנה לדגימה, לא מבחן שמיעה ולא הוכחה ששומעים לומדים אלגברה.';
  }

  function summarizeSpec(spec, xmin, xmax, n) {
    if (!spec || typeof spec.fn !== 'function' || typeof G.sampleCurve !== 'function') return null;
    const samples = G.sampleCurve(spec.fn, xmin == null ? -8 : xmin, xmax == null ? 8 : xmax, n || 200);
    return G.summarizeCurve(samples);
  }

  return {
    LISTEN_LESSONS: LESSONS,
    lessonById: lessonById,
    lessonIndex: lessonIndex,
    nextLesson: nextLesson,
    checkListenAnswer: checkListenAnswer,
    classifyHearing: classifyHearing,
    compareHearing: compareHearing,
    describeLessonHe: describeLessonHe,
    summarizeSpec: summarizeSpec,
  };
});
