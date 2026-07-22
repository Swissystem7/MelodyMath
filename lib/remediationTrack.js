'use strict';
// MelodyMath — early-grade math remediation engine (כיתות א-ד).
// Music/rhythm is the engagement layer; the sellable outcome is closing basic-arithmetic gaps.
// Pure + deterministic. diagnoseGaps() scores a short diagnostic; remediationPlan() builds an
// ordered, prerequisite-first practice plan mapping each gap to practice items + a rhythm reward.

// Early-grade skills in curriculum (prerequisite) order. Foundational skills first — a gap in an
// earlier skill is fixed before a later one, because later skills depend on it.
const SKILLS = [
  { key: 'counting',        he: 'מנייה',           grade: 'א' },
  { key: 'addition',        he: 'חיבור',           grade: 'א' },
  { key: 'subtraction',     he: 'חיסור',           grade: 'ב' },
  { key: 'multiplication',  he: 'כפל',             grade: 'ג' },
  { key: 'basic_fractions', he: 'שברים בסיסיים',   grade: 'ד' },
];
const SKILL_ORDER = SKILLS.reduce((m, s, i) => (m[s.key] = i, m), {});
const skillHe = (key) => (SKILLS.find(s => s.key === key) || {}).he || key;

// Practice bank, keyed by skill. Music-framed where natural (beats/claps/notes) so the child stays
// motivated, but each item is really basic arithmetic. answer is the exact expected string/number.
const BANK = {
  counting: [
    { prompt: 'סְפרו את הפעימות: 🥁🥁🥁🥁🥁 — כמה יש?', answer: 5, hint: 'נגעו בכל תוף פעם אחת וספרו' },
    { prompt: 'כמה תווים בשורה? ♪ ♪ ♪ ♪ ♪ ♪ ♪', answer: 7, hint: 'ספרו אחד-אחד משמאל לימין' },
    { prompt: 'התחילו מ-6 והמשיכו פעימה אחת: 6, ואז...', answer: 7, hint: 'המספר שבא אחרי 6' },
    { prompt: 'כמה מחיאות כפיים? 👏👏👏👏👏👏👏👏', answer: 8, hint: 'ספרו כל מחיאה' },
  ],
  addition: [
    { prompt: '3 פעימות תוף ועוד 2 פעימות — כמה פעימות ביחד?', answer: 5, hint: '3 ואז עוד 2: 3, 4, 5' },
    { prompt: 'בתיבה יש 4 תווים, הוספנו 3 תווים. כמה תווים עכשיו?', answer: 7, hint: 'חברו 4 + 3' },
    { prompt: '5 + 4 = ?', answer: 9, hint: 'התחילו מ-5 והוסיפו 4 פעימות' },
    { prompt: 'שתי קבוצות מחיאות: 6 ועוד 6. כמה בסך הכול?', answer: 12, hint: '6 + 6' },
  ],
  subtraction: [
    { prompt: 'היו 8 פעימות, שתיים שתקו. כמה נשמעו?', answer: 6, hint: '8 פחות 2' },
    { prompt: '9 תווים, מחקנו 4. כמה נשארו?', answer: 5, hint: 'ספרו אחורה מ-9 ארבעה צעדים' },
    { prompt: '7 - 3 = ?', answer: 4, hint: 'התחילו מ-7 והורידו 3' },
    { prompt: 'מ-10 מחיאות עצרנו אחרי 6. כמה נשארו?', answer: 4, hint: '10 פחות 6' },
  ],
  multiplication: [
    { prompt: '3 תיבות, בכל אחת 2 פעימות. כמה פעימות בסך הכול?', answer: 6, hint: '3 פעמים 2' },
    { prompt: '4 × 2 = ?', answer: 8, hint: 'ארבע קבוצות של שתיים' },
    { prompt: '5 שורות של 3 תווים כל אחת. כמה תווים?', answer: 15, hint: '5 פעמים 3' },
    { prompt: '2 × 6 = ?', answer: 12, hint: 'שתי קבוצות של שש' },
  ],
  basic_fractions: [
    { prompt: 'חצי תיבה + חצי תיבה = כמה תיבות שלמות?', answer: 1, hint: 'שני חצאים שווים שלם' },
    { prompt: 'חילקנו עוגה ל-4 חלקים שווים. כמה חלקים הם רבע?', answer: 1, hint: 'רבע = חלק אחד מארבעה' },
    { prompt: 'כמה רבעים יש בשלם?', answer: 4, hint: 'ארבעה רבעים משלימים שלם' },
    { prompt: 'חצי מתוך 8 מחיאות זה כמה מחיאות?', answer: 4, hint: 'חצי = לחלק ל-2' },
  ],
};

