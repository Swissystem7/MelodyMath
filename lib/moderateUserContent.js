function moderateUserContent(text, bannedWords, allowedWords) {
  if (text === null || text === undefined || bannedWords === null || bannedWords === undefined || allowedWords === null || allowedWords === undefined) {
    throw new Error("Invalid input");
  }
  if (typeof text !== "string" || !Array.isArray(bannedWords) || !Array.isArray(allowedWords)) {
    throw new Error("Invalid input types");
  }
  if (bannedWords.some(word => typeof word !== 'string' || word.length === 0) || allowedWords.some(word => typeof word !== 'string')) {
    throw new Error("Invalid word list");
  }
  if (text === "") {
    return { isClean: true, flaggedWords: [], sanitizedText: "" };
  }
  if (bannedWords.length === 0) {
    return { isClean: true, flaggedWords: [], sanitizedText: text };
  }
  const lowerText = text.toLowerCase();
  const allowedSet = new Set(allowedWords.map(w => w.toLowerCase()));
  const flaggedSet = new Set();
  for (const banned of bannedWords) {
    const lowerBanned = banned.toLowerCase();
    if (allowedSet.has(lowerBanned)) continue;
    const regex = new RegExp("\\b" + lowerBanned.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "gi");
    if (regex.test(lowerText)) {
      flaggedSet.add(lowerBanned);
    }
  }
  const flaggedWords = Array.from(flaggedSet);
  let sanitizedText = text;
  for (const word of flaggedWords) {
    const regex = new RegExp("\\b" + word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b", "gi");
    sanitizedText = sanitizedText.replace(regex, "***");
  }
  const isClean = flaggedWords.length === 0;
  return { isClean, flaggedWords, sanitizedText };
}
module.exports = { moderateUserContent };
