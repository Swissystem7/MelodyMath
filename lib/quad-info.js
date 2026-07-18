function quadInfo(a, b, c) {
  if (a === 0) {
    if (b === 0) {
      return { disc: 0, rootCount: 0, roots: [] };
    }
    return { disc: 0, rootCount: 1, roots: [Math.round(-c / b * 10000) / 10000] };
  }
  const disc = b * b - 4 * a * c;
  if (disc < 0) {
    return { disc: disc, rootCount: 0, roots: [] };
  }
  if (disc === 0) {
    const root = Math.round(-b / (2 * a) * 10000) / 10000;
    return { disc: disc, rootCount: 1, roots: [root] };
  }
  const sqrtDisc = Math.sqrt(disc);
  const root1 = Math.round((-b - sqrtDisc) / (2 * a) * 10000) / 10000;
  const root2 = Math.round((-b + sqrtDisc) / (2 * a) * 10000) / 10000;
  const roots = root1 < root2 ? [root1, root2] : [root2, root1];
  return { disc: disc, rootCount: 2, roots: roots };
}
module.exports = { quadInfo };