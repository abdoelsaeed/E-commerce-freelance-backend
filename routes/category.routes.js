const express = require("express");
const authController = require("./../controller/auth.controller");
const categoryController = require("./../controller/category.controller");

const router = express.Router();

// Public
router.get("/", categoryController.getAllCategories);
router.get("/:id", categoryController.getCategoryById);

// Admin only
router.post(
  "/",
  authController.protect,
  authController.restricted("admin"),
  categoryController.createCategory
);

router.patch(
  "/:id",
  authController.protect,
  authController.restricted("admin"),
  categoryController.updateCategory
);

router.delete(
  "/:id",
  authController.protect,
  authController.restricted("admin"),
  categoryController.deleteCategory
);

module.exports = router;
