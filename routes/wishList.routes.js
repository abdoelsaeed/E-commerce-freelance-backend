
const express = require("express");
const router = express.Router();
const authController = require("./../controller/auth.controller");
const wishlistController = require("./../controller/wishList.controller");

// All wishlist routes require authentication
router.use(authController.protect);

// Get user's wishlist (must be before /:id route)
router.get("/me", wishlistController.getWishlistForMe);

// Clear entire wishlist (must be before /:id route)
router.delete("/me", wishlistController.clearWishlist);
router.delete("/delete/:id", wishlistController.removeFromWishlist);
// Add item to wishlist
router.post("/:id", wishlistController.addToWishlist);

// Admin route - Get most wishlisted products
router.get("/admin/most-wishlisted", 
  authController.restricted("admin"), 
  wishlistController.getMostWishlistedProducts
);

// // Remove item from wishlist
// router.delete("/:productId", wishlistController.removeFromWishlist);

// // Check if product is in user's wishlist
// router.get("/check/:productId", wishlistController.checkWishlistItem);

module.exports = router;
