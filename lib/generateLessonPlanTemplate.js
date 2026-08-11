function generateLessonPlanTemplate({ grade, mathStandard } = {}) {
  if (!Number.isInteger(grade) || grade < 1 || grade > 12) throw new RangeError("Grade must be between 1 and 12");
  const standard = (typeof mathStandard === 'string' && mathStandard.trim()) || "3.NF.A.1";
  const mapping = {
    "1.OA.A.1": {
      title: "Adding with MelodyMath",
      objectives: ["Solve addition word problems within 20", "Use MelodyMath to represent addition"],
      activities: [
        { name: "Melody Addition", description: "Students use MelodyMath to add numbers by creating musical patterns", melonymathModule: "AdditionRhythm" },
        { name: "Word Problem Jam", description: "Solve addition word problems and compose a short melody", melonymathModule: "WordProblemComposer" }
      ],
      assessment: "Students complete 5 addition word problems using MelodyMath and explain their process"
    },
    "3.NF.A.1": {
      title: "Fraction Foundations with MelodyMath",
      objectives: ["Understand fractions as parts of a whole", "Identify numerator and denominator using musical beats"],
      activities: [
        { name: "Beat Fractions", description: "Divide a musical measure into equal parts to represent fractions", melonymathModule: "BeatFractionExplorer" },
        { name: "Fraction Melody", description: "Create a melody where each note represents a fraction of the whole", melonymathModule: "FractionComposer" }
      ],
      assessment: "Students correctly identify and create fractions using MelodyMath beats for 3 different fractions"
    },
    "5.NBT.B.5": {
      title: "Multiplication Melodies",
      objectives: ["Multiply multi-digit numbers using MelodyMath patterns", "Apply multiplication to real-world scenarios"],
      activities: [
        { name: "Rhythm Multiplication", description: "Use MelodyMath rhythmic patterns to multiply numbers", melonymathModule: "MultiplicationRhythm" },
        { name: "MelodyMath Products", description: "Solve multiplication problems and compose a melody based on products", melonymathModule: "ProductComposer" }
      ],
      assessment: "Students solve 3 multi-digit multiplication problems and create a MelodyMath representation"
    },
    "7.RP.A.3": {
      title: "Proportional Reasoning with MelodyMath",
      objectives: ["Solve percent problems using proportional relationships", "Represent proportions with MelodyMath intervals"],
      activities: [
        { name: "Percent Intervals", description: "Use MelodyMath intervals to represent percentages of a whole", melonymathModule: "PercentIntervalExplorer" },
        { name: "Proportion Composition", description: "Create a melody that demonstrates proportional relationships", melonymathModule: "ProportionComposer" }
      ],
      assessment: "Students solve 3 percent problems and explain the proportional relationship using MelodyMath"
    },
    "9-12.F.IF.4": {
      title: "Function Patterns in MelodyMath",
      objectives: ["Identify key features of functions using MelodyMath", "Model real-world situations with functions"],
      activities: [
        { name: "Function Melody", description: "Graph a function and translate it into a MelodyMath melody", melonymathModule: "FunctionGraphComposer" },
        { name: "Pattern Recognition", description: "Use MelodyMath to identify increasing/decreasing intervals", melonymathModule: "PatternAnalyzer" }
      ],
      assessment: "Students analyze a given function and create a MelodyMath representation showing its key features"
    }
  };
  const standardGrades = {
    "1.OA.A.1": [1, 1],
    "3.NF.A.1": [3, 3],
    "5.NBT.B.5": [5, 5],
    "7.RP.A.3": [7, 7],
    "9-12.F.IF.4": [9, 12]
  };
  const range = standardGrades[standard];
  const key = range && grade >= range[0] && grade <= range[1] ? standard : undefined;
  const data = mapping[key] || {
    title: `Fractions for Grade ${grade}`,
    objectives: ["Understand basic fraction concepts", "Use MelodyMath to explore fractions"],
    activities: [
      { name: "Fraction Beats", description: "Explore fractions by dividing musical beats", melonymathModule: "BeatFractionExplorer" },
      { name: "MelodyMath Fractions", description: "Create melodies that represent fractions", melonymathModule: "FractionComposer" }
    ],
    assessment: "Students demonstrate understanding of fractions by creating a MelodyMath composition"
  };
  return {
    lessonTitle: data.title,
    objectives: data.objectives,
    activities: data.activities,
    assessment: data.assessment
  };
}
module.exports = { generateLessonPlanTemplate };
