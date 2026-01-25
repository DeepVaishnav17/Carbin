const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
    },

    email: {
      type: String,
      required: true,
      unique: true,
    },

    password: {
      type: String,
    },

    googleId: {
      type: String,
    },

    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },

    isVerified: {
      type: Boolean,
      default: false,
    },

    city: {
      type: String,
    },

    apiCenter: {
      type: String,
    },

    walletAddress: {
      type: String,
    },

    refreshToken: {
      type: String,
    },
    walletCreated: {
  type: Boolean,
  default: false,
},

  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
