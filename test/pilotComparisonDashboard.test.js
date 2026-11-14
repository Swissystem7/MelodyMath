const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const S = require('../pilot/js/score.js');
const dataViz = require('../src/lib/dataViz.js');

test('computeGroupStats computes pre, post, later means, gains, and retention rate correctly', () => {
  const rows = [
    { student: 'תלמיד 1', pre: { score: 1, total: 4 }, post: { score: 3, total: 4 }, later: { score: 3, total: 4 } }, // pre 25%, post 75%, later 75%, gain 50%
    { student: 'תלמיד 2', pre: { score: 2, total: 4 }, post: { score: 4, total: 4 }, later: { score: 3, total: 4 } }, // pre 50%, post 100%, later 75%, gain 50%
    { student: 'תלמיד 3', pre: { score: 2, total: 4 }, post: { score: 3, total: 4 } } // pre 50%, post 75%, no later, gain 25%
  ];

  const stats = S.computeGroupStats(rows, 'קבוצת מוזיקה');
  assert.equal(stats.name, 'קבוצת מוזיקה');
  assert.equal(stats.totalCount, 3);
  assert.equal(stats.n, 3);
  assert.equal(stats.children, 3);
  assert.equal(stats.laterN, 2);
  // pre: (25 + 50 + 50) / 3 = 41.67 -> 41.7
  assert.equal(stats.preMean, 41.7);
  // post: (75 + 100 + 75) / 3 = 83.33 -> 83.3
  assert.equal(stats.postMean, 83.3);
  // later: (75 + 75) / 2 = 75.0
  assert.equal(stats.laterMean, 75.0);
  // gain: (50 + 50 + 25) / 3 = 41.67 -> 41.7
  assert.equal(stats.gainMean, 41.7);
  // retention rate: 75.0 / 83.3 = 0.90
  assert.equal(stats.retentionRate, 0.9);
});

test('computeNetImprovement calculates net difference between intervention gain and control gain', () => {
  assert.equal(S.computeNetImprovement(41.7, 21.2), 20.5);
  assert.equal(S.computeNetImprovement(20.0, 20.0), 0);
  assert.equal(S.computeNetImprovement(15.0, 25.5), -10.5);
  assert.equal(S.computeNetImprovement(null, 20), null);
  assert.equal(S.computeNetImprovement(20, NaN), null);
});

test('calculatePooledStd and calculateCohenD compute effect size with official classifications', () => {
  // calculatePooledStd:
  // groupA = [10, 20], mean=15, ss=50
  // groupB = [30, 40], mean=35, ss=50
  // df = 2 + 2 - 2 = 2. pooledVar = 100 / 2 = 50. pooledStd = Math.sqrt(50) = 7.071
  const std = S.calculatePooledStd([10, 20], [30, 40]);
  assert.ok(Math.abs(std - Math.sqrt(50)) < 1e-6);

  // calculateCohenD direct calculation
  assert.equal(S.calculateCohenD(35, 15, Math.sqrt(50)), 2.83);
  assert.equal(S.calculateCohenD(108, 100, 10), 0.8);
  assert.equal(S.calculateCohenD(105, 100, 10), 0.5);
  assert.equal(S.calculateCohenD(101, 100, 10), 0.1);

  // calculateCohenD array overload
  const dArrays = S.calculateCohenD([20, 30], [10, 20]);
  assert.equal(typeof dArrays, 'number');
  assert.ok(dArrays > 0);
  assert.equal(S.calculateCohenD([20, 30], [10, 20], 5), 2.0);
  assert.equal(S.calculateCohenD([20], [10]), null);

  // calculateCohenD input validation
  assert.equal(S.calculateCohenD(null, 50, 10), null);
  assert.equal(S.calculateCohenD(50, undefined, 10), null);
  assert.equal(S.calculateCohenD(50, 40, 0), null);
  assert.equal(S.calculateCohenD(50, 40, -5), null);
  assert.equal(S.calculateCohenD(NaN, 40, 10), null);
  assert.equal(S.calculateCohenD(50, Infinity, 10), null);
  assert.equal(S.calculateCohenD(50, 40, 'invalid'), null);

  // calculatePooledStd edge cases
  assert.equal(S.calculatePooledStd(null, [1, 2]), null);
  assert.equal(S.calculatePooledStd([1], [2]), null);
  assert.equal(S.calculatePooledStd([5, 5], [5, 5]), 0);

  // classifyEffectSize
  assert.equal(S.classifyEffectSize(0.1), 'זניח');
  assert.equal(S.classifyEffectSize(0.3), 'קטן');
  assert.equal(S.classifyEffectSize(0.6), 'בינוני');
  assert.equal(S.classifyEffectSize(0.9), 'גדול');
  assert.equal(S.classifyEffectSize(null), null);
});

