const app = require("./app");
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥", err);
  // يمكنك هنا إرسال الخطأ للـ globalErrorHandler أو إغلاق السيرفر بأمان
});
const PORT = process.env.PORT || 3000;
app.listen(PORT,()=>{
    console.log(`Server running on port ${PORT}`);
})
