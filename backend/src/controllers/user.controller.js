const userService = require("../services/user.service");

const getUsers = async (req, res, next) =>{
    try{
        const users = await userService.getUsers(req.user.userId);

        return res.status(200).json({
            success: true,
            users,
        });
    } catch (error){
        console.error("Get Users error:", error);
        next(error);
    }
};

const getUserById = async (req, res, next) => {
  try {
    const user = await userService.getUserById(req.params.id);

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
    console.error("Get user by ID error:", error);

    next(error);
  }
};

const updateUser = async ( req, res, next)=>{
    try {
        if(req.user.userId !== req.params.id){
            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this user",
            });
        }

        const allowedFields = ["name", "username", "avatar", "bio"];
        const updateData = {};

        for (const field of allowedFields) {
            if(req.body[field] !== undefined){
                updateData[field] = req.body[field];
            }
        }

        const user = await userService.updateUser(req.params.id, updateData);
        if(!user){
            return res.status(404).json({
                success:false,
                message: "User not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "User updated successfully",
            user,
        });
    }
    catch(error){
        console.error("updateUser error:", error);
        next(error);
    }
        
};

const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;

    // if (!q) {
    //   return res.status(400).json({
    //     success: false,
    //     message: "Search query is required",
    //   });
    // }

    const users = await userService.searchUsers(
      q,
      req.user.userId
    );

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error("Search users error:", error);

    next(error);
  }
};

module.exports = {
    getUsers,
    getUserById,
    updateUser,
    searchUsers,
};