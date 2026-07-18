function yToFreq(y, yMin, yMax) {
  if (typeof y !== 'number' || !isFinite(y)) return null;
  if (yMin === yMax) return 440 * Math.pow(2, (66 - 69) / 12);
  var clamped = Math.min(Math.max(y, yMin), yMax);
  var t = (clamped - yMin) / (yMax - yMin);
  var midi = 48 + t * (84 - 48);
  return 440 * Math.pow(2, (midi - 69) / 12);
}
module.exports = { yToFreq: yToFreq };