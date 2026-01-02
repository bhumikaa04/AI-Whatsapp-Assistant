const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: String,
    phone: {
      type: String,
      unique: true,
      required: true,
    },
    firstMessage: String,
    source: {
      type: String,
      default: "whatsapp",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
