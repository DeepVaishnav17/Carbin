const express = require("express");
const router = express.Router();
const axios = require("axios");
const mongoose = require("mongoose");

const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Event = require("../models/Event");

const { protect, adminOnly } = require("../middleware/authMiddleware");

// Helper to handle Axios errors
const handleAxiosError = (err, res, defaultMsg) => {
    console.error(err.response?.data || err.message);
    res.status(500).json({ message: defaultMsg });
};

// Helper to find wallet promiscuously (user OR user_id)
const findWalletByUser = async (userId) => {
    return await Wallet.findOne({
        $or: [
            { user: userId },
            { user_id: userId }
        ]
    }).lean();
};

// Helper to get address from doc (walletAddress OR wallet_address)
const getAddressFromDoc = (doc) => {
    if (!doc) return null;
    return doc.walletAddress || doc.wallet_address || doc.address;
};

// ✅ GET USER WALLET ADDRESS (Dedicated endpoint)
router.get("/address", protect, async (req, res) => {
    try {
        const walletDoc = await findWalletByUser(req.user.id);
        const address = getAddressFromDoc(walletDoc);

        if (!address) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        res.json({ walletAddress: address });
    } catch (err) {
        console.error("Error fetching address:", err);
        res.status(500).json({ message: "Failed to fetch address" });
    }
});

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

        // Save wallet to local DB
        const walletAddress = response.data.wallet_address || response.data.address;
        const addressToSave = walletAddress || "0x_PENDING_" + user._id;

        // Create with BOTH schemas to be safe/future-proof given the confusion
        await Wallet.create({
            user: user._id,
            user_id: user._id,
            walletAddress: addressToSave,
            wallet_address: addressToSave
        });

        user.walletCreated = true;
        user.walletAddress = addressToSave;
        await user.save();

        res.json({
            message: "Wallet created successfully",
            blockchainResponse: response.data,
            walletAddress: addressToSave
        });
    } catch (err) {
        handleAxiosError(err, res, "Wallet creation failed");
    }
});


// ✅ GET BALANCE (for logged-in user)
router.get("/balance", protect, async (req, res) => {
    try {
        const walletDoc = await findWalletByUser(req.user.id);

        if (!walletDoc) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        const address = getAddressFromDoc(walletDoc);

        const response = await axios.get(
            `${process.env.BLOCKCHAIN_API_URL}/api/balance`,
            {
                params: { wallet: address },
            }
        );

        // Return blockchain data merged with wallet address
        res.json({
            ...response.data,
            walletAddress: address // Explicitly send address (frontend expects 'walletAddress')
        });
    } catch (err) {
        handleAxiosError(err, res, "Failed to fetch balance");
    }
});


// ✅ GET TRANSACTIONS (for logged-in user)
router.get("/transactions", protect, async (req, res) => {
    try {
        const walletDoc = await findWalletByUser(req.user.id);

        if (!walletDoc) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        const address = getAddressFromDoc(walletDoc);

        const response = await axios.get(
            `${process.env.BLOCKCHAIN_API_URL}/api/transactions`,
            {
                params: {
                    wallet: address,
                    limit: 10,
                },
            }
        );

        res.json(response.data);
    } catch (err) {
        handleAxiosError(err, res, "Failed to fetch transactions");
    }
});


// ✅ ASSIGN COINS (admin)
router.post("/assign", protect, adminOnly, async (req, res) => {
    try {
        const { userId, coins, eventId } = req.body;

        const walletDoc = await findWalletByUser(userId);

        if (!walletDoc) {
            return res.status(404).json({ message: "Wallet not found" });
        }

        const address = getAddressFromDoc(walletDoc);

        const response = await axios.post(
            process.env.BLOCKCHAIN_REWARD_API,
            {
                user_address: address,
                amount: Number(coins),
            }
        );

        // mark rewarded in event
        await Event.findByIdAndUpdate(eventId, {
            $addToSet: { rewardedUsers: userId },
        });

        res.json({ data: response.data });
    } catch (err) {
        handleAxiosError(err, res, "Failed to assign coins");
    }
});


// ✅ GET WALLET ADDRESS FOR ANY USER (ADMIN PAGE)
router.get("/:userId", protect, adminOnly, async (req, res) => {
    try {
        if (!mongoose.Types.ObjectId.isValid(req.params.userId)) {
            return res.json({ walletAddress: null });
        }

        const walletDoc = await findWalletByUser(req.params.userId);

        if (!walletDoc) {
            return res.json({ walletAddress: null });
        }

        res.json({ walletAddress: getAddressFromDoc(walletDoc) });
    } catch {
        res.json({ walletAddress: null });
    }
});

module.exports = router;
