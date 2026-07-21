function getNextExercise(history) {
  if (!Array.isArray(history) || history.length === 0) return null;
  const modules = ['interval-ratio', 'rhythm-fractions', 'melody-equation', 'tempo-progression'];
  const validHistory = history.filter(h => h && modules.includes(h.module) && typeof h.correct === 'boolean' && Number.isFinite(h.timeSpent) && Number.isFinite(h.timestamp));
  if (validHistory.length === 0) return null;
  const now = Math.max(...validHistory.map(h => h.timestamp));
  const recentThreshold = 7 * 24 * 60 * 60 * 1000;
  const recentHistory = validHistory.filter(h => (now - h.timestamp) < recentThreshold);
  const effectiveHistory = recentHistory.length > 0 ? recentHistory : validHistory;
  const moduleStats = {};
  modules.forEach(m => {
    const entries = effectiveHistory.filter(h => h.module === m);
    if (entries.length === 0) {
      moduleStats[m] = { accuracy: 0.5, count: 0, avgTime: 0 };
    } else {
      const correct = entries.filter(h => h.correct).length;
      const accuracy = correct / entries.length;
      const avgTime = entries.reduce((s, h) => s + h.timeSpent, 0) / entries.length;
      moduleStats[m] = { accuracy, count: entries.length, avgTime };
    }
  });
  let worstModule = modules[0];
  let worstAccuracy = 1;
  modules.forEach(m => {
    if (moduleStats[m].accuracy < worstAccuracy) {
      worstAccuracy = moduleStats[m].accuracy;
      worstModule = m;
    }
  });
  const recentCorrect = effectiveHistory.filter(h => h.correct).length;
  const recentTotal = effectiveHistory.length;
  const recentAccuracy = recentTotal > 0 ? recentCorrect / recentTotal : 0.5;
  let difficulty;
  if (recentAccuracy >= 0.8) {
    difficulty = 6;
  } else if (recentAccuracy <= 0.3) {
    difficulty = 4;
  } else {
    difficulty = 5;
  }
  const module = worstModule;
  let parameters = {};
  if (module === 'interval-ratio') {
    const intervalTypes = ['minor', 'major', 'perfect'];
    parameters = { intervalType: intervalTypes[difficulty % intervalTypes.length], maxSize: Math.min(12, difficulty + 2) };
  } else if (module === 'rhythm-fractions') {
    parameters = { maxDenominator: Math.min(16, difficulty * 2), includeDotted: difficulty > 5 };
  } else if (module === 'melody-equation') {
    parameters = { noteRange: Math.min(24, difficulty * 3), stepSize: difficulty > 7 ? 'chromatic' : 'diatonic' };
  } else if (module === 'tempo-progression') {
    parameters = { bpmRange: [60 + difficulty * 5, 60 + difficulty * 10], changeType: difficulty > 6 ? 'sudden' : 'gradual' };
  }
  return { module, difficulty, parameters };
}
module.exports = { getNextExercise };
