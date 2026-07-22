function createOnboardingSandbox(moduleName, userLevel) {
  const validModules = ['interval-to-ratio', 'rhythm-fractions', 'melody-from-equation', 'tempo-progression'];
  if (!validModules.includes(moduleName)) {
    moduleName = 'rhythm-fractions';
  }
  if (![1, 2, 3].includes(userLevel)) {
    userLevel = 2;
  }
  const timeoutSeconds = userLevel === 1 ? 30 : userLevel === 2 ? 45 : 60;
  const completionReward = 'Earned First Harmony Badge';
  let steps;
  switch (moduleName) {
    case 'interval-to-ratio':
      steps = [
        { stepId: 1, type: 'listen', description: 'Listen to a single note C4', mediaHint: 'Play C4', expectedAction: 'Press play button', hintOnIdle: 'Tap the play icon to hear the note', nextStepCondition: 'audioPlayed' },
        { stepId: 2, type: 'listen', description: 'Listen to two notes C4 and G4', mediaHint: 'Play C4 and G4 interval', expectedAction: 'Press play button', hintOnIdle: 'Tap play to hear both notes', nextStepCondition: 'audioPlayed' },
        { stepId: 3, type: 'tap', description: 'Tap the note G4 when you hear it', mediaHint: 'Play C4 then G4', expectedAction: 'Tap G4 button', hintOnIdle: 'Wait for the second note and tap G4', nextStepCondition: 'correctAnswerGiven' },
        { stepId: 4, type: 'match', description: 'Match the interval you heard to the correct name', mediaHint: 'Play C4-G4 interval', expectedAction: 'Select "Perfect Fifth"', hintOnIdle: 'The interval sounds like a perfect fifth', nextStepCondition: 'correctAnswerGiven' },
        { stepId: 5, type: 'solve', description: 'Identify the missing note to complete the interval', mediaHint: 'Play C4 and ?', expectedAction: 'Select G4', hintOnIdle: 'Think of the note that makes a perfect fifth with C4', nextStepCondition: 'correctAnswerGiven' }
      ];
      break;
    case 'tempo-progression':
      steps = [
        { stepId: 1, type: 'listen', description: 'Listen to a simple ratio 2:1', mediaHint: 'Play octave interval', expectedAction: 'Press play button', hintOnIdle: 'Tap play to hear the octave', nextStepCondition: 'audioPlayed' },
        { stepId: 2, type: 'listen', description: 'Listen to ratio 3:2', mediaHint: 'Play perfect fifth interval', expectedAction: 'Press play button', hintOnIdle: 'Tap play to hear the perfect fifth', nextStepCondition: 'audioPlayed' },
        { stepId: 3, type: 'tap', description: 'Tap the ratio that matches the sound', mediaHint: 'Play 3:2 interval', expectedAction: 'Click the ratio 3:2', hintOnIdle: 'The interval sounds like a perfect fifth, choose 3:2', nextStepCondition: 'correctAnswerGiven' },
        { stepId: 4, type: 'match', description: 'Match the ratio to its musical interval name', mediaHint: 'Play 4:3 interval', expectedAction: 'Select "Perfect Fourth"', hintOnIdle: '4:3 is a perfect fourth', nextStepCondition: 'correctAnswerGiven' },
        { stepId: 5, type: 'solve', description: 'Find the missing ratio in the harmonic series', mediaHint: 'Play 2:1 and 3:2', expectedAction: 'Select 4:3', hintOnIdle: 'The next simple ratio after 3:2 is 4:3', nextStepCondition: 'correctAnswerGiven' }
      ];
      break;
    case 'melody-from-equation':
      steps = [
        { stepId: 1, type: 'listen', description: 'Listen to a three-note ascending melody', mediaHint: 'Play C4 D4 E4', expectedAction: 'Press play button', hintOnIdle: 'Tap play to hear the melody', nextStepCondition: 'audioPlayed' },
        { stepId: 2, type: 'listen', description: 'Listen to a three-note descending melody', mediaHint: 'Play E4 D4 C4', expectedAction: 'Press play button', hintOnIdle: 'Tap play to hear the descending melody', nextStepCondition: 'audioPlayed' },
        { stepId: 3, type: 'tap', description: 'Tap the shape that matches the melody', mediaHint: 'Play C4 D4 E4', expectedAction: 'Tap ascending arrow', hintOnIdle: 'The notes go up, tap the up arrow', nextStepCondition: 'correctAnswerGiven' },
        { stepId: 4, type: 'match', description: 'Match the melody to its shape name', mediaHint: 'Play E4 D4 C4', expectedAction: 'Select "Descending"', hintOnIdle: 'The notes go down, choose descending', nextStepCondition: 'correctAnswerGiven' },
        { stepId: 5, type: 'solve', description: 'Complete the melody by adding the correct note', mediaHint: 'Play C4 D4 ?', expectedAction: 'Select E4', hintOnIdle: 'The melody is ascending, the next note is E4', nextStepCondition: 'correctAnswerGiven' }
      ];
      break;
    default:
      steps = [
        { stepId: 1, type: 'listen', description: 'Listen to a simple beat pattern', mediaHint: 'Play 4/4 time with quarter notes', expectedAction: 'Press play button', hintOnIdle: 'Tap play to hear the beat', nextStepCondition: 'audioPlayed' },
        { stepId: 2, type: 'listen', description: 'Listen to a rhythm with eighth notes', mediaHint: 'Play quarter and eighth note pattern', expectedAction: 'Press play button', hintOnIdle: 'Tap play to hear the rhythm', nextStepCondition: 'audioPlayed' },
        { stepId: 3, type: 'tap', description: 'Tap the correct fraction for the note length', mediaHint: 'Play a quarter note', expectedAction: 'Click 1/4', hintOnIdle: 'A quarter note is 1/4 of a whole note', nextStepCondition: 'correctAnswerGiven' },
        { stepId: 4, type: 'match', description: 'Match the note to its fraction value', mediaHint: 'Play an eighth note', expectedAction: 'Select 1/8', hintOnIdle: 'An eighth note is 1/8', nextStepCondition: 'correctAnswerGiven' },
        { stepId: 5, type: 'solve', description: 'Add the missing note to complete the measure', mediaHint: 'Play 3 quarter notes in 4/4', expectedAction: 'Select quarter note', hintOnIdle: 'You need one more quarter note to fill the measure', nextStepCondition: 'correctAnswerGiven' }
      ];
  }
  return { steps, timeoutSeconds, completionReward };
}
module.exports = { createOnboardingSandbox };
