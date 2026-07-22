function selectNextExercise(userProfile) {
  userProfile = userProfile && typeof userProfile === 'object' ? userProfile : {};
  const scores = userProfile.skillScores && typeof userProfile.skillScores === 'object' ? { ...userProfile.skillScores } : {};
  const types = ['intervalRatio', 'rhythmFractions', 'melodyEquation', 'tempoProgression'];
  types.forEach(t => { if (!Number.isFinite(scores[t])) scores[t] = 0; scores[t] = Math.max(0, Math.min(1, scores[t])); });
  const allOne = types.every(t => scores[t] === 1);
  if (allOne) {
    const type = types[Math.floor(Math.random() * 4)];
    return { type, difficulty: 10, parameters: parametersFor(type, 10) };
  }
  if (userProfile.totalAttempts < 5) {
    let minScore = Infinity;
    let minType = types[0];
    for (const t of types) {
      if (scores[t] < minScore) {
        minScore = scores[t];
        minType = t;
      }
    }
    return { type: minType, difficulty: 1, parameters: parametersFor(minType, 1) };
  }
  let minScore = Infinity;
  let minType = types[0];
  for (const t of types) {
    if (scores[t] < minScore) {
      minScore = scores[t];
      minType = t;
    }
  }
  let difficulty = Math.max(1, Math.min(10, Math.round((1 - minScore) * 9 + 1)));
  if (userProfile.streak > 10) {
    difficulty = Math.min(10, difficulty + 2);
  }
  const params = parametersFor(minType, difficulty);
  return { type: minType, difficulty, parameters: params };
}

function parametersFor(minType, difficulty) {
  const params = {};
  if (minType === 'intervalRatio') {
    const intervals = ['minorSecond', 'majorSecond', 'minorThird', 'majorThird', 'perfectFourth', 'tritone', 'perfectFifth', 'minorSixth', 'majorSixth', 'minorSeventh', 'majorSeventh', 'octave'];
    const idx = Math.min(Math.floor((difficulty - 1) * intervals.length / 10), intervals.length - 1);
    params.interval = intervals[idx];
    params.direction = Math.random() < 0.5 ? 'ascending' : 'descending';
  } else if (minType === 'rhythmFractions') {
    const fractions = ['1/4', '1/2', '3/4', '1', '1/8', '3/8', '5/8', '7/8', '1/16', '3/16'];
    const idx = Math.min(Math.floor((difficulty - 1) * fractions.length / 10), fractions.length - 1);
    params.fraction = fractions[idx];
  } else if (minType === 'melodyEquation') {
    const equations = ['simple', 'stepwise', 'leap', 'arpeggio', 'chromatic', 'pentatonic', 'blues', 'modal', 'atonal', 'random'];
    const idx = Math.min(Math.floor((difficulty - 1) * equations.length / 10), equations.length - 1);
    params.equation = equations[idx];
  } else if (minType === 'tempoProgression') {
    const tempos = [60, 70, 80, 90, 100, 110, 120, 130, 140, 150];
    const idx = Math.min(Math.floor((difficulty - 1) * tempos.length / 10), tempos.length - 1);
    params.bpm = tempos[idx];
    params.progression = Math.random() < 0.5 ? 'constant' : 'accelerando';
  }
  return params;
}
module.exports = { selectNextExercise };
