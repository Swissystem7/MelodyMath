const exerciseSets = () => [
  { id: 1, level: 1, mathTopic: 'fractions', musicConcept: 'rhythm', prompt: 'רבע מנוקד שווה לכמה שמיניות?', answer: 3, hint: 'רבע רגיל = 2 שמיניות, והנקודה מוסיפה חצי מערך התו' },
  { id: 2, level: 1, mathTopic: 'fractions', musicConcept: 'rhythm', prompt: 'כמה רבעים יש בתיבה בזמן 4/4?', answer: 4, hint: 'המספר העליון מציין כמה רבעים בתיבה' },
  { id: 3, level: 1, mathTopic: 'ratios', musicConcept: 'intervals', prompt: 'מה היחס בין תדר של דו לתדר של סול במרווח קווינטה?', answer: '3:2', hint: 'קווינטה נקייה היא יחס 3:2' },
  { id: 4, level: 1, mathTopic: 'fractions', musicConcept: 'rhythm', prompt: 'כמה שמיניות יש בתיבה בזמן 3/4?', answer: 6, hint: 'כל רבע שווה 2 שמיניות' },
  { id: 5, level: 1, mathTopic: 'ratios', musicConcept: 'intervals', prompt: 'מה היחס בין תדר של דו לתדר של פה במרווח קוורטה?', answer: '4:3', hint: 'קוורטה נקייה היא יחס 4:3' },
  { id: 6, level: 1, mathTopic: 'fractions', musicConcept: 'rhythm', prompt: 'כמה רבעים שווה חצי מנוקד?', answer: 3, hint: 'חצי רגיל = 2 רבעים, והנקודה מוסיפה רבע נוסף' },
  { id: 7, level: 1, mathTopic: 'exponents', musicConcept: 'tempo', prompt: 'אם מהירות הקצב מוכפלת פי 2 בכל דקה, כמה פעמים תגדל המהירות אחרי 3 דקות?', answer: 8, hint: '2 בחזקת 3' },
  { id: 8, level: 1, mathTopic: 'fractions', musicConcept: 'rhythm', prompt: 'כמה שש-עשריות יש בתיבה בזמן 2/4?', answer: 8, hint: 'כל רבע שווה 4 שש-עשריות' },
  { id: 9, level: 1, mathTopic: 'ratios', musicConcept: 'intervals', prompt: 'מה היחס בין תדר של דו לתדר של דו באוקטבה?', answer: '2:1', hint: 'אוקטבה היא הכפלת התדר פי 2' },
  { id: 10, level: 1, mathTopic: 'fractions', musicConcept: 'rhythm', prompt: 'משך תיבה במשקל 6/8 שווה לכמה רבעים?', answer: 3, hint: 'שש שמיניות שוות במשך לשלושה רבעים; בפועל מקובל להרגיש שתי פעימות של רבע מנוקד' },
  { id: 11, level: 1, mathTopic: 'exponents', musicConcept: 'tempo', prompt: 'אם הקצב מתחיל ב-60 BPM ומכפיל את עצמו כל 2 דקות, מה הקצב אחרי 4 דקות?', answer: 240, hint: '60 * 2^(4/2) = 60 * 4' },
  { id: 12, level: 1, mathTopic: 'fractions', musicConcept: 'rhythm', prompt: 'כמה חצאים יש בתיבה בזמן 4/4?', answer: 2, hint: 'כל חצי שווה 2 רבעים' },
  { id: 13, level: 2, mathTopic: 'fractions', musicConcept: 'rhythm', prompt: 'כמה רבעים שווה שלם מנוקד?', answer: 6, hint: 'שלם רגיל = 4 רבעים, והנקודה מוסיפה 2 רבעים' },
  { id: 14, level: 2, mathTopic: 'ratios', musicConcept: 'intervals', prompt: 'מה היחס בין תדר של דו לתדר של מי במרווח טרצה גדולה?', answer: '5:4', hint: 'טרצה גדולה היא יחס 5:4' },
  { id: 15, level: 2, mathTopic: 'exponents', musicConcept: 'tempo', prompt: 'אם הקצב מתחיל ב-40 BPM ומשולש כל דקה, מה הקצב אחרי 3 דקות?', answer: 1080, hint: '40 * 3^3' },
  { id: 16, level: 2, mathTopic: 'fractions', musicConcept: 'rhythm', prompt: 'כמה שמיניות שווה חצי מנוקד?', answer: 6, hint: 'חצי רגיל = 4 שמיניות, והנקודה מוסיפה 2 שמיניות' },
  { id: 17, level: 2, mathTopic: 'ratios', musicConcept: 'intervals', prompt: 'מה היחס בין תדר של דו לתדר של לה במרווח סקסטה גדולה?', answer: '5:3', hint: 'סקסטה גדולה היא יחס 5:3' },
  { id: 18, level: 2, mathTopic: 'functions', musicConcept: 'melody', prompt: 'אם תו עולה ב-2 חצאי טונים כל צעד, מה הגובה אחרי 5 צעדים?', answer: 10, hint: '2 * 5 = 10 חצאי טונים' },
  { id: 19, level: 2, mathTopic: 'fractions', musicConcept: 'rhythm', prompt: 'כמה שש-עשריות יש בתיבה בזמן 3/4?', answer: 12, hint: 'כל רבע שווה 4 שש-עשריות' },
  { id: 20, level: 2, mathTopic: 'exponents', musicConcept: 'tempo', prompt: 'אם הקצב מתחיל ב-50 BPM ומכפיל את עצמו כל 3 דקות, מה הקצב אחרי 6 דקות?', answer: 200, hint: '50 * 2^(6/3) = 50 * 4' },
  { id: 21, level: 2, mathTopic: 'ratios', musicConcept: 'intervals', prompt: 'מה היחס בין תדר של דו לתדר של סי במרווח ספטימה גדולה?', answer: '15:8', hint: 'ספטימה גדולה היא יחס 15:8' },
  { id: 22, level: 2, mathTopic: 'functions', musicConcept: 'melody', prompt: 'אם תו יורד ב-3 חצאי טונים כל צעד, מה הגובה אחרי 4 צעדים?', answer: -12, hint: '-3 * 4 = -12 חצאי טונים' },
  { id: 23, level: 2, mathTopic: 'fractions', musicConcept: 'rhythm', prompt: 'כמה רבעים שווה שמינית מנוקדת?', answer: 0.75, hint: 'שמינית רגילה = 0.5 רבע, והנקודה מוסיפה 0.25 רבע' },
  { id: 24, level: 2, mathTopic: 'exponents', musicConcept: 'tempo', prompt: 'אם הקצב מתחיל ב-30 BPM ומכפיל את עצמו כל דקה, מה הקצב אחרי 5 דקות?', answer: 960, hint: '30 * 2^5' },
  { id: 25, level: 3, mathTopic: 'fractions', musicConcept: 'rhythm', prompt: 'כמה שמיניות יש בתיבה בזמן 12/8?', answer: 12, hint: 'המספר העליון מציין שמיניות' },
  { id: 26, level: 3, mathTopic: 'ratios', musicConcept: 'intervals', prompt: 'מה היחס בין תדר של דו לתדר של רה דיאז במרווח סקונדה מוגדלת?', answer: '75:64', hint: 'סקונדה מוגדלת היא יחס 75:64' },
  { id: 27, level: 3, mathTopic: 'functions', musicConcept: 'melody', prompt: 'אם תו עולה ב-4 חצאי טונים ואז יורד ב-2, מה השינוי הכולל אחרי 3 חזרות?', answer: 6, hint: 'כל חזרה: 4-2=2, 3*2=6' },
  { id: 28, level: 3, mathTopic: 'exponents', musicConcept: 'tempo', prompt: 'אם הקצב מתחיל ב-20 BPM ומשולש כל 2 דקות, מה הקצב אחרי 6 דקות?', answer: 540, hint: '20 * 3^(6/2) = 20 * 27' },
  { id: 29, level: 3, mathTopic: 'fractions', musicConcept: 'rhythm', prompt: 'כמה רבעים שווה שלם עם שתי נקודות הארכה?', answer: 7, hint: 'שלם רגיל = 4 רבעים; שתי הנקודות מוסיפות חצי ועוד רבע מערך התו, כלומר 3 רבעים' },
  { id: 30, level: 3, mathTopic: 'ratios', musicConcept: 'intervals', prompt: 'מה היחס בין תדר של דו לתדר של פה דיאז במרווח טריטון?', answer: '45:32', hint: 'טריטון הוא יחס 45:32' },
  { id: 31, level: 3, mathTopic: 'functions', musicConcept: 'melody', prompt: 'אם תו עולה ב-5 חצאי טונים כל צעד, מה הגובה אחרי 7 צעדים?', answer: 35, hint: '5 * 7 = 35 חצאי טונים' },
  { id: 32, level: 3, mathTopic: 'exponents', musicConcept: 'tempo', prompt: 'אם הקצב מתחיל ב-10 BPM ומכפיל את עצמו כל 5 דקות, מה הקצב אחרי 15 דקות?', answer: 80, hint: '10 * 2^(15/5) = 10 * 8' },
  { id: 33, level: 3, mathTopic: 'fractions', musicConcept: 'rhythm', prompt: 'כמה שמיניות שווה רבע עם שתי נקודות הארכה?', answer: 3.5, hint: 'רבע רגיל = 2 שמיניות; שתי הנקודות מוסיפות שמינית ועוד שש־עשרית, ובסך הכול 3.5 שמיניות' },
  { id: 34, level: 3, mathTopic: 'ratios', musicConcept: 'intervals', prompt: 'מה היחס בין תדר של דו לתדר של סול במול במרווח קווינטה מוקטנת?', answer: '64:45', hint: 'קווינטה מוקטנת היא יחס 64:45' },
  { id: 35, level: 3, mathTopic: 'functions', musicConcept: 'melody', prompt: 'אם תו יורד ב-6 חצאי טונים ואז עולה ב-3, מה השינוי הכולל אחרי 4 חזרות?', answer: -12, hint: 'כל חזרה: -6+3=-3, 4*(-3)=-12' }
];

