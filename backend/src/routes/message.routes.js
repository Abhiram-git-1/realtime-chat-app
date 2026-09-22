const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const messageController = require("../controllers/message.controller");

const {validateObjectId, validateBody} = require("../middleware/validate.middleware");
const {updateMessageSchema} = require("../validations/message.validation");

const router = express.Router();

router.get("/:id", authenticate, validateObjectId("id"), messageController.getMessageById);
router.patch("/:id", authenticate, validateObjectId("id"), validateBody(updateMessageSchema), messageController.updateMessage);
router.delete("/:id", authenticate, validateObjectId("id"), messageController.deleteMessage); 

module.exports = router;