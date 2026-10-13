const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const rem = require('../src/lib/remediation');

test('remediation module exports valid failure points for elementary and middle school', () => {
  const points = rem.getAllFailurePoints();
  assert.ok(Array.isArray(points), 'points should be an array');
  assert.ok(points.length >= 10, 'should contain at least 10 major failure points');

  const elem = rem.getFailurePointsByTier('elementary');
  const mid = rem.getFailurePointsByTier('middle');

  assert.ok(elem.length >= 3, 'should have at least 3 elementary failure points');
  assert.ok(mid.length >= 7, 'should have at least 7 middle school failure points');

  points.forEach((p) => {
    assert.ok(p.id, 'point must have an id');
    assert.ok(p.tier === 'elementary' || p.tier === 'middle', 'tier must be valid');
    assert.ok(p.topicHe, 'must have topicHe');
    assert.ok(p.grades, 'must have grades');
    assert.ok(p.nationalIssue, 'must describe national RAMA issue');
    assert.ok(p.misconception, 'must detail the cognitive misconception');
    assert.ok(p.musicalMechanism, 'must map to a musical mechanism');
    assert.ok(p.syllabusRef, 'must reference ministry syllabus');
  });
});

test('remediation module includes cognitive research foundations', () => {
  const research = rem.getResearchFoundations();
  assert.ok(Array.isArray(research));
  assert.ok(research.length >= 4);
  research.forEach((r) => {
    assert.ok(r.id);
    assert.ok(r.nameHe);
    assert.ok(r.keyResearchers);
    assert.ok(r.coreFinding);
  });
});

test('remediation point lookup works correctly for both elementary and middle school', () => {
  const frac = rem.getPointById('elem-fractions');
  assert.ok(frac);
  assert.equal(frac.tier, 'elementary');
  assert.match(frac.topicHe, /שברים/);

  const slope = rem.getPointById('mid-linear-slope');
  assert.ok(slope);
  assert.equal(slope.tier, 'middle');
  assert.match(slope.musicalMechanism, /סוניפיקציית גובה צליל רציפה|גליסנדו/);

  const exp = rem.getPointById('mid-exponents-powers');
  assert.ok(exp);
  assert.match(exp.musicalMechanism, /אוקטבות/);

  const pyth = rem.getPointById('mid-pythagoras-ratios');
  assert.ok(pyth);
  assert.match(pyth.musicalMechanism, /פיתגוראית/);

  const missing = rem.getPointById('non-existent');
  assert.equal(missing, null);
});

test('remediation summary reports exact counts', () => {
  const sum = rem.remediationSummary();
  assert.ok(sum.totalPoints >= 10);
  assert.equal(sum.totalPoints, sum.elementaryCount + sum.middleCount);
  assert.ok(sum.researchCount >= 4);
});

test('remediation content strictly complies with honesty guidelines', () => {
  const fileContent = fs.readFileSync(path.join(__dirname, '../src/lib/remediation.js'), 'utf8');
  assert.doesNotMatch(fileContent, /סוגרים פערים במתמטיקה/);
  assert.doesNotMatch(fileContent, /הילד שולט בכל המיומנויות/);
  assert.doesNotMatch(fileContent, /מחקרים מוכיחים שהקצב/);
  assert.doesNotMatch(fileContent, /ADHD|דיסקלקול|dyscalcul/i);
  assert.doesNotMatch(fileContent, /15–20%|15-20%/);
});
