function generateAdaptiveLesson(userId, maxExercises = 5) {
  if (typeof userId !== 'string' || userId.trim() === '') {
    return { error: 'Invalid userId' };
  }
  if (!Number.isInteger(maxExercises) || maxExercises <= 0) {
    return { exercises: [] };
  }
  const userHistory = getUserHistory(userId);
  if (userHistory === null) {
    return { error: 'Unknown userId' };
  }
  const conceptScores = {};
  for (const entry of userHistory) {
    const cid = entry.conceptId;
    if (!conceptScores[cid]) {
      conceptScores[cid] = { total: 0, count: 0 };
    }
    conceptScores[cid].total += entry.score;
    conceptScores[cid].count += 1;
  }
  const conceptAvgs = Object.entries(conceptScores).map(([conceptId, data]) => ({
    conceptId,
    avgScore: data.total / data.count,
  }));
  conceptAvgs.sort((a, b) => a.avgScore - b.avgScore);
  const conceptIds = conceptAvgs.map(c => c.conceptId);
  const exercises = [];
  const exerciseTypeMap = {
    'interval-to-ratio': 'ratio_guess',
    'rhythm-fractions': 'fraction_tap',
  };
  if (conceptIds.length === 0) {
    const randomConcepts = Object.keys(exerciseTypeMap);
    const randomConcept = randomConcepts[Math.floor(Math.random() * randomConcepts.length)];
    exercises.push({
      conceptId: randomConcept,
      exerciseType: exerciseTypeMap[randomConcept] || 'default_type',
      difficulty: 1,
    });
    return { exercises };
  }
  let idx = 0;
  while (exercises.length < maxExercises) {
    const conceptId = conceptIds[idx % conceptIds.length];
    const avgScore = conceptAvgs.find(c => c.conceptId === conceptId).avgScore;
    const difficulty = 1 + Math.floor((1 - avgScore) * 4);
    const exerciseType = exerciseTypeMap[conceptId] || 'default_type';
    exercises.push({
      conceptId,
      exerciseType,
      difficulty: Math.min(5, Math.max(1, difficulty)),
    });
    idx++;
  }
  return { exercises };
  function getUserHistory(userId) {
    const db = {
      'user1': [
        { conceptId: 'interval-to-ratio', score: 0.8 },
        { conceptId: 'rhythm-fractions', score: 0.5 },
        { conceptId: 'interval-to-ratio', score: 0.9 },
        { conceptId: 'rhythm-fractions', score: 0.6 },
      ],
      'user2': [
        { conceptId: 'interval-to-ratio', score: 0.3 },
        { conceptId: 'rhythm-fractions', score: 0.7 },
      ],
    };
    if (!db[userId]) return null;
    const history = db[userId];
    const last50 = history.slice(-50);
    return last50;
  }
}
module.exports = { generateAdaptiveLesson };
