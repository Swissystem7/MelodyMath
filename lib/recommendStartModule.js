function recommendStartModule(answers) {
  if (!answers || typeof answers !== 'object' || Array.isArray(answers)) throw new Error('Invalid answers');
  const validKeys = ['knowNotes', 'knowIntervals', 'knowRhythm', 'knowFractions'];
  for (const key of Object.keys(answers)) {
    if (!validKeys.includes(key)) {
      throw new Error('Invalid key provided');
    }
  }
  for (const key of validKeys) if (key in answers && typeof answers[key] !== 'boolean') throw new Error('Invalid answer value');
  const { knowNotes, knowIntervals, knowRhythm, knowFractions } = answers;
  const allFalse = !knowNotes && !knowIntervals && !knowRhythm && !knowFractions;
  const allTrue = knowNotes && knowIntervals && knowRhythm && knowFractions;
  if (allFalse) {
    return { moduleId: 'rhythm-fractions', difficulty: 1, explanation: 'Start with rhythm and fractions basics to build a strong foundation.' };
  }
  if (allTrue) {
    return { moduleId: 'melody-from-equation', difficulty: 5, explanation: 'You have a solid music theory background, ready for advanced melody generation.' };
  }
  let score = 0;
  if (knowNotes) score += 1;
  if (knowIntervals) score += 1;
  if (knowRhythm) score += 1;
  if (knowFractions) score += 1;
  if (score <= 1) {
    return { moduleId: 'rhythm-fractions', difficulty: 2, explanation: 'Focus on rhythm and fractions to strengthen timing and math skills.' };
  } else if (score === 2) {
    if (knowIntervals && knowNotes) {
      return { moduleId: 'interval-ratio', difficulty: 3, explanation: 'You know notes and intervals, explore ratio relationships in music.' };
    } else {
      return { moduleId: 'rhythm-fractions', difficulty: 3, explanation: 'Build on your rhythm and fraction knowledge with more complex patterns.' };
    }
  } else {
    return { moduleId: 'tempo-progression', difficulty: 4, explanation: 'You have a broad understanding, now explore tempo and progression dynamics.' };
  }
}
module.exports = { recommendStartModule };
