#!/usr/bin/env node
// כמה שורות יש ב-PR באמת — ומה ש-auto_merger רואה.
//
// ה-auto_merger ממזג רק PR-ים של עד 400 שורות שונות (תוספות + מחיקות), והוא
// מודד את מה ש-GitHub מציג: את הדיף מנקודת הפיצול, `git diff base...branch`.
// כשענף בנוי מעל ענף אחר שנחת ביעד כ-squash, נקודת הפיצול נשארת מאחור, ואותן
// שורות שכבר נמצאות ביעד נספרות שוב. אז PR קטן מוצג כגדול, ומבקשים לפצל אותו
// בלי שיש מה לפצל — ראו docs/PR-300-SPLIT.md ו-docs/PR-305-SPLIT.md.
//
// מה שבאמת חסר ביעד הוא דיף שתי-הנקודות, `git diff base..branch`, והוא זה
// שקובע אם צריך פיצול אמיתי:
//
//   node tools/pr-size.js origin/factory/laptop-claude-263-sync-9
//   node tools/pr-size.js <branch> [base] [limit] [forkBase]
//
// מלכודת שנייה: ענף שנחתך מענף אינטגרציה אחר — למשל נוצר מעל `master` אבל ה-PR
// פתוח מול `main` — גורר איתו את כל הפער שבין השניים, גם אם הקומיט שלו עצמו
// קטנטן. שם גם דיף שתי-הנקודות גדול, והוא עדיין לא מצדיק פיצול: צריך להפנות את
// ה-PR לבסיס הנכון. מעבירים את בסיס החיתוך כארגומנט רביעי כדי לראות את זה
// (`docs/PR-342-SPLIT.md`).
//
// מלכודת שלישית: חלק מקבצי ה-PR כבר נחתו ביעד בדיוק — אותו תוכן בדיוק, בדרך
// אחרת (סלייס אחר, סנכרון אחר). השורות שלהם נספרות ב-GitHub אבל המיזוג לא יוסיף
// בהם דבר. לכן הכלי משווה blob מול blob: קובץ שתוכנו ביעד זהה לתוכנו בענף נספר
// כ«נחת», ומה שנותר הוא מה שבאמת שוקלים לפצל (`docs/PR-370-SUPERSEDED.md`).
//
// שימו לב שדיף שתי-הנקודות מצומצם לקבצים שה-PR נוגע בהם: בלי הצמצום הוא סופר גם
// את כל מה שהיעד עצמו צבר מאז בקבצים אחרים, וענף שפשוט נשאר מאחור נראה כאילו
// חסרות ממנו אלפי שורות.
//
// אין תלויות ואין רשת — רק `git diff` ו-`git rev-parse`, קריאות קריאה בלבד.
'use strict';

const LIMIT = 400;

// 'N files changed, A insertions(+), D deletions(-)' → {files, insertions, deletions, changed}
// שורה ריקה (אין הפרש) היא אפס, ולא שגיאה.
function parseShortstat(text) {
  const out = { files: 0, insertions: 0, deletions: 0, changed: 0 };
  const num = (re) => {
    const m = re.exec(String(text || ''));
    return m ? Number(m[1]) : 0;
  };
  out.files = num(/(\d+) files? changed/);
  out.insertions = num(/(\d+) insertions?\(\+\)/);
  out.deletions = num(/(\d+) deletions?\(-\)/);
  out.changed = out.insertions + out.deletions;
  return out;
}

// displayed = מה ש-GitHub/auto_merger מודדים, real = מה שבאמת חסר ביעד,
// own = מה שהענף עצמו הוסיף מעל בסיס החיתוך שלו (אופציונלי),
// landed = {changed, files} של הקבצים שתוכנם ביעד כבר זהה לתוכנם בענף (אופציונלי).
function verdict(displayed, real, limit, own, landed) {
  const max = Number(limit) || LIMIT;
  // קבצים זהים הם ההוכחה החזקה ביותר שאין מה למזג, ולכן הם נבדקים ראשונים.
  if (landed && landed.changed > 0) {
    const remaining = Math.max(0, displayed - landed.changed);
    if (remaining === 0) {
      return {
        kind: 'superseded',
        ok: false,
        message:
          'אין מה לפצל — כל ' + displayed + ' השורות כבר נמצאות ביעד, ב-' + landed.files +
          ' קבצים שתוכנם זהה. המיזוג לא יוסיף דבר: לסגור את ה-PR.',
      };
    }
    if (displayed > max && remaining <= max) {
      return {
        kind: 'partly-landed',
        ok: false,
        message:
          'אין מה לפצל — ' + landed.changed + ' מתוך ' + displayed + ' השורות כבר נמצאות ביעד ' +
          'ב-' + landed.files + ' קבצים שתוכנם זהה, ונותרו ' + remaining + ' שורות בלבד. למזג ' +
          'את היעד לענף ולמדוד שוב; אם מה שנותר רק מחזיר את היעד אחורה, לסגור את ה-PR.',
      };
    }
  }
  // התקרה של auto_merger היא על המספר המוצג. כשהוא מתחת לתקרה אין על מה לדון,
  // גם אם היעד התקדם מאז בקבצים האלה — מיזוג מחיל את דיף שלוש-הנקודות בלבד.
  if (displayed <= max) {
    return {
      kind: 'ok',
      ok: true,
      message: 'עומד בתקרה: ' + displayed + ' שורות מתוך ' + max + '.',
    };
  }
  if (own != null && own <= max && real > max) {
    return {
      kind: 'wrong-base',
      ok: false,
      message:
        'אין מה לפצל — ה-PR פתוח מול הבסיס הלא נכון: הענף עצמו מוסיף ' + own +
        ' שורות, אבל הוא גורר עוד ' + (real - own) + ' שורות של פער בין ענפי האינטגרציה. ' +
        'להפנות אותו לבסיס שממנו נחתך, ולסנכרן את הפער בנפרד.',
    };
  }
  if (real > max) {
    return {
      kind: 'split',
      ok: false,
      message: 'צריך פיצול אמיתי: ' + real + ' שורות חסרות ביעד, מעל ' + max + '.',
    };
  }
  // נותר רק המקרה שבו המוצג מעל התקרה אבל מה שחסר ביעד מתחתיה.
  return {
    kind: 'stale-base',
    ok: false,
    message:
      'אין מה לפצל — נקודת הפיצול מיושנת: מוצגות ' + displayed + ' שורות אבל חסרות רק ' +
      real + '. למזג את היעד לענף ולמדוד שוב.',
  };
}

