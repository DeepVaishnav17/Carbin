const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
const connectDB = require("./src/config/db");
const { protect } = require("./src/middleware/authMiddleware");


dotenv.config();
connectDB();


const app = express();

app.set("trust proxy", 1);

// app.use(
//   cors({
//    origin: [
//   //"http://localhost:5173",
//   //process.env.FRONTEND_URL, // Vercel in prod
//    //process.env.BACKEND_URL,
//      "https://carbin-zeta.vercel.app",
// ]
// ,

//     credentials: true,
//   })
// );
app.use(
  cors({
    origin: "https://carbin-zeta.vercel.app",
    credentials: true,
  })
);


// app.use((req, res, next) => {
//   res.header("Access-Control-Allow-Credentials", "true");
//   next();
// });


app.use(express.json());
app.use(cookieParser());


const passport = require("./src/config/passport");
app.use(passport.initialize());

// app.use(
//   cors({
//    origin: [
//   "http://localhost:5173",
//   "https://unsterilized-nifty-porsha.ngrok-free.dev"
// ]
// ,

//     credentials: true,
//   })
// );

app.get("/", (req, res) => {
  res.send("Carbon Emission Backend Running");
});

app.get("/api/protected", protect, (req, res) => {
  res.json({
    message: "You are authorized",
    user: req.user,
  });
});



const authRoutes = require("./src/routes/authRoutes");
app.use("/api/auth", authRoutes);

const eventRoutes = require("./src/routes/eventRoutes");
app.use("/api/events", eventRoutes);



const walletRoutes = require("./src/routes/walletRoutes");
app.use("/api/wallet", walletRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
