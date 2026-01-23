const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    unique: true,
    required: true,
  },
  walletAddress: {
    type: String,
    required: true,
  },
  totalCoins: {
    type: Number,
    default: 0,
  },
}, { timestamps: true });

module.exports = mongoose.model("Wallet", walletSchema);
