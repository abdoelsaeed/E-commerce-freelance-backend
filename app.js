const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
require("./DB/connectionDB");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const userRouter = require("./routes/user.routes");
const productRouter = require("./routes/product.routes");
const categoryRouter = require("./routes/category.routes");
const wishlistRouter = require("./routes/wishList.routes");
const cartRouter = require("./routes/cart.routes");
const orderRouter = require("./routes/odrers.routes");
const morgan = require("morgan");
const globalErrorHandler = require("./controller/error.controller");
const AppError = require("./error/err");
const express = require("express");
const app = express();

// Logger for development
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// ------------------- CORS Configuration -------------------
// مؤقتًا للسماح بأي Origin لتجنب مشاكل CORS أثناء التطوير أو الاختبار
app.set("trust proxy", 1);

const corsOptions = {
  origin: true, // السماح لأي origin
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Safe handling for preflight (OPTIONS) requests without registering a
// wildcard route (which path-to-regexp may attempt to parse and fail on).
// We handle OPTIONS requests with middleware so Express doesn't register
// a route pattern like '*' that the router's path parser chokes on.
app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    // Use CORS to set headers for preflight and end the request with 204
    return cors(corsOptions)(req, res, () => res.sendStatus(204));
  }
  next();
});

// ------------------- ROUTES -------------------
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/orders", orderRouter);

// ------------------- ERROR HANDLING -------------------
app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
