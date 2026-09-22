const User = require("../models/User");

const getProfile = async (userId) => {
  const user = await User.findById(userId).select(
    "_id name username email avatar bio accountStatus createdAt updatedAt"
  );

  return user;
};

const updateProfile = async (userId, updateData) => {
  const user = await User.findByIdAndUpdate(
    userId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  ).select(
    "_id name username email avatar bio accountStatus createdAt updatedAt"
  );

  return user;
};

module.exports = {
  getProfile,
  updateProfile,
};