function analyzeClassPerformance(studentResults) {
  if (!Array.isArray(studentResults) || studentResults.length === 0) {
    throw new Error('No student data provided');
  }

  const studentMap = new Map();
  const moduleScores = new Map();

  for (const entry of studentResults) {
    const { studentId, module, score, timestamp } = entry;
    if (typeof studentId !== 'string' || !studentId || !Number.isFinite(score) || score < 0 || score > 100) throw new Error('Invalid student result');

    if (!studentMap.has(studentId)) {
      studentMap.set(studentId, { totalScore: 0, count: 0, moduleScores: new Map() });
    }
    const student = studentMap.get(studentId);
    student.totalScore += score;
    student.count += 1;

    if (module && typeof module === 'string') {
      if (!student.moduleScores.has(module)) {
        student.moduleScores.set(module, { total: 0, count: 0 });
      }
      const modData = student.moduleScores.get(module);
      modData.total += score;
      modData.count += 1;
    }
  }

  const totalStudents = studentMap.size;
  let classTotalScore = 0;
  let classTotalCount = 0;
  const studentAverages = [];

  for (const [studentId, data] of studentMap) {
    const avgScore = data.totalScore / data.count;
    classTotalScore += data.totalScore;
    classTotalCount += data.count;

    let lowestModule = null;
    let lowestAvg = Infinity;
    for (const [mod, modData] of data.moduleScores) {
      const modAvg = modData.total / modData.count;
      if (modAvg < lowestAvg) {
        lowestAvg = modAvg;
        lowestModule = mod;
      }
    }

    studentAverages.push({
      studentId,
      avgScore: Math.round(avgScore * 100) / 100,
      lowestModule: lowestModule
    });
  }

  const classAvg = classTotalCount > 0 ? Math.round((classTotalScore / classTotalCount) * 100) / 100 : 0;

  studentAverages.sort((a, b) => b.avgScore - a.avgScore);

  const topPerformers = [];
  for (let i = 0; i < studentAverages.length && topPerformers.length < 5; i++) {
    topPerformers.push({ studentId: studentAverages[i].studentId, avgScore: studentAverages[i].avgScore });
  }

  const strugglingStudents = studentAverages
    .filter(s => s.avgScore < 60)
    .map(s => ({
      studentId: s.studentId,
      avgScore: s.avgScore,
      suggestedModule: s.lowestModule || 'unknown'
    }));

  return {
    classAvg,
    topPerformers,
    strugglingStudents,
    totalStudents
  };
}

module.exports = { analyzeClassPerformance };
