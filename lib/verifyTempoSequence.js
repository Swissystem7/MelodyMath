function verifyTempoSequence(expectedIntervals, userTimestamps, options) {
  if (!Array.isArray(expectedIntervals) || !Array.isArray(userTimestamps) || expectedIntervals.length === 0 || userTimestamps.length === 0 || expectedIntervals.length !== userTimestamps.length - 1) {
    return { valid: false, errorDetail: 'Invalid input dimensions' };
  }
  if (!options || !Number.isFinite(options.toleranceMs) || options.toleranceMs < 0 ||
      !expectedIntervals.every(v=>Number.isFinite(v) && v > 0) || !userTimestamps.every(Number.isFinite)) {
    return { valid: false, errorDetail: 'Invalid input dimensions' };
  }
  const toleranceMs = options.toleranceMs;
  const minHumanJitter = options.minHumanJitter !== undefined ? options.minHumanJitter : 5;
  const maxRepetitionAccuracy = options.maxRepetitionAccuracy !== undefined ? options.maxRepetitionAccuracy : 0.01;
  if (!Number.isFinite(minHumanJitter) || minHumanJitter < 0 || !Number.isFinite(maxRepetitionAccuracy) || maxRepetitionAccuracy < 0) return { valid:false, errorDetail:'Invalid input dimensions' };
  for (let i = 0; i < userTimestamps.length; i++) {
    if (userTimestamps[i] < 0) {
      return { valid: false, errorDetail: 'Negative timestamp' };
    }
    if (i > 0 && userTimestamps[i] <= userTimestamps[i - 1]) {
      return { valid: false, errorDetail: 'Timestamps not monotonic' };
    }
  }
  const n = expectedIntervals.length;
  const actualIntervals = [];
  for (let i = 0; i < n; i++) {
    actualIntervals.push(userTimestamps[i + 1] - userTimestamps[i]);
  }
  for (let i = 0; i < n; i++) {
    const diff = Math.abs(actualIntervals[i] - expectedIntervals[i]);
    if (diff > toleranceMs) {
      return { valid: false, errorDetail: 'Exceeded tolerance at index ' + i };
    }
  }
  let allZeroDiff = true;
  for (let i = 0; i < n; i++) {
    if (Math.abs(actualIntervals[i] - expectedIntervals[i]) > 0) {
      allZeroDiff = false;
      break;
    }
  }
  if (allZeroDiff) {
    return { valid: false, errorDetail: 'Suspicious precision' };
  }
  const deviations = actualIntervals.map((v,i)=>v-expectedIntervals[i]);
  if (n > 1 && Math.max(...deviations)-Math.min(...deviations) < minHumanJitter) {
    return { valid: false, errorDetail: 'Suspicious precision' };
  }
  let exactRepeatCount = 0;
  for (let i = 1; i < n; i++) {
    if (Math.abs(actualIntervals[i] - actualIntervals[i - 1]) <= maxRepetitionAccuracy) {
      exactRepeatCount++;
    }
  }
  if (n > 1 && exactRepeatCount / (n - 1) > 0.75) {
    return { valid: false, errorDetail: 'Suspicious precision' };
  }
  return { valid: true, errorDetail: null };
}
module.exports = { verifyTempoSequence };
