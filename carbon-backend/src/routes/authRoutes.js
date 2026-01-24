const express = require("express");
const router = express.Router();
const { register, verifyEmail, login, refreshToken } = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const { setLocation } = require("../controllers/authController");
const { getMe } = require("../controllers/authController");

const { logout } = require("../controllers/authController");

const passport = require("passport");
const { sendTokens } = require("../utils/generateTokens");
const User = require("../models/User")





router.post("/register", register);
router.get("/verify/:token", verifyEmail);
router.post("/login", login);
router.get("/refresh", refreshToken);
router.post("/set-location", protect, setLocation);
router.get("/me", protect, getMe);
router.get("/logout", logout);


router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    await sendTokens(req.user, res); // sets httpOnly cookie

   return res.redirect("http://localhost:5173/oauth-success");
   //return res.redirect(`${process.env.FRONTEND_URL}/oauth-success`);

  }
);

const { generateQRImage } = require("../controllers/eventController");
router.get("/qr/:eventId/:userId", generateQRImage);



module.exports = router;
