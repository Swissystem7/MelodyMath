function syncProgress(userId, progressData) {
  if (typeof userId !== 'string' || !userId.trim()) throw new Error('Invalid userId');
  if (progressData != null && (typeof progressData !== 'object' || Array.isArray(progressData))) throw new Error('Invalid progressData');
  const store = globalThis.__progressStore || (globalThis.__progressStore = Object.create(null));
  const now = new Date().toISOString();
  if (!store[userId]) {
    if (!progressData || Object.keys(progressData).length === 0) {
      store[userId] = { completedModules: [], scores: {}, lastActive: now };
    } else {
      store[userId] = {
        completedModules: validateModules(progressData.completedModules),
        scores: validateScores(progressData.scores),
        lastActive: validateDate(progressData.lastActive, now)
      };
    }
    return {
      success: true,
      mergedProgress: { ...store[userId] },
      lastSynced: now
    };
  }
  const existing = store[userId];
  if (!progressData || Object.keys(progressData).length === 0) {
    store[userId] = { completedModules: [], scores: {}, lastActive: now };
    return {
      success: true,
      mergedProgress: { ...store[userId] },
      lastSynced: now
    };
  }
  const incomingLastActive = validateDate(progressData.lastActive, existing.lastActive);
  if (Date.parse(incomingLastActive) < Date.parse(existing.lastActive)) {
    return {
      success: false,
      mergedProgress: { ...existing },
      lastSynced: now
    };
  }
  const mergedCompleted = [...new Set([...existing.completedModules, ...validateModules(progressData.completedModules)])];
  const mergedScores = { ...existing.scores, ...validateScores(progressData.scores) };
  const mergedLastActive = Date.parse(incomingLastActive) > Date.parse(existing.lastActive) ? incomingLastActive : existing.lastActive;
  store[userId] = { completedModules: mergedCompleted, scores: mergedScores, lastActive: mergedLastActive };
  return {
    success: true,
    mergedProgress: { ...store[userId] },
    lastSynced: now
  };
}
function validateModules(value) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.some(id => typeof id !== 'string')) throw new Error('Invalid completedModules');
  return [...value];
}
function validateScores(value) {
  if (value === undefined) return {};
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.values(value).some(v => !Number.isFinite(v))) throw new Error('Invalid scores');
  return { ...value };
}
function validateDate(value, fallback) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !Number.isFinite(Date.parse(value))) throw new Error('Invalid lastActive');
  return new Date(value).toISOString();
}
module.exports = { syncProgress };
