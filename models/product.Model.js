const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Product must have a name"],
      trim: true,
    },
    // price stored as Decimal128 to preserve precision (decimal(10,2) equivalent)
    price: {
      type: Number,
      required: [true, "Product must have a price"],
      min: 0,
    },
    variants: {
      type: [
        {
          size: {
            type: String,
            enum: ["XS", "S", "M", "L", "XL"],
            required: true,
          },
          color: { type: String, trim: true, required: true },
          quantity: { type: Number, min: 0, default: 0, required: true },
        },
      ],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "Product must have at least one variant",
      },
    },

    category_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      required: [true, "Product must have a category"],
    },
    season: {
      type: String,
      trim: true,
    },
    brand: {
      type: String,
      trim: true,
    },
    gender: {
      type: String,
      enum: ["men", "women", "kids"],
      required: [true, "Product must have a gender"],
      default: "men",
    },
    imageCover: {
      url: { type: String, required: true },
      publicId: { type: String, required: true },
    },
    // images as array of URLs; can also store JSON string if preferred
    images: [
      {
        url: { type: String, required: true },
        publicId: { type: String, required: true },
      },
    ],
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { getters: true },
    toObject: { getters: true },
  }
);

productSchema.index({ name: 1});

// helper virtual to get price as number with two decimals
productSchema.virtual("inStock").get(function () {
  if (!this.variants || this.variants.length === 0) return false;

  return this.variants.some((v) => v.quantity > 0);
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
