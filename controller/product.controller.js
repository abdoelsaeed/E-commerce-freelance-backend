const AppError = require("./../error/err");
const catchAsync = require("./../error/catchAsyn");
const Product = require("./../models/product.Model");
const { uploadBufferToCloudinary } = require("./auth.controller");

exports.createProduct = catchAsync(async (req, res, next) => {
  const { name, price, variants, category_id } = req.body;

  if (!name || !price || !variants || !category_id) {
    return next(
      new AppError(
        "Please provide all required fields [name, price, variants, category_id]",
        400
      )
    );
  }

  const body = { ...req.body };

  // parse variants من string إلى array
  try {
    body.variants = JSON.parse(variants);
  } catch (err) {
    return next(
      new AppError("Invalid variants format. Must be JSON array", 400)
    );
  }

  // imageCover
  if (req.files?.imageCover?.[0]) {
    const uploaded = await uploadBufferToCloudinary(
      req.files.imageCover[0].buffer,
      "products"
    );
    body.imageCover = {
      url: uploaded.secure_url,
      publicId: uploaded.public_id,
    };
  } else {
    return next(new AppError("imageCover is required", 400));
  }

  // images (array)
  if (req.files?.images?.length) {
    const uploads = await Promise.all(
      req.files.images.map((f) =>
        uploadBufferToCloudinary(f.buffer, "products")
      )
    );
    body.images = uploads.map((u) => ({
      url: u.secure_url,
      publicId: u.public_id,
    }));
  }

  const product = await Product.create(body);

  res.status(200).json({
    status: "success",
    data: { product },
  });
});


exports.updateProduct = catchAsync(async (req, res, next) => {
  const updatedProduct = await Product.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  );

  if (!updatedProduct) {
    return next(new AppError("No product found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      product: updatedProduct,
    },
  });
});

exports.getProductById = catchAsync(async (req, res, next) => {
  const product = await Product.findById(req.params.id);

  if (!product) {
    return next(new AppError("No product found with that ID", 404));
  }

  res.status(200).json({
    status: "success",
    data: {
      product,
    },
  });
});

exports.deleteProduct = catchAsync(async (req, res, next) => {
  const deletedProduct = await Product.findByIdAndDelete(req.params.id);

  if (!deletedProduct) {
    return next(new AppError("No product found with that ID", 404));
  }

  res.status(204).json({
    status: "success",
    data: null,
  });
});

exports.searchProducts = catchAsync(async (req, res, next) => {
  try {
    const { name } = req.body;
    const query = {};
    if (name) query.name = new RegExp(name, "i");
    const products = await Product.find(query);
    if (!products.length) {
      return res
        .status(404)
        .json({ message: "No products found matching your criteria." });
    }

    res.status(200).json({
      status: "success",
      results: products.length,
      data: products,
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

exports.getAllProducts = catchAsync(async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  
  const skip = (page - 1) * limit;
  
  // Build filter using $and to avoid overwriting conditions (safer when combining $or and other clauses)
  const and = [];

  // Search functionality
  if (req.query.searchTerm) {
    and.push({
      $or: [
        { name: { $regex: req.query.searchTerm, $options: 'i' } },
        { brand: { $regex: req.query.searchTerm, $options: 'i' } },
        { season: { $regex: req.query.searchTerm, $options: 'i' } }
      ]
    });
  }

  // Category filter
  if (req.query.category) {
    and.push({ category_id: req.query.category });
  }

  // Gender filter
  if (req.query.gender) {
    and.push({ gender: req.query.gender });
  }

  // Price range filter
  if (req.query.minPrice || req.query.maxPrice) {
    const priceCond = {};
    if (req.query.minPrice) priceCond.$gte = parseFloat(req.query.minPrice);
    if (req.query.maxPrice) priceCond.$lte = parseFloat(req.query.maxPrice);
    and.push({ price: priceCond });
  }

  // In stock filter
  if (req.query.inStock !== undefined) {
    if (req.query.inStock === 'true') {
      and.push({ 'variants.quantity': { $gt: 0 } });
    } else if (req.query.inStock === 'false') {
      and.push({
        $or: [
          { 'variants.quantity': { $lte: 0 } },
          { 'variants.quantity': { $exists: false } },
          { variants: { $exists: false } }
        ]
      });
    }
  }

  const filter = and.length ? { $and: and } : {};
  
  // Sorting
  let sortBy = req.query.sortBy || 'created_at';
  let sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const sort = { [sortBy]: sortOrder };
  
  // Execute query with pagination
  const products = await Product.find(filter)
    .populate('category_id', 'name_en name_ar')
    .sort(sort)
    .skip(skip)
    .limit(limit);
  
  // Get total count for pagination
  const totalProducts = await Product.countDocuments(filter);
  
  
  const totalPages = Math.ceil(totalProducts / limit);
  
  res.status(200).json({
    status: "success",
    results: products.length,
    pagination: {
      currentPage: page,
      totalPages,
      totalProducts,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    },
    data: {
      products,
    },
  });
});