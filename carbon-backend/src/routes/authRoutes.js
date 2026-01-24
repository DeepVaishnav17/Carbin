const express = require("express");
const router = express.Router();
const { register, verifyEmail, login, refreshToken  } = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");
const { setLocation } = require("../controllers/authController");
const { getMe } = require("../controllers/authController");

const { logout } = require("../controllers/authController");

const passport = require("passport");
const { sendTokens } = require("../utils/generateTokens");






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
// router.get(
//   "/google/callback",
//   passport.authenticate("google", { session: false }),
//   async (req, res) => {
//     await sendTokens(req.user, res);

//     if (req.user.role === "admin") {
//       return res.redirect(`${process.env.FRONTEND_URL}/admin`);
//     } else if (!req.user.city) {
//       return res.redirect(`${process.env.FRONTEND_URL}/location`);
//     } else {
//       return res.redirect(`${process.env.FRONTEND_URL}`);
//     }
//   }
// );
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  async (req, res) => {
    await sendTokens(req.user, res);

    // 🔥 ALWAYS go here after OAuth
    return res.redirect(`${process.env.FRONTEND_URL}/oauth-success`);
  }
);





module.exports = router;
