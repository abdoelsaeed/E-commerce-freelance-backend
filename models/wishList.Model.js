const mongoose = require("mongoose");

const wishlistItemSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Wishlist item must belong to a user"],
    },
    product_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Wishlist item must have a product"],
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: false },
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

// Create indexes as specified in the schema
wishlistItemSchema.index({ user_id: 1 });
wishlistItemSchema.index({ product_id: 1 });
wishlistItemSchema.index({ user_id: 1, product_id: 1 }, { unique: true });

// Virtual to populate user details
wishlistItemSchema.virtual("user", {
  ref: "User",
  localField: "user_id",
  foreignField: "_id",
  justOne: true,
});

// Virtual to populate product details
wishlistItemSchema.virtual("product", {
  ref: "Product",
  localField: "product_id",
  foreignField: "_id",
  justOne: true,
});

// Ensure virtual fields are serialized
wishlistItemSchema.set("toJSON", { virtuals: true });
wishlistItemSchema.set("toObject", { virtuals: true });

const WishlistItem = mongoose.model("WishlistItem", wishlistItemSchema);

module.exports = WishlistItem;
