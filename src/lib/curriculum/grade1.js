// MelodyMath — grade א׳: learning every bank standard THROUGH music (#591).
//
// The grade א׳ items themselves still live in banks.js (ids are RAW indexes,
// so they stay there); this file only adds the music side, in the shape
// banks.js already reads for grade ו׳ (curriculum/grade6.js): `sources` =
// the research behind the ways, `music` = ways per bank standard, one per
// level. It has no `rows`, so curriculum.js leaves the official matrix of
// grade א׳ alone. Pages load it before banks.js.
//
// Evidence labels follow the research map pasted on #591 (23.10.2026):
// D = part of an evaluated maths-learning intervention (a package of
// activities, not this one alone), R = a reputable instructional source
// supports the connection, A = an adaptation of a documented music–maths
// relationship whose effect on this topic was not tested on its own.
// Nothing here claims more than its label. Items whose prompt already plays
// sound (counted beats, the g1 widgets) are music activities and take no way.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_GRADE1 = api;
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
    palmPipes: ['Exploratorium — Palm Pipes', 'https://www.exploratorium.edu/snacks/palm-pipes'],
    ncssm: ['NCSSM — mathematics and musical composition', 'https://www.ncssm.edu/stories/hands-on-activities-illustrate-connection-between-mathematics-and-music'],
    preshall: ['Preservation Hall Foundation — Music and Math', 'https://lessons.preshallfoundation.org/lesson/music-and-math/'],
  };

  // Bank standard key (banks.js ST) → ways, one per level (1, 2, 3). A way is
  // [music tag, how to solve it with music (Hebrew; never the numbers of an
  // item), source id, evidence label]. banks.js gives each plain item the way
  // of its level, so a topic is met through at least two musical models.
  const music = {
    COUNT_OBJ: [
      ['oneSoundOneThing', 'לכל נקישת תוף מזיזים חפץ אחד. בסוף שואלים: כמה יש? נגנו שוב מהר יותר — המספר לא משתנה.', 'kcConnections', 'R'],
      ['beatsAndRests', 'בשמונה פעימות רק חלק נשמעות: ספרו את כל הפעימות עם אסימונים, ואז רק את הצלילים — שני מספרים שונים.', 'kcConnections', 'A'],
    ],
    NEXTPREV: [
      ['nextBeat', 'ספרו פעימות בקול עם המטרונום ועצרו: איזה מספר תגידו בפעימה הבאה? ואיזה אמרתם לפניה?', 'kcConnections', 'R'],
      ['accentNext', 'הדגישו כל פעימה שנייה: אחרי מספר מודגש בא מספר שקט — הבא אחריו. ספרו קדימה ואחורה עם הנקישות.', 'kcLessons', 'R'],
    ],
    COUNT_FWD: [
      ['countOnBeats', 'התחילו לספור מהמספר שניתן, פעימה לכל מספר, בקצב קבוע. הקצב לא נותן לדלג על מספר.', 'kcConnections', 'R'],
      ['tenAsOctave', 'כל עשרה מספרים הם אוקטבה: כשעוברים עשרת, הצליל «עולה קומה». ספרו קדימה ושמעו את המעבר.', 'interplay2024', 'A'],
    ],
    COUNT_BACK: [
      ['countDownBeats', 'ספרו אחורה פעימה לכל מספר, כמו ספירה לאחור לפני שהשיר מתחיל. הקצב שומר שלא מדלגים.', 'kcConnections', 'R'],
      ['tenAsOctave', 'ספירה אחורה: כשיורדים מתחת לעשרת, הצליל «יורד קומה» (אוקטבה). שמעו את המעבר ואמרו את המספר.', 'interplay2024', 'A'],
      ['restCount', 'ספרו אחורה בלב ונקשו רק במספרים הזוגיים — ספירה אחורה עם שקטים בין הצלילים.', 'kcConnections', 'A'],
    ],
    SKIP2: [
      ['accentSkip', 'שמרו פעימה קבועה והדגישו כל פעימה שנייה. אמרו בקול רק את המודגשות: 2, 4, 6…', 'kcLessons', 'R'],
      ['halfNoteSkip', 'כל חצי תו נמשך שתי פעימות. סופרים את החצאים קדימה או אחורה: 2, 4, 6… משך התו הוא גודל הדילוג.', 'azaryahu2020', 'A'],
      ['composeSkips', 'הרכיבו תיפוף שבו כל קבוצה היא 2 פעימות, וספרו קבוצות: כמה פעימות יש ב־5 קבוצות? ואחורה מ־50?', 'kcLessons', 'R'],
    ],
    SKIP5: [
      ['accentSkip', 'הדגישו כל פעימה חמישית ואמרו רק את המודגשות: 5, 10, 15… המספרים האלה מסתיימים ב־5 או ב־0.', 'kcLessons', 'R'],
      ['handClap', 'כף יד = 5 אצבעות: מחיאת כף לכל חמישייה. התחילו מכפולה של 5 והמשיכו — מחיאה, מספר.', 'kcConnections', 'A'],
      ['skipReply', 'קריאה ותשובה בקבוצות של 5 פעימות: כל תשובה היא עוד קבוצה שלמה. סך הפעימות מתחילת הקריאה הוא האיבר הבא.', 'kcConnections', 'A'],
    ],
    GROUP10: [
      ['tenExchange', 'כל נקישת שייקר היא יחידה. אחרי עשר — מחליפים עשר אסימונים באסימון «עשרת» ומכים בתוף. ספרו תופים ושייקרים.', 'kcConnections', 'A'],
      ['placeScore', 'שתי שורות תווים: תופים (עשרות) ושייקרים (יחידות). נגנו מספר ופענחו — כמה עשרות וכמה יחידות?', 'interplay2024', 'A'],
      ['fillTen', 'תיבה של עשר פעימות היא עשרת. תיבות מלאות — ספרת העשרות; הפעימות שחסרות בתיבה הפתוחה משלימות לעשר הבאה.', 'azaryahu2020', 'A'],
    ],
    ADD10: [
      ['callResponse', 'המורה מתופף 3 פעימות, הילד עונה 4. כולם מנגנים את הרצף המחובר — כמה פעימות יחד? כתבו תרגיל.', 'kcConnections', 'A'],
      ['fillBar', 'תיבה של 10 פעימות: נגנו את הפעימות הראשונות, והשלימו עד 10 — החלק שהשלמתם הוא התשובה.', 'azaryahu2020', 'D'],
    ],
    DECOMP10: [
      ['fillBar', 'תיבה של 10 פעימות: תוף גבוה ואז תוף נמוך. כמה נמוכות צריך כדי להשלים ל־10? זה הפירוק.', 'azaryahu2020', 'D'],
      ['twoDrums', 'עשרה חברים, שני כלים: חלקו — כמה בתוף וכמה בשייקר? נגנו כל פירוק ושמעו שתמיד יוצא 10.', 'kcConnections', 'A'],
    ],
    ADD20: [
      ['callResponse', 'קריאה ותשובה: משפט של פעימות ומשפט תשובה. מחברים את שני המשפטים — אפשר להתחיל מהגדול ולהוסיף.', 'kcConnections', 'A'],
      ['tenThenMore', 'נגנו עד 10 בתוף, והמשיכו בשייקר: קודם משלימים לעשר, ואז מוסיפים את השאר.', 'azaryahu2020', 'A'],
    ],
    EQ_LEFT: [
      ['sameLength', 'שני משפטי תיפוף נמשכים אותו זמן גם אם מחולקים אחרת: 3 ו־4 מול 5 ו־2. סימן השוויון אומר «אותו אורך».', 'azaryahu2020', 'D'],
      ['fillBar', 'שני צדדים של שוויון הם שתי תיבות באותו אורך. מלאו את הפעימה החסרה כך ששתי התיבות יהיו שוות.', 'azaryahu2020', 'D'],
      ['callResponse', 'הפכו את שני המשפטים — קודם התשובה ואז הקריאה. האורך הכולל לא משתנה: זה חוק החילוף.', 'kcConnections', 'A'],
    ],
    MULTIADD: [
      ['callResponse', 'שלושה כלים זה אחרי זה: תוף, שייקר, פעמון. ספרו את כל הפעימות — ונסו לחבר קודם זוג שנותן 10.', 'kcConnections', 'A'],
      ['fillBar', 'תיבה אחת, כמה תווים: חברו את האורכים בכל סדר — התיבה נשארת שלמה. חפשו את הזוג שמשלים לעשר.', 'azaryahu2020', 'D'],
      ['tenThenMore', 'שלושה מחוברים: נגנו קודם את השניים שמשלימים לעשר — תוף עד עשר — ואז את השלישי בשייקר והמשיכו לספור.', 'azaryahu2020', 'A'],
    ],
    TENS: [
      ['tenExchange', 'כל תוף הוא עשרת: 30 ועוד 20 הם 3 תופים ועוד 2 תופים. ספרו תופים, ואז כתבו את המספר.', 'kcConnections', 'A'],
      ['tenAsOctave', 'קפיצה של עשר בישר המספרים היא אוקטבה: כל קפיצה — צליל, וסופרים קפיצות קדימה או אחורה.', 'interplay2024', 'A'],
    ],
    SUB10: [
      ['takeAwayBeats', 'נגנו משפט פעימות, ואז הסירו ממנו פעימות (שקט במקומן). כמה פעימות נשארו נשמעות?', 'azaryahu2020', 'D'],
      ['fillBar', 'חיסור כהשלמה: כמה פעימות חסרות מהמשפט הקצר כדי להגיע למשפט הארוך? נגנו את ההשלמה.', 'azaryahu2020', 'D'],
    ],
    SUB20: [
      ['takeAwayBeats', 'משפט של פעימות ארוך יותר מעשר: הסירו קודם את מה שמעל עשר, ואז את השאר — הקשיבו לכמה שנשאר.', 'azaryahu2020', 'D'],
      ['fillBar', 'השלמה במקום חיסור: מהמספר הקטן נגנו פעימות עד הגדול וספרו כמה הוספתם.', 'azaryahu2020', 'D'],
      ['timelineEdit', 'קטע מוזיקה של 15 שניות; חותכים ממנו 8 שניות. חזו כמה יישאר ובדקו בשעון עצר.', 'wnetMathInMusic', 'A'],
    ],
    NLINE: [
      ['scaleSteps', 'ישר המספרים הוא סולם: כל מספר צליל, כל צעד ימינה — צליל גבוה יותר. מצאו את המקום לפי הצליל.', 'interplay2024', 'A'],
      ['scaleJump', 'קפיצה על הישר היא קפיצה בסולם: שמעו את הצליל של ההתחלה ושל הסוף — כמה צעדים ביניהם?', 'interplay2024', 'A'],
      ['tenAsOctave', 'עשרת שלמה היא אוקטבה — אותו צליל, קומה למעלה. כך מוצאים מהר בין אילו עשרות מספר נמצא.', 'interplay2024', 'A'],
    ],
    NUMBER_LINE_APPROX: [
      ['scaleJump', 'הערכה באוזן: צליל נמוך — קרוב ל־0, גבוה — קרוב ל־100, באמצע — בערך 50. ואז מדייקים.', 'interplay2024', 'A'],
      ['tenAsOctave', 'ספרו אוקטבות מ־0: כל אוקטבה היא עשרת. המספר נמצא בין שתי אוקטבות — איזו קרובה יותר?', 'interplay2024', 'A'],
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
    GEO_SORT: [
      ['vertexBells', 'הניחו פעמון בכל קודקוד והקיפו את הצורה, צלצול בכל פינה: מספר הצלצולים הוא מספר הקודקודים.', 'interplay2024', 'A'],
      ['sideMelody', 'שרים תו אחד לכל צלע וחוזרים לתו הראשון. מספר התווים עד החזרה הוא מספר הצלעות, ובמצולע פשוט גם מספר הקודקודים.', 'ncssm', 'A'],
      ['shapeRhythm', 'כל צורה היא תבנית מקצב: משולש — 3 פעימות, מרובע — 4. שמעו תבנית ונחשו את הצורה.', 'ncssm', 'R'],
    ],
    RIGHT_ANGLE: [
      ['musicalTurns', 'צעדו לפי התיפוף: ישר, פנייה של רבע סיבוב, ישר. פנייה כזו היא זווית ישרה — כמו פינת דף.', 'kcPractice', 'A'],
      ['beatClock', 'על שעון מקצב של 12 עמדות: מ־12 ל־3 זה רבע סיבוב — זווית ישרה. חצי סיבוב — שטוחה, פחות מרבע — חדה.', 'interplay2024', 'A'],
      ['cornerTurn', 'מקיפים ריבוע בתיפוף ומסובבים בכל פינה. ארבע פניות שוות סוגרות את הצורה, וכל אחת מהן ישרה; פנייה קטנה יותר לא סוגרת ריבוע.', 'interplay2024', 'A'],
    ],
    POLY_CUT_A: [
      ['vertexBells', 'מצמידים שתי צורות: הקיפו את הצורה החדשה עם פעמון בכל פינה. כמה צלצולים? חלק מהפינות נעלמו.', 'interplay2024', 'A'],
      ['shapeRhythm', 'מקצב של כל צורה לחוד (3 פעימות למשולש), ואז המקצב של הצורה המורכבת — כמה פעימות?', 'ncssm', 'R'],
      ['mirrorPattern', 'גזרו לאורך קו וצרו שני חלקים: נגנו את המקצב של כל חלק. חלקים זהים נשמעים אותו דבר.', 'interplay2024', 'A'],
    ],
    LENGTH: [
      ['pipeLengths', 'צינורות של כלי נגינה: ארוך — צליל נמוך, קצר — גבוה. סדרו לפי צליל ובדקו עם סרגל.', 'palmPipes', 'R'],
      ['unitSteps', 'מדדו באטבים או בקוביות, נקישה לכל יחידה: מספר הנקישות הוא האורך. ואז אותו דבר בס״מ.', 'palmPipes', 'R'],
      ['comparePipes', 'מדדו שני צינורות בס״מ והשוו: בכמה ס״מ הארוך ארוך יותר? נגנו ושמעו את ההבדל.', 'palmPipes', 'R'],
    ],
    CLOCK: [
      ['beatClock', 'השעון הוא שעון מקצב של 12 עמדות: המחוג הקטן מצביע על השעה. נקישה לכל עמדה מ־12 עד המחוג.', 'interplay2024', 'A'],
      ['sixtyBeats', 'דקה היא 60 פעימות ב־60 BPM: ספרו עם המטרונום כמה זמן המחוג הגדול זז. שעה שלמה — הוא חוזר ל־12.', 'wnetMathInMusic', 'R'],
      ['hourChimes', 'פעמון השעה מצלצל צלצול אחד לכל שעה. סופרים את הצלצולים: מספר הצלילים הוא המספר שהמחוג הקטן מראה.', 'kcConnections', 'A'],
    ],
    MONEY: [
      ['tenExchange', 'כל אגורה (או שקל) נקישה; עשר נקישות — החלפה למטבע גדול ותוף. כך סופרים כסף בקבוצות.', 'kcConnections', 'A'],
      ['takeAwayBeats', 'עודף הוא חיסור: נגנו את מה ששילמתם, השתיקו את המחיר — הפעימות שנשארו נשמעות הן העודף.', 'azaryahu2020', 'A'],
      ['fillBar', 'עודף כהשלמה: מהמחיר נגנו פעימות עד הסכום ששילמתם וספרו כמה הוספתם.', 'azaryahu2020', 'A'],
    ],
    PICTOGRAM: [
      ['instrumentSurvey', 'כל סמל בפיקטוגרם הוא כלי נגינה שנשמע: ספרו סמלים בשורה — כמה פעמים ניגן הכלי?', 'kcMath', 'A'],
      ['rowRhythm', 'נגנו שורה כמקצב: נקישה לכל סמל. השורה הארוכה ביותר — הכלי שנשמע הכי הרבה.', 'kcMath', 'A'],
      ['pictoBeats', 'כשסמל אחד שווה 2 צלילים, נקשו פעמיים לכל סמל וספרו — כך קוראים מפתח.', 'kcMath', 'A'],
    ],
    BARCHART: [
      ['instrumentSurvey', 'ספרו כמה פעמים נשמע כל כלי בקטע וציירו עמודה לכל כלי — העמודה הגבוהה היא הכלי שנשמע הכי הרבה.', 'kcMath', 'A'],
      ['pipePlot', 'מדדו כלי נגינה או צינורות וסמנו כל מדידה בדיאגרמה: קראו איזה הכי ארוך ובכמה.', 'preshall', 'R'],
      ['barDifference', 'השוו שתי עמודות בנקישות: נקשו את הגבוהה, ואז את הנמוכה — ההפרש הוא כמה נקישות נשארו לבד.', 'kcMath', 'A'],
    ],
    CHART100: [
      ['rowAccent', 'כל שורה בלוח המאה היא תיבה של עשר פעימות. איזו תיבה זו — העשרות; איזו פעימה מודגשת בתוכה — היחידות.', 'kcConnections', 'A'],
      ['placeScore', 'מספר בלוח הוא פרטיטורה של שתי שורות: עשרות למטה, יחידות למעלה. שורה ריקה — אפס.', 'interplay2024', 'A'],
      ['tenAsOctave', 'ירידה שורה בלוח המאה היא עשר יותר — אוקטבה. צעד ימינה או שמאלה — יחידה. נגנו את המסלול.', 'interplay2024', 'A'],
    ],
    PATTERN: [
      ['melodyAb', 'דגם AB בצליל: גבוה, נמוך, גבוה, נמוך… שירו אותו והמשיכו — הצליל הבא הוא מה שהדגם מכתיב.', 'interplay2024', 'A'],
      ['mirrorPattern', 'סדרו 8 פעימות בשורה וצרו דגם סימטרי; הפכו אותו ובדקו אם המוזיקה משתנה.', 'interplay2024', 'A'],
      ['composePattern', 'הרכיבו דגם AAB או ABC בצלילים ובצורות: אותו דגם, פעם בצליל ופעם בצורה — מה חוזר ואיפה?', 'ncssm', 'R'],
    ],
  };

  return { grade: 'א', ST: {}, items: [], music: music, sources: sources };
});
