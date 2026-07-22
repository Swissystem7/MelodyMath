function generateQuickStartExercise(classProfile) {
  if (!classProfile || typeof classProfile !== 'object') {
    throw new Error("Invalid input: classProfile must be an object");
  }
  const { grade, musicExperience, mathConcept } = classProfile;
  if (!Number.isInteger(grade) || grade < 1 || grade > 12) {
    throw new Error("Invalid grade: must be an integer between 1 and 12");
  }
  const validMusic = ['none', 'some', 'advanced'];
  if (!validMusic.includes(musicExperience)) {
    throw new Error("Invalid musicExperience: must be 'none', 'some', or 'advanced'");
  }
  const validMath = ['fractions', 'ratios', 'patterns', 'proportions'];
  if (!validMath.includes(mathConcept)) {
    throw new Error("Invalid mathConcept: must be 'fractions', 'ratios', 'patterns', or 'proportions'");
  }

  let exerciseTitle, instructions, musicPrompt, correctAnswer, validateFn, hintSequence;

  if (grade < 5 && musicExperience === 'none') {
    if (mathConcept === 'fractions') {
      exerciseTitle = "Quarter Note Fractions";
      instructions = "Play a 4/4 measure with quarter notes. Ask: How many quarter notes fit in one whole note?";
      musicPrompt = "Four quarter notes (C, D, E, F) in 4/4 time, each one beat.";
      correctAnswer = 4;
      validateFn = "userAnswer => userAnswer === 4";
      hintSequence = [
        "A whole note lasts 4 beats.",
        "Each quarter note is 1 beat.",
        "Count the beats: 1, 2, 3, 4."
      ];
    } else if (mathConcept === 'ratios') {
      exerciseTitle = "Simple Note Ratios";
      instructions = "Play two notes: a half note and a quarter note. Ask: What is the ratio of half note beats to quarter note beats?";
      musicPrompt = "A half note (2 beats) followed by a quarter note (1 beat) in 4/4.";
      correctAnswer = "2:1";
      validateFn = "userAnswer => userAnswer === '2:1'";
      hintSequence = [
        "A half note lasts 2 beats.",
        "A quarter note lasts 1 beat.",
        "Compare the beats: 2 to 1."
      ];
    } else if (mathConcept === 'patterns') {
      exerciseTitle = "Note Pattern Repeat";
      instructions = "Play a pattern: quarter, quarter, half. Ask: How many notes are in the pattern?";
      musicPrompt = "Three notes: quarter C, quarter D, half E.";
      correctAnswer = 3;
      validateFn = "userAnswer => userAnswer === 3";
      hintSequence = [
        "Listen to the sequence.",
        "Count each note you hear.",
        "There are three distinct notes."
      ];
    } else {
      exerciseTitle = "Beat Proportions";
      instructions = "Play a whole note and a half note. Ask: How many half notes equal one whole note?";
      musicPrompt = "A whole note (4 beats) then a half note (2 beats).";
      correctAnswer = 2;
      validateFn = "userAnswer => userAnswer === 2";
      hintSequence = [
        "A whole note has 4 beats.",
        "A half note has 2 beats.",
        "Divide 4 by 2."
      ];
    }
  } else if (grade >= 5 && mathConcept === 'fractions' && musicExperience !== 'none') {
    exerciseTitle = "Complex Time Signature Fractions";
    instructions = "Play a measure in 6/8 time with dotted quarter notes. Ask: How many eighth notes are in a dotted quarter?";
    musicPrompt = "A dotted quarter note (3 eighth notes) in 6/8 time, followed by three eighth notes.";
    correctAnswer = 3;
    validateFn = "userAnswer => userAnswer === 3";
    hintSequence = [
      "A dotted quarter note equals 1.5 beats in 4/4, but in 6/8 it's 3 eighth notes.",
      "In 6/8, each beat is a dotted quarter.",
      "Count the eighth notes: 1, 2, 3."
    ];
  } else {
    if (mathConcept === 'fractions') {
      exerciseTitle = "Note Value Fractions";
      instructions = "Play a half note and two quarter notes. Ask: What fraction of a whole note is a half note?";
      musicPrompt = "A half note (2 beats) then two quarter notes (1 beat each) in 4/4.";
      correctAnswer = "1/2";
      validateFn = "userAnswer => userAnswer === '1/2'";
      hintSequence = [
        "A whole note has 4 beats.",
        "A half note has 2 beats.",
        "2 out of 4 is 1/2."
      ];
    } else if (mathConcept === 'ratios') {
      exerciseTitle = "Beat Ratios";
      instructions = "Play a whole note and a quarter note. Ask: What is the ratio of whole note beats to quarter note beats?";
      musicPrompt = "A whole note (4 beats) then a quarter note (1 beat).";
      correctAnswer = "4:1";
      validateFn = "userAnswer => userAnswer === '4:1'";
      hintSequence = [
        "A whole note lasts 4 beats.",
        "A quarter note lasts 1 beat.",
        "Compare: 4 to 1."
      ];
    } else if (mathConcept === 'patterns') {
      exerciseTitle = "Rhythm Pattern Length";
      instructions = "Play a pattern: quarter, eighth, eighth, half. Ask: How many beats does the pattern last?";
      musicPrompt = "Four notes: quarter C, eighth D, eighth E, half F in 4/4.";
      correctAnswer = 3;
      validateFn = "userAnswer => userAnswer === 3";
      hintSequence = [
        "Quarter note = 1 beat, eighth note = 0.5 beat, half note = 2 beats.",
        "Add the beats: 1 + 0.5 + 0.5 + 2.",
        "Total is 3 beats."
      ];
    } else {
      exerciseTitle = "Proportion of Notes";
      instructions = "Play a measure with 3 quarter notes and 1 quarter rest. Ask: What proportion of the measure has sound?";
      musicPrompt = "Three quarter notes (C, D, E) and one quarter rest in 4/4.";
      correctAnswer = "3/4";
      validateFn = "userAnswer => userAnswer === '3/4'";
      hintSequence = [
        "The measure has 4 beats total.",
        "Three beats have sound.",
        "So 3 out of 4 beats."
      ];
    }
  }

  return {
    exerciseTitle,
    instructions,
    musicPrompt,
    correctAnswer,
    validateFn,
    hintSequence
  };
}

module.exports = { generateQuickStartExercise };