// MelodyMath — grade ג׳: learning every bank standard THROUGH music (#591).
//
// Like curriculum/grade1.js, grade4.js and grade5.js: the grade ג׳ items
// stay in banks.js (ids are RAW indexes); this file carries only the music
// side in the shape banks.js reads for grade ו׳ — `sources` = the research
// behind the ways, `music` = ways per bank standard, one per level. No
// `rows`, so curriculum.js leaves the official grade ג׳ matrix alone. Pages
// load it before banks.js. The grade ג׳ music activities (#105: meters,
// tuneTime, stepGrid, leftoverBeats, howManyTimes, hzCompare) and the g3
// widgets (meter, remainder, pair, grid - they play) keep or get an activity
// tag and take no way; standards made only of activities (MUL_COMPARE,
// NUM_10K, AREA_RECT) have no entry here.
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
  else root.MM_GRADE3 = api;
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
    whitehead: ['Exploratorium — instrument builder Peter Whitehead', 'https://annex.exploratorium.edu/music/movies/peterWhitehead_Low.html'],
    ncssm: ['NCSSM — mathematics and musical composition', 'https://www.ncssm.edu/stories/hands-on-activities-illustrate-connection-between-mathematics-and-music'],
    preshall: ['Preservation Hall Foundation — Music and Math', 'https://lessons.preshallfoundation.org/lesson/music-and-math/'],
  };

  // Bank standard key (banks.js ST) → ways, one per level (1, 2, 3). A way is
  // [music tag, how to solve it with music (Hebrew; never the numbers of an
  // item), source id, evidence label]. banks.js gives each plain item the way
  // of its level, so a topic is met through at least two musical models.
  const music = {
    MUL_C: [
      ['repeatedBars', 'מוטיב של 3 פעימות שחוזר 4 פעמים: 12 פעימות — כפל כחזרה של משפט. נגנו וספרו.', 'kcMath', 'R'],
      ['accentSkip', 'הדגישו כל פעימה רביעית ואמרו רק את המודגשות: 4, 8, 12… — לוח הכפל של 4 באוזן.', 'kcLessons', 'R'],
      ['lcmDrums', 'תוף כל 3 פעימות ואחר כל 4: נפגשים ב־12 — אותה מכפלה משני כיוונים, חוק החילוף שנשמע.', 'makingMusicCount', 'R'],
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
    ANGLE_KINDS: [
      ['beatClock', 'שעון מקצב של 12 עמדות: 3 צעדים — רבע סיבוב, זווית ישרה; פחות — חדה; יותר — קהה; 6 — שטוחה.', 'interplay2024', 'A'],
      ['musicalTurns', 'צעדו לפי תיפוף: ישר, פנייה, ישר. פנייה של רבע סיבוב — ישרה; פחות — חדה; יותר — קהה. ציירו את המסלול.', 'kcPractice', 'A'],
      ['polygonTurns', 'הקיפו מצולע לפי פעימה ופעמון בכל פנייה: בריבוע כל פנייה ישרה; במשולש — חדה. שמעו וספרו.', 'interplay2024', 'A'],
    ],
    TRI_SORT: [
      ['shapeRhythm', 'משולש כמקצב של 3 פעימות: שווה־צלעות — שלוש שוות; שווה־שוקיים — שתיים שוות ואחת שונה; שונה־צלעות — שלוש שונות.', 'ncssm', 'R'],
      ['polygonTurns', 'צעדו על המשולש ופעמון בכל פנייה: פנייה ישרה — משולש ישר־זווית; פנייה רחבה — קהה; שלוש קטנות — חד.', 'interplay2024', 'A'],
      ['vertexBells', 'פעמון בכל קודקוד וצעד לכל צלע: ספרו צעדים שווים — כמה צלעות שוות יש?', 'interplay2024', 'A'],
    ],
    MINUTES: [
      ['sixtyBeats', 'ב־60 BPM כל פעימה היא שנייה ו־60 פעימות הן דקה: שעה היא 60 דקות. ספרו עם המטרונום.', 'wnetMathInMusic', 'R'],
      ['beatClock', 'שעון המקצב: המחוג הגדול עושה 12 צעדים של 5 דקות. ספרו צעדים מהזמן הראשון לשני — זה המשך.', 'interplay2024', 'A'],
      ['timelineEdit', 'משך זמן כקטע בציר הזמן: מההתחלה עד השעה העגולה, ואז הלאה. חזו ובדקו בשעון עצר.', 'wnetMathInMusic', 'A'],
    ],
    AREA: [
      ['areaScore', 'צליל אחד לכל משבצת: נגנו 3 שורות של 4 — ואז 4 עמודות של 3. שתיהן 12 משבצות.', 'kcMath', 'A'],
      ['repeatedBars', 'שורה היא מוטיב: מוטיב של 4 צלילים שחוזר 3 פעמים — השטח הוא מספר הצלילים.', 'kcMath', 'R'],
      ['perimeterWalk', 'שטח מול היקף: נגנו את המשבצות שבפנים, ואז הקיפו את הצורה בצעדים — שני מספרים שונים.', 'kcPractice', 'A'],
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
    ],
    DIV_REM: [
      ['phraseShare', 'חלקו 14 פעימות למשפטים של 4: שלושה משפטים מלאים ו־2 פעימות שנשארות — זו השארית.', 'azaryahu2020', 'A'],
      ['fillBar', 'תיבות של 4 פעימות: מלאו תיבות שלמות; מה שלא ממלא תיבה הוא השארית — תמיד קטנה מהתיבה.', 'azaryahu2020', 'D'],
      ['repeatedBars', 'בדיקה: מספר התיבות כפול הפעימות בתיבה, ועוד השארית — חייב לחזור למספר שחילקתם.', 'kcMath', 'R'],
    ],
    TIMES_MORE: [
      ['twoDrums', 'תוף אחד מכה 3 פעמים, השני 12: כמה פעמים נכנס המשפט הקצר בארוך? פי כמה.', 'kcConnections', 'A'],
      ['repeatedBars', '«פי 4» הוא המשפט שחוזר 4 פעמים: נגנו את הקצר, ואז את הארוך — ספרו חזרות.', 'kcMath', 'R'],
      ['phraseShare', 'ההבדל בין «פי» ל«יותר ב»: פי 3 — המשפט חוזר 3 פעמים; יותר ב־3 — מוסיפים 3 פעימות. נגנו את שניהם.', 'azaryahu2020', 'A'],
    ],
    NUM10K: [
      ['placeScore', 'פרטיטורה של ארבע שורות: אלפים, מאות, עשרות, יחידות. שורה ריקה — אפס. קראו וכתבו מספר שורה־שורה.', 'interplay2024', 'A'],
      ['tenExchange', 'כל עשר נקישות — כלי גדול יותר: שייקר, תוף, מצילה, גונג (אלפים). ספרו את הכלי הגדול קודם.', 'kcConnections', 'A'],
      ['tenAsOctave', 'השוואה: הכלי הגדול ביותר (הצליל הנמוך) מכריע מי גדול; רק כשהוא שווה עוברים לכלי הבא.', 'interplay2024', 'A'],
    ],
    TIME_MIN_SEC: [
      ['sixtyBeats', 'ב־60 BPM דקה היא 60 פעימות: 2 דקות — 120 פעימות. ספרו עם המטרונום והמירו.', 'wnetMathInMusic', 'R'],
      ['bpmEstimate', 'ספרו פעימות ב־15 שניות וכפלו ב־4: דקה היא ארבע פעמים 15 שניות.', 'wnetMathInMusic', 'R'],
      ['timelineEdit', 'קטע של 90 שניות בציר הזמן הוא דקה וחצי: חלקו ל־60 ולשארית, ובדקו בשעון עצר.', 'wnetMathInMusic', 'A'],
    ],
    ADD_SUB_10K: [
      ['placeScore', 'חיבור במאונך הוא פרטיטורה: כל שורה מקום אחר, מנגנים מימין לשמאל; עשר בשורה — צליל עובר לשורה הבאה.', 'interplay2024', 'A'],
      ['tenExchange', 'פריטה בחיסור: תוף אחד (עשרת) נפרט לעשר נקישות כשחסרות יחידות — ורק אז מסירים.', 'kcConnections', 'A'],
      ['timelineEdit', 'אומדן: עגלו כל מספר למאות כמו שמעגלים אורך שיר לדקות, חברו — והשוו לתוצאה המדויקת.', 'wnetMathInMusic', 'A'],
    ],
    MUL_DIV_10: [
      ['tenAsOctave', 'כפל ב־10 הוא קפיצת אוקטבה: כל ספרה עולה מקום אחד. שמעו את הקפיצה וכתבו את המספר.', 'interplay2024', 'A'],
      ['tenExchange', 'כפול 100 — כל שייקר הופך למצילה: שתי קפיצות של עשר. חילוק ב־10 — להפך, קומה למטה.', 'kcConnections', 'A'],
      ['placeScore', 'בפרטיטורה של מקומות, כפל ב־10 מזיז כל שורה שורה אחת למעלה ומשאיר שורה ריקה למטה — האפס.', 'interplay2024', 'A'],
    ],
    WORD_TWO_STEP: [
      ['songRecipe', 'שאלה דו־שלבית היא שיר של שני חלקים: קודם מנגנים את החלק הראשון וכותבים את תוצאתו, ואז את השני.', 'interplay2024', 'A'],
      ['callResponse', 'קריאה ותשובה: השלב הראשון הוא הקריאה, תוצאתו נכנסת לתשובה. נגנו את שניהם ברצף.', 'kcConnections', 'A'],
      ['timelineEdit', 'ציר זמן: סמנו את שני השלבים כשני קטעים, חזו את התוצאה — ואז חשבו ובדקו.', 'wnetMathInMusic', 'A'],
    ],
  };

  return { grade: 'ג', ST: {}, items: [], music: music, sources: sources };
});
