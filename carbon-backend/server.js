const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const connectDB = require("./src/config/db");
const { protect } = require("./src/middleware/authMiddleware");

dotenv.config();
connectDB();

const app = express();
app.set("trust proxy", 1);

// ✅ Body & cookies
app.use(express.json());
app.use(cookieParser());

// ✅ Proper CORS for localhost
const allowedOrigin = process.env.FRONTEND_URL;

app.use(
  cors({
   origin: "http://localhost:5173",
   //origin: allowedOrigin,
    credentials: true,
  })
);

// ✅ Passport
const passport = require("./src/config/passport");
app.use(passport.initialize());

// ✅ Routes
app.get("/", (req, res) => {
  res.send("Carbon Emission Backend Running");
});

app.get("/api/protected", protect, (req, res) => {
  res.json({ message: "You are authorized", user: req.user });
});

const authRoutes = require("./src/routes/authRoutes");
app.use("/api/auth", authRoutes);

const eventRoutes = require("./src/routes/eventRoutes");
app.use("/api/events", eventRoutes);

// const walletRoutes = require("./src/routes/walletRoutes");
// app.use("/api/wallet", walletRoutes);


app.use("/api/wallet", require("./src/routes/wallet"));


console.log("FRONTEND_URL:", process.env.FRONTEND_URL);


// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
