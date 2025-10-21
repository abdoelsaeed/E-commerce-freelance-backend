const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product ID is required'],
  },
  quantity: {
    type: Number,
    required: true,
    min: [1, 'Quantity must be at least 1'],
    default: 1
  },
  color: {
    type: String,
    required: [true, 'Color is required']
  },
  size: {
    type: String,
    required: [true, 'Size is required'],
    enum: ["XS", "S", "M", "L", "XL"]
  }
}, { _id: true });

const cartSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cartItems: [cartItemSchema],
    totalPrice:Number,
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" },
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);



// Middleware to validate color and size against product variants
cartSchema.pre('save', async function(next) {
  for (const item of this.cartItems) {
    const product = await mongoose.model('Product').findById(item.productId);
    if (!product) {
      throw new Error(`Product ${item.productId} not found`);
    }

    // Check if the color/size combination exists in product variants
    const validVariant = product.variants.find(
      v => v.color === item.color && v.size === item.size
    );

    if (!validVariant) {
      throw new Error(`Invalid color/size combination for product ${product.name}`);
    }

    // Check if enough quantity is available
    if (validVariant.quantity < item.quantity) {
      throw new Error(`Not enough stock for ${product.name} in ${item.color}/${item.size}`);
    }
  }
  next();
});
const Cart = mongoose.model("Cart", cartSchema);
module.exports = Cart;