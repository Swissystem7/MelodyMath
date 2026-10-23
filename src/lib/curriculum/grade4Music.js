// MelodyMath — learning each grade ד׳ standard THROUGH music (#591, #596).
// Grade ד׳ items live in banks.js; this file only brings the musical ways of
// solving them, the same shape as `music` and `sources` in grade6.js, and
// banks.js gives every ד׳ item without a music activity the way of its level.
// Pages load this file before banks.js.
//
// `sources` are the research behind the ways, from the research map pasted in
// #591 (23.10.2026), with the same labels: D = part of an evaluated
// maths-learning intervention (a package of activities, not this one alone),
// R = a reputable instructional source supports the connection, A = an
// adaptation of a documented music–maths relationship whose effect on this
// topic was not tested on its own. Nothing here claims more than its label.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_GRADE4_MUSIC = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const sources = {
    azaryahu2020: ['Azaryahu et al. 2020 — MusiMath and Academic Music', 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7378943/'],
    interplay2024: ['Interplay between music and mathematics (Humanit. Soc. Sci. Commun., 2024)', 'https://www.nature.com/articles/s41599-024-03631-z'],
    kcConnections: ['Kennedy Center — Connections: Math and Music', 'https://www.kennedy-center.org/education/resources-for-educators/classroom-resources/media-and-interactives/media/music/connections/connections/math--music/'],
    kcMath: ['Kennedy Center — math collection', 'https://www.kennedy-center.org/education/resources-for-educators/classroom-resources/collections/collections/math/'],
    kcLessons: ['Kennedy Center — lessons and activities', 'https://www.kennedy-center.org/education/resources-for-educators/classroom-resources/lessons-and-activities/'],
    wnetMathInMusic: ['WNET/THIRTEEN — Get the Math: Math in Music', 'https://www.thirteen.org/get-the-math/teachers/teachers-math-in-music-activities/76/'],
    palmPipes: ['Exploratorium — Palm Pipes', 'https://www.exploratorium.edu/snacks/palm-pipes'],
    whitehead: ['Exploratorium — instrument builder Peter Whitehead', 'https://annex.exploratorium.edu/music/movies/peterWhitehead_Low.html'],
    preshall: ['Preservation Hall Foundation — Music and Math', 'https://lessons.preshallfoundation.org/lesson/music-and-math/'],
  };

  // Bank standard key → ways, one per level (1, 2, 3). A way is [music tag,
  // how to solve it with music (Hebrew; never the answer of an item), source
  // id, evidence label].
  const music = {
    NUM_MILLION: [
      ['placeDrums', 'כל כלי הוא מקום: שייקר ליחידות, תוף לעשרות, מצילה למאות. נגנו מספר כלי אחרי כלי — וכך שומעים את ערך הספרה.', 'kcConnections', 'A'],
      ['placeScore', 'כתבו את המספר כפרטיטורה: שורה לכל מקום, מהגבוה לנמוך. משווים מלמעלה — השורה הראשונה ששונה מכריעה.', 'interplay2024', 'A'],
      ['roundToBar', 'עיגול הוא לקפוץ לתיבה הקרובה: האם עברנו את אמצע התיבה? אם כן — לתיבה הבאה, ואם לא — חוזרים לתחילתה.', 'azaryahu2020', 'A'],
    ],
    ADD_SUB_MILLION: [
      ['beatCarry', 'מנו פעימות בקבוצות של 10: כשקבוצה מתמלאת מכים במצילה ומתחילים מחדש — זה ההמרה במאונך, עמודה אחרי עמודה.', 'kcConnections', 'A'],
      ['playlistSum', 'חברו את אורכי השירים ברשימת השמעה: עגלו קודם כדי לחזות, ואז חשבו במאונך ובדקו שהתוצאה קרובה לאומדן.', 'wnetMathInMusic', 'R'],
      ['songGap', 'כמה חסר עד סוף השיר? ספרו קדימה מהמקום שבו עצרתם עד הסוף בקפיצות עגולות — חיסור כהשלמה.', 'wnetMathInMusic', 'A'],
    ],
    MUL_DIV_VERT: [
      ['barGroups', 'כפל הוא תיבות זהות: נגנו תיבה של כמה פעימות שוב ושוב ומנו את הכול. כמה תיבות × פעימות בתיבה = סך הפעימות.', 'azaryahu2020', 'D'],
      ['meterSplit', 'חילוק הוא לחלק פעימות לתיבות שוות: כמה תיבות שלמות יוצאות, והאם נשארות פעימות בחוץ? השארית נשמעת.', 'kcConnections', 'A'],
      ['accentEvery', 'שמרו פעימה קבועה והדגישו כל פעימה שלישית: אם הפעימה האחרונה מודגשת — המספר מתחלק ב־3. כך בודקים התחלקות.', 'kcLessons', 'R'],
    ],
    ORDER_OPS: [
      ['repeatSign', 'סימן חזרה חל רק על מה שבתוכו: מוטיב בתוך החזרה מתנגן כמה פעמים, והפתיחה שלפניה רק פעם אחת — כמו כפל לפני חיבור.', 'kcMath', 'A'],
      ['bracketPhrase', 'סוגריים הם משפט מוזיקלי שחוזר כולו: נגנו (A ואז B) כמה פעמים, ואחר כך A ואז B כמה פעמים — ושמעו שהאורך שונה.', 'kcMath', 'A'],
      ['songRecipe', 'ציירו את מבנה השיר לפי התרגיל לפני שמחשבים: מה חוזר ומה מתנגן פעם אחת. רק אז מנו את הפעימות.', 'interplay2024', 'A'],
    ],
    FRAC_BAR: [
      ['noteValues', 'תיבה של 4/4 היא השלם: נגנו תו שלם, ואז חצאים, רבעים ושמיניות שממלאים אותה. כמה תווים כאלה ממלאים תיבה?', 'azaryahu2020', 'D'],
      ['barFill', 'ציירו את התיבה כפס, צבעו את החלק שמתנגן ומנו כמה חלקים שווים יש בכל התיבה — ביצוע, ציור ואז שבר.', 'azaryahu2020', 'D'],
      ['clapHalves', 'מחאו פעם אחת לכל תיבה, אחר כך פעמיים, ארבע ושמונה. ככל שמוחאים יותר — כל חלק קצר יותר.', 'azaryahu2020', 'D'],
    ],
    FRAC_OF_QTY: [
      ['ensembleShare', 'בלהקה כמה נגנים: מחלקים אותם לקבוצות שוות לפי המכנה, וחלק מהקבוצות מנגן. מנו את הנגנים שמנגנים.', 'kcConnections', 'A'],
      ['loopSlots', 'בלולאת תופים יש משבצות: חלקו אותן לחלקים שווים לפי המכנה, והפעילו רק את החלקים שבמונה. כמה משבצות נשמעות?', 'azaryahu2020', 'A'],
      ['beatsOfSong', 'חלק מהשיר הוא פזמון: חלקו את פעימות השיר לחלקים שווים וקחו כמה מהם. בדקו בניגון שהאורך מתאים.', 'interplay2024', 'A'],
    ],
    FRAC_NAMES: [
      ['equalDurations', 'חצי ושני רבעים נמשכים אותו זמן: נגנו את שניהם על אותה פעימה ושמעו שהם נגמרים יחד — שמות שונים לאותו שבר.', 'azaryahu2020', 'D'],
      ['barCompare', 'ציירו שתי תיבות זו מעל זו, חלקו כל אחת לפי מכנה אחר וצבעו. איזה חלק ארוך יותר? מכנה גדול — חלק קצר.', 'azaryahu2020', 'D'],
      ['pipeLength', 'צינור ארוך נשמע נמוך וקצר נשמע גבוה: חתכו צינורות לחצי, שליש ורבע ושמעו מי הארוך ביותר.', 'palmPipes', 'R'],
    ],
    FRAC_ADD_D: [
      ['barFill', 'חיבור שברים הוא מילוי תיבה: נגנו רבע ועוד רבע — כמה רבעים יש? המכנה נשאר, רק מספר התווים משתנה.', 'azaryahu2020', 'D'],
      ['noteSwap', 'כשהמכנים שונים, פרטו את התו הארוך לקצרים: חצי הוא שני רבעים. אחר כך אפשר לחבר רבעים לרבעים.', 'azaryahu2020', 'D'],
      ['restTake', 'חיסור הוא להפוך תווים להפסקות: מתחילים בתיבה מנוגנת, משתיקים כמה תווים ומונים מה עוד נשמע.', 'azaryahu2020', 'A'],
    ],
    UNITS: [
      ['pipeRuler', 'בנו כלי מצינורות: מדדו כל צינור בס״מ ובמטרים לפני החיתוך, והמירו — יחידה גדולה היא הרבה קטנות.', 'palmPipes', 'R'],
      ['instrumentWeigh', 'שקלו כלי נגינה קטנים בגרם וגדולים בק״ג. מה מתאים לאיזה כלי? המירו כדי להשוות ביניהם.', 'whitehead', 'A'],
      ['bottleTones', 'מלאו בקבוקים במים במ״ל שונים והקישו: כל כמות נשמעת אחרת. המירו מ״ל לליטר כדי לדעת כמה מים מזגתם.', 'kcLessons', 'R'],
    ],
    CALENDAR: [
      ['weekRhythm', 'כל יום בשבוע הוא פעימה, והשבוע הוא תיבה שחוזרת. נגנו כמה שבועות ומנו את הפעימות — כפל של ימים.', 'kcConnections', 'A'],
      ['songCalendar', 'לוח חזרות לקונצרט: סמנו את ימי החזרות על לוח שנה ומנו כמה שבועות וחודשים עוברים עד ההופעה.', 'wnetMathInMusic', 'A'],
      ['seasonSongs', 'שיר לכל חודש בשנה: סדרו אותם במעגל, וקפצו קדימה ואחורה כדי לדעת איזה חודש יגיע אחרי זמן מסוים.', 'interplay2024', 'A'],
    ],
    MONEY: [
      ['ticketChange', 'קונים כרטיס להופעה: ספרו מהמחיר קדימה עד הסכום ששילמתם, בקפיצות עגולות. הספירה היא העודף.', 'wnetMathInMusic', 'A'],
      ['coinBeats', 'שקל הוא תיבה ואגורה היא פעימה קטנה בתוכה: המרה בין שקלים לאגורות היא כמו מניית פעימות בתיבות.', 'azaryahu2020', 'A'],
      ['bandBudget', 'תקציב ללהקה: מיתרים, מקלות ותווים. חברו את המחירים, השוו לתקציב והחליטו מה אפשר לקנות.', 'kcLessons', 'R'],
    ],
    PARALLEL: [
      ['staffLines', 'קווי החמשה הם ישרים מקבילים — אף פעם לא נפגשים. קו התיבה חוצה אותם בזווית ישרה — הוא מאונך.', 'interplay2024', 'A'],
      ['stringFrets', 'בגיטרה המיתרים מקבילים זה לזה והסריגים מאונכים להם. חפשו בכלי עוד זוגות של קווים כאלה.', 'whitehead', 'A'],
    ],
    QUAD_SORT: [
      ['drumShapes', 'מיינו כלי הקשה לפי הצורה: צלעות שוות? זוויות ישרות? תופים ופעמונים בצורת מרובעים שונים, לפי התכונות.', 'kcConnections', 'A'],
      ['danceSquare', 'ריקוד בארבע פינות: צעדו מרובע לפי המוזיקה — צלעות שוות או לא, פינות ישרות או לא — ואמרו את שמו.', 'kcLessons', 'R'],
      ['diagonalSteps', 'ברחבת הריקוד צעדו מפינה לפינה שממול לפי הקצב: כל צעד כזה הוא אלכסון. מנו כמה מסלולים כאלה יש.', 'kcLessons', 'A'],
    ],
    BOX: [
      ['speakerBox', 'רמקול הוא תיבה: געו בכל פאה והקישו עליה פעם אחת, אחר כך החליקו על כל מקצוע. מנו בקצב כדי לא לפספס.', 'whitehead', 'A'],
      ['cajonTaps', 'קחון הוא תוף בצורת תיבה: הקישו בכל פינה שלו בתורה ומנו את הקודקודים בקול, בקצב קבוע.', 'whitehead', 'A'],
      ['boxDrumBuild', 'בנו תוף מקרטון בצורת קובייה: סמנו כל פאה בצבע לפני ההדבקה, וכך רואים מה שוות ומה ממול.', 'kcLessons', 'R'],
    ],
    BOX_AREA: [
      ['drumSkin', 'כמה קרטון צריך לתוף בצורת תיבה? חשבו את שטח כל פאה כמלבן, וחברו את כל הפאות — זה שטח הפנים.', 'whitehead', 'A'],
      ['cajonPanels', 'פאות ממול שוות בתיבה: בבניית קחון חותכים כל לוח פעמיים. חשבו לוח אחד והכפילו לפני שמחברים.', 'whitehead', 'A'],
      ['speakerWrap', 'עוטפים רמקול בבד: פרשו את התיבה לרשת של מלבנים, חשבו כל אחד וחברו. כך יודעים כמה בד לקנות.', 'kcLessons', 'A'],
    ],
    TABLE: [
      ['practiceLog', 'טבלת אימון נגינה: כמה דקות כל יום. קראו שורה, חברו שורות והשוו ימים — ונגנו פעימה לכל חמש דקות.', 'wnetMathInMusic', 'A'],
      ['songSurvey', 'סקר שירים אהובים בכיתה: רשמו בטבלה כמה בחרו בכל שיר, וענו מה הפופולרי ובכמה הוא מקדים את השני.', 'kcLessons', 'R'],
      ['tempoTable', 'טבלת שירים וקצבים: איזה שיר הכי מהיר ומה ההפרש בין שניים? נגנו את שניהם ושמעו שהטבלה צודקת.', 'wnetMathInMusic', 'A'],
    ],
    BARCHART: [
      ['loudBars', 'כל עמודה היא כלי, והגובה הוא כמה פעמים הוא מתנגן. נגנו לפי הדיאגרמה — עמודה גבוהה נשמעת יותר.', 'interplay2024', 'A'],
      ['equalizer', 'באקולייזר כל עמודה היא תדר והגובה הוא העוצמה. קראו את הגובה לפי הקווים ברקע והשוו בין עמודות.', 'wnetMathInMusic', 'A'],
      ['beatGraph', 'ספרו את פעימות כל שיר בחצי דקה, ציירו עמודה לכל שיר והשוו: בכמה עמודה אחת עולה על אחרת?', 'wnetMathInMusic', 'R'],
    ],
    PIE: [
      ['songFormPie', 'שיר מחולק לבית, פזמון וסיום: ציירו אותו כעוגה. החלק הארוך ביותר בשיר הוא הפרוסה הגדולה.', 'interplay2024', 'A'],
      ['clockBar', 'תיבה של 4/4 כעוגה: כל רבע הוא פרוסה. נגנו ושמעו — פרוסה של חצי היא שני רבעים.', 'azaryahu2020', 'D'],
      ['bandPie', 'עוגת הלהקה: כמה מהנגנים על תופים, גיטרות ושירה. מצאו כמה נגנים יש בכל פרוסה מתוך כל הלהקה.', 'preshall', 'R'],
    ],
  };

  return { grade: 'ד', music: music, sources: sources };
});
