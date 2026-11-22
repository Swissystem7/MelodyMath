const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const S = require('../pilot/js/score.js');
const dataViz = require('../src/lib/dataViz.js');

test('filterReportRows filters by grade and date range, handling edge cases gracefully', () => {
  const rows = [
    { student: 'תלמיד 1', grade: 'א', timestamp: new Date('2026-11-05T10:00:00Z').getTime(), unit: 'u1' },
    { student: 'תלמיד 2', grade: 'ב', timestamp: new Date('2026-11-10T10:00:00Z').getTime(), unit: 'u1' },
    { student: 'תלמיד 3', grade: 'א', timestamp: new Date('2026-11-15T10:00:00Z').getTime(), unit: 'u2' },
    { student: 'תלמיד 4', grade: 'ג', timestamp: new Date('2026-11-20T10:00:00Z').getTime(), unit: 'u1' }
  ];

  // Grade filter
  const gradeARows = S.filterReportRows(rows, { grade: 'א' });
  assert.equal(gradeARows.length, 2);
  assert.ok(gradeARows.every((r) => r.grade === 'א'));

  // Date range filter
  const dateRangeRows = S.filterReportRows(rows, { dateFrom: '2026-11-08', dateTo: '2026-11-16' });
  assert.equal(dateRangeRows.length, 2);
  assert.equal(dateRangeRows[0].student, 'תלמיד 2');
  assert.equal(dateRangeRows[1].student, 'תלמיד 3');

  // Combined grade and date filter
  const combined = S.filterReportRows(rows, { grade: 'א', dateFrom: '2026-11-12' });
  assert.equal(combined.length, 1);
  assert.equal(combined[0].student, 'תלמיד 3');

  // Unit filter
  const unit2Rows = S.filterReportRows(rows, { unit: 'u2' });
  assert.equal(unit2Rows.length, 1);
  assert.equal(unit2Rows[0].unit, 'u2');

  // Empty/invalid filter returns shallow copy
  assert.equal(S.filterReportRows(rows, null).length, 4);
  assert.equal(S.filterReportRows(rows, {}).length, 4);
  assert.equal(S.filterReportRows(null, {}).length, 0);
});

test('stripPII strips all student names, display names, and identifiers leaving clean anonymous data', () => {
  const rawRows = [
    {
      student: 'יוסי כהן',
      displayName: 'יוסי כהן',
      username: 'yossi123',
      id: 'acc_99',
      studentId: 'st_88',
      grade: 'א',
      group: 'intervention',
      controlMode: false,
      pre: { score: 2, total: 4, at: 1000, student: 'יוסי' },
      post: { score: 4, total: 4, at: 2000, username: 'yossi123' },
      later: { score: 3, total: 4, at: 3000, displayName: 'יוסי' }
    },
    {
      student: 'מיכל לוי',
      displayName: 'מיכל לוי',
      grade: 'ב',
      group: 'control',
      controlMode: true,
      pre: { score: 1, total: 4 },
      post: { score: 2, total: 4 }
    }
  ];

  const cleaned = S.stripPII(rawRows);
  assert.equal(cleaned.length, 2);

  cleaned.forEach((r) => {
    assert.equal(r.student, undefined);
    assert.equal(r.displayName, undefined);
    assert.equal(r.username, undefined);
    assert.equal(r.studentId, undefined);
    assert.equal(r.id, undefined);

    if (r.pre) {
      assert.equal(r.pre.student, undefined);
      assert.equal(r.pre.username, undefined);
      assert.equal(r.pre.displayName, undefined);
    }
    if (r.post) {
      assert.equal(r.post.student, undefined);
      assert.equal(r.post.username, undefined);
      assert.equal(r.post.displayName, undefined);
    }
    if (r.later) {
      assert.equal(r.later.student, undefined);
      assert.equal(r.later.username, undefined);
      assert.equal(r.later.displayName, undefined);
    }
  });

  // Verify JSON string has zero occurrences of personal names or usernames
  const jsonStr = JSON.stringify(cleaned);
  assert.equal(jsonStr.includes('יוסי'), false);
  assert.equal(jsonStr.includes('מיכל'), false);
  assert.equal(jsonStr.includes('yossi123'), false);
  assert.equal(jsonStr.includes('acc_99'), false);
});

