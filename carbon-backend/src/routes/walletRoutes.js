const express = require("express");
const router = express.Router();
const { protect, adminOnly } = require("../middleware/authMiddleware");
const { setWalletForUser, assignCoins, getWalletByUserId  } = require("../controllers/walletController");

router.post("/set", protect, adminOnly, setWalletForUser);
router.post("/assign", protect, adminOnly, assignCoins);

router.get("/:userId", protect, adminOnly, getWalletByUserId);

module.exports = router;
