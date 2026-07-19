function analyzeStudentPerformance(studentId, exerciseHistory) {
  if (typeof studentId !== 'string' || studentId.trim() === '') {
    throw new Error('studentId required');
  }
  if (!Array.isArray(exerciseHistory) || exerciseHistory.length === 0) {
    return { overallScore: 0, weakTopics: [], recommendation: 'No data yet.' };
  }
  const validTopics = ['interval-ratios', 'rhythm-fractions', 'melody-equations', 'tempo-progressions'];
  const topicResults = {};
  let totalCorrect = 0;
  let totalCount = 0;
  for (const entry of exerciseHistory) {
    if (!entry.exerciseId || typeof entry.exerciseId !== 'string') {
      continue;
    }
    const timeTaken = (typeof entry.timeTaken === 'number' && entry.timeTaken >= 0) ? entry.timeTaken : 0;
    const correct = entry.correct === true;
    totalCount++;
    if (correct) {
      totalCorrect++;
    }
    let topic = 'other';
    for (const t of validTopics) {
      if (entry.exerciseId.startsWith(t + '_')) {
        topic = t;
        break;
      }
    }
    if (!topicResults[topic]) {
      topicResults[topic] = { correct: 0, total: 0 };
    }
    topicResults[topic].total++;
    if (correct) {
      topicResults[topic].correct++;
    }
  }
  const overallScore = totalCount === 0 ? 0 : Math.round((totalCorrect / totalCount) * 100);
  const weakTopics = [];
  for (const t of validTopics) {
    if (topicResults[t]) {
      const pct = (topicResults[t].correct / topicResults[t].total) * 100;
      if (pct < 60) {
        weakTopics.push(t);
      }
    }
  }
  let recommendation;
  if (weakTopics.length === 0) {
    recommendation = 'Great progress!';
  } else {
    const topicList = weakTopics.join(' and ');
    recommendation = 'Focus on ' + topicList + ' based on recent results.';
  }
  return { overallScore, weakTopics, recommendation };
}
module.exports = { analyzeStudentPerformance };