// Deterministic seeded RNG (same as the app's, so plans are reproducible).
const seededRandom = (seed) => {
  let s = (seed | 0) || 1;
  return () => (s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff;
};

// diagnoseGaps(answers): answers = [{skill, correct:boolean}, ...] from a short diagnostic.
// Returns per-skill mastery + the ordered list of gap skills (prerequisite-first) with a plain-Hebrew
// parent-facing summary. mastered = every attempted item in that skill correct AND at least one seen.
function diagnoseGaps(answers) {
  if (!Array.isArray(answers)) throw new TypeError('answers must be an array');
  const agg = {};
  for (const a of answers) {
    if (!a || typeof a.skill !== 'string' || typeof a.correct !== 'boolean') {
      throw new TypeError('each answer needs {skill:string, correct:boolean}');
    }
    if (!(a.skill in SKILL_ORDER)) throw new RangeError(`unknown skill: ${a.skill}`);
    const g = agg[a.skill] || (agg[a.skill] = { skill: a.skill, total: 0, correct: 0 });
    g.total++; if (a.correct) g.correct++;
  }
  const perSkill = Object.values(agg).map(g => ({
    ...g,
    he: skillHe(g.skill),
    accuracy: g.total ? g.correct / g.total : 0,
    mastered: g.total > 0 && g.correct === g.total,
  })).sort((a, b) => SKILL_ORDER[a.skill] - SKILL_ORDER[b.skill]);

  const gaps = perSkill
    .filter(s => !s.mastered)
    .sort((a, b) => SKILL_ORDER[a.skill] - SKILL_ORDER[b.skill]) // prerequisite-first
    .map(s => s.skill);

  const summary = gaps.length
    ? `זוהו פערים ב: ${gaps.map(skillHe).join(', ')}. מומלץ להתחיל מהמיומנות הבסיסית ביותר ולעלות בהדרגה.`
    : 'אין פערים בולטים — הילד שולט בכל המיומנויות שנבדקו. אפשר לעבור לתרגול העשרה.';
  return { perSkill, gaps, summary };
}

// remediationPlan(gaps, opts): ordered practice plan. For each gap skill: a few practice items from
// BANK + a short rhythm/music reward step (the motivation hook). Deterministic via opts.seed.
// gaps = array of skill keys (e.g. the .gaps from diagnoseGaps). Preserves prerequisite order.
function remediationPlan(gaps, opts = {}) {
  if (!Array.isArray(gaps)) throw new TypeError('gaps must be an array of skill keys');
  const perSkill = Number.isInteger(opts.perSkill) ? opts.perSkill : 3;
  const seed = Number.isInteger(opts.seed) ? opts.seed : 1;
  const ordered = [...new Set(gaps)]
    .filter(k => k in SKILL_ORDER)
    .sort((a, b) => SKILL_ORDER[a] - SKILL_ORDER[b]);

  const steps = ordered.map((skill, i) => {
    const rng = seededRandom(seed + i * 97);
    const pool = BANK[skill].slice();
    const items = [];
    while (items.length < Math.min(perSkill, pool.length)) {
      const idx = Math.floor(rng() * pool.length);
      items.push(pool.splice(idx, 1)[0]);
    }
    return {
      skill,
      he: skillHe(skill),
      items,
      reward: { type: 'rhythm', label: `כל הכבוד! נגנו מקצב קצר לחגוג את ${skillHe(skill)} 🥁` },
    };
  });
  return { steps, totalItems: steps.reduce((n, s) => n + s.items.length, 0) };
}

function demo() {
  const assert = require('assert');
  // Gaps prerequisite-ordered: subtraction gap must come before multiplication gap regardless of input order.
  const dx = diagnoseGaps([
    { skill: 'counting', correct: true },
    { skill: 'multiplication', correct: false },
    { skill: 'subtraction', correct: false },
    { skill: 'addition', correct: true },
  ]);
  assert.deepStrictEqual(dx.gaps, ['subtraction', 'multiplication'], 'gaps prerequisite-ordered');
  assert.ok(dx.perSkill.find(s => s.skill === 'counting').mastered, 'counting mastered');
  // No gaps when all correct.
  assert.deepStrictEqual(diagnoseGaps([{ skill: 'counting', correct: true }]).gaps, []);
  // Plan: one step per gap, in prerequisite order, each with items + a reward.
  const plan = remediationPlan(dx.gaps, { seed: 7, perSkill: 2 });
  assert.strictEqual(plan.steps.length, 2);
  assert.strictEqual(plan.steps[0].skill, 'subtraction');
  assert.strictEqual(plan.steps[1].skill, 'multiplication');
  assert.strictEqual(plan.steps[0].items.length, 2);
  assert.ok(plan.steps[0].reward.type === 'rhythm');
  // Deterministic: same seed -> same items.
  const p2 = remediationPlan(dx.gaps, { seed: 7, perSkill: 2 });
  assert.deepStrictEqual(plan.steps[0].items, p2.steps[0].items, 'seeded plan reproducible');
  // Validation.
  assert.throws(() => diagnoseGaps('nope'), TypeError);
  assert.throws(() => diagnoseGaps([{ skill: 'bogus', correct: true }]), RangeError);
  console.log('remediationTrack selftest OK');
}

if (require.main === module) demo();
module.exports = { SKILLS, BANK, diagnoseGaps, remediationPlan, skillHe };
