const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const conversationController = require("../controllers/conversation.controller");
const messageController = require("../controllers/message.controller");

const {validateObjectId, validateBody} = require("../middleware/validate.middleware");
const {createConversationSchema, updateConversationSchema, addMemberSchema, updateMemberSchema} = require("../validations/conversation.validation");
const {createMessageSchema} = require("../validations/message.validation");

const router = express.Router();

router.get("/", authenticate, conversationController.getConversations );
router.post("/", authenticate, validateBody(createConversationSchema), conversationController.createConversation);

router.get("/:id/messages", authenticate, validateObjectId("id"), messageController.getConversationMessages);
router.post("/:id/messages", authenticate, validateObjectId("id"), validateBody(createMessageSchema), messageController.createMessage);


router.get("/:id/members", authenticate, validateObjectId("id"), conversationController.getConversationMembers);
router.post("/:id/members", authenticate, validateObjectId("id"), validateBody(addMemberSchema), conversationController.addconversationMember);
router.delete("/:id/members/:userId", authenticate, validateObjectId("id"), validateObjectId("userId"), conversationController.removeConversationMember);
router.patch("/:id/members/:userId", authenticate, validateObjectId("id"), validateObjectId("userId"), validateBody(updateMemberSchema), conversationController.updateConversationMember);

router.get("/:id", authenticate, validateObjectId("id"), conversationController.getConversationById);
router.patch("/:id", authenticate, validateObjectId("id"),  validateBody(updateConversationSchema),conversationController.updateConversation);
router.delete("/:id", authenticate, validateObjectId("id"), conversationController.deleteConversation);
module.exports = router;