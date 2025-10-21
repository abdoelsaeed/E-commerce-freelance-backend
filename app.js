const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const { connectDB } = require("./DB/connectionDB"); // لاحظ: نستورد الدالة فقط
const cookieParser = require("cookie-parser");
const cors = require('cors');
const userRouter = require("./routes/user.routes");
const productRouter = require("./routes/product.routes");
const categoryRouter = require("./routes/category.routes");
const wishlistRouter = require("./routes/wishList.routes");
const cartRouter = require('./routes/cart.routes')
const orderRouter = require("./routes/odrers.routes");
const morgan = require("morgan");
const globalErrorHandler = require("./controller/error.controller");
const AppError = require("./error/err");
const express = require("express");
const app = express();
if (process.env.NODE_ENV === "development") app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
connectDB()
  .then(() => console.log("DB Connection Successfully"))
  .catch((err) => {
    console.error("DB connection error (will not crash app):", err);
  });
// Allow CORS from any origin (wide-open). Remove or restrict in production if needed.
app.use(cors({ origin: true, credentials: true }));
app.get('/', (req, res) => {
  res.send('Hello World');
});
app.use("/api/v1/users", userRouter);
app.use("/api/v1/categories", categoryRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/wishlist", wishlistRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/orders", orderRouter);

app.use((req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server`, 404));
});
app.use(globalErrorHandler);

module.exports = app;
