function assessOnboardingLevel(userResponses) {
  if (!userResponses || typeof userResponses !== 'object' || Object.keys(userResponses).length === 0) {
    return {
      recommendedModule: 'interval-to-ratio',
      difficulty: 2,
      musicScore: 0,
      mathScore: 0,
      remediationHints: [
        'Practice identifying intervals between notes',
        'Review basic rhythm patterns and tapping',
        'Work on reading notes on the staff',
        'Compare fractions with different denominators',
        'Simplify ratios to their lowest terms',
        'Recognize patterns in sequences'
      ]
    };
  }
  const mq = userResponses.musicQuestions || {};
  const mathq = userResponses.mathQuestions || {};
  const musicCorrect = (mq.intervalRecognition ? 1 : 0) + (mq.rhythmTapCorrect ? 1 : 0) + (mq.noteReading ? 1 : 0);
  const mathCorrect = (mathq.fractionComparison ? 1 : 0) + (mathq.ratioSimplification ? 1 : 0) + (mathq.patternRecognition ? 1 : 0);
  const musicScore = musicCorrect / 3;
  const mathScore = mathCorrect / 3;
  const hints = [];
  if (!mq.intervalRecognition) hints.push('Practice identifying intervals between notes');
  if (!mq.rhythmTapCorrect) hints.push('Review basic rhythm patterns and tapping');
  if (!mq.noteReading) hints.push('Work on reading notes on the staff');
  if (!mathq.fractionComparison) hints.push('Compare fractions with different denominators');
  if (!mathq.ratioSimplification) hints.push('Simplify ratios to their lowest terms');
  if (!mathq.patternRecognition) hints.push('Recognize patterns in sequences');
  if (musicCorrect === 3 && mathCorrect === 3) {
    return {
      recommendedModule: 'tempo-progression',
      difficulty: 3,
      musicScore: 1,
      mathScore: 1,
      remediationHints: []
    };
  }
  if (musicCorrect === 3 && mathCorrect === 0) {
    return {
      recommendedModule: 'rhythm-fractions',
      difficulty: 1,
      musicScore: 1,
      mathScore: 0,
      remediationHints: hints
    };
  }
  if (musicCorrect === 0 && mathCorrect === 3) {
    return {
      recommendedModule: 'interval-to-ratio',
      difficulty: 1,
      musicScore: 0,
      mathScore: 1,
      remediationHints: hints
    };
  }
  if (musicCorrect >= 2 && mathCorrect >= 2) {
    return {
      recommendedModule: 'melody-from-equation',
      difficulty: 2,
      musicScore: musicScore,
      mathScore: mathScore,
      remediationHints: hints
    };
  }
  if (musicCorrect >= 2) {
    return {
      recommendedModule: 'rhythm-fractions',
      difficulty: 2,
      musicScore: musicScore,
      mathScore: mathScore,
      remediationHints: hints
    };
  }
  if (mathCorrect >= 2) {
    return {
      recommendedModule: 'interval-to-ratio',
      difficulty: 2,
      musicScore: musicScore,
      mathScore: mathScore,
      remediationHints: hints
    };
  }
  return {
    recommendedModule: 'interval-to-ratio',
    difficulty: 1,
    musicScore: musicScore,
    mathScore: mathScore,
    remediationHints: hints
  };
}
module.exports = { assessOnboardingLevel };
