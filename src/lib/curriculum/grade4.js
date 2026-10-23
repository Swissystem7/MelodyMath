// MelodyMath — grade ד׳: learning every bank standard THROUGH music (#591).
//
// Like curriculum/grade1.js: the grade ד׳ items stay in banks.js (ids are
// RAW indexes); this file carries only the music side in the shape banks.js
// reads for grade ו׳ — `sources` = the research behind the ways, `music` =
// ways per bank standard, one per level. No `rows`, so curriculum.js leaves
// the official grade ד׳ matrix alone. Pages load it before banks.js.
//
// Evidence labels follow the research map pasted on #591 (23.10.2026):
// D = part of an evaluated maths-learning intervention (a package of
// activities, not this one alone), R = a reputable instructional source
// supports the connection, A = an adaptation of a documented music–maths
// relationship whose effect on this topic was not tested on its own.
// Nothing here claims more than its label. The 4/4-bar items (widget bar44)
// are music notation already and are counted as activities, not ways.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_GRADE4 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // Same ids and values as in grade6.js, so one id means one source everywhere.
  const sources = {
    azaryahu2020: ['Azaryahu et al. 2020 — MusiMath and Academic Music', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7378943/'],
    interplay2024: ['Interplay between music and mathematics (Humanit. Soc. Sci. Commun., 2024)', 'https://www.nature.com/articles/s41599-024-03631-z'],
    kcConnections: ['Kennedy Center — Connections: Math and Music', 'https://www.kennedy-center.org/education/resources-for-educators/classroom-resources/media-and-interactives/media/music/connections/connections/math--music/'],
    kcMath: ['Kennedy Center — math collection', 'https://www.kennedy-center.org/education/resources-for-educators/classroom-resources/collections/collections/math/'],
    kcPractice: ['Kennedy Center — Arts Integration in Practice: Math', 'https://www.kennedy-center.org/education/resources-for-educators/classroom-resources/articles-and-how-tos/articles/collections/arts-integration-resources/arts-integration-in-practice-math/'],
    wnetMathInMusic: ['WNET/THIRTEEN — Get the Math: Math in Music', 'https://www.thirteen.org/get-the-math/teachers/teachers-math-in-music-activities/76/'],
    makingMusicCount: ['Making Music Count', 'https://makingmusiccount.org/'],
    palmPipes: ['Exploratorium — Palm Pipes', 'https://www.exploratorium.edu/snacks/palm-pipes'],
    whitehead: ['Exploratorium — instrument builder Peter Whitehead', 'https://annex.exploratorium.edu/music/movies/peterWhitehead_Low.html'],
    ncssm: ['NCSSM — mathematics and musical composition', 'https://www.ncssm.edu/stories/hands-on-activities-illustrate-connection-between-mathematics-and-music'],
    preshall: ['Preservation Hall Foundation — Music and Math', 'https://lessons.preshallfoundation.org/lesson/music-and-math/'],
  };

  // Bank standard key (banks.js ST) → ways, one per level (1, 2, 3). A way is
  // [music tag, how to solve it with music (Hebrew; never the numbers of an
  // item), source id, evidence label]. banks.js gives each plain item the way
  // of its level, so a topic is met through at least two musical models.
  const music = {
    FRAC_BAR: [
      ['noteValues', 'תיבה של 4/4 היא השלם: חצי תו ממלא חצי תיבה, רבע — רבע, שמינית — שמינית. נגנו ומנו.', 'courey2012', 'D'],
      ['fillBar', 'מלאו תיבה בתווים עד שהיא בדיוק שלמה, ואז כתבו איזה חלק מהתיבה כל תו תופס.', 'azaryahu2020', 'D'],
    ],
    PARALLEL: [
      ['staffLines', 'חמשת הקווים של החמשה מקבילים — לעולם לא נפגשים; קו התיבה חוצה אותם מאונך. מצאו מקבילים ומאונכים בחמשה.', 'interplay2024', 'A'],
      ['polygonWalk', 'צעדו על צלעות הצורה לפי תיפוף: צלעות מקבילות הולכות לאותו כיוון; אחרי פנייה של רבע סיבוב הצלעות מאונכות.', 'moore2012', 'A'],
    ],
    QUAD_SORT: [
      ['vertexBells', 'פעמון בכל קודקוד וצעד לכל צלע: כל מרובע נותן 4 צלצולים — ההבדל ביניהם הוא באורכים ובזוויות, לא במספר.', 'interplay2024', 'A'],
      ['shapeRhythm', 'כל מרובע הוא מקצב של 4 פעימות: ריבוע — ארבע שוות; מלבן — ארוכה, קצרה, ארוכה, קצרה. שמעו וזהו.', 'ncssm', 'R'],
      ['mirrorPattern', 'הפכו את המרובע כמו שהופכים דגם מקצב: הסימטריה מגלה איזה מרובע הוא — ריבוע, מעוין או מקבילית.', 'azaryahuPatterns', 'A'],
    ],
    BOX: [
      ['speakerBox', 'תיבת רמקול: הקישו על כל פאה — 6 צלילים; עברו באצבע על כל מקצוע — 12; געו בכל קודקוד — 8.', 'kcMath', 'A'],
      ['layerCount', 'בנו תיבה משכבות של קוביות ונגנו משפט לכל שכבה: כמה שכבות, כמה בכל אחת — ומה נשאר קבוע בקובייה.', 'das2023', 'A'],
      ['shakerCubes', 'שייקר בצורת קובייה: לכל פאה אותו ריבוע, לכל מקצוע אותו אורך. ספרו פאות ומקצועות תוך כדי בנייה.', 'whitehead', 'A'],
    ],
    UNITS: [
      ['pipeLengths', 'צינור של מטר מול צינורות של 10 ס״מ: כמה קצרים מצטרפים לארוך? נגנו ושמעו — ואז המירו.', 'palmPipes', 'R'],
      ['waterGlasses', 'כוסות מוזיקליות: 1,000 מ״ל הם ליטר. מזגו, הקישו, והמירו בין מ״ל לליטר לפי מספר הכוסות.', 'whitehead', 'A'],
      ['unitSteps', 'המרה היא ספירה בקבוצות: נקישה לכל יחידה קטנה, תוף לכל יחידה גדולה — כמה נקישות בתוף אחד?', 'palmPipes', 'R'],
    ],
    CALENDAR: [
      ['beatClock', 'שבוע הוא תיבה של 7 פעימות ויממה — 24 שעות. ספרו פעימות מהיום עד היום המבוקש.', 'interplay2024', 'A'],
      ['sixtyBeats', 'ב־60 BPM דקה היא 60 פעימות ושעה — 60 דקות: כמה פעימות בשעה, וכמה שעות ביממה? יחידות בתוך יחידות.', 'wnetMathInMusic', 'R'],
      ['songRecipe', 'תכנון כמו שיר: 4 שבועות ועוד 3 ימים — כופלים שבועות ב־7 ואז מוסיפים ימים, כמו תיבות ופתיחה.', 'interplay2024', 'A'],
    ],
    MONEY: [
      ['tenExchange', 'שקל הוא 100 אגורות: נקישה לכל עשר אגורות, תוף לכל שקל. ספרו תופים ונקישות.', 'kcConnections', 'A'],
      ['takeAwayBeats', 'עודף: נגנו את מה ששילמתם, השתיקו את המחיר — מה שנשאר נשמע הוא העודף.', 'mcdonel2015', 'A'],
      ['fillBar', 'עודף כהשלמה: מהמחיר נגנו פעימות עד הסכום ששולם וספרו — גם באגורות.', 'azaryahu2020', 'A'],
    ],
    BARCHART: [
      ['instrumentSurvey', 'ספרו כמה פעמים נשמע כל כלי בקטע וציירו עמודה לכל כלי. קריאה: משווים גבהים.', 'kcMath', 'A'],
      ['pipePlot', 'מדדו כלי נגינה וסמנו כל מדידה בדיאגרמה; קראו מי הארוך ובכמה.', 'preshall', 'R'],
      ['barDifference', 'הפרש בין עמודות בנקישות: נקשו את הגבוהה ואז את הנמוכה — מה שנשאר לבד הוא ההפרש; הסכום — כל הצלילים.', 'kcMath', 'A'],
    ],
    TABLE: [
      ['instrumentSurvey', 'טבלה של כלי הכיתה: שורה לכל כלי, מספר לכל יום. קראו שורה כמו מקצב — נקישה לכל יחידה.', 'kcMath', 'A'],
      ['rowRhythm', 'השוו שתי שורות בטבלה כשני מקצבים: איזו ארוכה יותר ובכמה פעימות?', 'kcMath', 'A'],
      ['barDifference', 'סכום של עמודה: נגנו את כל השורות ברצף וספרו — ואז בדקו בחיבור.', 'kcMath', 'A'],
    ],
    NUM_MILLION: [
      ['placeScore', 'פרטיטורה של מקומות: שורה ליחידות, לעשרות, למאות, לאלפים… שורה ריקה — אפס. קראו מספר גדול שורה־שורה.', 'interplay2024', 'A'],
      ['tenExchange', 'כל עשר נקישות — כלי גדול יותר: שייקר, תוף, מצילה, גונג. אלף, עשרת אלפים, מאה אלף — אותו חוק של עשר.', 'kcConnections', 'A'],
      ['tenAsOctave', 'השוואה ועיגול: המקום הגבוה ביותר הוא הצליל הנמוך ביותר — הוא מכריע מי גדול, ולפיו מעגלים.', 'rusconi2005', 'A'],
    ],
    ADD_SUB_MILLION: [
      ['placeScore', 'חיבור במאונך הוא פרטיטורה: כל שורה מקום אחר, מנגנים מימין לשמאל; עשר בשורה — מעבירים צליל לשורה הבאה.', 'interplay2024', 'A'],
      ['tenExchange', 'פריטה בחיסור: תוף אחד (עשרת) נפרט לעשר נקישות כשחסרות יחידות — ורק אז מסירים.', 'kcConnections', 'A'],
      ['timelineEdit', 'בדיקה באומדן: עגלו כל מספר לאלפים כמו שמעגלים אורך שיר לדקות, חברו — והשוו לתוצאה המדויקת.', 'wnetMathInMusic', 'A'],
    ],
    MUL_DIV_VERT: [
      ['repeatedBars', 'מוטיב של 3 פעימות שחוזר 4 פעמים: 12 פעימות — כפל כחזרה. בחילוק: כמה מוטיבים נכנסים?', 'das2023', 'A'],
      ['phraseShare', 'חלקו פעימות שווה בשווה בין נגנים: שארית היא הפעימות שנשארו בלי נגן — כך רואים מנה ושארית.', 'das2023', 'A'],
      ['lcmDrums', 'סימני התחלקות באוזן: תוף כל 2 פעימות, אחר כל 3, שלישי כל 5 — באיזו פעימה כולם נפגשים? מי מתחלק במה.', 'rissman2005', 'R'],
    ],
    ORDER_OPS: [
      ['barCount', 'A = 2 פעימות, B = 3. נגנו A ואז B שלוש פעמים, מול (A ו־B) שלוש פעמים — הסוגריים משנים את האורך.', 'das2023', 'A'],
      ['songRecipe', 'מתכון שיר: פתיחה של 2 פעימות ואז 3 תיבות של 4. ציירו ומנו — הכפל נספר לפני שמוסיפים את הפתיחה.', 'interplay2024', 'A'],
      ['nestedRepeat', 'חזרה בתוך חזרה: סימן חזרה חיצוני שמכיל פתיחה ושני מוטיבים. בנו את התווים, ואז חשבו.', 'ncssm', 'A'],
    ],
    FRAC_OF_QTY: [
      ['songParts', 'שיר של 12 תיבות: רבע ממנו — כמה תיבות? מחלקים את השיר לחלקים שווים ולוקחים חלק.', 'interplay2024', 'A'],
      ['phraseShare', 'חלקו 20 פעימות ל־5 נגנים שווים: הפעימות של נגן אחד הן חמישית, של שניים — שתי חמישיות.', 'das2023', 'A'],
      ['fillBar', 'ציירו את הכמות כתיבה וסמנו את החלק: כמה פעימות יש בחלק? ואז כתבו את התרגיל.', 'azaryahu2020', 'D'],
    ],
    FRAC_NAMES: [
      ['noteValues', 'חצי תו = שני רבעים = ארבע שמיניות: אותו זמן, שמות שונים. נגנו ושמעו שהאורך לא משתנה.', 'courey2012', 'D'],
      ['fillBar', 'השוואה בתיבה: ציירו שני שברים בשתי תיבות זו מעל זו — מי תופס יותר מהתיבה?', 'azaryahu2020', 'D'],
      ['splitNotes', 'מרחיבים ומצמצמים כמו שמחליפים תו בשניים קצרים — או להפך — בלי לשנות את אורך הביצוע.', 'azaryahu2020', 'D'],
    ],
    FRAC_ADD_D: [
      ['fillBar', 'חיבור שברים בתיבה: רבע ועוד רבע — נגנו שני רבעים ברצף; כמה מהתיבה נשמע?', 'azaryahu2020', 'D'],
      ['noteValues', 'מכנים שונים: החליפו חצי בשני רבעים כדי שכל התווים יהיו באותו אורך — ואז חברו רבעים.', 'courey2012', 'D'],
      ['silenceQuarter', 'חיסור שברים: מתיבה של שלושה רבעים השתיקו רבע — כמה נשאר נשמע? כתבו שבר.', 'azaryahu2020', 'D'],
    ],
    BOX_AREA: [
      ['speakerBox', 'הקישו על כל פאה של תיבת הרמקול: 6 פאות, ולכל אחת שטח. סכום השטחים הוא שטח הפנים.', 'kcMath', 'A'],
      ['areaScore', 'לכל פאה נגנו צליל לכל משבצת, שורה אחרי שורה — ואז חברו את שש הפאות; פאות נגדיות נשמעות אותו דבר.', 'das2023', 'A'],
      ['shakerCubes', 'קובייה: שש פאות זהות, אז שטח פאה אחת כפול 6. בנו שייקר קובייה ובדקו.', 'whitehead', 'A'],
    ],
    PIE: [
      ['songFormPie', 'שיר של 4 חלקים שווים: 3 פזמון ו־1 בית — עוגה של 4 גזרות. כל גזרה — חלק מכלל התיבות.', 'interplay2024', 'A'],
      ['sectorDegrees', 'שעון מקצב של 12 עמדות: גזרה של 3 עמדות היא רבע מהעוגה. ספרו עמדות — וזה החלק.', 'interplay2024', 'A'],
      ['phraseShare', 'אם 3 גזרות הן 60 תלמידים, גזרה אחת היא 20: מחלקים את הפעימות בין הגזרות שווה בשווה.', 'das2023', 'A'],
    ],
  };

  return { grade: 'ד', ST: {}, items: [], music: music, sources: sources };
});
