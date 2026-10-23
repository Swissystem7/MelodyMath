#!/usr/bin/env node
// How many bank items learn their maths through music (#591), per grade.
//
//   node tools/music-coverage.js          # table + X/1193 line
//   node tools/music-coverage.js --json   # machine-readable
//
// "activity" = the prompt itself is a music activity (dotted notes, tempo,
// circle of fifths…). "way" = a plain item that carries a research-backed
// musical way of learning its standard (music + musicNote + musicSrc).
// "none" = no music side yet. Only activity + way count toward the goal.
'use strict';
const banks = require('../src/lib/banks');

const rows = banks.GRADES.map((g) => {
  const items = banks.itemsForGrade(g);
  const activity = items.filter((it) => it.music && !it.musicNote).length;
  const way = items.filter((it) => it.musicNote && it.musicSrc).length;
  const none = items.length - activity - way;
  return { grade: g, total: items.length, activity, way, none, music: activity + way };
});
const total = rows.reduce((n, r) => n + r.total, 0);
const music = rows.reduce((n, r) => n + r.music, 0);

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ rows, music, total }, null, 2));
} else {
  console.log('grade  total  activity  way  none  music');
  rows.forEach((r) => {
    console.log([r.grade.padEnd(5), String(r.total).padStart(5), String(r.activity).padStart(9),
      String(r.way).padStart(4), String(r.none).padStart(5), (r.music + '/' + r.total).padStart(8)].join('  '));
  });
  console.log('all    ' + music + '/' + total);
}
