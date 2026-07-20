function generateExerciseFromMelody(melody, concept) {
  if (!Array.isArray(melody) || melody.length < 2) {
    throw new Error("Melody must have at least 2 notes");
  }
  const validConcepts = ['interval-ratio', 'rhythm-fraction', 'melody-equation', 'tempo-progression'];
  if (!validConcepts.includes(concept)) {
    throw new Error("Concept not recognized");
  }
  for (const note of melody) {
    const value = note && (note.frequency !== undefined ? note.frequency : note.midi);
    if (!Number.isFinite(value) || value <= 0) {
      throw new Error("Frequencies must be positive");
    }
  }

  const frequencyOf = note => note.frequency !== undefined
    ? note.frequency
    : 440 * Math.pow(2, (note.midi - 69) / 12);

  if (concept === 'interval-ratio') {
    const f1 = frequencyOf(melody[0]);
    const f2 = frequencyOf(melody[1]);
    const ratio = f1 / f2;
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const num = Math.round(f1);
    const den = Math.round(f2);
    const g = gcd(num, den);
    const simplifiedNum = num / g;
    const simplifiedDen = den / g;
    return {
      question: `What is the simplified frequency ratio between the first two notes (${f1.toFixed(2)} Hz and ${f2.toFixed(2)} Hz)?`,
      answer: `${simplifiedNum}/${simplifiedDen}`,
      hint: `Divide both frequencies by their greatest common divisor (${g})`
    };
  }

  if (concept === 'rhythm-fraction') {
    const totalNotes = melody.length;
    const firstNoteDuration = 1;
    const totalDuration = totalNotes;
    const fraction = `${firstNoteDuration}/${totalDuration}`;
    return {
      question: `If all notes are quarter notes, what fraction of the total duration is the first note?`,
      answer: fraction,
      hint: `There are ${totalNotes} notes, each 1 beat, total ${totalDuration} beats`
    };
  }

  if (concept === 'melody-equation') {
    const f1 = frequencyOf(melody[0]);
    const f2 = frequencyOf(melody[1]);
    const slope = (f2 - f1) / 1;
    return {
      question: `Assuming linear frequency progression, what is the slope between the first two notes (${f1.toFixed(2)} Hz to ${f2.toFixed(2)} Hz)?`,
      answer: parseFloat(slope.toFixed(4)),
      hint: `Slope = (f2 - f1) / (index difference) = (${f2.toFixed(2)} - ${f1.toFixed(2)}) / 1`
    };
  }

  if (concept === 'tempo-progression') {
    const f1 = frequencyOf(melody[0]);
    const f2 = frequencyOf(melody[1]);
    const ratio = f2 / f1;
    const gcd = (a, b) => b === 0 ? a : gcd(b, a % b);
    const num = Math.round(f2);
    const den = Math.round(f1);
    const g = gcd(num, den);
    const simplifiedNum = num / g;
    const simplifiedDen = den / g;
    return {
      question: `What is the tempo ratio between the first two notes (${f1.toFixed(2)} Hz to ${f2.toFixed(2)} Hz)?`,
      answer: `${simplifiedNum}/${simplifiedDen}`,
      hint: `Divide the second frequency by the first and simplify: ${f2.toFixed(2)} / ${f1.toFixed(2)}`
    };
  }
}

module.exports = { generateExerciseFromMelody };
