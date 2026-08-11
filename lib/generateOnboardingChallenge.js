function generateOnboardingChallenge({ musicFamiliarity, mathConfidence } = {}) {
  const validMusic = ['none', 'some', 'proficient'];
  const validMath = ['low', 'medium', 'high'];
  
  const mf = validMusic.includes(musicFamiliarity) ? musicFamiliarity : 'none';
  const mc = validMath.includes(mathConfidence) ? mathConfidence : 'low';

  const challenges = {
    'none-low': {
      challengeType: 'rhythm-basics',
      parameters: { beats: 4, subdivisions: 2, tempoRange: [60, 80] },
      estimatedTime: 120,
      description: 'Tap along to a simple 4/4 beat with quarter notes only.'
    },
    'none-medium': {
      challengeType: 'rhythm-patterns',
      parameters: { beats: 4, subdivisions: 2, patternComplexity: 1 },
      estimatedTime: 150,
      description: 'Repeat a basic rhythm pattern using quarter and eighth notes.'
    },
    'none-high': {
      challengeType: 'rhythm-variations',
      parameters: { beats: 4, subdivisions: 4, patternComplexity: 2 },
      estimatedTime: 180,
      description: 'Identify and reproduce varied rhythm patterns with syncopation.'
    },
    'some-low': {
      challengeType: 'interval-identification',
      parameters: { intervals: ['minor third', 'major third', 'perfect fifth'], referenceNote: 'C4' },
      estimatedTime: 200,
      description: 'Identify simple melodic intervals played on a piano.'
    },
    'some-medium': {
      challengeType: 'chord-recognition',
      parameters: { chordTypes: ['major', 'minor'], inversions: false },
      estimatedTime: 250,
      description: 'Distinguish between major and minor chords in root position.'
    },
    'some-high': {
      challengeType: 'harmonic-progression',
      parameters: { progressionLength: 4, keys: ['C major', 'G major'], cadenceTypes: ['authentic', 'plagal'] },
      estimatedTime: 300,
      description: 'Identify the harmonic progression and cadence in a short phrase.'
    },
    'proficient-low': {
      challengeType: 'tempo-progression',
      parameters: { bpmRange: [80, 160], stepSize: 10, mathOperations: ['addition', 'subtraction'] },
      estimatedTime: 180,
      description: 'Adjust tempo by solving simple arithmetic problems within a musical context.'
    },
    'proficient-medium': {
      challengeType: 'polyrhythm-construction',
      parameters: { baseRhythm: '4/4', overlayRhythm: '3/4', layers: 2 },
      estimatedTime: 350,
      description: 'Construct a polyrhythm by layering 3/4 over 4/4 using given note values.'
    },
    'proficient-high': {
      challengeType: 'modulation-detection',
      parameters: { startingKey: 'C major', targetKeys: ['G major', 'F major', 'A minor'], pivotChords: true },
      estimatedTime: 400,
      description: 'Detect key modulations and identify pivot chords in a complex passage.'
    }
  };

  const key = `${mf}-${mc}`;
  return challenges[key];
}

module.exports = { generateOnboardingChallenge };