test('compareGroups splits raw check rows by group, calculates pre/post/later averages, net gain, and Cohen d', () => {
  const allRows = [
    // Music / intervention group
    { student: 'ילד 1', pre: { score: 1, total: 4 }, post: { score: 3, total: 4 }, later: { score: 3, total: 4 }, group: 'intervention' }, // gain: 50
    { student: 'ילד 2', pre: { score: 1, total: 4 }, post: { score: 4, total: 4 }, later: { score: 3, total: 4 }, group: 'intervention' }, // gain: 75
    { student: 'ילד 3', pre: { score: 2, total: 4 }, post: { score: 4, total: 4 }, later: { score: 4, total: 4 }, group: 'intervention' }, // gain: 50
    // Control group
    { student: 'ילד 4', pre: { score: 1, total: 4 }, post: { score: 2, total: 4 }, later: { score: 2, total: 4 }, group: 'control' }, // gain: 25
    { student: 'ילד 5', pre: { score: 2, total: 4 }, post: { score: 2, total: 4 }, later: { score: 1, total: 4 }, group: 'control' }, // gain: 0
    { student: 'ילד 6', pre: { score: 1, total: 4 }, post: { score: 2, total: 4 }, later: { score: 2, total: 4 }, group: 'control' }  // gain: 25
  ];

  const comp = S.compareGroups(allRows);

  assert.equal(comp.hasBothGroups, true);
  assert.equal(comp.music.n, 3);
  assert.equal(comp.control.n, 3);

  // Music pre: (25 + 25 + 50) / 3 = 33.3; post: (75 + 100 + 100) / 3 = 91.7; gain: 58.3
  assert.equal(comp.music.preMean, 33.3);
  assert.equal(comp.music.postMean, 91.7);
  assert.equal(comp.music.gainMean, 58.3);
  assert.equal(comp.music.laterMean, 83.3);

  // Control pre: (25 + 50 + 25) / 3 = 33.3; post: (50 + 50 + 50) / 3 = 50.0; gain: 16.7
  assert.equal(comp.control.preMean, 33.3);
  assert.equal(comp.control.postMean, 50.0);
  assert.equal(comp.control.gainMean, 16.7);
  assert.equal(comp.control.laterMean, 41.7);

  // Net gain: 58.3 - 16.7 = 41.6
  assert.equal(comp.netGain, 41.6);
  assert.ok(typeof comp.cohenD === 'number');
  assert.ok(comp.cohenD > 0);
  assert.equal(comp.effectClassification, 'גדול');

  // Chart spec created with 3 categories
  assert.deepEqual(comp.chartSpec.categories, ['לפני', 'אחרי', 'מעקב שבוע']);
  assert.equal(comp.chartSpec.series.length, 2);
  assert.equal(comp.chartSpec.series[0].name, 'קבוצת מוזיקה');
  assert.equal(comp.chartSpec.series[1].name, 'קבוצת ביקורת');
});

test('compareGroups handles edge cases safely without throwing', () => {
  // Empty rows
  const empty = S.compareGroups([]);
  assert.equal(empty.hasBothGroups, false);
  assert.equal(empty.netGain, null);
  assert.equal(empty.cohenD, null);
  assert.equal(empty.music.n, 0);
  assert.equal(empty.control.n, 0);

  // Single group only (music only)
  const musicOnly = S.compareGroups([
    { student: 'ילד 1', pre: { score: 1, total: 3 }, post: { score: 2, total: 3 } }
  ]);
  assert.equal(musicOnly.hasBothGroups, false);
  assert.equal(musicOnly.music.n, 1);
  assert.equal(musicOnly.control.n, 0);
  assert.equal(musicOnly.netGain, null);

  // Malformed rows ignored
  const malformed = S.compareGroups([null, {}, { pre: 'bad' }, { pre: { score: 0, total: 0 } }]);
  assert.equal(malformed.music.n, 0);
});

