function scheduleIntervalReviews(userHistory, currentDate) {
  if (typeof currentDate !== 'string' || !Number.isFinite(Date.parse(currentDate))) {
    throw new Error('Invalid currentDate');
  }
  const now = new Date(currentDate);
  const boxIntervals = [0, 1, 3, 7, 14, 30];
  const latestMap = new Map();
  if (!Array.isArray(userHistory)) throw new Error('Invalid userHistory');
  for (const entry of userHistory) {
    if (!entry || typeof entry.intervalId !== 'string' || !Number.isFinite(Date.parse(entry.timestamp))) continue;
    const existing = latestMap.get(entry.intervalId);
    if (!existing || new Date(entry.timestamp) > new Date(existing.timestamp)) {
      latestMap.set(entry.intervalId, entry);
    }
  }
  const result = [];
  for (const [intervalId, entry] of latestMap) {
    let score = Number.isFinite(entry.score) ? entry.score : 0;
    if (score < 0) score = 0;
    if (score > 1) score = 1;
    let box = 1;
    if (score >= 0.8) {
      box = 2;
    }
    const lastDate = new Date(entry.timestamp);
    const nextDate = new Date(lastDate.getTime() + boxIntervals[box] * 86400000);
    if (nextDate <= now) {
      result.push({ intervalId, nextReviewDate: nextDate.toISOString() });
    }
  }
  return result;
}
module.exports = { scheduleIntervalReviews };
