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
// Nothing here claims more than its label. Azaryahu 2020 evaluated MusiMath
// on fractions, so in grade א׳ (no fractions) every way citing it is A. Items
// whose prompt already plays sound (counted beats, the g1 widgets) are music
// activities and take no way.
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
  // Dosage rules (#591, owner 23.10 15:54): the ways an item is solved with
  // share one strongly evidenced mechanism (M1, M2, M3, M6). A way ending in
  // EXTRA is optional extra practice; WEAK marks M4/M5/M7 (weak evidence),
  // which are never primary. banks.js gives the item a primary way.
  const EXTRA = Object.freeze({ optional: true });
  const WEAK = Object.freeze({ optional: true, evidence: 'weak' });
  const music = {
    COUNT_OBJ: [
      ['oneSoundOneThing', 'לכל נקישת תוף מזיזים חפץ אחד. בסוף שואלים: כמה יש? נגנו שוב מהר יותר — המספר לא משתנה.', 'mcdonel2015', 'A'],
      ['beatsAndRests', 'בשמונה פעימות רק חלק נשמעות: ספרו את כל הפעימות עם אסימונים, ואז רק את הצלילים — שני מספרים שונים.', 'mcdonel2015', 'A', EXTRA],
    ],
    NEXTPREV: [
      ['nextBeat', 'ספרו פעימות בקול עם המטרונום ועצרו: איזה מספר תגידו בפעימה הבאה? ואיזה אמרתם לפניה?', 'mcdonel2015', 'A'],
      ['accentNext', 'הדגישו כל פעימה שנייה: אחרי מספר מודגש בא מספר שקט — הבא אחריו. ספרו קדימה ואחורה עם הנקישות.', 'das2023', 'A', EXTRA],
    ],
    COUNT_FWD: [
      ['countOnBeats', 'התחילו לספור מהמספר שניתן, פעימה לכל מספר, בקצב קבוע. הקצב לא נותן לדלג על מספר.', 'mcdonel2015', 'A'],
      ['tenAsOctave', 'כל עשרה מספרים הם אוקטבה: כשעוברים עשרת, הצליל «עולה קומה». ספרו קדימה ושמעו את המעבר.', 'rusconi2005', 'A', WEAK],
    ],
    COUNT_BACK: [
      ['countDownBeats', 'ספרו אחורה פעימה לכל מספר, כמו ספירה לאחור לפני שהשיר מתחיל. הקצב שומר שלא מדלגים.', 'mcdonel2015', 'A'],
      ['tenAsOctave', 'ספירה אחורה: כשיורדים מתחת לעשרת, הצליל «יורד קומה» (אוקטבה). שמעו את המעבר ואמרו את המספר.', 'rusconi2005', 'A', WEAK],
      ['restCount', 'ספרו אחורה בלב ונקשו רק במספרים הזוגיים — ספירה אחורה עם שקטים בין הצלילים.', 'mcdonel2015', 'A', EXTRA],
    ],
    SKIP2: [
      ['accentSkip', 'שמרו פעימה קבועה והדגישו כל פעימה שנייה. אמרו בקול רק את המודגשות: 2, 4, 6…', 'das2023', 'A'],
      ['halfNoteSkip', 'כל חצי תו נמשך שתי פעימות. סופרים את החצאים קדימה או אחורה: 2, 4, 6… משך התו הוא גודל הדילוג.', 'azaryahu2020', 'A', EXTRA],
      ['composeSkips', 'הרכיבו תיפוף שבו כל קבוצה היא 2 פעימות, וספרו קבוצות: כמה פעימות יש ב־5 קבוצות? ואחורה מ־50?', 'das2023', 'A', EXTRA],
    ],
    SKIP5: [
      ['accentSkip', 'הדגישו כל פעימה חמישית ואמרו רק את המודגשות: 5, 10, 15… המספרים האלה מסתיימים ב־5 או ב־0.', 'das2023', 'A'],
      ['handClap', 'כף יד = 5 אצבעות: מחיאת כף לכל חמישייה. התחילו מכפולה של 5 והמשיכו — מחיאה, מספר.', 'das2023', 'A', EXTRA],
      ['skipReply', 'קריאה ותשובה בקבוצות של 5 פעימות: כל תשובה היא עוד קבוצה שלמה. סך הפעימות מתחילת הקריאה הוא האיבר הבא.', 'das2023', 'A', EXTRA],
    ],
    GROUP10: [
      ['tenBeatBars', 'מקבצים את הפעימות בתיבות של עשר, הדגשה בראש כל תיבה. מספר ההדגשות הוא העשרות, והפעימות אחרי ההדגשה האחרונה הן היחידות.', 'das2023', 'A'],
      ['wholeNotesTens', 'תו ארוך שנמשך עשר פעימות הוא עשרת, ונקישה קצרה היא יחידה. נגנו מספר כתווים ארוכים וקצרים: כמה ארוכים וכמה קצרים?', 'azaryahu2020', 'A', EXTRA],
      ['fillTen', 'תיבה של עשר פעימות היא עשרת. תיבות מלאות — ספרת העשרות; הפעימות שחסרות בתיבה הפתוחה משלימות לעשר הבאה.', 'das2023', 'A', EXTRA],
    ],
    ADD10: [
      ['callResponse', 'המורה מתופף 3 פעימות, הילד עונה 4. כולם מנגנים את הרצף המחובר — כמה פעימות יחד? כתבו תרגיל.', 'mcdonel2015', 'A'],
      ['fillBar', 'תיבה של 10 פעימות: נגנו את הפעימות הראשונות, והשלימו עד 10 — החלק שהשלמתם הוא התשובה.', 'azaryahu2020', 'A', EXTRA],
    ],
    DECOMP10: [
      ['fillBar', 'תיבה של 10 פעימות: תוף גבוה ואז תוף נמוך. כמה נמוכות צריך כדי להשלים ל־10? זה הפירוק.', 'azaryahu2020', 'A', EXTRA],
      ['twoDrums', 'עשרה חברים, שני כלים: חלקו — כמה בתוף וכמה בשייקר? נגנו כל פירוק ושמעו שתמיד יוצא 10.', 'mcdonel2015', 'A'],
    ],
    ADD20: [
      ['callResponse', 'קריאה ותשובה: משפט של פעימות ומשפט תשובה. מחברים את שני המשפטים — אפשר להתחיל מהגדול ולהוסיף.', 'mcdonel2015', 'A'],
      ['tenThenMore', 'נגנו עד 10 בתוף, והמשיכו בשייקר: קודם משלימים לעשר, ואז מוסיפים את השאר.', 'das2023', 'A', EXTRA],
    ],
    EQ_LEFT: [
      ['sameLength', 'שני משפטי תיפוף נמשכים אותו זמן גם אם מחולקים אחרת: 3 ו־4 מול 5 ו־2. סימן השוויון אומר «אותו אורך».', 'azaryahu2020', 'A', EXTRA],
      // balanceBars restored from 855a184 (#595). The wording is the archived
      // one; the source is the M3 study a way on this mechanism may cite.
      ['balanceBars', 'סימן השוויון אומר: שני הצדדים נמשכים אותו זמן. נגנו את הצד השני והשלימו נקישות עד שהם שווים.', 'azaryahu2020', 'A'],
      ['callResponse', 'הפכו את שני המשפטים — קודם התשובה ואז הקריאה. האורך הכולל לא משתנה: זה חוק החילוף.', 'mcdonel2015', 'A', EXTRA],
    ],
    MULTIADD: [
      ['callResponse', 'שלושה כלים זה אחרי זה: תוף, שייקר, פעמון. ספרו את כל הפעימות — ונסו לחבר קודם זוג שנותן 10.', 'mcdonel2015', 'A', EXTRA],
      ['fillBar', 'תיבה אחת, כמה תווים: חברו את האורכים בכל סדר — התיבה נשארת שלמה. חפשו את הזוג שמשלים לעשר.', 'azaryahu2020', 'A', EXTRA],
      ['tenThenMore', 'שלושה מחוברים: נגנו קודם את השניים שמשלימים לעשר — תוף עד עשר — ואז את השלישי בשייקר והמשיכו לספור.', 'das2023', 'A'],
    ],
    TENS: [
      ['accentTens', 'ספרו פעימות והדגישו כל עשירית. חיבור עשרות הוא עוד הדגשות: 3 הדגשות ועוד 2 — כמה הדגשות, וכמה פעימות בסך הכול?', 'das2023', 'A'],
      ['tenAsOctave', 'קפיצה של עשר בישר המספרים היא אוקטבה: כל קפיצה — צליל, וסופרים קפיצות קדימה או אחורה.', 'rusconi2005', 'A', WEAK],
    ],
    SUB10: [
      ['takeAwayBeats', 'עיגול לכל פעימה: הפעימות שמחסרים נעלמות אחת־אחת (שקט במקומן). כמה עיגולים נשארו נשמעים?', 'mcdonel2015', 'A'],
      ['fillBar', 'חיסור כהשלמה: כמה פעימות חסרות מהמשפט הקצר כדי להגיע למשפט הארוך? נגנו את ההשלמה.', 'azaryahu2020', 'A', EXTRA],
    ],
    SUB20: [
      ['takeAwayBeats', 'משפט של פעימות ארוך יותר מעשר: הסירו קודם את מה שמעל עשר, ואז את השאר — הקשיבו לכמה שנשאר.', 'mcdonel2015', 'A'],
      ['fillBar', 'השלמה במקום חיסור: מהמספר הקטן נגנו פעימות עד הגדול וספרו כמה הוספתם.', 'azaryahu2020', 'A', EXTRA],
      ['doublePhrase', 'נגנו משפט וחזרו עליו: שני משפטים שווים הם כפולה. חיסור ליד כפולה: מורידים משפט אחד, ועוד או פחות פעימה.', 'das2023', 'A', EXTRA],
    ],
    NLINE: [
      ['scaleSteps', 'ישר המספרים הוא סולם: כל מספר צליל, כל צעד ימינה — צליל גבוה יותר. מצאו את המקום לפי הצליל.', 'rusconi2005', 'A', WEAK],
      ['lineStepBeats', 'על ישר המספרים כל קו הוא פעימה: מתחילים ב־0 ומקישים פעימה לכל קו עד הסימון. מספר הפעימות הוא המספר.', 'mcdonel2015', 'A'],
      ['tenAsOctave', 'עשרת שלמה היא אוקטבה — אותו צליל, קומה למעלה. כך מוצאים מהר בין אילו עשרות מספר נמצא.', 'rusconi2005', 'A', WEAK],
    ],
    NUMBER_LINE_APPROX: [
      ['countFromLandmark', 'מתחילים בעשרת הקרובה לסימון וממשיכים לספור פעימה לכל קו עד הסימון: פחות ספירה, אותו מספר.', 'mcdonel2015', 'A'],
      ['tenAsOctave', 'ספרו אוקטבות מ־0: כל אוקטבה היא עשרת. המספר נמצא בין שתי אוקטבות — איזו קרובה יותר?', 'rusconi2005', 'A', WEAK],
    ],
    WORD_COLLECT: [
      ['callResponse', 'כל קבוצה בסיפור היא משפט פעימות. נגנו את שתי הקבוצות ברצף וספרו הכול יחד.', 'mcdonel2015', 'A'],
      ['twoDrums', 'קבוצה אחת בתוף, השנייה בשייקר. מנגנים זו אחרי זו — כמה צלילים בסך הכול?', 'mcdonel2015', 'A', EXTRA],
      ['fillBar', 'כתבו את הסיפור כתיבה: החלק הראשון, החלק השני, והשלם. ואז את התרגיל שמתאים.', 'azaryahu2020', 'A', EXTRA],
    ],
    WORD_REMOVE: [
      ['takeAwayBeats', 'הקבוצה כולה — משפט פעימות. מה שהלך — פעימות שהופכות לשקט. כמה צלילים נשארו?', 'mcdonel2015', 'A'],
      ['twoDrums', 'הכול בתוף; מה שיוצא מהקבוצה עובר לשייקר. ספרו רק את התופים שנשארו.', 'mcdonel2015', 'A', EXTRA],
      ['fillBar', 'כתבו את הסיפור כתיבה: השלם, מה שהוסר, ומה שנשאר — ואז את תרגיל החיסור.', 'azaryahu2020', 'A', EXTRA],
    ],
    WORD_COMPARE: [
      ['twoDrums', 'קבוצה אחת בתוף וקבוצה שנייה בשייקר, פעימה מול פעימה. כשכלי אחד משתתק — כמה פעימות המשיך השני לבד?', 'mcdonel2015', 'A'],
      ['sameLength', 'שני משפטים באורכים שונים: השלימו את הקצר עד שיהיה כמו הארוך — ההשלמה היא ההפרש.', 'azaryahu2020', 'A', EXTRA],
      ['fillBar', 'כתבו את ההשוואה כשתי תיבות זו מעל זו: הארוכה, הקצרה, והחלק שבולט — זה ההפרש ותרגיל החיסור.', 'azaryahu2020', 'A', EXTRA],
    ],
    GEO_SORT: [
      ['floorWalkSides', 'הולכים על קווי הצורה שעל הרצפה, צעד בכל פעימה. בכל צלע מתחילים משפט חדש: מספר המשפטים עד ההתחלה הוא מספר הצלעות.', 'moore2012', 'A', WEAK],
      ['shapeLoop', 'כל צלע היא תו, והצורה היא לולאה שחוזרת: משולש — לולאה של 3 תווים, מרובע — של 4. שמעו את הלולאה פעמיים וזהו את הצורה.', 'azaryahuPatterns', 'A'],
      ['turnCount', 'בכל פינה מסתובבים עם הגוף על פעימה מודגשת. ספרו את הסיבובים עד שחוזרים לכיוון ההתחלה — זה מספר הקודקודים.', 'smith2014', 'A', WEAK],
    ],
    RIGHT_ANGLE: [
      ['musicalTurns', 'צעדו לפי התיפוף: ישר, פנייה של רבע סיבוב, ישר. פנייה כזו היא זווית ישרה — כמו פינת דף.', 'shoval2011', 'A', WEAK],
      ['armQuarterTurn', 'יד אחת קדימה, השנייה מסתובבת בארבע פעימות עד לצד הגוף: רבע סיבוב, זווית ישרה. עוצרים קודם — חדה; ממשיכים — קהה.', 'smith2014', 'A', WEAK],
      ['quarterTurnBar', 'סיבוב שלם הוא תיבה של ארבעה רבעים. זווית ישרה היא רבע סיבוב, תו רבע אחד; פחות מרבע — חדה, יותר — קהה.', 'azaryahu2020', 'A'],
    ],
    POLY_CUT_A: [
      ['joinWalk', 'כל ילד הולך בקצב סביב צורה משלו. מצמידים את הצורות והולכים יחד סביב הצורה החדשה: הצלע המשותפת כבר לא בדרך.', 'moore2012', 'A', WEAK],
      ['shapeAsBar', 'הצורה השלמה היא תיבה, וכל חלק שגזרתם הוא תו בתוכה: שני חצאים, או רבע ושלושה רבעים. בהרכבה החלקים ממלאים את התיבה בדיוק.', 'azaryahu2020', 'A'],
      ['mirrorPattern', 'גזרו לאורך קו וצרו שני חלקים: נגנו את המקצב של כל חלק. חלקים זהים נשמעים אותו דבר.', 'azaryahuPatterns', 'A', EXTRA],
    ],
    LENGTH: [
      ['heelToeSteps', 'הולכים לאורך החפץ עקב־אגודל, צעד בכל פעימה: מספר הפעימות הוא האורך בצעדים. רגל גדולה סופרת פחות, ולכן צריך יחידה קבועה.', 'moore2012', 'A', WEAK],
      ['clipClaps', 'מניחים אטבים זה אחרי זה לאורך החפץ ומוחאים כף על כל אטב, וכל אטב חמישי בהדגשה. האורך: כמה חמישיות ועוד כמה אטבים.', 'das2023', 'A', EXTRA],
      ['cmNote', 'לכל חפץ תו משלו: ס״מ אחד הוא פעימה אחת. חפץ באורך 8 ס״מ הוא תו של 8 פעימות. נגנו את התו ובדקו בסרגל שהמספר זהה.', 'azaryahu2020', 'A'],
    ],
    CLOCK: [
      ['clockWalk', 'עומדים במרכז מעגל של 12 מספרים על הרצפה ומסתובבים פעימה לכל מספר, מ־12 עד השעה. מספר הפעימות הוא השעה.', 'moore2012', 'A', WEAK],
      ['hourAccents', 'נקשו 12 פעימות בתיבה אחת והדגישו רק את הפעימה שהמחוג הקטן מצביע עליה. מספר הפעימה המודגשת הוא השעה.', 'das2023', 'A'],
      ['hourChimes', 'פעמון השעה מצלצל צלצול אחד לכל שעה. סופרים את הצלצולים: מספר הצלילים הוא המספר שהמחוג הקטן מראה.', 'mcdonel2015', 'A', EXTRA],
    ],
    MONEY: [
      ['coinGroups', 'מטבע של 5 הוא חמש מחיאות מקובצות, מטבע של 10 — עשר, עם הדגשה בראש כל קבוצה. סופרים בקבוצות: 10, 20, 25… ולא מטבע מטבע.', 'das2023', 'A'],
      ['takeAwayBeats', 'עודף הוא חיסור: נגנו את מה ששילמתם, השתיקו את המחיר — הפעימות שנשארו נשמעות הן העודף.', 'mcdonel2015', 'A', EXTRA],
      ['fillBar', 'עודף כהשלמה: מהמחיר נגנו פעימות עד הסכום ששילמתם וספרו כמה הוספתם.', 'azaryahu2020', 'A', EXTRA],
    ],
    PICTOGRAM: [
      ['keyGroups', 'כשסמל שווה 2, כל סמל הוא קבוצה של שתי פעימות: טה־טה. נגנו שורה וספרו בקפיצות של 2 — כך קוראים את המפתח.', 'das2023', 'A'],
      ['rowDurations', 'כל שורה היא תו שאורכו כמספר הסמלים. נגנו שתי שורות יחד: מי שנגמרת קודם קטנה יותר, והפעימות שהשנייה ממשיכה לבד הן ההפרש.', 'azaryahu2020', 'A', EXTRA],
      ['stairRows', 'סדרו את השורות מהקצרה לארוכה ונגנו ברצף: הדגם צריך לגדול בכל שורה. שורה ששוברת את הדגם — שם טעיתם בספירה.', 'azaryahuPatterns', 'A', EXTRA],
    ],
    BARCHART: [
      ['barNotes', 'כל עמודה היא תו: גובה העמודה הוא מספר הפעימות שהתו נמשך. נגנו את העמודות לפי הסדר — התו הארוך ביותר הוא העמודה הגבוהה.', 'azaryahu2020', 'A'],
      ['gridBeats', 'קווי הרשת בדיאגרמה הם פעימות, וכל קו חמישי מודגש. קוראים עמודה בקפיצות — 5, 10 — ועוד כמה פעימות עד הראש שלה.', 'das2023', 'A', EXTRA],
      ['barStepWalk', 'צועדים לאורך כל עמודה, צעד לכל משבצת, ומוחאים כף בראשה. מי שהלך יותר צעדים — העמודה הגבוהה; ההפרש בצעדים הוא ההפרש.', 'moore2012', 'A', WEAK],
    ],
    CHART100: [
      ['rowAccent', 'כל שורה בלוח המאה היא תיבה של עשר פעימות. איזו תיבה זו — העשרות; איזו פעימה מודגשת בתוכה — היחידות.', 'das2023', 'A'],
      ['columnPattern', 'בכל עמודה בלוח המאה ספרת היחידות חוזרת: 3, 13, 23… נגנו את העמודה כדגם שחוזר כל עשר פעימות ומצאו מה משתנה ומה נשאר.', 'azaryahuPatterns', 'A', EXTRA],
      ['tenAsOctave', 'ירידה שורה בלוח המאה היא עשר יותר — אוקטבה. צעד ימינה או שמאלה — יחידה. נגנו את המסלול.', 'rusconi2005', 'A', WEAK],
    ],
    // #751: fixed accents (das2023) are the one main way, as in CHART100 that
    // builds on patterns; the MusiMath ways stay as EXTRA and keep their D.
    PATTERN: [
      ['fixedAccents', 'שמרו פעימה קבועה, וההדגשה חוזרת תמיד באותו מקום בדגם. אחרי ההדגשה הדגם מתחיל מחדש — כך יודעים מה בא עכשיו.', 'das2023', 'A'],
      ['melodyAb', 'דגם AB בצליל: גבוה, נמוך, גבוה, נמוך… שירו אותו והמשיכו — הצליל הבא הוא מה שהדגם מכתיב.', 'azaryahuPatterns', 'D', EXTRA],
      ['mirrorPattern', 'סדרו 8 פעימות בשורה וצרו דגם סימטרי; הפכו אותו ובדקו אם המוזיקה משתנה.', 'azaryahuPatterns', 'D', EXTRA],
      ['composePattern', 'הרכיבו דגם AAB או ABC בצלילים ובצורות: אותו דגם, פעם בצליל ופעם בצורה — מה חוזר ואיפה?', 'azaryahuPatterns', 'D', EXTRA],
    ],
  };

  // Late items (MM-7xx stream B). New grade א׳ items live here, not in
  // banks.js, and are NOT put in `items`: banks.js pushes `items` in the
  // middle of its RAW list, so every item after them would get a new id and
  // children's saved history would point at the wrong questions. Each late
  // item instead carries its own stable key, and banks.js appends them after
  // its last item (the hook is handed off in the stream B PR; until it lands
  // these items do not ship). Shape, as `items` plus the key:
  //   [skill, prompt, answer, hint, level 1-3, ST key of banks.js, { key }]
  // The key is a number: task number × 100 + item number (MM-731 item 1 is
  // 73101), far above any RAW index. A late item's id is `<grade>-<skill>-<key>`,
  // so ids stay numeric like the rest. Keys never change or repeat.
  // The music side comes from `music` above, like every other item: the
  // primary way of the standard, by level.
  const lateItems = [
    // MM-731 · mm-cur-4 whole tens: basis and intermediate entry items.
    // Newprogramgrade1.pdf p. 8 «חיבור וחיסור בעשרות שלמות» (MM-501, PR #949;
    // gap G9 in docs/MM-700/curriculum-gaps.md, PR #951). The 9 items in
    // banks.js are all challenge level, so the topic had no way in. Small
    // tens first (to 50), then to 100. Solved with accentTens (TENS above):
    // one accented beat per ten. No counted-beats cue, so the topic keeps
    // that one way.
    ['addition', 'תוף מדגיש כל עשירית: 10 פעימות ועוד 10 פעימות. כמה פעימות בסך הכול?', 20, 'עשרת אחת ועוד עשרת אחת', 1, 'TENS', { key: 73101 }],
    ['addition', '2 תיבות של 10 פעימות ועוד תיבה אחת של 10 פעימות. כמה פעימות?', 30, '2 עשרות ועוד עשרת אחת', 1, 'TENS', { key: 73102 }],
    ['addition', '20 + 20 = ?', 40, '2 הדגשות ועוד 2 הדגשות', 1, 'TENS', { key: 73103 }],
    ['subtraction', 'ניגנו 30 פעימות, ותיבה אחת של 10 פעימות שתקה. כמה פעימות נשמעו?', 20, '3 עשרות פחות עשרת אחת', 1, 'TENS', { key: 73104 }],
    ['subtraction', '40 − 10 = ?', 30, '4 הדגשות פחות הדגשה אחת', 1, 'TENS', { key: 73105 }],
    ['subtraction', '50 − 20 = ?', 30, '5 עשרות פחות 2 עשרות', 1, 'TENS', { key: 73106 }],
    ['addition', '40 + 50 = ?', 90, '4 עשרות ועוד 5 עשרות', 2, 'TENS', { key: 73107 }],
    ['addition', '3 תיבות של 10 פעימות ועוד 4 תיבות של 10 פעימות. כמה פעימות?', 70, '3 עשרות ועוד 4 עשרות', 2, 'TENS', { key: 73108 }],
    ['addition', '30 + 30 = ?', 60, '3 הדגשות ועוד 3 הדגשות', 2, 'TENS', { key: 73109 }],
    ['subtraction', 'ניגנו 90 פעימות, ו־5 תיבות של 10 פעימות שתקו. כמה פעימות נשמעו?', 40, '9 עשרות פחות 5 עשרות', 2, 'TENS', { key: 73110 }],
    ['subtraction', '60 − 40 = ?', 20, '6 הדגשות פחות 4 הדגשות', 2, 'TENS', { key: 73111 }],
    ['subtraction', '100 − 30 = ?', 70, '10 עשרות פחות 3 עשרות', 2, 'TENS', { key: 73112 }],
    // MM-732 · mm-cur-9 length and mm-cur-11 coins, 6 to 12 items each, every
    // level present (gap G2 in docs/MM-700/curriculum-gaps.md, PR #951).
    // Newprogramgrade1.pdf: length p. 11 «מדידת אורך», money p. 3 (MM-501,
    // PR #949). Length is solved with cmNote (M3), coins with coinGroups (M2),
    // the one primary way of each standard above. The ruler widget prints the
    // length it shows, so no new ruler item asks for that length: each asks
    // for one step more (longer, shorter, half, twice, up to 20).
    ['measurement', 'בתמונה שורת קוביות אורך. מוסיפים עוד 2 קוביות. כמה קוביות יש עכשיו?', 6, 'ספרו את הקוביות שבתמונה והמשיכו עוד 2', 1, 'LENGTH', { key: 73201, widget: 'ruler', ruler: { unit: 'unit', length: 4 } }],
    ['measurement', 'העיפרון בתמונה נמדד בקוביות. עיפרון אחר קצר ממנו בקובייה אחת. כמה קוביות בו?', 4, 'ספרו את הקוביות שבתמונה, ואז קובייה אחת פחות', 1, 'LENGTH', { key: 73202, widget: 'ruler', ruler: { unit: 'unit', length: 5 } }],
    ['measurement', 'מדדו את הצעצוע בסרגל. צעצוע שני ארוך ממנו ב־3 ס״מ. כמה ס״מ הוא?', 10, 'קראו את הסרגל, ואז הוסיפו 3', 2, 'LENGTH', { key: 73203, widget: 'ruler', ruler: { unit: 'cm', length: 7 } }],
    ['measurement', 'מדדו את החבל בסרגל. חותכים אותו לשני חלקים שווים. כמה ס״מ אורכו של כל חלק?', 6, 'חצי מהאורך שעל הסרגל', 3, 'LENGTH', { key: 73204, widget: 'ruler', ruler: { unit: 'cm', length: 12 } }],
    ['measurement', 'מדדו את המקל בסרגל. שני מקלות כאלה זה אחרי זה — כמה ס״מ יחד?', 14, 'פעמיים האורך שעל הסרגל', 3, 'LENGTH', { key: 73205, widget: 'ruler', ruler: { unit: 'cm', length: 7 } }],
    ['measurement', 'מדדו את הסרט בסרגל. כמה ס״מ חסרים לו כדי להגיע ל־20 ס״מ?', 7, 'מהאורך שעל הסרגל סופרים הלאה עד 20', 3, 'LENGTH', { key: 73206, widget: 'ruler', ruler: { unit: 'cm', length: 13 } }],
    ['measurement', 'שני מטבעות של 1 ₪ ומטבע של 2 ₪. כמה ₪ ביחד?', 4, '1 ועוד 1 ועוד 2', 1, 'MONEY', { key: 73207 }],
    ['measurement', 'מטבע של 5 ₪ ומטבע של 1 ₪. כמה ₪ ביחד?', 6, 'מתחילים מ־5 וסופרים עוד 1', 1, 'MONEY', { key: 73208 }],
    ['measurement', 'שני מטבעות של 5 ₪ ומטבע של 2 ₪. כמה ₪ ביחד?', 12, 'שתי חמישיות הן עשר, ועוד 2', 2, 'MONEY', { key: 73209 }],
    ['measurement', 'כמה מטבעות של 5 ₪ שווים למטבע אחד של 10 ₪?', 2, 'כמה קבוצות של חמש יש בעשר', 2, 'MONEY', { key: 73210 }],
    ['measurement', 'מטבע של 10 ₪, מטבע של 5 ₪ ומטבע של 1 ₪. כמה ₪ ביחד?', 16, 'קודם המטבע הגדול, ואז ממשיכים לספור', 3, 'MONEY', { key: 73211 }],
    ['measurement', 'קנינו מדבקה ב־6 ₪ ושילמנו במטבע של 10 ₪. כמה ₪ עודף?', 4, '10 פחות 6', 3, 'MONEY', { key: 73212 }],
    // MM-733 · mm-cur-10 whole-hour clock, 6 to 12 items (2 per level added;
    // gap G2, PR #951). Newprogramgrade1.pdf p. 12 «קריאת שעון בשעות שלמות»
    // (MM-501, PR #949). Solved with hourAccents (M2), CLOCK's one primary way.
    // The clock widget prints the time it shows (clock-read), so no new item
    // asks for that time: each asks one or more whole hours before or after.
    ['measurement', 'מה תהיה השעה בעוד שעה אחת?', 4, 'המחוג הקטן זז מספר אחד קדימה', 1, 'CLOCK', { key: 73301, widget: 'clock', clock: { hour: 3 } }],
    ['measurement', 'מה הייתה השעה לפני שעה אחת?', 7, 'המחוג הקטן חוזר מספר אחד אחורה', 1, 'CLOCK', { key: 73302, widget: 'clock', clock: { hour: 8 } }],
    ['measurement', 'השיעור מתחיל בעוד 2 שעות. באיזו שעה הוא מתחיל?', 8, 'סופרים 2 מספרים קדימה בשעון', 2, 'CLOCK', { key: 73303, widget: 'clock', clock: { hour: 6 } }],
    ['measurement', 'מה תהיה השעה בעוד שעתיים?', 1, 'אחרי 12 השעון מתחיל מחדש', 2, 'CLOCK', { key: 73304, widget: 'clock', clock: { hour: 11 } }],
    ['measurement', 'ההופעה נגמרה בשעה שבשעון. היא התחילה 3 שעות קודם. באיזו שעה התחילה?', 6, 'סופרים 3 מספרים אחורה בשעון', 3, 'CLOCK', { key: 73305, widget: 'clock', clock: { hour: 9 } }],
    ['measurement', 'החזרה מתחילה בשעה שבשעון ונגמרת בשעה 1. כמה שעות היא נמשכת?', 3, 'סופרים מהשעה שבשעון עד 1, דרך 12', 3, 'CLOCK', { key: 73306, widget: 'clock', clock: { hour: 10 } }],
    // MM-735 · mm-cur-3 «איך חשבת?» strategy items (gap G5, PR #951):
    // Newprogramgrade1.pdf p. 6 «חיבור וחיסור בתחום העשרים» via MM-501
    // (PR #949). Each item names a make-ten or back-to-ten split of a sum
    // across ten and asks for one number of that split, so the answer is a
    // number the child types (the plan loop has no choice buttons). Inner
    // numbers are words where needed, so variety.js retune() finds no digit
    // pair that gives the answer and keeps the prompt as written. Tagged
    // 'strategy'. Solved with the standard's primary way (ADD20 callResponse,
    // SUB20 takeAwayBeats, M1); tenThenMore rides along as the extra way.
    ['addition', 'איך חשבת 8 + 5? משלימים את 8 לעשר. כמה מוסיפים קודם?', 2, 'כמה חסר ל־8 כדי להגיע ל־10', 1, 'ADD20', { key: 73501, tags: ['strategy'] }],
    ['addition', 'איך חשבת 9 + 4? קודם משלימים את תשע לעשר. כמה נשאר להוסיף?', 3, 'מתוך הארבע אחת כבר הלכה לעשר', 1, 'ADD20', { key: 73502, tags: ['strategy'] }],
    ['addition', 'איך חשבת 7 + 6? משלימים את 7 לעשר. כמה נשאר מה־6?', 3, 'קודם משלימים את 7 לעשר, ואז מה שנשאר', 2, 'ADD20', { key: 73503, tags: ['strategy'] }],
    ['addition', 'איך חשבת שמונה ועוד שבע? קודם משלימים לעשר. כמה זה ביחד?', 15, 'מתוך השבע נשארו עוד 5 אחרי העשר', 2, 'ADD20', { key: 73504, tags: ['strategy'] }],
    ['addition', 'איך חשבת 6 + 8? מתחילים מ־8 ומשלימים לעשר. כמה מוסיפים קודם?', 2, 'כמה חסר ל־8 כדי להגיע ל־10', 2, 'ADD20', { key: 73505, tags: ['strategy'] }],
    ['subtraction', 'איך חשבת 13 − 5? קודם יורדים מ־13 לעשר. כמה הורדנו?', 3, 'מ־13 עד 10 יש כמה צעדים', 2, 'SUB20', { key: 73506, tags: ['strategy'] }],
    ['subtraction', 'איך חשבת 14 − 6? קודם יורדים לעשר. כמה עוד צריך להוריד?', 2, 'מתוך השש כבר הורדנו 4', 3, 'SUB20', { key: 73507, tags: ['strategy'] }],
    ['subtraction', 'איך חשבת שתים־עשרה פחות חמש? קודם יורדים לעשר. מה התשובה?', 7, 'מה־10 מורידים עוד 3', 3, 'SUB20', { key: 73508, tags: ['strategy'] }],
  ];

  // Guided lessons of grade א׳ (MM-7xx stream B), served by interactiveLessons.js
  // through the MMLessonRegistry contract (shape at the top of that file).
  const lessons = [
    // MM-734 · mm-cur-3 make ten (gap G3/G5, PR #951). Newprogramgrade1.pdf
    // p. 6 «פירוקי 10; חיבור בתחום העשרים» via MM-501 (PR #949). The music
    // model is the ten-beat bar of accent groups (M2, das2023), as in TENS.
    {
      id: 'g1-make-ten',
      title: 'השלמה לעשר: ממלאים תיבה של 10 פעימות',
      grade: 'א',
      strand: 'מספרים ופעולות',
      topicId: 'mm-cur-3',
      icon: '🥁',
      summary: 'מחברים מעבר לעשר: קודם ממלאים תיבה של 10 פעימות, ואת מה שנשאר מנגנים בתיבה חדשה.',
      steps: [
        {
          title: 'תיבה של עשר פעימות',
          body: 'תיבה מלאה היא 10 פעימות, והפעימה הראשונה בכל תיבה מודגשת. כש־8 פעימות כבר נשמעו, חסרות 2 כדי למלא את התיבה. זו השלמה לעשר.'
        },
        {
          title: 'קודם משלימים, אחר כך ממשיכים',
          body: '8 + 5: מתוך ה־5 לוקחים 2 וממלאים את התיבה — 10. נשארו 3 פעימות, ומנגנים אותן בתיבה חדשה עם הדגשה בהתחלה: 10 ועוד 3 הם 13.'
        },
        {
          title: 'נסו עם מחיאות',
          body: '9 + 4: מחאו 9 פעמים. עוד מחיאה אחת ממלאת את התיבה. כמה מחיאות נשארו לתיבה החדשה? שלוש — ולכן ביחד 13.'
        },
        {
          title: 'בדיקת הבנה מודרכת',
          body: 'איך כדאי לחשב 7 + 5 בעזרת תיבה של עשר?',
          options: ['7 + 3 + 2', '7 + 5 + 10', '5 + 5 + 5', '7 + 1 + 1 + 1'],
          correctIndex: 0,
          explanation: '3 פעימות משלימות את 7 לתיבה של 10, ונשארו עוד 2 לתיבה החדשה: 10 ועוד 2 הם 12.'
        }
      ]
    },
  ];
  // Order-independent: whichever file loads first creates the array.
  const reg = (typeof globalThis !== 'undefined' ? globalThis : {});
  const list = (reg.MMLessonRegistry = reg.MMLessonRegistry || []);
  lessons.forEach(function (l) { if (list.indexOf(l) === -1) list.push(l); });

  return { grade: 'א', ST: {}, items: [], lateItems: lateItems, lessons: lessons, music: music, sources: sources };
});
