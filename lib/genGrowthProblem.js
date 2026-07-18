const genGrowthProblem = (rng) => {
  const a0Values = [];
  for (let v = 100; v <= 1000; v += 50) a0Values.push(v);
  const qValues = [1.05, 1.1, 1.2, 1.25, 1.5, 2, 0.9, 0.8, 0.5];
  const nValues = [2, 3, 4, 5, 6, 7, 8];
  const a0 = a0Values[Math.floor(rng() * a0Values.length)];
  const q = qValues[Math.floor(rng() * qValues.length)];
  const n = nValues[Math.floor(rng() * nValues.length)];
  const answer = Math.round(a0 * Math.pow(q, n) * 100) / 100;
  const type = q > 1 ? 'growth' : 'decay';
  return { a0, q, n, answer, type };
};

module.exports = { genGrowthProblem };