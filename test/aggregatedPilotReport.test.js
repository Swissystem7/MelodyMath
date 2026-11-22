const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const score = require('../pilot/js/score.js');
const dataViz = require('../src/lib/dataViz.js');
const appPath = path.join(__dirname, '..', 'pilot', 'js', 'app.js');
const appSource = fs.readFileSync(appPath, 'utf8');

const DAY = 24 * 60 * 60 * 1000;
const JAN = Date.UTC(2026, 0, 10);
const FEB = Date.UTC(2026, 1, 2);

function row(name, options) {
  const o = options || {};
  return {
    student: name,
    unit: o.unit || 'music-1',
    klass: o.klass || 'ב׳',
    reportAt: o.at == null ? JAN : o.at,
    group: o.group || 'intervention',
    pre: o.pre || { score: 1, total: 4 },
    post: o.post || { score: 3, total: 4 },
    later: o.later || { score: 3, total: 4 }
  };
}

const ROWS = [
  row('ישראל ישראלי', { klass: 'ב׳', at: JAN, pre: { score: 1, total: 4 }, post: { score: 3, total: 4 }, later: { score: 3, total: 4 } }),
  row('ישראל ישראלי 2', { klass: 'ב׳', at: JAN + 2 * DAY, pre: { score: 2, total: 4 }, post: { score: 4, total: 4 }, later: { score: 3, total: 4 } }),
  row('ילד 3', { klass: 'ג׳', at: FEB, pre: { score: 2, total: 4 }, post: { score: 3, total: 4 }, later: { score: 2, total: 4 } }),
  row('ילד 4', { klass: 'ב׳', at: JAN + DAY, group: 'control', pre: { score: 1, total: 4 }, post: { score: 2, total: 4 }, later: { score: 2, total: 4 } }),
  row('ילד 5', { klass: 'ג׳', at: FEB + DAY, group: 'control', pre: { score: 2, total: 4 }, post: { score: 2, total: 4 }, later: { score: 1, total: 4 } })
];

function report(filters) {
  return score.buildAggregatedPilotReport(ROWS, filters || {});
}

function extractFn(name) {
  const re = new RegExp('function ' + name + '\\([\\s\\S]*?\\n  \\}');
  const match = re.exec(appSource);
  assert.ok(match, 'app.js must define ' + name + '()');
  return match[0];
}

function appSandbox(filters) {
  const sandbox = {
    S: score,
    MMDataViz: dataViz,
    state: Object.assign({ reportClass: 'all', reportFrom: '', reportTo: '' }, filters || {}),
    esc: function (s) {
      return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
        return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
      });
    },
    checkRows: function () { return ROWS; },
    dataVizApi: function () { return dataViz; },
    report: null
  };
  sandbox.G = sandbox;
  vm.createContext(sandbox);
  return sandbox;
}

function renderCard(filters) {
  const sandbox = appSandbox(filters);
  sandbox.report = report(filters);
  vm.runInContext([
    extractFn('aggregatedReportRows'),
    extractFn('aggregatedReportData'),
    extractFn('aggregatedReportCard'),
    'aggregatedReportCard();'
  ].join('\n'), sandbox);
  return vm.runInContext('aggregatedReportCard();', sandbox);
}

test('buildAggregatedPilotReport centres pre, post and week-later means for both groups', () => {
  const r = report();
  assert.equal(r.rowCount, 5);
  assert.equal(r.groups.music.n, 3);
  assert.equal(r.groups.control.n, 2);
  assert.deepEqual(r.stages.map(function (s) { return s.key; }), ['pre', 'post', 'later']);
  assert.equal(r.stages[0].music, 41.7);
  assert.equal(r.stages[0].control, 37.5);
  assert.equal(r.stages[1].music, 83.3);
  assert.equal(r.stages[1].control, 50);
  assert.equal(r.stages[2].music, 66.7);
  assert.equal(r.stages[2].control, 37.5);
  assert.equal(r.stages[1].music - r.stages[1].control, 33.3);
});

test('buildAggregatedPilotReport computes retention rate and loss from the processed week check', () => {
  const r = report();
  assert.equal(r.retention.music.laterN, 3);
  assert.equal(r.retention.music.rate, 0.8);
  assert.equal(r.retention.music.drop, 16.6);
  assert.equal(r.retention.control.laterN, 2);
  assert.equal(r.retention.control.rate, 0.75);
  assert.equal(r.retention.control.drop, 12.5);
});

test('filterAggregatedRows filters by class without changing the source rows', () => {
  const filtered = score.filterAggregatedRows(ROWS, { klass: 'ב׳' });
  assert.equal(filtered.length, 3);
  assert.ok(filtered.every(function (r) { return r.klass === 'ב׳'; }));
  assert.equal(ROWS.length, 5);
  assert.deepEqual(score.collectReportClasses(ROWS), ['ב׳', 'ג׳']);
});

test('filterAggregatedRows applies inclusive date bounds and drops undated rows', () => {
  const fromFebruary = score.filterAggregatedRows(ROWS, { from: '2026-02-01' });
  assert.equal(fromFebruary.length, 2);
  assert.equal(score.filterAggregatedRows(ROWS, { to: '2026-01-12' }).length, 3);
  const narrow = score.filterAggregatedRows(ROWS, { klass: 'ג׳', to: '2026-02-02' });
  assert.equal(narrow.length, 1);
  assert.equal(narrow[0].klass, 'ג׳');
  const undated = [row('א', { at: '' })];
  assert.equal(score.filterAggregatedRows(undated, { from: '2026-01-01' }).length, 0);
});

