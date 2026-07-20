function getNextReviewDate(masteryScore, lastReviewDate) {
  if (!Number.isFinite(masteryScore) || masteryScore < 0 || masteryScore > 1) {
    throw new Error('masteryScore must be between 0 and 1');
  }
  if (typeof lastReviewDate !== 'string' || !/^\d{4}-\d{2}-\d{2}T/.test(lastReviewDate) || !Number.isFinite(Date.parse(lastReviewDate))) {
    throw new Error('Invalid lastReviewDate');
  }
  const date = new Date(lastReviewDate);
  let daysToAdd;
  if (masteryScore >= 0.9) {
    daysToAdd = 7;
  } else if (masteryScore >= 0.7) {
    daysToAdd = 3;
  } else if (masteryScore >= 0.4) {
    daysToAdd = 1;
  } else {
    daysToAdd = 0;
  }
  date.setUTCDate(date.getUTCDate() + daysToAdd);
  return date.toISOString();
}
module.exports = { getNextReviewDate };
