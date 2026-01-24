const express = require("express");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const connectDB = require("./src/config/db");
const { protect } = require("./src/middleware/authMiddleware");

dotenv.config();
connectDB();

const app = express();
app.set("trust proxy", 1);

const allowedOrigin = process.env.FRONTEND_URL;

// ✅ Body & cookies FIRST
app.use(express.json());
app.use(cookieParser());

// ✅ CORS AFTER cookies
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  res.header(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }

  next();
});

// Passport
const passport = require("./src/config/passport");
app.use(passport.initialize());

// Routes
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

const walletRoutes = require("./src/routes/walletRoutes");
app.use("/api/wallet", walletRoutes);

// Render port
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
