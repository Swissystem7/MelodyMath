'use strict';
// #591 audit: a way labelled D claims it was part of an evaluated maths
// intervention. Azaryahu 2020 (MusiMath) evaluated fractions only, so a D
// citing it belongs under a fraction standard; elsewhere the honest label is A.
// The palm-pipes snack is about tube length and pitch, not drum heads.
const test = require('node:test');
const assert = require('node:assert/strict');

const FILES = [1, 2, 3, 4, 5, 6].map((n) => [n, require('../src/lib/curriculum/grade' + n)]);
const FRACTION_KEY = /FRAC|MIXED/;

test('Azaryahu 2020 carries D only on fraction standards', () => {
  const wrong = [];
  FILES.forEach(([n, file]) => {
    Object.keys(file.music || {}).forEach((key) => {
      file.music[key].forEach(([tag, , src, ev]) => {
        if (src === 'azaryahu2020' && ev === 'D' && !FRACTION_KEY.test(key)) wrong.push(n + ' ' + key + ' ' + tag);
      });
    });
  });
  assert.deepEqual(wrong, []);
});

test('palm pipes back only pipe-and-pitch ways', () => {
  FILES.forEach(([n, file]) => {
    Object.keys(file.music || {}).forEach((key) => {
      file.music[key].forEach(([tag, , src]) => {
        if (src === 'palmPipes') assert.notEqual(tag, 'drumHead', n + ' ' + key);
      });
    });
  });
});
