// MM-610 — writes docs/MM-610/exercises.md from the pilot data (no personal data):
// per unit its id, title, grade and curriculum ids; per exercise the text the
// child sees, the music (one line), and the why-feedback after a right and a
// wrong answer; then the pre/post checks (no music).
//   node pilot/tools/exercises-md.js        (from the repo root)
'use strict';
const fs = require('fs');
const path = require('path');
const Cov = require('../js/coverage.js');
const S = require('../js/score.js');
const K = require('../js/checks.js');
const U = require('../js/unit.js');

const LEGACY_MUSIC = {
  join: 'שתי מנגינות (פסנתר ואז קסילופון) מתחברות; צליל לכל 1',
  remove: 'מנגינה שמורידים מסופה צלילים (✕)',
  tens: 'צליל עוגב נמוך לכל עשרת, קסילופון לכל יחידה'
};

function musicLine(q) {
  if (q.kind === 'rhythm') return 'תיבה 4/4 במטרונום, שני רבעים נתונים; בוחרים קצב שממלא את התיבה';
  if (!q.kind) return LEGACY_MUSIC[q.music] || q.music;
  const m = q.music;
  const what = {
    beats: () => 'תיבות של פעמות עם הדגשה (' + (m.block ? 'כל תיבה צליל עוגב אחד, ' : '') + 'תיבות: ' + (m.bars || []).join(', ') + (m.extra ? '; ועוד ' + m.extra + ' מחוץ לתיבה' : '') + ')',
    steps: () => 'צעדים בסולם, צעד לכל מספר (מ־' + m.from + ', קפיצה ' + m.step + (m.mod ? ', מעגל של ' + m.mod : '') + ')',
    place: () => 'כלי לכל מקום: גונג = אלפים, עוגב = מאות, בס = עשרות, קסילופון = יחידות',
    pattern: () => 'דגם מלודי חוזר (' + m.seq.length + ' צלילים' + (m.groupBy ? ', ביחידות של ' + m.groupBy : '') + ')',
    pitch: () => 'דיאגרמה מתנגנת: לכל עמודה כלי וגובה, צליל לכל פריט',
    durations: () => 'משכי תווים בתוך תיבה של 4 פעמות',
    turn: () => 'סיבוב שלם = תיבה של 4 פעמות; תו מוחזק = הזווית (' + m.turns.join(', ') + ' פעמות)',
    shape: () => 'לולאה סביב הצורה: מכה מודגשת בכל קודקוד' + (m.shapes[0].sides ? ', צליל לכל ס״מ' : ''),
    tempo: () => 'שני תופים באותו משך זמן (' + m.rows.map((r) => r.n).join(' מול ') + ' מכות)'
  }[m.kind];
  return what ? what() : m.kind;
}

function childText(q) {
  if (!q.kind) return U.questionText(q);
  if (q.kind === 'rhythm') return '1/4 + 1/4 + ? = 1 — איזה קצב ממלא את סוף התיבה?';
  return q.q + (q.expr ? ' (' + q.expr + ')' : '') + (q.choices ? ' — אפשרויות: ' + q.choices.map((c) => c.label).join(' / ') : '');
}

const esc = (s) => String(s == null ? '' : s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
const out = [];
out.push('# MM-610 — יחידות ותרגילי הפיילוט');
out.push('');
out.push('נוצר אוטומטית מ־`pilot/js/unit.js`, `pilot/js/units.js` ו־`pilot/js/checks.js` על ידי `node pilot/tools/exercises-md.js`. אין כאן נתונים אישיים.');
out.push('');
const map = Cov.map();
out.push('**כיסוי:** ' + map.covered + ' מתוך ' + map.total + ' נושאי כיתות א׳–ג׳ בתוכנית (src/lib/curriculum.js). ' + Cov.allUnits().length + ' יחידות, ' + Cov.allUnits().reduce((n, u) => n + u.questions.length, 0) + ' תרגילים.');
out.push('');
Cov.allUnits().forEach((u) => {
  const ids = [...new Set(u.topics.flatMap((t) => t.curr || []).concat(u.questions.flatMap((q) => q.curr || [])))];
  out.push('## ' + u.id + ' — ' + u.title + ' (כיתות ' + u.grades + ')');
  out.push('');
  out.push('נושאים בתוכנית: ' + ids.map((x) => '`' + x + '`').join(', '));
  out.push('');
  out.push('**מיומנות מוזיקלית → מיומנות מתמטית:** ' + u.skill.music + ' ← בונה → ' + u.skill.math + '. רמת ראיה: ' + u.skill.level + ' (' + u.skill.sources.join(', ') + ').');
  out.push('');
  out.push('| תרגיל | מה הילד רואה | המוזיקה | למה — אחרי תשובה נכונה | למה — אחרי תשובה שגויה |');
  out.push('|---|---|---|---|---|');
  u.questions.forEach((q) => {
    out.push('| `' + q.id + '` | ' + esc(childText(q)) + ' | ' + esc(musicLine(q)) + ' | ' + esc(q.right) + ' | ' + esc(q.wrong) + ' |');
  });
  out.push('');
  ['pre', 'post'].forEach((ph) => {
    const items = K.checkFor(u.id, ph);
    out.push('**' + (ph === 'pre' ? 'בדיקה לפני' : 'בדיקה אחרי') + ' (בלי מוזיקה):** ' + items.map((it) => '`' + it.id + '` ' + it.q + ' → ' + it.answer).join(' · '));
    out.push('');
  });
});
const file = path.join(__dirname, '..', '..', 'docs', 'MM-610', 'exercises.md');
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, out.join('\n'));
console.log('wrote ' + file);
