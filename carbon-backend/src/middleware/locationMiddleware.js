const User = require("../models/User");

const requireLocation = async (req, res, next) => {
  const user = await User.findById(req.user.id);

  if (!user.city || !user.apiCenter) {
    return res.status(403).json({ message: "Location required" });
  }

  next();
};

module.exports = requireLocation;
