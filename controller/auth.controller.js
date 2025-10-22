const User = require("./../models/user.Model");
const AppError = require("./../error/err");
const catchAsync = require("./../error/catchAsyn");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cloudinary = require("./../utils/cloudinary");
const streamifier = require("streamifier");
const { promisify } = require("util");

exports.uploadBufferToCloudinary = function (buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder }, (err, res) => {
      if (err) return reject(err);
      resolve(res);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

exports.signup = catchAsync(async (req, res, next) => {
  const body = req.body;
  if (req.file) {
    const uploaded = await exports.uploadBufferToCloudinary(
      req.file.buffer,
      "users"
    );
    body.photo = uploaded.secure_url;
    body.photoPublicId = uploaded.public_id;
  }
  const { firstName, lastName, email, phone, password } = body;
  if (!password || !email || !lastName || !firstName || !phone) {
    return next(
      new AppError("Please provide email, password ,phone and name", 400)
    );
  }
  const user = await User.create(body);
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // يحتاج HTTPS
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  user.password = undefined;
  res.status(201).json({
    status: "success",
    token,
    data: {
      user,
    },
  });
});

exports.logIn = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password)
    return next(new AppError("Please provide email and password", 400));
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new AppError("Invalid email or password", 401));
  }
  const isCorrectPassword = await bcrypt.compare(password, user.password);
  if (!isCorrectPassword)
    return next(new AppError("Invalid email or password", 401));
  const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
  if (!token) {
    return next(new AppError("Something went wrong", 401));
  }

  res.cookie("jwt", token, {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
    secure: process.env.NODE_ENV === "production", // يحتاج HTTPS
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    path: "/",
  });
  user.password = undefined;
  res.status(200).json({
    token,
    status: "success",
    data: {
      user,
    },
  });
});
exports.restricted = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError("You do not have permission to perform this action", 403)
      );
    }
    next();
  };
};

exports.protect = catchAsync(async (req, res, next) => {
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    return next(
      new AppError("You are not logged in! please log in to get access", 401)
    );
  }
  //2)Verification token
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

  //3)check if user still exists يعني مامسحش الاكونت مثلا
  const currentUser = await User.findById(decoded.id);
  if (!currentUser) {
    return next(
      new AppError("the user belonging to this token does not exist", 401)
    );
  }

  req.user = currentUser;
  res.locals.user = currentUser;

  next();
});

exports.logout = (req, res, next) => {
  // لو بتستخدم JWT فقط
  if (!req.cookies.jwt) {
    return next(
      new AppError("You are not logged in! please log in to get access", 401)
    );
  }
  res.clearCookie("jwt");
  res.status(200).json({
    status: "success",
    message: "Logged out from JWT successfully!",
  });
};

exports.getMe = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    status: "success",
    data: {
      user,
    },
  });
});
exports.createUser = catchAsync(async (req, res, next) => {
  const { firstName, lastName, email, phone, password } = req.body;
  if (!firstName || !lastName || !email || !phone || !password) {
    return next(new AppError("Please provide all required fields", 400));
  }
  const user = await User.create({
    firstName,
    lastName,
    email,
    phone,
    password,
    role: "admin",
  });
  res.status(201).json({
    status: "success",
    data: user,
  });
});
