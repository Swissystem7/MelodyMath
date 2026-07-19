function selectFirstExercise(userAnswers) {
  userAnswers = userAnswers && typeof userAnswers === 'object' ? userAnswers : {};
  const intervalTest = Math.max(0, Math.min(100, Number.isFinite(userAnswers.intervalTest) ? userAnswers.intervalTest : 0));
  const fractionTest = Math.max(0, Math.min(100, Number.isFinite(userAnswers.fractionTest) ? userAnswers.fractionTest : 0));
  const rhythmTest = ['easy', 'medium', 'hard'].includes(userAnswers.rhythmTest) ? userAnswers.rhythmTest : 'easy';

  if (intervalTest < 30 && fractionTest < 30 && rhythmTest === 'easy') {
    return {
      exerciseType: 'interval-to-ratio',
      difficulty: 1,
      parameters: { intervalRange: 3 },
      instructions: 'Start with simple intervals. Identify the ratio between two notes within a range of 3 semitones.'
    };
  }

  if (intervalTest >= 30 && intervalTest < 60 && fractionTest < 50 && rhythmTest !== 'hard') {
    return {
      exerciseType: 'rhythm-fractions',
      difficulty: 3,
      parameters: { maxDenominator: 4 },
      instructions: 'Practice rhythmic patterns using fractions with denominators up to 4. Tap along to the beat.'
    };
  }

  if (fractionTest >= 50 && fractionTest < 80 && rhythmTest !== 'easy') {
    return {
      exerciseType: 'melody-from-equation',
      difficulty: 6,
      parameters: { equationComplexity: 2 },
      instructions: 'Generate a melody from a simple mathematical equation. Map note values to pitch and duration.'
    };
  }

  if (intervalTest >= 60 || fractionTest >= 80 || rhythmTest === 'hard') {
    return {
      exerciseType: 'tempo-progression',
      difficulty: 9,
      parameters: { tempoBPM: 120 },
      instructions: 'Maintain a steady tempo while the BPM gradually increases. Stay accurate under pressure.'
    };
  }

  return {
    exerciseType: 'interval-to-ratio',
    difficulty: 2,
    parameters: { intervalRange: 5 },
    instructions: 'Identify intervals within a range of 5 semitones. Build your ear training foundation.'
  };
}

module.exports = { selectFirstExercise };
