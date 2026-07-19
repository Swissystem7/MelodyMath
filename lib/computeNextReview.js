function computeNextReview({lastReviewDate, performanceRating, currentIntervalDays}) {
  if (!Number.isInteger(performanceRating) || performanceRating < 1 || performanceRating > 5) {
    throw new Error("performanceRating must be between 1 and 5");
  }
  if (currentIntervalDays <= 0) {
    currentIntervalDays = 1;
  }
  let factor;
  if (performanceRating === 1) {
    factor = 1;
  } else if (performanceRating === 2) {
    factor = 1.5;
  } else if (performanceRating === 3) {
    factor = 2;
  } else if (performanceRating === 4) {
    factor = 2.5;
  } else {
    factor = 3;
  }
  let nextIntervalDays;
  if (lastReviewDate === null) {
    nextIntervalDays = 1;
  } else {
    nextIntervalDays = currentIntervalDays * factor;
    if (performanceRating === 1) {
      nextIntervalDays = 1;
    }
  }
  if (nextIntervalDays > 365) {
    nextIntervalDays = 365;
  }
  let nextReviewDate;
  if (lastReviewDate === null) {
    const now = new Date();
    const future = new Date(now.getTime() + nextIntervalDays * 86400000);
    nextReviewDate = future.toISOString();
  } else {
    const last = new Date(lastReviewDate);
    const future = new Date(last.getTime() + nextIntervalDays * 86400000);
    if (Number.isNaN(future.getTime())) throw new Error('Invalid lastReviewDate');
    nextReviewDate = future.toISOString();
  }
  return { nextIntervalDays, nextReviewDate };
}
module.exports = { computeNextReview };
