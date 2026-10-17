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

  function isStorageAvailable(storage) {
    const ls = storage || defaultStorage();
    if (!ls) return false;
    try {
      ls.getItem(ONBOARD_KEY);
      return true;
    } catch (e) {
      return false;
    }
  }

  function shouldShowOnboard(storage) {
    if (!isStorageAvailable(storage)) return false;
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
    return String(s == null ? '' : s).replace(/[&<>"'€]/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;', '€': '&euro;' })[c];
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
      + '<a href="demo.html" id="onboardDemoVideoLink" class="secondary">צפו בסרטון</a>'
      + '</div></aside>';
  }

  function demoVideoScenes() {
    return [
      {
        id: 'intro',
        durationSec: 35,
        timeRange: '0:00–0:35',
        titleHe: '1. פתיחה וסרגל נגישות',
        narrationHe: 'פותחים את MelodyMath בדפדפן בלי חשבון ובלי התקנה. בסרגל העליון בוחרים שכבה א׳–ו׳, מזינים קוד כיתה ושם תלמיד שנשמרים במכשיר בלבד, ומתאימים ניגודיות, אות גדולה, הקראה או שקט.',
        screenHe: 'סרגל כיתה א׳–ו׳ · ניגודיות · אות גדולה · הקראה · מצב שקט',
        freqHz: 262,
      },
      {
        id: 'diagnostic',
        durationSec: 35,
        timeRange: '0:35–1:10',
        titleHe: '2. אבחון קצר לפי שכבה',
        narrationHe: 'לוחצים על «מתחילים אבחון». המערכת מציגה שתי שאלות מכל מיומנות בשכבה — אחת ברמת בסיס ואחת ברמת ביניים — כדי למפות אילו נושאים דורשים תרגול נוסף.',
        screenHe: 'אבחון קצר · 2 שאלות למיומנות (בסיס + ביניים) · מיפוי התחלתי',
        freqHz: 330,
      },
      {
        id: 'adaptive',
        durationSec: 45,
        timeRange: '1:10–1:55',
        titleHe: '3. תרגול אישי לפי פערים וייצוג מוזיקלי',
        narrationHe: 'התרגול מתמקד במיומנויות שבהן היו טעויות: מנייה בפעמות מטרונום, ישר המספרים כסולם צלילים, לוח המאה בצלילי עשרות ויחידות, ושברים מול תיבת 4/4. כפולות 3, 6, 7, 8 ו־9 נפתחות רק לאחר תרגול כפולות 2, 4, 5 ו־10.',
        screenHe: 'תרגול אדפטיבי · ישר מספרים כסולם · תיבת 4/4 · שער כפולות ליבה',
        freqHz: 392,
      },
      {
        id: 'teacher',
        durationSec: 35,
        timeRange: '1:55–2:30',
        titleHe: '4. מצב כיתה, דוח מורה ודפי עבודה',
        narrationHe: 'במצב כיתה מריצים סבב של 8 דקות בלחיצה. בדוח המורה רואים אחוזי דיוק, שגיאות חוזרות, תוכנית לימודים אישית, מכתב להורה והדפסת דף עבודה עם מחוון למי שעובד בלי טאבלט.',
        screenHe: 'מצב כיתה (8 דק׳) · דוח מורה מקומי · תוכנית אישית · דף עבודה להדפסה',
        freqHz: 523,
      },
    ];
  }

  function renderDemoVideoHtml(activeIdx) {
    const scenes = demoVideoScenes();
    const idx = Math.max(0, Math.min(scenes.length - 1, Math.round(Number(activeIdx) || 0)));
    const cur = scenes[idx];
    const tabs = scenes.map(function (s, i) {
      return '<button type="button" class="demo-scene-btn' + (i === idx ? ' active' : '') + '" '
        + 'data-scene="' + i + '" aria-pressed="' + (i === idx ? 'true' : 'false') + '">'
        + escapeHtml(s.titleHe) + ' <span dir="ltr">(' + escapeHtml(s.timeRange) + ')</span></button>';
    }).join('');
    return '<section class="demo-video-card" id="demoVideoPlayer" dir="rtl" aria-label="סרטון הדגמה מודרך">'
      + '<div class="demo-video-stage" id="demoVideoStage">'
      + '<canvas id="demoVideoCanvas" width="640" height="300" aria-hidden="true"></canvas>'
      + '<div class="demo-video-overlay" aria-live="polite">'
      + '<p class="demo-time" dir="ltr">' + escapeHtml(cur.timeRange) + ' · 2:30</p>'
      + '<h2 id="demoSceneTitle">' + escapeHtml(cur.titleHe) + '</h2>'
      + '<p id="demoSceneScreen" class="demo-screen-pill">' + escapeHtml(cur.screenHe) + '</p>'
      + '<p id="demoSceneNarration">' + escapeHtml(cur.narrationHe) + '</p>'
      + '</div></div>'
      + '<div class="demo-video-controls">'
      + '<button type="button" id="demoPlayBtn" class="primary">▶ הפעלת סרטון ההדגמה (2:30 דק׳)</button>'
      + '<button type="button" id="demoNextSceneBtn" class="secondary">הפרק הבא</button>'
      + '<a href="index.html" class="secondary">פתיחת התרגול החי</a>'
      + '</div>'
      + '<div class="demo-scene-list" role="group" aria-label="פרקי סרטון ההדגמה">' + tabs + '</div>'
      + '<p class="demo-disclaimer">הדגמה של זרימת העבודה בכיתה בלבד — ללא הבטחת הישגים, ללא רישום וללא שמירת נתונים בענן.</p>'
      + '</section>';
  }

  function injectDemoVideoHeaderLink(doc) {
    const d = doc || (typeof document !== 'undefined' ? document : null);
    if (!d || typeof d.querySelector !== 'function' || typeof d.createElement !== 'function') return false;
    if (d.querySelector('a[href="demo.html"]')) return true;
    const nav = d.querySelector('.top-links, .mm-nav, header nav, header');
    if (!nav || typeof nav.appendChild !== 'function') return false;
    const a = d.createElement('a');
    a.href = 'demo.html';
    a.className = 'mm-demo-video-link';
    a.textContent = 'צפו בסרטון';
    nav.appendChild(a);
    return true;
  }

  if (typeof document !== 'undefined' && typeof document.addEventListener === 'function') {
    document.addEventListener('DOMContentLoaded', function () {
      injectDemoVideoHeaderLink(document);
    });
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
    demoVideoScenes: demoVideoScenes,
    renderDemoVideoHtml: renderDemoVideoHtml,
    injectDemoVideoHeaderLink: injectDemoVideoHeaderLink,
    escapeHtml: escapeHtml,
    isStorageAvailable: isStorageAvailable,
  };
});
