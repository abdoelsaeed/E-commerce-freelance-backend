const catchAsync = require("./../error/catchAsyn");
const AppError = require("./../error/err");
const Cart = require("../models/cart.Model");
const Product = require("../models/product.Model");

exports.getMyCart = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const cart = await Cart.findOne({ user_id: userId }).populate(
    "cartItems.productId"
  );
  if (!cart || cart.cartItems.length === 0) {
    return res.status(200).json({
      status: "success",
      message: "Your cart is empty",
      data: { cart: null },
    });
  }

  // احسب السعر الإجمالي بعد populate
  const totalPrice = cart.cartItems.reduce((sum, it) => {
    const price = it.productId?.price || 0;
    return sum + price * it.quantity;
  }, 0);

  res.status(200).json({
    status: "success",
    data: { cart, totalPrice },
  });
});
exports.addToCart = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { productId } = req.params;
  // expected in body:
  // { color: "red", size: "M", quantity: 1 }
  const { color, size, quantity = 1 } = req.body;

  if (!color || !size) {
    return next(new AppError("Color and size are required", 400));
  }
  if (!Number.isInteger(quantity) || quantity <= 0) {
    return next(new AppError("Quantity must be a positive integer", 400));
  }

  // find product and variant
  const product = await Product.findById(productId);
  if (!product) return next(new AppError("Product not found", 404));

  const variant = product.variants.find(v => v.color === color && v.size === size);
  if (!variant) {
    return next(new AppError("Selected color/size not available for this product", 400));
  }

  // check availability
  // Note: we are only validating availability here; we are NOT decrementing product stock yet.
  // Decrement should happen when order is placed (or implement reservation logic).
  // compute current quantity in cart for this product+variant to ensure not exceeding stock
  let cart = await Cart.findOne({ user_id: userId });

  if (!cart) {
    cart = await Cart.create({ user_id: userId, cartItems: [] });
  }

  // find matching cart item by productId + color + size
  const itemIndex = cart.cartItems.findIndex(item =>
    item.productId.toString() === productId &&
    item.color === color &&
    item.size === size
  );

  if (itemIndex > -1) {
    const existingQty = cart.cartItems[itemIndex].quantity;
    const newQty = existingQty + quantity;

    if (newQty > variant.quantity) {
      return next(new AppError(`Not enough stock. Available: ${variant.quantity}`, 400));
    }

    cart.cartItems[itemIndex].quantity = newQty;
  } else {
    if (quantity > variant.quantity) {
      return next(new AppError(`Not enough stock. Available: ${variant.quantity}`, 400));
    }

    cart.cartItems.push({
      productId,
      quantity,
      color,
      size
    });
  }
await cart.populate("cartItems.productId");

  cart.totalPrice = cart.cartItems.reduce((sum, it) => {
  const price = it.productId?.price || 0;
  return sum + price * it.quantity;
  }, 0);
  await cart.save();
  // populate product info for response and compute total price (method shown below)
  await cart.populate('cartItems.productId');
    res.status(200).json({
        status: "success",
        data: { cart },
    });
});

// Remove item from cart
exports.removeFromCart = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const { productId } = req.params;

  if (!productId) {
    return next(new AppError("Product ID is required", 400));
  }

  const cart = await Cart.findOne({ user_id: userId });
  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }

  // Remove item(s) with matching productId
  const initialLength = cart.cartItems.length;
  cart.cartItems = cart.cartItems.filter(
    item => item.productId.toString() !== productId
  );

  if (cart.cartItems.length === initialLength) {
    return next(new AppError('Product not found in cart', 404));
  }

  // Update total price
  await cart.populate("cartItems.productId");
  cart.totalPrice = cart.cartItems.reduce((sum, it) => {
    const price = it.productId?.price || 0;
    return sum + price * it.quantity;
  }, 0);

  await cart.save();

  res.status(200).json({
    status: 'success',
    message: 'Item removed from cart',
    data: { cart }
  });
});

// Clear all items from the cart
exports.clearCart = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  const cart = await Cart.findOne({ user_id: userId });
  if (!cart) {
    return next(new AppError('Cart not found', 404));
  }

  cart.cartItems = [];
  cart.totalPrice = 0;
  await cart.save();

  res.status(200).json({ status: 'success', message: 'Cart cleared', data: { cart } });
});