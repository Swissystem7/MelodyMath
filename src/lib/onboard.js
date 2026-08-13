// MelodyMath — first-run walkthrough for a teacher who never saw the page.
//
// One device, no account. Shown once until dismissed. Not a product tour
// that claims outcomes — just "where to click" on a shared tablet.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const ONBOARD_KEY = 'mm-onboard-v1';

  function defaultStorage() {
    try {
      if (typeof localStorage !== 'undefined') return localStorage;
    } catch (e) { /* private mode */ }
    return null;
  }

  function onboardSteps() {
    return [
      {
        id: 'who',
        titleHe: '1. מי על הטאבלט',
        bodyHe: 'כתבו קוד כיתה ושם או קוד ילד בסרגל למעלה, ולחצו «שמירה במכשיר». הרישום נשאר רק כאן. אותו קוד בטאבלט אחר לא משתף כלום.',
      },
      {
        id: 'access',
        titleHe: '2. נגישות קודם',
        bodyHe: 'בסרגל הסגול: ניגודיות, אות גדולה, הקראה בעברית, המתנה ארוכה, או שקט. זה המוצר — לא תוספת. התאימו פעם אחת לילד שלפניכם.',
      },
      {
        id: 'try',
        titleHe: '3. מפגש ראשון',
        bodyHe: 'בחרו כיתה בסרגל — לכל שכבה בנק משלה. מצב כיתה: 8 דקות בלחיצה מבנק א׳. או אבחון קצר לפי הכיתה ואז תרגול על מה שפספסנו. «על הפעימה» הוא רשות: חלון תשובה לפי המקצב, והמורה קובעת את ה־BPM.',
      },
      {
        id: 'record',
        titleHe: '4. מה נרשם',
        bodyHe: 'בדוח מורה: ספירה לפי מיומנות, שגיאות שחזרו, מכתב להורה, ותעודת תרגול להדפסה. המספרים הם ספירה במכשיר — לא ציון ולא מילת שליטה.',
      },
      {
        id: 'paper',
        titleHe: '5. בלי טאבלט',
        bodyHe: 'דף עבודה מאותו בנק תרגילים, עם או בלי מחוון בעמוד שני. אחרי ביקור אחד בכתובת — הדף נשמר במכשיר גם בלי רשת.',
      },
    ];
  }

  function normalizeState(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    return { dismissed: !!src.dismissed, step: Math.max(0, Math.round(Number(src.step) || 0)) };
  }

  function loadOnboard(storage) {
    const ls = storage || defaultStorage();
    if (!ls) return normalizeState({});
    try {
      const raw = ls.getItem(ONBOARD_KEY);
      if (!raw) return normalizeState({});
      return normalizeState(JSON.parse(raw));
    } catch (e) {
      return normalizeState({});
    }
  }

  function saveOnboard(state, storage) {
    const ls = storage || defaultStorage();
    const next = normalizeState(state);
    if (!ls) return next;
    try {
      ls.setItem(ONBOARD_KEY, JSON.stringify(next));
    } catch (e) { /* quota */ }
    return next;
  }

  function shouldShowOnboard(storage) {
    return !loadOnboard(storage).dismissed;
  }

  function dismissOnboard(storage) {
    return saveOnboard({ dismissed: true, step: loadOnboard(storage).step }, storage);
  }

  function setOnboardStep(step, storage) {
    const cur = loadOnboard(storage);
    const n = onboardSteps().length;
    const i = Math.max(0, Math.min(n - 1, Math.round(Number(step) || 0)));
    return saveOnboard({ dismissed: cur.dismissed, step: i }, storage);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function renderOnboardHtml(state) {
    const steps = onboardSteps();
    const st = normalizeState(state);
    const i = Math.max(0, Math.min(steps.length - 1, st.step));
    const cur = steps[i];
    const items = steps.map(function (s, idx) {
      return '<li' + (idx === i ? ' aria-current="step"' : '') + '>'
        + '<b>' + escapeHtml(s.titleHe) + '</b> '
        + escapeHtml(s.bodyHe) + '</li>';
    }).join('');
    return '<aside class="first-run" id="firstRunInner">'
      + '<p class="sheet-kicker">פעם ראשונה במכשיר הזה?</p>'
      + '<h2>חמש לחיצות למחנכת שילוב</h2>'
      + '<p>אין חשבון ואין שרת. זה מפת דרכים לדף, לא הבטחה שהתרגול עוזר.</p>'
      + '<ol class="onboard-steps">' + items + '</ol>'
      + '<p class="onboard-now"><b>עכשיו:</b> ' + escapeHtml(cur.titleHe) + ' — ' + escapeHtml(cur.bodyHe) + '</p>'
      + '<div class="onboard-actions">'
      + '<button type="button" id="onboardNext" class="primary">'
      + (i < steps.length - 1 ? 'הצעד הבא' : 'סיום ההדרכה') + '</button>'
      + '<button type="button" id="onboardSkip" class="secondary">אל תציגו שוב</button>'
      + '</div></aside>';
  }

  return {
    ONBOARD_KEY: ONBOARD_KEY,
    onboardSteps: onboardSteps,
    loadOnboard: loadOnboard,
    saveOnboard: saveOnboard,
    shouldShowOnboard: shouldShowOnboard,
    dismissOnboard: dismissOnboard,
    setOnboardStep: setOnboardStep,
    renderOnboardHtml: renderOnboardHtml,
    escapeHtml: escapeHtml,
  };
});
