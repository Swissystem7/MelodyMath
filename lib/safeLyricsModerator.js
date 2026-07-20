function levenshtein(a, b) {
  const previous = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diagonal = previous[0];
    previous[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const above = previous[j];
      previous[j] = Math.min(previous[j] + 1, previous[j - 1] + 1, diagonal + (a[i - 1] === b[j - 1] ? 0 : 1));
      diagonal = above;
    }
  }
  return previous[b.length];
}

function safeLyricsModerator(text, blacklist) {
  if (typeof text !== 'string') throw new TypeError('text must be a string');
  if (!Array.isArray(blacklist)) throw new TypeError('blacklist must be an array');
  if (!text) return { isClean: true, flaggedWords: [] };
  const words = text.toLowerCase().match(/[\p{L}\p{N}']+/gu) || [];
  const flaggedWords = [];
  for (const original of blacklist) {
    if (typeof original !== 'string' || !original) continue;
    const bannedWords = original.toLowerCase().match(/[\p{L}\p{N}']+/gu) || [];
    if (!bannedWords.length || bannedWords.length > words.length) continue;
    for (let i = 0; i <= words.length - bannedWords.length; i++) {
      if (levenshtein(words.slice(i, i + bannedWords.length).join(' '), bannedWords.join(' ')) <= 1) {
        flaggedWords.push(original);
        break;
      }
    }
  }
  return { isClean: flaggedWords.length === 0, flaggedWords };
}

module.exports = { safeLyricsModerator };
