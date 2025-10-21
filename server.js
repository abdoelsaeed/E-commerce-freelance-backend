// server.js
const app = require("./app");

const startServer = () => {
  const PORT = process.env.PORT || 3000;
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Optional: graceful shutdown on unhandledRejection
  process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED REJECTION! 💥", err);
    server.close(() => {
      process.exit(1);
    });
  });
};

// If this file is run directly (node server.js), start the HTTP server.
// If it's required by another module (eg. serverless wrapper), DON'T call listen.
if (require.main === module) {
  startServer();
}

// Export app so serverless wrapper can use it
module.exports = app;
