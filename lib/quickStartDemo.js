function quickStartDemo(songNotes, concept) {
  if (!Array.isArray(songNotes) || songNotes.length < 2) {
    return { error: 'Need at least 2 notes' };
  }
  if (songNotes.some(note => !Number.isInteger(note) || note < 0 || note > 127)) {
    return { error: 'MIDI notes must be integers from 0 to 127' };
  }
  const validConcepts = ['interval', 'fraction', 'equation', 'tempo'];
  const normalizedConcept = typeof concept === 'string' ? concept.toLowerCase() : 'interval';
  const finalConcept = validConcepts.includes(normalizedConcept) ? normalizedConcept : 'interval';
  const noteA = songNotes[0];
  const noteB = songNotes[1];
  const freqA = 440 * Math.pow(2, (noteA - 69) / 12);
  const freqB = 440 * Math.pow(2, (noteB - 69) / 12);
  const ratio = freqB / freqA;
  let bestNumerator = 1, bestDenominator = 1, bestError = Infinity;
  for (let denominator = 1; denominator <= 16; denominator++) {
    const numerator = Math.max(1, Math.round(ratio * denominator));
    const error = Math.abs(ratio - numerator / denominator);
    if (error < bestError) {
      bestNumerator = numerator;
      bestDenominator = denominator;
      bestError = error;
    }
  }
  const correctRatio = `${bestNumerator}/${bestDenominator}`;
  const descriptions = {
    interval: `In this demo, you'll hear the first two notes of your song and learn how their frequency ratio creates a musical interval.`,
    fraction: `In this demo, you'll use the first two notes to explore fractions in music.`,
    equation: `In this demo, you'll use the first two notes to build a musical equation.`,
    tempo: `In this demo, you'll use the first two notes to explore tempo changes.`
  };
  const questions = {
    interval: { noteA, noteB, correctRatio },
    fraction: { noteA, noteB, fraction: correctRatio },
    equation: { noteA, noteB, semitoneDifference: noteB - noteA },
    tempo: { noteA, noteB, intervalSemitones: Math.abs(noteB - noteA) }
  };
  const description = descriptions[finalConcept];
  const initialQuestion = questions[finalConcept];
  return { description, initialQuestion };
}
module.exports = { quickStartDemo };
