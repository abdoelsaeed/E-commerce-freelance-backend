const AppError = require("./../error/err");
const Product = require("./../models/product.Model");
const User = require("./../models/user.Model");
const catchAsync = require("./../error/catchAsyn");
const Wishlist = require("./../models/wishList.Model");



exports.addToWishlist = catchAsync(async (req, res, next) => {
  const productId = req.params.id;
  const product = await Product.findById(productId);
  if (!product) return next(new AppError("Not found this product", 404));

  const userId = req.user.id;
  const wishList = await Wishlist.create({
    product_id: productId,
    user_id: userId,
  });
  res.status(200).json({
    status: "success",
    data: {
      wishList: wishList,
    },
  });
});
exports.getWishlistForMe = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  // Verify user owns the wishlist items
  const wishList = await Wishlist.find({ user_id: userId })
    .populate({
      path: "product_id",
      select: "name price imageCover variants gender brand",
    })
    .sort({ created_at: -1 });

  res.status(200).json({
    status: "success",
    results: wishList.length,
    data: {
       wishList,
    },
  });
});
exports.removeFromWishlist = catchAsync(async (req, res, next) => {
  const productId = req.params.id;
  const userId = req.user.id;

  // Find and delete the wishlist item, ensuring it belongs to the user
  const deletedItem = await Wishlist.findOneAndDelete({
    product_id: productId,
    user_id: userId,
  });

  if (!deletedItem) {
    return next(new AppError("Product not found in your wishlist", 404));
  }

  res.status(200).json({
    status: "success",
    message: "Product removed from wishlist successfully",
  });
});

exports.clearWishlist = catchAsync(async (req, res, next) => {
  const userId = req.user.id;
  
  // First check if user has any wishlist items
  const userWishlist = await Wishlist.find({ user_id: userId });
  
  if (userWishlist.length === 0) {
    return next(new AppError("No items found in your wishlist", 404));
  }
  
  // Delete all wishlist items for this user
  const result = await Wishlist.deleteMany({ user_id: userId });

  res.status(200).json({
    status: "success",
    message: "Wishlist cleared successfully",
    data: {
      deletedCount: result.deletedCount,
    },
  });
});

// Admin route - Get most wishlisted products
exports.getMostWishlistedProducts = catchAsync(async (req, res, next) => {
  const { limit = 10, page = 1 } = req.query;
  const skip = (page - 1) * limit;

  // Aggregate to get most wishlisted products
  const mostWishlisted = await Wishlist.aggregate([
    {
      $group: {
        _id: "$product_id",
        wishlistCount: { $sum: 1 }
      }
    },
    {
      $sort: { wishlistCount: -1 }
    },
    {
      $skip: skip
    },
    {
      $limit: parseInt(limit)
    },
    {
      $lookup: {
        from: "products",
        localField: "_id",
        foreignField: "_id",
        as: "product"
      }
    },
    {
      $unwind: "$product"
    },
    {
      $project: {
        product: {
          name: 1,
          price: 1,
          imageCover: 1,
          gender: 1,
          brand: 1
        },
        wishlistCount: 1
      }
    }
  ]);

  // Get total count for pagination
  const totalCount = await Wishlist.aggregate([
    {
      $group: {
        _id: "$product_id"
      }
    },
    {
      $count: "total"
    }
  ]);

  const total = totalCount.length > 0 ? totalCount[0].total : 0;

  res.status(200).json({
    status: "success",
    results: mostWishlisted.length,
    total,
    page: parseInt(page),
    pages: Math.ceil(total / limit),
    data: {
      mostWishlisted,
    },
  });
});
