const ConversationMember = require("../models/ConversationMember");
const Conversation = require("../models/Conversation");
const User = require("../models/User");
const getConversationsByUserId = async (userId) => {
    const memberships = await ConversationMember.find({
        userId,
    }).select("conversationId");

    const conversationIds = memberships.map(
        (membership) => membership.conversationId
    );

    const conversations = await Conversation.find({
        _id: { $in: conversationIds },
        deletedAt: null,
    })
        .sort({ lastMessageAt: -1 })
        .populate(
            "lastMessage",
            "senderId content createdAt deletedAt"
        );

    const populatedConversations = await Promise.all(
        conversations.map(async (conversation) => {
            const members = await ConversationMember.find({
                conversationId: conversation._id,
            })
                .populate(
                    "userId",
                    "_id name username avatar bio"
                )
                .select("userId role");

            return {
                ...conversation.toObject(),
                members,
            };
        })
    );

    return populatedConversations;
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

const createConversation = async ({creatorId,type,name,memberIds = [],}) => {
  
  // BASIC VALIDATION
  if (!["direct", "group"].includes(type)) {
    const error = new Error("Invalid conversation type");
    error.statusCode = 400;
    throw error;
  }
  // VERIFY USERS EXIST
 
  const uniqueMemberIds = [
    ...new Set([creatorId, ...memberIds]),
  ];

  const users = await User.find({
    _id: { $in: uniqueMemberIds },
  }).select("_id");

  if (users.length !== uniqueMemberIds.length) {
    const error = new Error(
      "One or more users do not exist"
    );
    error.statusCode = 404;
    throw error;
  }

  // DIRECT CONVERSATION

  if (type === "direct") {
    // Must contain exactly one other user
    if (memberIds.length !== 1) {
      const error = new Error(
        "Direct conversation must have exactly one other user"
      );
      error.statusCode = 400;
      throw error;
    }

    const otherUserId = memberIds[0];

    // Creator cannot create conversation with himself
    if (creatorId.toString() === otherUserId.toString()) {
      const error = new Error(
        "You cannot create a direct conversation with yourself"
      );
      error.statusCode = 400;
      throw error;
    }

    // FIND SHARED CONVERSATIONS

    const creatorMemberships =
      await ConversationMember.find({
        userId: creatorId,
      }).select("conversationId");

    const otherUserMemberships =
      await ConversationMember.find({
        userId: otherUserId,
      }).select("conversationId");

    const creatorConversationIds = new Set(
      creatorMemberships.map((membership) =>
        membership.conversationId.toString()
      )
    );

    const sharedConversationIds =
      otherUserMemberships
        .map((membership) => membership.conversationId)
        .filter((conversationId) =>
          creatorConversationIds.has(
            conversationId.toString()
          )
        );

    // CHECK EXISTING ACTIVE DIRECT
   
    if (sharedConversationIds.length > 0) {
      const existingDirectConversation =
        await Conversation.findOne({
          _id: { $in: sharedConversationIds },
          type: "direct",
          deletedAt: null,
        });

      if (existingDirectConversation) {
        const error = new Error(
          "A direct conversation with this user already exists"
        );
        error.statusCode = 409;
        throw error;
      }
    }
  }

  // GROUP CONVERSATION

  if (type === "group") {
    if (!name?.trim()) {
      const error = new Error(
        "Group conversation name is required"
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // CREATE CONVERSATION
  
  const conversation = await Conversation.create({
    type,
    name: type === "group" ? name.trim() : null,
    createdBy: creatorId,
  });

  // CREATE MEMBERS

  const members = uniqueMemberIds.map((userId) => ({
    conversationId: conversation._id,
    userId,
    role:
      userId.toString() === creatorId.toString()
        ? "admin"
        : "member",
  }));

  await ConversationMember.insertMany(members);

  return conversation;
};
const getConversationById = async (conversationId) => {
  const getConversationById = async (conversationId) => {
  console.log(
    "🔥 SERVICE getConversationById CALLED:",
    conversationId
  );

  const conversation = await Conversation.findOne({
    _id: conversationId,
    deletedAt: null,
  });

  console.log(
    "🔥 CONVERSATION FOUND:",
    Boolean(conversation)
  );

  // keep the rest of your code below
};
  const conversation = await Conversation.findOne({
    _id: conversationId,
    deletedAt: null,
  })
    .populate("createdBy", "_id name username avatar")
    .populate(
      "lastMessage",
      "senderId content createdAt deletedAt"
    );

  if (!conversation) {
    return null;
  }

  const members = await ConversationMember.find({
    conversationId: conversation._id,
  })
    .populate(
      "userId",
      "_id name username avatar bio"
    )
    .select("userId role");

  return {
    ...conversation.toObject(),
    members,
  };
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
    {
      _id: conversationId,
      deletedAt: null,
    },
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

const searchConversations = async (userId, query) => {
  // 1. Get conversations where current user is a member
  const memberships = await ConversationMember.find({
    userId,
  }).select("conversationId");

  const conversationIds = memberships.map(
    (membership) => membership.conversationId
  );

  // 2. Find users matching the search query
  const matchingUsers = await User.find({
    _id: { $ne: userId },
    $or: [
      { name: { $regex: query, $options: "i" } },
      { username: { $regex: query, $options: "i" } },
    ],
  }).select("_id");

  const matchingUserIds = matchingUsers.map((user) => user._id);

  // 3. Find direct conversations containing a matching user
  const directMemberships = await ConversationMember.find({
    conversationId: { $in: conversationIds },
    userId: { $in: matchingUserIds },
  }).select("conversationId");

  const directConversationIds = directMemberships.map(
    (membership) => membership.conversationId
  );

  // 4. Find group conversations whose name matches
  const groupConversations = await Conversation.find({
    _id: { $in: conversationIds },
    type: "group",
    deletedAt: null,
    name: { $regex: query, $options: "i" },
  });

  // 5. Get direct conversations
  const directConversations = await Conversation.find({
    _id: { $in: directConversationIds },
    type: "direct",
    deletedAt: null,
  });

  // 6. Combine both results
  const conversations = [
    ...groupConversations,
    ...directConversations,
  ];

  // 7. Sort newest activity first
  conversations.sort((a, b) => {
    const dateA = a.lastMessageAt
      ? new Date(a.lastMessageAt).getTime()
      : 0;

    const dateB = b.lastMessageAt
      ? new Date(b.lastMessageAt).getTime()
      : 0;

    return dateB - dateA;
  });

  // 8. Populate last message
  await Conversation.populate(conversations, {
    path: "lastMessage",
    select: "senderId content createdAt deletedAt",
  });

  return conversations;
};

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