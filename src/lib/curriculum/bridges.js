// MelodyMath — Curriculum progression bridge exercises (Refs #665 req 5, Task R2).
//
// For every topic in progression.js with buildsTo, a bridge exercise at the start
// of the next topic reuses the earlier topic's musical mechanism with the new math.
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_BRIDGES = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // [fromTopicId, toTopicId, musicalMechanism, prompt, answer, hint]
  const RAW_BRIDGES = [
    // mm-cur-0
    ['mm-cur-0', 'mm-cur-1', 'steady beat', '10 פעימות קצובות בתוף יוצרות עשרת אחת: כמה פעימות יש בעשרת אחת?', 10, 'עשרת אחת שווה בדיוק 10 פעימות'],
    ['mm-cur-0', 'mm-cur-2', 'steady beat', 'כל צעד על הישר נשמע בפעימה: מ־0 עד 7, כמה פעימות שמענו?', 7, 'סופרים 7 צעדים מהאפס'],
    ['mm-cur-0', 'mm-cur-15', 'steady beat', 'בספירה בדילוגי 2 מדגישים כל פעימה שנייה: כמה פעמות מודגשות ב־6 פעימות?', 3, 'מדגישים ב־2, 4, 6'],
    // mm-cur-1
    ['mm-cur-1', 'mm-cur-3', 'beats in tens', 'עשרת אחת של 10 פעימות ועוד 4 פעימות בודדות: כמה פעימות בסך הכל?', 14, '10 ועוד 4'],
    ['mm-cur-1', 'mm-cur-5', 'beats in tens', 'בלוח המאה שורה שלמה היא עשרת: כמה משבצות יש ב־3 שורות שלמות?', 30, '3 עשרות הן 30'],
    ['mm-cur-1', 'mm-cur-12', 'beats in tens', 'בפיקטוגרם כל תו שווה 10 פעימות: כמה פעימות מייצגים 2 תווים?', 20, '2 עשרות שוות 20'],
    ['mm-cur-1', 'mm-cur-13', 'beats in tens', '10 עשרות של פעימות יוצרות מאה אחת: כמה עשרות יש ב־100?', 10, 'מאה אחת מורכבת מ־10 עשרות'],
    // mm-cur-2
    ['mm-cur-2', 'mm-cur-3', 'steps on line', 'צועדים על הישר מ־5 קדימה 4 צעדים בצליל: לאיזה מספר מגיעים?', 9, '5 ועוד 4'],
    // mm-cur-3
    ['mm-cur-3', 'mm-cur-4', 'joining beats', 'אם 2 פעימות ועוד 3 פעימות הן 5, כמה הן 2 עשרות ועוד 3 עשרות?', 50, '20 ועוד 30'],
    ['mm-cur-3', 'mm-cur-7', 'joining beats', 'היו 8 צלילים בתוף ונוספו עוד 5 צלילי פעמון: כמה צלילים נוגנו בסך הכל?', 13, '8 ועוד 5'],
    ['mm-cur-3', 'mm-cur-11', 'joining beats', 'מטבע של 5 ש״ח ועוד מטבע של 10 ש״ח: כמה שקלים יש בסך הכל?', 15, '5 ועוד 10'],
    // mm-cur-5
    ['mm-cur-5', 'mm-cur-4', 'hundred chart tens', 'יורדים שתי שורות בלוח המאה מ־40: לאיזה מספר מגיעים?', 60, 'כל שורה למטה מוסיפה 10'],
    ['mm-cur-5', 'mm-cur-13', 'hundred chart tens', 'לוח מאה שלם הוא 100. כמה לוחות כאלה צריך כדי להגיע ל־400?', 4, '4 מאות הן 400'],
    // mm-cur-4
    ['mm-cur-4', 'mm-cur-14', 'whole tens groups', 'מחברים 30 ועוד 24: מחברים קודם עשרות (30+20) ואז יחידות. מה הסכום?', 54, '50 ועוד 4'],
    // mm-cur-6
    ['mm-cur-6', 'mm-cur-15', 'repeating pattern', 'דגם מקצב חוזר כל 4 פעימות: באיזו פעימה יסתיים המחזור השלישי?', 12, '3 כפול 4'],
    // mm-cur-7
    ['mm-cur-7', 'mm-cur-14', 'operation stories', 'בחזרת התזמורת היו 35 נגנים והצטרפו עוד 18: כמה נגנים בסך הכל?', 53, '35 ועוד 18'],
    // mm-cur-8
    ['mm-cur-8', 'mm-cur-17', 'sides and vertices', 'למשולש יש 3 צלעות. אם נחבר שני משולשים צמודים, האם נקבל מרובע בעל 4 צלעות? (כן/לא)', 'כן', 'חיבור שני משולשים בצלע משותפת יוצר מרובע'],
    // mm-cur-9
    ['mm-cur-9', 'mm-cur-18', 'length units', 'סרגל מודד אורך צלע של 4 ס״מ. מהו היקף ריבוע שכל 4 צלעותיו באורך זה?', 16, '4 כפול 4'],
    // mm-cur-10
    ['mm-cur-10', 'mm-cur-18', 'whole hours', 'השעה 3:00. המחוג הגדול עושה חצי סיבוב (חצי תיבה): מה השעה כעת? (כתבו 3:30)', '3:30', 'חצי שעה היא 30 דקות'],
    // mm-cur-11
    ['mm-cur-11', 'mm-cur-19', 'coin sums', 'שילמנו בשטר של 20 ש״ח על חלילית שעולה 14 ש״ח: כמה עודף נקבל?', 6, '20 פחות 14'],
    // mm-cur-12
    ['mm-cur-12', 'mm-cur-21', 'counted data', 'בדיאגרמה עמודת התופים מגיעה ל־8 ועמודת המצלתיים ל־5: מה ההפרש ביניהן?', 3, '8 פחות 5'],
    // mm-cur-13
    ['mm-cur-13', 'mm-cur-14', 'place value regrouping', 'בחיבור 48 + 35: 8 יחידות ועוד 5 יחידות הן 13. כמה עשרות עוברות למקום העשרות?', 1, '10 יחידות הופכות לעשרת אחת'],
    ['mm-cur-13', 'mm-cur-22', 'place value', '10 מאות יוצרות אלף אחד (1,000). כמה מאות יש ב־3,000?', 30, '30 מאות הן 3,000'],
    // mm-cur-14
    ['mm-cur-14', 'mm-cur-18', 'addition regrouping', 'היקף משולש שצלעותיו 25 ס״מ, 35 ס״מ ו־20 ס״מ: מהו ההיקף בס״מ?', 80, '25 + 35 + 20'],
    ['mm-cur-14', 'mm-cur-19', 'addition and subtraction', 'קנינו מפרט ב־15 ש״ח ומיתר ב־45 ש״ח. שילמנו בשטר של 100 ש״ח: מה העודף?', 40, '100 פחות 60'],
    ['mm-cur-14', 'mm-cur-23', 'addition regrouping', 'בחיבור 350 + 280: 5 מאות ועוד 8 מאות הן 13 מאות. לאיזה מקום מועבר ה־1?', 'אלפים', '10 מאות הן אלף אחד'],
    // mm-cur-15
    ['mm-cur-15', 'mm-cur-16', 'multiples to division', 'מחלקים 20 פעימות לקבוצות שוות של 5: כמה קבוצות שלמות נקבל?', 4, '20 לחלק ל־5'],
    ['mm-cur-15', 'mm-cur-20', 'repeated groups', 'שכבה אחת של תיבה מכילה 4 קבוצות של 5 קוביות (20 קוביות). כמה קוביות ב־3 שכבות?', 60, '3 כפול 20'],
    ['mm-cur-15', 'mm-cur-24', 'skip counting to table', 'אם יודעים ש־5 × 6 = 30, מוסיפים עוד קבוצה של 6 כדי למצוא כמה זה 6 × 6. כמה נקבל?', 36, '30 ועוד 6'],
    // mm-cur-16
    ['mm-cur-16', 'mm-cur-25', 'equal sharing to remainder', 'מחלקים 14 פעימות לתיבות של 4: כמה תיבות שלמות מתמלאות וכמה פעימות נשארות בחוץ?', 2, '3 תיבות של 4 הן 12, ונשארות 2 פעימות'],
    ['mm-cur-16', 'mm-cur-33', 'equal sharing to fraction', 'חילקנו 12 צלילים ל־3 קבוצות שוות. כמה צלילים הם שליש (1/3) מתוך ה־12?', 4, '12 לחלק ל־3'],
    // mm-cur-17
    ['mm-cur-17', 'mm-cur-27', 'right angle to angle types', 'זווית שקטנה מזווית ישרה (פחות מ־90 מעלות) נקראת זווית:', 'חדה', 'זווית קטנה מישרה היא חדה'],
    // mm-cur-18
    ['mm-cur-18', 'mm-cur-28', 'perimeter to area', 'מלבן באורך 6 ס״מ ורוחב 4 ס״מ. מהו שטח המלבן בסמ״ר?', 24, 'אורך כפול רוחב: 6 × 4'],
    ['mm-cur-18', 'mm-cur-32', 'half bar to note fractions', 'חצי תיבה ב־4/4 שווה 2 פעימות מתוך 4. איזה שבר מהתיבה זה? (כתבו 1/2 או 2/4)', '1/2', 'חצי מתוך השלם'],
    ['mm-cur-18', 'mm-cur-35', 'measure units', 'בסרגל יש 100 סנטימטרים בכל מטר אחד. כמה ס״מ יש ב־3 מטרים?', 300, '3 כפול 100'],
    // mm-cur-19
    ['mm-cur-19', 'mm-cur-29', 'currency values', 'בכל שקל אחד יש 100 אגורות. כמה אגורות יש ב־5 שקלים?', 500, '5 כפול 100'],
    // mm-cur-20
    ['mm-cur-20', 'mm-cur-28', 'cube layers to area grid', 'רשת של 5 שורות ו־4 עמודות מכילה כמה משבצות בסך הכל?', 20, '5 כפול 4'],
    ['mm-cur-20', 'mm-cur-34', 'cube layers to surface area', 'לקובייה 6 פאות שוות ששטח כל אחת 4 סמ״ר. מה שטח הפנים הכולל שלה?', 24, '6 כפול 4'],
    ['mm-cur-20', 'mm-cur-56', 'cube layers to volume formula', 'תיבה שאורכה 5 ס״מ, רוחבה 3 ס״מ וגובהה 4 ס״מ: מהו נפחה בסמ״ק?', 60, 'אורך × רוחב × גובה: 5 × 3 × 4'],
    // mm-cur-21
    ['mm-cur-21', 'mm-cur-30', 'tables to data collection', 'בסקר מוזיקה 12 תלמידים בחרו תופים ו־8 בחרו גיטרה. כמה תלמידים השתתפו בסקר?', 20, '12 ועוד 8'],
    // mm-cur-22
    ['mm-cur-22', 'mm-cur-23', 'place value to 10k', 'כמה צריך להוסיף ל־4,500 כדי להגיע ל־5,000?', 500, '5,000 פחות 4,500'],
    ['mm-cur-22', 'mm-cur-25', 'place value to remainder', 'מחלקים 250 ב־100: מהי המנה השלמה וכמה נשאר בשארית?', 50, 'המנה היא 2 ונשארים 50'],
    ['mm-cur-22', 'mm-cur-31', 'place value to million', 'במספר 450,000, מה ערך הספרה 4? (כתבו מספר)', 400000, '4 מאות אלפים'],
    // mm-cur-23
    ['mm-cur-23', 'mm-cur-26', 'multi-step addition to ratio', 'קבוצה א׳ ניגנה 200 צלילים וקבוצה ב׳ ניגנה 600 צלילים. פי כמה ניגנה קבוצה ב׳?', 3, '600 לחלק ל־200'],
    ['mm-cur-23', 'mm-cur-31', 'calculation to order of operations', 'בביטוי 500 + 200 × 3, איזו פעולה מבצעים ראשונה? (כפל/חיבור)', 'כפל', 'כפל קודם לחיבור'],
    // mm-cur-24
    ['mm-cur-24', 'mm-cur-25', 'multiplication facts to remainder', 'הכפולה הקרובה ביותר ל־23 בלוח 5 היא 20 (5 × 4). מה השארית מ־23?', 3, '23 פחות 20'],
    ['mm-cur-24', 'mm-cur-26', 'multiplication to ratio', 'טמפו 120 פעימות בדקה מהיר מ־60 פעימות בדקה. פי כמה הוא מהיר יותר?', 2, '120 לחלק ל־60'],
    ['mm-cur-24', 'mm-cur-28', 'table facts to rectangle area', 'מלבן שצלעותיו 7 ס״מ ו־8 ס״מ: מה שטחו בסמ״ר?', 56, '7 כפול 8'],
    ['mm-cur-24', 'mm-cur-31', 'table facts to multi-digit', 'כמה זה 6 × 700? (רמז: 6 × 7 בעשרות/מאות)', 4200, '6 כפול 7 הם 42, כפול 100'],
    ['mm-cur-24', 'mm-cur-40', 'table facts to factors', 'אילו שני מספרים שאינם 1 מכפלתם 21?', 3, '3 כפול 7'],
    // mm-cur-25
    ['mm-cur-25', 'mm-cur-29', 'remainder to cents', 'חילקנו 250 אגורות לשקלים שלמים (100 אגורות לשקל): כמה שקלים שלמים וכמה אגורות שארית?', 50, '2 שקלים שלמים ועוד 50 אגורות'],
    ['mm-cur-25', 'mm-cur-31', 'bars with remainder to multi-op', 'בחישוב (17 - 2) : 5, מה התוצאה?', 3, '15 לחלק ל־5'],
    ['mm-cur-25', 'mm-cur-32', 'remainder as bar fraction', 'בחלוקת 5 רבעים לתיבה של 4/4: תיבה אחת שלמה ועוד איזה שבר נשאר מחוץ לתיבה?', '1/4', 'רבע אחד נוסף'],
    // mm-cur-26
    ['mm-cur-26', 'mm-cur-36', 'ratio comparison to cost', 'תוף עולה 80 ש״ח, מחיר הגדול פי 2 ממחיר מצילות. כמה עולות המצילות?', 40, '80 לחלק ל־2'],
    // mm-cur-27
    ['mm-cur-27', 'mm-cur-34', 'angle classification to quads', 'למלבן יש 4 זוויות. איזה סוג זוויות הן? (חדות/קהות/ישרות)', 'ישרות', 'כל 4 הזוויות במלבן הן ישרות'],
    // mm-cur-28
    ['mm-cur-28', 'mm-cur-34', 'rectangle area to composites', 'ריבוע שצלעו 5 ס״מ: מה שטחו בסמ״ר?', 25, '5 כפול 5'],
    ['mm-cur-28', 'mm-cur-35', 'minutes to hours conversion', 'שיר נמשך 120 שניות. כמה דקות נמשך השיר?', 2, '60 שניות הן דקה אחת'],
    ['mm-cur-28', 'mm-cur-47', 'rectangle area to triangle area', 'שטח מלבן 20 סמ״ר. משולש החצוי ממנו מקודקוד לקודקוד שטחו חצי מהמלבן: מה שטח המשולש?', 10, 'חצי מ־20'],
    // mm-cur-29
    ['mm-cur-29', 'mm-cur-36', 'shekel agorot to purchase', 'קנינו מפרט ב־2.50 ש״ח ושילמנו במטבע של 5 ש״ח: כמה עודף נקבל בשקלים? (כתבו 2.50)', '2.50', '5 פחות 2.50'],
    // mm-cur-30
    ['mm-cur-30', 'mm-cur-37', 'data charts to fraction data', 'בדיאגרמה חצי (1/2) מהתלמידים מנגנים בפסנתר מתוך 30 תלמידים. כמה תלמידים מנגנים בפסנתר?', 15, 'חצי מתוך 30'],
    // mm-cur-31
    ['mm-cur-31', 'mm-cur-38', 'large numbers to millions', 'איזה מספר גדול ב־1 מ־999,999?', 1000000, 'מיליון אחד'],
    ['mm-cur-31', 'mm-cur-39', 'operations to estimation', 'בעיגול לאלפים הקרובים: לאיזה מספר מתעגל 4,820?', 5000, 'קרוב יותר ל־5,000'],
    ['mm-cur-31', 'mm-cur-40', 'operations to divisibility', 'האם 30 מתחלק ב־2, ב־3 וב־5 ללא שארית? (כן/לא)', 'כן', '30 הוא כפולה של 2, 3 ו־5'],
    ['mm-cur-31', 'mm-cur-50', 'order of operations to g6 laws', 'מה תוצאת התרגיל: 24 : (3 × 2) + 5?', 9, '24 : 6 = 4, ואז 4 + 5 = 9'],
    ['mm-cur-31', 'mm-cur-52', 'multiplication rules to decimals', 'אם 25 × 4 = 100, כמה זה 2.5 × 4?', 10, 'קטן פי 10'],
    // mm-cur-32
    ['mm-cur-32', 'mm-cur-33', 'bar fractions to equivalent fractions', 'כמה רבעים (1/4) שווים לחצי (1/2) בתיבה של 4/4?', 2, 'שני רבעים הם חצי תיבה'],
    ['mm-cur-32', 'mm-cur-37', 'bar fractions to fraction data', 'רבע (1/4) מעוגת הנתונים מייצג כמה אחוזים או כמה מתוך 100?', 25, 'רבע מ־100 הוא 25'],
    ['mm-cur-32', 'mm-cur-42', 'bar fractions to number line', 'היכן ממוקם 3/4 על ישר המספרים בין 0 ל־1: קרוב יותר ל־0 או ל־1?', 1, '3/4 קרוב לשלם'],
    // mm-cur-33
    ['mm-cur-33', 'mm-cur-41', 'equal names to expansion', 'אם נרחיב את השבר 2/3 פי 2 (מונה ומכנה פי 2), איזה שבר נקבל? (כתבו a/b)', '4/6', '2×2 במונה, 3×2 במכנה'],
    ['mm-cur-33', 'mm-cur-43', 'fraction of quantity to general part', 'כמה הם 3/4 מתוך 20?', 15, 'רבע מ־20 הוא 5, כפול 3'],
    ['mm-cur-33', 'mm-cur-44', 'fractions to common denominator', 'כדי לחבר 1/2 + 1/4 מרחיבים את 1/2 ל־2/4. מה סכום השברים? (כתבו a/b)', '3/4', '2/4 ועוד 1/4'],
    // mm-cur-34
    ['mm-cur-34', 'mm-cur-47', 'quadrilaterals to parallelogram area', 'שטח מקבילית שבסיסה 8 ס״מ וגובהה 5 ס״מ: מה שטחה בסמ״ר?', 40, 'בסיס כפול גובה: 8 × 5'],
    ['mm-cur-34', 'mm-cur-48', 'quadrilaterals to prism faces', 'כמה פאות מלבניות יש למנסרה משולשת ישרה?', 3, '3 פאות מלבניות מסביב'],
    ['mm-cur-34', 'mm-cur-55', 'quadrilaterals to composite area', 'מצולע המורכב משני מלבנים של 10 סמ״ר ו־15 סמ״ר: מה שטחו הכולל?', 25, '10 ועוד 15'],
    // mm-cur-35
    ['mm-cur-35', 'mm-cur-45', 'metric units to decimals', '10 ס״מ הם עשירית (0.1) ממטר. כמה מטרים הם 50 ס״מ? (כתבו 0.5)', 0.5, 'חצי מטר הוא 0.5'],
    ['mm-cur-35', 'mm-cur-56', 'units to volume metric', 'כמה מיליליטר (מ״ל) יש בליטר אחד של מים?', 1000, 'אלף מ״ל בליטר'],
    // mm-cur-36
    ['mm-cur-36', 'mm-cur-46', 'money calculation to decimal operations', 'קנינו מפרט ב־4.20 ש״ח ועט ב־3.50 ש״ח: מה הסכום הכולל? (כתבו 7.70)', '7.70', '4.20 ועוד 3.50'],
    // mm-cur-37
    ['mm-cur-37', 'mm-cur-49', 'fraction data to frequency', 'בכיתה של 20 תלמידים, הערך השכיח הופיע אצל 8 תלמידים. מה השכיחות של ערך זה?', 8, 'השכיחות היא מספר המופעים'],
    ['mm-cur-37', 'mm-cur-58', 'fraction data to representations', 'בדיאגרמת עוגה של 8 חלקים שווים, כמה חלקים צבועים מייצגים חצי מהעוגה?', 4, 'חצי מתוך 8'],
    // mm-cur-38
    ['mm-cur-38', 'mm-cur-45', 'place value to decimal places', 'במספר 12.34, מהו ערך הספרה 3? (כתבו: עשיריות/מאיות)', 'עשיריות', 'מקום ראשון מימין לפסיק הוא עשיריות'],
    // mm-cur-39
    ['mm-cur-39', 'mm-cur-50', 'arithmetic laws to g6 operations', 'בחישוב 100 - 4 × 5: מה מחשבים קודם?', 'כפל', 'כפל קודם לחיסור'],
    ['mm-cur-39', 'mm-cur-57', 'operations to average sum', 'סכום 4 מספרים הוא 80. מהו הממוצע שלהם?', 20, '80 לחלק ל־4'],
    // mm-cur-40
    ['mm-cur-40', 'mm-cur-41', 'factors to fraction reduction', 'המחלק המשותף הגדול ביותר של 6 ו־9 הוא 3. צמצמו את 6/9: מה השבר המצומצם? (כתבו a/b)', '2/3', 'מחלקים מונה ומכנה ב־3'],
    ['mm-cur-40', 'mm-cur-44', 'multiples to common denominator', 'מהו המכנה המשותף הקטן ביותר לחיבור 1/4 + 1/6? (כפולה משותפת)', 12, '12 מתחלק ב־4 וב־6'],
    ['mm-cur-40', 'mm-cur-50', 'prime factorization to natural laws', 'מהו הפירוק לגורמים ראשוניים של 12? (כתבו למשל 2x2x3)', '2x2x3', '2 כפול 2 כפול 3'],
    // mm-cur-42
    ['mm-cur-42', 'mm-cur-41', 'visual models to equivalence', 'שטח צבוע של 1/2 בריבוע שווה לשטח של כמה רבעים באותו ריבוע?', 2, 'שני רבעים שווים לחצי'],
    ['mm-cur-42', 'mm-cur-43', 'models to fraction of amount', 'סרט באורך 30 ס״מ נחתך ל־5 חלקים שווים. מה אורך 2/5 מהסרט?', 12, 'כל חמישית היא 6 ס״מ, ושתיים הן 12'],
    ['mm-cur-42', 'mm-cur-45', 'fraction models to tenths decimal', 'השבר 3/10 כתוב כשבר עשרוני: איזה מספר עשרוני זה? (כתבו 0.3)', 0.3, '3 עשיריות נכתבות 0.3'],
    // mm-cur-41
    ['mm-cur-41', 'mm-cur-44', 'equivalent fractions to addition', 'כדי לחבר 1/3 + 1/6 מרחיבים את 1/3 ל־2/6. מה התוצאה הסופית המצומצמת? (כתבו 1/2)', '1/2', '3/6 מצטמצם ל־1/2'],
    ['mm-cur-41', 'mm-cur-51', 'fraction reduction to multiplication', 'בכפל 2/3 × 3/4: אפשר לצמצם את 3 מול 3. מהי המכפלה המצומצמת? (כתבו a/b)', '1/2', '2/4 מצטמצם ל־1/2'],
    // mm-cur-43
    ['mm-cur-43', 'mm-cur-51', 'fraction of amount to fraction multiplication', 'חישוב 1/2 מתוך 1/3 הוא תרגיל כפל 1/2 × 1/3. מה התוצאה? (כתבו a/b)', '1/6', '1 כפול 1 במונה, 2 כפול 3 במכנה'],
    ['mm-cur-43', 'mm-cur-53', 'fraction of amount to percent whole', '25% מתוך 80 הם רבע מתוך 80. כמה זה?', 20, '80 לחלק ל־4'],
    // mm-cur-44
    ['mm-cur-44', 'mm-cur-51', 'fraction operations to division', 'כדי לחלק שבר כופלים במספר ההופכי. מה המספר ההופכי של 2/3? (כתבו a/b)', '3/2', 'הופכים מונה ומכנה'],
    // mm-cur-45
    ['mm-cur-45', 'mm-cur-46', 'decimal place value to alignment', 'בחיבור 1.25 + 2.3: מסדרים נקודה עשרונית מתחת לנקודה. מה הסכום?', 3.55, '1.25 ועוד 2.30'],
    ['mm-cur-45', 'mm-cur-52', 'decimal places to shift', 'כשמכפילים 0.45 ב־10, הנקודה העשרונית זזה ימינה מקום אחד. מה התוצאה?', 4.5, '0.45 כפול 10'],
    ['mm-cur-45', 'mm-cur-53', 'decimal to percent', 'השבר העשרוני 0.35 מייצג 35 מאיות. כמה אחוזים זה?', 35, '0.35 הם 35%'],
    // mm-cur-46
    ['mm-cur-46', 'mm-cur-52', 'decimal addition to multiplication', 'כפל 0.2 × 3 הוא כמו חיבור 0.2 + 0.2 + 0.2. מה התוצאה?', 0.6, '3 פעמים 0.2'],
    // mm-cur-47
    ['mm-cur-47', 'mm-cur-54', 'polygon perimeter to circle circumference', 'בהיקף מעגל, היחס בין ההיקף לקוטר הוא קבוע π (בערך 3.14). אם הקוטר 10 ס״מ, מה ההיקף בקירוב?', 31.4, '10 כפול 3.14'],
    ['mm-cur-47', 'mm-cur-55', 'triangle area to composite shapes', 'מצולע מורכב ממלבן ששטחו 30 סמ״ר ומשולש ששטחו 12 סמ״ר. מה השטח הכולל?', 42, '30 ועוד 12'],
    // mm-cur-48
    ['mm-cur-48', 'mm-cur-56', 'prism geometry to volume units', 'נפח תיבה שממדיה 2 ס״מ, 3 ס״מ ו־5 ס״מ: מה נפחה בסמ״ק?', 30, '2 כפול 3 כפול 5'],
    // mm-cur-49
    ['mm-cur-49', 'mm-cur-57', 'frequency data to mean calculation', 'ציונים במבחן: 80, 90, 100. מהו הציון הממוצע?', 90, '270 לחלק ל־3'],
    ['mm-cur-49', 'mm-cur-58', 'data interpretation to multiple views', 'בטבלת נתונים 10 תלמידים בחרו כינור. כמה סמלים של 2 תלמידים יופיעו בפיקטוגרם?', 5, '10 לחלק ל־2'],
  ];

  const BRIDGES = {};
  const BY_FROM = {};
  const BY_TO = {};

  RAW_BRIDGES.forEach(function (row) {
    const entry = Object.freeze({
      from: row[0],
      to: row[1],
      mechanism: row[2],
      prompt: row[3],
      answer: row[4],
      hint: row[5],
    });
    const key = entry.from + '->' + entry.to;
    BRIDGES[key] = entry;
    if (!BY_FROM[entry.from]) BY_FROM[entry.from] = [];
    BY_FROM[entry.from].push(entry);
    if (!BY_TO[entry.to]) BY_TO[entry.to] = [];
    BY_TO[entry.to].push(entry);
  });

  function bridgeForLink(fromId, toId) {
    return BRIDGES[fromId + '->' + toId] || null;
  }

  function bridgesForTopic(fromId) {
    return (BY_FROM[fromId] || []).slice();
  }

  function bridgesEnteringTopic(toId) {
    return (BY_TO[toId] || []).slice();
  }

  return {
    RAW_BRIDGES: RAW_BRIDGES,
    BRIDGES: BRIDGES,
    bridgeForLink: bridgeForLink,
    bridgesForTopic: bridgesForTopic,
    bridgesEnteringTopic: bridgesEnteringTopic,
  };
});
