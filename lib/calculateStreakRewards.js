function calculateStreakRewards(userId, currentDate) {
  if (!userId) {
    return { error: "userId is required" };
  }
  if (typeof currentDate !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(currentDate)) {
    return { error: "currentDate must be a valid ISO date" };
  }
  const today = currentDate.slice(0, 10);
  const parsedToday = new Date(today + "T00:00:00Z");
  if (Number.isNaN(parsedToday.getTime()) || parsedToday.toISOString().slice(0, 10) !== today) {
    return { error: "currentDate must be a valid ISO date" };
  }
  const practiceDates = new Set(getPracticeHistory(userId).filter(d => typeof d === 'string').map(d => d.slice(0, 10)));
  if (!practiceDates.has(today)) {
    return { streakDays: 0, reward: null, nextMilestone: 7, currencyAwarded: 0 };
  }
  let streak = 0;
  const cursor = new Date(parsedToday);
  while (practiceDates.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  const milestones = [7, 30, 100, 365];
  let reward = null;
  if (milestones.includes(streak)) {
    reward = "badge_" + streak;
  }
  const nextMilestone = milestones.find(m => streak < m) || milestones[milestones.length - 1];
  const currencyAwarded = Math.min(streak * 10, 100);
  return { streakDays: streak, reward: reward, nextMilestone: nextMilestone, currencyAwarded: currencyAwarded };
}

function getPracticeHistory(userId) {
  const store = global.__practiceStore || {};
  return store[userId] || [];
}

module.exports = { calculateStreakRewards };
