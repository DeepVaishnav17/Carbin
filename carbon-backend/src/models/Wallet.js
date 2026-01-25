const mongoose = require("mongoose");

const walletSchema = new mongoose.Schema(
  {
    wallet_address: String,
    walletAddress: String, // Added for compatibility
    label: String,
    user_id: mongoose.Schema.Types.ObjectId,
    user: mongoose.Schema.Types.ObjectId, // Added for compatibility
    created_at: Date,
  },
  { collection: "Wallets" } // EXACT name from screenshot
);


module.exports = mongoose.model("Wallet", walletSchema);