test('reportDateKey normalizes numeric, string and invalid dates for the date filter', () => {
  assert.equal(score.reportDateKey(JAN), '2026-01-10');
  assert.equal(score.reportDateKey('2026-02-02T11:30:00Z'), '2026-02-02');
  assert.equal(score.reportDateKey(''), '');
  assert.equal(score.reportDateKey('not-a-date'), '');
  assert.equal(score.reportDateKey(new Date('2026-03-04T00:00:00Z')), '2026-03-04');
});

test('buildAggregatedPilotReport builds a gain distribution whose bucket counts equal the pair counts', () => {
  const r = report();
  const d = r.distribution;
  assert.equal(d.musicTotal, 3);
  assert.equal(d.controlTotal, 2);
  assert.equal(d.buckets.filter(function (b) { return b.key === 'high'; })[0].music, 2);
  assert.equal(d.buckets.filter(function (b) { return b.key === 'good'; })[0].music, 1);
  assert.equal(d.buckets.filter(function (b) { return b.key === 'none'; })[0].control, 1);
  assert.deepEqual(d.spec.series[0].values, r.distribution.buckets.map(function (b) { return b.music; }));
  assert.equal(r.distributionSpec.distribution, true);
});

test('the aggregated report result carries no student names or per-item answers', () => {
  const serialized = JSON.stringify(report());
  assert.doesNotMatch(serialized, /ישראל ישראלי/);
  assert.doesNotMatch(serialized, /ילד [345]/);
  assert.doesNotMatch(serialized, /"answers"/);
  assert.doesNotMatch(serialized, /"student"/);
});

test('normalizeDistribution sanitizes counts and keys before drawing', () => {
  const n = dataViz.normalizeDistribution({
    categories: ['ירידה', '<script>'],
    series: [{ key: 'music!', name: 'קבוצת ניסוי', values: [-3, '5', 'bad'] }],
    max: 0
  });
  assert.deepEqual(n.series[0].values, [0, 5, 0]);
  assert.equal(n.series[0].key, 'music');
  assert.equal(n.max, 5);
  assert.equal(n.categories[1], '<script>');
});

test('renderDistributionChartHtml draws an accessible chart with per-bucket counts and no identities', () => {
  const r = report();
  const html = dataViz.renderDistributionChartHtml(r.distributionSpec);
  assert.match(html, /class="distribution-chart" role="img"/);
  assert.match(html, /התפלגות שיפור/);
  assert.match(html, /data-bucket="25–49 נק׳"/);
  assert.match(html, /data-series="music"/);
  assert.match(html, /data-series="control"/);
  assert.match(html, /קבוצת ניסוי/);
  assert.match(html, /קבוצת ביקורת/);
  assert.doesNotMatch(html, /ישראל ישראלי/);
});

test('renderBarChartHtml delegates distribution specs to the distribution renderer', () => {
  const r = report();
  const html = dataViz.renderBarChartHtml(r.distributionSpec);
  assert.match(html, /class="distribution-chart"/);
  const comparative = dataViz.renderBarChartHtml(r.chartSpec);
  assert.match(comparative, /barchart--comparative/);
});

test('aggregatedReportCard renders filters, both charts, retention and print/export controls without PII', () => {
  const html = renderCard({ reportClass: 'ב׳' });
  assert.match(html, /data-testid="aggregated-report"/);
  assert.match(html, /data-rows="3"/);
  assert.match(html, /data-testid="aggregated-report-form"/);
  assert.match(html, /name="klass"/);
  assert.match(html, /name="from"/);
  assert.match(html, /name="to"/);
  assert.match(html, /data-testid="aggregated-report-stage" data-stage="later"/);
  assert.match(html, /data-testid="aggregated-retention"/);
  assert.match(html, /data-testid="aggregated-distribution-chart"/);
  assert.match(html, /data-testid="aggregated-report-print"/);
  assert.match(html, /data-testid="aggregated-report-export"/);
  assert.doesNotMatch(html, /ישראל ישראלי/);
});

test('aggregatedReportCsv exports only aggregate rows, including retention and distribution', () => {
  const sandbox = appSandbox();
  sandbox.report = report();
  const csv = vm.runInContext([
    extractFn('aggregatedReportCsv'),
    'aggregatedReportCsv(report);'
  ].join('\n'), sandbox);
  assert.match(csv, /"ממוצע אחוז","לפני היחידה"/);
  assert.match(csv, /"מדד שימור","אחוז שימור"/);
  assert.match(csv, /"התפלגות שיפור","50–74 נק׳"/);
  assert.doesNotMatch(csv, /ישראל ישראלי/);
  assert.doesNotMatch(csv, /"student"/);
});

test('app.js wires the aggregated report into the teacher board, its filters and its actions', () => {
  assert.match(appSource, /classGainCard\(\) \+ comparisonDashboardCard\(\) \+ aggregatedReportCard\(\)/);
  assert.match(appSource, /data-testid="aggregated-report-form"/);
  assert.match(appSource, /state\.reportClass = form\.klass\.value/);
  assert.match(appSource, /state\.reportFrom = form\.from\.value/);
  assert.match(appSource, /act === 'aggregated-print'/);
  assert.match(appSource, /act === 'aggregated-export'/);
  assert.match(appSource, /ensureDataViz\(\)/);
  assert.match(fs.readFileSync(path.join(__dirname, '..', 'pilot', 'pilot.css'), 'utf8'), /@media print/);
});
