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
const corsOptions = {
  // تحديد الـ origins المسموح بها (قم بتغيير هذه القيم حسب احتياجك)
  origin:
    process.env.NODE_ENV === "development"
      ? "http://localhost:3000" // للتطوير المحلي
      : [
          "https://e-commerce-freelance-frontend-eh22fksoh-abdoelsaeeds-projects.vercel.app",
        ], // للإنتاج
  credentials: true, // السماح بالـ cookies
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  exposedHeaders: ["set-cookie"], // السماح للمتصفح بقراءة هذه الـ headers
};

// Apply CORS middleware
app.use(cors(corsOptions));

// Safe handling for preflight (OPTIONS) requests
// Use '/*' instead of '*' to avoid path-to-regexp parsing issues in some environments
app.options("/*", cors(corsOptions));

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
