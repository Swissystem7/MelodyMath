function moderateMathLyrics(lyrics, options) {
  if (typeof lyrics !== 'string') throw new TypeError('lyrics must be a string');
  if (!lyrics.trim()) {
    return { safe: true, reason: 'Empty', flaggedWords: [] };
  }
  if (!options || !Array.isArray(options.blacklist) || !Array.isArray(options.allowlist)) throw new TypeError('Invalid options');
  const { blacklist, allowlist, threshold = 1 } = options;
  if (!Number.isInteger(threshold) || threshold < 1 || !blacklist.every(w=>typeof w==='string') || !allowlist.every(w=>typeof w==='string')) throw new TypeError('Invalid moderation options');
  const normalizedLyrics = lyrics.normalize('NFC');
  const lowerLyrics = normalizedLyrics.toLowerCase();
  const lowerAllowlist = allowlist.map(w => w.normalize('NFC').toLowerCase());
  const flaggedWords = [];
  for (const word of blacklist) {
    const normalizedWord = word.normalize('NFC');
    const lowerWord = normalizedWord.toLowerCase();
    if (lowerAllowlist.includes(lowerWord)) continue;
    if (!lowerWord) continue;
    const escaped = lowerWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, 'giu');
    let match;
    while ((match = regex.exec(lowerLyrics)) !== null) {
      const matched = normalizedLyrics.slice(match.index, match.index + match[0].length);
      if (!flaggedWords.includes(matched)) {
        flaggedWords.push(matched);
      }
    }
  }
  const safe = flaggedWords.length < threshold;
  const reason = safe ? 'Clean' : 'Contains profanity';
  return { safe, reason, flaggedWords };
}
module.exports = { moderateMathLyrics };
