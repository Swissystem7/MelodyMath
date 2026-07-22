function buildChallengeLink(config) {
  if (!config || typeof config !== 'object' || Array.isArray(config)) throw new Error('Config missing');
  const { type, difficulty, seed } = config;
  if (!['interval', 'rhythm', 'melody', 'tempo'].includes(type)) throw new Error('Invalid type');
  if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) throw new Error('Difficulty out of range');
  if (seed !== undefined && !Number.isFinite(seed)) throw new Error('Invalid seed');
  const data = { type, difficulty, seed: seed === undefined ? 0 : seed };
  return 'melodymath://challenge?data=' + Buffer.from(JSON.stringify(data), 'utf8').toString('base64');
}

function parseChallengeLink(url) {
  try {
    if (typeof url !== 'string') return null;
    const match = url.match(/^melodymath:\/\/challenge\?data=(.+)$/);
    if (!match) return null;
    if (!/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(match[1])) return null;
    const decoded = Buffer.from(match[1], 'base64').toString('utf8');
    const config = JSON.parse(decoded);
    if (!config || typeof config !== 'object' || Array.isArray(config)) return null;
    const { type, difficulty, seed } = config;
    if (!['interval', 'rhythm', 'melody', 'tempo'].includes(type)) return null;
    if (!Number.isInteger(difficulty) || difficulty < 1 || difficulty > 5) return null;
    if (seed !== undefined && !Number.isFinite(seed)) return null;
    return { type, difficulty, seed: seed === undefined ? 0 : seed };
  } catch {
    return null;
  }
}

module.exports = { buildChallengeLink, parseChallengeLink };
