const express = require("express");
const router = express.Router();
const axios = require("axios");
const mongoose = require("mongoose");

const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Event = require("../models/Event");

const { protect, adminOnly } = require("../middleware/authMiddleware");


// ✅ CREATE WALLET
router.post("/create", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (user.walletCreated) {
      return res.json({ message: "Wallet already exists" });
    }

    const response = await axios.post(
      `${process.env.BLOCKCHAIN_API_URL}/create_wallet`,
      {
        userName: user.email,
        userId: user._id.toString(),
      }
    );

    user.walletCreated = true;
    await user.save();

    res.json({
      message: "Wallet created successfully",
      blockchainResponse: response.data,
    });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: "Wallet creation failed" });
  }
});


// ✅ GET BALANCE (for logged-in user)
router.get("/balance", protect, async (req, res) => {
  try {
    const walletDoc = await Wallet.findOne({
      user_id: new mongoose.Types.ObjectId(req.user.id),
    });

    if (!walletDoc) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const response = await axios.get(
      `${process.env.BLOCKCHAIN_API_URL}/api/balance`,
      {
        params: { wallet: walletDoc.wallet_address },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: "Failed to fetch balance" });
  }
});


// ✅ GET TRANSACTIONS (for logged-in user)
router.get("/transactions", protect, async (req, res) => {
  try {
    const walletDoc = await Wallet.findOne({
      user_id: new mongoose.Types.ObjectId(req.user.id),
    });

    if (!walletDoc) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const response = await axios.get(
      `${process.env.BLOCKCHAIN_API_URL}/api/transactions`,
      {
        params: {
          wallet: walletDoc.wallet_address,
          limit: 10,
        },
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: "Failed to fetch transactions" });
  }
});


// ✅ ASSIGN COINS (admin)
router.post("/assign", protect, adminOnly, async (req, res) => {
  try {
    const { userId, coins, eventId } = req.body;

    const walletDoc = await Wallet.findOne({
      user_id: new mongoose.Types.ObjectId(userId),
    });

    if (!walletDoc) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const response = await axios.post(
      process.env.BLOCKCHAIN_REWARD_API,
      {
        user_address: walletDoc.wallet_address,
        amount: Number(coins),
      }
    );

    // mark rewarded in event
    await Event.findByIdAndUpdate(eventId, {
      $addToSet: { rewardedUsers: userId },
    });

    res.json({ data: response.data });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: "Failed to assign coins" });
  }
});


// ✅ GET WALLET ADDRESS FOR ANY USER (ADMIN PAGE)
router.get("/:userId", protect, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
      return res.json({ walletAddress: null });
    }

    const walletDoc = await Wallet.findOne({
      user_id: new mongoose.Types.ObjectId(req.params.userId),
    });

    if (!walletDoc) {
      return res.json({ walletAddress: null });
    }

    res.json({ walletAddress: walletDoc.wallet_address });
  } catch {
    res.json({ walletAddress: null });
  }
});

module.exports = router;
