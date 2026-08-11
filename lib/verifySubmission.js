function verifySubmission(submission, expectedConstraints = {}) {
  const { userId, exerciseType, answers, timestamps } = submission;
  const {
    minTimeBetweenAnswers = 500,
    maxTotalTime = 600000,
    minTotalTime = 10000
  } = expectedConstraints;

  if (!answers || answers.length === 0) {
    return { verified: false, riskScore: 1, reasons: ['No answers submitted'] };
  }

  const len = Math.min(answers.length, timestamps ? timestamps.length : 0);
  const sortedTimestamps = timestamps ? timestamps.slice(0, len).sort((a, b) => a - b) : [];
  const now = Date.now();
  let futureDetected = false;
  const clampedTimestamps = sortedTimestamps.map(t => {
    if (t > now) {
      futureDetected = true;
      return now;
    }
    return t;
  });

  const reasons = [];
  let riskScore = 0;

  if (futureDetected) {
    reasons.push('Future timestamps detected');
  }

  if (len === 0) {
    return { verified: false, riskScore: 1, reasons: ['No answers submitted'] };
  }

  const timeDiffs = [];
  for (let i = 1; i < len; i++) {
    timeDiffs.push(clampedTimestamps[i] - clampedTimestamps[i - 1]);
  }

  let fastCount = 0;
  for (const diff of timeDiffs) {
    if (diff < minTimeBetweenAnswers) {
      fastCount++;
    }
  }
  const fastRatio = timeDiffs.length > 0 ? fastCount / timeDiffs.length : 0;
  riskScore += fastRatio * 0.5;
  if (fastRatio > 0) {
    reasons.push('Too fast between answers');
  }

  const totalTime = len > 1 ? clampedTimestamps[len - 1] - clampedTimestamps[0] : 0;
  if (totalTime < minTotalTime) {
    riskScore += 0.3;
    reasons.push('Total time too short');
  } else if (totalTime > maxTotalTime) {
    riskScore += 0.3;
    reasons.push('Total time too long');
  }

  const allIdentical = len > 1 && answers.slice(0, len).every((a, i, arr) => a === arr[0]);
  if (allIdentical) {
    riskScore += 0.2;
    reasons.push('All answers identical');
  }

  riskScore = Math.min(riskScore, 1);
  const verified = riskScore < 0.5;

  return { verified, riskScore, reasons };
}

module.exports = { verifySubmission };