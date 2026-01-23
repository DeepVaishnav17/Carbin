const Wallet = require("../models/Wallet");

// Admin sets/updates wallet address for any user
exports.setWalletForUser = async (req, res) => {
  try {
    const { userId, walletAddress } = req.body;

    let wallet = await Wallet.findOne({ user: userId });

    if (wallet) {
      wallet.walletAddress = walletAddress;
      await wallet.save();
    } else {
      wallet = await Wallet.create({
        user: userId,
        walletAddress,
      });
    }

    res.json({ message: "Wallet saved", wallet });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Admin assigns coins
exports.assignCoins = async (req, res) => {
  try {
    const { userId, coins } = req.body;

    const wallet = await Wallet.findOne({ user: userId });

    if (!wallet) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    wallet.totalCoins += Number(coins);
    await wallet.save();

    res.json({ message: "Coins assigned", wallet });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getWalletByUserId = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.params.userId });

    if (!wallet) {
      return res.json({ walletAddress: null, totalCoins: 0 });
    }

    res.json(wallet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
