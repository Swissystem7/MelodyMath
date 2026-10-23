// MelodyMath — learning every grade א׳ standard THROUGH music (#591, #595).
// The א׳ items themselves live in banks.js; this file only adds the music
// side, the same way curriculum/grade6.js does for ו׳: banks.js gives every
// א׳ item without a music activity the way of its level. Pages load this file
// before banks.js.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_GRADE1 = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // The research behind the ways: id → [label, URL], from the research map
  // pasted in #591 (23.10.2026) — the same entries grade6.js cites. Labels as
  // there: D = part of an evaluated maths-learning intervention, R = a
  // reputable instructional source supports the connection, A = an adaptation
  // of a documented music–maths relationship, not tested on this topic alone.
  // No א׳ way claims D: the evaluated programmes in the map taught fractions.
  const sources = {
    interplay2024: ['Interplay between music and mathematics (Humanit. Soc. Sci. Commun., 2024)', 'https://www.nature.com/articles/s41599-024-03631-z'],
    kcConnections: ['Kennedy Center — Connections: Math and Music', 'https://www.kennedy-center.org/education/resources-for-educators/classroom-resources/media-and-interactives/media/music/connections/connections/math--music/'],
    kcMath: ['Kennedy Center — math collection', 'https://www.kennedy-center.org/education/resources-for-educators/classroom-resources/collections/collections/math/'],
    kcPractice: ['Kennedy Center — Arts Integration in Practice: Math', 'https://www.kennedy-center.org/education/resources-for-educators/classroom-resources/articles-and-how-tos/articles/collections/arts-integration-resources/arts-integration-in-practice-math/'],
    kcLessons: ['Kennedy Center — lessons and activities', 'https://www.kennedy-center.org/education/resources-for-educators/classroom-resources/lessons-and-activities/'],
    wnetMathInMusic: ['WNET/THIRTEEN — Get the Math: Math in Music', 'https://www.thirteen.org/get-the-math/teachers/teachers-math-in-music-activities/76/'],
    makingMusicCount: ['Making Music Count', 'https://makingmusiccount.org/'],
    palmPipes: ['Exploratorium — Palm Pipes', 'https://www.exploratorium.edu/snacks/palm-pipes'],
    preshall: ['Preservation Hall Foundation — Music and Math', 'https://lessons.preshallfoundation.org/lesson/music-and-math/'],
  };

  // Bank standard key → ways, one per level (1, 2, 3), so every topic is met
  // through at least two different musical models. A way is [music tag, how
  // to solve it with music (Hebrew; never the answer of an item), source id,
  // evidence label].
  const music = {
    COUNT_OBJ: [
      ['oneTapEach', 'הקישו על השולחן נקישה אחת לכל פעימה או תו, והצביעו עליו בזמן ההקשה. ההקשה האחרונה היא כמה יש.', 'kcLessons', 'R'],
      ['drumCount', 'הכו בתוף פעם אחת לכל עצם ואמרו בקול את המספר. בסוף נגנו שוב לאט ובדקו שלא דילגתם.', 'kcConnections', 'A'],
      ['echoCount', 'המורה מנגן כמה צלילים, ואתם מחזירים בהד את אותה כמות. מנו את ההד בקול — כמה צלילים שמעתם?', 'interplay2024', 'A'],
    ],
    NEXTPREV: [
      ['scaleStep', 'כל מספר הוא מדרגה בסולם צלילים: הבא הוא צעד אחד למעלה, הקודם צעד אחד למטה. שירו ותגיעו.', 'kcConnections', 'A'],
      ['beatAfter', 'מחאו כפיים וספרו פעימות. עצרו במספר הנתון — הפעימה שאחריו היא הבא, וזו שלפניו היא הקודם.', 'kcLessons', 'R'],
      ['xyloSteps', 'על קסילופון ממוספר, נגנו את הלוח של המספר ואז את השכן מימין או משמאל. השכנים הם הבא והקודם.', 'kcMath', 'A'],
    ],
    COUNT_FWD: [
      ['countSong', 'שירו את המספרים בשיר ספירה: כשמגיעים לסוף עשרת, המנגינה עולה ומתחילה עשרת חדשה.', 'makingMusicCount', 'R'],
      ['marchCount', 'צעדו במקום, צעד לכל מספר, והתחילו מהמספר הנתון. מה תגידו בצעד הבא?', 'kcLessons', 'R'],
      ['tensBell', 'פעמון מצלצל בכל מספר שנגמר ב־0. ספרו קדימה ושימו לב: אחרי הפעמון מתחילה עשרת חדשה.', 'kcConnections', 'A'],
    ],
    COUNT_BACK: [
      ['scaleDown', 'ספירה אחורה היא ירידה בסולם: שירו את המספרים כשהצליל יורד צעד בכל פעם.', 'kcConnections', 'A'],
      ['rocketCountdown', 'ספירה לאחור כמו לפני שיגור: תוף לכל מספר, והקצב קבוע. מה המספר שלפני?', 'kcLessons', 'R'],
      ['softerCount', 'ספרו אחורה וכל מספר קצת יותר בשקט. כשמגיעים לעשרת עגולה — הקישו חזק ובדקו שהמשכתם נכון.', 'interplay2024', 'A'],
    ],
    SKIP2: [
      ['loudSoft', 'ספרו בקצב: חלש, חזק, חלש, חזק. אמרו בקול רק את המספרים החזקים — זו ספירה בדילוגים של 2.', 'makingMusicCount', 'R'],
      ['twoStepDance', 'צעד ימינה, צעד שמאלה ומחיאה: כל זוג צעדים הוא דילוג של 2. ספרו את המחיאות בקפיצות של שתיים.', 'kcLessons', 'R'],
      ['pairsBack', 'לספירה אחורה בשתיים: שתי נקישות שקטות לכל דילוג, ואומרים רק את המספר שאחרי הזוג.', 'kcConnections', 'A'],
    ],
    SKIP5: [
      ['fiveAccent', 'ספרו פעימות והדגישו כל פעימה חמישית. אמרו רק את ההדגשות — כך שומעים את הכפולות של 5.', 'makingMusicCount', 'R'],
      ['handClap', 'יד אחת היא 5 אצבעות: מחיאה לכל יד, ומוסיפים 5 בכל מחיאה. שירו את המספרים בקצב.', 'kcLessons', 'R'],
      ['fiveBar', 'תיבה של 5 פעימות: בסוף כל תיבה מכים במצילה ואומרים כמה פעימות עברו. כך ממשיכים מכל כפולה של 5.', 'kcConnections', 'A'],
    ],
    GROUP10: [
      ['tenBeatBar', 'אספו 10 נקישות לתיבה אחת וסמנו אותה בצליל נמוך. כמה תיבות מלאות? כל תיבה היא עשרת.', 'kcConnections', 'A'],
      ['bassAndClicks', 'בס נמוך לכל עשרת ונקישה לכל יחידה: נגנו את הכמות, וספרו קודם בסים ואחר כך נקישות.', 'interplay2024', 'A'],
      ['tensSong', 'שירו בעשרות: «עשר, עשרים, שלושים» — צליל אחד לכל קבוצה של עשר. כמה צלילים שרתם?', 'makingMusicCount', 'R'],
    ],
    ADD10: [
      ['beatsJoin', 'נגנו את הקבוצה הראשונה על תוף, המשיכו בלי לעצור לקבוצה השנייה וספרו את כל ההקשות יחד.', 'kcLessons', 'R'],
      ['countOn', 'שמרו את המספר הגדול בראש, ונקשו רק את הקטן תוך כדי ספירה הלאה. הנקישה האחרונה היא הסכום.', 'kcConnections', 'A'],
      ['twoInstruments', 'כלי אחד מנגן את המחובר הראשון וכלי שני את השני. מנו את כל הצלילים — שני כלים, סכום אחד.', 'interplay2024', 'A'],
    ],
    DECOMP10: [
      ['tenBeatSplit', 'תיבה של עשר פעימות: חלק מהפעימות בתוף וחלק במשולש. כמה במשולש כדי שהתיבה תהיה מלאה?', 'kcConnections', 'A'],
      ['fingerPiano', '10 אצבעות הן 10 קלידים: לחצו בכמה אצבעות, והאצבעות שנשארו באוויר הן החלק החסר עד 10.', 'kcLessons', 'R'],
      ['restFill', 'בתיבה יש צלילים ושתיקות, ויחד הם 10 פעימות. ספרו את השתיקות — זה המספר שמשלים ל־10.', 'interplay2024', 'A'],
    ],
    ADD20: [
      ['makeTenBar', 'מלאו קודם תיבה של 10 פעימות, ואת מה שנשאר נגנו בתיבה הבאה. עשר ועוד הנותר — קל לחבר.', 'kcConnections', 'A'],
      ['countOn', 'שמרו את המספר הגדול בראש, ונקשו רק את הקטן תוך כדי ספירה הלאה. הנקישה האחרונה היא הסכום.', 'kcConnections', 'A'],
      ['doublesDrum', 'כפולים נשמעים כהד: נגנו קבוצה ואז אותה קבוצה שוב. כמעט־כפולים הם הד ועוד נקישה אחת.', 'makingMusicCount', 'A'],
    ],
    EQ_LEFT: [
      ['balanceBars', 'סימן השוויון אומר: שני הצדדים נמשכים אותו זמן. נגנו את הצד השני והשלימו נקישות עד שהם שווים.', 'kcConnections', 'A'],
      ['sameLength', 'שתי קבוצות מנגנות יחד: אחת את הצד השמאלי ואחת את הימני. אם אחת מסיימת קודם — חסרות פעימות.', 'interplay2024', 'A'],
      ['echoMatch', 'צד אחד הוא קריאה והצד השני הוא הד. ההד חייב להיות באורך הקריאה — כמה פעימות חסרות בהד?', 'kcLessons', 'R'],
    ],
    MULTIADD: [
      ['threeDrums', 'שלושה כלים מנגנים בתורם. מנו בלי לעצור מכלי לכלי — הספירה ממשיכה, לא מתחילה מחדש.', 'kcLessons', 'R'],
      ['tenFirst', 'חפשו שני מחוברים שיחד ממלאים תיבה של עשר פעימות, נגנו אותם קודם, ואז הוסיפו את השאר.', 'kcConnections', 'A'],
      ['songSections', 'שיר עם פתיחה, בית ופזמון: ספרו פעימות בכל חלק וחברו את כל החלקים — זה אורך השיר.', 'interplay2024', 'A'],
    ],
    TENS: [
      ['tensSong', 'שירו בעשרות: «עשר, עשרים, שלושים» — צליל אחד לכל קבוצה של עשר. כמה צלילים שרתם?', 'makingMusicCount', 'R'],
      ['bassTens', 'כל צליל בס הוא עשרת. נגנו בסים לעשרות הראשונות, ואז הוסיפו או הורידו בסים — ספרו בעשרות.', 'interplay2024', 'A'],
      ['tenStepJump', 'בסולם המספרים קפיצה של 10 היא קפיצה גדולה אחת למעלה או למטה. כמה קפיצות גדולות?', 'kcConnections', 'A'],
    ],
    SUB10: [
      ['silentBeats', 'נגנו את כל הפעימות, ואז השתיקו את אלה שהוסרו. ספרו רק את מה שעדיין נשמע.', 'kcLessons', 'R'],
      ['countBackDrum', 'התחילו מהמספר הגדול וספרו אחורה, נקישה אחת לכל מה שהורד. איפה עצרתם?', 'kcConnections', 'A'],
      ['tenBeatSplit', 'בתיבה של 10 פעימות, כמה חסר מהקטן כדי להגיע לגדול? מלאו בנקישות וספרו אותן — גם זה חיסור.', 'interplay2024', 'A'],
    ],
    SUB20: [
      ['backToTen', 'ירדו קודם עד 10 — עד סוף התיבה — ואז המשיכו להוריד את מה שנשאר. שתי ירידות קלות.', 'kcConnections', 'A'],
      ['silentBeats', 'נגנו את כל הפעימות, ואז השתיקו את אלה שהוסרו. ספרו רק את מה שעדיין נשמע.', 'kcLessons', 'R'],
      ['climbUp', 'חיסור כמו טיפוס בסולם: מהמספר הקטן עלו צעד־צעד עד הגדול, ומנו כמה צעדים עשיתם.', 'interplay2024', 'A'],
    ],
    NLINE: [
      ['lineScale', 'ישר המספרים הוא סולם: כל שנתה היא צליל אחד גבוה יותר. שירו מההתחלה עד המספר ועצרו שם.', 'kcConnections', 'A'],
      ['jumpTune', 'קפיצה ימינה היא חיבור והצליל עולה; קפיצה שמאלה היא חיסור והצליל יורד. הקשיבו לאן הלכתם.', 'interplay2024', 'A'],
      ['middleNote', 'האמצע של הישר הוא נקודת המנוחה של המנגינה. האם המספר לפני האמצע או אחריו? התחילו משם.', 'kcMath', 'A'],
    ],
    WORD_COLLECT: [
      ['storyDrum', 'הפכו את הסיפור לנגינה: תוף לכל אחד מהקבוצה הראשונה, משולש לכל אחד מהשנייה. ספרו את כולם.', 'kcPractice', 'R'],
      ['storySong', 'שירו את הסיפור בשתי שורות — שורה לכל קבוצה — והקישו לכל פריט. כמה הקשות בשיר כולו?', 'kcPractice', 'R'],
      ['joinBand', 'נגנים מצטרפים ללהקה: נגנו צליל לכל מי שהיה, והוסיפו צליל לכל מי שהצטרף. מנו את הלהקה.', 'interplay2024', 'A'],
    ],
    WORD_REMOVE: [
      ['storyMute', 'נגנו צליל לכל פריט שהיה בהתחלה, ואז השתיקו צליל לכל מה שהלך. מה עוד נשמע?', 'kcPractice', 'R'],
      ['leaveBand', 'נגנים עוזבים את הבמה אחד־אחד: ספרו אחורה בכל יציאה, ומה שנשאר על הבמה הוא התשובה.', 'interplay2024', 'A'],
      ['storyBack', 'שירו את הסיפור וספרו אחורה בקול, נקישה לכל פריט שהוסר. איפה הסתיימה הספירה?', 'kcPractice', 'R'],
    ],
    WORD_COMPARE: [
      ['twoLines', 'שתי שורות קצב, אחת לכל ילד, מנגנות יחד. כשאחת נגמרת, השנייה ממשיכה — ספרו כמה עוד.', 'kcPractice', 'R'],
      ['matchPairs', 'התאימו צליל מכאן לצליל משם, זוג אחרי זוג. הצלילים שנשארו בלי זוג הם ההפרש.', 'interplay2024', 'A'],
      ['longerSong', 'שני שירים — כמה פעימות ארוך יותר אחד מהשני? נגנו יחד ומנו רק את הפעימות של הסוף הנוסף.', 'kcMath', 'A'],
    ],
    GEO_SORT: [
      ['cornerTap', 'עברו עם האצבע על הצורה ונקשו בכל פינה. מספר הנקישות הוא מספר הקודקודים — וגם מספר הצלעות.', 'kcMath', 'A'],
      ['sideSong', 'שירו צליל אחד לכל צלע בזמן שמציירים אותה. כמה צלילים שרתם עד שחזרתם להתחלה?', 'kcLessons', 'R'],
      ['shapeRhythm', 'לכל צורה מקצב משלה: משולש — שלוש מחיאות, ריבוע — ארבע. מחאו את הצורה ומיינו לפי המקצב.', 'kcConnections', 'A'],
    ],
    RIGHT_ANGLE: [
      ['armsCorner', 'יד אחת למעלה ויד אחת הצידה, כמו מנצח בתחילת שיר — זו פינה ישרה. השוו אליה את הפינה בציור.', 'kcPractice', 'R'],
      ['quarterTurn', 'מסתובבים בריקוד רבע סיבוב בכל פעימה. רבע סיבוב הוא זווית ישרה; ארבעה כאלה מחזירים להתחלה.', 'kcLessons', 'R'],
      ['staffCorner', 'במקל המנצח ובשולי דף התווים יש פינות ישרות. בדקו בפינה של דף: מתאים? זו זווית ישרה.', 'kcMath', 'A'],
    ],
    LENGTH: [
      ['palmPipes', 'צינורות באורכים שונים נשמעים אחרת: הארוך נמוך והקצר גבוה. מדדו כל צינור בקוביות והשוו.', 'palmPipes', 'R'],
      ['stepBeats', 'מדדו את החדר בצעדים, צעד לכל פעימה בקצב קבוע. צעדים שווים הם יחידה שווה — כמו קוביות.', 'kcLessons', 'R'],
      ['xyloBars', 'בקסילופון כל לוחית קצרה מהקודמת. מדדו לוחיות בס״מ וסדרו מהארוכה לקצרה — מהנמוך לגבוה.', 'preshall', 'R'],
    ],
    CLOCK: [
      ['hourBell', 'פעמון שעון מצלצל פעם אחת לכל שעה. כשהמחוג הארוך על 12, הקשיבו לצלצולים וספרו אותם.', 'kcMath', 'A'],
      ['clockCircle', 'שבו במעגל כמו מספרי השעון, וכל ילד שר את המספר שלו. המחוג הקצר מצביע על מי שר עכשיו.', 'kcLessons', 'R'],
      ['songTime', 'השיר מתחיל בשעה עגולה: המחוג הארוך תמיד על 12, והקצר מראה איזו שעה. קראו קודם את הקצר.', 'kcMath', 'A'],
    ],
    PICTOGRAM: [
      ['pictoTap', 'נקשו פעם אחת על כל סמל בשורה, ואמרו את המספר בקול. כל סמל הוא נקישה אחת.', 'kcMath', 'A'],
      ['rowInstrument', 'לכל שורה כלי משלה: תוף לתפוחים, משולש לבננות. נגנו שורה־שורה — איזה כלי ניגן הכי הרבה?', 'kcConnections', 'A'],
      ['countSong', 'שירו שיר ספירה לאורך כל שורה, צליל לכל סמל. השורה עם השיר הארוך ביותר היא הגדולה.', 'makingMusicCount', 'R'],
    ],
    BARCHART: [
      ['barPitch', 'כל עמודה היא צליל: עמודה גבוהה — צליל גבוה. נגנו את העמודות ושמעו מי הכי גבוה.', 'interplay2024', 'A'],
      ['instrumentSurvey', 'ספרו כמה ילדים בחרו בכל כלי ובנו עמודות. קוראים עמודה לפי הקו שבו היא נגמרת.', 'kcMath', 'A'],
      ['stepUpBar', 'עלו בסולם צעד לכל משבצת בעמודה. כמה צעדים עד ראש העמודה? זה הערך שלה.', 'kcConnections', 'A'],
    ],
    CHART100: [
      ['lowTensClicks', 'בלוח המאה: צליל נמוך לכל עשרת ונקישה לכל יחידה. שמעו את הנמוכים קודם — הם הספרה השמאלית.', 'interplay2024', 'A'],
      ['rowBeat', 'כל שורה בלוח היא תיבה של 10 פעימות. ירידה שורה היא עוד תיבה — עוד עשרת שלמה.', 'kcConnections', 'A'],
      ['columnTune', 'כל המספרים בעמודה אחת נגמרים באותה ספרה, כמו פזמון שחוזר. מצאו את העמודה ואז את השורה.', 'kcMath', 'A'],
    ],
    PATTERN: [
      ['abRhythm', 'אמרו את הדגם בקול כמקצב — «תוף, פעמון, תוף, פעמון» — והמשיכו לנגן. מה מגיע אחרי?', 'kcConnections', 'A'],
      ['bodyPattern', 'הפכו את הדגם לתנועות: מחיאה, ברכיים, מחיאה, ברכיים. חזרו על היחידה החוזרת ומצאו את הבא.', 'makingMusicCount', 'R'],
      ['patternUnit', 'מצאו את היחידה שחוזרת — AB, AAB או ABC — ונגנו אותה שלוש פעמים. כמה איברים ביחידה?', 'kcLessons', 'R'],
    ],
    MONEY: [
      ['coinSounds', 'לכל מטבע צליל: 1 ₪ נקישה, 2 ₪ שתי נקישות, 5 ₪ מחיאה של יד שלמה. נגנו את המטבעות וספרו.', 'kcConnections', 'A'],
      ['shopSong', 'שירו את הקנייה: כמה שילמתי, כמה עלה, ונקשו מהמחיר עד הסכום ששילמתם — אלה העודף.', 'kcPractice', 'R'],
      ['bigCoinFirst', 'נגנו קודם את המטבע הגדול וספרו הלאה מהערך שלו — כמו ספירה הלאה בחיבור.', 'interplay2024', 'A'],
    ],
    NUMBER_LINE_APPROX: [
      ['middleNote', 'האמצע של הישר הוא נקודת המנוחה של המנגינה. האם המספר לפני האמצע או אחריו? התחילו משם.', 'kcMath', 'A'],
      ['tensLandmarks', 'כל עשרת על הישר היא צליל של פעמון. מצאו בין אילו שני פעמונים המספר, וקרוב לאיזה מהם.', 'interplay2024', 'A'],
      ['octaveJump', 'בישר 0–100 קפיצה של 10 היא קפיצה גדולה בסולם. קפצו בעשרות עד שעברתם, ואז חזרו מעט.', 'kcConnections', 'A'],
    ],
    POLY_CUT_A: [
      ['cornerTap', 'נקשו בכל פינה של כל חלק אחרי הגזירה. כמה נקישות לכל חלק? כך יודעים איזו צורה קיבלתם.', 'kcMath', 'A'],
      ['shapeChord', 'שתי צורות שמצמידים הן כמו שני צלילים שנשמעים יחד בצליל אחד חדש. ספרו את הפינות של הצורה החדשה.', 'kcConnections', 'A'],
      ['drumPieces', 'עור תוף מחולק לחלקים: הקישו על כל חלק בתורו וספרו כמה חלקים יש, ואז הרכיבו אותם בחזרה.', 'kcLessons', 'R'],
    ],
  };

  return { grade: 'א', ST: {}, items: [], music: music, sources: sources };
});
