require("dotenv").config();
const { appendLeadToSheet } = require("./utils/googleSheet");

appendLeadToSheet({
  name: "Test User",
  phone: "9999999999",
  message: "Hello from test",
  timestamp: new Date().toISOString(),
});
