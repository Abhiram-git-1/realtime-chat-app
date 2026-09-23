const profileService = require("../services/profile.service");

const getProfile = async (req, res, next) => {
  try {
    const user = await profileService.getProfile(req.user.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error);

    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      "name",
      "username",
      "avatar",
      "bio",
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    const user = await profileService.updateProfile(
      req.user.userId,
      updateData
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("Update profile error:", error);

    next(error);
  }
};

module.exports = {
  getProfile,
  updateProfile,
};