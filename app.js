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

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Allow CORS for specific origin in production for security
// قبل استخدامه تأكد إنك ضفت ALLOWED_ORIGINS في Railway أو استخدم القيم هنا مؤقتًا
const rawAllowed = 'https://e-commerce-freelance-frontend-gpxky2wr6-abdoelsaeeds-projects.vercel.app,http://localhost:5173';

const allowedOrigins = rawAllowed
  .split(',')
  .map(s => s.trim().replace(/\/+$/,'')) // remove trailing slashes
  .filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    // allow direct server-to-server or curl (no origin)
    if (!origin) return callback(null, true);

    // allow in non-production to simplify dev
    if (process.env.NODE_ENV !== 'production') return callback(null, true);

    const cleaned = origin.replace(/\/+$/,'');
    if (allowedOrigins.includes(cleaned)) {
      return callback(null, true);
    }

    console.warn('CORS blocked origin:', origin);
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization','X-Requested-With']
};

app.use(cors(corsOptions));
app.options('/*', cors(corsOptions));



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
