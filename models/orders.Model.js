const mongoose = require("mongoose");
const validator = require("validator");

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product ID is required"],
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
    color: {
      type: String,
      required: [true, "Color is required"],
    },
    size: {
      type: String,
      required: [true, "Size is required"],
      enum: ["XS", "S", "M", "L", "XL"],
    },
  },
  { _id: true }
);

const orderSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false, // يمكن أن يكون NULL للعملاء غير المسجلين
    },
    is_guest:{
      type: Boolean,
      default: false
    },
    customer_name: {
      type: String,
      required: [true, "Customer name is required"],
      trim: true,
      maxlength: 100,
    },
    customer_phone: {
      type: String,
      required: [true, "Please provide your phone"],
      validate: {
        validator: (v) => validator.isMobilePhone(v, "ar-EG"),
        message: "invalid phone number or this not egyption number",
      },
    },
    address: {
      type: String,
      required: [true, "Delivery address is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "returned",
        "shipped",
        "delivered",
        "cancelled",
      ],
      default: "pending",
      required: true,
    },
    orderItems: [orderItemSchema],
    totalPrice: {
      type: Number,
      required: true,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Middleware to validate color and size against product variants
orderSchema.pre("save", async function (next) {
  // Only validate stock and recalculate total when creating new order or when orderItems are modified
  if (this.isNew || this.isModified("orderItems")) {
    let total = 0;
    for (const item of this.orderItems) {
      const product = await mongoose.model("Product").findById(item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      // Check if the color/size combination exists in product variants
      const validVariant = product.variants.find(
        (v) => v.color === item.color && v.size === item.size
      );
      if (!validVariant) {
        throw new Error(
          `Invalid color/size combination for product ${product.name}`
        );
      }
      // Check if enough quantity is available (only for new orders)
      // For existing orders, stock was already validated and decremented when order was created
      if (this.isNew && validVariant.quantity < item.quantity) {
        throw new Error(
          `Not enough stock for ${product.name} in ${item.color}/${item.size}`
        );
      }
      total += (product.price || 0) * item.quantity;
    }
    this.totalPrice = total;
  }
  next();
});

const Order = mongoose.model("Order", orderSchema);
module.exports = Order;
