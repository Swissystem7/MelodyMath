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
    hookPracticeFinishSummary();
    installAccessBar();
    if (typeof bindAllTablists === 'function') bindAllTablists(document);
    if (typeof refreshSpeakNow === 'function') refreshSpeakNow(document);
    if (document.getElementById('mm-site-nav')) return;
    const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const sonify = here === 'functions.html' || here === '807.html';
    const hub = here === 'landing.html' || here === 'offer.html';
    document.body.setAttribute('data-product', sonify ? 'sonify' : hub ? 'hub' : 'elementary');
    function link(file, label) {
      const current = here === file || (here === '' && file === 'index.html');
      return '<a href="' + file + '"' + (current ? ' aria-current="page"' : '') + '>' + label + '</a>';
    }
    const nav = document.createElement('nav');
    nav.id = 'mm-site-nav';
    nav.setAttribute('aria-label', 'MelodyMath — שני מוצרים');
    nav.innerHTML = '<span class="mm-brand">♫ MelodyMath</span>'
      + '<span class="mm-prod' + (sonify ? '' : ' on') + '"><span class="mm-prod-label">תרגול יסודי</span>'
      + link('index.html', 'תרגול א׳–ד׳') + ' · '
      + link('curriculum.html', 'כיסוי תוכנית') + '</span>'
      + '<span class="mm-prod-split" aria-hidden="true">|</span>'
      + '<span class="mm-prod' + (sonify ? ' on' : '') + '"><span class="mm-prod-label">סוניפיקציה · חט״ב/תיכון</span>'
      + link('functions.html', 'שומעים פונקציה') + ' · '
      + link('807.html', 'גדילה ודעיכה') + '</span>'
      + '<span class="mm-prod-meta">'
      + link('landing.html', 'אודות') + ' · '
      + link('offer.html', 'ניסוי כיתתי') + '</span>';
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
    return history.filter(function (x) { return x && x.correct; }).length;
  }

  function renderExerciseCorrectCount(doc, correct) {
    if (!doc || typeof doc.getElementById !== 'function') return null;
    var el = doc.getElementById('exerciseCorrectCount');
    if (!el && typeof doc.createElement === 'function') {
      el = doc.createElement('p');
      el.id = 'exerciseCorrectCount';
      el.className = 'exercise-correct-count';
      el.setAttribute('role', 'status');
      el.setAttribute('aria-live', 'polite');
      var stats = doc.getElementById('stats');
      if (stats && stats.parentNode) stats.parentNode.insertBefore(el, stats.nextSibling);
    }
    if (el) el.textContent = 'היום פתרת נכון ' + correct + ' שאלות';
    return el;
  }

  function showExerciseSessionSummary(doc, history, options) {
    options = options || {};
    if (!doc || !Array.isArray(history)) return { correct: 0, total: 0 };
    var correct = countSessionCorrectAnswers(history);
    var total = history.length;
    var levelForId = options.levelForId || function () { return 1; };
    var maxLevel = 1;
    history.forEach(function (x) {
      var lv = levelForId(x.id);
      if (lv > maxLevel) maxLevel = lv;
    });
    var statsEl = doc.getElementById(options.statsId || 'stats');
    if (statsEl) {
      statsEl.innerHTML = '<div class="stat"><strong>' + correct + '/' + total + '</strong>נכונות</div>'
        + '<div class="stat"><strong>' + (total ? Math.round(correct / total * 100) : 0) + '%</strong>דיוק בסבב</div>'
        + '<div class="stat"><strong>' + maxLevel + '</strong>רמה מרבית בסבב</div>';
    }
    renderExerciseCorrectCount(doc, correct);
    var summaryTextEl = doc.getElementById(options.summaryTextId || 'summaryText');
    if (summaryTextEl) {
      summaryTextEl.textContent = options.summaryText
        || 'ספירה של הסבב הזה במכשיר — לא ציון ולא הוכחה שהתרגול עוזר. תרגיל שטעו בו יחזור מוקדם יותר בסבב הבא.';
    }
    if (options.showPanels) {
      var quiz = doc.getElementById('quiz');
      var summary = doc.getElementById('summary');
      if (quiz && quiz.classList) quiz.classList.toggle('hidden', true);
      if (summary && summary.classList) summary.classList.toggle('hidden', false);
    }
    return { correct: correct, total: total };
  }

  function hookPracticeFinishSummary() {
    if (IN_NODE || typeof document === 'undefined') return;
    var g = typeof globalThis !== 'undefined' ? globalThis : root;
    if (!g || typeof g.finish !== 'function' || g.finish.__mmExerciseSummary) return;
    var previous = g.finish;
    g.finish = function mmFinishWithSummary() {
      previous.call(this);
      var summary = document.getElementById('summary');
      if (!summary || summary.classList.contains('hidden')) return;
      var stats = document.getElementById('stats');
      if (!stats) return;
      var match = String(stats.innerHTML).match(/<strong>(\d+)\/(\d+)<\/strong>/);
      if (!match) return;
      renderExerciseCorrectCount(document, parseInt(match[1], 10));
    };
    g.finish.__mmExerciseSummary = true;
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
    html += '<button type="button" id="mm-speak-now">השמע תרגיל</button>';
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
