const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const userController = require("../controllers/user.controller");

const {validateObjectId, validateBody} = require("../middleware/validate.middleware");
const {updateUserSchema} = require("../validations/user.validation");

const router = express.Router();


router.get("/", authenticate, userController.getUsers);
router.get("/:id", authenticate, validateObjectId("id"), userController.getUserById);
router.patch("/:id", authenticate, validateObjectId("id"), validateBody(updateUserSchema), userController.updateUser);


module.exports = router;