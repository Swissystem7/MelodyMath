module.exports = {
  nextTempo: function(current, wasCorrect) {
    let next = wasCorrect ? current * 0.96 : current * 1.12;
    if (next < 0.55) next = 0.55;
    if (next > 2.0) next = 2.0;
    return Math.round(next * 1000) / 1000;
  }
};