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
  // Dosage rules (#591, owner 23.10 15:54): the ways an item is solved with
  // share one strongly evidenced mechanism (M1, M2, M3, M6). A way ending in
  // EXTRA is optional extra practice; WEAK marks M4/M5/M7 (weak evidence),
  // which are never primary. banks.js gives the item a primary way.
  const EXTRA = Object.freeze({ optional: true });
  const WEAK = Object.freeze({ optional: true, evidence: 'weak' });
  const music = {
    MUL_C: [
      ['repeatedBars', 'מוטיב של 3 פעימות שחוזר 4 פעמים: 12 פעימות — כפל כחזרה של משפט. נגנו וספרו.', 'das2023', 'A'],
      ['accentSkip', 'הדגישו כל פעימה רביעית ואמרו רק את המודגשות: 4, 8, 12… — לוח הכפל של 4 באוזן.', 'das2023', 'A'],
      ['lcmDrums', 'תוף כל 3 פעימות ואחר כל 4: נפגשים ב־12 — אותה מכפלה משני כיוונים, חוק החילוף שנשמע.', 'rissman2005', 'R', WEAK],
    ],
    DIV_PART: [
      ['phraseShare', 'חלקו 12 פעימות ל־4 נגנים שווים: כמה פעימות לכל אחד? חילוק לחלקים.', 'das2023', 'A'],
      ['repeatedBars', 'חילוק הוא כפל הפוך: כמה פעימות במוטיב אם 4 חזרות שלו הן 12 פעימות?', 'das2023', 'A'],
    ],
    DIV_QUOT: [
      ['phraseShare', 'כמה משפטים של 3 פעימות נכנסים ב־12 פעימות? נגנו וספרו משפטים — חילוק להכלה.', 'das2023', 'A'],
      ['repeatedBars', 'מוטיב ידוע, אורך כולל ידוע: כמה חזרות? ספרו חזרות — זו המנה.', 'das2023', 'A'],
      ['twoDivisions', 'שני סוגי חילוק באותן פעימות: לחלק ל־3 נגנים (כמה לכל אחד) מול משפטים של 3 (כמה משפטים). נגנו את שניהם.', 'das2023', 'A'],
    ],
    ANGLE_KINDS: [
      ['turnAsBar', 'סיבוב שלם הוא תיבה של ארבעה רבעים: רבע תיבה — ישרה, חצי תיבה — שטוחה. פחות מרבע — חדה, בין רבע לחצי — קהה.', 'azaryahu2020', 'A'],
      ['musicalTurns', 'צעדו לפי תיפוף: ישר, פנייה, ישר. פנייה של רבע סיבוב — ישרה; פחות — חדה; יותר — קהה. ציירו את המסלול.', 'shoval2011', 'A', WEAK],
      ['polygonTurns', 'הקיפו מצולע לפי פעימה ופעמון בכל פנייה: בריבוע כל פנייה ישרה; במשולש — חדה. שמעו וספרו.', 'smith2014', 'A', WEAK],
    ],
    TRI_SORT: [
      ['triangleMotif', 'משולש הוא מוטיב של שלושה תווים, תו לכל צלע: שלושה זהים — שווה־צלעות; שניים זהים — שווה־שוקיים; כולם שונים — שונה־צלעות.', 'azaryahuPatterns', 'A'],
      ['polygonTurns', 'צעדו על המשולש ופעמון בכל פנייה: פנייה ישרה — משולש ישר־זווית; פנייה רחבה — קהה; שלוש קטנות — חד.', 'smith2014', 'A', WEAK],
      ['mirrorTriangle', 'קפלו את המשולש על ציר ונגנו כל חצי כמוטיב: חצאים זהים כמו מנגינת ראי — יש שתי צלעות שוות ושתי זוויות שוות.', 'azaryahuPatterns', 'A'],
    ],
    MINUTES: [
      ['hourTwelveGroups', 'שעה היא 12 קבוצות של 5 דקות, הדגשה בראש כל קבוצה. ספרו הדגשות בקפיצות של 5 — רבע שעה הוא 3 קבוצות.', 'das2023', 'A'],
      ['fiveMinuteAccents', 'משך זמן: מהזמן הראשון לשני ספרו קבוצות מודגשות של 5 דקות, ואז הוסיפו את הדקות הבודדות שאחרי ההדגשה האחרונה.', 'das2023', 'A'],
      ['roundHourJump', 'משך בשתי קפיצות: קבוצות של 5 דקות עד השעה העגולה, ואז שעות שלמות כקבוצות של 60 דקות. חברו את הקפיצות.', 'das2023', 'A'],
    ],
    AREA: [
      ['areaScore', 'צליל אחד לכל משבצת: נגנו 3 שורות של 4 — ואז 4 עמודות של 3. שתיהן 12 משבצות.', 'das2023', 'A'],
      ['repeatedBars', 'שורה היא מוטיב: מוטיב של 4 צלילים שחוזר 3 פעמים — השטח הוא מספר הצלילים.', 'das2023', 'A'],
      ['perimeterWalk', 'שטח מול היקף: נגנו את המשבצות שבפנים, ואז הקיפו את הצורה בצעדים — שני מספרים שונים.', 'moore2012', 'A', WEAK],
    ],
    MONEY: [
      ['agorotTenGroups', 'שקל הוא 10 קבוצות של 10 אגורות: מחיאה לכל 10 אגורות והדגשה בכל עשירית — כל הדגשה היא שקל. ספרו הדגשות ומחיאות.', 'das2023', 'A'],
      ['takeAwayBeats', 'עודף: נגנו את מה ששילמתם, השתיקו את המחיר — מה שנשאר נשמע הוא העודף.', 'mcdonel2015', 'A', EXTRA],
      ['fillBar', 'עודף כהשלמה: מהמחיר נגנו פעימות עד הסכום ששולם וספרו — גם באגורות.', 'azaryahu2020', 'A', EXTRA],
    ],
    MASS_VOL: [
      ['kiloGroupsTen', 'ק״ג הוא 10 קבוצות של 100 גרם, וליטר — 10 קבוצות של 100 מ״ל. מחיאה לכל 100 והדגשה כל עשר: כל הדגשה היא ק״ג או ליטר.', 'das2023', 'A'],
      ['halfKiloAccents', 'חצי ק״ג הוא חצי מהקבוצות: 5 קבוצות של 100 גרם מתוך 10. ספרו קבוצות עד ההדגשה, וכך גם חצי ליטר במ״ל.', 'das2023', 'A'],
      ['cubeLayerGroups', 'נפח תיבה: כל שכבה היא קבוצת פעימות, פעימה לכל קובייה. כמה שכבות — כמה קבוצות; ספרו בקפיצות של שכבה.', 'das2023', 'A'],
    ],
    PICTOGRAM: [
      ['keyAccentGroups', 'כל סמל הוא קבוצת פעימות בגודל המפתח, הדגשה בראש כל קבוצה. נגנו שורה וספרו בקפיצות של המפתח.', 'das2023', 'A'],
      ['halfSymbolGroup', 'חצי סמל הוא חצי קבוצה: כשהמפתח 2, חצי סמל הוא פעימה אחת. ספרו את הקבוצות השלמות בקפיצות ואז הוסיפו את החצי.', 'das2023', 'A'],
      ['rowGroupsCompare', 'השוו שתי שורות קבוצה מול קבוצה: נגנו את שתיהן יחד. הקבוצות שנשארות לבד, כפול המפתח, הן ההפרש.', 'das2023', 'A'],
    ],
    BARCHART: [
      ['columnNoteLength', 'כל עמודה היא תו שנמשך כמספר המשבצות שלה. נגנו את העמודות: התו הארוך ביותר הוא הכלי שנבחר הכי הרבה.', 'azaryahu2020', 'A'],
      ['twoNotesDifference', 'נגנו שתי עמודות כשני תווים שמתחילים יחד: הארוך ממשיך לבד אחרי שהקצר נגמר. משך ההמשך הוא ההפרש.', 'azaryahu2020', 'A'],
      ['notesInARow', 'נגנו את כל העמודות כתווים ברצף: אורך המנגינה כולה הוא סכום העמודות — כל מי שהשתתף בסקר.', 'azaryahu2020', 'A'],
    ],
    TABLE: [
      ['cellGroups', 'כל מספר בטבלה הוא קבוצת פעימות שהדגשה פותחת. קראו תא — כמה פעימות בקבוצה שלו — והשוו תאים קבוצה מול קבוצה.', 'das2023', 'A'],
      ['tableGroupsSum', 'סכום הטבלה: נגנו את הקבוצות של כל השורות ברצף, הדגשה בראש כל קבוצה, וחברו את גודלי הקבוצות.', 'das2023', 'A'],
    ],
    DATA_ORGANIZE: [
      ['cellGroups', 'כל פריט ברשימה מצטרף לקבוצת הפעימות של הכלי שלו: הדגשה פותחת כל קבוצה בטבלה, וסופרים פעימות בקבוצה.', 'das2023', 'A'],
      ['keyAccentGroups', 'סימני ספירה בקבוצות של 5 פעימות: הדגשה בראש כל חמישייה, ואז הפעימות הבודדות שאחרי החמישייה האחרונה.', 'das2023', 'A'],
      ['rowGroupsCompare', 'ארגנו כל כלי לקבוצת פעימות בטבלה והשוו שתי קבוצות: הפעימות שנשארות לבד הן ההפרש.', 'das2023', 'A'],
    ],
    DIV_REM: [
      ['phraseShare', 'חלקו 14 פעימות למשפטים של 4: שלושה משפטים מלאים ו־2 פעימות שנשארות — זו השארית.', 'das2023', 'A'],
      // The ג׳ PDF has no fractions; it writes a remainder as «שארית 1 מתוך 4»
      // as preparation for them (division with remainder, read 23.10.2026).
      ['fillBar', 'תיבות של 4 פעימות: מלאו תיבות שלמות; מה שלא ממלא תיבה הוא השארית — «2 מתוך 4» פעימות של התיבה הבאה.', 'azaryahu2020', 'A', EXTRA],
      ['repeatedBars', 'בדיקה: מספר התיבות כפול הפעימות בתיבה, ועוד השארית — חייב לחזור למספר שחילקתם.', 'das2023', 'A'],
    ],
    TIMES_MORE: [
      ['phraseFits', 'תוף אחד מכה 3 פעמים, השני 12: כמה פעמים נכנס המשפט הקצר בארוך? פי כמה.', 'das2023', 'A'],
      ['repeatedBars', '«פי 4» הוא המשפט שחוזר 4 פעמים: נגנו את הקצר, ואז את הארוך — ספרו חזרות.', 'das2023', 'A'],
      ['phraseShare', 'ההבדל בין «פי» ל«יותר ב»: פי 3 — המשפט חוזר 3 פעמים; יותר ב־3 — מוסיפים 3 פעימות. נגנו את שניהם.', 'das2023', 'A'],
    ],
    NUM10K: [
      ['thousandAccents', 'ארבע רמות הדגשה: חזקה מאוד לאלף, חזקה למאה, בינונית לעשר, רגילה לאחד. נגנו מספר מהחזקה לחלשה וספרו כל רמה.', 'das2023', 'A'],
      ['tenGroupsUp', 'עשר פעימות הן קבוצה של עשר, עשר קבוצות — מאה, ועשר מאות — אלף. בכל פעם שמגיעים לעשר מקבצים לרמה הבאה.', 'das2023', 'A'],
      ['tenAsOctave', 'השוואה: הכלי הגדול ביותר (הצליל הנמוך) מכריע מי גדול; רק כשהוא שווה עוברים לכלי הבא.', 'rusconi2005', 'A', WEAK],
    ],
    TIME_MIN_SEC: [
      ['minuteGroups', 'דקה היא קבוצה של 60 שניות, הדגשה בראש כל קבוצה. קבוצות שלמות הן הדקות, והשניות שאחרי ההדגשה האחרונה נשארות שניות.', 'das2023', 'A'],
      ['quarterMinuteGroups', 'דקה היא 4 קבוצות של 15 שניות: הדגישו כל 15 וספרו בקפיצות — 15, 30, 45, 60.', 'das2023', 'A'],
      ['minuteAndRest', 'משניות לדקות: כמה קבוצות שלמות של 60 נכנסות, ומה נשאר מחוץ לקבוצה — כמו שארית בחילוק.', 'das2023', 'A'],
    ],
    ADD_SUB_10K: [
      ['carryAccentUp', 'חיבור במאונך ברמות הדגשה: מחברים כל רמה לבד מימין לשמאל; עשר פעימות באותה רמה הופכות להדגשה אחת ברמה שמעליה.', 'das2023', 'A'],
      ['borrowGroupDown', 'פריטה בחיסור: כשחסרות פעימות ברמה, פותחים הדגשה אחת מהרמה שמעל לעשר פעימות, ורק אז מורידים.', 'das2023', 'A'],
      ['roundToAccent', 'אומדן: עגלו כל מספר להדגשה הקרובה של מאה, חברו את ההדגשות והשוו לתוצאה המדויקת.', 'das2023', 'A'],
    ],
    MUL_DIV_10: [
      ['tenAsOctave', 'כפל ב־10 הוא קפיצת אוקטבה: כל ספרה עולה מקום אחד. שמעו את הקפיצה וכתבו את המספר.', 'rusconi2005', 'A', WEAK],
      ['hundredTwoSteps', 'כפול 100 הוא שני קיבוצים של עשר: כל פעימה הופכת לקבוצה של מאה. חילוק ב־10 או ב־100 מפרק את הקבוצות חזרה.', 'das2023', 'A'],
      ['tenfoldGroups', 'כפול 10: כל פעימה הופכת לקבוצה של עשר, ולכן כל ספרה עולה רמת הדגשה אחת ונכנס 0 ביחידות.', 'das2023', 'A'],
    ],
    WORD_TWO_STEP: [
      ['groupsThenMore', 'השלב הראשון הוא קבוצות פעימות — כמה קבוצות וכמה בכל אחת; לתוצאה מוסיפים או ממנה מורידים פעימות בשלב השני.', 'das2023', 'A'],
      ['callResponse', 'קריאה ותשובה: השלב הראשון הוא הקריאה, תוצאתו נכנסת לתשובה. נגנו את שניהם ברצף.', 'mcdonel2015', 'A', EXTRA],
      ['groupsTakeAway', 'עודף בשני שלבים: נגנו את המחיר כקבוצות שוות, קבוצה לכל פריט, ואז השתיקו את כל הקבוצות מתוך הסכום ששולם.', 'das2023', 'A'],
    ],
  };

  return { grade: 'ג', ST: {}, items: [], music: music, sources: sources };
});
