// MelodyMath — Printable flashcards and rhythm practice cards for classroom use.
// Pairs math operations with rhythm patterns and self-checking answers.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  const TOPICS = {
    addition: {
      name: 'חיבור וחיסור עד 20',
      items: [
        { q: '7 + 5', a: '12', r: '🥁 🥁 🥁 🥁 | 🥁 🥁 🥁 🥁 (12 פעימות)', note: 'שתי שמיניות ועוד רבע' },
        { q: '8 + 6', a: '14', r: '🥁 🥁 🥁 🥁 | 🥁 🥁 🥁 🥁 (14 פעימות)', note: 'משלים ל-10 ואז עוד 4' },
        { q: '15 - 7', a: '8', r: '🥁 🥁 🥁 🥁 | 🥁 🥁 🥁 🥁 (8 פעימות)', note: 'שתי תיבות של 4/4' },
        { q: '9 + 4', a: '13', r: '🥁 🥁 🥁 🥁 | 🥁 🥁 🥁 🥁 (13 פעימות)', note: 'עוברים את ה-10' },
        { q: '13 - 6', a: '7', r: '🥁 🥁 🥁 🥁 | 🥁 🥁 🥁 (7 פעימות)', note: 'מקצב א-סימטרי של 7' },
        { q: '6 + 7', a: '13', r: '🥁 🥁 🥁 🥁 | 🥁 🥁 🥁 🥁 (13 פעימות)', note: 'כמעט כפולת 6' },
        { q: '16 - 9', a: '7', r: '🥁 🥁 🥁 🥁 | 🥁 🥁 🥁 (7 פעימות)', note: 'חיסור של 9 = פחות 10 ועוד 1' },
        { q: '8 + 8', a: '16', r: '🥁 🥁 🥁 🥁 | 🥁 🥁 🥁 🥁 (16 פעימות)', note: 'ארבע תיבות מלאות של 4/4' }
      ]
    },
    multiplication: {
      name: 'לוח הכפל ומקצבים',
      items: [
        { q: '4 × 3', a: '12', r: '4 קבוצות של 3 פעימות (משקל משולש 3/4)', note: 'מקצב וואלס ב-4 תיבות' },
        { q: '6 × 4', a: '24', r: '6 תיבות של 4/4 (24 רבעים)', note: 'גרוב יציב של 6 תיבות' },
        { q: '3 × 5', a: '15', r: '3 קבוצות של 5 פעימות (משקל 5/8)', note: 'מקצב בלקני של 5 פעימות' },
        { q: '7 × 2', a: '14', r: '7 זוגות של שמיניות (משקל 2/4)', note: 'מרש צעידה ב-7 צעדים כפולים' },
        { q: '5 × 4', a: '20', r: '5 תיבות של 4/4 (20 רבעים)', note: 'תבנית חוזרת של 5 פעימות' },
        { q: '8 × 3', a: '24', r: '8 תיבות של 3/4', note: 'וואלס של 8 תיבות' },
        { q: '9 × 2', a: '18', r: '9 תיבות של 2/4', note: 'תבנית זוגית של 18 פעמות' },
        { q: '6 × 6', a: '36', r: '6 תיבות של 6/8', note: 'משקל מורכב של 36 שמיניות' }
      ]
    },
    fractions: {
      name: 'שברים ותווי נגינה',
      items: [
        { q: '1/2 + 1/2', a: '1 שלם (תו שלם)', r: '𝅝 תו שלם = שווה ערך ל-4 רבעים', note: 'שלם מוזיקלי ומתמטי' },
        { q: '1/4 + 1/4', a: '1/2 (חצי תו)', r: '𝅗 שני רבעים = חצי תו (2 פעימות)', note: 'שני רבעים מרכיבים חצי' },
        { q: '1/4 + 1/2', a: '3/4 (חצי מנוקד)', r: '𝅗. שלוש פעימות מתוך ארבע', note: 'משקל וואלס קלאסי' },
        { q: '1/8 + 1/8', a: '1/4 (רבע תו)', r: '𝅘𝅥 שתי שמיניות = רבע אחד', note: 'פעימת בסיס אחת' },
        { q: '1 - 1/4', a: '3/4 (שלושה רבעים)', r: '𝅘𝅥 𝅘𝅥 𝅘𝅥 שלושה רבעים בתיבה', note: 'חסר רבע אחד לשלם' },
        { q: '2/4 + 2/4', a: '4/4 = 1 שלם', r: 'תיבה שלמה של ארבעה רבעים', note: 'המשקל הנפוץ ביותר' },
        { q: '1/8 × 4', a: '4/8 = 1/2', r: 'ארבע שמיניות = חצי תיבה', note: 'חצי מתיבת 4/4' },
        { q: '1/2 + 1/4 + 1/4', a: '1 שלם (4/4)', r: 'חצי + שני רבעים = שלם', note: 'חלוקה סימטרית' }
      ]
    },
    rhythms: {
      name: 'קריאת מקצבים ופעימות',
      items: [
        { q: 'תָּה תָּה תִּי-תִּי תָּה', a: '4 פעימות (רבע, רבע, שתי שמיניות, רבע)', r: '♩ ♩ ♫ ♩', note: 'משקל 4/4 יסודי' },
        { q: 'תִּי-תִּי תָּה תָּה נָח', a: '4 פעימות (כולל הפסקה בסוף)', r: '♫ ♩ ♩ 𝄽', note: 'דגש על שקט מוזיקלי' },
        { q: 'תָּה-אָה תָּה תָּה', a: 'חצי תו ושני רבעים = 4 פעימות', r: '𝅗𝅥 ♩ ♩', note: 'צליל מתמשך של שתי פעימות' },
        { q: 'תָּה תִּי-תִּי תָּה-אָה', a: 'רבע, שתי שמיניות, חצי = 4 פעימות', r: '♩ ♫ 𝅗𝅥', note: 'האטה בסוף התיבה' },
        { q: 'תָּה תָּה תָּה (3/4)', a: '3 פעימות בתיבה (וואלס)', r: '♩ ♩ ♩', note: 'משקל משולש' },
        { q: 'תִּי-תִּי תִּי-תִּי תָּה-אָה', a: 'ארבע שמיניות וחצי תו', r: '♫ ♫ 𝅗𝅥', note: 'מעבר ממהיר לאיטי' },
        { q: 'תָּה נָח תָּה נָח', a: 'שני רבעים ושתי הפסקות', r: '♩ 𝄽 ♩ 𝄽', note: 'סירוגין של צליל ושקט' },
        { q: 'תָּה-אָה-אָה-אָה', a: 'תו שלם = 4 פעימות מלאות', r: '𝅝', note: 'צליל אחד לאורך כל התיבה' }
      ]
    }
  };

  function getTopic(key) {
    return TOPICS[key] || TOPICS.addition;
  }

  function renderFlashcardsHtml(options) {
    const opts = options || {};
    const topicKey = opts.topic || 'addition';
    const topic = getTopic(topicKey);
    const count = Math.min(topic.items.length, Math.max(1, Number(opts.count) || 8));
    const items = topic.items.slice(0, count);

    let html = '<div class="flashcards-sheet">';
    html += '<div class="flashcards-header">';
    html += '<h3>ערכת כרטיסיות גזירה — ' + escapeHtml(topic.name) + '</h3>';
    html += '<p class="flashcards-instructions">הדפיסו על דף A4 וגזרו לאורך הקווים המקווקוים. צד קדמי: שאלת חשבון ומקצב. צד תחתון: תשובה לבדיקה עצמית (אפשר לקפל לפני שימוש).</p>';
    html += '</div>';

    html += '<div class="flashcards-grid">';
    items.forEach(function (it, idx) {
      html += '<div class="flashcard-item">';
      html += '<div class="flashcard-topline">';
      html += '<span class="flashcard-topic-tag">' + escapeHtml(topic.name) + '</span>';
      html += '<span class="flashcard-badge">#' + (idx + 1) + '</span>';
      html += '</div>';

      html += '<div class="flashcard-front">';
      html += '<div class="flashcard-prompt math-ltr">' + escapeHtml(it.q) + ' = ?</div>';
      html += '<div class="flashcard-rhythm">' + escapeHtml(it.r) + '</div>';
      if (it.note) {
        html += '<div class="flashcard-note">' + escapeHtml(it.note) + '</div>';
      }
      html += '</div>';

      html += '<div class="flashcard-cutline"><span>✂ גזרו או קפלו כאן לבקרה עצמית</span></div>';

      html += '<div class="flashcard-back">';
      html += '<span class="flashcard-ans-label">תשובה:</span> ';
      html += '<strong class="flashcard-ans math-ltr">' + escapeHtml(it.a) + '</strong>';
      html += '</div>';

      html += '</div>';
    });
    html += '</div>';
    html += '<div class="sheet-kicker">MelodyMath · ערכת הדפסה למורה · www.melodymath.com</div>';
    html += '</div>';

    return html;
  }

  return {
    TOPICS: TOPICS,
    getTopic: getTopic,
    renderFlashcardsHtml: renderFlashcardsHtml
  };
});
