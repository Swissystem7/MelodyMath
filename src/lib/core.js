// MelodyMath shared kernel — one <script src> for every page.
//
// Classic script (not type=module) so a teacher can open index.html from disk.
// GitHub Pages serves this fine. In the browser this file installs the Hebrew
// site nav, print CSS, and the offline service worker.
// Node tests keep requiring the focused modules directly.
(function (root) {
  const IN_NODE = typeof module === 'object' && module.exports && typeof document === 'undefined';

  function pick() {
    if (IN_NODE) {
      return Object.assign(
        {},
        require('./sonify'),
        require('./adaptive'),
        require('./teacherStore'),
        require('./banks'),
        require('./worksheets'),
        require('./metro'),
        require('./access'),
        require('./graphListen'),
        require('./listenLessons'),
        require('./onboard'),
        require('./tabs'),
        require('./mastery'),
        require('./numberLine'),
        require('./bar44'),
        require('./curriculum')
      );
    }
    return root;
  }

  function siteRoot() {
    const script = document.currentScript || document.querySelector('script[src*="core.js"]');
    if (script && script.src) return script.src.replace(/src\/lib\/[^/?#]+(?:[?#].*)?$/, '');
    return '';
  }

  function ensureHeadLink(rel, href, extra) {
    if (document.querySelector('link[rel="' + rel + '"]' + (extra && extra.attr ? '[' + extra.attr + ']' : ''))) return;
    const link = document.createElement('link');
    link.rel = rel;
    link.href = href;
    if (extra && extra.attr) link.setAttribute(extra.attr, extra.val || '1');
    document.head.appendChild(link);
  }

  function installPwaHooks() {
    if (typeof document === 'undefined') return;
    const rootHref = siteRoot();
    ensureHeadLink('manifest', rootHref + 'manifest.webmanifest');
    if (!document.querySelector('link[rel="apple-touch-icon"]')) {
      const ic = document.createElement('link');
      ic.rel = 'apple-touch-icon';
      ic.href = rootHref + 'icons/icon-192.png';
      document.head.appendChild(ic);
    }
    if (!document.querySelector('meta[name="theme-color"]')) {
      const t = document.createElement('meta');
      t.name = 'theme-color';
      t.content = '#6946e8';
      document.head.appendChild(t);
    }
    if (typeof navigator === 'undefined' || !navigator.serviceWorker) return;
    navigator.serviceWorker.register(rootHref + 'sw.js').then(function () {
      const el = document.getElementById('pwaStatus');
      if (el) el.textContent = 'נשמר בטאבלט · עובד גם בלי רשת אחרי הביקור הראשון';
    }).catch(function () {
      const el = document.getElementById('pwaStatus');
      if (el) el.textContent = 'שמירה ללא-רשת דורשת פתיחה מ־https (לא מקובץ מקומי)';
    });
  }

  function isSonifyPage(here) {
    if (typeof here !== 'string') return false;
    return here === 'functions.html' || here === '807.html' || here === 'frequency.html';
  }

  // The teacher who opens the demo, the coverage page or the offer sees one
  // product: elementary practice. Sonification (high school) keeps its full
  // two-product nav on its own pages and is described on landing.html.
  function siteNavHtml(page) {
    let here = '';
    if (typeof page === 'string') {
      here = page.trim().toLowerCase();
    } else if (typeof page === 'number' && Number.isFinite(page)) {
      here = String(page).toLowerCase();
    }
    const sonify = isSonifyPage(here);
    function link(file, label) {
      const current = here === file || (here === '' && file === 'index.html');
      return '<a href="' + file + '"' + (current ? ' aria-current="page"' : '') + '>' + label + '</a>';
    }
    const elementary = '<span class="mm-prod' + (sonify ? '' : ' on') + '"><span class="mm-prod-label">תרגול יסודי</span>'
      + link('index.html', 'תרגול א׳–ו׳') + ' · '
      + link('program.html', 'תוכנית הלימודים') + ' · '
      + link('curriculum.html', 'כיסוי תוכנית') + '</span>';
    const sonifyPart = sonify
      ? '<span class="mm-prod-split" aria-hidden="true">|</span>'
        + '<span class="mm-prod on"><span class="mm-prod-label">סוניפיקציה · חט״ב/תיכון</span>'
        + link('functions.html', 'שומעים פונקציה') + ' · '
        + link('807.html', 'גדילה ודעיכה') + ' · '
        + link('frequency.html', 'מעבדת תדרים') + '</span>'
      : '';
    return '<span class="mm-brand">♫ MelodyMath</span>'
      + elementary
      + sonifyPart
      + '<span class="mm-prod-meta">'
      + link('landing.html', 'אודות') + ' · '
      + link('offer.html', 'ניסוי כיתתי') + '</span>';
  }

  function installSharedChrome() {
    if (typeof document === 'undefined') return;
    const script = document.currentScript || document.querySelector('script[src*="core.js"]');
    const base = script && script.src ? script.src.replace(/[^/]+$/, '') : 'src/lib/';
    if (!document.querySelector('link[data-mm-print]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = base + 'print.css';
      link.setAttribute('data-mm-print', '1');
      document.head.appendChild(link);
    }
    installPwaHooks();
    hookPracticeFinishSummary(typeof globalThis !== 'undefined' ? globalThis : root, document);
    installAccessBar();
    if (typeof bindAllTablists === 'function') bindAllTablists(document);
    if (typeof refreshSpeakNow === 'function') refreshSpeakNow(document);
    if (document.getElementById('mm-site-nav')) return;
    const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const sonify = isSonifyPage(here);
    const hub = here === 'landing.html' || here === 'offer.html';
    document.body.setAttribute('data-product', sonify ? 'sonify' : hub ? 'hub' : 'elementary');
    const nav = document.createElement('nav');
    nav.id = 'mm-site-nav';
    nav.setAttribute('aria-label', sonify ? 'MelodyMath — שני מוצרים' : 'MelodyMath — תרגול יסודי');
    nav.innerHTML = siteNavHtml(here);
    const existingSkip = document.querySelector('.mm-skip');
    if (existingSkip && existingSkip.parentNode === document.body) {
      document.body.insertBefore(nav, existingSkip.nextSibling);
    } else {
      document.body.insertBefore(nav, document.body.firstChild);
    }
    if (!document.querySelector('.mm-skip')) {
      const skip = document.createElement('a');
      skip.className = 'mm-skip';
      skip.href = '#main';
      skip.textContent = 'דלגו לתוכן';
      document.body.insertBefore(skip, nav);
    }
    const main = document.getElementById('main');
    if (main && !main.hasAttribute('tabindex')) main.setAttribute('tabindex', '-1');
  }

  function countSessionCorrectAnswers(history) {
    if (!Array.isArray(history)) return 0;
    return history.filter(function (x) {
      if (!x || typeof x !== 'object') return false;
      if (x.correct === true) return true;
      if (typeof x.correct === 'number') return Number.isFinite(x.correct) && x.correct > 0;
      return false;
    }).length;
  }

  function toFiniteCount(val) {
    if (val == null || val === '') return 0;
    const num = typeof val === 'number' ? val : Number(val);
    return Number.isFinite(num) ? Math.max(0, Math.floor(num)) : 0;
  }

  function renderExerciseCorrectCount(doc, correct) {
    if (!doc || typeof doc.getElementById !== 'function') return null;
    const safeCorrect = toFiniteCount(correct);
    let el = doc.getElementById('exerciseCorrectCount');
    if (!el && typeof doc.createElement === 'function') {
      el = doc.createElement('p');
      el.id = 'exerciseCorrectCount';
      el.className = 'exercise-correct-count';
      if (typeof el.setAttribute === 'function') {
        el.setAttribute('role', 'status');
        el.setAttribute('aria-live', 'polite');
      }
      const stats = doc.getElementById('stats');
      if (stats && stats.parentNode && typeof stats.parentNode.insertBefore === 'function') {
        stats.parentNode.insertBefore(el, stats.nextSibling);
      }
    }
    if (el) el.textContent = 'היום פתרת נכון ' + safeCorrect + ' שאלות';
    return el;
  }

  function showExerciseSessionSummary(doc, history, options) {
    const opts = options && typeof options === 'object' ? options : {};
    if (!doc || typeof doc.getElementById !== 'function' || !Array.isArray(history)) {
      return { correct: 0, total: 0 };
    }
    const correct = countSessionCorrectAnswers(history);
    const total = history.length;
    const levelForId = typeof opts.levelForId === 'function' ? opts.levelForId : function () { return 1; };
    let maxLevel = 1;
    history.forEach(function (x) {
      if (!x || typeof x !== 'object') return;
      const rawLv = levelForId(x.id);
      const lv = typeof rawLv === 'number' && Number.isFinite(rawLv) ? rawLv : 1;
      if (lv > maxLevel) maxLevel = lv;
    });
    const safeMaxLevel = typeof maxLevel === 'number' && Number.isFinite(maxLevel) ? maxLevel : 1;
    const pct = total > 0 && Number.isFinite(correct / total) ? Math.round((correct / total) * 100) : 0;
    const safePct = Number.isFinite(pct) && pct >= 0 ? pct : 0;
    const statsId = typeof opts.statsId === 'string' && opts.statsId ? opts.statsId : 'stats';
    const statsEl = doc.getElementById(statsId);
    if (statsEl) {
      statsEl['innerHTML'] = '<div class="stat"><strong>' + correct + '/' + total + '</strong>נכונות</div>'
        + '<div class="stat"><strong>' + safePct + '%</strong>דיוק בסבב</div>'
        + '<div class="stat"><strong>' + safeMaxLevel + '</strong>רמה מרבית בסבב</div>';
    }
    renderExerciseCorrectCount(doc, correct);
    const summaryTextId = typeof opts.summaryTextId === 'string' && opts.summaryTextId ? opts.summaryTextId : 'summaryText';
    const summaryTextEl = doc.getElementById(summaryTextId);
    if (summaryTextEl) {
      summaryTextEl.textContent = typeof opts.summaryText === 'string' && opts.summaryText
        ? opts.summaryText
        : 'ספירה של הסבב הזה במכשיר — לא ציון ולא הוכחה שהתרגול עוזר. תרגיל שטעו בו יחזור מוקדם יותר בסבב הבא.';
    }
    if (opts.showPanels) {
      const quiz = doc.getElementById('quiz');
      const summary = doc.getElementById('summary');
      if (quiz && quiz.classList && typeof quiz.classList.toggle === 'function') quiz.classList.toggle('hidden', true);
      if (summary && summary.classList && typeof summary.classList.toggle === 'function') summary.classList.toggle('hidden', false);
    }
    return { correct: correct, total: total };
  }

  // Wraps a page's global finish() so the summary also shows the correct count.
  // Takes the global object and document so it can be exercised in Node tests.
  function hookPracticeFinishSummary(g, doc) {
    if (!g || !doc || typeof doc.getElementById !== 'function') return false;
    if (typeof g.finish !== 'function' || g.finish.__mmExerciseSummary) return false;
    const previous = g.finish;
    g.finish = function mmFinishWithSummary() {
      previous.call(this);
      const summary = doc.getElementById('summary');
      if (!summary || (summary.classList && typeof summary.classList.contains === 'function' && summary.classList.contains('hidden'))) return;
      const stats = doc.getElementById('stats');
      if (!stats) return;
      const match = String(stats.innerHTML || '').match(/<strong>(\d+)\/(\d+)<\/strong>/);
      if (!match) return;
      renderExerciseCorrectCount(doc, parseInt(match[1], 10));
    };
    g.finish.__mmExerciseSummary = true;
    return true;
  }

  function installAccessBar() {
    if (typeof document === 'undefined') return;
    if (typeof loadAccess !== 'function') return;
    const prefs = loadAccess();
    applyAccessToDocument(prefs, document);
    if (document.getElementById('mm-access')) return;
    const bar = document.createElement('div');
    bar.id = 'mm-access';
    bar.setAttribute('role', 'toolbar');
    bar.setAttribute('aria-label', 'הגדרות נגישות');
    const toggles = [
      ['contrast', 'ניגודיות'],
      ['large', 'אות גדולה'],
      ['speak', 'הקראה'],
      ['wait', 'המתנה ארוכה'],
      ['quiet', 'שקט'],
    ];
    let html = '<span class="mm-access-label">נגישות</span>';
    toggles.forEach(function (pair) {
      const on = !!prefs[pair[0]];
      html += '<button type="button" data-acc="' + pair[0] + '" aria-pressed="' + (on ? 'true' : 'false') + '">' + pair[1] + '</button>';
    });
    html += '<button type="button" id="mm-speak-now" hidden disabled>השמע תרגיל</button>';
    html += '<button type="button" id="mm-hear" hidden disabled>השמע פעימות</button>';
    bar.innerHTML = html;
    const nav = document.getElementById('mm-site-nav');
    if (nav && nav.parentNode) nav.parentNode.insertBefore(bar, nav.nextSibling);
    else document.body.insertBefore(bar, document.body.firstChild);
    bar.addEventListener('click', function (e) {
      const btn = e.target.closest('button');
      if (!btn) return;
      if (btn.id === 'mm-speak-now') {
        const text = currentPromptText(document);
        if (text) speakHebrew(text);
        return;
      }
      if (btn.id === 'mm-hear') {
        const groups = getActiveHear();
        if (groups && typeof playCountClicks === 'function') playCountClicks(groups, 76);
        return;
      }
      const key = btn.getAttribute('data-acc');
      if (!key) return;
      const next = toggleAccess(key);
      applyAccessToDocument(next, document);
      btn.setAttribute('aria-pressed', next[key] ? 'true' : 'false');
      if (key === 'speak' && next.speak) {
        const t = currentPromptText(document);
        if (t) speakHebrew(t);
      }
      if (key === 'speak' && !next.speak && typeof cancelSpeech === 'function') cancelSpeech();
    });
  }

  function api() {
    const parts = pick();
    return Object.assign({}, parts, {
      installSharedChrome: installSharedChrome,
      installAccessBar: installAccessBar,
      countSessionCorrectAnswers: countSessionCorrectAnswers,
      showExerciseSessionSummary: showExerciseSessionSummary,
      hookPracticeFinishSummary: hookPracticeFinishSummary,
      siteNavHtml: siteNavHtml,
    });
  }

  const exported = IN_NODE ? api() : { installSharedChrome: installSharedChrome };
  if (IN_NODE) module.exports = exported;
  else {
    Object.assign(root, exported);
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', installSharedChrome);
    else installSharedChrome();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this);
