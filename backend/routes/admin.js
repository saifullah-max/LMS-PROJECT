// server/routes/admin.js
const express = require("express");
const User = require("../model/User");
const Course = require("../model/Course");
const Quiz = require("../model/Quiz");
const Assignment = require("../model/Assignment");
const { authenticateJWT, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/admin/analytics
 * Admin-only: return site-wide metrics
 */
router.get(
  "/analytics",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      // 1) User counts by role
      const [students, teachers, admins] = await Promise.all([
        User.countDocuments({ role: "student" }),
        User.countDocuments({ role: "teacher" }),
        User.countDocuments({ role: "admin" }),
      ]);

      // 2) Total courses
      const totalCourses = await Course.countDocuments();

      // 3) Average quiz score per course
      const quizzes = await Quiz.find().populate("course", "title");
      const quizStats = {};
      quizzes.forEach((q) => {
        const scores = q.attempts.map((a) => a.score);
        const avg = scores.length
          ? scores.reduce((sum, s) => sum + s, 0) / scores.length
          : 0;
        quizStats[q.course._id] = {
          courseTitle: q.course.title,
          quizCount: (quizStats[q.course._id]?.quizCount || 0) + 1,
          totalAttempts:
            (quizStats[q.course._id]?.totalAttempts || 0) + scores.length,
          avgScore:
            ((quizStats[q.course._id]?.avgScore || 0) *
              (quizStats[q.course._id]?.quizCount || 0) +
              avg) /
            ((quizStats[q.course._id]?.quizCount || 0) + 1),
        };
      });

      // 4) Assignment submissions per course
      const assignments = await Assignment.find().populate("course", "title");
      const assignStats = {};
      assignments.forEach((a) => {
        const count = a.submissions.length;
        if (!assignStats[a.course._id]) {
          assignStats[a.course._id] = {
            courseTitle: a.course.title,
            submissionCount: 0,
          };
        }
        assignStats[a.course._id].submissionCount += count;
      });

      res.json({
        users: { students, teachers, admins },
        totalCourses,
        quizStats: Object.values(quizStats),
        assignmentStats: Object.values(assignStats),
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Analytics error", error: err.message });
    }
  }
);

// NEW: list all users
router.get(
  "/users",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const users = await User.find().select("-password");
      res.json(users);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Failed to list users" });
    }
  }
);

router.post(
  "/users",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { name, email, password, role } = req.body;
      if (!name || !email || !password || !role) {
        return res.status(400).json({ msg: "Missing fields" });
      }
      // create new user via the mongoose model
      const user = new User({ name, email, password, role });
      await user.save();
      // omit password in the response
      const { password: _, ...dto } = user.toObject();
      res.status(201).json(dto);
    } catch (err) {
      console.error(err);
      // duplicate email?
      if (err.code === 11000) {
        return res.status(400).json({ msg: "Email already exists" });
      }
      res.status(500).json({ msg: "Could not create user" });
    }
  }
);

// allow both teachers and admins to fetch all students
router.get(
  "/students",
  authenticateJWT,
  authorizeRoles("teacher", "admin"),
  async (req, res) => {
    try {
      const students = await User.find({ role: "student" }).select(
        "name email"
      );
      res.json(students);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Could not load students" });
    }
  }
);

module.exports = router;
