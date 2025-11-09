const express = require("express");
const router = express.Router();
const orderController = require("../controller/orders.controller");
const authController = require("../controller/auth.controller");

router.post("/guest", orderController.createGuestOrder);

// Protected routes (for authenticated users)
router.use(authController.protect);

router.post("/", orderController.createOrder);


// User routes
router.get("/:id", orderController.getOrderById);
router.patch("/:id/cancel", orderController.cancelOrder);

router.get("/my/orders", orderController.getMyOrders);
// Admin routes
router.use(authController.restricted("admin"));
router.get("/total/sales", authController.protect, orderController.totalSales);
router.get("/", orderController.getAllOrders);
router.patch("/:id/status", orderController.updateOrderStatus);
router.delete("/:id", orderController.deleteOrder);
router.get("/stats/overview", orderController.getOrderStats);
module.exports = router;
