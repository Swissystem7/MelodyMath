function getDueReviews(userId, currentTime, userConcepts) {
  if (typeof userId !== 'string' || userId.trim() === '' || !Number.isFinite(currentTime) || !Array.isArray(userConcepts) || userConcepts.length === 0) {
    return [];
  }
  const due = [];
  for (let i = 0; i < userConcepts.length; i++) {
    const c = userConcepts[i];
    if (!c || typeof c.conceptId !== 'string' || c.conceptId === '' || !Number.isFinite(c.lastReview) || !Number.isFinite(c.easeFactor) || !Number.isFinite(c.intervalDays) || c.intervalDays <= 0 || !Number.isFinite(c.repetitions)) {
      continue;
    }
    let ef = c.easeFactor;
    if (ef < 1.3) ef = 1.3;
    if (ef > 2.5) ef = 2.5;
    let reps = c.repetitions;
    if (reps < 0) reps = 0;
    if (reps > 5) reps = 5;
    reps = Math.trunc(reps);
    const intervalMs = c.intervalDays * 86400000;
    if (currentTime - c.lastReview >= intervalMs) {
      const priority = (currentTime - c.lastReview) / intervalMs;
      due.push({
        conceptId: c.conceptId,
        priority: priority,
        module: 'spaced-repetition',
        params: { easeFactor: ef, intervalDays: c.intervalDays, repetitions: reps }
      });
    }
  }
  due.sort((a, b) => b.priority - a.priority);
  return due;
}
module.exports = { getDueReviews };
