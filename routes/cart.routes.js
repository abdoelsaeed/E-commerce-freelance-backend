const express = require("express");
const authController = require("./../controller/auth.controller");
const cartController = require("./../controller/cart.controller");
const router = express.Router();

// Correct route with leading slash
router.post("/add-to-cart/:productId", authController.protect, cartController.addToCart);
router.get("/me", authController.protect, cartController.getMyCart);
router.delete("/remove-item/:productId", authController.protect, cartController.removeFromCart);
router.delete("/clear", authController.protect, cartController.clearCart);
module.exports = router;