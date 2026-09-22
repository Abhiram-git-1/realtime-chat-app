const ConversationMember = require("../models/ConversationMember");
const Conversation = require("../models/Conversation");

const getConversationsByUserId = async (userId) =>{
    const memberships = await ConversationMember.find({
        userId,
    }).select("conversationId");

    const conversationIds = memberships.map((membership) => membership.conversationId);

    const conversations = await Conversation.find({
        _id: { $in: conversationIds},
        deletedAt: null,
    })
    .sort({ lastMessageAt: -1})
    .populate("lastMessage", "senderId content createdAt deletedAt" )

    return conversations;
};

/*const createConversation = async ({creatorId, type, name, memberIds}) => {
    const conversation = await Conversation.create({
        type,
        name: type === "group" ? name : null,
        createdBy: creatorId,
    });

    const uniqueMemberIds = [...new Set([creatorId, ...memberIds])];

    const conversationMembers = uniqueMemberIds.map((userId) => ({
        conversationId: conversation._id,
        userId,
        role: userId === creatorId ? "admin" : "member",
    }));

    await ConversationMember.insertMany(conversationMembers);

    return conversation;
    
//     doesn't verify that those IDs actually belong to users.
// But we intentionally deferred this until validation/error handling, so do not change it now.
// Likewise, these remain intentionally deferred:
// We are not yet enforcing:
// direct → exactly one other user
// group → name required
// memberIds → valid existing users
// duplicate direct conversation between two users
};
*/

const createConversation = async ({
  creatorId,
  type,
  name,
  memberIds,
}) => {
  const uniqueMemberIds = [
    ...new Set([creatorId, ...memberIds]),
  ];

  // DIRECT conversation
  if (type === "direct") {
    if (uniqueMemberIds.length !== 2) {
      const error = new Error(
        "Direct conversation must have exactly one other user"
      );
      error.statusCode = 400;
      throw error;
    }

    const existingMemberships =
      await ConversationMember.aggregate([
        {
          $match: {
            userId: {
              $in: uniqueMemberIds,
            },
          },
        },
        {
          $group: {
            _id: "$conversationId",
            users: {
              $addToSet: "$userId",
            },
          },
        },
        {
          $match: {
            users: {
              $all: uniqueMemberIds,
            },
          },
        },
      ]);

    if (existingMemberships.length > 0) {
      const existingConversation =
        await Conversation.findOne({
          _id: existingMemberships[0]._id,
          type: "direct",
          deletedAt: null,
        });

      if (existingConversation) {
        const error = new Error(
          "Direct conversation already exists"
        );
        error.statusCode = 409;
        throw error;
      }
    }
  }

  // GROUP conversation
  if (type === "group" && !name?.trim()) {
    const error = new Error(
      "Group conversation name is required"
    );
    error.statusCode = 400;
    throw error;
  }

  // Verify all users exist
  const existingUsers = await User.find({
    _id: {
      $in: uniqueMemberIds,
    },
  }).select("_id");

  if (existingUsers.length !== uniqueMemberIds.length) {
    const error = new Error(
      "One or more users do not exist"
    );
    error.statusCode = 400;
    throw error;
  }

  const conversation = await Conversation.create({
    type,
    name: type === "group" ? name.trim() : null,
    createdBy: creatorId,
  });

  const members = uniqueMemberIds.map((userId) => ({
    conversationId: conversation._id,
    userId,
    role: userId === creatorId ? "admin" : "member",
  }));

  await ConversationMember.insertMany(members);

  return conversation;
};
const getConversationById = async (conversationId) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    deletedAt: null,
  })
    .populate("createdBy", "_id name username avatar")
    .populate(
      "lastMessage",
      "senderId content createdAt deletedAt"
    );

  return conversation;
};
const updateConversation = async (conversationId, updateData) => {
  const conversation = await Conversation.findByIdAndUpdate(
    conversationId,
    updateData,
    {
      new: true,
      runValidators: true,
    }
  )
    .populate("createdBy", "_id name username avatar")
    .populate(
      "lastMessage",
      "senderId content createdAt deletedAt"
    );

  return conversation;
};

const deleteConversation = async (conversationId) => {
  const conversation = await Conversation.findByIdAndUpdate(
    conversationId,
    {
      deletedAt: new Date(),
    },
    {
      new: true,
    }
  );

  return conversation;
};

const getConversationMembers = async (conversationId) => {
  const members = await ConversationMember.find({
    conversationId,
  })
    .populate("userId", "_id name username avatar bio")
    .select("userId role joinedAt createdAt");

  return members;
};

const addConversationMember = async (conversationId,userId) => {
  const member = await ConversationMember.create({
    conversationId,
    userId,
    role: "member",
  });
  return member;
};

const removeConversationMember = async (conversationId, userId) => {
    const member = await ConversationMember.findOneAndDelete({
        conversationId,
        userId,
    });
    return member;
};

const updateConversationMemberRole = async (conversationId, userId, newRole) => {
    const member = await ConversationMember.findOneAndUpdate({
        conversationId,
        userId,
    }, 
    newRole,
    {
        new: true,
        runValidators: true,
    }
    ).populate("userId", "_id name username avatar bio");
    return member;
};

const searchConversations = async (query, userId) => {
    const memberships = await ConversationMember.find({
      userId,
    }).select("conversationId");

    const conversationIds = memberships.map((membership) => membership.conversationId);

    const conversations = await Conversation.find({
      _id: { $in: conversationIds},
      deletedAt: null,
      $or: [
        {name: { $regex: query, $options: "i" }},
      ],
    })
    .sort({ lastMessageAt: -1})
    .populate("lastMessage", "senderId content createdAt deletedAt" )

    return conversations;
}
module.exports = {
    getConversationsByUserId,
    createConversation,
    getConversationById,
    updateConversation,
    deleteConversation,
    getConversationMembers,
    addConversationMember,
    removeConversationMember,
    updateConversationMemberRole,
    searchConversations,
};
