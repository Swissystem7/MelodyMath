function computeStreakBonus(lastActiveDate, currentDate, streakCount) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}/;
  if (!dateRegex.test(lastActiveDate) || !dateRegex.test(currentDate)) {
    throw new Error('Invalid date string');
  }
  const lastDateStr = lastActiveDate.split('T')[0];
  const currentDateStr = currentDate.split('T')[0];
  const lastDateObj = new Date(lastDateStr + 'T00:00:00Z');
  const currentDateObj = new Date(currentDateStr + 'T00:00:00Z');
  if (lastDateObj.toISOString().slice(0, 10) !== lastDateStr || currentDateObj.toISOString().slice(0, 10) !== currentDateStr) {
    throw new Error('Invalid date string');
  }
  if (!Number.isInteger(streakCount) || streakCount < 0) throw new Error('Invalid streakCount');
  const diff = Math.round((currentDateObj - lastDateObj) / (1000 * 60 * 60 * 24));
  let multiplier;
  if (diff === 1) {
    const newStreakCount = streakCount + 1;
    multiplier = 1 + newStreakCount * 0.1;
    if (multiplier > 3.0) multiplier = 3.0;
  } else if (diff === 0) {
    multiplier = 1 + streakCount * 0.1;
    if (multiplier > 3.0) multiplier = 3.0;
  } else {
    multiplier = 1.0;
  }
  return multiplier;
}
module.exports = { computeStreakBonus };
