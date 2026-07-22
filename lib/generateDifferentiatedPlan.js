function generateDifferentiatedPlan(studentData) {
  if (!studentData || typeof studentData !== 'object') return [];
  const { studentId, scores, preferredLengthMinutes } = studentData;
  let clampedMinutes = Number.isFinite(preferredLengthMinutes) ? preferredLengthMinutes : 5;
  if (clampedMinutes < 5) clampedMinutes = 5;
  if (clampedMinutes > 60) clampedMinutes = 60;
  const totalSeconds = clampedMinutes * 60;
  const modules = ['addition', 'subtraction', 'multiplication', 'division', 'fractions', 'decimals', 'geometry', 'algebra'];
  const normalizedScores = {};
  const safeScores = scores && typeof scores === 'object' && !Array.isArray(scores) ? scores : {};
  const moduleKeys = Object.keys(safeScores);
  if (moduleKeys.length === 0) {
    modules.forEach(m => normalizedScores[m] = 0);
  } else {
    modules.forEach(m => {
      let val = safeScores[m];
      if (!Number.isFinite(val) || val < 0) val = 0;
      normalizedScores[m] = val;
    });
  }
  const weakAreas = modules.filter(m => normalizedScores[m] < 80);
  const allHigh = weakAreas.length === 0;
  let targetModules = [];
  if (allHigh) {
    targetModules = modules.slice();
  } else {
    targetModules = weakAreas.slice();
  }
  const steps = [];
  const stepDuration = Math.floor(totalSeconds / targetModules.length);
  const musicContexts = ['pop', 'classical', 'jazz', 'rock', 'electronic', 'folk', 'latin', 'hiphop'];
  targetModules.forEach((moduleName, idx) => {
    let difficulty;
    let exerciseId;
    if (allHigh) {
      difficulty = 'advanced';
      exerciseId = `${moduleName}_enrich_${idx}`;
    } else {
      const score = normalizedScores[moduleName];
      if (score < 40) {
        difficulty = 'beginner';
        exerciseId = `${moduleName}_begin_${idx}`;
      } else if (score < 70) {
        difficulty = 'intermediate';
        exerciseId = `${moduleName}_inter_${idx}`;
      } else {
        difficulty = 'advanced';
        exerciseId = `${moduleName}_adv_${idx}`;
      }
    }
    const musicContext = musicContexts[idx % musicContexts.length];
    steps.push({
      moduleName,
      exerciseId,
      difficulty,
      durationSeconds: stepDuration,
      musicContext
    });
  });
  const remainder = totalSeconds - steps.reduce((sum, s) => sum + s.durationSeconds, 0);
  if (remainder > 0 && steps.length > 0) {
    steps[steps.length - 1].durationSeconds += remainder;
  }
  return steps;
}

module.exports = { generateDifferentiatedPlan };
