// MelodyMath — grade ה׳: learning every bank standard THROUGH music (#591).
//
// Like curriculum/grade1.js and grade4.js: the grade ה׳ items stay in
// banks.js (ids are RAW indexes); this file carries only the music side in
// the shape banks.js reads for grade ו׳ — `sources` = the research behind the
// ways, `music` = ways per bank standard, one per level. No `rows`, so
// curriculum.js leaves the official grade ה׳ matrix alone. Pages load it
// before banks.js. The 36 grade ה׳ music activities (#106: bars, lcm,
// mixedBar, bpm, secPerBeat, drumsMeet, meters, hzChart) keep their tag. One
// of a weak or unsupported mechanism (drumsMeet M4, bpm and secPerBeat M8,
// hzChart M9) is solved with the standard's primary way (#591 rules 1-3):
// LCM has its own M2 way below, BARCHART carries the ways of grade ד׳.
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
    // Knuth, Stephens, McNeil & Alibali (2006), JRME 37(4), 297-312. No DOI:
    // 10.2307/30034852 no longer resolves (#710).
    knuth2006: ['Knuth et al. 2006 — Does Understanding the Equal Sign Matter? (JRME 37(4), 297–312)', 'https://www.jstor.org/stable/30034852'],
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
  // Dosage rules (#591, owner 23.10 15:54): the ways an item is solved with
  // share one strongly evidenced mechanism (M1, M2, M3, M6). A way ending in
  // EXTRA is optional extra practice; WEAK marks M4/M5/M7 (weak evidence),
  // which are never primary. banks.js gives the item a primary way.
  const EXTRA = Object.freeze({ optional: true });
  const WEAK = Object.freeze({ optional: true, evidence: 'weak' });
  // A second source cited next to the first (#710): research on the equal sign.
  const EQ_SIGN = Object.freeze({ also: ['knuth2006'] });
  const EQ_EXTRA = Object.freeze({ optional: true, also: ['knuth2006'] });
  const music = {
    FRAC_EQUIV: [
      ['noteValues', 'חצי תו = שני רבעים = ארבע שמיניות: אותו זמן, שמות שונים. הרחבה היא החלפת תו בכמה תווים קצרים יותר.', 'courey2012', 'D'],
      ['fillBar', 'ציירו שני שברים בשתי תיבות זו מעל זו ונגנו: אם הם נגמרים יחד — הם שקולים; אם לא — מי ארוך יותר?', 'azaryahu2020', 'D'],
      ['splitNotes', 'צמצום: איחדו תווים קצרים לתו ארוך אחד בלי לשנות את אורך הביצוע — מונה ומכנה מתחלקים באותו מספר.', 'azaryahu2020', 'D'],
    ],
    FRAC_ADD: [
      ['fillBar', 'חיבור בתיבה: רבע ועוד שמינית — נגנו ברצף; כדי לכתוב את הסכום, החליפו את הרבע בשתי שמיניות (מכנה משותף).', 'azaryahu2020', 'D'],
      ['noteValues', 'מכנים שונים: בחרו את התו הקצר ביותר כיחידה — כל התווים נמדדים בו, ואז מחברים ומחסרים.', 'courey2012', 'D'],
      ['roundBars', 'אומדן: תו שכמעט ממלא תיבה הוא «בערך 1». שני כאלה — בערך 2. שמעו לפני שמחשבים.', 'azaryahu2020', 'A'],
    ],
    FRAC_OF: [
      ['partsOfWholeBar', 'כמו בד׳ הכמות היא תיבה, עכשיו עם מונה גדול מ־1: חלק אחד הוא הכמות חלקי המכנה, ולוקחים חלקים כמו המונה.', 'azaryahu2020', 'D'],
      ['phraseShare', 'חלקו 20 פעימות ל־5 נגנים שווים: הפעימות של נגן אחד הן חמישית; של שלושה — שלוש חמישיות.', 'das2023', 'A', EXTRA],
      ['fillBar', 'ציירו את הכמות כתיבה וסמנו את החלק: כמה פעימות יש בחלק? ואז כתבו את התרגיל.', 'azaryahu2020', 'D'],
    ],
    DEC_PLACE: [
      ['tenthNotes', 'פעימה שלמה מחולקת לעשרה תווים שווים: כל אחד עשירית, ועשירית לעשרה — מאית. קראו מספר עשרוני כפעימות ותווים.', 'azaryahu2020', 'A'],
      ['beatDecimal', 'פעימה אחת = 1. שמינית = 0.5, שש־עשרית = 0.25. כתבו תבנית של פעימה אחת גם בשבר וגם בעשרוני.', 'azaryahu2020', 'A', EXTRA],
      ['compareBeatParts', 'השוואת עשרוניים כתווים: קודם הפעימות השלמות, אחר כך העשיריות ורק אז המאיות. חצי פעימה ארוכה מארבע עשיריות וחצי.', 'azaryahu2020', 'A', EXTRA],
    ],
    DEC_ADD: [
      ['tenthsTogether', 'חיבור עשרוניים כתווים ברצף: מחברים עשיריות לעשיריות; עשר עשיריות ממלאות פעימה שלמה ועוברות לשלמים.', 'azaryahu2020', 'A'],
      ['beatDecimal', 'שמינית (0.5) ועוד שש־עשרית (0.25): מלאו את הפעימה — כמה חסר ל־1? חיסור עשרוני בתוך פעימה אחת.', 'azaryahu2020', 'A', EXTRA],
      ['beatsLeftOver', 'חיסור עשרוני כהשלמה: מהמספר הקטן מוסיפים תווים של מאיות ועשיריות עד פעימה שלמה, ואז פעימות עד הגדול.', 'azaryahu2020', 'A', EXTRA],
    ],
    FRAC_MIXED: [
      ['dottedBeats', 'רבע מנוקד = 1 ו־1/2 פעימות: שלם ועוד חלק. נגנו ומנו — זה מספר מעורב.', 'azaryahu2020', 'D'],
      ['barsAndHalf', 'שיר של 2 ו־1/2 תיבות הוא 5 חצאי תיבה: ספרו חצאים — מעבר לשבר לא אמיתי וחזרה.', 'azaryahu2020', 'A'],
      ['fillBar', 'חיבור מספרים מעורבים: שלמים כתיבות מלאות, שברים כתווים — קודם התיבות, ואז מלאו את השארית.', 'azaryahu2020', 'D'],
    ],
    NUM_BIG: [
      ['periodAccentLevels', 'רמות ההדגשה בשלשות: יחידות, אלפים, מיליונים, ובכל שלשה אחד, עשר, מאה. נגנו מחלקה אחרי מחלקה; רמה שקטה — אפס.', 'das2023', 'A'],
      ['millionTenGroups', 'גם אחרי מיליון החוק זהה: עשר קבוצות ברמה הן קבוצה אחת ברמה הבאה. בהשוואה מתחילים ברמה הגבוהה ביותר.', 'das2023', 'A', EXTRA],
      ['tenAsOctave', 'השוואה: המקום הגבוה ביותר הוא הצליל הנמוך ביותר — הוא מכריע מי גדול; רק כשהוא שווה עוברים למקום הבא.', 'rusconi2005', 'A', WEAK],
    ],
    OPS_MILLION: [
      ['regroupAllLevels', 'חיבור וחיסור במאונך עד מיליון: כל רמה לבד מימין לשמאל; עשר ברמה — הדגשה ברמה שמעל, וכשחסר פורטים מלמעלה.', 'das2023', 'A'],
      ['repeatedBars', 'כפל כחזרה: מוטיב שחוזר — כמה פעימות בסך הכול? חילוק: כמה מוטיבים נכנסים, ומה נשאר?', 'das2023', 'A', EXTRA],
      ['roundBigAccent', 'אומדן: עגלו כל מספר להדגשה הקרובה, אלף או עשרת אלפים, חשבו עם ההדגשות והשוו לתוצאה המדויקת.', 'das2023', 'A', EXTRA],
    ],
    // #710: the two-bar balance of ד׳ (balanceBars, extending fillBar), now
    // with all four operations on each side.
    EQ_INEQ: [
      ['balanceBars', 'שני הצדדים מתנגנים יחד, כל אחד בתיבה משלו. אם התיבות נגמרות באותו רגע — סימן שוויון; אם אחת עוד נשמעת — היא הצד הגדול.', 'azaryahu2020', 'A', EQ_SIGN],
      ['fillBar', 'נעלם במשוואה הוא החלק השקט בתיבה: חשבו את הצד השלם, ומלאו את השקט בפעולה ההפוכה עד ששני הצדדים מתאזנים.', 'azaryahu2020', 'A', EQ_EXTRA],
      ['sameLength', 'חלוקה אחרת לאותו משך: כפל בצד אחד וחיבור בצד השני יכולים להימשך אותו זמן. מנו את שני המשפטים והשוו.', 'azaryahu2020', 'A', EQ_EXTRA],
    ],
    PRIME_FACTOR: [
      ['meterGroups', 'תיבה של 12 פעימות נחלקת ל־2, 3, 4 או 6 קבוצות שוות; תיבה של 7 — רק ל־1 ול־7. ראשוני = אין חלוקה.', 'das2023', 'A'],
      ['lcmDrums', 'תוף כל 2 פעימות, אחר כל 3, שלישי כל 5: מי מכה בפעימה 30? אלה הגורמים שלה — ומי לא.', 'rissman2005', 'R', WEAK],
      ['accentSkip', 'סימני התחלקות באוזן: הדגישו כל פעימה שלישית — מספר שנופל על הדגשה מתחלק ב־3.', 'das2023', 'A', EXTRA],
    ],
    FRAC_MODELS: [
      ['noteValues', 'תיבה של 4/4 היא השלם: רבע תו — 1/4 מהתיבה, שמינית — 1/8. ציירו את השבר כתווים.', 'courey2012', 'D'],
      ['scaleSteps', 'שבר על ישר המספרים כמו צליל בסולם: חלקו את הצעד בין 0 ל־1 לחלקים שווים ומצאו את המקום.', 'rusconi2005', 'A', WEAK],
      ['phraseShare', 'השבר כמנה: 3 תיבות ל־4 נגנים שווים — כל אחד מקבל 3/4 תיבה. חלקו ונגנו.', 'das2023', 'A', EXTRA],
    ],
    TRI_AREA: [
      ['areaScore', 'משולש הוא חצי מלבן: נגנו צליל לכל משבצת במלבן, ואז רק חצי — בסיס כפול גובה חלקי 2.', 'das2023', 'A'],
      ['polygonWalk', 'הגובה הוא הצעד המאונך מהקודקוד לבסיס: צעדו לפי תיפוף לאורך הבסיס, ואז פנו רבע סיבוב — זה הגובה.', 'moore2012', 'A', WEAK],
      ['anyBaseRows', 'בכל משולש אפשר לבחור צלע לבסיס: שורות כאורך הבסיס, שורה לכל צעד גובה, וחצי מהקבוצות. כל בחירה נותנת אותו שטח.', 'das2023', 'A', EXTRA],
    ],
    // #711: perimeter before the ו׳ circle (G6_CIRCLE_CALC, piBarsAround).
    // sidesFillBar extends fillBar: each side is a note as long as the side.
    PERIMETER: [
      ['sidesFillBar', 'הולכים מסביב לצורה צלע אחרי צלע: כל צלע היא תו באורך שלה, וכל התווים ממלאים יחד תיבה אחת ארוכה. חזרתם לנקודת ההתחלה? אורך התיבה הוא ההיקף.', 'azaryahu2020', 'A'],
      ['repeatedBars', 'צלעות שוות הן אותו תו שחוזר: בריבוע 4 פעמים, במשושה 6 פעמים. במלבן — שני תווים, כל אחד פעמיים.', 'das2023', 'A', EXTRA],
      ['perimeterWalk', 'הקיפו את הצורה בצעדים לפי תיפוף, צעד לכל ס״מ ופנייה בכל פינה — מספר הצעדים הוא ההיקף.', 'moore2012', 'A', WEAK],
    ],
    PARA_AREA: [
      ['areaScore', 'מקבילית היא מלבן שהוזז: חתכו משולש מצד אחד והצמידו לצד השני — נגנו את משבצות המלבן שנוצר.', 'das2023', 'A'],
      ['polygonWalk', 'צעדו על הבסיס לפי תיפוף, ואז פנו רבע סיבוב עד הצלע הנגדית — הצעדים המאונכים הם הגובה, לא הצלע.', 'moore2012', 'A', WEAK],
      ['shiftedRowGroups', 'במקבילית כל שורת משבצות זזה הצידה אבל נשארת באורך הבסיס: מספר השורות הוא הגובה, וקבוצה לכל שורה נותנת את השטח.', 'das2023', 'A', EXTRA],
    ],
    SOLIDS: [
      ['solidFaceMotif', 'גוף כדגם חוזר: במנסרה אותו בסיס פעמיים ופאות מלבניות שחוזרות כמספר צלעותיו; בפירמידה בסיס אחד וקודקוד מעליו.', 'azaryahuPatterns', 'A'],
      ['netFoldEcho', 'פריסה היא מוטיב שמתקפל: כל צלע בפריסה פוגשת צלע תואמת, כמו קריאה ותשובה. ספרו זוגות תואמים — אלה המקצועות.', 'azaryahuPatterns', 'A', EXTRA],
      ['prismPyramidMotif', 'הדגם חוזר בכל גוף: למנסרה עם בסיס של n צלעות יש n פאות צד ו־2 בסיסים; לפירמידה n פאות צד ובסיס אחד.', 'azaryahuPatterns', 'A', EXTRA],
    ],
    LCM: [
      ['accentSkip', 'שתי שורות: באחת הדגישו כל פעימה של המספר הראשון, בשנייה של השני. ההדגשה הראשונה המשותפת היא הכפולה המשותפת הקטנה ביותר.', 'das2023', 'A'],
      ['lcmDrums', 'שני תופים, כל אחד במחזור שלו: הפעימה הראשונה שבה הם מכים יחד היא הכפולה המשותפת הקטנה ביותר.', 'rissman2005', 'R', WEAK],
    ],
    FREQ: [
      ['tallyFives', 'שכיחות בקבוצות: סמנו כל הופעה בפעימה וקבצו בחמישיות מודגשות. הערך עם הכי הרבה פעימות הוא השכיח.', 'das2023', 'A'],
      ['frequencyGroupsCompare', 'השוו שכיחויות כקבוצות פעימות: הקבוצה הגדולה היא השכיח, וקבוצה מתוך כל הפעימות היא החלק מהכלל.', 'das2023', 'A', EXTRA],
      ['allGroupsSum', 'סכום השכיחויות: נגנו את כל הקבוצות ברצף, הדגשה בראש כל קבוצה, וחברו את גודליהן — כל המשתתפים.', 'das2023', 'A', EXTRA],
    ],
    PICTOGRAM: [
      ['symbolKeyGroups', 'כל סמל הוא קבוצה בגודל המפתח, וחצי סמל — חצי קבוצה. קראו שורה בקפיצות של המפתח.', 'das2023', 'A'],
      ['keyJumpRow', 'מפתח גדול כמו 10 או 20: כל סמל הוא הדגשה של קבוצה שלמה. ספרו הדגשות בקפיצות, ואז הוסיפו חצאים.', 'das2023', 'A', EXTRA],
      ['twoRowsGroups', 'שתי שורות יחד: נגנו את הקבוצות של שתיהן ברצף וספרו בקפיצות של המפתח — זה הסכום.', 'das2023', 'A', EXTRA],
    ],
    PIE: [
      ['pieBarParts', 'העוגה היא תיבה וכל גזרה תו, כמו בד׳ — עכשיו גם שמיניות ושלישים. קראו כל גזרה כחלק מהתיבה וכתבו שבר.', 'azaryahu2020', 'A'],
      ['twoSectorNotes', 'שתי גזרות יחד הן שני תווים ברצף באותה תיבה: חברו את החלקים כמו חיבור שברים בתיבה.', 'azaryahu2020', 'A', EXTRA],
      ['phraseShare', 'שתי גזרות יחד: חברו את חלקיהן מתוך כל העוגה — כמו שני נגנים שמנגנים ברצף מתוך כל הפעימות.', 'das2023', 'A', EXTRA],
    ],
  };

  return { grade: 'ה', ST: {}, items: [], music: music, sources: sources };
});
