// server/routes/users.js
const express = require("express");
const User = require("../model/User");
const { authenticateJWT, authorizeRoles } = require("../middleware/auth");
const router = express.Router();

// GET /api/users
// Optional query: ?role=student|teacher|admin
router.get(
  "/",
  authenticateJWT,
  authorizeRoles("admin", "teacher"),
  async (req, res) => {
    try {
      const filter = {};
      if (req.query.role) {
        filter.role = req.query.role;
      }
      const users = await User.find(filter).select("name email role");
      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

module.exports = router;
