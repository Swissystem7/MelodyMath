// #864 (Refs #665): the cube-layer widget for box-volume items.
const test = require('node:test');
const assert = require('node:assert/strict');
const CL = require('../src/lib/music/cubeLayers');
const banks = require('../src/lib/banks');
const cur = require('../src/lib/curriculum');

const massVol = (g) => banks.itemsForGrade(g).filter((it) => it.standard === banks.ST.MASS_VOL);
const cube = (it) => /תיבה|קובי/.test(it.prompt);
const noOverlap = (notes) => notes.every((n, i) => i === 0 || notes[i - 1].at + notes[i - 1].dur <= n.at + 1e-9);

test('box volume (mm-cur-20) has one way, cubeLayerGroups; layerBars stays EXTRA', () => {
  const g2 = require('../src/lib/curriculum/grade2');
  assert.deepEqual(banks.primaryWays(g2.music.MASS_VOL).map((w) => w[0]), ['cubeLayerGroups']);
  assert.ok(g2.music.MASS_VOL.some((w) => w[0] === 'layerBars' && banks.isOptionalWay(w)));
  const items = cur.itemsForTopic('mm-cur-20', banks.itemsForGrade('ב'));
  assert.ok(items.length >= 12);
  items.forEach((it) => assert.equal(it.music, 'cubeLayerGroups', it.prompt));
});

test('gramGroups is kept as EXTRA, and kg/liter items stay in the ד׳ measures topic', () => {
  const g4 = require('../src/lib/curriculum/grade4');
  const gram = g4.music.MASS_VOL.find((w) => w[0] === 'gramGroups');
  assert.ok(gram && banks.isOptionalWay(gram));
  const kg = massVol('ד').filter((it) => !cube(it));
  assert.equal(kg.length, 9);
  const unitsTopic = cur.itemsForTopic('mm-cur-35', banks.itemsForGrade('ד'));
  kg.forEach((it) => {
    assert.ok(unitsTopic.includes(it), it.prompt);
    assert.equal(CL.specForItem(it), null, 'no cube widget on ' + it.prompt);
  });
});

test('every stack-of-layers cube item gets the widget, with the right total', () => {
  const items = massVol('ב').concat(massVol('ד')).filter(cube);
  const withWidget = items.filter((it) => CL.specForItem(it));
  assert.ok(withWidget.length >= 18, String(withWidget.length));
  withWidget.forEach((it) => {
    const s = CL.specForItem(it);
    if (/כמה קוביות יש בה/.test(it.prompt)) assert.equal(s.total, it.answer, it.prompt);
    if (/מכמה שכבות/.test(it.prompt)) assert.equal(s.layers, it.answer, it.prompt);
  });
  ['הוצאנו', 'תיבה שנייה'].forEach((w) => items.filter((it) => it.prompt.includes(w))
    .forEach((it) => assert.equal(CL.specForItem(it), null, it.prompt)));
});

test('layers play one after another on two instrument families, never overlapping', () => {
  const s = CL.parse('תיבה בנויה מ־3 שכבות של 5 קוביות. כמה קוביות יש בה?');
  const notes = CL.plan(s, 'together');
  assert.equal(notes.length, 15);
  assert.ok(noOverlap(notes));
  const fams = new Set(notes.map((n) => n.family));
  assert.ok(fams.size >= 2, [...fams].join());
  for (let g = 1; g < 3; g++) {
    const prev = notes.filter((n) => n.group === g - 1), cur2 = notes.filter((n) => n.group === g);
    const end = Math.max(...prev.map((n) => n.at + n.dur));
    assert.ok(Math.min(...cur2.map((n) => n.at)) > end, 'layer ' + g + ' starts after layer ' + (g - 1));
    assert.notEqual(prev[0].family, cur2[0].family);
  }
  const one = CL.plan(CL.parse('תיבה בנויה משכבה אחת של 3 שורות, ובכל שורה 3 קוביות. כמה קוביות יש בה?'), 'together');
  assert.equal(one.length, 9);
  assert.ok(new Set(one.map((n) => n.family)).size >= 2 && noOverlap(one));
});

test('above 12 a layer is tens and ones, never one beat per cube', () => {
  const s = CL.parse('תיבה בנויה מ־2 שכבות, ובכל שכבה 3 שורות של 4 קוביות. כמה קוביות יש בה?');
  assert.equal(s.perLayer, 12);
  assert.equal(CL.plan(s, 'together').filter((n) => n.place === 'unit').length, 24);
  [13, 20, 24, 36].forEach((per) => {
    const notes = CL.plan({ layers: 2, perLayer: per, rows: null, total: 2 * per }, 'together');
    assert.ok(noOverlap(notes), String(per));
    assert.equal(notes.filter((n) => n.place === 'unit').length, 0, String(per));
    [0, 1].forEach((g) => {
      const mine = notes.filter((n) => n.group === g);
      assert.equal(mine.filter((n) => n.place === 'ten').length * 10 + mine.filter((n) => n.place === 'one').length, per);
      assert.ok(mine.length <= 12, per + ' plays ' + mine.length + ' sounds');
    });
  });
});

test('«עכשיו לבד» is completely silent', () => {
  const s = CL.parse('תיבה בנויה מ־2 שכבות של 6 קוביות. כמה קוביות יש בה?');
  assert.deepEqual(CL.plan(s, 'alone'), []);
  const calls = [];
  const ac = { currentTime: 0, state: 'running' };
  assert.equal(CL.play(s, 'alone', { audioContext: ac, playVoice: () => calls.push(1) }), null);
  assert.equal(calls.length, 0);
  const h = CL.html(s, 'alone');
  assert.match(h, /עכשיו לבד/);
  assert.doesNotMatch(h, /snd-play/);
  CL.play(s, 'together', { audioContext: ac, playVoice: () => calls.push(1) });
  assert.equal(calls.length, 12);
});

test('a wrong answer does not move on; a right one does', () => {
  assert.equal(CL.nextRound('together', false), 'together');
  assert.equal(CL.nextRound('alone', false), 'alone');
  assert.equal(CL.nextRound('together', true), 'alone');
  assert.equal(CL.nextRound('alone', true), 'done');
});

test('index.html loads the widget and renderWidget uses it; sw.js precaches it', () => {
  const fs = require('node:fs');
  const html = fs.readFileSync(require.resolve('../index.html'), 'utf8');
  assert.match(html, /src="src\/lib\/music\/loopStack\.js"><\/script><script src="src\/lib\/music\/cubeLayers\.js">/);
  assert.match(html, /MM_CUBE_LAYERS\.bind\(host/);
  assert.match(fs.readFileSync(require.resolve('../sw.js'), 'utf8'), /cubeLayers\.js/);
});
