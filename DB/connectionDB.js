// DB/connectionDB.js
const mongoose = require("mongoose");

const MONGO_URI =
  process.env.DB ||
  "mongodb+srv://abdoelsaeed2:12345@cluster000.h7jdjme.mongodb.net/e-commerce-freelancer?retryWrites=true&w=majority&appName=Cluster000";

if (!MONGO_URI) {
  // لا ترمي هنا لأننا نريد أن يظل السيرفر يستجيب لروت الصحة؛ لكن سجّل التحذير.
  console.warn(
    "⚠️ MONGO_URI is not defined. DB operations will fail until it's set."
  );
}

let cached = global._mongoClientPromise; // name different to avoid collision

if (!cached) {
  global._mongoClientPromise = { conn: null, promise: null };
  cached = global._mongoClientPromise;
}

/**
 * connectDB
 * - يعيد الاتصال الموجود إن وُجد
 * - ينشئ Promise واحد يعاد استخدامه في كل cold-start
 */
async function connectDB() {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    // يمكنك تعديل options هنا لو أحببت (مثل serverSelectionTimeoutMS)
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      // bufferCommands: false, // اختياري: لمنع buffer للأوامر قبل الاتصال
    };

    cached.promise = mongoose
      .connect(MONGO_URI, opts)
      .then((mongooseInstance) => {
        return mongooseInstance;
      })
      .catch((err) => {
        // امسح الـ promise عند الفشل حتى نتمكن من محاولة إعادة الاتصال لاحقًا
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = { connectDB };
