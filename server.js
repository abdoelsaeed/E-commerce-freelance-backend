const app = require("./app");

process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION! 💥", err);
});

// Run server locally only in development mode
if (process.env.NODE_ENV === "development") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