test('compareGroups supports passing two separate arrays (musicRows, controlRows)', () => {
  const musicRows = [
    { student: 'ילד 1', pre: { score: 1, total: 4 }, post: { score: 4, total: 4 } },
    { student: 'ילד 2', pre: { score: 2, total: 4 }, post: { score: 4, total: 4 } }
  ];
  const controlRows = [
    { student: 'ילד 3', pre: { score: 1, total: 4 }, post: { score: 2, total: 4 } },
    { student: 'ילד 4', pre: { score: 2, total: 4 }, post: { score: 2, total: 4 } }
  ];

  const comp = S.compareGroups(musicRows, controlRows);
  assert.equal(comp.hasBothGroups, true);
  assert.equal(comp.music.n, 2);
  assert.equal(comp.control.n, 2);
  assert.equal(comp.music.postMean, 100);
  assert.equal(comp.control.postMean, 50);
  assert.ok(comp.netGain > 0);
  assert.ok(comp.cohenD > 0);
});

test('compareGroups calculates Cohen d from post-test scores when only post-tests were administered without pre-tests', () => {
  const postOnlyMusic = [
    { student: 'ילד 1', post: { score: 3, total: 4 } },
    { student: 'ילד 2', post: { score: 4, total: 4 } }
  ];
  const postOnlyControl = [
    { student: 'ילד 3', post: { score: 1, total: 4 } },
    { student: 'ילד 4', post: { score: 2, total: 4 } }
  ];

  const comp = S.compareGroups(postOnlyMusic, postOnlyControl);
  assert.equal(comp.hasBothGroups, false); // no pre-post pairs
  assert.equal(comp.music.gains.length, 0);
  assert.equal(comp.control.gains.length, 0);
  assert.equal(comp.music.postScores.length, 2);
  assert.equal(comp.control.postScores.length, 2);
  assert.equal(comp.music.postMean, 87.5);
  assert.equal(comp.control.postMean, 37.5);
  assert.ok(typeof comp.cohenD === 'number');
  assert.ok(comp.cohenD > 0);
  assert.equal(comp.effectClassification, 'גדול');
});

test('normalizeComparativeBars normalizes series, categories, colors, values, and max scale', () => {
  const raw = {
    title: 'השוואת ביצועים',
    categories: ['לפני', 'אחרי'],
    series: [
      { key: 'm', name: 'מוזיקה', color: '#1B1446', values: ['40.5', 85] },
      { key: 'c', name: 'ביקורת', values: [38, 60] }
    ]
  };

  const norm = dataViz.normalizeComparativeBars(raw);
  assert.equal(norm.title, 'השוואת ביצועים');
  assert.deepEqual(norm.categories, ['לפני', 'אחרי']);
  assert.equal(norm.series.length, 2);
  assert.equal(norm.series[0].key, 'm');
  assert.equal(norm.series[0].color, '#1B1446');
  assert.deepEqual(norm.series[0].values, [40.5, 85]);
  assert.deepEqual(norm.series[1].values, [38, 60]);
  assert.equal(norm.max, 100);
});

test('renderComparativeBarChartHtml produces accessible markup with legend, groups, series bars, and percentages', () => {
  const spec = {
    title: 'השוואת ממוצעי הישגים',
    categories: ['לפני', 'אחרי', 'מעקב שבוע'],
    series: [
      { key: 'music', name: 'קבוצת מוזיקה', color: '#1B1446', values: [35, 85, 80] },
      { key: 'control', name: 'קבוצת ביקורת', color: '#6B6396', values: [35, 55, 50] }
    ],
    max: 100
  };

  const html = dataViz.renderComparativeBarChartHtml(spec);
  assert.match(html, /class="barchart barchart--comparative"/);
  assert.match(html, /role="img"/);
  assert.match(html, /aria-label="השוואת ממוצעי הישגים"/);
  assert.match(html, /class="barchart-legend"/);
  assert.match(html, /קבוצת מוזיקה/);
  assert.match(html, /קבוצת ביקורת/);
  assert.match(html, /data-category="לפני"/);
  assert.match(html, /data-category="אחרי"/);
  assert.match(html, /data-category="מעקב שבוע"/);
  assert.match(html, /data-series="music"/);
  assert.match(html, /data-series="control"/);
  assert.match(html, /85%/);
  assert.match(html, /55%/);
});

