const { test } = require('node:test');
const assert = require('node:assert/strict');
const VendorPortfolio = require('../src/lib/vendorPortfolio.js');

test('VendorPortfolio exports requirements list and functions', () => {
  assert.ok(Array.isArray(VendorPortfolio.VENDOR_REQUIREMENTS));
  assert.ok(VendorPortfolio.VENDOR_REQUIREMENTS.length >= 5);
  assert.equal(typeof VendorPortfolio.getVendorPortfolioChecklist, 'function');
  assert.equal(typeof VendorPortfolio.auditVendorReadiness, 'function');
  assert.equal(typeof VendorPortfolio.formatVendorSummaryText, 'function');
});

test('auditVendorReadiness evaluates full compliance when all items pass', () => {
  const fullState = {
    privacy_zero_backend: true,
    accessibility_is5568_aa: true,
    curriculum_mapping: true,
    no_paywall_honesty: true,
    licensed_assets: true
  };

  const audit = VendorPortfolio.auditVendorReadiness(fullState);
  assert.equal(audit.readinessScore, 100);
  assert.equal(audit.isReadyForSubmission, true);
  assert.equal(audit.passedMandatory, audit.totalMandatory);
});

test('auditVendorReadiness flags missing mandatory requirements', () => {
  const partialState = {
    privacy_zero_backend: true,
    accessibility_is5568_aa: false
  };

  const audit = VendorPortfolio.auditVendorReadiness(partialState);
  assert.ok(audit.readinessScore < 100);
  assert.equal(audit.isReadyForSubmission, false);
});

test('formatVendorSummaryText generates formatted Hebrew summary', () => {
  const audit = VendorPortfolio.auditVendorReadiness({ privacy_zero_backend: true });
  const text = VendorPortfolio.formatVendorSummaryText(audit);

  assert.match(text, /תיק ספק/);
  assert.match(text, /ציון מוכנות דרישות סף/);
  assert.match(text, /הגנת פרטיות/);
});
