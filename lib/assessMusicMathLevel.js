function assessMusicMathLevel(responses) {
  if (!responses || responses.length === 0) {
    return { level: 'none', confidence: 0 };
  }
  const validIntervals = ['unison','minor2','major2','minor3','major3','perfect4','tritone','perfect5','minor6','major6','minor7','major7','octave'];
  const correctRatios = {
    'unison':'1:1','minor2':'16:15','major2':'9:8','minor3':'6:5','major3':'5:4','perfect4':'4:3','tritone':'45:32','perfect5':'3:2','minor6':'8:5','major6':'5:3','minor7':'16:9','major7':'15:8','octave':'2:1'
  };
  let correct = 0;
  let attempted = 0;
  for (let i = 0; i < responses.length; i++) {
    const r = responses[i];
    if (typeof r !== 'object' || r === null) continue;
    const interval = r.interval;
    const userRatio = r.userAnswerRatio;
    if (typeof interval !== 'string' || typeof userRatio !== 'string') continue;
    if (!validIntervals.includes(interval)) continue;
    attempted++;
    if (correctRatios[interval] === userRatio) {
      correct++;
    }
  }
  const total = Math.max(attempted, 5);
  const score = correct / total;
  let level = 'none';
  if (score >= 0.8) level = 'fractions';
  else if (score >= 0.5) level = 'ratios';
  else if (score > 0) level = 'intervals';
  return { level: level, confidence: score };
}
module.exports = { assessMusicMathLevel };