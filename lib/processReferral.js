const referralUsers = new Map([
  ['user1', { referred: false, inventory: [] }], ['user2', { referred: false, inventory: [] }],
  ['newUser1', { referred: false, inventory: [] }], ['newUser2', { referred: false, inventory: [] }]
]);

function processReferral(referralCode, newUserId) {
  const referral = getReferralByCode(referralCode);
  if (!referral) {
    throw new Error('Invalid referral code');
  }
  const user = getUserById(newUserId);
  if (!user) {
    throw new Error('User not found');
  }
  if (user.referred) {
    throw new Error('User already referred');
  }
  try {
    markUserAsReferred(newUserId);
    addToInventory(referral.referrerId, 'premium_rhythm_pack');
    addToInventory(newUserId, 'premium_rhythm_pack');
  } catch (dbError) {
    throw new Error('Reward distribution failed');
  }
  return {
    referrerId: referral.referrerId,
    rewardGiven: true,
    message: 'Referral processed successfully'
  };
}

function getReferralByCode(code) {
  const referrals = {
    'ABC123': { referrerId: 'user1' },
    'XYZ789': { referrerId: 'user2' }
  };
  return referrals[code] || null;
}

function getUserById(id) {
  return referralUsers.get(id) || null;
}

function markUserAsReferred(userId) {
  const user = getUserById(userId);
  if (user) {
    user.referred = true;
  }
}

function addToInventory(userId, item) {
  const user = referralUsers.get(userId);
  if (!user) throw new Error('User not found');
  user.inventory.push(item);
}

module.exports = { processReferral };
