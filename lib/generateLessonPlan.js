function generateLessonPlan(musicKey, mathTopic, difficulty, numExercises) {
  const validKeys = [
    'C major', 'C# major', 'Db major', 'D major', 'Eb major', 'E major', 'F major',
    'F# major', 'Gb major', 'G major', 'Ab major', 'A major', 'Bb major', 'B major',
    'C minor', 'C# minor', 'D minor', 'Eb minor', 'E minor', 'F minor', 'F# minor',
    'G minor', 'G# minor', 'A minor', 'Bb minor', 'B minor'
  ];
  const validTopics = ['interval-ratios', 'rhythm-fractions', 'melody-equations', 'tempo-progressions'];
  if (!validKeys.includes(musicKey)) throw new Error('Invalid music key');
  if (!validTopics.includes(mathTopic)) throw new Error('Unsupported math topic');
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) throw new Error('Difficulty must be 1-5');
  if (!Number.isInteger(numExercises) || numExercises <= 0) throw new Error('numExercises must be positive');

  const intervalRatios = {
    'minor second': 16/15, 'major second': 9/8, 'minor third': 6/5, 'major third': 5/4,
    'perfect fourth': 4/3, 'tritone': 45/32, 'perfect fifth': 3/2, 'minor sixth': 8/5,
    'major sixth': 5/3, 'minor seventh': 9/5, 'major seventh': 15/8, 'octave': 2/1
  };
  const intervalNames = Object.keys(intervalRatios);
  const noteNames = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const keyToRoot = ({Db:'C#',Gb:'F#','G#':'Ab'}[musicKey.split(' ')[0]] || musicKey.split(' ')[0]);
  const rootIndex = noteNames.indexOf(keyToRoot);
  const scaleNotes = [];
  const intervals = [0, 2, 4, 5, 7, 9, 11];
  for (let i = 0; i < 7; i++) {
    scaleNotes.push(noteNames[(rootIndex + intervals[i]) % 12]);
  }

  const templates = {
    'interval-ratios': {
      generate: () => {
        const i1 = intervalNames[Math.floor(Math.random() * intervalNames.length)];
        let i2 = intervalNames[Math.floor(Math.random() * intervalNames.length)];
        while (i2 === i1) i2 = intervalNames[Math.floor(Math.random() * intervalNames.length)];
        const ratio1 = intervalRatios[i1];
        const ratio2 = intervalRatios[i2];
        const result = ratio1 > ratio2 ? ratio1 / ratio2 : ratio2 / ratio1;
        const rootNote = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
        return {
          type: 'interval-ratios',
          description: `Find the ratio between the intervals of a ${i1} and a ${i2}`,
          parameters: { rootNote, interval1: i1, interval2: i2, expectedRatio: Math.round(result * 100) / 100 }
        };
      }
    },
    'rhythm-fractions': {
      generate: () => {
        const noteValues = ['whole', 'half', 'quarter', 'eighth', 'sixteenth'];
        const fractions = [1, 1/2, 1/4, 1/8, 1/16];
        const idx1 = Math.floor(Math.random() * noteValues.length);
        let idx2 = Math.floor(Math.random() * noteValues.length);
        while (idx2 === idx1) idx2 = Math.floor(Math.random() * noteValues.length);
        const sum = fractions[idx1] + fractions[idx2];
        const bpm = 60 + difficulty * 20;
        return {
          type: 'rhythm-fractions',
          description: `Add the durations of a ${noteValues[idx1]} note and a ${noteValues[idx2]} note in 4/4 time`,
          parameters: { note1: noteValues[idx1], note2: noteValues[idx2], expectedSum: sum, bpm }
        };
      }
    },
    'melody-equations': {
      generate: () => {
        const startNote = scaleNotes[Math.floor(Math.random() * scaleNotes.length)];
        const startIdx = noteNames.indexOf(startNote);
        const step = Math.floor(Math.random() * 5) + 1;
        const direction = Math.random() > 0.5 ? 1 : -1;
        const endIdx = (startIdx + step * direction + 12) % 12;
        const endNote = noteNames[endIdx];
        return {
          type: 'melody-equations',
          description: `If the melody starts on ${startNote} and moves ${direction > 0 ? 'up' : 'down'} by ${step} semitones, what is the resulting note?`,
          parameters: { startNote, step, direction: direction > 0 ? 'up' : 'down', expectedNote: endNote }
        };
      }
    },
    'tempo-progressions': {
      generate: () => {
        const startBpm = 60 + Math.floor(Math.random() * 60);
        const multiplier = [1.5, 2, 0.75, 0.5][Math.floor(Math.random() * 4)];
        const newBpm = Math.round(startBpm * multiplier);
        return {
          type: 'tempo-progressions',
          description: `If the tempo changes from ${startBpm} BPM by a factor of ${multiplier}, what is the new tempo?`,
          parameters: { startBpm, multiplier, expectedBpm: newBpm }
        };
      }
    }
  };

  const usedParams = new Set();
  const exercises = [];
  let attempts = 0;
  while (exercises.length < numExercises && attempts < numExercises * 10) {
    attempts++;
    const exercise = templates[mathTopic].generate();
    const paramKey = JSON.stringify(exercise.parameters);
    if (!usedParams.has(paramKey)) {
      usedParams.add(paramKey);
      exercises.push(exercise);
    }
  }
  if (exercises.length < numExercises) {
    throw new Error('Could not generate enough unique exercises');
  }
  return exercises;
}

module.exports = { generateLessonPlan };
