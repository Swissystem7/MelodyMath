#!/usr/bin/env node
// Per topic: how many of the 4 instrument families are offered (#679).
//
//   node tools/family-coverage.js          # one line per topic + summary
//   node tools/family-coverage.js --json   # machine-readable
//
// "Offered" means instruments.forTopic(topic): the instruments that may
// voice the topic through its one primary way (dosage rule 4). The hard
// minimum is 2 families per topic (child-eye rule 7); 4 is the target.
'use strict';
const I = require('../src/lib/instruments');

function familyCoverage() {
  return Object.keys(I.TOPICS).map(function (topic) {
    const list = I.forTopic(topic);
    const families = I.FAMILIES.filter(function (f) {
      return list.some(function (x) { return x.family === f; });
    });
    return {
      topic: topic,
      he: I.TOPICS[topic].he,
      mechanism: I.TOPICS[topic].mechanism,
      familyCount: families.length,
      families: families,
      instruments: list.map(function (x) { return x.id; }),
    };
  });
}

if (require.main === module) {
  const rows = familyCoverage();
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ rows: rows, target: I.FAMILIES.length }, null, 2));
  } else {
    rows.forEach(function (r) {
      console.log(
        r.topic.padEnd(14) + ' ' + r.mechanism + '  ' + r.familyCount + '/' + I.FAMILIES.length +
        ' families  [' + r.families.join(', ') + ']  ' + r.instruments.length + ' instruments'
      );
    });
    const below = rows.filter(function (r) { return r.familyCount < 2; });
    const full = rows.filter(function (r) { return r.familyCount === I.FAMILIES.length; });
    console.log(
      'topics: ' + rows.length + ', at target ' + I.FAMILIES.length + ': ' + full.length +
      ', below minimum 2: ' + (below.length ? below.map(function (r) { return r.topic; }).join(', ') : 'none')
    );
  }
}

module.exports = { familyCoverage: familyCoverage };
