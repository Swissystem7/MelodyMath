function detectRhythmCheat(attempts) {
  if (!Array.isArray(attempts)) {
    throw new TypeError('Input must be an array');
  }
  if (attempts.length === 0) {
    return { suspected: false };
  }
  for (let i = 0; i < attempts.length; i++) {
    const a = attempts[i];
    if (!a || typeof a !== 'object') {
      throw new Error('Each attempt must have timestamp, score, timeTakenMs');
    }
    if (typeof a.timestamp !== 'number' || typeof a.score !== 'number' || typeof a.timeTakenMs !== 'number') {
      throw new Error('Each attempt must have timestamp, score, timeTakenMs');
    }
    if (a.timeTakenMs <= 0) {
      return { suspected: true, reason: 'Invalid timeTakenMs' };
    }
    if (a.timeTakenMs < 500 && a.score > 90) {
      return { suspected: true, reason: 'Automated: fast high score' };
    }
    if (a.score === 100 && a.timeTakenMs < 1000) {
      return { suspected: true, reason: 'Perfect score too fast' };
    }
  }
  const seen = new Map();
  for (let i = 0; i < attempts.length; i++) {
    const ts = attempts[i].timestamp;
    if (seen.has(ts)) {
      return { suspected: true, reason: 'Duplicate timestamp' };
    }
    seen.set(ts, true);
  }
  return { suspected: false };
}

module.exports = { detectRhythmCheat };
