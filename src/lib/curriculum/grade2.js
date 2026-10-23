// MelodyMath — grade ב׳: learning every bank standard THROUGH music (#591).
//
// Like curriculum/grade1.js, grade3.js, grade4.js and grade5.js: the grade
// ב׳ items stay in banks.js (ids are RAW indexes); this file carries only the
// music side in the shape banks.js reads for grade ו׳ — `sources` = the
// research behind the ways, `music` = ways per bank standard, one per level.
// No `rows`, so curriculum.js leaves the official grade ב׳ matrix alone.
// Pages load it before banks.js. The grade ב׳ music activities (#103:
// beatsBars, twoInstruments, evenOdd, registers, halfBar) keep their tag and
// take no way.
//
// Evidence labels follow the research map pasted on #591 (23.10.2026):
// D = part of an evaluated maths-learning intervention (a package of
// activities, not this one alone), R = a reputable instructional source
// supports the connection, A = an adaptation of a documented music–maths
// relationship whose effect on this topic was not tested on its own.
// Nothing here claims more than its label.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_GRADE2 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // Same ids and values as in grade6.js, so one id means one source everywhere.
  const sources = {
    azaryahu2020: ['Azaryahu et al. 2020 — MusiMath and Academic Music', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7378943/'],
    interplay2024: ['Interplay between music and mathematics (Humanit. Soc. Sci. Commun., 2024)', 'https://www.nature.com/articles/s41599-024-03631-z'],
    kcConnections: ['Kennedy Center — Connections: Math and Music', 'https://www.kennedy-center.org/education/resources-for-educators/classroom-resources/media-and-interactives/media/music/connections/connections/math--music/'],
    kcMath: ['Kennedy Center — math collection', 'https://www.kennedy-center.org/education/resources-for-educators/classroom-resources/collections/collections/math/'],
    kcPractice: ['Kennedy Center — Arts Integration in Practice: Math', 'https://www.kennedy-center.org/education/resources-for-educators/classroom-resources/articles-and-how-tos/articles/collections/arts-integration-resources/arts-integration-in-practice-math/'],
    kcLessons: ['Kennedy Center — lessons and activities', 'https://www.kennedy-center.org/education/resources-for-educators/classroom-resources/lessons-and-activities/'],
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
    EQ_LEFT: [
      ['sameLength', 'שני משפטי תיפוף נמשכים אותו זמן גם אם מחולקים אחרת: 3 ו־4 מול 5 ו־2. סימן השוויון אומר «אותו אורך».', 'azaryahu2020', 'A'],
      ['fillBar', 'שני צדדים של שוויון הם שתי תיבות באותו אורך. מלאו את הפעימה החסרה כך ששתיהן יהיו שוות.', 'azaryahu2020', 'A'],
    ],
    MULTIADD: [
      ['callResponse', 'שלושה כלים זה אחרי זה: תוף, שייקר, פעמון. ספרו את כל הפעימות — וחברו קודם זוג שנותן 10.', 'kcConnections', 'A'],
      ['fillBar', 'תיבה אחת, כמה תווים: חברו את האורכים בכל סדר — התיבה נשארת שלמה. חפשו את הזוג שמשלים לעשר.', 'azaryahu2020', 'A'],
      ['tenThenMore', 'שלושה מחוברים: נגנו קודם את השניים שמשלימים לעשר — תוף עד עשר — ואז את השלישי בשייקר.', 'azaryahu2020', 'A'],
    ],
    TENS: [
      ['tenExchange', 'כל תוף הוא עשרת: 30 ועוד 20 הם 3 תופים ועוד 2. ספרו תופים וכתבו את המספר.', 'kcConnections', 'A'],
      ['tenAsOctave', 'קפיצה של עשר היא אוקטבה: כל קפיצה — צליל, וסופרים קפיצות קדימה או אחורה.', 'interplay2024', 'A'],
      ['takeAwayBeats', 'חיסור בעשרות: נגנו את התופים, השתיקו כמה — כמה תופים נשארו? כפול עשר.', 'azaryahu2020', 'A'],
    ],
    ADD20: [
      ['callResponse', 'קריאה ותשובה: משפט של פעימות ומשפט תשובה. מחברים את שני המשפטים — מהגדול מוסיפים את הקטן.', 'kcConnections', 'A'],
      ['tenThenMore', 'נגנו עד 10 בתוף, והמשיכו בשייקר: קודם משלימים לעשר, ואז מוסיפים את השאר.', 'azaryahu2020', 'A'],
    ],
    MUL_B: [
      ['repeatedBars', 'מוטיב של 2 פעימות שחוזר 5 פעמים: 10 פעימות — כפל כחזרה של משפט. נגנו וספרו.', 'kcMath', 'R'],
      ['accentSkip', 'הדגישו כל פעימה חמישית ואמרו רק את המודגשות: 5, 10, 15 — כפולות 5 באוזן.', 'kcLessons', 'R'],
      ['lcmDrums', 'תוף כל 2 פעימות ואחר כל 4: מתי נפגשים? כפולות של 2 ושל 4 — ולמה כל כפולה של 4 היא גם של 2.', 'makingMusicCount', 'R'],
    ],
    DIV_PART: [
      ['phraseShare', 'חלקו 12 פעימות ל־4 נגנים שווים: כמה פעימות לכל אחד? חילוק לחלקים.', 'azaryahu2020', 'A'],
      ['repeatedBars', 'חילוק הוא כפל הפוך: כמה פעימות במוטיב אם 4 חזרות שלו הן 12 פעימות?', 'kcMath', 'R'],
    ],
    DIV_QUOT: [
      ['phraseShare', 'כמה משפטים של 3 פעימות נכנסים ב־12 פעימות? נגנו וספרו משפטים — חילוק להכלה.', 'azaryahu2020', 'A'],
      ['repeatedBars', 'מוטיב ידוע, אורך כולל ידוע: כמה חזרות? ספרו חזרות — זו המנה.', 'kcMath', 'R'],
      ['twoDrums', 'שני סוגי חילוק באותן פעימות: לחלק ל־3 נגנים (כמה לכל אחד) מול משפטים של 3 (כמה משפטים). נגנו את שניהם.', 'azaryahu2020', 'A'],
    ],
    WORD_COLLECT: [
      ['callResponse', 'כל קבוצה בסיפור היא משפט פעימות. נגנו את שתי הקבוצות ברצף וספרו הכול יחד.', 'kcConnections', 'A'],
      ['twoDrums', 'קבוצה אחת בתוף, השנייה בשייקר. מנגנים זו אחרי זו — כמה צלילים בסך הכול?', 'kcConnections', 'A'],
      ['fillBar', 'כתבו את הסיפור כתיבה: החלק הראשון, החלק השני, והשלם. ואז את התרגיל שמתאים.', 'azaryahu2020', 'A'],
    ],
    WORD_REMOVE: [
      ['takeAwayBeats', 'הקבוצה כולה — משפט פעימות. מה שהלך — פעימות שהופכות לשקט. כמה צלילים נשארו?', 'azaryahu2020', 'A'],
      ['twoDrums', 'הכול בתוף; מה שיוצא מהקבוצה עובר לשייקר. ספרו רק את התופים שנשארו.', 'kcConnections', 'A'],
      ['fillBar', 'כתבו את הסיפור כתיבה: השלם, מה שהוסר, ומה שנשאר — ואז את תרגיל החיסור.', 'azaryahu2020', 'A'],
    ],
    WORD_COMPARE: [
      ['twoDrums', 'קבוצה אחת בתוף וקבוצה שנייה בשייקר, פעימה מול פעימה. כשכלי אחד משתתק — כמה פעימות המשיך השני לבד?', 'kcConnections', 'A'],
      ['sameLength', 'שני משפטים באורכים שונים: השלימו את הקצר עד שיהיה כמו הארוך — ההשלמה היא ההפרש.', 'azaryahu2020', 'A'],
      ['fillBar', 'כתבו את ההשוואה כשתי תיבות זו מעל זו: הארוכה, הקצרה, והחלק שבולט — זה ההפרש ותרגיל החיסור.', 'azaryahu2020', 'A'],
    ],
    ADD2D: [
      ['tenThenMore', 'חיבור דו־ספרתי: תופים לעשרות, שייקר ליחידות. חברו תופים עם תופים, שייקרים עם שייקרים.', 'kcConnections', 'A'],
      ['tenExchange', 'מעבר עשרת: עשר נקישות שייקר הופכות לתוף אחד — ההחלפה היא ה«אחד שעובר».', 'kcConnections', 'A'],
      ['fillBar', 'השלמה לעשרת העגולה: מהמספר הראשון נגנו עד העשרת הקרובה, ואז את השאר — שני צעדים.', 'azaryahu2020', 'A'],
    ],
    SUB2D: [
      ['takeAwayBeats', 'חיסור דו־ספרתי: השתיקו תופים (עשרות) ושייקרים (יחידות) — מה שנשאר נשמע הוא ההפרש.', 'azaryahu2020', 'A'],
      ['tenExchange', 'פריטה: כשחסרות יחידות, תוף אחד נפרט לעשר נקישות שייקר — ורק אז מסירים.', 'kcConnections', 'A'],
      ['fillBar', 'חיסור כהשלמה: מהקטן נגנו עד העשרת העגולה, ואז עד הגדול — חברו את שני הצעדים.', 'azaryahu2020', 'A'],
    ],
    VERT_ADD: [
      ['placeScore', 'חיבור במאונך הוא פרטיטורה של שתי שורות: יחידות למטה, עשרות למעלה; מנגנים מימין לשמאל.', 'interplay2024', 'A'],
      ['tenExchange', 'עשר בשורת היחידות — נקישה אחת עוברת לשורת העשרות כתוף: זה ה«אחד שעובר» במאונך.', 'kcConnections', 'A'],
      ['callResponse', 'בדיקה: נגנו את שני המחוברים כקריאה ותשובה, וספרו — האם הסכום במאונך מתאים?', 'kcConnections', 'A'],
    ],
    VERT_SUB: [
      ['placeScore', 'חיסור במאונך: שתי שורות, יחידות למטה; מכל שורה משתיקים מה שמחסרים.', 'interplay2024', 'A'],
      ['tenExchange', 'פריטה במאונך: תוף אחד מהעשרות נפרט לעשר נקישות ביחידות — ורק אז משתיקים.', 'kcConnections', 'A'],
      ['fillBar', 'בדיקה בהשלמה: מהתוצאה נגנו פעימות עד המספר הגדול — האם הגעתם בדיוק למה שחיסרתם?', 'azaryahu2020', 'A'],
    ],
    PLACE_VALUE: [
      ['tenExchange', 'שייקר = יחידה, תוף = עשרת, מצילה = מאה: נגנו מספר ופענחו — כמה מכל כלי?', 'kcConnections', 'A'],
      ['placeScore', 'פרטיטורה של שלוש שורות: מאות, עשרות, יחידות. שורה ריקה — אפס. השוו מספרים מהשורה העליונה.', 'interplay2024', 'A'],
      ['twoDrums', 'זוגי או אי־זוגי: חלקו את הנקישות לשני תופים לסירוגין — אם נגמר שווה, זוגי; נשארה אחת — אי־זוגי.', 'kcConnections', 'A'],
    ],
    GEO_SORT: [
      ['vertexBells', 'הניחו פעמון בכל קודקוד והקיפו את הצורה, צלצול בכל פינה: מספר הצלצולים הוא מספר הקודקודים.', 'interplay2024', 'A'],
      ['edgeSteps', 'צעד לכל צלע ופעמון בכל קודקוד: למשולש 3 ו־3, לריבוע 4 ו־4 — תמיד אותו מספר צלעות וקודקודים.', 'interplay2024', 'A'],
      ['shapeRhythm', 'כל צורה היא תבנית מקצב: משולש — 3 פעימות, מרובע — 4. שמעו תבנית ונחשו את הצורה.', 'ncssm', 'R'],
    ],
    RIGHT_ANGLE: [
      ['musicalTurns', 'צעדו לפי התיפוף: ישר, פנייה של רבע סיבוב, ישר. פנייה כזו היא זווית ישרה — כמו פינת דף.', 'kcPractice', 'A'],
      ['beatClock', 'על שעון מקצב של 12 עמדות: מ־12 ל־3 זה רבע סיבוב — זווית ישרה. חצי סיבוב — שטוחה, פחות מרבע — חדה.', 'interplay2024', 'A'],
    ],
    LENGTH: [
      ['pipeLengths', 'צינורות של כלי נגינה: ארוך — צליל נמוך, קצר — גבוה. סדרו לפי צליל ובדקו עם סרגל.', 'palmPipes', 'R'],
      ['unitSteps', 'מדדו באטבים או בקוביות, נקישה לכל יחידה: מספר הנקישות הוא האורך. ואז אותו דבר בס״מ.', 'palmPipes', 'R'],
      ['comparePipes', 'מדדו שני צינורות בס״מ והשוו: בכמה ס״מ הארוך ארוך יותר? נגנו ושמעו את ההבדל.', 'palmPipes', 'R'],
    ],
    CLOCK: [
      ['beatClock', 'השעון הוא שעון מקצב של 12 עמדות: המחוג הקטן מצביע על השעה. נקישה לכל עמדה מ־12 עד המחוג.', 'interplay2024', 'A'],
      ['sixtyBeats', 'דקה היא 60 פעימות ב־60 BPM: ספרו עם המטרונום כמה זמן המחוג הגדול זז. שעה שלמה — הוא חוזר ל־12.', 'wnetMathInMusic', 'R'],
      ['hoursOnClock', 'כמה שעות עברו? ספרו עמדות על השעון כמו צעדים על מעגל המקצב, מהשעה הראשונה לשנייה.', 'interplay2024', 'A'],
    ],
    HALF_HOUR: [
      ['beatClock', 'חצי שעה היא חצי סיבוב של המחוג הגדול: מ־12 עד 6 — 6 צעדים של 5 דקות. ספרו צעדים.', 'interplay2024', 'A'],
      ['fillBar', 'שעה היא תיבה: חצי שעה ממלאת חצי תיבה. שני חצאים — תיבה שלמה, שעה שלמה.', 'azaryahu2020', 'A'],
      ['sixtyBeats', 'ב־60 BPM חצי שעה היא 30 דקות של 60 פעימות: ספרו דקות על שעון המקצב — ומתי מגיעים ל«וחצי».', 'wnetMathInMusic', 'R'],
    ],
    PERIMETER: [
      ['perimeterWalk', 'הקיפו את הצורה לפי פעימה: נקישה לכל ס״מ וצליל אחר בכל פינה — מספר הנקישות הוא ההיקף.', 'kcPractice', 'A'],
      ['vertexBells', 'צעד לכל צלע ופעמון בכל קודקוד: חברו את אורכי הצלעות — בין פעמון לפעמון.', 'interplay2024', 'A'],
      ['repeatedBars', 'ריבוע: אותו משפט חוזר 4 פעמים — היקף הוא 4 פעמים הצלע. מלבן: שני משפטים, כל אחד פעמיים.', 'kcMath', 'R'],
    ],
    MONEY: [
      ['tenExchange', 'נקישה לכל עשר אגורות, תוף לכל שקל: 100 אגורות הן שקל. ספרו תופים ונקישות.', 'kcConnections', 'A'],
      ['takeAwayBeats', 'עודף: נגנו את מה ששילמתם, השתיקו את המחיר — מה שנשאר נשמע הוא העודף.', 'azaryahu2020', 'A'],
      ['fillBar', 'עודף כהשלמה: מהמחיר נגנו פעימות עד הסכום ששולם וספרו — גם באגורות.', 'azaryahu2020', 'A'],
    ],
    MASS_VOL: [
      ['waterGlasses', 'כוסות מוזיקליות: 1,000 מ״ל הם ליטר; מזגו, הקישו — יותר מים, צליל נמוך יותר. המירו לפי מספר הכוסות.', 'whitehead', 'A'],
      ['tenExchange', 'ק״ג הוא 1,000 גרם: המרה היא ספירה בקבוצות — נקישה לכל מאה גרם, תוף לכל ק״ג.', 'kcConnections', 'A'],
      ['shakerCubes', 'נפח תיבה בקוביות: בנו שייקר סביב שכבות של קוביות ונגנו משפט לכל שכבה — כמה קוביות בסך הכול?', 'whitehead', 'A'],
    ],
    PICTOGRAM: [
      ['instrumentSurvey', 'כל סמל הוא כלי שנשמע: ספרו סמלים בשורה — כמה פעמים ניגן הכלי?', 'kcMath', 'A'],
      ['pictoBeats', 'כשסמל אחד שווה כמה צלילים, נקשו לפי המפתח לכל סמל וספרו.', 'kcMath', 'A'],
      ['rowRhythm', 'השוו שתי שורות כמקצבים — ההפרש הוא הנקישות שנשארו לבד.', 'kcMath', 'A'],
    ],
    BARCHART: [
      ['instrumentSurvey', 'ספרו כמה פעמים נשמע כל כלי בקטע וציירו עמודה לכל כלי. קריאה: משווים גבהים.', 'kcMath', 'A'],
      ['pipePlot', 'מדדו כלי נגינה וסמנו כל מדידה בדיאגרמה; קראו מי הארוך ובכמה.', 'preshall', 'R'],
      ['barDifference', 'הפרש בין עמודות בנקישות: נקשו את הגבוהה ואז את הנמוכה — מה שנשאר לבד הוא ההפרש.', 'kcMath', 'A'],
    ],
    TABLE: [
      ['instrumentSurvey', 'טבלה של כלי הכיתה: שורה לכל כלי, מספר לכל יום. קראו שורה כמו מקצב — נקישה לכל יחידה.', 'kcMath', 'A'],
      ['rowRhythm', 'השוו שתי שורות בטבלה כשני מקצבים: איזו ארוכה יותר ובכמה פעימות?', 'kcMath', 'A'],
      ['barDifference', 'סכום של עמודה: נגנו את כל השורות ברצף וספרו — ואז בדקו בחיבור.', 'kcMath', 'A'],
    ],
    POLY_DECOMP: [
      ['vertexBells', 'מצמידים שתי צורות: הקיפו את הצורה החדשה עם פעמון בכל פינה. כמה צלצולים? חלק מהפינות נעלמו.', 'interplay2024', 'A'],
      ['shapeRhythm', 'מקצב של כל צורה לחוד (3 פעימות למשולש), ואז המקצב של הצורה המורכבת — כמה פעימות?', 'ncssm', 'R'],
      ['mirrorPattern', 'גזרו לאורך קו וצרו שני חלקים: נגנו את המקצב של כל חלק. חלקים זהים נשמעים אותו דבר.', 'interplay2024', 'A'],
    ],
    MONEY_BILLS: [
      ['tenExchange', 'מטבע של שקל נקישה, שטר של 10 תוף, שטר של 20 — שני תופים: ספרו תופים ונקישות וחברו.', 'kcConnections', 'A'],
      ['callResponse', 'שטרות ואז מטבעות — קריאה ותשובה: חברו קודם את השטרות, ואז הוסיפו את המטבעות.', 'kcConnections', 'A'],
      ['fillBar', 'עודף בשקלים: מהמחיר נגנו פעימות עד הסכום ששולם וספרו כמה הוספתם.', 'azaryahu2020', 'A'],
    ],
  };

  return { grade: 'ב', ST: {}, items: [], music: music, sources: sources };
});
