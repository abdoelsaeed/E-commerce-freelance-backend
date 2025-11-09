const mongoose = require("mongoose");
const Order = require("../models/orders.Model");
const Product = require("../models/product.Model");
const catchAsync = require("../error/catchAsyn");
const AppError = require("../error/err");
const Cart = require("../models/cart.Model");

// Create a new order with transaction/session for guests
exports.createGuestOrder = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    let { customer_name, customer_phone, address, orderItems } = req.body;

    if (!Array.isArray(orderItems) || orderItems.length === 0) {
      throw new AppError("orderItems must be a non-empty array", 400);
    }
    if (!customer_name || !customer_phone || !address) {
      throw new AppError(
        "Please provide customer_name, customer_phone, and address",
        400
      );
    }

    // Validate each item and decrement stock inside session
    let total = 0;
    for (const item of orderItems) {
      const { productId, quantity = 1, color, size } = item;
      if (!productId || !color || !size) {
        throw new AppError(
          "Each order item must include productId, color and size",
          400
        );
      }
      const product = await Product.findById(productId).session(session);
      
      if (!product) throw new AppError(`Product ${productId} not found`, 400);

      const variantIndex = product.variants.findIndex(
        (v) => v.color === color && v.size === size
      );
      if (variantIndex === -1) throw new AppError("Variant not found", 400);

      if (product.variants[variantIndex].quantity < quantity) {
        throw new AppError(
          `Not enough stock for ${product.name} in ${color}/${size}`,
          400
        );
      }

      product.variants[variantIndex].quantity -= quantity;
      await product.save({ session });

      total += (product.price || 0) * quantity;
    }

    const orderData = {
      user_id: null,
      is_guest: true,
      customer_name,
      customer_phone,
      address,
      orderItems: orderItems.map((i) => ({
        productId: i.productId,
        quantity: i.quantity || 1,
        color: i.color,
        size: i.size,
      })),
      totalPrice: total,
    };

    const orderArr = await Order.create([orderData], { session });
    const order = orderArr[0];

    await session.commitTransaction();
    session.endSession();

    await order.populate("orderItems.productId", "name price imageCover");

    res.status(201).json({
      status: "success",
      data: { order },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
});

// Create a new order with transaction/session for users logged in
exports.createOrder = catchAsync(async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const userId = req.user.id;
    let { customer_name, customer_phone, address } = req.body;
    if (!address && req.user.address) {
      address = req.user.address;
    }
    if (!customer_name && req.user.name) {
      customer_name = req.user.firstName + " " + req.user.lastName;
    }
    if (!customer_phone && req.user.phone) {
      customer_phone = req.user.phone;
    }
    if (!address || !customer_phone || !customer_name) {
      throw new AppError(
        "Please provide customer_name, customer_phone, and address",
        400
      );
    }

    const cart = await Cart.findOne({ user_id: userId }).session(session);
    if (!cart || cart.cartItems.length === 0) {
      throw new AppError("Your cart is empty", 400);
    }

    // خصم الكمية من كل منتج
    for (const item of cart.cartItems) {
      const product = await Product.findById(item.productId).session(session);
      const variantIndex = product.variants.findIndex(
        (v) => v.color === item.color && v.size === item.size
      );
      if (variantIndex === -1) {
        throw new AppError("Variant not found", 400);
      }
      if (product.variants[variantIndex].quantity < item.quantity) {
        throw new AppError("Not enough stock", 400);
      }
      product.variants[variantIndex].quantity -= item.quantity;
      await product.save({ session });
    }

    // بناء بيانات الطلب
    const orderData = {
      user_id: userId,
      customer_name,
      customer_phone,
      address,
      orderItems: cart.cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        color: item.color,
        size: item.size,
      })),
      totalPrice: cart.totalPrice,
    };

    // إنشاء الطلب
    const orderArr = await Order.create([orderData], { session });
    const order = orderArr[0];

    // مسح السلة
    await Cart.findOneAndUpdate(
      { user_id: userId },
      { cartItems: [], totalPrice: 0 },
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    // Populate product details
    await order.populate("orderItems.productId", "name price imageCover");
    if (order.user_id) {
      await order.populate("user_id", "name email phone");
    }

    res.status(201).json({
      status: "success",
      data: { order },
    });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    next(err);
  }
});

