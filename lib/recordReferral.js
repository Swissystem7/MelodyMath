const referrals = new Map();
const points = new Map();

function recordReferral(referrerId, newUserId) {
  if (typeof referrerId !== 'string' || referrerId.trim() === '' ||
      typeof newUserId !== 'string' || newUserId.trim() === '') {
    throw new Error("Empty id");
  }
  let referredUsers = referrals.get(referrerId);
  if (!referredUsers) {
    referredUsers = new Set();
    referrals.set(referrerId, referredUsers);
  }
  if (referredUsers.has(newUserId)) return;
  referredUsers.add(newUserId);
  const current = points.get(referrerId) || { count: 0, pts: 0 };
  current.count += 1;
  current.pts += 10;
  points.set(referrerId, current);
}

function getLeaderboard(limit) {
  if (!Number.isFinite(limit) || limit <= 0) return [];
  const entries = [];
  for (const [userId, data] of points) {
    entries.push({ userId, referralCount: data.count, points: data.pts });
  }
  entries.sort((a, b) => b.points - a.points || a.userId.localeCompare(b.userId));
  return entries.slice(0, Math.floor(limit));
}

module.exports = { recordReferral, getLeaderboard };
