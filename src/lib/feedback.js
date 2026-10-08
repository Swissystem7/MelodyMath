const FEEDBACK_URL =
  'https://docs.google.com/forms/d/e/1FAIpQLSdT8YduNx-VWKM3bWGUJdiSj4Sw9D-EA6R6c-oYVYCQmOVXxQ/viewform?usp=pp_url&entry.368039752=MelodyMath';

function getFeedbackUrl() {
  return FEEDBACK_URL;
}

getFeedbackUrl.getFeedbackUrl = getFeedbackUrl;
getFeedbackUrl.FEEDBACK_URL = FEEDBACK_URL;

module.exports = getFeedbackUrl;
