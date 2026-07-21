function generateAnonymizedReport(students) {
  if (!Array.isArray(students)) throw new TypeError('students must be an array');
  const crypto = require('crypto');
  const result = students.map(student => {
    if (!student || typeof student.id !== 'string' || !Array.isArray(student.scores)) throw new TypeError('Invalid student');
    const hash = crypto.createHash('sha256').update(student.id).digest('hex');
    const anonymizedId = hash.substring(0, 8);
    const scores = student.scores.map(value => Number.isNaN(value) ? 0 : value);
    if (!scores.every(Number.isFinite)) throw new TypeError('Scores must be finite numbers');
    const scoreCount = scores.length;
    let avgScore = 0;
    let maxScore = -Infinity;
    let minScore = Infinity;
    let scoreStdDev = null;
    if (scoreCount > 0) {
      let sum = 0;
      for (let i = 0; i < scoreCount; i++) {
        const val = scores[i];
        sum += val;
        if (val > maxScore) maxScore = val;
        if (val < minScore) minScore = val;
      }
      avgScore = sum / scoreCount;
      if (scoreCount >= 2) {
        let varianceSum = 0;
        for (let i = 0; i < scoreCount; i++) {
          const diff = scores[i] - avgScore;
          varianceSum += diff * diff;
        }
        scoreStdDev = Math.sqrt(varianceSum / scoreCount);
      }
    }
    return {
      anonymizedId,
      scoreCount,
      avgScore,
      maxScore,
      minScore,
      scoreStdDev
    };
  });
  result.sort((a, b) => a.anonymizedId.localeCompare(b.anonymizedId));
  return result;
}
module.exports = { generateAnonymizedReport };
