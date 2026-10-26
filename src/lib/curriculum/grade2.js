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
  // Dosage rules (#591, owner 23.10 15:54): the ways an item is solved with
  // share one strongly evidenced mechanism (M1, M2, M3, M6). A way ending in
  // EXTRA is optional extra practice; WEAK marks M4/M5/M7 (weak evidence),
  // which are never primary. banks.js gives the item a primary way.
  const EXTRA = Object.freeze({ optional: true });
  const WEAK = Object.freeze({ optional: true, evidence: 'weak' });
  const music = {
    EQ_LEFT: [
      ['sameLength', 'שני משפטי תיפוף נמשכים אותו זמן גם אם מחולקים אחרת: 3 ו־4 מול 5 ו־2. סימן השוויון אומר «אותו אורך».', 'azaryahu2020', 'A', EXTRA],
      // Same restored balanceBars as grade א׳ (855a184, #595): the one primary way (#751).
      ['balanceBars', 'סימן השוויון אומר: שני הצדדים נמשכים אותו זמן. נגנו את הצד השני והשלימו נקישות עד שהם שווים.', 'azaryahu2020', 'A'],
    ],
    MULTIADD: [
      ['callResponse', 'שלושה כלים זה אחרי זה: תוף, שייקר, פעמון. ספרו את כל הפעימות — וחברו קודם זוג שנותן 10.', 'mcdonel2015', 'A', EXTRA],
      ['fillBar', 'תיבה אחת, כמה תווים: חברו את האורכים בכל סדר — התיבה נשארת שלמה. חפשו את הזוג שמשלים לעשר.', 'azaryahu2020', 'A', EXTRA],
      ['tenThenMore', 'שלושה מחוברים: נגנו קודם את השניים שמשלימים לעשר — תוף עד עשר — ואז את השלישי בשייקר.', 'das2023', 'A'],
    ],
    TENS: [
      ['tensSequence', 'סדרת עשרות היא דגם: 20, 30, 40… נגנו אותה כמשפט שעולה בצעד קבוע. בחיבור ממשיכים את הדגם קדימה, בחיסור — אחורה.', 'azaryahuPatterns', 'A', EXTRA],
      ['tenAsOctave', 'קפיצה של עשר היא אוקטבה: כל קפיצה — צליל, וסופרים קפיצות קדימה או אחורה.', 'rusconi2005', 'A', WEAK],
      ['tensAccentJumps', 'כל הדגשה היא עשר פעימות. חיבור עשרות מוסיף הדגשות, חיסור מוריד אותן. ספרו את ההדגשות בקפיצות של עשר.', 'das2023', 'A'],
    ],
    ADD20: [
      ['callResponse', 'קריאה ותשובה: משפט של פעימות ומשפט תשובה. מחברים את שני המשפטים — מהגדול מוסיפים את הקטן.', 'mcdonel2015', 'A'],
      ['tenThenMore', 'נגנו עד 10 בתוף, והמשיכו בשייקר: קודם משלימים לעשר, ואז מוסיפים את השאר.', 'das2023', 'A', EXTRA],
    ],
    MUL_B: [
      ['repeatedBars', 'מוטיב של 2 פעימות שחוזר 5 פעמים: 10 פעימות — כפל כחזרה של משפט. נגנו וספרו.', 'das2023', 'A'],
      ['accentSkip', 'הדגישו כל פעימה חמישית ואמרו רק את המודגשות: 5, 10, 15 — כפולות 5 באוזן.', 'das2023', 'A', EXTRA],
      ['lcmDrums', 'תוף כל 2 פעימות ואחר כל 4: מתי נפגשים? כפולות של 2 ושל 4 — ולמה כל כפולה של 4 היא גם של 2.', 'rissman2005', 'R', WEAK],
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
    WORD_COLLECT: [
      ['callResponse', 'כל קבוצה בסיפור היא משפט פעימות. נגנו את שתי הקבוצות ברצף וספרו הכול יחד.', 'mcdonel2015', 'A'],
      ['twoDrums', 'קבוצה אחת בתוף, השנייה בשייקר. מנגנים זו אחרי זו — כמה צלילים בסך הכול?', 'mcdonel2015', 'A'],
      ['fillBar', 'כתבו את הסיפור כתיבה: החלק הראשון, החלק השני, והשלם. ואז את התרגיל שמתאים.', 'azaryahu2020', 'A', EXTRA],
    ],
    WORD_REMOVE: [
      ['takeAwayBeats', 'הקבוצה כולה — משפט פעימות. מה שהלך — פעימות שהופכות לשקט. כמה צלילים נשארו?', 'mcdonel2015', 'A'],
      ['twoDrums', 'הכול בתוף; מה שיוצא מהקבוצה עובר לשייקר. ספרו רק את התופים שנשארו.', 'mcdonel2015', 'A'],
      ['fillBar', 'כתבו את הסיפור כתיבה: השלם, מה שהוסר, ומה שנשאר — ואז את תרגיל החיסור.', 'azaryahu2020', 'A', EXTRA],
    ],
    WORD_COMPARE: [
      ['twoDrums', 'קבוצה אחת בתוף וקבוצה שנייה בשייקר, פעימה מול פעימה. כשכלי אחד משתתק — כמה פעימות המשיך השני לבד?', 'mcdonel2015', 'A'],
      ['sameLength', 'שני משפטים באורכים שונים: השלימו את הקצר עד שיהיה כמו הארוך — ההשלמה היא ההפרש.', 'azaryahu2020', 'A', EXTRA],
      ['fillBar', 'כתבו את ההשוואה כשתי תיבות זו מעל זו: הארוכה, הקצרה, והחלק שבולט — זה ההפרש ותרגיל החיסור.', 'azaryahu2020', 'A', EXTRA],
    ],
    ADD2D: [
      ['tenThenMore', 'חיבור דו־ספרתי: תופים לעשרות, שייקר ליחידות. חברו תופים עם תופים, שייקרים עם שייקרים.', 'das2023', 'A'],
      ['addWalkLine', 'ישר מספרים על הרצפה: מהמספר הראשון קופצים קפיצות גדולות לעשרות, במחיאה, ואז צעדים קטנים ליחידות. איפה שנחתתם — הסכום.', 'moore2012', 'A', WEAK],
      ['fillBar', 'השלמה לעשרת העגולה: מהמספר הראשון נגנו עד העשרת הקרובה, ואז את השאר — שני צעדים.', 'azaryahu2020', 'A', EXTRA],
    ],
    SUB2D: [
      ['takeAwayBeats', 'חיסור דו־ספרתי: השתיקו תופים (עשרות) ושייקרים (יחידות) — מה שנשאר נשמע הוא ההפרש.', 'mcdonel2015', 'A', EXTRA],
      ['subWalkBack', 'על ישר המספרים שעל הרצפה הולכים אחורה: קפיצות גדולות לעשרות, ואז צעדים ליחידות. אם צריך, צעד עד העשרת העגולה וממשיכים.', 'moore2012', 'A', WEAK],
      ['tensBarsBack', 'חיסור בתיבות של עשר: מורידים תיבות שלמות לעשרות ופעימות בודדות ליחידות. חסרות פעימות? פותחים תיבה לעשר פעימות.', 'das2023', 'A'],
    ],
    VERT_ADD: [
      ['columnPlayers', 'שני נגנים: אחד מנגן רק יחידות, השני רק עשרות, כל אחד בתיבה שלו. כותבים במאונך כך שכל נגן בעמודה שלו, ומחברים כל תיבה לחוד.', 'das2023', 'A'],
      ['carryNote', 'עשר פעימות קצרות של יחידות ממלאות תו ארוך אחד של עשרת. במאונך: כשהיחידות מילאו תו ארוך, כותבים אותו כ־1 קטן מעל העשרות.', 'azaryahu2020', 'A', EXTRA],
      ['callResponse', 'בדיקה: נגנו את שני המחוברים כקריאה ותשובה, וספרו — האם הסכום במאונך מתאים?', 'mcdonel2015', 'A', EXTRA],
    ],
    VERT_SUB: [
      ['columnSilence', 'בכל עמודה מנגנים את המספר העליון בקבוצות ומשתיקים את התחתון: קודם יחידות, אחר כך עשרות. לא מספיק ביחידות? פורטים תיבה של עשר.', 'das2023', 'A'],
      ['subColumnSteps', 'שני ילדים צועדים אחורה: אחד בעמודת היחידות, אחד בעשרות, כל אחד כמה שמחסרים אצלו. ילד היחידות שנתקע מקבל עשרה צעדים מהעשרות.', 'moore2012', 'A', WEAK],
      ['fillBar', 'בדיקה בהשלמה: מהתוצאה נגנו פעימות עד המספר הגדול — האם הגעתם בדיוק למה שחיסרתם?', 'azaryahu2020', 'A', EXTRA],
    ],
    PLACE_VALUE: [
      ['threeNoteLengths', 'שלושה אורכי תווים: ארוך מאוד = מאה, ארוך = עשר, קצר = אחד. נגנו מספר כרצף ופענחו כמה מכל אורך; אין תו מסוג מסוים — ספרה 0.', 'azaryahu2020', 'A', EXTRA],
      ['digitMotif', 'השוואת מספרים כמו השוואת שני מוטיבים: קודם התו הראשון, המאות; רק אם הוא שווה עוברים לבא אחריו. מצאו איפה המוטיבים נפרדים.', 'azaryahuPatterns', 'A', EXTRA],
      ['tenExchange', 'ספרו פעמונים אחד־אחד: כל 10 פעמונים הופכים לתוף אחד. התופים הם העשרות, והפעמונים שנשארו הם היחידות.', 'das2023', 'A'],
    ],
    EVEN_ODD: [
      ['alternateDrums', 'זוגי או אי־זוגי: חלקו את הנקישות לשני תופים לסירוגין — אם נגמר שווה, זוגי; נשארה אחת — אי־זוגי.', 'das2023', 'A'],
      ['stickingParity', 'ימין ושמאל לסירוגין: מספר זוגי נגמר ביד השנייה, ואי־זוגי נשאר ביד הראשונה.', 'das2023', 'A', EXTRA],
    ],
    GEO_SORT: [
      ['sideCountMotif', 'לכל צורה מוטיב שחוזר, תו לכל צלע. סדרו את המוטיבים מהקצר לארוך — זה גם סדר הצורות לפי מספר הצלעות.', 'azaryahuPatterns', 'A'],
      ['edgeSteps', 'צעד לכל צלע ופעמון בכל קודקוד: למשולש 3 ו־3, לריבוע 4 ו־4 — תמיד אותו מספר צלעות וקודקודים.', 'moore2012', 'A', WEAK],
      ['cornerAccents', 'מחיאה לכל צלע והדגשה בכל פינה, והצורה כולה היא תיבה אחת. משקל של 3 — משולש, של 4 — מרובע: מיינו לפי מספר הפעימות בתיבה.', 'das2023', 'A', EXTRA],
    ],
    RIGHT_ANGLE: [
      ['musicalTurns', 'צעדו לפי התיפוף: ישר, פנייה של רבע סיבוב, ישר. פנייה כזו היא זווית ישרה — כמו פינת דף.', 'shoval2011', 'A', WEAK],
      ['foldCorner', 'מקפלים דף פעמיים, קפל על קפל, בשתי מחיאות: הפינה שנוצרת היא זווית ישרה. מצמידים אותה לפינות בכיתה — שווה, צרה יותר או רחבה יותר?', 'azaryahuPatterns', 'A', EXTRA],
      ['quarterBarCorner', 'פינה ישרה היא רבע סיבוב, כמו רבע תיבה: ארבע פינות כאלה סוגרות סיבוב שלם, תיבה שלמה. בדקו פינה — רבע בדיוק?', 'azaryahu2020', 'A'],
    ],
    LENGTH: [
      ['zeroStartSteps', 'צועדים על קו מסומן בס״מ, פעימה לכל ס״מ, ומתחילים מ־0 ולא מ־1. מספר הפעימות הוא האורך; התחלה מ־1 מוסיפה פעימה מיותרת.', 'moore2012', 'A', WEAK],
      ['clipThrees', 'כל אטב ארוך 3 ס״מ, אז מחיאה על אטב היא קבוצה של שלוש פעימות. מדדו באטבים וספרו בקפיצות של 3 — זה האורך בס״מ.', 'das2023', 'A', EXTRA],
      ['startTogether', 'שני חפצים הם שני תווים שמתחילים יחד, פעימה לכל ס״מ. כשהקצר נגמר הארוך ממשיך לבד — הפעימות הנוספות הן בכמה ס״מ הוא ארוך יותר.', 'azaryahu2020', 'A'],
    ],
    CLOCK: [
      ['hourCycle', 'השעות הן דגם מעגלי: אחרי 12 חוזרים ל־1, כמו פזמון שחוזר. שירו את השעות ברצף ובדקו: 3 שעות אחרי 11 — לאן מגיעים?', 'azaryahuPatterns', 'A', EXTRA],
      ['handTurnBody', 'היד שלכם היא המחוג הקטן: מסובבים אותה פעימה לכל שעה מ־12 עד השעה, רק בכיוון השעון. רבע סיבוב הוא 3 שעות.', 'smith2014', 'A', WEAK],
      ['hourGroupsThree', 'מחלקים את 12 השעות לארבע קבוצות של 3, עם הדגשה על 12, 3, 6 ו־9. כמה שעות עברו: הדגשות כפול 3, ועוד הפעימות שאחריהן.', 'das2023', 'A'],
    ],
    HALF_HOUR: [
      ['fiveMinuteClaps', 'המחוג הגדול עובר בשעה 12 קבוצות של 5 דקות. מחיאה לכל קבוצה: אחרי 6 מחיאות הוא על ה־6 — עברה חצי שעה, «וחצי».', 'das2023', 'A', EXTRA],
      ['fillBar', 'שעה היא תיבה: חצי שעה ממלאת חצי תיבה. שני חצאים — תיבה שלמה, שעה שלמה.', 'azaryahu2020', 'A'],
      ['halfTurnBody', 'עומדים עם הפנים ל־12 ומסתובבים חצי סיבוב בשמונה פעימות עד שהפנים ל־6: זה המחוג הגדול ב«וחצי». המחוג הקטן אז בין שתי שעות.', 'smith2014', 'A', WEAK],
    ],
    PERIMETER: [
      ['perimeterWalk', 'הקיפו את הצורה לפי פעימה: נקישה לכל ס״מ וצליל אחר בכל פינה — מספר הנקישות הוא ההיקף.', 'moore2012', 'A', WEAK],
      ['sideNotes', 'כל צלע היא תו שאורכו כאורך הצלע בס״מ. נגנו את התווים ברצף סביב הצורה: אורך כל המנגינה בפעימות הוא ההיקף.', 'azaryahu2020', 'A'],
      ['repeatedBars', 'ריבוע: אותו משפט חוזר 4 פעמים — היקף הוא 4 פעמים הצלע. מלבן: שני משפטים, כל אחד פעמיים.', 'das2023', 'A', EXTRA],
    ],
    MONEY: [
      ['agoraSkip', 'מטבע של 10 אגורות — מחיאה וספירה בקפיצות של 10; מטבע של 50 — מחיאה מודגשת. 100 אגורות הן שקל: עשר מחיאות או שתי מודגשות.', 'das2023', 'A'],
      ['takeAwayBeats', 'עודף: נגנו את מה ששילמתם, השתיקו את המחיר — מה שנשאר נשמע הוא העודף.', 'mcdonel2015', 'A', EXTRA],
      ['fillBar', 'עודף כהשלמה: מהמחיר נגנו פעימות עד הסכום ששולם וספרו — גם באגורות.', 'azaryahu2020', 'A', EXTRA],
    ],
    MASS_VOL: [
      ['layerBars', 'כל שכבת קוביות היא קבוצת פעימות, פעימה לכל קובייה והדגשה בראש כל שכבה. ספרו בקפיצות של שכבה עד הסוף.', 'das2023', 'A'],
      ['gramGroups', 'ק״ג הוא 1,000 גרם, עשר קבוצות של 100. מחיאה לכל 100 גרם והדגשה כל עשר מחיאות — כל הדגשה היא ק״ג שלם.', 'das2023', 'A'],
      ['cubeRowPattern', 'שכבת קוביות היא דגם שחוזר: שורה, שורה, שורה. בונים שכבה, ואז חוזרים על אותו דגם לשכבה הבאה — מוסיפים שכבה שלמה בכל פעם.', 'azaryahuPatterns', 'A', EXTRA],
    ],
    PICTOGRAM: [
      ['keyFives', 'כשסמל שווה 5, כל סמל הוא חמש פעימות עם הדגשה בראשן. נגנו שורה וספרו בקפיצות של 5, ועוד חצי סמל אם יש.', 'das2023', 'A'],
      ['halfSymbolNote', 'חצי סמל הוא חצי תו: אם סמל שלם נמשך 2 פעימות, חצי סמל נמשך פעימה אחת. נגנו שורה שנגמרת בחצי סמל וספרו.', 'azaryahu2020', 'A', EXTRA],
      ['rowStepsCompare', 'שני ילדים צועדים, כל אחד לפי שורה אחרת, צעד לכל סמל בקצב משותף. מי שעוצר ראשון — השורה הקטנה; הצעדים של השני לבד — ההפרש.', 'moore2012', 'A', WEAK],
    ],
    BARCHART: [
      ['scaleTwos', 'כשכל משבצת בדיאגרמה שווה 2, כל משבצת היא קבוצה של שתי פעימות. נגנו עמודה בקבוצות וספרו בקפיצות של 2 עד ראשה.', 'das2023', 'A', EXTRA],
      ['barSumBar', 'כל העמודות יחד ממלאות תיבה אחת ארוכה: נגנו את כולן ברצף. אורך התיבה הוא סך כל הנתונים, וכל עמודה היא חלק ממנה.', 'azaryahu2020', 'A'],
      ['barTowerSteps', 'כל עמודה היא מגדל מדרגות: עולים צעד בכל פעימה מהבסיס עד הראש, וקוראים את המספר בקו שמשמאל. כך לא מתבלבלים בשורה.', 'moore2012', 'A', WEAK],
    ],
    TABLE: [
      ['tableRowGroups', 'כל שורה בטבלה היא כלי וכל מספר בה הוא קבוצת פעימות. נגנו את הקבוצות של שורה ברצף: סכום השורה הוא כל הפעימות.', 'das2023', 'A'],
      ['tableCellNotes', 'כל תא בטבלה הוא תו שאורכו כמספר שבו. משווים שני תאים כמו שני תווים: איזה נמשך יותר, ובכמה פעימות?', 'azaryahu2020', 'A', EXTRA],
      ['tableRowPattern', 'קראו שורה בטבלה כמו דגם: האם המספרים עולים בקביעות? אם בכל יום נוספות 2 פעימות — מה יהיה ביום הבא? ממשיכים את הדגם.', 'azaryahuPatterns', 'A', EXTRA],
    ],
    POLY_DECOMP: [
      ['splitWalk', 'הולכים בקצב סביב הצורה, ואז לאורך קו החיתוך: כל חלק הוא מסלול סגור משלו. סופרים צלעות בכל מסלול ובודקים שהחלקים מכסים הכול.', 'moore2012', 'A', WEAK],
      ['piecesFillBar', 'הצורה היא תיבה וכל חלק הוא תו. בונים צורה חדשה מכל החלקים: התווים מסודרים אחרת, אבל אורך התיבה — השטח — לא השתנה.', 'azaryahu2020', 'A'],
      ['mirrorPattern', 'גזרו לאורך קו וצרו שני חלקים: נגנו את המקצב של כל חלק. חלקים זהים נשמעים אותו דבר.', 'azaryahuPatterns', 'A', EXTRA],
    ],
    MONEY_BILLS: [
      ['billBars', 'שטר של 20 הוא שתי תיבות של 10, שטר של 50 — חמש. הדגשה לכל עשר: סופרים את השטרות בעשרות, ואז מוסיפים את המטבעות.', 'das2023', 'A'],
      ['callResponse', 'שטרות ואז מטבעות — קריאה ותשובה: חברו קודם את השטרות, ואז הוסיפו את המטבעות.', 'mcdonel2015', 'A', EXTRA],
      ['fillBar', 'עודף בשקלים: מהמחיר נגנו פעימות עד הסכום ששולם וספרו כמה הוספתם.', 'azaryahu2020', 'A', EXTRA],
    ],
  };

  return { grade: 'ב', ST: {}, items: [], music: music, sources: sources };
});