const seededRandom = (seed) => {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
};

const nextExercise = (history, opts) => {
  if (!Array.isArray(history)) throw new TypeError('history must be an array');
  if (!opts || !Number.isInteger(opts.seed)) throw new TypeError('opts.seed must be an integer');
  if (history.some(item => !item || !Number.isInteger(item.id) || typeof item.correct !== 'boolean')) {
    throw new TypeError('invalid history item');
  }
  const seed = opts.seed;
  const rng = seededRandom(seed);
  const allExercises = exerciseSets();
  const seenIds = new Set(history.map(h => h.id));
  const unseen = allExercises.filter(e => !seenIds.has(e.id));
  
  if (unseen.length === 0) {
    const randIndex = Math.floor(rng() * allExercises.length);
    return allExercises[randIndex];
  }

  let currentLevel = 1;
  if (history.length > 0) {
    const lastLevel = allExercises.find(e => e.id === history[history.length - 1].id)?.level || 1;
    currentLevel = lastLevel;
    const lastTwo = history.slice(-2);
    if (lastTwo.length === 2 && lastTwo.every(h => h.correct)) currentLevel = Math.min(3, lastLevel + 1);
    else if (lastTwo.length === 2 && lastTwo.every(h => !h.correct)) currentLevel = Math.max(1, lastLevel - 1);
  }

  const levelExercises = unseen.filter(e => e.level === currentLevel);
  if (levelExercises.length > 0) {
    const idx = Math.floor(rng() * levelExercises.length);
    return levelExercises[idx];
  }

  return unseen[Math.floor(rng() * unseen.length)];
};

module.exports = { exerciseSets, nextExercise };