// Get all orders (admin only)
exports.getAllOrders = catchAsync(async (req, res, next) => {
  const { status } = req.query;
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;

  let filter = {};
  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;



  const orders = await Order.find(filter)
    .populate("orderItems.productId", "name price imageCover")
    .populate("user_id", "name email phone")
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(limit);

  const total = await Order.countDocuments(filter);
  const totalPages = Math.ceil(total / limit) || 1;

  res.status(200).json({
    status: "success",
    results: orders.length,
    pagination: {
      currentPage: page,
      perPage: limit,
      totalPages,
      totalItems: total,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
    data: {
      orders,
    },
  });
});

// Get order by ID
exports.getOrderById = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("productId", "name price imageCover variants")
    .populate("user_id", "name email phone address");

  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  // Check if user can access this order (own order or admin)
  if (
    req.user &&
    req.user.role !== "admin" &&
    order.user_id &&
    order.user_id._id.toString() !== req.user._id.toString()
  ) {
    return next(
      new AppError("You don't have permission to access this order", 403)
    );
  }

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

// Get user's orders
exports.getUserOrders = catchAsync(async (req, res, next) => {
  const { status, page = 1, limit = 10 } = req.query;

  let filter = { user_id: req.user._id };
  if (status) {
    filter.status = status;
  }

  const skip = (page - 1) * limit;

  const orders = await Order.find(filter)
    .populate("orderItems.productId", "name price imageCover")
    .sort({ created_at: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Order.countDocuments(filter);

  res.status(200).json({
    status: "success",
    results: orders.length,
    total,
    data: {
      orders,
    },
  });
});

// Update order status (admin only)
exports.updateOrderStatus = catchAsync(async (req, res, next) => {
  const { status } = req.body;
  const validStatuses = [
    "pending",
    "confirmed",
    "returned",
    "shipped",
    "delivered",
    "cancelled",
  ];

  if (!validStatuses.includes(status)) {
    return next(new AppError("Invalid status", 400));
  }

  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  order.status = status;
  await order.save();

  await order.populate("orderItems.productId", "name price imageCover");
  if (order.user_id) {
    await order.populate("user_id", "name email phone");
  }

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

// Cancel order (user can cancel only pending orders)
exports.cancelOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findById(req.params.id);
  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  // Check if user can cancel this order
  if (
    req.user &&
    order.user_id &&
    order.user_id.toString() !== req.user._id.toString()
  ) {
    return next(
      new AppError("You don't have permission to cancel this order", 403)
    );
  }

  if (order.status !== "pending") {
    return next(new AppError("Only pending orders can be cancelled", 400));
  }

  order.status = "cancelled";
  await order.save();

  await order.populate("productId", "name price imageCover");
  if (order.user_id) {
    await order.populate("user_id", "name email phone");
  }

  res.status(200).json({
    status: "success",
    data: {
      order,
    },
  });
});

exports.getOrderStats = catchAsync(async (req, res, next) => {
  const data = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
      },
    },
  ]);
  const totalOrders = await Order.countDocuments();

  res.status(200).json({
    status: "success",
    data: {
      data
    },
    totalOrders,
  });
});

// Delete order (admin only)
exports.deleteOrder = catchAsync(async (req, res, next) => {
  const order = await Order.findByIdAndDelete(req.params.id);
  if (!order) {
    return next(new AppError("Order not found", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.getMyOrders = catchAsync(async (req, res, next) => {
  const orders = await Order.find({ user_id: req.user._id }).populate("orderItems.productId", "name price imageCover");
  res.status(200).json({
    status: "success",
    data: { orders },
  });
});

// Get order statistics (admin only)
exports.getOrderStats = catchAsync(async (req, res, next) => {
  const stats = await Order.aggregate([
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalAmount: { $sum: "$total_amount" },
      },
    },
  ]);

  const totalOrders = await Order.countDocuments();
  const totalRevenue = await Order.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$total_amount" },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: {
      stats,
      totalOrders,
      totalRevenue: totalRevenue[0]?.total || 0,
    },
  });
});

exports.totalSales = catchAsync(async (req, res, next) => {
  let { year, month } = req.query;

  const now = new Date();

  year = year ? Number(year) : now.getFullYear();
  month = month ? Number(month) : null;

  const matchStage = {
    status: "delivered",
    $expr: {
      $eq: [{ $year: "$created_at" }, year],
    },
  };

  if (month) {
    matchStage.$expr = {
      $and: [
        { $eq: [{ $year: "$created_at" }, year] },
        { $eq: [{ $month: "$created_at" }, month] },
      ],
    };
  }

  const totalSales = await Order.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: null,
        total: { $sum: "$totalPrice" },
      },
    },
  ]);

  res.status(200).json({
    status: "success",
    data: { totalSales: totalSales[0]?.total || 0 },
  });
});
