const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../model/User");
const router = express.Router();
const { celebrate, Joi, Segments } = require("celebrate");

const crypto = require("crypto");
const { sendOTPEmail } = require("../utils/mailer");

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = "7d"; // adjust as needed

// @route   POST /api/auth/register
// @desc    Create a new user
router.post(
  "/register",
  celebrate({
    [Segments.BODY]: Joi.object({
      name: Joi.string().min(2).max(50).required(),
      email: Joi.string().email().required(),
      password: Joi.string().min(6).required(),
      role: Joi.string().valid("student", "teacher", "admin").required(),
    }),
  }),
  async (req, res) => {
    const { name, email, password, role } = req.body;
    try {
      let user = await User.findOne({ email });
      if (user)
        return res.status(400).json({ msg: "Email already registered" });

      user = new User({ name, email, password, role });
      await user.save();

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        JWT_SECRET,
        {
          expiresIn: JWT_EXPIRES_IN,
        }
      );

      res.status(201).json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
router.post(
  "/login",
  celebrate({
    [Segments.BODY]: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
    }),
  }),
  async (req, res) => {
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email }).select("+password");
      if (!user) return res.status(400).json({ msg: "Invalid credentials" });

      const isMatch = await user.comparePassword(password);
      if (!isMatch) return res.status(400).json({ msg: "Invalid credentials" });

      // strip password out before sending response
      const { password: pw, ...userSafe } = user.toObject();

      const token = jwt.sign(
        { userId: user._id, role: user.role },
        JWT_SECRET,
        {
          expiresIn: JWT_EXPIRES_IN,
        }
      );

      res.json({
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// @route   GET /api/auth/me
// @desc    Get logged-in user
// @access  Private
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token)
    return res.status(401).json({ msg: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { userId, role, iat, exp }
    next();
  } catch {
    res.status(401).json({ msg: "Token is not valid" });
  }
};

router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-password");
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * POST /api/auth/request-reset
 * Body: { email }
 */
router.post("/request-reset", async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    return res.status(404).json({ msg: "No user found with that email" });
  }

  // Generate a random 6-digit code
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  user.resetOTP = otp;
  user.resetOTPExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  try {
    await sendOTPEmail(email, otp);
    res.json({ msg: "OTP sent to your email" });
  } catch (err) {
    console.error("Error sending OTP email:", err);
    res.status(500).json({ msg: "Failed to send OTP email" });
  }
});

/**
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 */
router.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.resetOTP !== otp || user.resetOTPExpires < Date.now()) {
    return res.status(400).json({ msg: "Invalid or expired OTP" });
  }
  res.json({ msg: "OTP verified" });
});

/**
 * POST /api/auth/reset-password
 * Body: { email, otp, newPassword }
 */
router.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const user = await User.findOne({ email });
  if (!user || user.resetOTP !== otp || user.resetOTPExpires < Date.now()) {
    return res.status(400).json({ msg: "Invalid or expired OTP" });
  }

  user.password = newPassword;
  user.resetOTP = undefined;
  user.resetOTPExpires = undefined;
  await user.save();

  res.json({ msg: "Password has been reset" });
});

module.exports = router;
