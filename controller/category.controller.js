const Category = require('./../models/categories.Model');
const catchAsync = require('./../error/catchAsyn');
const AppError = require('./../error/err');

exports.createCategory = catchAsync(async (req, res, next) => {
  const { name, description } = req.body;
  if (!name) {
    return next(new AppError('Please provide name', 400));
  }
  const category = await Category.create({ name, description });
  res.status(201).json({ status: 'success', data: { category } });
});

exports.getAllCategories = catchAsync(async (req, res, next) => {
  const categories = await Category.find();
  res.status(200).json({ status: 'success', results: categories.length, data: { categories } });
});

exports.getCategoryById = catchAsync(async (req, res, next) => {
  const category = await Category.findById(req.params.id);
  if (!category) return next(new AppError('No category found with that ID', 404));
  res.status(200).json({ status: 'success', data: { category } });
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const updates = (({ name, description }) => ({ name, description }))(req.body);
  const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
  if (!category) return next(new AppError('No category found with that ID', 404));
  res.status(200).json({ status: 'success', data: { category } });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  const category = await Category.findByIdAndDelete(req.params.id);
  if (!category) return next(new AppError('No category found with that ID', 404));
  res.status(204).json({ status: 'success', data: null });
});
