const User = require("../models/User");

const getUsers = async (currentUserId) => {
  const users = await User.find({
    _id: { $ne: currentUserId },
  }).select(
    "_id name username avatar bio accountStatus createdAt"
  );

  return users;
};

const getUserById = async (userId) =>{
    const user = await User.findById(userId)
    .select("_id name username avatar bio accountStatus createdAt");
    return user;
}

const updateUser = async (userId, updateData) => {
    const user = await User.findByIdAndUpdate(userId, updateData,{
        new: true,
        runValidators: true,
    }).select("_id name username avatar bio accountStatus createdAt");
       // updating username , problem is googleusername 
    return user;
};

const searchUsers = async (query, currentUserId) => {
  const users = await User.find({
    _id: { $ne: currentUserId},
    $or: [
      {username: { $regex: query, $options: "i" }},
      {name: { $regex: query, $options: "i" }},
    ],
  }).select("_id name username avatar bio accountStatus createdAt");

  return users;
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  searchUsers,
};