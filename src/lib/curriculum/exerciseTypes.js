// MelodyMath — Ministry exercise types classification and verification (Refs #665 req 3, Refs #670).
(function (root, factory) {
  const api = factory((root && root.MM_CURRICULUM) || (typeof require === 'function' ? require('./../curriculum.js') : null), (root && root.MM_BANKS) || (typeof require === 'function' ? require('./../banks.js') : null));
  if (typeof module === 'object' && module.exports) module.exports = api; else root.MM_EXERCISE_TYPES = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (curriculum, banks) {
  'use strict';
  const EXERCISE_TYPES = Object.freeze(['direct', 'missing_addend', 'missing_factor', 'compare', 'word_problem', 'number_line', 'representation']);
  const TYPE_NAMES_HE = Object.freeze({ direct: 'חישוב ישיר ומנייה', missing_addend: 'מחובר חסר', missing_factor: 'גורם חסר', compare: 'השוואה', word_problem: 'שאלת מילים', number_line: 'ישר המספרים', representation: 'ייצוג ומודל' });
  function musicalMethodForTopic(tId) {
    const prog = typeof require === 'function' ? require('./progression.js') : (typeof globalThis !== 'undefined' && globalThis.MM_PROGRESSION);
    return (prog && prog.PREREQ && prog.PREREQ[tId] && prog.PREREQ[tId][1]) || 'rhythm and pitch scaffolding';
  }
  const RAW_TOPICS = [
    ["א","mm-cur-0","ספירה עד 100 קדימה ואחורה ממספר כלשהו",[["48, 49, ☐, 51. מה המספר החסר?",50,"missing_addend"],["השוו: 34 ☐ 43 (כתבו < או >)","<","compare"],["בספירה קדימה בעשרות: 20, 30, 40, ☐. מה הבא?",50,"number_line"]]], ["א","mm-cur-1","מנייה עד 100, קיבוץ ל־10",[["מה מכיל יותר: 3 קבוצות של 10 או 25 יחידות?","3 קבוצות של 10","compare"],["בכיתה 2 קבוצות של 10 טושים ועוד 4. כמה בסך הכל?",24,"word_problem"]]], ["א","mm-cur-2","ישר המספרים — מיקום מדויק ומקורב עד 100",[["על הישר מ־0 עד 20: 14, ☐, 16. מה באמצע?",15,"missing_addend"],["על הישר, מה קרוב יותר ל־20: 19 או 12?",19,"compare"],["ארנב קפץ מ־0 עד 10 ואז עוד 5 צעדים. לאן הגיע?",15,"word_problem"]]], ["א","mm-cur-3","חיבור וחיסור עד 20 (עשרת ראשונה, פירוקי 10, שוויון כאיזון)",[["13 + 5 = ?",18,"direct"],["14 + ☐ = 20. מהו המספר החסר?",6,"missing_addend"],["השוו: 15 + 3 ☐ 19 (כתבו < או >)","<","compare"]]],
    ["א","mm-cur-4","חיבור וחיסור בעשרות שלמות עד 100",[["היו 40 כדורים והוסיפו 30. כמה בסך הכל?",70,"word_problem"],["קפיצה של 30 קדימה מ־20 על הישר מגיעה אל:",50,"number_line"]]], ["א","mm-cur-5","קריאה וכתיבה של מספרים, לוח מאה, שם־מספר",[["בלוח המאה: שורה מתחת ל־25 היא ☐",35,"missing_addend"],["איזה מספר גדול יותר: 4 עשרות ו־2 או 2 עשרות ו־4?",42,"compare"],["שם המספר \"שלושים ושבע\" בספרות הוא:",37,"word_problem"]]], ["א","mm-cur-6","סדרות דגמים צורניים + יצירת סדרה",[["השלימו את הדגם: 🥁, 👏, 🥁, 👏, ☐. מה הבא?","🥁","missing_addend"],["דגם קבוע: נקישה ומחיאה. מה במקום ה־6?","מחיאה","word_problem"],["כמה פעמים מופיע 🥁 בדגם: 🥁, 👏, 🥁, 👏, 🥁?",3,"direct"]]], ["א","mm-cur-7","מצבי חיבור/חיסור מחיי יום־יום (איסוף, הוספה, הפרדה, גריעה)",[["לתמר 8 בלונים ולאסף 5. בכמה בלונים יותר?",3,"compare"],["לדנה 6 תפוחים. כמה חסרים לה כדי שיהיו 10?",4,"missing_addend"],["4 רקפות ועוד 5 כלניות. כמה פרחים פרחו בסך הכל?",9,"direct"]]],
    ["א","mm-cur-8","מיון מצולעים, קודקוד וצלע, פירוק והרכבה",[["למי יש יותר קודקודים: למשולש או למרובע?","מרובע","compare"],["למצולע 3 קודקודים. כמה צלעות יש לו? (☐)",3,"missing_addend"],["שירה בנתה משולש מ־3 קיסמים וריבוע מ־4. כמה יחד?",7,"word_problem"]]], ["א","mm-cur-9","מדידת אורך (מתווך, ס״מ, סרגל)",[["עיפרון 12 ס״מ ומחק 4 ס״מ. בכמה ארוך יותר?",8,"compare"],["סרט 6 ס״מ חובר לאחר והסך 10 ס״מ. מה אורך השני?",4,"missing_addend"],["שולחן 5 מחברות ומדף 3 מחברות. כמה מחברות יחד?",8,"word_problem"]]], ["א","mm-cur-10","שעון אנלוגי בשעות שלמות",[["איזו שעה מאוחרת יותר: 3:00 או 5:00?","5:00","compare"],["השעה עכשיו 2:00. בעוד כמה שעות תהיה 6:00?",4,"missing_addend"],["ההצגה החלה ב־4:00 ונמשכה שעה. מתי הסתיימה?","5:00","word_problem"]]], ["א","mm-cur-11","כסף — מטבעות וסכומים",[["מה שווה יותר: מטבע 10 ₪ או מטבע 5 ₪?","10 ₪","compare"],["מחברת עולה 10 ₪. לאילן יש 7 ₪. כמה חסרים?",3,"missing_addend"]]],
    ["א","mm-cur-12","דיאגרמת עמודות ופיקטוגרם",[["בדיאגרמה: 6 בחרו תוף ו־4 חליל. בכמה יותר בתוף?",2,"compare"],["בדיאגרמה סך הכל 10: 7 פסנתר, כמה כינור?",3,"missing_addend"]]], ["ב","mm-cur-13","מספרים עד 1,000, מבנה עשרוני, זוגי/אי־זוגי",[["3 מאות, 4 עשרות ו־5 ספרים. כמה ספרים בסך הכל?",345,"word_problem"]]], ["ב","mm-cur-15","שליטה בכפולות 2, 4, 5, 10",[["4 × ☐ = 20. מהו המספר החסר?",5,"missing_factor"],["בספירה בדילוגים של 5: 5, 10, 15, ☐. מה הבא?",20,"number_line"],["בכל מארז 5 פעמונים. כמה פעמונים ב־4 מארזים?",20,"word_problem"]]], ["ב","mm-cur-16","חילוק לחלקים ולהכלה על אותם מספרים",[["18 : ☐ = 9. מהו המספר החסר?",2,"missing_factor"],["חילקו 20 אגוזים ל־4 ילדים בשווה. כמה לכל אחד?",5,"word_problem"]]],
    ["ב","mm-cur-17","פירוק והרכבה של מצולעים; זווית ישרה",[["במלבן 4 זוויות ישרות. נספרו 3, כמה נותרו? (☐)",1,"missing_addend"],["חיברו 2 משולשים ישרי־זווית למלבן. כמה זוויות ישרות בו?",4,"word_problem"]]], ["ב","mm-cur-18","ס״מ, היקף, חצאי שעות",[["משולש שווה־צלעות עם צלעות של 5 ס״מ. מה היקפו? (5+5+5=☐)",15,"missing_addend"],["היקף ריבוע 20 ס״מ. מה אורך כל צלע? (4 × ☐ = 20)",5,"missing_factor"],["השוו: היקף ריבוע עם צלע 4 ס״מ ☐ היקף משולש עם צלע 5 ס״מ",">","compare"]]], ["ב","mm-cur-19","כסף — סכום בשטרות ובמטבעות, קנייה ועודף",[["מה שווה יותר: שטר של 50 ₪ או 4 מטבעות של 10 ₪?","50 ₪","compare"]]], ["ב","mm-cur-20","נפח תיבות — מנייה של קוביות",[["2 שכבות של 6 קוביות. נוסיף עוד שכבה של ☐ ל־18?",6,"missing_addend"]]],
    ["ג","mm-cur-22","מספרים עד 10,000, מבנה עשרוני",[["4 אלפים, 2 מאות ועוד 5 ספרים. כמה בסך הכל?",4205,"word_problem"]]], ["ג","mm-cur-23","חיבור/חיסור במאוזן ובמאונך עד רבבה",[["3,200 צופים ועוד 800. כמה בסך הכל?",4000,"word_problem"]]], ["ג","mm-cur-25","חילוק עם שארית; כפל/חילוק ב־10, 100, 1,000",[["70 × ☐ = 700. מהו המספר החסר?",10,"missing_factor"],["250 : 10 = ?",25,"direct"],["23 : 5 = 4 (שארית ☐). מהי השארית?",3,"missing_addend"],["השוו: 400 : 10 ☐ 4 × 10","=","compare"]]], ["ג","mm-cur-26","שאלות השוואה כפליות ודו־שלביות",[["השוו: פי 4 מ־6 ☐ פי 3 מ־8","=","compare"],["המספר 35 גדול פי 5 מהמספר ☐",7,"missing_factor"],["כמה הוא פי 6 מ־8?",48,"direct"]]],
    ["ג","mm-cur-28","שטח מלבן; שעות ודקות",[["שטח 24 סמ״ר, צלע 6 ס״מ. מה השנייה? (6 × ☐ = 24)",4,"missing_factor"],["השוו: מלבן 4×5 ס״מ ☐ מלבן 3×7 ס״מ","<","compare"],["שטיח באורך 5 מ׳ ורוחב 3 מ׳. מה שטחו במ״ר?",15,"word_problem"]]], ["ג","mm-cur-29","כסף — המרה בין שקלים לאגורות ולעשרות אגורות",[["מה שווה יותר: 500 אגורות או 6 שקלים?","6 שקלים","compare"]]], ["ד","mm-cur-32","שבר כחלק משלם — 1/2, 1/4, 1/8 מול תיבה 4/4",[["השוו: איזה תו ממלא יותר מתיבה: 1/2 או 3/8?",">","compare"],["יונתן ניגן 1/2 תיבה ודניאל 1/4 תיבה. מה נשאר ריק?","1/4","word_problem"],["על ישר מקצב מ־0 עד 1: מה בדיוק באמצע?","1/2","number_line"]]], ["ד","mm-cur-34","מקבילים, מאונכים, מרובעים, שטח פנים",[["למלבן היקף 30 ס״מ וצלע 10 ס״מ. מה השנייה? (☐)",5,"missing_addend"],["גינה מלבנית 8 מ׳ על 5 מ׳. מה שטח הגינה במ״ר?",40,"word_problem"],["באיזה מרובע כל הצלעות שוות והזוויות ישרות? (ריבוע/מעוין)","ריבוע","representation"]]],
    ["ד","mm-cur-35","יחידות אורך; זמן בלוח עברי/לועזי",[["מה ארוך יותר: 2 ק״מ או 1,800 מטרים?","2 ק״מ","compare"],["3 מטרים ו־40 ס״מ = ☐ ס״מ",340,"missing_addend"],["האימון החל ב־14:00 ונמשך שעה וחצי. מתי הסתיים?","15:30","number_line"]]], ["ד","mm-cur-36","כסף — חישובי קנייה ועודף",[["מה עולה יותר: 4 מחברות ב־12 ₪ או תיק ב־50 ₪?","תיק ב־50 ש״ח","compare"],["ספר עולה 35 ₪ ושילמנו 50 ₪. כמה עודף קיבלנו? (☐)",15,"missing_addend"]]], ["ה","mm-cur-41","הרחבה, צמצום והשוואה של שברים",[["הרחיבו פי 3: 2/5 = ☐/15 (מהו המונה החסר?)",6,"missing_factor"],["יואב צמצם 12/16 וקיבל 3/4. באיזה מספר חילק?",4,"word_problem"]]], ["ה","mm-cur-45","שברים עשרוניים: ערך מקום, השוואה, מעבר משבר פשוט",[["0.7 + ☐ = 1","0.3","missing_addend"],["בקבוק 0.75 ליטר. כמה חסר ל־1 ליטר?","0.25","word_problem"],["על הישר בין 0 ל־1: מה בדיוק באמצע?","0.5","number_line"]]],
    ["ה","mm-cur-47","משולשים, גובה, שטח משולש ומקבילית",[["שטח משולש 20 סמ״ר ובסיס 8 ס״מ. מה הגובה? (☐)",5,"missing_factor"],["מקבילית עם בסיס 10 ס״מ וגובה 6 ס״מ. מה השטח בסמ״ר?",60,"word_problem"],["באיזה משולש כל הזוויות חדות? (חד־זוויות / ישר / קהה)","חד־זוויות","representation"]]], ["ה","mm-cur-48","גופים: פירמידות ישרות ומנסרות ישרות — פריסות, פאות, קודקודים ומקצועות",[["לפירמידה מרובעת 5 קודקודים ו־5 פאות. כמה מקצועות? (☐)",8,"missing_addend"],["למי יש יותר פאות: למנסרה משולשת או לפירמידה משולשת?","למנסרה משולשת","compare"],["מנסרה משושה מעץ: כמה קודקודים יש לה בסך הכל?",12,"word_problem"]]], ["ו","mm-cur-50","מספרים טבעיים ו־0; סדר פעולות",[["12 + 4 × 3 = ?",24,"direct"],["5 × (4 + ☐) = 45. מהו המספר החסר?",5,"missing_addend"],["השוו: (6 + 2) × 3 ☐ 6 + 2 × 3",">","compare"]]], ["ו","mm-cur-51","כפל וחילוק שברים",[["2/3 × 3/4 = ?","1/2","direct"],["1/2 × ☐ = 1/4. מהו המספר החסר?","1/2","missing_factor"],["דני לקח חצי מתוך 3/4 ק״ג קמח. כמה ק״ג לקח?","3/8","word_problem"]]],
    ["ו","mm-cur-52","כפל וחילוק שברים עשרוניים",[["0.4 × 0.2 = ?","0.08","direct"],["0.5 × ☐ = 0.25. מהו המספר החסר?","0.5","missing_factor"],["מחברת עולה 2.5 ₪. כמה יעלו 4 מחברות כאלה?",10,"word_problem"]]], ["ו","mm-cur-53","אחוזים",[["מהם 25% מתוך 80?",20,"direct"],["20 מתוך 100 הם ☐%",20,"missing_addend"],["השוו: 50% מתוך 40 ☐ 25% מתוך 100","<","compare"]]], ["ו","mm-cur-54","מעגל ועיגול: היקף ושטח",[["קוטר מעגל 10 ס״מ (π = 3.14). מה היקפו בס״מ?","31.4","direct"],["רדיוס מעגל 5 ס״מ. מהו הקוטר בס״מ? (5 × 2 = ☐)",10,"missing_factor"],["בריכה עגולה ברדיוס 3 מ׳. מה היקפה לפי π=3.14?","18.84","word_problem"]]], ["ו","mm-cur-55","מצולעים מורכבים",[["צורה משני מלבנים: 2×3 ו־4×5. מה שטחה הכולל?",26,"direct"],["שטח מצולע 30 סמ״ר ומורכב משטח 20 סמ״ר ועוד ☐ סמ״ר",10,"missing_addend"],["השוו: שטח מצולע מורכב 35 סמ״ר ☐ שטח ריבוע 6×6 סמ״ר","<","compare"]]],
    ["ו","mm-cur-56","נפח",[["נפח תיבה בממדים 3×2×4 ס״מ?",24,"direct"],["נפח תיבה 60 סמ״ק ובסיס 20 סמ״ר. מה הגובה? (20 × ☐ = 60)",3,"missing_factor"],["מה מכיל נפח גדול יותר: 2 ליטר או 1,500 סמ״ק?","2 ליטר","compare"]]], ["ו","mm-cur-57","ממוצע",[["מה הממוצע של המספרים 10, 20 ו־30?",20,"direct"],["הממוצע של שני ציונים הוא 80. ציון אחד 70, מה השני? (70 + ☐ = 160)",90,"missing_addend"],["דני קלע 4, 6 ו־8 נקודות ב־3 משחקים. מה ממוצע הנקודות?",6,"word_problem"]]], ["ו","mm-cur-58","קריאה והצגה של נתונים",[["בטבלת נתונים 12 תלמידים אוהבים תופים ו־8 חליל. כמה סך הכל?",20,"direct"],["בדיאגרמה: 15 בחרו שירה ו־10 נגינה. מה נבחר יותר?","שירה","compare"],["בסקר נאספו 30 קולות: 18 בעד, כמה הצביעו נגד?",12,"word_problem"]]],
  ];
  const GRADE_DATA = { 'א': [], 'ב': [], 'ג': [], 'ד': [], 'ה': [], 'ו': [] };
  RAW_TOPICS.forEach(function (r) {
    r[3].forEach(function (it) {
      GRADE_DATA[r[0]].push({ topicId: r[1], topic: r[2], prompt: it[0], answer: it[1], hint: '', exerciseType: it[2], musicStage: 'post_music_check', musicalMethod: musicalMethodForTopic(r[1]) });
    });
  });
  function classifyExerciseType(it) {
    if (!it || typeof it !== 'object') return 'direct';
    if (it.exerciseType && EXERCISE_TYPES.includes(it.exerciseType)) return it.exerciseType;
    const p = String(it.prompt || '');
    if (/[×*·]\s*☐|☐\s*[×*·]|גורם חסר/.test(p) || it.exerciseType === 'missing_factor') return 'missing_factor';
    if (it.wordType || it.skill === 'word_problems' || /היו|נשארו|קנינו|לכיתה|ספרים|תפוחים|מדבקות|בסלסילה|על המדף|ילדים|בלונים|שילם|חסכה|עודף/.test(p)) return 'word_problem';
    if (it.widget === 'numberLine' || it.line || it.skill === 'number_line' || /ישר המספרים|קפיצ/.test(p)) return 'number_line';
    if (/☐|\?.*\+|\+.*\?|חסר|השלם|מחובר/.test(p)) return 'missing_addend';
    if (/[><=]|השוו|גדול|קטן|שווה|בכמה|פי כמה|לעומת|מול|האם.*שווים|יותר.*מ|פחות.*מ/.test(p)) return 'compare';
    if (it.chart || it.clock || it.ruler || /לוח המאה|סדרות|דגם|צורות|מצולע|שעון|סרגל|מדיד|מטבע|פיקטוגרם|דיאגרמ/.test(p)) return 'representation';
    return 'direct';
  }
  function itemsForTopic(grade, topicIdentifier, providedItems) {
    const list = Array.isArray(providedItems) ? providedItems : (banks && banks.itemsForGrade ? banks.itemsForGrade(grade) : []);
    const supp = (GRADE_DATA[grade] || []).filter(function (it) { return it.topicId === topicIdentifier || it.topic === topicIdentifier; });
    const curr = curriculum || (typeof globalThis !== 'undefined' && globalThis.MM_CURRICULUM);
    if (!curr || !curr.MATRIX) return supp;
    const targetRow = curr.MATRIX.find(function (r) { return r.grade === grade && (r.topicId === topicIdentifier || r.topic === topicIdentifier); });
    if (!targetRow) return supp;
    const matchedBank = list.filter(function (it) { const s = curr.sectionForItem(it); return s && s.topic === targetRow.topic; });
    return matchedBank.concat(supp);
  }
  function typesForTopic(grade, topicIdentifier, providedItems) {
    const set = new Set();
    itemsForTopic(grade, topicIdentifier, providedItems).forEach(function (it) { set.add(classifyExerciseType(it)); });
    return Array.from(set);
  }
  function allExercisesForGrade(grade, providedItems) {
    const list = Array.isArray(providedItems) ? providedItems : (banks && banks.itemsForGrade ? banks.itemsForGrade(grade) : []);
    return list.concat(GRADE_DATA[grade] || []);
  }
  function verifyGradeTopics(grade, providedItems) {
    const curr = curriculum || (typeof globalThis !== 'undefined' && globalThis.MM_CURRICULUM);
    if (!curr || !curr.MATRIX) return { grade: grade, allPass: false, topics: [] };
    const gradeRows = curr.MATRIX.filter(function (r) { return r.grade === grade; });
    let allPass = true;
    const results = gradeRows.map(function (row) {
      const types = typesForTopic(grade, row.topicId || row.topic, providedItems);
      const pass = types.length >= 3;
      if (!pass) allPass = false;
      return { topicId: row.topicId, topic: row.topic, types: types, count: types.length, pass: pass };
    });
    return { grade: grade, allPass: allPass, totalTopics: gradeRows.length, passedTopics: results.filter(function (r) { return r.pass; }).length, topics: results };
  }
  return { EXERCISE_TYPES, TYPE_NAMES_HE, GRADE_DATA, classifyExerciseType, itemsForTopic, typesForTopic, allExercisesForGrade, verifyGradeTopics, musicalMethodForTopic };
});
