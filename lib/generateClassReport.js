function generateClassReport(classId, dateRange) {
  const classes = {
    "class-1": {
      students: [
        { id: "s1", name: "Alice" },
        { id: "s2", name: "Bob" },
        { id: "s3", name: "Charlie" }
      ],
      submissions: [
        { studentId: "s1", accuracy: 0.85, time: 120, date: "2025-01-15" },
        { studentId: "s2", accuracy: 0.72, time: 150, date: "2025-01-16" },
        { studentId: "s3", accuracy: 0.91, time: 90, date: "2025-01-17" },
        { studentId: "s1", accuracy: 0.88, time: 110, date: "2025-01-18" },
        { studentId: "s2", accuracy: 0.65, time: 180, date: "2025-01-19" },
        { studentId: "s3", accuracy: 0.95, time: 85, date: "2025-01-20" }
      ]
    }
  };

  if (!classId || typeof classId !== "string" || !classes[classId]) {
    throw new Error("Class not found");
  }

  if (!dateRange || typeof dateRange.start !== "string" || typeof dateRange.end !== "string" || isNaN(Date.parse(dateRange.start)) || isNaN(Date.parse(dateRange.end))) {
    throw new Error("Invalid date range");
  }

  const startDate = new Date(dateRange.start);
  const endDate = new Date(dateRange.end);

  if (startDate > endDate) {
    throw new Error("Invalid date range");
  }

  const classData = classes[classId];
  const filteredSubmissions = classData.submissions.filter(sub => {
    const subDate = new Date(sub.date);
    return subDate >= startDate && subDate <= endDate;
  });

  if (filteredSubmissions.length === 0) {
    const placeholderHTML = `<html><body style="font-family:Arial;text-align:center;padding:40px;"><h2>No Data Available</h2><p>No submissions found for the selected date range.</p></body></html>`;
    return {
      reportHTML: placeholderHTML,
      summary: { avgAccuracy: 0, avgTime: 0, topStudents: [], strugglingStudents: [] }
    };
  }

  const studentStats = {};
  classData.students.forEach(s => {
    studentStats[s.id] = { name: s.name, accuracies: [], times: [] };
  });

  filteredSubmissions.forEach(sub => {
    if (studentStats[sub.studentId]) {
      studentStats[sub.studentId].accuracies.push(sub.accuracy);
      studentStats[sub.studentId].times.push(sub.time);
    }
  });

  const studentAverages = Object.entries(studentStats).filter(([, stats]) => stats.accuracies.length > 0).map(([id, stats]) => {
    const avgAcc = stats.accuracies.length > 0 ? stats.accuracies.reduce((a, b) => a + b, 0) / stats.accuracies.length : 0;
    const avgTime = stats.times.length > 0 ? stats.times.reduce((a, b) => a + b, 0) / stats.times.length : 0;
    return { id, name: stats.name, avgAcc, avgTime };
  });

  const overallAvgAccuracy = studentAverages.reduce((sum, s) => sum + s.avgAcc, 0) / studentAverages.length;
  const overallAvgTime = studentAverages.reduce((sum, s) => sum + s.avgTime, 0) / studentAverages.length;

  const sortedByAcc = [...studentAverages].sort((a, b) => b.avgAcc - a.avgAcc);
  const topStudents = sortedByAcc.slice(0, 2).map(s => s.name);
  const strugglingStudents = sortedByAcc.slice(-2).reverse().map(s => s.name);

  const barWidth = 40;
  const chartHeight = 200;
  const maxAcc = Math.max(...studentAverages.map(s => s.avgAcc), 0.01);
  const svgWidth = studentAverages.length * (barWidth + 20) + 40;

  let bars = "";
  studentAverages.forEach((s, i) => {
    const barHeight = (s.avgAcc / maxAcc) * (chartHeight - 20);
    const x = 20 + i * (barWidth + 20);
    const y = chartHeight - barHeight - 10;
    bars += `<rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" fill="#4CAF50" rx="4" />`;
    bars += `<text x="${x + barWidth / 2}" y="${chartHeight - 5}" text-anchor="middle" font-size="10" fill="#333">${s.name}</text>`;
    bars += `<text x="${x + barWidth / 2}" y="${y - 5}" text-anchor="middle" font-size="10" fill="#333">${(s.avgAcc * 100).toFixed(1)}%</text>`;
  });

  const reportHTML = `<html>
<head><style>
body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
h1 { color: #2c3e50; }
.summary { display: flex; gap: 20px; margin: 20px 0; }
.card { background: #f8f9fa; border-radius: 8px; padding: 15px; flex: 1; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.card h3 { margin: 0 0 5px; font-size: 14px; color: #7f8c8d; }
.card .value { font-size: 24px; font-weight: bold; color: #2c3e50; }
.chart-container { margin: 20px 0; }
.student-lists { display: flex; gap: 20px; margin: 20px 0; }
.list-card { background: #f8f9fa; border-radius: 8px; padding: 15px; flex: 1; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
.list-card h3 { margin: 0 0 10px; font-size: 14px; }
.list-card ul { margin: 0; padding-left: 20px; }
.list-card li { margin: 5px 0; }
.top { border-left: 4px solid #27ae60; }
.struggling { border-left: 4px solid #e74c3c; }
</style></head>
<body>
<h1>Class Report: ${classId}</h1>
<div class="summary">
  <div class="card"><h3>Average Accuracy</h3><div class="value">${(overallAvgAccuracy * 100).toFixed(1)}%</div></div>
  <div class="card"><h3>Average Time</h3><div class="value">${overallAvgTime.toFixed(0)}s</div></div>
</div>
<div class="chart-container">
  <h3>Accuracy by Student</h3>
  <svg width="${svgWidth}" height="${chartHeight + 30}" xmlns="http://www.w3.org/2000/svg">
    ${bars}
  </svg>
</div>
<div class="student-lists">
  <div class="list-card top"><h3>Top Students</h3><ul>${topStudents.map(n => `<li>${n}</li>`).join("")}</ul></div>
  <div class="list-card struggling"><h3>Struggling Students</h3><ul>${strugglingStudents.map(n => `<li>${n}</li>`).join("")}</ul></div>
</div>
</body></html>`;

  return {
    reportHTML,
    summary: {
      avgAccuracy: overallAvgAccuracy,
      avgTime: overallAvgTime,
      topStudents,
      strugglingStudents
    }
  };
}

module.exports = { generateClassReport };
