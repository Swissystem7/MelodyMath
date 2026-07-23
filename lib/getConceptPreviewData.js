function getConceptPreviewData({ concept = 'interval-ratio', difficulty = 'easy' } = {}) {
  const conceptMap = {
    'interval-ratio': {
      easy: {
        visualType: 'draggable-intervals',
        data: { baseNote: 'C', intervals: ['1/1', '3/2', '2/1'] },
        prompt: 'Drag the correct ratio for a perfect fifth above C',
        correctAnswer: { ratio: '3/2' }
      },
      medium: {
        visualType: 'draggable-intervals',
        data: { baseNote: 'G', intervals: ['4/3', '3/2', '5/3', '2/1'] },
        prompt: 'Drag the correct ratio for a perfect fourth above G',
        correctAnswer: { ratio: '4/3' }
      },
      hard: {
        visualType: 'draggable-intervals',
        data: { baseNote: 'F#', intervals: ['5/4', '6/5', '9/8', '15/8', '2/1'] },
        prompt: 'Drag the correct ratio for a major third above F#',
        correctAnswer: { ratio: '5/4' }
      }
    },
    'rhythm-fraction': {
      easy: {
        visualType: 'tap-rhythm',
        data: { beats: 4, noteValues: ['1/4', '1/4', '1/4', '1/4'] },
        prompt: 'Tap the rhythm that matches four quarter notes',
        correctAnswer: { pattern: [1, 1, 1, 1] }
      },
      medium: {
        visualType: 'tap-rhythm',
        data: { beats: 4, noteValues: ['1/2', '1/4', '1/4'] },
        prompt: 'Tap the rhythm: half note followed by two quarter notes',
        correctAnswer: { pattern: [2, 1, 1] }
      },
      hard: {
        visualType: 'tap-rhythm',
        data: { beats: 4, noteValues: ['3/8', '1/8', '1/4', '1/4'] },
        prompt: 'Tap the rhythm: dotted quarter, eighth, quarter, quarter',
        correctAnswer: { pattern: [1.5, 0.5, 1, 1] }
      }
    },
    'melody-equation': {
      easy: {
        visualType: 'pitch-equation',
        data: { basePitch: 261.63, intervals: [0, 4, 7] },
        prompt: 'Solve the pitch equation for a C major triad (C=261.63 Hz)',
        correctAnswer: { frequencies: [261.63, 329.63, 392.00] }
      },
      medium: {
        visualType: 'pitch-equation',
        data: { basePitch: 293.66, intervals: [0, 3, 7, 10] },
        prompt: 'Solve the pitch equation for a D minor seventh chord (D=293.66 Hz)',
        correctAnswer: { frequencies: [293.66, 349.23, 440.00, 523.25] }
      },
      hard: {
        visualType: 'pitch-equation',
        data: { basePitch: 261.63, intervals: [0, 2, 4, 7, 11] },
        prompt: 'Solve the pitch equation for a Cmaj9 chord (C=261.63 Hz)',
        correctAnswer: { frequencies: [261.63, 293.66, 329.63, 392.00, 466.16] }
      }
    },
    'tempo-progression': {
      easy: {
        visualType: 'speed-slider',
        data: { initialBPM: 60, targetBPM: 120, steps: 4 },
        prompt: 'Set the slider to show a tempo increase from 60 to 120 BPM over 4 steps',
        correctAnswer: { progression: [60, 75, 90, 105, 120] }
      },
      medium: {
        visualType: 'speed-slider',
        data: { initialBPM: 80, targetBPM: 160, steps: 6 },
        prompt: 'Set the slider to show a tempo increase from 80 to 160 BPM over 6 steps',
        correctAnswer: { progression: [80, 93.33, 106.67, 120, 133.33, 146.67, 160] }
      },
      hard: {
        visualType: 'speed-slider',
        data: { initialBPM: 40, targetBPM: 208, steps: 8 },
        prompt: 'Set the slider to show a tempo increase from 40 to 208 BPM over 8 steps',
        correctAnswer: { progression: [40, 61, 82, 103, 124, 145, 166, 187, 208] }
      }
    }
  };
  const defaultConcept = 'interval-ratio';
  const defaultDifficulty = 'easy';
  const selectedConcept = conceptMap[concept] || conceptMap[defaultConcept];
  const selectedDifficulty = selectedConcept[difficulty] || selectedConcept[defaultDifficulty];
  return selectedDifficulty;
}

module.exports = { getConceptPreviewData };
