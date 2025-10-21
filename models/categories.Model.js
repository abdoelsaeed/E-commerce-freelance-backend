const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category must have an English name"],
      trim: true,
      unique: true,
      maxlength: 100,
    },

    description: {
      type: String,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
  }
);

categorySchema.index({ name: 1 }, { unique: true });

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
