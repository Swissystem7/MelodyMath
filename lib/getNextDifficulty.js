function getNextDifficulty({ currentDifficulty, recentScores, adjustmentRate }) {
  if (!Number.isFinite(adjustmentRate) || adjustmentRate <= 0 || adjustmentRate > 1) {
    throw new Error("adjustmentRate must be in (0,1]");
  }
  if (!Number.isFinite(currentDifficulty) || !Array.isArray(recentScores) || !recentScores.every(v => typeof v === 'boolean')) throw new TypeError('invalid input');
  let clamped = Math.min(1, Math.max(0, currentDifficulty));
  if (recentScores.length < 3) {
    return clamped;
  }
  const allTrue = recentScores.every(s => s === true);
  const allFalse = recentScores.every(s => s === false);
  if (allTrue) {
    clamped = Math.min(1, clamped + adjustmentRate);
  } else if (allFalse) {
    clamped = Math.max(0, clamped - adjustmentRate);
  }
  return clamped;
}
module.exports = { getNextDifficulty };
