function generateAssignment(studentProfiles, moduleId) {
  if (!Array.isArray(studentProfiles) || studentProfiles.length === 0) return [];
  const validModules = ['interval', 'rhythm-fractions', 'equation', 'tempo'];
  if (!validModules.includes(moduleId)) return [];
  const skillMap = {
    'interval': 'interval',
    'rhythm-fractions': 'fraction',
    'equation': 'equation',
    'tempo': 'tempo'
  };
  const skillField = skillMap[moduleId];
  return studentProfiles.map(profile => {
    const rawSkill = profile.skillLevel && profile.skillLevel[skillField] !== undefined ? profile.skillLevel[skillField] : 1;
    const numericSkill = Number(rawSkill);
    const clampedSkill = Number.isFinite(numericSkill)
      ? Math.max(1, Math.min(10, Math.round(numericSkill)))
      : 1;
    const difficulty = clampedSkill;
    const questionCount = Math.max(2, Math.min(10, 11 - difficulty));
    const moduleParams = { maxIntervals: difficulty + 2 };
    return {
      studentId: profile.studentId,
      difficulty: difficulty,
      questionCount: questionCount,
      moduleParams: moduleParams
    };
  });
}
module.exports = { generateAssignment };
