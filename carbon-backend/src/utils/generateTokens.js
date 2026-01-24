// const jwt = require("jsonwebtoken");

// const generateAccessToken = (user) => {
//   return jwt.sign(
//     { id: user._id, role: user.role },
//     process.env.JWT_SECRET,
//     { expiresIn: "15m" }
//   );
// };

// const generateRefreshToken = (user) => {
//   return jwt.sign(
//     { id: user._id },
//     process.env.REFRESH_SECRET,
//     { expiresIn: "7d" }
//   );
// };

// const sendTokens = async (user, res) => {
//   const accessToken = generateAccessToken(user);
//   const refreshToken = generateRefreshToken(user);

//   user.refreshToken = refreshToken;
//   await user.save();

//   // ✅ Correct cookie settings for localhost HTTP
//   res.cookie("accessToken", accessToken, {
//     httpOnly: true,
//     secure: false,      // VERY IMPORTANT for localhost
//     sameSite: "lax",    // VERY IMPORTANT for localhost
//     path: "/",
//     maxAge: 15 * 60 * 1000,
//   });

//   res.cookie("refreshToken", refreshToken, {
//     httpOnly: true,
//     secure: false,
//     sameSite: "lax",
//     path: "/",
//     maxAge: 7 * 24 * 60 * 60 * 1000,
//   });
// };

// module.exports = { sendTokens };




const jwt = require("jsonwebtoken");

const isProd = process.env.NODE_ENV === "production";

const generateAccessToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
};

const generateRefreshToken = (user) => {
  return jwt.sign(
    { id: user._id },
    process.env.REFRESH_SECRET,
    { expiresIn: "7d" }
  );
};

const sendTokens = async (user, res) => {
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  user.refreshToken = refreshToken;
  await user.save();

  const cookieOptions = {
    httpOnly: true,
    secure: isProd,                 // false on localhost, true on Render
    sameSite: isProd ? "none" : "lax",
    path: "/",
  };

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

module.exports = { sendTokens };
