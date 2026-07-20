function generateRhythmExercise(difficultyLevel = 3, recentAccuracy = 0.5) {
  difficultyLevel = Number.isFinite(difficultyLevel) ? Math.round(difficultyLevel) : 3;
  recentAccuracy = Number.isFinite(recentAccuracy) ? recentAccuracy : 0.5;
  if (difficultyLevel < 1) difficultyLevel = 1;
  if (difficultyLevel > 5) difficultyLevel = 5;
  if (recentAccuracy < 0) recentAccuracy = 0;
  if (recentAccuracy > 1) recentAccuracy = 1;

  let bpmMin, bpmMax, allowedNotes;
  if (difficultyLevel === 1) {
    bpmMin = 60; bpmMax = 80;
    allowedNotes = [1/4, 1/2];
  } else if (difficultyLevel === 2) {
    bpmMin = 70; bpmMax = 90;
    allowedNotes = [1/4, 1/2, 1/8];
  } else if (difficultyLevel === 3) {
    bpmMin = 80; bpmMax = 100;
    allowedNotes = [1/4, 1/2, 1/8, 3/8, 1/4 + 1/8];
  } else if (difficultyLevel === 4) {
    bpmMin = 90; bpmMax = 110;
    allowedNotes = [1/4, 1/2, 1/8, 3/8, 1/4 + 1/8, 1/3, 2/3];
  } else {
    bpmMin = 100; bpmMax = 120;
    allowedNotes = [1/4, 1/2, 1/8, 3/8, 1/4 + 1/8, 1/3, 2/3, 1/16, 3/16, 1/8 + 1/16];
  }

  let bpm = Math.floor(Math.random() * (bpmMax - bpmMin + 1)) + bpmMin;
  if (recentAccuracy < 0.5) {
    bpm = Math.round(bpm * 0.9);
  } else if (recentAccuracy > 0.8) {
    bpm = Math.round(bpm * 1.1);
  }

  const pattern = [];
  let remaining = 1;
  while (remaining > 0.001) {
    const candidates = allowedNotes.filter(n => n <= remaining + 0.001);
    if (candidates.length === 0) {
      pattern.push(remaining);
      break;
    }
    const note = candidates[Math.floor(Math.random() * candidates.length)];
    pattern.push(note);
    remaining -= note;
  }

  const fractionPattern = pattern.map(v => {
    if (Math.abs(v - 1/2) < 0.001) return "1/2";
    if (Math.abs(v - 1/4) < 0.001) return "1/4";
    if (Math.abs(v - 1/8) < 0.001) return "1/8";
    if (Math.abs(v - 1/16) < 0.001) return "1/16";
    if (Math.abs(v - 3/8) < 0.001) return "3/8";
    if (Math.abs(v - 3/16) < 0.001) return "3/16";
    if (Math.abs(v - (1/4 + 1/8)) < 0.001) return "3/8";
    if (Math.abs(v - 1/3) < 0.001) return "1/3";
    if (Math.abs(v - 2/3) < 0.001) return "2/3";
    if (Math.abs(v - (1/8 + 1/16)) < 0.001) return "3/16";
    return v.toString();
  }).join(",");

  const beatsPerPattern = pattern.reduce((a, b) => a + b, 0);
  const expectedDuration = (beatsPerPattern * 4 * 60) / bpm;

  return {
    fractionPattern,
    bpm,
    expectedDuration: Math.round(expectedDuration * 1000) / 1000
  };
}

module.exports = { generateRhythmExercise };
