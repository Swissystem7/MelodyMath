const streakStore = new Map();

function updateStreak(userId, activityDate) {
  if (typeof userId !== 'string' || userId.length === 0) {
    throw new Error('Invalid userId');
  }
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(activityDate)) {
    throw new Error('Invalid date format');
  }
  const activity = new Date(activityDate + 'T00:00:00Z');
  if (activity.toISOString().slice(0, 10) !== activityDate) throw new Error('Invalid date format');
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  if (activity > today) {
    throw new Error('Future date not allowed');
  }
  const storageKey = `streak_${userId}`;
  let stored = streakStore.get(storageKey);
  if (!stored) {
    const result = {
      currentStreak: 1,
      longestStreak: 1,
      rewardEarned: false,
      rewardType: null
    };
    if (result.currentStreak % 5 === 0) {
      result.rewardEarned = true;
      result.rewardType = 'streak_badge';
    }
    streakStore.set(storageKey, { lastDate: activityDate, currentStreak: 1, longestStreak: 1 });
    return result;
  }
  const lastDate = new Date(stored.lastDate + 'T00:00:00Z');
  const diffDays = Math.round((activity - lastDate) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) {
    return {
      currentStreak: stored.currentStreak,
      longestStreak: stored.longestStreak,
      rewardEarned: false,
      rewardType: null
    };
  }
  let newCurrentStreak;
  if (diffDays === 1) {
    newCurrentStreak = stored.currentStreak + 1;
  } else {
    newCurrentStreak = 1;
  }
  const newLongestStreak = Math.max(stored.longestStreak, newCurrentStreak);
  const rewardEarned = newCurrentStreak % 5 === 0;
  const rewardType = rewardEarned ? 'streak_badge' : null;
  streakStore.set(storageKey, { lastDate: activityDate, currentStreak: newCurrentStreak, longestStreak: newLongestStreak });
  return {
    currentStreak: newCurrentStreak,
    longestStreak: newLongestStreak,
    rewardEarned: rewardEarned,
    rewardType: rewardType
  };
}

module.exports = { updateStreak };
