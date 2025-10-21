// api/index.js
const serverless = require("serverless-http");
const app = require("../app"); // لا تغير المسار لو app.js موجود في root; لو في src غيره

module.exports = serverless(app);
