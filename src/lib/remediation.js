// MelodyMath — תוכנית תיקון מבוססת מוקדי כשל לאומיים (ראמ״ה / מיצ״ב) ובסיס מחקרי
//
// מיפוי נקודות הכשל ביסודי ובחטיבת ביניים לפי נתוני מבחני ראמ״ה ומשרד החינוך,
// ותרגומן למנגנוני תיקון מוזיקליים מבוססי שמיעה, מקצב וסוניפיקציה.
// כולל עוגנים תיאורטיים ומחקריים (Embodied Cognition, SMARC, Cognitive Load).
// ללא הבטחות שווא וללא מונחים קליניים.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else Object.assign(root, api);
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {

  const FAILURE_POINTS = [
    // --- יסודי (Elementary) ---
    {
      id: 'elem-fractions',
      tier: 'elementary',
      tierHe: 'יסודי',
      grades: 'ד׳–ו׳',
      topicHe: 'שברים פשוטים וחלוקה לשלם',
      nationalIssue: 'כשל מוביל במיצ״ב ובמבחני ראמ״ה: מעל 45% מהתלמידים מתקשים בהבנת משמעות השבר כמספר על ציר.',
      misconception: 'הטיית המספר השלם (Natural Number Bias): תלמידים מבודדים את המכנה וחושבים ש־1/8 גדול מ־1/4 כי 8 גדול מ־4, או מחברים מונים ומכנים יחד.',
      musicalMechanism: 'חלוקת תיבה מוזיקלית (4/4 Bar Division): חלוקת הזמן לתיבה שלמה (1), חצי תיבה (1/2), רבע פעימה (1/4) ושמינית (1/8). האוזן שומעת מיד ששמינית נמשכת בדיוק חצי מזמן הרבע.',
      soundType: 'rhythm',
      exerciseRef: 'bar44',
      syllabusRef: 'מתמטיקה יסודי: שברים פשוטים - משמעות השבר כחלק משלם וכנקודה על ישר'
    },
    {
      id: 'elem-regrouping',
      tier: 'elementary',
      tierHe: 'יסודי',
      grades: 'ב׳–ג׳',
      topicHe: 'מבנה עשרוני, מעבר עשרת ופריטה',
      nationalIssue: 'קושי מרכזי בחיסור במאונך עם פריטה ובכפל מעבר ל־10 (כ־35% שגיאות חישוב בראמ״ה).',
      misconception: 'קושי בתפיסה המרחבית-כמותית של קיבוץ עשרות — החלפת ספרות בטורי עשרות ואחדות מבלי להבין את שווי הערך.',
      musicalMechanism: 'הדגשה מטרית (Accented Metric Grouping): חלוקה לפעימות חזקות (דאון־ביט מייצג עשרת) מול פעימות משניות קלות (אחדות). השמיעה מבדילה בין קבוצה שלמה לפריטים בודדים.',
      soundType: 'meter',
      exerciseRef: 'accentGroup',
      syllabusRef: 'מתמטיקה יסודי: המבנה העשרוני ופעולות החיבור והחיסור'
    },
    {
      id: 'elem-multiplication-fluency',
      tier: 'elementary',
      tierHe: 'יסודי',
      grades: 'ג׳–ד׳',
      topicHe: 'אוטומטיזציה של לוח הכפל (כפולות 6, 7, 8, 9)',
      nationalIssue: 'עומס קוגניטיבי מוגבר בחישוב בסיסי שפוגע בפתרון שאלות מילוליות מורכבות.',
      misconception: 'שינון בעל־פה נטול עוגן קצבי מוביל לשכחה מהירה ולבלבול בין כפולות סמוכות (כמו 7×8 מול 6×9).',
      musicalMechanism: 'לולאות קצב במטרונום אדפטיבי (Rhythmic Looping): הטמעת סדרות דילוגים במסגרת טמפו קבוע (BPM). הקצב הופך את הרצף לדפוס שמיעתי-תנועתי יציב בזיכרון.',
      soundType: 'tempo',
      exerciseRef: 'metroLoop',
      syllabusRef: 'מתמטיקה יסודי: לוח הכפל והחילוק'
    },

    // --- חטיבת ביניים (Middle School) ---
    {
      id: 'mid-linear-slope',
      tier: 'middle',
      tierHe: 'חטיבת ביניים',
      grades: 'ז׳–ח׳',
      topicHe: 'שיפוע פונקציה קווית (m = Δy / Δx)',
      nationalIssue: 'צוואר בקבוק עקבי באלגברה של חט״ב: תלמידים זוכרים את הנוסחה אך לא מבינים את המשמעות של קצב שינוי, כיוון ותלילות.',
      misconception: 'בלבול בין שיפוע חיובי לשלילי, חוסר הבנה של שיפוע 0 (פונקציה קבועה) ואי־קישור בין השיפוע על הגרף לבין השינוי בטבלה.',
      musicalMechanism: 'סוניפיקציית גובה צליל רציפה (Continuous Glissando / Pitch Sweeps): שיפוע חיובי מפיק צליל עולה; שיפוע תלול מייצר נסיקה חדה; שיפוע שלילי מפיק צליל יורד; שיפוע אפס מפיק צליל אחיד ויציב (Drone).',
      soundType: 'sonification',
      exerciseRef: 'functionsSlope',
      syllabusRef: 'מתמטיקה חט״ב: הפונקציה הקווית - משמעות השיפוע וקצב השתנות'
    },
    {
      id: 'mid-quadratic-vertex',
      tier: 'middle',
      tierHe: 'חטיבת ביניים',
      grades: 'ט׳',
      topicHe: 'פונקציה ריבועית (פרבולה) ונקודת קודקוד',
      nationalIssue: 'מעל 40% טעויות בזיהוי נקודת מינימום/מקסימום ותחומי עלייה וירידה של הפרבולה במבחני מיצ״ב ומבדקי כיתה ט׳.',
      misconception: 'אי־הבחנה בין נקודות החיתוך עם הצירים לבין נקודת המפנה (הקודקוד), וקושי בתפיסת הסימטריה משני צדי ציר הסימטריה.',
      musicalMechanism: 'עיקול צליל סימטרי עם פעמון היפוך (Symmetrical Sonification & Vertex Bell): סריקת הפרבולה יורדת בצליל עד לשפל ומצלצלת הדגשה נקודתית בקודקוד, ואז עולה בסימטריה שמיעתית מושלמת.',
      soundType: 'sonification',
      exerciseRef: 'functionsParabola',
      syllabusRef: 'מתמטיקה חט״ב: פונקציה ריבועית - קודקוד, ציר סימטריה ותחומי חיוביות ושליליות'
    },
    {
      id: 'mid-signed-numbers',
      tier: 'middle',
      tierHe: 'חטיבת ביניים',
      grades: 'ז׳',
      topicHe: 'מספרים מכוונים (חיוביים ושליליים)',
      nationalIssue: 'שיעור שגיאות גבוה בפעולות חיבור וחיסור עם סימנים שליליים וכפל של מספרים שליליים.',
      misconception: 'תפיסה חד־ממדית של גודל בלבד, תוך התעלמות ממשמעות הכיוון על פני ציר המספרים.',
      musicalMechanism: 'פנורמה סטריאופונית ורגיסטר בס (Spatial Panning & Octave Register): צלילים שליליים ממוקמים בערוץ שמאל וברגיסטר בס עמוק; צלילים חיוביים ממוקמים בימין וברגיסטר צלול; אפס במרכז המדויק.',
      soundType: 'spatial',
      exerciseRef: 'stereoSigned',
      syllabusRef: 'מתמטיקה חט״ב: מספרים מכוונים ופעולות עליהם'
    },
    {
      id: 'mid-exponents-powers',
      tier: 'middle',
      tierHe: 'חטיבת ביניים',
      grades: 'ח׳–ט׳',
      topicHe: 'חוקי חזקות וסדרות הנדסיות (2 בחזקת n)',
      nationalIssue: 'בלבול נפוץ בין כפל לחזקה: חישוב 2 בחזקת 3 כ־6 במקום 8, וקושי בתפיסת קצב גידול מעריכי.',
      misconception: 'חשיבה לינארית במקום כפלית: ראיית החזקה כתוספת קבועה ולא כקצב הכפלה חוזר ונשנה.',
      musicalMechanism: 'סולם אוקטבות מוזיקלי (Octave Frequency Doubling): כל אוקטבה מכפילה בדיוק את תדר היסוד (220Hz -> 440Hz -> 880Hz -> 1760Hz). התלמיד שומע שכל דרגה היא כפל ב־2 ולא תוספת אחידה.',
      soundType: 'sonification',
      exerciseRef: 'octavePowers',
      syllabusRef: 'מתמטיקה חט״ב: חזקות עם מעריך שלם וקצב גידול'
    },
    {
      id: 'mid-pythagoras-ratios',
      tier: 'middle',
      tierHe: 'חטיבת ביניים',
      grades: 'ח׳',
      topicHe: 'משפט פיתגורס ויחסי צלעות במשולש ישר־זווית',
      nationalIssue: 'חישוב מכני של שורש וריבוע ללא תפיסה של הקשר היחסי בין הצלעות (יחסי 3:4:5).',
      misconception: 'חוסר חיבור בין הגיאומטריה לאלגברה — ראיית משפט פיתגורס כנוסחה מופשטת בלבד.',
      musicalMechanism: 'הרמוניה פיתגוראית (Pythagorean Harmonic Intervals): מיתר מחולק ביחס 3:4 (קוורטה) ו־2:3 (קווינטה) מפיק את ההרמוניות היסודיות. האוזן שומעת כיצד יחס אורכים מדויק מייצר צליל הרמוני צלול.',
      soundType: 'interval',
      exerciseRef: 'pythagorasHarmony',
      syllabusRef: 'מתמטיקה חט״ב: משפט פיתגורס ויישומיו'
    },
    {
      id: 'mid-trig-sine-wave',
      tier: 'middle',
      tierHe: 'חטיבת ביניים / תיכון',
      grades: 'ט׳–י׳',
      topicHe: 'פונקציות מחזוריות וגל סינוס (y = sin x)',
      nationalIssue: 'קושי משמעותי בהבנת מושג המחזוריות (Periodicity), משרעת (Amplitude) ותדירות.',
      misconception: 'ראיית גרף הסינוס כצורת "גל" סטאטית מבלי להבין את הקשר בין זווית, זמן ותנודה מחזורית.',
      musicalMechanism: 'גל קול הרמוני טהור (Pure Sine Tone & Amplitude Modulation): צליל סינוס הוא גל הקול הפיזי הבסיסי ביותר בטבע. המשרעת מתורגמת ישירות לעוצמת הקול (Volume), והתדר לגובה הצליל (Pitch).',
      soundType: 'sonification',
      exerciseRef: 'sineWaveLab',
      syllabusRef: 'מתמטיקה חט״ב ותיכון: פונקציות טריגונומטריות ומחזוריות'
    },
    {
      id: 'mid-exponential-decay',
      tier: 'middle',
      tierHe: 'חטיבת ביניים / תיכון',
      grades: 'ט׳',
      topicHe: 'גידול ודעיכה מעריכיים',
      nationalIssue: 'חוסר יכולת להבדיל בין גרף קווי לגרף מעריכי וחישוב זמן מחצית חיים או קצב הכפלה.',
      misconception: 'הנחה שקצב הדעיכה קבוע לאורך זמן (חיסור קבוע) במקום יחסי לגודל הנוכחי.',
      musicalMechanism: 'מעטפת דעיכה אקוסטית (Exponential ADSR Envelope Decay): דעיכת צליל של פסנתר או פעמון היא תהליך מעריכי טבעי. האוזן שומעת ירידה מהירה בהתחלה שמתמתנת בזמן.',
      soundType: 'sonification',
      exerciseRef: 'expDecaySound',
      syllabusRef: 'מתמטיקה חט״ב: גידול ודעיכה'
    }
  ];

  const RESEARCH_FOUNDATIONS = [
    {
      id: 'embodied-cognition',
      nameHe: 'קוגניציה מגולמת (Embodied Cognition)',
      keyResearchers: 'Lakoff & Núñez (2000), Bamberger (1991)',
      coreFinding: 'מושגים מתמטיים מופשטים אינם נתפסים בוואקום סמנטי, אלא מעוגנים בתפיסה מוטורית, שמיעתית ותחושת זמן (Sensorimotor Grounding). מקצב וחלוקת פעימות מעניקים עוגן פיזי לשברים ולפרופורציות.'
    },
    {
      id: 'smarc-effect',
      nameHe: 'אפקט SMARC והציר המספרי השמיעתי',
      keyResearchers: 'Dehaene et al. (1993), Rusconi et al. (2006)',
      coreFinding: 'במוח האנושי קיים מיפוי טבעי מקביל: צלילים נמוכים/שמאליים משויכים לכמויות קטנות ושליליות, וצלילים גבוהים/ימניים לכמויות גדולות וחיוביות. סוניפיקציה ופנורמה מנצלות מיפוי מולד זה לביסוס שיפוע וציר מספרים.'
    },
    {
      id: 'phonological-loop',
      nameHe: 'לולאת זיכרון העבודה והפחתת עומס קוגניטיבי',
      keyResearchers: 'Baddeley (1992), Sweller (1988)',
      coreFinding: 'חלוקה לקבוצות קצביות מובנות (Rhythmic Chunking) מקלה על הלולאה הפונולוגית של זיכרון העבודה, ומאפשרת הטמעה של תבניות כפל ודילוגים ללא עומס חישובי שמעכב חשיבה מילולית.'
    },
    {
      id: 'pythagorean-ratios',
      nameHe: 'הקשר ההיסטורי והאקוסטי: יחס שברים למרווחי צליל',
      keyResearchers: 'Helmholtz (1877), Jeans (1937)',
      coreFinding: 'האקוסטיקה המוזיקלית מושתתת על יחסים רציונליים פשוטים: יחס 1:2 הוא אוקטבה, 2:3 קווינטה, 3:4 קוורטה. חוויית ההרמוניה השמיעתית היא המודל המוחשי הראשון בהיסטוריה של שברים ויחסים ישרים.'
    }
  ];

  function getAllFailurePoints() {
    return FAILURE_POINTS.slice();
  }

  function getFailurePointsByTier(tier) {
    if (!tier) return getAllFailurePoints();
    return FAILURE_POINTS.filter(function (p) { return p.tier === tier; });
  }

  function getPointById(id) {
    return FAILURE_POINTS.find(function (p) { return p.id === id; }) || null;
  }

  function getResearchFoundations() {
    return RESEARCH_FOUNDATIONS.slice();
  }

  function remediationSummary() {
    const elem = getFailurePointsByTier('elementary');
    const mid = getFailurePointsByTier('middle');
    return {
      totalPoints: FAILURE_POINTS.length,
      elementaryCount: elem.length,
      middleCount: mid.length,
      researchCount: RESEARCH_FOUNDATIONS.length,
      tiers: ['elementary', 'middle']
    };
  }

  return {
    FAILURE_POINTS: FAILURE_POINTS,
    RESEARCH_FOUNDATIONS: RESEARCH_FOUNDATIONS,
    getAllFailurePoints: getAllFailurePoints,
    getFailurePointsByTier: getFailurePointsByTier,
    getPointById: getPointById,
    getResearchFoundations: getResearchFoundations,
    remediationSummary: remediationSummary
  };
});
