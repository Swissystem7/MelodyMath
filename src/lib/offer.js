// MelodyMath — honest classroom-trial offer. No price. No efficacy.
//
// What research supports (MONETIZATION.md, 13.8.2026): one integration
// teacher, 4 free weeks, a letter a principal can read, and a clear
// "there is no paid product" boundary. Nothing here invents a sale.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const PROJECT_MAIL = 'aviran2606@gmail.com';
  const DEMO_URL = 'https://swissystem7.github.io/MelodyMath/';
  const OFFER_URL = 'https://swissystem7.github.io/MelodyMath/offer.html';
  const TRIAL_WEEKS = 4;

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function cleanLine(s, max) {
    const t = String(s == null ? '' : s).replace(/\s+/g, ' ').trim();
    const cap = max > 0 ? max : 120;
    return t.slice(0, cap);
  }

  function clampGroup(n) {
    const x = Math.round(Number(n));
    if (!Number.isFinite(x) || x < 1) return 1;
    return Math.min(12, x);
  }

  function normalizeTrialRequest(raw) {
    const src = raw && typeof raw === 'object' ? raw : {};
    const role = cleanLine(src.role, 40);
    return {
      teacher: cleanLine(src.teacher, 60),
      role: role || 'מחנכת שילוב',
      school: cleanLine(src.school, 80),
      grade: cleanLine(src.grade, 40),
      groupSize: clampGroup(src.groupSize),
      principal: cleanLine(src.principal, 60),
      principalEmail: cleanLine(src.principalEmail, 80),
      replyEmail: cleanLine(src.replyEmail, 80),
    };
  }

  function missingTrialFields(req) {
    const r = normalizeTrialRequest(req);
    const miss = [];
    if (!r.teacher) miss.push('teacher');
    if (!r.school) miss.push('school');
    if (!r.grade) miss.push('grade');
    return miss;
  }

  function offerBoundary() {
    return {
      freeForever: [
        'הדמו הציבורי: תרגול יסודי, מצב כיתה, דפי עבודה, דוח מורה מקומי, מכתב להורה, תעודה',
        'סוניפיקציה עברית של גרפים ודף 807',
        'נגישות על הטאבלט (ניגודיות, אות גדולה, הקראה, המתנה ארוכה, שקט)',
        'שמירה במכשיר בלבד, בלי חשבון ובלי שרת',
      ],
      paid: {
        exists: false,
        reasonHe: 'אין מוצר בתשלום. אין מנוי, אין רישיון כיתתי, ואין חשבונית. מחקר הרכש מ־13.8.2026 לא מצא נתיב שבו בית ספר יכול לשלם על הדמו הזה היום.',
      },
      trial: {
        weeks: TRIAL_WEEKS,
        priceHe: 'חינם',
        whoHe: 'מחנכת שילוב אחת, קבוצה קטנה, באישור המנהל/ת',
      },
    };
  }

  function onePagerFacts() {
    return {
      titleHe: 'בקשת ניסוי כיתתי · 4 שבועות · חינם',
      whatHe: [
        'דף דפדפן בעברית לתרגול מנייה, חיבור, חיסור, כפל ושברים פשוטים — כיתות א׳–ד׳.',
        'נפתח מקישור, בלי התקנה ובלי חשבון. הרישום נשאר בטאבלט (localStorage).',
        'נגישות על המכשיר: ניגודיות, אות גדולה, הקראה בעברית, המתנה ארוכה, מצב שקט.',
        'למי שבלי טאבלט יש דף עבודה מאותם תרגילים.',
      ],
      notHe: [
        'זו לא תוכנית במאגר משרד החינוך ואין רישום בגפ״ן.',
        'זו לא רכישה. אין חשבונית ואין דיווח שעות.',
        'אין טענת יעילות, אין «טיפול», ואין מחקר שמוכיח שהקצב משפר מתמטיקה.',
        'אין סנכרון בין מכשירים ואין דשבורד בענן.',
      ],
      askHe: 'הבקשה: אישור פנימי שמחנכת השילוב תפתח את הקישור עם קבוצה קטנה במשך ארבעה שבועות. בסוף — שאלה אחת: האם ראיתם משהו שדף עבודה לא נותן. אם לא, הניסוי ענה והכלי נשאר דמו.',
      demoUrl: DEMO_URL,
      offerUrl: OFFER_URL,
    };
  }

  function renderOnePagerHtml(raw) {
    const r = normalizeTrialRequest(raw);
    const f = onePagerFacts();
    const who = r.teacher
      ? escapeHtml(r.teacher) + (r.role ? ' · ' + escapeHtml(r.role) : '')
      : 'מחנכת שילוב';
    const place = [r.school, r.grade].filter(Boolean).map(escapeHtml).join(' · ')
      || 'בית ספר (ימולא בהדפסה)';
    const group = r.groupSize ? escapeHtml(String(r.groupSize)) + ' ילדים בקבוצה' : 'קבוצה קטנה';
    const principal = r.principal ? escapeHtml(r.principal) : 'מנהל/ת בית הספר';
    function lis(arr) {
      return arr.map(function (line) { return '<li>' + escapeHtml(line) + '</li>'; }).join('');
    }
    return '<article class="onepager" id="onePagerInner">'
      + '<p class="kicker">MelodyMath · לא תוכנית משרד · לא חשבונית</p>'
      + '<h1>' + escapeHtml(f.titleHe) + '</h1>'
      + '<p class="meta">אל: ' + principal + '<br>מאת: ' + who + '<br>'
      + place + ' · ' + group + '</p>'
      + '<h2>מה זה</h2><ul>' + lis(f.whatHe) + '</ul>'
      + '<h2>מה זה לא</h2><ul>' + lis(f.notHe) + '</ul>'
      + '<h2>מה מתבקש</h2><p>' + escapeHtml(f.askHe) + '</p>'
      + '<p class="urls">דמו: ' + escapeHtml(f.demoUrl) + '<br>דף ההצעה: '
      + escapeHtml(f.offerUrl) + '</p>'
      + '<p class="foot">אין כאן מספר בתי ספר, אין מדד שיפור, ואין מחיר. '
      + 'הדמו נשאר חינם גם אחרי ארבעת השבועות.</p>'
      + '</article>';
  }

  function principalLetterBody(raw) {
    const r = normalizeTrialRequest(raw);
    const name = r.principal ? r.principal : 'מנהל/ת בית הספר';
    const teacher = r.teacher || 'מחנכת שילוב';
    const role = r.role || 'מחנכת שילוב';
    const school = r.school || 'בית הספר';
    const grade = r.grade || 'שכבה לא צוינה';
    const n = String(r.groupSize);
    return [
      'שלום ' + name + ',',
      '',
      'אני ' + teacher + ', ' + role + ' ב' + school + '.',
      'אני מבקשת אישור לנסות ארבעה שבועות, חינם, כלי דפדפן בעברית בשם MelodyMath — עם קבוצה קטנה (' + n + ' ילדים) ב' + grade + '.',
      '',
      'מה זה כן: קישור ציבורי בלי התקנה ובלי חשבון. תרגול מנייה / חיבור / חיסור / כפל / שברים פשוטים. הרישום נשאר בטאבלט בלבד. יש דף עבודה למי שבלי מכשיר, וסרגל נגישות (ניגודיות, אות גדולה, הקראה).',
      'מה זה לא: תוכנית במאגר משרד החינוך, רכישה, דיווח שעות, או טענה שהקצב משפר מתמטיקה. אין מחקר על הכלי הזה, ואין כאן «טיפול».',
      '',
      'בסוף ארבעת השבועות אדפיס את הרישום מהמכשיר ואשאל רק: האם היה כאן משהו שדף עבודה לא נותן. אם לא — מפסיקים. הכלי נשאר חינם גם אחרי הניסוי; אין מנוי ואין חשבונית.',
      '',
      'הקישור: ' + DEMO_URL,
      'דף קצר להדפסה: ' + OFFER_URL,
      '',
      'תודה,',
      teacher,
    ].join('\n');
  }

  function buildPrincipalEmail(raw) {
    const r = normalizeTrialRequest(raw);
    const miss = missingTrialFields(r);
    if (miss.length) {
      return { ok: false, missing: miss, to: '', subject: '', body: '', mailto: '' };
    }
    const subject = 'בקשת ניסוי כיתתי חינם · MelodyMath · 4 שבועות · ' + r.school;
    const body = principalLetterBody(r);
    const to = r.principalEmail || '';
    return {
      ok: true,
      missing: [],
      to: to,
      subject: subject,
      body: body,
      mailto: buildMailto(to || PROJECT_MAIL, subject, body),
    };
  }

  function buildMailto(to, subject, body) {
    const addr = cleanLine(to, 80) || PROJECT_MAIL;
    return 'mailto:' + encodeURIComponent(addr)
      + '?subject=' + encodeURIComponent(subject)
      + '&body=' + encodeURIComponent(body);
  }

  return {
    PROJECT_MAIL: PROJECT_MAIL,
    DEMO_URL: DEMO_URL,
    OFFER_URL: OFFER_URL,
    TRIAL_WEEKS: TRIAL_WEEKS,
    escapeHtml: escapeHtml,
    normalizeTrialRequest: normalizeTrialRequest,
    missingTrialFields: missingTrialFields,
    offerBoundary: offerBoundary,
    onePagerFacts: onePagerFacts,
    renderOnePagerHtml: renderOnePagerHtml,
    principalLetterBody: principalLetterBody,
    buildPrincipalEmail: buildPrincipalEmail,
    buildMailto: buildMailto,
  };
});
