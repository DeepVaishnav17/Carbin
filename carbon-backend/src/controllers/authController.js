const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const { sendTokens } = require("../utils/generateTokens");

exports.register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      isVerified: true, // ✅ Auto-verify
    });

    // Instead of email, just log them in or say success
    await sendTokens(user, res);
    res.status(201).json({ message: "Registration successful" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyEmail = async (req, res) => {
  // Deprecated but kept for compatibility if needed
  res.status(200).send("Email verification is disabled.");
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    // if (!user.isVerified) {
    //   return res.status(400).json({ message: "Please verify your email first" });
    // }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    await sendTokens(user, res);
    return res.json({ message: "Login successful" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const token = req.cookies.refreshToken;

    if (!token) {
      return res.status(401).json({ message: "No refresh token" });
    }

    const decoded = jwt.verify(token, process.env.REFRESH_SECRET);

    const user = await User.findById(decoded.id);

    if (!user || user.refreshToken !== token) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    await sendTokens(user, res);
    return res.json({ message: "Token refreshed" });

  } catch (err) {
    res.status(403).json({ message: "Refresh token expired" });
  }
};

exports.setLocation = async (req, res) => {
  try {
    const { city, apiCenter } = req.body;

    await User.findByIdAndUpdate(req.user.id, {
      city,
      apiCenter,
    });

    res.json({ message: "Location saved" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const Wallet = require("../models/Wallet");

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    // Self-healing: If wallet is created but address is missing in User
    if (user.walletCreated && !user.walletAddress) {
      const wallet = await Wallet.findOne({
        $or: [{ user: user._id }, { user_id: user._id }]
      }).lean();

      if (wallet) {
        // Fallback for address field name
        user.walletAddress = wallet.walletAddress || wallet.wallet_address || wallet.address;
        await user.save();
      }
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Error fetching user" });
  }
};
exports.logout = async (req, res) => {
  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");
  res.json({ message: "Logged out" });
};
