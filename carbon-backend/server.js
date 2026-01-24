// const express = require("express");
// const dotenv = require("dotenv");
// const cors = require("cors");
// const cookieParser = require("cookie-parser");
// const mongoose = require("mongoose");
// const connectDB = require("./src/config/db");
// const { protect } = require("./src/middleware/authMiddleware");
// const allowedOrigin = process.env.FRONTEND_URL;

// dotenv.config();
// connectDB();


// const app = express();

// app.set("trust proxy", 1);

// // app.use(
// //   cors({
// //    origin: [
// //   //"http://localhost:5173",
// //   //process.env.FRONTEND_URL, // Vercel in prod
// //    //process.env.BACKEND_URL,
// //      "https://carbin-zeta.vercel.app",
// // ]
// // ,

// //     credentials: true,
// //   })
// // );
// // app.use(
// //   cors({
// //    // origin: "https://carbin-zeta.vercel.app",
// //    orgin: true,
// //     credentials: true,
// //   })
// // );
// const allowedOrigin = process.env.FRONTEND_URL;

// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Origin", allowedOrigin);
//   res.header("Access-Control-Allow-Credentials", "true");
//   res.header(
//     "Access-Control-Allow-Headers",
//     "Origin, X-Requested-With, Content-Type, Accept"
//   );
//   res.header(
//     "Access-Control-Allow-Methods",
//     "GET, POST, PUT, DELETE, OPTIONS"
//   );

//   if (req.method === "OPTIONS") {
//     return res.sendStatus(200);
//   }

//   next();
// });





// // app.use((req, res, next) => {
// //   res.header("Access-Control-Allow-Credentials", "true");
// //   next();
// // });


// app.use(express.json());
// app.use(cookieParser());  


// const passport = require("./src/config/passport");
// app.use(passport.initialize());

// // app.use(
// //   cors({
// //    origin: [
// //   "http://localhost:5173",
// //   "https://unsterilized-nifty-porsha.ngrok-free.dev"
// // ]
// // ,

// //     credentials: true,
// //   })
// // );

// app.get("/", (req, res) => {
//   res.send("Carbon Emission Backend Running");
// });

// app.get("/api/protected", protect, (req, res) => {
//   res.json({
//     message: "You are authorized",
//     user: req.user,
//   });
// });



// const authRoutes = require("./src/routes/authRoutes");
// app.use("/api/auth", authRoutes);

// const eventRoutes = require("./src/routes/eventRoutes");
// app.use("/api/events", eventRoutes);



// const walletRoutes = require("./src/routes/walletRoutes");
// app.use("/api/wallet", walletRoutes);


// const PORT = process.env.PORT || 5000;
// app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

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

// ✅ Proper CORS for Render + Vercel + cookies
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

app.use(express.json());
app.use(cookieParser());

// Passport
const passport = require("./src/config/passport");
app.use(passport.initialize());

// Test route
app.get("/", (req, res) => {
  res.send("Carbon Emission Backend Running");
});

// Protected test
app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "You are authorized",
    user: req.user,
  });
});

// Routes
const authRoutes = require("./src/routes/authRoutes");
app.use("/api/auth", authRoutes);

const eventRoutes = require("./src/routes/eventRoutes");
app.use("/api/events", eventRoutes);

const walletRoutes = require("./src/routes/walletRoutes");
app.use("/api/wallet", walletRoutes);

// ⭐ VERY IMPORTANT FOR RENDER
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