test('computeWeeklyRetention computes 1-week retention rates, drops, and net retention comparison', () => {
  const musicRows = [
    { pre: { score: 1, total: 4 }, post: { score: 4, total: 4 }, later: { score: 4, total: 4 } }, // post 100%, later 100%
    { pre: { score: 2, total: 4 }, post: { score: 4, total: 4 }, later: { score: 3, total: 4 } }  // post 100%, later 75%
  ]; // music postMean = 100, laterMean = 87.5 -> retentionRate = 88%

  const controlRows = [
    { pre: { score: 1, total: 4 }, post: { score: 3, total: 4 }, later: { score: 2, total: 4 }, controlMode: true }, // post 75%, later 50%
    { pre: { score: 1, total: 4 }, post: { score: 3, total: 4 }, later: { score: 2, total: 4 }, controlMode: true }  // post 75%, later 50%
  ]; // control postMean = 75, laterMean = 50 -> retentionRate = 67%

  const ret = S.computeWeeklyRetention(musicRows, controlRows);

  assert.equal(ret.hasBoth, true);
  assert.equal(ret.music.postMean, 100);
  assert.equal(ret.music.laterMean, 87.5);
  assert.equal(ret.music.retentionRate, 88);
  assert.equal(ret.music.retentionDrop, 12.5);
  assert.equal(ret.music.n, 2);

  assert.equal(ret.control.postMean, 75);
  assert.equal(ret.control.laterMean, 50);
  assert.equal(ret.control.retentionRate, 67);
  assert.equal(ret.control.retentionDrop, 25);
  assert.equal(ret.control.n, 2);

  assert.equal(ret.netRetentionRate, 21); // 88 - 67 = 21%
  assert.match(ret.summaryText, /שימור שבועי/);
  assert.match(ret.summaryText, /88%/);
  assert.match(ret.summaryText, /67%/);
});

test('computeGainDistribution bins student gains into standard categories without PII', () => {
  const musicRows = [
    { pre: { score: 3, total: 4 }, post: { score: 2, total: 4 } }, // gain: -25% (decline)
    { pre: { score: 2, total: 4 }, post: { score: 2, total: 4 } }, // gain: 0% (same)
    { pre: { score: 2, total: 4 }, post: { score: 3, total: 4 } }, // gain: +25% (mild)
    { pre: { score: 1, total: 4 }, post: { score: 3, total: 4 } }, // gain: +50% (moderate)
    { pre: { score: 1, total: 4 }, post: { score: 4, total: 4 } }  // gain: +75% (high)
  ];

  const controlRows = [
    { pre: { score: 2, total: 4 }, post: { score: 1, total: 4 }, controlMode: true }, // gain: -25% (decline)
    { pre: { score: 2, total: 4 }, post: { score: 2, total: 4 }, controlMode: true }, // gain: 0% (same)
    { pre: { score: 1, total: 4 }, post: { score: 2, total: 4 }, controlMode: true }  // gain: +25% (mild)
  ];

  const dist = S.computeGainDistribution(musicRows, controlRows);

  assert.equal(dist.distribution, true);
  assert.equal(dist.totalGains, 8);
  assert.equal(dist.bins.length, 5);

  const binMap = {};
  dist.bins.forEach((b) => { binMap[b.key] = b; });

  assert.equal(binMap.decline.musicCount, 1);
  assert.equal(binMap.decline.controlCount, 1);
  assert.equal(binMap.decline.count, 2);

  assert.equal(binMap.same.musicCount, 1);
  assert.equal(binMap.same.controlCount, 1);

  assert.equal(binMap.mild.musicCount, 1);
  assert.equal(binMap.mild.controlCount, 1);

  assert.equal(binMap.moderate.musicCount, 1);
  assert.equal(binMap.moderate.controlCount, 0);

  assert.equal(binMap.high.musicCount, 1);
  assert.equal(binMap.high.controlCount, 0);

  // Series and categories compatibility with dataViz
  assert.deepEqual(dist.categories, dist.bins.map((b) => b.label));
  assert.equal(dist.series.length, 2);
  assert.equal(dist.series[0].key, 'music');
  assert.equal(dist.series[1].key, 'control');
});

