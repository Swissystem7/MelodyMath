function nearMiss(family, a, b, rng) {
  const used = new Set();
  const result = [];
  const aOffsets = [-2, -1, 1, 2];
  const bOffsets = [-3, -2, -1, 1, 2, 3];
  while (result.length < 3) {
    const aOff = aOffsets[Math.floor(rng() * aOffsets.length)];
    const bOff = bOffsets[Math.floor(rng() * bOffsets.length)];
    const na = a + aOff;
    const nb = b + bOff;
    if (na === 0) continue;
    const key = na + ',' + nb;
    if (key === a + ',' + b) continue;
    if (used.has(key)) continue;
    used.add(key);
    result.push({ a: na, b: nb });
  }
  return result;
}
module.exports = { nearMiss };