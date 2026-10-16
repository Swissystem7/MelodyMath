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
//   node tools/pr-size.js <branch> [base] [limit]
//
// אין תלויות ואין רשת — רק `git diff --shortstat`, שתי קריאות קריאה בלבד.
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

// displayed = מה ש-GitHub/auto_merger מודדים, real = מה שבאמת חסר ביעד.
function verdict(displayed, real, limit) {
  const max = Number(limit) || LIMIT;
  if (real > max) {
    return {
      kind: 'split',
      ok: false,
      message: 'צריך פיצול אמיתי: ' + real + ' שורות חסרות ביעד, מעל ' + max + '.',
    };
  }
  if (displayed > max) {
    return {
      kind: 'stale-base',
      ok: false,
      message:
        'אין מה לפצל — נקודת הפיצול מיושנת: מוצגות ' + displayed + ' שורות אבל חסרות רק ' +
        real + '. למזג את היעד לענף ולמדוד שוב.',
    };
  }
  return {
    kind: 'ok',
    ok: true,
    message: 'עומד בתקרה: ' + real + ' שורות מתוך ' + max + '.',
  };
}

function shortstat(base, branch, dots) {
  const { execFileSync } = require('node:child_process');
  const out = execFileSync('git', ['diff', '--shortstat', base + dots + branch], {
    encoding: 'utf8',
  });
  return parseShortstat(out);
}

function sizes(branch, base, limit) {
  const target = base || 'origin/main';
  const displayed = shortstat(target, branch, '...');
  const real = shortstat(target, branch, '..');
  return {
    branch: branch,
    base: target,
    displayed: displayed,
    real: real,
    verdict: verdict(displayed.changed, real.changed, limit),
  };
}

function report(r) {
  const lines = [
    r.branch + ' → ' + r.base,
    'מוצג (' + r.base + '...' + r.branch + '): ' + r.displayed.changed + ' שורות ב-' +
      r.displayed.files + ' קבצים',
    'אמיתי (' + r.base + '..' + r.branch + '):  ' + r.real.changed + ' שורות ב-' +
      r.real.files + ' קבצים',
    r.verdict.message,
  ];
  return lines.join('\n');
}

if (require.main === module) {
  const [branch, base, limit] = process.argv.slice(2);
  if (!branch) {
    console.error('usage: node tools/pr-size.js <branch> [base=origin/main] [limit=400]');
    process.exit(2);
  }
  const r = sizes(branch, base, limit);
  console.log(report(r));
  process.exit(r.verdict.ok ? 0 : 1);
}

module.exports = { LIMIT, parseShortstat, verdict, sizes, report };
