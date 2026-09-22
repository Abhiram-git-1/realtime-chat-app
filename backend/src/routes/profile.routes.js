const express = require("express");

const authenticate = require("../middleware/auth.middleware");
const profileController = require("../controllers/profile.controller");

const { validateBody} = require("../middleware/validate.middleware");
const {updateProfileSchema} = require("../validations/profile.validation");

const router = express.Router();

router.get("/", authenticate, profileController.getProfile);
router.patch("/", authenticate, validateBody(updateProfileSchema), profileController.updateProfile);
module.exports = router;