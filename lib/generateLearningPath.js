function generateLearningPath(gradeLevel, musicInterest) {
  if (!Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 12) return [];
  const interest = typeof musicInterest === 'string' ? musicInterest.toLowerCase() : '';
  const validInterests = ['pop', 'classical', 'rock'];
  const normalizedInterest = validInterests.includes(interest) ? interest : 'general';
  const baseModules = [
    { moduleId: 'interval-to-ratio', estimatedMinutes: 10 },
    { moduleId: 'rhythm-fractions', estimatedMinutes: 12 },
    { moduleId: 'melody-from-equation', estimatedMinutes: 8 },
    { moduleId: 'tempo-progression', estimatedMinutes: 15 }
  ];
  const interestMap = {
    'pop': [
      { moduleId: 'rhythm-fractions', estimatedMinutes: 10 },
      { moduleId: 'melody-from-equation', estimatedMinutes: 12 },
      { moduleId: 'interval-to-ratio', estimatedMinutes: 8 },
      { moduleId: 'tempo-progression', estimatedMinutes: 14 }
    ],
    'classical': [
      { moduleId: 'interval-to-ratio', estimatedMinutes: 12 },
      { moduleId: 'melody-from-equation', estimatedMinutes: 10 },
      { moduleId: 'rhythm-fractions', estimatedMinutes: 8 },
      { moduleId: 'tempo-progression', estimatedMinutes: 15 }
    ],
    'rock': [
      { moduleId: 'tempo-progression', estimatedMinutes: 15 },
      { moduleId: 'rhythm-fractions', estimatedMinutes: 12 },
      { moduleId: 'melody-from-equation', estimatedMinutes: 10 },
      { moduleId: 'interval-to-ratio', estimatedMinutes: 8 }
    ],
    'general': baseModules
  };
  let path = interestMap[normalizedInterest].slice(0, 5);
  if (gradeLevel <= 4) {
    path = path.map(m => ({ ...m, estimatedMinutes: Math.min(m.estimatedMinutes + 2, 15) }));
  } else if (gradeLevel >= 9) {
    path = path.map(m => ({ ...m, estimatedMinutes: Math.max(m.estimatedMinutes - 2, 5) }));
  }
  return { path };
}
module.exports = { generateLearningPath };
