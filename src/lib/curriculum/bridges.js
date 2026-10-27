// Bridge exercise for every buildsTo link (Refs #665 #718).
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.MM_BRIDGES = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  // [fromTopicId, toTopicId, musicalMechanism, prompt, answer, hint]
  const RAW_BRIDGES = [
    ['mm-cur-0', 'mm-cur-1', 'steady beat', '10 פעימות קצובות בתוף יוצרות עשרת אחת: כמה פעימות יש בעשרת אחת?', 10, 'עשרת אחת שווה בדיוק 10 פעימות'],
    ['mm-cur-0', 'mm-cur-2', 'steady beat', 'כל צעד על הישר נשמע בפעימה: מ־0 עד 7, כמה פעימות שמענו?', 7, 'סופרים 7 צעדים מהאפס'],
    ['mm-cur-0', 'mm-cur-15', 'steady beat', 'בספירה בדילוגי 2 מדגישים כל פעימה שנייה: כמה פעימות מודגשות ב־6 פעימות?', 3, 'מדגישים ב־2, 4, 6'],
    ['mm-cur-1', 'mm-cur-3', 'beats in tens', 'עשרת אחת של 10 פעימות ועוד 4 פעימות בודדות: כמה פעימות בסך הכל?', 14, '10 ועוד 4'],
    ['mm-cur-1', 'mm-cur-5', 'beats in tens', 'בלוח המאה כל שורה היא תיבה של 10 פעימות: כמה פעימות נשמעות ב־3 שורות שלמות?', 30, '3 עשרות של פעימות הן 30'],
    ['mm-cur-1', 'mm-cur-12', 'beats in tens', 'בפיקטוגרם כל תו שווה 10 פעימות: כמה פעימות מייצגים 2 תווים?', 20, '2 עשרות שוות 20'],
    ['mm-cur-1', 'mm-cur-13', 'beats in tens', '10 עשרות של פעימות יוצרות מאה אחת: כמה עשרות יש ב־100?', 10, 'מאה אחת מורכבת מ־10 עשרות'],
    ['mm-cur-2', 'mm-cur-3', 'steps on line', 'צועדים על הישר מ־5 קדימה 4 צעדים בצליל: לאיזה מספר מגיעים?', 9, '5 ועוד 4'],
    ['mm-cur-3', 'mm-cur-4', 'joining beats', 'אם 2 פעימות ועוד 3 פעימות הן 5, כמה הן 2 עשרות ועוד 3 עשרות?', 50, '20 ועוד 30'],
    ['mm-cur-3', 'mm-cur-7', 'joining beats', 'היו 8 צלילים בתוף ונוספו עוד 5 צלילי פעמון: כמה צלילים נוגנו בסך הכל?', 13, '8 ועוד 5'],
    ['mm-cur-3', 'mm-cur-11', 'joining beats', 'משמיעים 5 פעימות בתוף למטבע של 5 ש״ח ועוד 10 פעימות למטבע של 10 ש״ח: כמה שקלים שמענו בסך הכל?', 15, '5 ועוד 10'],
    ['mm-cur-3', 'mm-cur-31', 'joining beats balance', 'במאזני צלילים שני הצדדים מאוזנים: 12 פעימות במקצב אחד שוות ל־9 פעימות ועוד כמה?', 3, '12 פחות 9 שווה 3 פעימות'],
    ['mm-cur-5', 'mm-cur-4', 'hundred chart tens', 'יורדים 2 שורות בלוח המאה (כל שורה תיבה של 10 פעימות) מ־40: לאיזה מספר מגיעים?', 60, 'כל שורה למטה מוסיפה 10'],
    ['mm-cur-5', 'mm-cur-13', 'hundred chart tens', 'לוח מאה מנגן 100 פעימות. כמה לוחות כאלה צריך כדי להשמיע 400 פעימות?', 4, '4 מאות הן 400'],
    ['mm-cur-4', 'mm-cur-14', 'whole tens groups', 'בחיבור 30+24 מנגנים צלילי בס לעשרות (30+20) וצלילי תוף ליחידות: מה הסכום הכולל?', 54, '50 ועוד 4'],
    ['mm-cur-6', 'mm-cur-15', 'repeating pattern', 'דגם מקצב חוזר כל 4 פעימות: באיזו פעימה יסתיים המחזור השלישי?', 12, '3 כפול 4'],
    ['mm-cur-7', 'mm-cur-14', 'operation stories', 'בחזרת התזמורת 35 נגנים ניגנו צליל והצטרפו עוד 18: כמה נגנים מנגנים בסך הכל?', 53, '35 ועוד 18'],
    ['mm-cur-8', 'mm-cur-17', 'sides and vertices', 'מקישים 3 נקישות לצלעות משולש. אם מחברים 2 משולשים בצלע משותפת, האם נקיש 4 נקישות למרובע שנוצר? (כן/לא)', 'כן', 'חיבור שני משולשים בצלע משותפת יוצר מרובע'],
    ['mm-cur-9', 'mm-cur-18', 'length units', 'מקישים פעימה לכל ס״מ בסרגל: לצלע של 4 ס״מ, כמה פעימות נקיש סביב כל היקף הריבוע?', 16, '4 כפול 4'],
    ['mm-cur-10', 'mm-cur-18', 'whole hours', 'השעה 3:00. המחוג הגדול עושה חצי סיבוב (חצי תיבה): מה השעה כעת? (כתבו 3:30)', '3:30', 'חצי שעה היא 30 דקות'],
    ['mm-cur-11', 'mm-cur-19', 'coin sums', 'קונים חלילית נגינה ב־14 ש״ח ומשלמים בשטר של 20 ש״ח: כמה צלילי שקלים נקבל בעודף?', 6, '20 פחות 14'],
    ['mm-cur-12', 'mm-cur-21', 'counted data', 'בדיאגרמת מקצב עמודת התופים מגיעה ל־8 פעימות ועמודת המצלתיים ל־5: מה הפרש הפעימות?', 3, '8 פחות 5'],
    ['mm-cur-13', 'mm-cur-14', 'place value regrouping', 'בחיבור צלילי 48+35: 8 פעימות ועוד 5 פעימות הן 13. כמה צלילי עשרת עוברים לעמודת העשרות?', 1, '10 יחידות הופכות לעשרת אחת'],
    ['mm-cur-13', 'mm-cur-22', 'place value', '10 קבוצות של מאה פעימות יוצרות אלף אחד. כמה קבוצות כאלה יש ב־3,000?', 30, '30 מאות הן 3,000'],
    ['mm-cur-14', 'mm-cur-18', 'addition regrouping', 'מנגנים פעימות להיקף משולש שצלעותיו 25, 35 ו־20 ס״מ: כמה פעימות בסך הכל נשמעו?', 80, '25 + 35 + 20'],
    ['mm-cur-14', 'mm-cur-19', 'addition and subtraction', 'קנינו מפרט לגיטרה ב־15 ש״ח ומיתר מנגן ב־45 ש״ח. שילמנו 100 ש״ח: כמה צלילי שקלים נותרו בעודף?', 40, '100 פחות 60'],
    ['mm-cur-14', 'mm-cur-23', 'addition regrouping', 'בחיבור צלילי 3,500+2,800: 5 מאות פעימות ועוד 8 הן 13. לאיזה מקום צלילי מועבר ה־1?', 'אלפים', '10 מאות הן אלף אחד'],
    ['mm-cur-14', 'mm-cur-31', 'regrouping balance', 'במאזני צלילים של שתי תיבות: 30 פעימות ועוד 40 שוות ל־50 ועוד כמה פעימות?', 20, 'שני הצדדים מנגנים 70 פעימות: 70 פחות 50'],
    ['mm-cur-15', 'mm-cur-16', 'multiples to division', 'מחלקים 20 פעימות לקבוצות שוות של 5: כמה קבוצות שלמות נקבל?', 4, '20 לחלק ל־5'],
    ['mm-cur-15', 'mm-cur-20', 'repeated groups', 'שכבה אחת של תיבה מכילה 4 קבוצות של 5 קוביות (20 קוביות). כמה קוביות ב־3 שכבות?', 60, '3 כפול 20'],
    ['mm-cur-15', 'mm-cur-24', 'skip counting to table', 'במקצב כפולות 6: אחרי 5 תיבות של 6 פעימות (30), מוסיפים עוד תיבה אחת. כמה פעימות נקבל?', 36, '30 ועוד 6'],
    ['mm-cur-16', 'mm-cur-25', 'equal sharing to remainder', 'מחלקים 14 פעימות לתיבות של 4: כמה תיבות שלמות מתמלאות וכמה פעימות נשארות בחוץ?', 2, '3 תיבות של 4 הן 12, ונשארות 2 פעימות'],
    ['mm-cur-16', 'mm-cur-33', 'equal sharing to fraction', 'חילקנו 12 צלילים ל־3 קבוצות שוות. כמה צלילים הם שליש (1/3) מתוך ה־12?', 4, '12 לחלק ל־3'],
    ['mm-cur-17', 'mm-cur-27', 'right angle to angle types', 'במעגל צלילים, זווית שקטנה מזווית ישרה של רבע סיבוב נקראת זווית:', 'חדה', 'זווית קטנה מישרה היא חדה'],
    ['mm-cur-18', 'mm-cur-28', 'perimeter to area', 'רשת מקצב באורך 6 פעימות ורוחב 4 שורות: כמה פעימות יש בשטח המלבן כולו?', 24, 'אורך כפול רוחב: 6 × 4'],
    ['mm-cur-18', 'mm-cur-32', 'half bar to note fractions', 'חצי תיבה ב־4/4 שווה 2 פעימות מתוך 4. איזה שבר מהתיבה זה? (כתבו 1/2 או 2/4)', '1/2', 'חצי מתוך השלם'],
    ['mm-cur-18', 'mm-cur-35', 'measure units', 'מקישים צליל לכל ס״מ בסרגל, 100 למטר: כמה צלילים נקיש עבור 3 מטרים?', 300, '3 כפול 100'],
    ['mm-cur-19', 'mm-cur-29', 'currency values', 'במטרונום כל שקל הוא 100 נקישות אגורה: כמה נקישות נשמע ב־5 שקלים?', 500, '5 כפול 100'],
    ['mm-cur-20', 'mm-cur-28', 'cube layers to area grid', 'רשת צלילים של 5 שורות ו־4 עמודות במקצב: כמה צלילים יש ברשת כולה?', 20, '5 כפול 4'],
    ['mm-cur-20', 'mm-cur-34', 'cube layers to surface area', 'לקוביית מקצב 6 פאות שוות של 4 משבצות צליל כל אחת: כמה צלילים בסך הכל?', 24, '6 כפול 4'],
    ['mm-cur-20', 'mm-cur-56', 'cube layers to volume formula', 'תיבה שאורכה 5 ס״מ, רוחבה 3 ס״מ וגובהה 4 ס״מ: מהו נפחה בסמ״ק?', 60, 'אורך × רוחב × גובה: 5 × 3 × 4'],
    ['mm-cur-21', 'mm-cur-30', 'tables to data collection', 'בסקר תזמורת 12 תלמידים בחרו מקצב תופים ו־8 בחרו פריטת גיטרה. כמה תלמידים השתתפו בסקר?', 20, '12 ועוד 8'],
    ['mm-cur-22', 'mm-cur-23', 'place value to 10k', 'בסולם תדרים, כמה פעימות צריך להוסיף מ־4,500 כדי להגיע ל־5,000?', 500, '5,000 פחות 4,500'],
    ['mm-cur-22', 'mm-cur-25', 'place value to remainder', 'מחלקים 250 פעימות לתיבות של 100: כמה פעימות נשארות בחוץ כשארית?', 50, 'המנה היא 2 ונשארים 50'],
    ['mm-cur-22', 'mm-cur-31', 'place value to million', 'בצליל התדר 450,000, מהו ערך הספרה 4 במבנה העשרוני? (כתבו מספר)', 400000, '4 מאות אלפים'],
    ['mm-cur-23', 'mm-cur-26', 'multi-step addition to ratio', 'קבוצה א׳ ניגנה 200 צלילים וקבוצה ב׳ ניגנה 600 צלילים. פי כמה ניגנה קבוצה ב׳?', 3, '600 לחלק ל־200'],
    ['mm-cur-23', 'mm-cur-31', 'calculation to order of operations', 'בביטוי מוזיקלי של פעימות 500 + 200 × 3, איזו פעולה נחשב ראשונה לפני החיבור? (כפל/חיבור)', 'כפל', 'כפל קודם לחיבור'],
    ['mm-cur-24', 'mm-cur-25', 'multiplication facts to remainder', 'מנגנים 23 פעימות בתיבות של 5: 4 תיבות שלמות הן 20. מה השארית שנשארה?', 3, '23 פחות 20'],
    ['mm-cur-24', 'mm-cur-26', 'multiplication to ratio', 'טמפו 120 פעימות בדקה מהיר מ־60 פעימות בדקה. פי כמה הוא מהיר יותר?', 2, '120 לחלק ל־60'],
    ['mm-cur-24', 'mm-cur-28', 'table facts to rectangle area', 'רשת מלבן שורות × עמודות בלוח כפל: 7 שורות צליל ו־8 עמודות, כמה צלילים ברשת?', 56, '7 כפול 8'],
    ['mm-cur-24', 'mm-cur-31', 'table facts to multi-digit', 'במקצב של 6 תיבות בנות 700 פעימות כל אחת: כמה פעימות נשמע בסך הכל?', 4200, '6 כפול 7 הם 42, כפול 100'],
    ['mm-cur-24', 'mm-cur-40', 'table facts to factors', 'במנגינה של 21 פעימות מחלקים לקבוצות שוות בלי שארית: איזו קבוצה קטנה מתאימה?', 3, '3 כפול 7'],
    ['mm-cur-25', 'mm-cur-29', 'remainder to cents', 'בנקישות אגורות, 250 נקישות מחולקות לשקלים של 100: כמה נקישות נשארות כשארית?', 50, '2 שקלים שלמים ועוד 50 אגורות'],
    ['mm-cur-25', 'mm-cur-31', 'bars with remainder to multi-op', 'במקצב (17 - 2) : 5 מחסרים 2 פעימות ואז מחלקים ל־5: מה התוצאה?', 3, '15 לחלק ל־5'],
    ['mm-cur-25', 'mm-cur-32', 'remainder as bar fraction', 'בחלוקת 5 רבעים לתיבה של 4/4: תיבה אחת שלמה ועוד איזה שבר נשאר מחוץ לתיבה?', '1/4', 'רבע אחד נוסף'],
    ['mm-cur-26', 'mm-cur-36', 'ratio comparison to cost', 'תוף עולה 80 ש״ח, מחיר הגדול פי 2 ממחיר מצילות. כמה עולות המצילות?', 40, '80 לחלק ל־2'],
    ['mm-cur-27', 'mm-cur-34', 'angle classification to quads', 'במעגל מקצבים, 4 זוויות המלבן הן רבע סיבוב כל אחת. איזה סוג זוויות הן? (חדות/קהות/ישרות)', 'ישרות', 'כל 4 הזוויות במלבן הן ישרות'],
    ['mm-cur-28', 'mm-cur-34', 'rectangle area to composites', 'רשת צלילים בריבוע שצלעו 5 על 5 פעימות: מה שטח הרשת כולה?', 25, '5 כפול 5'],
    ['mm-cur-28', 'mm-cur-35', 'minutes to hours conversion', 'שיר נמשך 120 שניות. כמה דקות נמשך השיר?', 2, '60 שניות הן דקה אחת'],
    ['mm-cur-28', 'mm-cur-47', 'rectangle area to triangle area', 'רשת צלילים של מלבן מכילה 20 משבצות; משולש חצוי מכיל חצי מהצלילים: מה שטח המשולש?', 10, 'חצי מ־20'],
    ['mm-cur-29', 'mm-cur-36', 'shekel agorot to purchase', 'קנינו מפרט מקצב ב־2.50 ש״ח ושילמנו במטבע של 5 ש״ח: כמה צלילי שקלים נקבל בעודף? (כתבו 2.50)', '2.50', '5 פחות 2.50'],
    ['mm-cur-30', 'mm-cur-37', 'data charts to fraction data', 'בדיאגרמה חצי (1/2) מהתלמידים מנגנים בפסנתר מתוך 30 תלמידים. כמה תלמידים מנגנים בפסנתר?', 15, 'חצי מתוך 30'],
    ['mm-cur-31', 'mm-cur-38', 'large numbers to millions', 'מנגנים תדר עולה: איזה מספר תדר גדול בפעימה אחת מ־999,999?', 1000000, 'מיליון אחד'],
    ['mm-cur-31', 'mm-cur-39', 'operations to estimation', 'בעיגול פעימות קצב לאלף הקרוב: לאיזה מספר פעימות מתעגל 4,820?', 5000, 'קרוב יותר ל־5,000'],
    ['mm-cur-31', 'mm-cur-40', 'operations to divisibility', 'במקצב של 30 פעימות, האם ניתן לחלק לתיבות שוות של 2, 3 ו־5 ללא שארית? (כן/לא)', 'כן', '30 הוא כפולה של 2, 3 ו־5'],
    ['mm-cur-31', 'mm-cur-50', 'order of operations to g6 laws', 'בסדר פעולות מקצב: 24 פעימות מחלקים ב־(3 × 2) ואז מוסיפים 5 פעימות. מה התוצאה?', 9, '24 : 6 = 4, ואז 4 + 5 = 9'],
    ['mm-cur-31', 'mm-cur-52', 'multiplication rules to decimals', 'אם מקצב 25 פעימות כפול 4 נותן 100, כמה נותן מקצב של 2.5 פעימות כפול 4?', 10, 'קטן פי 10'],
    ['mm-cur-32', 'mm-cur-33', 'bar fractions to equivalent fractions', 'כמה רבעים (1/4) שווים לחצי (1/2) בתיבה של 4/4?', 2, 'שני רבעים הם חצי תיבה'],
    ['mm-cur-32', 'mm-cur-37', 'bar fractions to fraction data', 'רבע (1/4) תיבה בעוגת הנתונים שווה לכמה פעימות מתוך 100?', 25, 'רבע מ־100 הוא 25'],
    ['mm-cur-32', 'mm-cur-42', 'bar fractions to number line', 'בישר צלילים בין 0 לתיבה שלמה (1), היכן ממוקם 3/4 תיבה: קרוב יותר ל־0 או ל־1?', 1, '3/4 קרוב לשלם'],
    ['mm-cur-33', 'mm-cur-41', 'equal names to expansion', 'במשך מקצב 2/3 מכפילים את מספר הפעימות במונה ובמכנה פי 2: איזה שבר שווה נקבל? (כתבו a/b)', '4/6', '2×2 במונה, 3×2 במכנה'],
    ['mm-cur-33', 'mm-cur-43', 'fraction of quantity to general part', 'משמיעים 20 פעימות: כמה פעימות הן 3/4 מתוך ה־20?', 15, 'רבע מ־20 הוא 5, כפול 3'],
    ['mm-cur-33', 'mm-cur-44', 'fractions to common denominator', 'בחיבור תיבות: חצי תיבה (2/4) ועוד רבע תיבה (1/4), איזה שבר נקבל? (כתבו a/b)', '3/4', '2/4 ועוד 1/4'],
    ['mm-cur-34', 'mm-cur-47', 'quadrilaterals to parallelogram area', 'רשת מקצב במקבילית: בסיס של 8 פעימות כפול גובה 5 שורות, מה שטח הצלילים?', 40, 'בסיס כפול גובה: 8 × 5'],
    ['mm-cur-34', 'mm-cur-48', 'quadrilaterals to prism faces', 'במנסרה צלילית משולשת ישרה, כמה פאות מלבניות משמיעות צליל מסביב?', 3, '3 פאות מלבניות מסביב'],
    ['mm-cur-34', 'mm-cur-55', 'quadrilaterals to composite area', 'מצולע צלילים המורכב משני מלבנים של 10 ו־15 משבצות: כמה צלילים בסך הכל?', 25, '10 ועוד 15'],
    ['mm-cur-35', 'mm-cur-45', 'metric units to decimals', '10 ס״מ הם עשירית (0.1) ממטר. כמה מטרים הם 50 ס״מ? (כתבו 0.5)', 0.5, 'חצי מטר הוא 0.5'],
    ['mm-cur-35', 'mm-cur-56', 'units to volume metric', 'כלי נגינה מימי מחזיק ליטר אחד: כמה צלילי מ״ל שווים לליטר אחד?', 1000, 'אלף מ״ל בליטר'],
    ['mm-cur-36', 'mm-cur-46', 'money calculation to decimal operations', 'קנינו מפרט מקצב ב־4.20 ש״ח ותו נגינה ב־3.50 ש״ח: מה הסכום הכולל בשקלים? (כתבו 7.70)', '7.70', '4.20 ועוד 3.50'],
    ['mm-cur-37', 'mm-cur-49', 'fraction data to frequency', 'בדיאגרמת כלי נגינה, הצליל השכיח הופיע אצל 8 תלמידים. מה השכיחות שנשמעה?', 8, 'השכיחות היא מספר המופעים'],
    ['mm-cur-37', 'mm-cur-58', 'fraction data to representations', 'בדיאגרמת עוגת מקצב בת 8 שמיניות, כמה שמיניות מייצגות חצי (1/2) מהעוגה?', 4, 'חצי מתוך 8'],
    ['mm-cur-38', 'mm-cur-45', 'place value to decimal places', 'בצליל התדר 12.34, מהו ערך הספרה 3 במבנה העשרוני? (כתבו: עשיריות/מאיות)', 'עשיריות', 'מקום ראשון מימין לפסיק הוא עשיריות'],
    ['mm-cur-39', 'mm-cur-50', 'arithmetic laws to g6 operations', 'בחישוב מקצב 100 - 4 × 5: איזו פעולה נחשב קודם? (כפל/חיסור)', 'כפל', 'כפל קודם לחיסור'],
    ['mm-cur-39', 'mm-cur-57', 'operations to average sum', 'טמפו של 4 שירים יחד מגיע לסכום 80: מהו ממוצע הטמפו לשיר?', 20, '80 לחלק ל־4'],
    ['mm-cur-40', 'mm-cur-41', 'factors to fraction reduction', 'במקצב של 6/9 פעימות, מצמצמים מונה ומכנה בגורם 3: איזה שבר פעימות נקבל? (כתבו a/b)', '2/3', 'מחלקים מונה ומכנה ב־3'],
    ['mm-cur-40', 'mm-cur-44', 'multiples to common denominator', 'בחיבור מקצבים 1/4 + 1/6: מהו המכנה המשותף הקטן (כפולה משותפת של פעימות)?', 12, '12 מתחלק ב־4 וב־6'],
    ['mm-cur-40', 'mm-cur-50', 'prime factorization to natural laws', 'בפירוק מקצב של 12 פעימות לגורמים ראשוניים: מה הפירוק? (כתבו למשל 2x2x3)', '2x2x3', '2 כפול 2 כפול 3'],
    ['mm-cur-42', 'mm-cur-41', 'visual models to equivalence', 'משך צליל של 1/2 תיבה שווה למשך של כמה רבעי תיבה?', 2, 'שני רבעים שווים לחצי'],
    ['mm-cur-42', 'mm-cur-43', 'models to fraction of amount', 'מיתר גיטרה מנגן באורך 30 ס״מ חולק ל־5 מקטעי צליל שווים: מה אורך 2/5 מהמיתר בס״מ?', 12, 'כל חמישית היא 6 ס״מ, ושתיים הן 12'],
    ['mm-cur-42', 'mm-cur-45', 'fraction models to tenths decimal', 'משך צליל של 3/10 תיבה כתוב כשבר עשרוני: איזה מספר זה? (כתבו 0.3)', 0.3, '3 עשיריות נכתבות 0.3'],
    ['mm-cur-41', 'mm-cur-44', 'equivalent fractions to addition', 'בחיבור משכי צליל: 1/3 + 1/6 (שהם 2/6 + 1/6): מה התוצאה המצומצמת? (כתבו 1/2)', '1/2', '3/6 מצטמצם ל־1/2'],
    ['mm-cur-41', 'mm-cur-51', 'fraction reduction to multiplication', 'בכפל מקצבים 2/3 × 3/4 מצמצמים את הגורם 3: מהי מכפלת השברים המצומצמת? (כתבו a/b)', '1/2', '2/4 מצטמצם ל־1/2'],
    ['mm-cur-43', 'mm-cur-51', 'fraction of amount to fraction multiplication', 'מחשבים חצי ממשך צליל של שליש (1/2 × 1/3): איזה משך שבר נקבל? (כתבו a/b)', '1/6', '1 כפול 1 במונה, 2 כפול 3 במכנה'],
    ['mm-cur-43', 'mm-cur-53', 'fraction of amount to percent whole', 'מקצב של 25% מתוך 80 פעימות שווה לרבע מתוך 80: כמה פעימות זה?', 20, '80 לחלק ל־4'],
    ['mm-cur-44', 'mm-cur-51', 'fraction operations to division', 'בחילוק מקצבים כופלים בשבר ההופכי: מהו ההופכי של משך 2/3? (כתבו a/b)', '3/2', 'הופכים מונה ומכנה'],
    ['mm-cur-45', 'mm-cur-46', 'decimal place value to alignment', 'בחיבור משכי צליל עשרוניים 1.25 + 2.3 שניות: מהו משך הזמן הכולל?', 3.55, '1.25 ועוד 2.30'],
    ['mm-cur-45', 'mm-cur-52', 'decimal places to shift', 'כשמכפילים משך צליל 0.45 שניות פי 10: מה משך הצליל החדש?', 4.5, '0.45 כפול 10'],
    ['mm-cur-45', 'mm-cur-53', 'decimal to percent', 'משך צליל עשרוני של 0.35 תיבה שווה לכמה אחוזים (מאיות) מהתיבה?', 35, '0.35 הם 35%'],
    ['mm-cur-46', 'mm-cur-52', 'decimal addition to multiplication', 'משמיעים צליל של 0.2 שניות 3 פעמים ברצף: מה משך הזמן הכולל בשניות?', 0.6, '3 פעמים 0.2'],
    ['mm-cur-47', 'mm-cur-54', 'polygon perimeter to circle circumference', 'במעגל מקצבים, מקישים היקף לפי קוטר 10 כפול π (3.14): כמה נקישות נקבל בקירוב?', 31.4, '10 כפול 3.14'],
    ['mm-cur-47', 'mm-cur-55', 'triangle area to composite shapes', 'מצולע צלילים מורכב ממלבן של 30 פעימות ומשולש של 12 פעימות: מה סך הפעימות?', 42, '30 ועוד 12'],
    ['mm-cur-48', 'mm-cur-56', 'prism geometry to volume units', 'נפח תיבה שממדיה 2 ס״מ, 3 ס״מ ו־5 ס״מ: מה נפחה בסמ״ק?', 30, '2 כפול 3 כפול 5'],
    ['mm-cur-49', 'mm-cur-57', 'frequency data to mean calculation', 'טמפו ממוצע של 3 מקצבים: 80, 90 ו־100 פעימות בדקה. מהו ממוצע הפעימות שנשמע?', 90, '270 לחלק ל־3'],
    ['mm-cur-49', 'mm-cur-58', 'data interpretation to multiple views', 'בטבלת נגינה 10 תלמידים בחרו כינור. כמה תווי כינור של 2 תלמידים יופיעו בפיקטוגרם?', 5, '10 לחלק ל־2'],
  ];

  const RESEARCH = Object.freeze({
    id: 'fyfe2014',
    citation: 'Fyfe, E. R., McNeil, N. M., Son, J. Y., & Goldstone, R. L. (2014). Concreteness fading in mathematics and science instruction. Educational Psychology Review, 26(1), 9–25.',
    doi: '10.1007/s10648-014-9249-3',
    url: 'https://doi.org/10.1007/s10648-014-9249-3',
    music: Object.freeze({ id: 'azaryahu2020', doi: '10.1080/00220973.2020.1799316', url: 'https://doi.org/10.1080/00220973.2020.1799316' })
  });

  function voiceFor(mechanism) {
    const m = String(mechanism || '');
    if (/bell|coin|angle|clock|data/.test(m)) return 'bell';
    if (/length|line|area|grid|fraction|shape|perimeter|ruler/.test(m)) return 'xylo';
    return 'drum';
  }
  function answersMatch(given, want) {
    const g = String(given == null ? '' : given).trim().replace(/\s/g, '').replace(/,/g, '.');
    const w = String(want == null ? '' : want).trim().replace(/\s/g, '').replace(/,/g, '.');
    if (g === w) return true;
    const num = /^[+-]?(?:\d+\.?\d*|\.\d+)$/;
    if (!num.test(g) || !num.test(w)) return false;
    const gn = Number(g), wn = Number(w);
    return Number.isFinite(gn) && Number.isFinite(wn) && gn === wn;
  }
  // Counts up to 12 play one tap each, so a child can count them.
  // Above that, ten of one place is one of the next: 10 tenths = 1 one,
  // 10 ones = 1 ten, 10 tens = 1 hundred. Each place has its own instrument.
  // Ones stay a short percussion tap. Tenths are always a music box
  // (musicBox), because voiceFor already uses the xylophone for ones in some
  // topics. Hundredths are a finger cymbal (fingerCymbal). Digits come from
  // the written number, so 3.55 is not rounded to 3.6. Tens are a low
  // clarinet (lowClarinet) and hundreds are a low flute (lowFlute). No topic
  // lists those voices.
  // Not the ukulele, and not a sung note.
  // Notes are spaced so each one finishes before the next starts.
  // A word, a clock time, a third decimal digit, or a number past 12 hundreds
  // plays one soft listen tone. That tone is a cue, not a quantity.
  function listenTone() {
    return [{ at: 0, voice: 'bell', held: false, hz: 523.25, listen: true }];
  }
  function placeVoices(mechanism) {
    const one = voiceFor(mechanism);
    return {
      hundred: { voice: 'lowFlute', held: true, hz: 196, place: 'hundred' },
      ten: { voice: 'lowClarinet', held: true, hz: 146, place: 'ten' },
      one: { voice: one, held: false, place: 'one' },
      tenth: { voice: 'musicBox', held: false, hz: 1318.5, place: 'tenth' },
      hundredth: { voice: 'fingerCymbal', held: false, hz: 2093, place: 'hundredth' },
    };
  }
  function soundPlan(mechanism, answer) {
    const s = String(answer == null ? '' : answer).trim().replace(/,/g, '.');
    if (!/^[+-]?(?:\d+\.?\d*|\.\d+)$/.test(s)) return listenTone();
    const n = Number(s);
    if (!(n > 0) || !Number.isFinite(n)) return listenTone();
    const bits = s.replace(/^[+-]/, '').split('.');
    let whole = parseInt(bits[0] || '0', 10);
    if (!whole) whole = 0;
    const frac = (bits[1] || '').replace(/0+$/, '');
    if (frac.length > 2) return listenTone();
    const tenths = frac.length ? frac.charCodeAt(0) - 48 : 0;
    const hundredths = frac.length > 1 ? frac.charCodeAt(1) - 48 : 0;
    const places = placeVoices(mechanism);
    const events = [];
    function add(count, spec) {
      for (let i = 0; i < count; i++) events.push(spec);
    }
    if (tenths === 0 && hundredths === 0 && whole <= 12) add(whole, places.one);
    else if (whole < 100) {
      add(Math.floor(whole / 10), places.ten);
      add(whole % 10, places.one);
    } else if (Math.floor(whole / 100) <= 12) {
      add(Math.floor(whole / 100), places.hundred);
      add(Math.floor(whole / 10) % 10, places.ten);
      add(whole % 10, places.one);
    } else return listenTone();
    add(tenths, places.tenth);
    add(hundredths, places.hundredth);
    // 0.7s is longer than a held note (0.5s) and a bell tap (0.6s), so the
    // places are heard one after another instead of as one chord.
    const STEP = 0.7;
    return events.map(function (ev, i) {
      return { at: Math.round(i * STEP * 1000) / 1000, voice: ev.voice, held: ev.held, hz: ev.hz, place: ev.place };
    });
  }
  const PERCUSSION = { drum: true, bell: true, xylo: true };
  let playGen = 0;
  const playTimers = [];
  function silenced(e) {
    if (e && (e.muted || e.quiet)) return true;
    if (typeof audioState === 'function' && audioState.muted) return true;
    try { if (typeof loadAccess === 'function' && loadAccess().quiet) return true; } catch (err) { /* no storage */ }
    try { if (typeof prefsNow === 'function' && prefsNow().quiet) return true; } catch (err) { /* no prefs */ }
    return false;
  }
  function play(entry, env) {
    const events = (entry && entry.sound) || [];
    const e = env || {};
    const gen = ++playGen;
    playTimers.forEach(function (id) { clearTimeout(id); });
    playTimers.length = 0;
    if (silenced(e)) return events;
    const tap = e.playTap || (typeof playTap === 'function' ? playTap : null);
    const sing = e.playVoice || (typeof playVoice === 'function' ? playVoice : null);
    const ac = e.audioContext || (typeof getSharedAudioContext === 'function' ? getSharedAudioContext() : null);
    if (typeof tap !== 'function' && typeof sing !== 'function') return events;
    const later = e.later || function (fn, ms) {
      const id = setTimeout(fn, ms);
      playTimers.push(id);
    };
    events.forEach(function (ev) {
      later(function () {
        if (gen !== playGen || silenced(e)) return;
        const hz = ev.hz != null ? ev.hz : (ev.held ? 110 : undefined);
        if (!PERCUSSION[ev.voice] && typeof sing === 'function' && ac) {
          sing(ac, ev.voice, hz, ac.currentTime || 0, null, ev.held ? { dur: 0.5 } : null);
          return;
        }
        if (typeof tap === 'function') tap(ev.voice, { step: 0, hz: hz });
      }, Math.round(ev.at * 1000));
    });
    return events;
  }
  function mountAnswer(container, entry) {
    if (!container || !entry || typeof container.appendChild !== 'function') return null;
    const d = container.ownerDocument;
    if (!d || typeof d.createElement !== 'function') return null;
    const key = d.createElement('p');
    key.className = 'topic-bridge-key';
    key.textContent = 'חליל נמוך = 100, קלרינט נמוך = 10, נקישה קצרה = 1, תיבת נגינה = עשיריות (למשל 7.70), צילצל = מאיות (למשל 3.55).';
    const input = d.createElement('input');
    input.className = 'topic-bridge-answer'; input.setAttribute('aria-label', 'תשובת הגשר');
    const hint = d.createElement('p'); hint.className = 'mm-ex-hint'; hint.hidden = true;
    const again = d.createElement('button'); again.type = 'button'; again.className = 'topic-bridge-replay'; again.textContent = 'שמע שוב';
    again.onclick = function () { play(entry); };
    const go = d.createElement('button'); go.type = 'button'; go.className = 'topic-bridge-check'; go.textContent = 'עניתי';
    go.onclick = function () {
      const ok = entry.check(input.value);
      hint.hidden = !!ok; hint.textContent = ok ? '' : (entry.hint || '');
      container._bridgeOk = ok;
    };
    container.appendChild(key); container.appendChild(again); container.appendChild(input); container.appendChild(go); container.appendChild(hint);
    return { input: input, button: go, hint: hint, key: key, again: again };
  }
  const BRIDGES = {};
  const BY_FROM = {};
  const BY_TO = {};

  RAW_BRIDGES.forEach(function (row) {
    const entry = {
      from: row[0], to: row[1], mechanism: row[2], prompt: row[3], answer: row[4], hint: row[5],
      source: RESEARCH,
      sound: soundPlan(row[2], row[4])
    };
    entry.check = function (given) { return answersMatch(given, entry.answer); };
    Object.freeze(entry);
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
    RESEARCH: RESEARCH,
    bridgeForLink: bridgeForLink,
    bridgesForTopic: bridgesForTopic,
    bridgesEnteringTopic: bridgesEnteringTopic,
    play: play, mountAnswer: mountAnswer, soundPlan: soundPlan, voiceFor: voiceFor,
  };
});
