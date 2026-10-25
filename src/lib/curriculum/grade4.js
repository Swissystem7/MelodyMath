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
  // Dosage rules (#591, owner 23.10 15:54): the ways an item is solved with
  // share one strongly evidenced mechanism (M1, M2, M3, M6). A way ending in
  // EXTRA is optional extra practice; WEAK marks M4/M5/M7 (weak evidence),
  // which are never primary. banks.js gives the item a primary way.
  const EXTRA = Object.freeze({ optional: true });
  const WEAK = Object.freeze({ optional: true, evidence: 'weak' });
  const music = {
    FRAC_BAR: [
      ['noteValues', 'תיבה של 4/4 היא השלם: חצי תו ממלא חצי תיבה, רבע — רבע, שמינית — שמינית. נגנו ומנו.', 'courey2012', 'D'],
      ['fillBar', 'מלאו תיבה בתווים עד שהיא בדיוק שלמה, ואז כתבו איזה חלק מהתיבה כל תו תופס.', 'azaryahu2020', 'D'],
    ],
    PARALLEL: [
      ['parallelVoices', 'שתי מנגינות באותו דגם בדיוק, אחת מעל השנייה, שומרות על אותו מרחק ולא נפגשות — כך צלעות מקבילות. ספרו זוגות כאלה בצורה.', 'azaryahuPatterns', 'A'],
      ['polygonWalk', 'צעדו על צלעות הצורה לפי תיפוף: צלעות מקבילות הולכות לאותו כיוון; אחרי פנייה של רבע סיבוב הצלעות מאונכות.', 'moore2012', 'A', WEAK],
    ],
    QUAD_SORT: [
      ['quadMotif', 'מרובע הוא מוטיב של ארבעה תווים, תו לכל צלע: ריבוע — ארבעה זהים; מלבן — ארוך, קצר, ארוך, קצר. הדגם מגלה את שם המרובע.', 'azaryahuPatterns', 'A'],
      ['oppositeEcho', 'במוטיב של מרובע כל קודקוד עונה לקודקוד שמולו, לא לשכנו. קו בין שני קודקודים שעונים זה לזה הוא אלכסון — כמה זוגות כאלה?', 'azaryahuPatterns', 'A'],
      ['mirrorPattern', 'הפכו את המרובע כמו שהופכים דגם מקצב: הסימטריה מגלה איזה מרובע הוא — ריבוע, מעוין או מקבילית.', 'azaryahuPatterns', 'A'],
    ],
    BOX: [
      ['faceEdgeGroups', 'תיבה בקבוצות: 3 זוגות של פאות נגדיות — 6 פאות; 3 קבוצות של 4 מקצועות מקבילים — 12; 2 שכבות של 4 קודקודים — 8.', 'das2023', 'A'],
      ['layerCount', 'בנו תיבה משכבות של קוביות ונגנו משפט לכל שכבה: כמה שכבות, כמה בכל אחת — ומה נשאר קבוע בקובייה.', 'das2023', 'A'],
      ['cubeSameGroups', 'בקובייה כל הקבוצות שוות: 6 פאות זהות ו־12 מקצועות באותו אורך. ספרו בקבוצות וגלו שכל פאה היא אותו ריבוע.', 'das2023', 'A'],
    ],
    UNITS: [
      ['metreHundredGroups', 'מטר הוא 100 ס״מ: 10 קבוצות של 10, הדגשה בראש כל קבוצה. ממירים בקבוצות: כמה מטרים — כמה פעמים 100.', 'das2023', 'A'],
      ['thousandGroups', 'ק״מ, ק״ג וליטר הם 1,000 יחידות קטנות: 10 קבוצות של 100. כל יחידה גדולה היא הדגשה; ספרו הדגשות וכפלו ב־1,000.', 'das2023', 'A'],
      ['piecesPerUnit', 'מיחידה גדולה לחתיכות: כמה קבוצות בגודל החתיכה נכנסות ביחידה אחת? ספרו קבוצות ביחידה וכפלו במספר היחידות.', 'das2023', 'A'],
    ],
    CALENDAR: [
      ['weekBars', 'שבוע הוא קבוצה של 7 ימים, הדגשה בראש כל שבוע. ספרו שבועות בקפיצות של 7, ואז הוסיפו את הימים הבודדים.', 'das2023', 'A'],
      ['dayHourGroups', 'יממה היא 24 שעות, שתי קבוצות של 12 כמו שני סיבובי שעון. שנה היא 12 קבוצות של חודש. ספרו קבוצות, לא שעות.', 'das2023', 'A'],
      ['weeksThenDays', 'שבועות וימים: כופלים את מספר הקבוצות של 7, ואז מוסיפים את הימים שמחוץ לקבוצה — כמו קבוצות ושארית.', 'das2023', 'A'],
    ],
    MONEY: [
      ['shekelHundredGroups', 'שקל הוא 100 אגורות, 10 קבוצות של 10. מחיאה לכל 10 אגורות והדגשה לכל שקל; ספרו הדגשות ואז את המחיאות שנשארו.', 'das2023', 'A'],
      ['takeAwayBeats', 'עודף: נגנו את מה ששילמתם, השתיקו את המחיר — מה שנשאר נשמע הוא העודף.', 'mcdonel2015', 'A', EXTRA],
      ['fillBar', 'עודף כהשלמה: מהמחיר נגנו פעימות עד הסכום ששולם וספרו — גם באגורות.', 'azaryahu2020', 'A', EXTRA],
    ],
    BARCHART: [
      ['columnHeldNote', 'כל עמודה היא תו שנמשך כגובהה בקנה המידה. קראו עמודה כמו משך תו: כמה משבצות של קנה המידה היא נמשכת?', 'azaryahu2020', 'A'],
      ['notesRatioCompare', 'השוו שתי עמודות כשני תווים: בכמה ארוך האחד — זה ההפרש; כמה פעמים הקצר נכנס בארוך — זה פי כמה.', 'azaryahu2020', 'A'],
      ['barChartMelody', 'נגנו את כל העמודות כתווים ברצף, זה אחר זה: אורך המנגינה כולה הוא הסכום של כל העמודות.', 'azaryahu2020', 'A'],
    ],
    TABLE: [
      ['rowCellGroups', 'כל תא בטבלה הוא קבוצת פעימות בגודל המספר שבו. מצאו תא לפי שורה ועמודה, והשוו תאים בקבוצות של עשר.', 'das2023', 'A'],
      ['twoCellsJoin', 'חיבור תאים: נגנו את הקבוצות של שני תאים ברצף ומנו בקבוצות של עשרות ומאות — זה הסכום.', 'das2023', 'A'],
      ['bigCellGap', 'הפרש בין מספרים גדולים בטבלה: השוו רמה אחר רמה מהגבוהה ומטה, ופרטו הדגשה מהרמה שמעל כשחסר.', 'das2023', 'A'],
    ],
    NUM_MILLION: [
      ['millionAccentLevels', 'שש רמות הדגשה, מיחידות עד מאות אלפים, בשלשות כמו הפסיקים. נגנו מספר מהרמה הגבוהה לנמוכה; רמה שקטה — אפס.', 'das2023', 'A'],
      ['compareTopAccent', 'השוואה: מתחילים ברמת ההדגשה הגבוהה; רק אם היא שווה יורדים לבאה. עשר ברמה אחת הן אחת ברמה שמעליה.', 'das2023', 'A'],
      ['tenAsOctave', 'השוואה ועיגול: המקום הגבוה ביותר הוא הצליל הנמוך ביותר — הוא מכריע מי גדול, ולפיו מעגלים.', 'rusconi2005', 'A', WEAK],
    ],
    ADD_SUB_MILLION: [
      ['carryTenUp', 'חיבור במאונך ברמות: מחברים כל רמה מימין לשמאל; עשר פעימות ברמה הופכות להדגשה אחת ברמה שמעל, עד מאות האלפים.', 'das2023', 'A'],
      ['borrowTenDown', 'חיסור במאונך: כשחסר ברמה פורטים הדגשה מהרמה שמעל לעשר פעימות; כשיש אפסים בדרך, פורטים כמה רמות.', 'das2023', 'A'],
      ['roundThousandAccent', 'בדיקה באומדן: עגלו כל מספר להדגשה הקרובה של אלף, חברו את ההדגשות והשוו לתוצאה המדויקת.', 'das2023', 'A'],
    ],
    MUL_DIV_VERT: [
      ['repeatedBars', 'מוטיב של 3 פעימות שחוזר 4 פעמים: 12 פעימות — כפל כחזרה. בחילוק: כמה מוטיבים נכנסים?', 'das2023', 'A'],
      ['phraseShare', 'חלקו פעימות שווה בשווה בין נגנים: שארית היא הפעימות שנשארו בלי נגן — כך רואים מנה ושארית.', 'das2023', 'A'],
      ['lcmDrums', 'סימני התחלקות באוזן: תוף כל 2 פעימות, אחר כל 3, שלישי כל 5 — באיזו פעימה כולם נפגשים? מי מתחלק במה.', 'das2023', 'A', EXTRA],
    ],
    ORDER_OPS: [
      ['barCount', 'A = 2 פעימות, B = 3. נגנו A ואז B שלוש פעמים, מול (A ו־B) שלוש פעמים — הסוגריים משנים את האורך.', 'das2023', 'A'],
      ['groupsBeforeSingles', 'בסדר פעולות הכפל הוא קבוצות: קודם בונים את הקבוצות — כמה קבוצות וכמה בכל אחת — ורק אז מוסיפים פעימות בודדות.', 'das2023', 'A'],
      ['bracketGroup', 'סוגריים הופכים את מה שבתוכם לקבוצה אחת: קודם מחברים את הקבוצה, ואז חוזרים עליה כמה פעמים.', 'das2023', 'A'],
    ],
    // #710: the balance of א׳-ב׳ (EQ_LEFT) grows up. balanceBars extends
    // fillBar: both sides are bars played at once, and the ear judges them.
    EQ_INEQ: [
      ['balanceBars', 'מאזן של שתי תיבות: כל צד הוא תיבה, ושני נגנים מתחילים יחד. נגמרות יחד — שוות; אחת ממשיכה לבד — הצד שלה גדול יותר.', 'azaryahu2020', 'A'],
      ['fillBar', 'משוואה היא תיבה עם תו חסר: נגנו את הצד הידוע, ואז מלאו בתיבה השנייה את מה שחסר עד ששתיהן נשמעות באותו אורך.', 'azaryahu2020', 'A'],
      ['sameLength', 'אותו אורך, חלוקה אחרת: צד אחד מתופף בקבוצות גדולות, השני בקטנות. אם המשפטים נגמרים יחד — יש שוויון.', 'azaryahu2020', 'A'],
    ],
    FRAC_OF_QTY: [
      ['quantityAsBar', 'הכמות כולה היא תיבה: מחלקים אותה לתווים שווים כמספר המכנה, בכל תו אותו מספר פריטים, ולוקחים תווים כמו המונה.', 'azaryahu2020', 'D'],
      ['phraseShare', 'חלקו 20 פעימות ל־5 נגנים שווים: הפעימות של נגן אחד הן חמישית, של שניים — שתי חמישיות.', 'das2023', 'A', EXTRA],
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
    // #709 (mm-cur-33): fillBar over consecutive bars — the whole part is full
    // bars, the fraction is the part of the next bar. Same mechanism (M3), so
    // A: MusiMath filled one bar; carrying on into the next was not tested.
    FRAC_MIXED_D: [
      ['fillBar', 'תיבות ברצף: השלמים הם תיבות מלאות, והשבר הוא חלק מהתיבה הבאה. נגנו קודם את התיבות המלאות ואז את החלקית.', 'azaryahu2020', 'A'],
      ['noteValues', 'שבר גדול מ־1 בתווי רבע: כל ארבעה רבעים סוגרים תיבה. מנו כמה תיבות נסגרו וכמה רבעים נשארו לתיבה הבאה.', 'courey2012', 'A', EXTRA],
    ],
    BOX_AREA: [
      ['faceAreaGroups', 'שטח פנים בקבוצות: כל פאה היא שורות של משבצות, ופאות נגדיות הן זוג זהה. חשבו שלוש פאות, וכל אחת פעמיים.', 'das2023', 'A'],
      ['areaScore', 'לכל פאה נגנו צליל לכל משבצת, שורה אחרי שורה — ואז חברו את שש הפאות; פאות נגדיות נשמעות אותו דבר.', 'das2023', 'A'],
      ['cubeSixGroups', 'קובייה היא 6 קבוצות זהות: שטח פאה אחת — שורות כפול משבצות בשורה — חוזר 6 פעמים.', 'das2023', 'A'],
    ],
    PIE: [
      ['pieAsBar', 'העוגה כולה היא תיבה, וכל גזרה היא תו בתוכה: חצי עוגה — חצי תיבה, רבע עוגה — תו רבע. קראו גזרה כחלק מהתיבה.', 'azaryahu2020', 'A'],
      ['sectorNoteShare', 'כמה בגזרה: מחלקים את כל המשתתפים לתווים שווים כמו התיבה, ולוקחים את התווים שהגזרה תופסת.', 'azaryahu2020', 'A'],
      ['phraseShare', 'אם 3 גזרות הן 60 תלמידים, גזרה אחת היא 20: מחלקים את הפעימות בין הגזרות שווה בשווה.', 'das2023', 'A', EXTRA],
    ],
  };

  return { grade: 'ד', ST: {}, items: [], music: music, sources: sources };
});
