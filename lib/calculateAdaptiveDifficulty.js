function calculateAdaptiveDifficulty(performanceHistory, currentLevel) {
  if (!Array.isArray(performanceHistory) || performanceHistory.length === 0) {
    throw new Error('performanceHistory must not be empty');
  }
  if (!Number.isInteger(currentLevel) || currentLevel < 1 || currentLevel > 10) {
    throw new Error('currentLevel must be between 1 and 10');
  }
  const sorted = [...performanceHistory].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  let consecutiveCorrect = 0;
  let consecutiveIncorrect = 0;
  for (let i = sorted.length - 1; i >= 0; i--) {
    if (sorted[i].correct) {
      if (consecutiveIncorrect > 0) break;
      consecutiveCorrect++;
    } else {
      if (consecutiveCorrect > 0) break;
      consecutiveIncorrect++;
    }
  }
  let newLevel = currentLevel;
  if (consecutiveCorrect >= 3) {
    newLevel = Math.min(currentLevel + 1, 10);
  } else if (consecutiveIncorrect >= 2) {
    newLevel = Math.max(currentLevel - 1, 1);
  }
  return newLevel;
}
module.exports = { calculateAdaptiveDifficulty };
