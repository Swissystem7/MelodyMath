const { randomUUID } = require('node:crypto');

function generateClassChallenges(classRoster, challengePreferences = {}) {
  if (!Array.isArray(classRoster) || classRoster.length < 2) return null;
  let { durationDays, teamSize, difficultyRange, allowMixedSkills } = challengePreferences;
  if (!Number.isFinite(durationDays)) durationDays = 1;
  durationDays = Math.max(1, Math.min(14, Math.trunc(durationDays)));
  if (!Number.isFinite(teamSize)) teamSize = 2;
  teamSize = Math.max(2, Math.min(4, Math.trunc(teamSize)));
  if (teamSize > classRoster.length) teamSize = classRoster.length;
  if (!difficultyRange || !Array.isArray(difficultyRange) || difficultyRange.some(d => !['easy','medium','hard'].includes(d))) {
    difficultyRange = ['medium'];
  }
  const roster = [...classRoster];
  const teams = [];
  const teamCount = Math.ceil(roster.length / teamSize);
  for (let i = 0; i < teamCount; i++) {
    const members = roster.splice(0, teamSize);
    if (members.length === 0) continue;
    const teamId = `team_${i + 1}`;
    const challenges = [];
    const modules = ['intervalRatio', 'rhythmFractions', 'melodyEquation', 'tempoProgression'];
    const difficultyMap = { easy: 1, medium: 2, hard: 3 };
    const baseDifficulty = difficultyMap[difficultyRange[0]] || 2;
    const challengeCount = Math.max(1, Math.floor(durationDays / 2));
    if (allowMixedSkills) {
      for (let m = 0; m < modules.length; m++) {
        const dueDay = Math.min((m + 1) * Math.floor(durationDays / modules.length) + 1, durationDays);
        challenges.push({
          type: modules[m],
          difficulty: baseDifficulty,
          param: {},
          dueDay: dueDay
        });
      }
      const extraCount = challengeCount - modules.length;
      for (let e = 0; e < extraCount; e++) {
        const dueDay = Math.min(Math.floor(Math.random() * durationDays) + 1, durationDays);
        challenges.push({
          type: modules[Math.floor(Math.random() * modules.length)],
          difficulty: baseDifficulty,
          param: {},
          dueDay: dueDay
        });
      }
    } else {
      for (let c = 0; c < challengeCount; c++) {
        const dueDay = Math.min(Math.floor((c + 1) * durationDays / challengeCount), durationDays);
        challenges.push({
          type: modules[Math.floor(Math.random() * modules.length)],
          difficulty: baseDifficulty,
          param: {},
          dueDay: dueDay
        });
      }
    }
    teams.push({ teamId, members, challenges });
  }
  const leaderboardId = `lb_${randomUUID()}`;
  return { teams, leaderboardId };
}
module.exports = { generateClassChallenges };
