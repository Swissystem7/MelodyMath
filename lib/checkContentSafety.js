function checkContentSafety(text) {
  if (typeof text !== 'string') {
    throw new TypeError('Input must be a string');
  }
  const blockedWords = [
    'ass', 'bastard', 'bitch', 'damn', 'fuck', 'shit', 'cunt', 'dick', 'piss', 'slut',
    'whore', 'cock', 'douche', 'fag', 'nigger', 'nigga', 'bollocks', 'arse', 'prick', 'wanker',
    'motherfucker', 'goddamn', 'hell', 'crap', 'darn'
  ];
  if (text.length === 0) {
    return { safe: true, flaggedTerms: [] };
  }
  const cleaned = text.replace(/[^\w\s']/gu, ' ').replace(/\s+/g, ' ').trim();
  const words = cleaned.toLowerCase().split(/\s+/);
  const flaggedTerms = [];
  for (const word of words) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    for (const blocked of blockedWords) {
      const regex = new RegExp('\\b' + blocked.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i');
      if (regex.test(word) && !flaggedTerms.includes(blocked)) {
        flaggedTerms.push(blocked);
      }
    }
  }
  return { safe: flaggedTerms.length === 0, flaggedTerms };
}
module.exports = { checkContentSafety };