function generateFirstExercise(studentProfile) {
  const defaultProfile = { age: 12, mathLevel: 'ratios' };
  const profile = studentProfile || defaultProfile;
  const age = (profile.age !== undefined && profile.age !== null) ? profile.age : 12;
  const mathLevel = profile.mathLevel || 'ratios';

  const frequencies = { C4: 261.63, G4: 392.00 };
  const ratio = frequencies.G4 / frequencies.C4;
  const answer = Math.round(ratio * 100) / 100;

  let hints;
  if (age < 5) {
    hints = [
      'Try dividing the bigger number by the smaller number',
      'The answer is a little more than 1',
      'It is about 1.5'
    ];
  } else if (age > 18) {
    hints = [
      'Compute G4 frequency divided by C4 frequency',
      'The ratio should be approximately 1.498',
      'Round to two decimal places: 1.50'
    ];
  } else {
    hints = [
      'Divide the larger frequency by the smaller',
      'You should get a number between 1 and 2',
      'It is approximately 1.5'
    ];
  }

  const prompt = 'The first two notes of Twinkle Twinkle are C4 (261.63 Hz) and G4 (392.00 Hz). What is the frequency ratio (as a decimal)?';
  const questionType = 'ratio_computation';

  return { prompt, questionType, answer, hints };
}

module.exports = { generateFirstExercise };