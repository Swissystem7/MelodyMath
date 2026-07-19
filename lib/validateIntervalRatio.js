function validateIntervalRatio(numerator, denominator) {
  if (Number.isNaN(numerator) || Number.isNaN(denominator)) return false;
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator)) {
    throw new TypeError();
  }
  if (numerator <= 0 || denominator <= 0 || denominator === 0 || isNaN(numerator) || isNaN(denominator)) {
    return false;
  }
  const gcd = (a, b) => {
    while (b) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  };
  const g = gcd(numerator, denominator);
  const rn = numerator / g;
  const rd = denominator / g;
  const valid = [[1,1],[2,1],[3,2],[4,3],[5,3],[5,4],[6,5],[8,5],[9,8],[16,15]];
  return valid.some(([n, d]) => rn === n && rd === d);
}
module.exports = { validateIntervalRatio };
