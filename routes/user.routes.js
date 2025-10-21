const express = require('express');
const router = express.Router();
const upload = require("./../utils/multer");

const userController = require('./../controller/users.controller');
const authController = require("../controller/auth.controller");

router.route("/").post(upload.single("photo"), authController.signup);
router.post("/login", authController.logIn);
router.post(
  "/create-user",
  authController.protect,
  authController.restricted("admin"), authController.createUser
);
router.get("/logout", authController.logout);
router.get("/me", authController.protect, authController.getMe);
module.exports = router;