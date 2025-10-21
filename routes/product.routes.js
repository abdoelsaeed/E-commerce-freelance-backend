const express = require("express");
const router = express.Router();
const upload = require("./../utils/multer");
const productController = require("./../controller/product.controller");
const authController = require("./../controller/auth.controller");
router.post(
  "/",
  authController.protect,
  authController.restricted("admin"),
  upload.fields([
    { name: "imageCover", maxCount: 1 },
    { name: "images", maxCount: 5 },
  ]),
  productController.createProduct
);
router.get("/:id",productController.getProductById);
router.get("/",productController.getAllProducts)
router.post('/search', productController.searchProducts);
router.delete("/:id",authController.protect,authController.restricted("admin"),productController.deleteProduct);
router.patch("/:id",authController.protect,authController.restricted("admin"),productController.updateProduct);
module.exports = router;