test('computeAggregatedReport aggregates pre, post, 1-week later and retention stats guaranteeing no PII', () => {
  const rows = [
    { student: 'תלמיד 1', grade: 'ב', pre: { score: 1, total: 4 }, post: { score: 3, total: 4 }, later: { score: 3, total: 4 }, group: 'intervention' },
    { student: 'תלמיד 2', grade: 'ב', pre: { score: 2, total: 4 }, post: { score: 4, total: 4 }, later: { score: 4, total: 4 }, group: 'intervention' },
    { student: 'תלמיד 3', grade: 'ב', pre: { score: 1, total: 4 }, post: { score: 2, total: 4 }, later: { score: 2, total: 4 }, group: 'control' },
    { student: 'תלמיד 4', grade: 'ב', pre: { score: 2, total: 4 }, post: { score: 2, total: 4 }, later: { score: 1, total: 4 }, group: 'control' }
  ];

  const report = S.computeAggregatedReport(rows, { grade: 'ב' });

  assert.equal(report.noPII, true);
  assert.equal(report.hasData, true);
  assert.equal(report.totalCount, 4);
  assert.equal(report.musicCount, 2);
  assert.equal(report.controlCount, 2);

  assert.ok(report.comparison.hasBothGroups);
  assert.equal(report.comparison.music.preMean, 37.5);
  assert.equal(report.comparison.music.postMean, 87.5);
  assert.equal(report.comparison.music.laterMean, 87.5);
  assert.equal(report.comparison.control.preMean, 37.5);
  assert.equal(report.comparison.control.postMean, 50.0);

  // Retention
  assert.equal(report.retention.hasBoth, true);
  assert.equal(report.retention.music.retentionRate, 100);
  assert.ok(report.retention.control.retentionRate < 100);

  // Check no PII in entire JSON representation
  const str = JSON.stringify(report);
  assert.equal(str.includes('תלמיד'), false);
  assert.equal(str.includes('displayName'), false);
});

test('exportCleanReportCsv generates valid CSV without PII containing retention and distribution tables', () => {
  const rows = [
    { student: 'אברהם', pre: { score: 1, total: 4 }, post: { score: 4, total: 4 }, later: { score: 4, total: 4 }, group: 'intervention' },
    { student: 'שרה', pre: { score: 2, total: 4 }, post: { score: 3, total: 4 }, later: { score: 2, total: 4 }, group: 'control' }
  ];

  const csv = S.exportCleanReportCsv(rows, { grade: 'א' });

  assert.ok(typeof csv === 'string');
  assert.ok(csv.startsWith('\uFEFF')); // UTF-8 BOM
  assert.match(csv, /דוח השוואה כיתתי ומדדי שימור שבועיים/);
  assert.match(csv, /קבוצת ניסוי \(מוזיקה\)/);
  assert.match(csv, /קבוצת ביקורת/);
  assert.match(csv, /אחוז שימור שבועי/);
  assert.match(csv, /התפלגות שיפור/);
  assert.match(csv, /ירידה \(<0%\)/);

  // Absolute guarantee: no student names appear in the CSV
  assert.equal(csv.includes('אברהם'), false);
  assert.equal(csv.includes('שרה'), false);
});

test('dataViz normalizeDistribution and renderDistributionChartHtml produce accessible markup with bins and percentages', () => {
  const spec = {
    title: 'התפלגות שיפור כיתתי',
    bins: [
      { label: 'ירידה (<0%)', count: 1, musicCount: 0, controlCount: 1 },
      { label: 'ללא שינוי (0%)', count: 2, musicCount: 1, controlCount: 1 },
      { label: 'שיפור מתון (1-25%)', count: 4, musicCount: 3, controlCount: 1 },
      { label: 'שיפור ניכר (>50%)', count: 3, musicCount: 3, controlCount: 0 }
    ]
  };

  const norm = dataViz.normalizeDistribution(spec);
  assert.equal(norm.title, 'התפלגות שיפור כיתתי');
  assert.equal(norm.hasGroups, true);
  assert.equal(norm.totalCount, 10);
  assert.equal(norm.max, 3);

  const html = dataViz.renderDistributionChartHtml(spec);
  assert.match(html, /class="distribution-chart"/);
  assert.match(html, /role="img"/);
  assert.match(html, /aria-label="התפלגות שיפור כיתתי"/);
  assert.match(html, /class="dist-chart-legend"/);
  assert.match(html, /קבוצת ניסוי \(מוזיקה\)/);
  assert.match(html, /קבוצת ביקורת/);
  assert.match(html, /data-bin="שיפור מתון \(1-25%\)"/);
  assert.match(html, /class="dist-bar dist-bar--music"/);
  assert.match(html, /class="dist-bar dist-bar--control"/);
});

test('dataViz.renderBarChartHtml delegates to renderDistributionChartHtml for distribution specs', () => {
  const distSpec = {
    distribution: true,
    title: 'התפלגות',
    bins: [{ label: 'טווח 1', count: 5 }]
  };

  const html = dataViz.renderBarChartHtml(distSpec);
  assert.match(html, /class="distribution-chart"/);
  assert.match(html, /data-testid="distribution-chart"/);
});

