function updateDailyStreak({lastActiveDate, currentDate, currentStreak, freezeAvailable}) {
  if (typeof freezeAvailable !== 'boolean') throw new Error('freezeAvailable must be boolean');
  if (typeof currentStreak !== 'number' || !Number.isFinite(currentStreak)) throw new Error('invalid currentStreak');
  if (currentStreak < 0) currentStreak = 0;
  if (lastActiveDate === null) {
    return {newStreak: 1, freezeUsed: false, reset: false};
  }
  const last = new Date(lastActiveDate);
  const curr = new Date(currentDate);
  if (Number.isNaN(last.getTime()) || Number.isNaN(curr.getTime())) throw new Error('invalid date');
  if (curr < last) throw new Error("currentDate cannot be before lastActiveDate");
  const diff = Math.floor((curr - last) / (1000 * 60 * 60 * 24));
  if (diff < 0) {
    return {newStreak: 1, freezeUsed: false, reset: true};
  }
  if (diff === 0) {
    return {newStreak: currentStreak, freezeUsed: false, reset: false};
  }
  if (diff === 1) {
    return {newStreak: currentStreak + 1, freezeUsed: false, reset: false};
  }
  if (diff === 2 && freezeAvailable === true) {
    return {newStreak: currentStreak + 1, freezeUsed: true, reset: false};
  }
  return {newStreak: 1, freezeUsed: false, reset: true};
}
module.exports = { updateDailyStreak };
