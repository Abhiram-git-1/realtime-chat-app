const express = require("express");
const authenticate = require("../middleware/auth.middleware");
const userController = require("../controllers/user.controller");
const conversationController = require("../controllers/conversation.controller");

const { validateQuery } = require("../middleware/validate.middleware");
const { searchQuerySchema} = require("../validations/search.validation");

const router = express.Router();

router.get("/users",authenticate, validateQuery(searchQuerySchema),userController.searchUsers);

router.get("/conversations",authenticate, valiadteQuery(searchQuerySchema),conversationController.searchConversations);

module.exports = router;