test('app.js aggregatedReportCard renders full dashboard card with filter controls, print button, export button, comparison table, retention metrics, and distribution chart without any PII', () => {
  const appPath = path.join(__dirname, '..', 'pilot', 'js', 'app.js');
  const appSource = fs.readFileSync(appPath, 'utf8');

  // Verify function existence and integration
  assert.match(appSource, /function aggregatedReportCard\(/);
  assert.match(appSource, /aggregatedReportCard\(\)/);
  assert.match(appSource, /handleActionPrintAggregatedReport/);
  assert.match(appSource, /handleActionExportCleanReport/);
  assert.match(appSource, /handleActionFilterReport/);
  assert.match(appSource, /handleActionResetReportFilter/);

  // Run in sandboxed VM context
  const rows = [
    { student: 'תלמיד 1', grade: 'א', pre: { score: 1, total: 4 }, post: { score: 4, total: 4 }, later: { score: 3, total: 4 }, group: 'intervention' },
    { student: 'תלמיד 2', grade: 'א', pre: { score: 2, total: 4 }, post: { score: 4, total: 4 }, later: { score: 4, total: 4 }, group: 'intervention' },
    { student: 'תלמיד 3', grade: 'א', pre: { score: 1, total: 4 }, post: { score: 2, total: 4 }, later: { score: 2, total: 4 }, group: 'control' },
    { student: 'תלמיד 4', grade: 'א', pre: { score: 2, total: 4 }, post: { score: 2, total: 4 }, later: { score: 2, total: 4 }, group: 'control' }
  ];

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

  vm.createContext(sandbox);

  const evalCode = `
    const S = MMPilotScore;
    const G = globalThis;
    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
      });
    }
    function dataVizApi() { return MMDataViz; }
    function checkRows() { return ${JSON.stringify(rows)}; }
    ${appSource.match(/const aggregatedReportFilters = \{[\s\S]*?\n  \};/)[0]}
    ${appSource.match(/function aggregatedReportCard\([\s\S]*?\n  \}/)[0]}
    aggregatedReportCard();
  `;

  const cardHtml = vm.runInContext(evalCode, sandbox);

  // Assert essential elements exist
  assert.match(cardHtml, /data-testid="aggregated-pilot-report"/);
  assert.match(cardHtml, /data-testid="aggregated-report-filters"/);
  assert.match(cardHtml, /data-testid="report-filter-grade"/);
  assert.match(cardHtml, /data-testid="report-filter-date-from"/);
  assert.match(cardHtml, /data-testid="report-filter-date-to"/);
  assert.match(cardHtml, /data-testid="report-filter-apply"/);
  assert.match(cardHtml, /data-testid="report-filter-reset"/);
  assert.match(cardHtml, /data-testid="print-aggregated-report"/);
  assert.match(cardHtml, /data-testid="export-clean-report"/);
  assert.match(cardHtml, /data-testid="aggregated-metrics"/);
  assert.match(cardHtml, /data-testid="aggregated-summary-table"/);
  assert.match(cardHtml, /data-testid="aggregated-retention-text"/);
  assert.match(cardHtml, /data-testid="distribution-chart"/);

  // Assert NO PII in the rendered HTML output
  assert.equal(cardHtml.includes('תלמיד 1'), false);
  assert.equal(cardHtml.includes('תלמיד 2'), false);
  assert.equal(cardHtml.includes('תלמיד 3'), false);
  assert.equal(cardHtml.includes('תלמיד 4'), false);
});

test('pilot.css includes rules for aggregated report, distribution chart, and print media query', () => {
  const cssPath = path.join(__dirname, '..', 'pilot', 'pilot.css');
  const css = fs.readFileSync(cssPath, 'utf8');

  assert.match(css, /\.mm-aggregated-report/);
  assert.match(css, /\.mm-report-filters/);
  assert.match(css, /\.distribution-chart/);
  assert.match(css, /\.dist-chart-track/);
  assert.match(css, /\.dist-bar--music/);
  assert.match(css, /\.dist-bar--control/);
  assert.match(css, /@media print/);
  assert.match(css, /page-break-inside:\s*avoid/);
});

test('stripPII handles missing, non-object or null pre, post, and later fields gracefully', () => {
  const rawRows = [
    { student: 'נועה', grade: 'ב', group: 'control', pre: null, post: null, later: null },
    { student: 'איתי', grade: 'א', group: 'intervention', pre: 'invalid', post: 123, later: false },
    { student: 'עומר', grade: 'ג', group: 'control' }
  ];

  const cleaned = S.stripPII(rawRows);
  assert.equal(cleaned.length, 3);
  cleaned.forEach((r) => {
    assert.equal(r.student, undefined);
    assert.equal(r.pre, null);
    assert.equal(r.post, null);
    assert.equal(r.later, null);
  });
});

test('computeWeeklyRetention handles single-group retention and missing retention data with informative summaries', () => {
  // Case A: Only music group has post & later data
  const onlyMusic = S.computeWeeklyRetention(
    [{ pre: { score: 2, total: 4 }, post: { score: 4, total: 4 }, later: { score: 3, total: 4 } }],
    [{ pre: { score: 2, total: 4 } }]
  );
  assert.equal(onlyMusic.hasBoth, false);
  assert.equal(onlyMusic.music.retentionRate, 75);
  assert.equal(onlyMusic.control.retentionRate, null);
  assert.match(onlyMusic.summaryText, /שימור שבועי בקבוצת הניסוי: 75% מהישגי הלמידה נשמרו כעבור שבוע\./);

  // Case B: Only control group has post & later data
  const onlyControl = S.computeWeeklyRetention(
    [],
    [{ pre: { score: 2, total: 4 }, post: { score: 4, total: 4 }, later: { score: 2, total: 4 }, controlMode: true }]
  );
  assert.equal(onlyControl.hasBoth, false);
  assert.equal(onlyControl.music.retentionRate, null);
  assert.equal(onlyControl.control.retentionRate, 50);
  assert.match(onlyControl.summaryText, /שימור שבועי בקבוצת הביקורת: 50% כעבור שבוע\./);

  // Case C: Neither group has retention data
  const neither = S.computeWeeklyRetention([], []);
  assert.equal(neither.hasBoth, false);
  assert.equal(neither.music.retentionRate, null);
  assert.equal(neither.control.retentionRate, null);
  assert.equal(neither.summaryText, 'עדיין לא הושלמו בדיקות מעקב שבועיות מספיקות לחישוב שימור.');
});

test('computeGainDistribution processes combined array of intervention and control rows', () => {
  const combinedRows = [
    { pre: { score: 1, total: 4 }, post: { score: 4, total: 4 }, group: 'intervention' },
    { pre: { score: 2, total: 4 }, post: { score: 3, total: 4 }, controlMode: true }
  ];

  const dist = S.computeGainDistribution(combinedRows);
  assert.equal(dist.distribution, true);
  assert.equal(dist.totalGains, 2);
  assert.equal(dist.bins.find((b) => b.key === 'high').musicCount, 1);
  assert.equal(dist.bins.find((b) => b.key === 'mild').controlCount, 1);
});

test('dataViz normalizeDistribution and renderDistributionChartHtml support categories and series specification', () => {
  // Test with music and control series
  const seriesSpecMusic = {
    title: 'התפלגות לפי סדרות נתונים',
    categories: ['ירידה (<0%)', 'ללא שינוי (0%)', 'שיפור מתון (1-25%)'],
    series: [
      { key: 'music', values: [1, 2, 4] },
      { key: 'control', values: [2, 1, 0] }
    ]
  };

  const normMusic = dataViz.normalizeDistribution(seriesSpecMusic);
  assert.equal(normMusic.bins.length, 3);
  assert.equal(normMusic.bins[0].musicCount, 1);
  assert.equal(normMusic.bins[0].controlCount, 2);
  assert.equal(normMusic.bins[0].count, 3);
  assert.equal(normMusic.bins[2].musicCount, 4);

  const htmlMusic = dataViz.renderDistributionChartHtml(seriesSpecMusic);
  assert.match(htmlMusic, /class="distribution-chart"/);
  assert.match(htmlMusic, /class="dist-bar dist-bar--music"/);
  assert.match(htmlMusic, /class="dist-bar dist-bar--control"/);

  // Test with intervention key
  const seriesSpecIntervention = {
    title: 'התפלגות מקבוצת התערבות',
    categories: ['טווח א', 'טווח ב'],
    series: [
      { key: 'intervention', values: [3, 5] },
      { key: 'control', values: [1, 2] }
    ]
  };

  const normIntervention = dataViz.normalizeDistribution(seriesSpecIntervention);
  assert.equal(normIntervention.bins[0].musicCount, 3);
  assert.equal(normIntervention.bins[0].controlCount, 1);
  assert.equal(normIntervention.bins[1].musicCount, 5);
  assert.equal(normIntervention.bins[1].controlCount, 2);
});

