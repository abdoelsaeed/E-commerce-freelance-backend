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
const rawAllowed =
  process.env.ALLOWED_ORIGINS ||
  "https://e-commerce-freelance-frontend-gpxky2wr6-abdoelsaeeds-projects.vercel.app,http://localhost:5173";

const allowedOrigins = rawAllowed
  .split(",")
  .map((s) => s.trim().replace(/\/+$/, "")) // remove trailing slashes
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // allow requests with no origin (like curl, Postman)
    if (!origin) return callback(null, true);

    // allow all origins in dev
    if (process.env.NODE_ENV !== "production") return callback(null, true);

    const cleaned = origin.replace(/\/+$/, "");
    if (allowedOrigins.includes(cleaned)) {
      return callback(null, true);
    }

    console.warn("❌ CORS blocked origin:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
};

// Apply main CORS middleware
app.use(cors(corsOptions));

// Safe handling for preflight (OPTIONS) requests
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
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
