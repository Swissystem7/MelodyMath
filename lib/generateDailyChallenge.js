const { createHash } = require('crypto');

function generateDailyChallenge(userId, date) {
  if (typeof userId !== 'string' || userId.trim() === '') return null;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) return null;
  const parsedDate = new Date(date + 'T00:00:00Z');
  if (isNaN(parsedDate.getTime()) || parsedDate.toISOString().slice(0, 10) !== date) return null;

  const state = (typeof globalThis.__dailyChallengeState === 'object' && globalThis.__dailyChallengeState !== null) ? globalThis.__dailyChallengeState : {};
  if (!globalThis.__dailyChallengeState) globalThis.__dailyChallengeState = state;
  if (!state[userId]) state[userId] = { challenges: {}, streak: 0, lastCompletionDate: null };

  const userState = state[userId];
  const challengeKey = date;
  if (userState.challenges[challengeKey]) {
    return userState.challenges[challengeKey];
  }

  const modules = ['interval-ratio', 'rhythm-fractions', 'melody-equation', 'tempo-progression'];
  const digest = createHash('sha256').update(`${userId}\0${date}`).digest();
  const numQuestions = 3 + digest[0] % 3;
  const questions = [];
  const usedModules = new Set();
  for (let i = 0; i < numQuestions; i++) {
    let module = modules[digest[i + 1] % modules.length];
    if (usedModules.has(module) && usedModules.size < modules.length) {
      module = modules.find(candidate => !usedModules.has(candidate));
    }
    usedModules.add(module);
    const params = { difficulty: 1 + digest[i + 8] % 10 };
    questions.push({ module, params });
  }

  const yesterday = new Date(parsedDate);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];
  const yesterdayChallenge = userState.challenges[yesterdayStr];
  let streak = 0;
  if (yesterdayChallenge && yesterdayChallenge.completed) {
    streak = userState.streak + 1;
  } else {
    streak = 1;
  }
  userState.streak = streak;
  const challengeId = digest.toString('hex').slice(0, 32);
  const challenge = { challengeId, questions, streak };
  userState.challenges[challengeKey] = challenge;
  return challenge;
}

module.exports = { generateDailyChallenge };
