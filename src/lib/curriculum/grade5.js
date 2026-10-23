// MelodyMath — grade ה׳: learning every bank standard THROUGH music (#591).
//
// Like curriculum/grade1.js and grade4.js: the grade ה׳ items stay in
// banks.js (ids are RAW indexes); this file carries only the music side in
// the shape banks.js reads for grade ו׳ — `sources` = the research behind the
// ways, `music` = ways per bank standard, one per level. No `rows`, so
// curriculum.js leaves the official grade ה׳ matrix alone. Pages load it
// before banks.js. The 36 grade ה׳ music activities (#106: bars, lcm,
// mixedBar, bpm, secPerBeat, drumsMeet, meters, hzChart) keep their tag and
// take no way; standards made only of activities (LCM, FACTORS, BARCHART)
// have no entry here.
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
  else root.MM_GRADE5 = api;
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
    ncssm: ['NCSSM — mathematics and musical composition', 'https://www.ncssm.edu/stories/hands-on-activities-illustrate-connection-between-mathematics-and-music'],
  };

  // Bank standard key (banks.js ST) → ways, one per level (1, 2, 3). A way is
  // [music tag, how to solve it with music (Hebrew; never the numbers of an
  // item), source id, evidence label]. banks.js gives each plain item the way
  // of its level, so a topic is met through at least two musical models.
  const music = {
    FRAC_EQUIV: [
      ['noteValues', 'חצי תו = שני רבעים = ארבע שמיניות: אותו זמן, שמות שונים. הרחבה היא החלפת תו בכמה תווים קצרים יותר.', 'azaryahu2020', 'D'],
      ['fillBar', 'ציירו שני שברים בשתי תיבות זו מעל זו ונגנו: אם הם נגמרים יחד — הם שקולים; אם לא — מי ארוך יותר?', 'azaryahu2020', 'D'],
      ['splitNotes', 'צמצום: איחדו תווים קצרים לתו ארוך אחד בלי לשנות את אורך הביצוע — מונה ומכנה מתחלקים באותו מספר.', 'azaryahu2020', 'D'],
    ],
    FRAC_ADD: [
      ['fillBar', 'חיבור בתיבה: רבע ועוד שמינית — נגנו ברצף; כדי לכתוב את הסכום, החליפו את הרבע בשתי שמיניות (מכנה משותף).', 'azaryahu2020', 'D'],
      ['noteValues', 'מכנים שונים: בחרו את התו הקצר ביותר כיחידה — כל התווים נמדדים בו, ואז מחברים ומחסרים.', 'azaryahu2020', 'D'],
      ['roundBars', 'אומדן: תו שכמעט ממלא תיבה הוא «בערך 1». שני כאלה — בערך 2. שמעו לפני שמחשבים.', 'azaryahu2020', 'A'],
    ],
    FRAC_OF: [
      ['songParts', 'שיר של 12 תיבות: רבע ממנו — כמה תיבות? מחלקים את השיר לחלקים שווים ולוקחים חלק.', 'interplay2024', 'A'],
      ['phraseShare', 'חלקו 20 פעימות ל־5 נגנים שווים: הפעימות של נגן אחד הן חמישית; של שלושה — שלוש חמישיות.', 'azaryahu2020', 'A'],
      ['fillBar', 'ציירו את הכמות כתיבה וסמנו את החלק: כמה פעימות יש בחלק? ואז כתבו את התרגיל.', 'azaryahu2020', 'D'],
    ],
    DEC_PLACE: [
      ['beatDecimal', 'פעימה אחת = 1. שמינית = 0.5, שש־עשרית = 0.25. כתבו תבנית של פעימה אחת גם בשבר וגם בעשרוני.', 'azaryahu2020', 'A'],
      ['clipSeconds', 'בעורך מוזיקה קטעים של 1.25, 0.75 ו־2.5 שניות: סדרו מהקצר לארוך לפני ההשמעה, ואז בדקו בציר הזמן.', 'wnetMathInMusic', 'R'],
      ['pipeDecimals', 'מדדו צינורות של כלי נגינה לעשירית הס״מ וסדרו לפי אורך: המספר העשרוני הגדול — הצינור הארוך והצליל הנמוך.', 'palmPipes', 'R'],
    ],
    DEC_ADD: [
      ['clipSeconds', 'חברו קטעים של 1.25 ו־0.75 שניות בציר הזמן: חזו את הסכום לפני ההשמעה ובדקו.', 'wnetMathInMusic', 'R'],
      ['beatDecimal', 'שמינית (0.5) ועוד שש־עשרית (0.25): מלאו את הפעימה — כמה חסר ל־1? חיסור עשרוני בתוך פעימה אחת.', 'azaryahu2020', 'A'],
      ['timelineEdit', 'קטע של 2.5 שניות; חותכים 0.75: חזו כמה יישאר, בדקו בשעון עצר — ומקמו את הנקודה העשרונית.', 'wnetMathInMusic', 'A'],
    ],
    FRAC_MIXED: [
      ['dottedBeats', 'רבע מנוקד = 1 ו־1/2 פעימות: שלם ועוד חלק. נגנו ומנו — זה מספר מעורב.', 'azaryahu2020', 'D'],
      ['barsAndHalf', 'שיר של 2 ו־1/2 תיבות הוא 5 חצאי תיבה: ספרו חצאים — מעבר לשבר לא אמיתי וחזרה.', 'azaryahu2020', 'A'],
      ['fillBar', 'חיבור מספרים מעורבים: שלמים כתיבות מלאות, שברים כתווים — קודם התיבות, ואז מלאו את השארית.', 'azaryahu2020', 'D'],
    ],
    NUM_BIG: [
      ['placeScore', 'פרטיטורה של מקומות: שורה לכל ספרה, ושלוש שורות לכל מחלקה — יחידות, אלפים, מיליונים. קראו שורה־שורה.', 'interplay2024', 'A'],
      ['tenExchange', 'כל עשר נקישות — כלי גדול יותר: שייקר, תוף, מצילה, גונג… גם אחרי מיליון החוק הוא אותו עשר.', 'kcConnections', 'A'],
      ['tenAsOctave', 'השוואה: המקום הגבוה ביותר הוא הצליל הנמוך ביותר — הוא מכריע מי גדול; רק כשהוא שווה עוברים למקום הבא.', 'interplay2024', 'A'],
    ],
    OPS_MILLION: [
      ['placeScore', 'חיבור וחיסור במאונך הם פרטיטורה: כל שורה מקום אחר, מימין לשמאל; עשר בשורה — צליל עובר לשורה הבאה.', 'interplay2024', 'A'],
      ['repeatedBars', 'כפל כחזרה: מוטיב שחוזר — כמה פעימות בסך הכול? חילוק: כמה מוטיבים נכנסים, ומה נשאר?', 'kcMath', 'R'],
      ['timelineEdit', 'עיגול ואומדן: עגלו כל מספר כמו שמעגלים אורך שיר לדקות, חשבו בראש — והשוו לתוצאה המדויקת.', 'wnetMathInMusic', 'A'],
    ],
    PRIME_FACTOR: [
      ['meterGroups', 'תיבה של 12 פעימות נחלקת ל־2, 3, 4 או 6 קבוצות שוות; תיבה של 7 — רק ל־1 ול־7. ראשוני = אין חלוקה.', 'kcConnections', 'A'],
      ['lcmDrums', 'תוף כל 2 פעימות, אחר כל 3, שלישי כל 5: מי מכה בפעימה 30? אלה הגורמים שלה — ומי לא.', 'makingMusicCount', 'R'],
      ['accentSkip', 'סימני התחלקות באוזן: הדגישו כל פעימה שלישית — מספר שנופל על הדגשה מתחלק ב־3.', 'kcLessons', 'R'],
    ],
    FRAC_MODELS: [
      ['noteValues', 'תיבה של 4/4 היא השלם: רבע תו — 1/4 מהתיבה, שמינית — 1/8. ציירו את השבר כתווים.', 'azaryahu2020', 'D'],
      ['scaleSteps', 'שבר על ישר המספרים כמו צליל בסולם: חלקו את הצעד בין 0 ל־1 לחלקים שווים ומצאו את המקום.', 'interplay2024', 'A'],
      ['phraseShare', 'השבר כמנה: 3 תיבות ל־4 נגנים שווים — כל אחד מקבל 3/4 תיבה. חלקו ונגנו.', 'azaryahu2020', 'A'],
    ],
    TRI_AREA: [
      ['areaScore', 'משולש הוא חצי מלבן: נגנו צליל לכל משבצת במלבן, ואז רק חצי — בסיס כפול גובה חלקי 2.', 'kcMath', 'A'],
      ['polygonWalk', 'הגובה הוא הצעד המאונך מהקודקוד לבסיס: צעדו לפי תיפוף לאורך הבסיס, ואז פנו רבע סיבוב — זה הגובה.', 'kcPractice', 'A'],
      ['instrumentShape', 'גוף הבללייקה משולש: מדדו בסיס וגובה ובדקו שהשטח לא משתנה כשבוחרים בסיס אחר.', 'interplay2024', 'A'],
    ],
    PARA_AREA: [
      ['areaScore', 'מקבילית היא מלבן שהוזז: חתכו משולש מצד אחד והצמידו לצד השני — נגנו את משבצות המלבן שנוצר.', 'kcMath', 'A'],
      ['polygonWalk', 'צעדו על הבסיס לפי תיפוף, ואז פנו רבע סיבוב עד הצלע הנגדית — הצעדים המאונכים הם הגובה, לא הצלע.', 'kcPractice', 'A'],
      ['instrumentShape', 'צורת הפסנתר היא כמעט מקבילית: בסיס כפול גובה — ובדקו שהשטח לא משתנה כשהמקבילית «נשענת» יותר.', 'interplay2024', 'A'],
    ],
    SOLIDS: [
      ['speakerBox', 'הקישו על כל פאה של הגוף — ספרו צלילים; עברו באצבע על כל מקצוע; געו בכל קודקוד. שלושה מספרים.', 'kcMath', 'A'],
      ['vertexBells', 'פריסה: פעמון בכל קודקוד של הפריסה הפתוחה, ואז קפלו — אילו פעמונים נפגשים לקודקוד אחד?', 'interplay2024', 'A'],
      ['shapeRhythm', 'פירמידה מול מנסרה כמקצב: בסיס אחד או שניים? פאות משולשות או מלבניות? נגנו פאה־פאה וספרו.', 'ncssm', 'R'],
    ],
    FREQ: [
      ['instrumentSurvey', 'ספרו כמה פעמים נשמע כל כלי בקטע — זו טבלת שכיחויות; הכלי שנשמע הכי הרבה הוא השכיח.', 'kcMath', 'A'],
      ['rowRhythm', 'נגנו כל שורה בטבלה כמקצב — נקישה לכל פעם. השורה הארוכה ביותר היא השכיח.', 'kcMath', 'A'],
      ['barDifference', 'סכום השכיחויות הוא כל הצלילים בקטע: נגנו את כל השורות ברצף וספרו — ובדקו בחיבור.', 'kcMath', 'A'],
    ],
    PICTOGRAM: [
      ['instrumentSurvey', 'כל סמל הוא כלי שנשמע: ספרו סמלים בשורה — כמה פעמים ניגן הכלי?', 'kcMath', 'A'],
      ['pictoBeats', 'כשסמל אחד שווה כמה צלילים, נקשו לפי המפתח לכל סמל וספרו.', 'kcMath', 'A'],
      ['rowRhythm', 'השוו שתי שורות כמקצבים — ההפרש הוא הנקישות שנשארו לבד; חצי סמל — חצי מהמפתח.', 'kcMath', 'A'],
    ],
    PIE: [
      ['songFormPie', 'שיר של חלקים שווים: כל גזרה — חלק מכלל התיבות. ספרו גזרות וכתבו שבר.', 'interplay2024', 'A'],
      ['sectorDegrees', 'שעון מקצב של 12 עמדות: גזרה של 3 עמדות היא רבע מהעוגה. ספרו עמדות — וזה החלק.', 'interplay2024', 'A'],
      ['phraseShare', 'שתי גזרות יחד: חברו את חלקיהן מתוך כל העוגה — כמו שני נגנים שמנגנים ברצף מתוך כל הפעימות.', 'azaryahu2020', 'A'],
    ],
  };

  return { grade: 'ה', ST: {}, items: [], music: music, sources: sources };
});
