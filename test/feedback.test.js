const test = require('node:test');
const assert = require('node:assert');

let feedbackModule;
try {
  feedbackModule = require('../src/lib/feedback');
} catch {
  feedbackModule = null;
}

test('getFeedbackUrl returns the exact feedback form URL without extra parameters', () => {
  const getFeedbackUrl =
    typeof feedbackModule === 'function'
      ? feedbackModule
      : feedbackModule && typeof feedbackModule.getFeedbackUrl === 'function'
        ? feedbackModule.getFeedbackUrl
        : () => null;

  const expectedUrl =
    'https://docs.google.com/forms/d/e/1FAIpQLSdT8YduNx-VWKM3bWGUJdiSj4Sw9D-EA6R6c-oYVYCQmOVXxQ/viewform?usp=pp_url&entry.368039752=MelodyMath';

  assert.strictEqual(getFeedbackUrl(), expectedUrl);
});