test('renderBarChartHtml delegates to renderComparativeBarChartHtml when comparative spec is provided', () => {
  const compSpec = {
    comparative: true,
    categories: ['שלב 1', 'שלב 2'],
    series: [{ key: 's1', name: 'סדרה 1', values: [10, 20] }]
  };

  const html = dataViz.renderBarChartHtml(compSpec);
  assert.match(html, /class="barchart barchart--comparative"/);
});

test('app.js comparisonDashboardCard renders comparative metrics, comparison table, and comparative chart', () => {
  const appPath = path.join(__dirname, '..', 'pilot', 'js', 'app.js');
  const appSource = fs.readFileSync(appPath, 'utf8');

  // Verify function existence and integration in viewTeacher
  assert.match(appSource, /function comparisonDashboardCard\(/);
  assert.match(appSource, /comparisonDashboardCard\(\)/);
  assert.match(appSource, /S\.compareGroups/);
  assert.match(appSource, /renderComparativeBarChartHtml/);

  // Test the rendering logic in a realistic VM sandbox
  const sandbox = {
    globalThis: {},
    G: {},
    document: {
      getElementById: () => null,
      addEventListener: () => {},
      documentElement: { setAttribute: () => {} }
    },
    MMPilotScore: S,
    MMDataViz: dataViz
  };
  sandbox.G = sandbox;
  sandbox.globalThis = sandbox;

  // Run app in context
  vm.createContext(sandbox);
  const rows = [
    { student: 'תלמיד 1', pre: { score: 1, total: 4 }, post: { score: 4, total: 4 }, later: { score: 3, total: 4 }, group: 'intervention' },
    { student: 'תלמיד 2', pre: { score: 2, total: 4 }, post: { score: 4, total: 4 }, later: { score: 4, total: 4 }, group: 'intervention' },
    { student: 'תלמיד 3', pre: { score: 1, total: 4 }, post: { score: 2, total: 4 }, later: { score: 2, total: 4 }, group: 'control' },
    { student: 'תלמיד 4', pre: { score: 2, total: 4 }, post: { score: 2, total: 4 }, later: { score: 2, total: 4 }, group: 'control' }
  ];

  // We can evaluate comparisonDashboardCard directly with mocked checkRows
  const fnCode = `
    const S = MMPilotScore;
    const G = globalThis;
    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function dataVizApi() { return MMDataViz; }
    function checkRows() { return ${JSON.stringify(rows)}; }
    ${appSource.match(/function comparisonDashboardCard\([\s\S]*?\n  \}/)[0]}
    comparisonDashboardCard();
  `;

  const cardHtml = vm.runInContext(fnCode, sandbox);

  assert.match(cardHtml, /data-testid="comparison-dashboard"/);
  assert.match(cardHtml, /data-testid="comparison-metrics"/);
  assert.match(cardHtml, /data-testid="comparison-net-gain"/);
  assert.match(cardHtml, /data-testid="comparison-cohen-d"/);
  assert.match(cardHtml, /data-testid="comparison-music-stats"/);
  assert.match(cardHtml, /data-testid="comparison-control-stats"/);
  assert.match(cardHtml, /data-testid="comparison-table"/);
  assert.match(cardHtml, /data-testid="comparison-chart"/);
  assert.match(cardHtml, /barchart--comparative/);
});

test('isControlRow in score.js and app.js correctly identifies control rows by controlMode or group', () => {
  // score.js isControlRow
  assert.equal(S.isControlRow({ controlMode: true }), true);
  assert.equal(S.isControlRow({ group: 'control' }), true);
  assert.equal(S.isControlRow({ post: { group: 'control' } }), true);
  assert.equal(S.isControlRow({ pre: { group: 'control' } }), true);
  assert.equal(S.isControlRow({ group: 'intervention' }), false);
  assert.equal(S.isControlRow({}), false);
  assert.equal(S.isControlRow(null), false);

  // app.js isControlRow regex match
  const appPath = path.join(__dirname, '..', 'pilot', 'js', 'app.js');
  const appSource = fs.readFileSync(appPath, 'utf8');
  assert.match(appSource, /function isControlRow\(r\)/);
});