function git(args) {
  const { execFileSync } = require('node:child_process');
  return execFileSync('git', args, { encoding: 'utf8' });
}

function shortstat(base, branch, dots, paths) {
  const args = ['diff', '--shortstat', base + dots + branch];
  if (paths && paths.length) args.push('--', ...paths);
  return parseShortstat(git(args));
}

// הקבצים שה-PR נוגע בהם, כפי ש-GitHub מציג אותם.
function changedFiles(base, branch) {
  return git(['diff', '--name-only', base + '...' + branch])
    .split('\n')
    .filter(Boolean);
}

// האם אותו נתיב מצביע על אותו blob בדיוק בשני הצדדים? נתיב שחסר בצד אחד הוא לא.
function sameBlob(base, branch, path) {
  const id = (rev) => {
    try {
      return git(['rev-parse', '--verify', '--quiet', rev + ':' + path]).trim();
    } catch (err) {
      return '';
    }
  };
  const left = id(base);
  return left !== '' && left === id(branch);
}

const NOTHING = { files: 0, insertions: 0, deletions: 0, changed: 0 };

function sizes(branch, base, limit, forkBase) {
  const target = base || 'origin/main';
  const displayed = shortstat(target, branch, '...');
  const touched = changedFiles(target, branch);
  const settled = touched.filter((path) => sameBlob(target, branch, path));
  const same = new Set(settled);
  const live = touched.filter((path) => !same.has(path));
  // מה שכבר נחת ביעד בדיוק: נספר אצל auto_merger, אבל המיזוג לא ישנה בו דבר.
  const landed = settled.length ? shortstat(target, branch, '...', settled) : NOTHING;
  // שתי נקודות על הקבצים שעוד לא זהים: מה שבאמת חסר ביעד, בלי רעש מקבצים אחרים.
  const real = live.length ? shortstat(target, branch, '..', live) : NOTHING;
  // שלוש נקודות: מה שהענף הוסיף מאז שנחתך, בלי מה שהבסיס שלו צבר מאז.
  const own = forkBase ? shortstat(forkBase, branch, '...') : null;
  return {
    branch: branch,
    base: target,
    forkBase: forkBase || null,
    displayed: displayed,
    real: real,
    landed: landed,
    own: own,
    verdict: verdict(displayed.changed, real.changed, limit, own ? own.changed : null, landed),
  };
}

function report(r) {
  const lines = [
    r.branch + ' → ' + r.base,
    'מוצג (' + r.base + '...' + r.branch + '): ' + r.displayed.changed + ' שורות ב-' +
      r.displayed.files + ' קבצים',
    'אמיתי (' + r.base + '..' + r.branch + ', בקבצי ה-PR): ' + r.real.changed + ' שורות ב-' +
      r.real.files + ' קבצים',
  ];
  if (r.landed && r.landed.changed > 0) {
    lines.push('כבר ביעד (תוכן זהה): ' + r.landed.changed + ' שורות ב-' + r.landed.files +
      ' קבצים');
  }
  if (r.own) {
    lines.push('של הענף (' + r.forkBase + '...' + r.branch + '): ' + r.own.changed + ' שורות ב-' +
      r.own.files + ' קבצים');
  }
  lines.push(r.verdict.message);
  return lines.join('\n');
}

if (require.main === module) {
  const [branch, base, limit, forkBase] = process.argv.slice(2);
  if (!branch) {
    console.error(
      'usage: node tools/pr-size.js <branch> [base=origin/main] [limit=400] [forkBase]'
    );
    process.exit(2);
  }
  const r = sizes(branch, base, limit, forkBase);
  console.log(report(r));
  process.exit(r.verdict.ok ? 0 : 1);
}

module.exports = { LIMIT, parseShortstat, verdict, sizes, report, changedFiles, sameBlob };
