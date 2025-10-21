// DB/connectionDB.js
const mongoose = require("mongoose");

const MONGO_URI =
  process.env.DB ||
  "mongodb+srv://abdoelsaeed2:12345@cluster000.h7jdjme.mongodb.net/e-commerce-freelancer?retryWrites=true&w=majority&appName=Cluster000";

if (!MONGO_URI) throw new Error("MONGO_URI is not defined");

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then((mongoose) => mongoose);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB();
