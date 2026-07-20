function getAdaptiveHint(exerciseId, userAnswers) {
  if (!['interval-ratio', 'rhythm-fractions', 'melody-equation', 'tempo-progression'].includes(exerciseId)) throw new Error('Exercise ID not found');
  if (!Array.isArray(userAnswers) || userAnswers.length === 0) throw new Error('User answers cannot be empty');

  const wrongAnswers = userAnswers.filter(a => !a.wasCorrect);
  if (wrongAnswers.length === 0) return { hintLevel: 0, hintText: 'No hints needed' };

  const hintLevel = Math.min(wrongAnswers.length, 3);
  const lastWrong = wrongAnswers[wrongAnswers.length - 1];
  const answer = lastWrong.answer;

  let hintText = '';
  switch (exerciseId) {
    case 'interval-ratio':
      if (typeof answer === 'number' && !Number.isInteger(answer)) {
        hintText = 'Try using fractions instead of decimals for the ratio.';
      } else {
        hintText = 'Check the interval ratio between the two notes.';
      }
      break;
    case 'rhythm-fractions':
      if (typeof answer === 'string' && answer.includes('/')) {
        const parts = answer.split('/');
        if (parts[1] && parseInt(parts[1]) !== 4) {
          hintText = 'Remember the total beats in a measure determine the denominator.';
        } else {
          hintText = 'Check the numerator for the correct number of beats.';
        }
      } else {
        hintText = 'Think about the fraction of the beat each note gets.';
      }
      break;
    case 'melody-equation':
      if (typeof answer === 'string' && answer.includes('/')) {
        hintText = 'Remember slope is rise over run - check your vertical change.';
      } else {
        hintText = 'Calculate the slope by dividing the change in pitch by the change in time.';
      }
      break;
    case 'tempo-progression':
      if (typeof answer === 'number' && answer < 1) {
        hintText = 'The ratio should be greater than 1 - check the order of your values.';
      } else {
        hintText = 'Make sure you are dividing the later tempo by the earlier tempo.';
      }
      break;
    default:
      throw new Error('Exercise ID not found');
  }

  return { hintLevel, hintText };
}

module.exports = { getAdaptiveHint };
