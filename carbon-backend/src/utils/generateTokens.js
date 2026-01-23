const jwt = require("jsonwebtoken");
const isProd = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
};


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
    secure: isProd,
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

// const sendTokens = async (user, res) => {
//   const accessToken = generateAccessToken(user);
//   const refreshToken = generateRefreshToken(user);

//   user.refreshToken = refreshToken;
//   await user.save();

//   const cookieOptions = {
//     httpOnly: true,
//     secure: true,       // ✅ correct spelling
//     sameSite: "none",   // ✅ required for ngrok
//   };

//   res.cookie("accessToken", accessToken, {
//     ...cookieOptions,
//     maxAge: 15 * 60 * 1000,
//   });

//   res.cookie("refreshToken", refreshToken, {
//     ...cookieOptions,
//     maxAge: 7 * 24 * 60 * 60 * 1000,
//   });
// };


module.exports = { sendTokens };
