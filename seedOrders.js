// scripts/seedOrders.js
const mongoose = require("mongoose");
const Order = require("./models/orders.Model"); // عدل المسار حسب مشروعك
const Product = require("./models/product.Model"); // محتاجين منتجات موجودة

// ربط بالمونجو
mongoose
  .connect(
    "mongodb+srv://abdoelsaeed2:12345@cluster000.h7jdjme.mongodb.net/e-commerce-freelancer?retryWrites=true&w=majority&appName=Cluster000"
  ) // عدل الاسم
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error(err));

async function seedOrders() {
  try {
    // نجيب بعض المنتجات عشوائي
    const products = await Product.find().limit(5); // مثلاً 5 منتجات

    if (!products.length) {
      console.log("No products found. Add some products first.");
      return;
    }

    const orders = [];

    for (let i = 0; i < 50; i++) {
      // اختار منتج عشوائي
      const product = products[Math.floor(Math.random() * products.length)];
      // اختار حجم ولون عشوائي من الفاريانتس
      const variant =
        product.variants[Math.floor(Math.random() * product.variants.length)];

      const order = new Order({
        customer_name: `Customer ${i + 1}`,
        customer_phone: `0111${Math.floor(1000000 + Math.random() * 9000000)}`,
        address: `Address ${i + 1}`,
        status: i < 12 ? "returned" : "shipped", // أول 10 delivered
        orderItems: [
          {
            productId: product._id,
            quantity: Math.floor(Math.random() * 3) + 1,
            color: variant.color,
            size: variant.size,
          },
        ],
      });

      orders.push(order);
    }

    await Order.insertMany(orders);
    console.log("✅ 20 orders added successfully!");
  } catch (err) {
    console.error(err);
  } finally {
    mongoose.connection.close();
  }
}

seedOrders();
