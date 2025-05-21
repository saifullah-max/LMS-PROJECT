// server/routes/admin.js
const express = require("express");
const User = require("../model/User");
const Course = require("../model/Course");
const Quiz = require("../model/Quiz");
const Assignment = require("../model/Assignment");
const { authenticateJWT, authorizeRoles } = require("../middleware/auth");
const bcrypt = require("bcryptjs");

const router = express.Router();

/**
 * Admin only: Return site-wide metrics, including courses.
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
      const quizStatsMap = {};
      quizzes.forEach((q) => {
        // **Guard**: skip if course not populated
        if (!q.course) return;

        const cid = q.course._id.toString();
        const scores = q.attempts.map((a) => a.score);
        const avgQuizScoreForThisQuiz =
          scores.length > 0
            ? scores.reduce((sum, s) => sum + s, 0) / scores.length
            : 0;

        if (!quizStatsMap[cid]) {
          quizStatsMap[cid] = {
            courseTitle: q.course.title,
            quizCount: 0,
            totalAttempts: 0,
            cumulativeScore: 0,
          };
        }

        quizStatsMap[cid].quizCount += 1;
        quizStatsMap[cid].totalAttempts += scores.length;
        quizStatsMap[cid].cumulativeScore += avgQuizScoreForThisQuiz;
      });

      // Convert map → array, computing final avgScore per course
      const quizStats = Object.values(quizStatsMap).map((stat) => ({
        courseTitle: stat.courseTitle,
        quizCount: stat.quizCount,
        totalAttempts: stat.totalAttempts,
        avgScore:
          stat.quizCount > 0
            ? Number((stat.cumulativeScore / stat.quizCount).toFixed(2))
            : 0,
      }));

      // 4) Assignment submissions per course
      const assignments = await Assignment.find().populate("course", "title");
      const assignStatsMap = {};
      assignments.forEach((a) => {
        if (!a.course) return;
        const cid = a.course._id.toString();
        const submissionCount = a.submissions.length;

        if (!assignStatsMap[cid]) {
          assignStatsMap[cid] = {
            courseTitle: a.course.title,
            submissionCount: 0,
          };
        }
        assignStatsMap[cid].submissionCount += submissionCount;
      });
      const assignmentStats = Object.values(assignStatsMap);

      // 5) Send everything
      res.json({
        users: { students, teachers, admins },
        totalCourses,
        quizStats,
        assignmentStats,
      });
    } catch (err) {
      console.error("Analytics error:", err);
      res.status(500).json({ msg: "Analytics error", error: err.message });
    }
  }
);

// Fetch all courses (Admin-only)
router.get(
  "/courses",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const courses = await Course.find().select("-students"); // You can also include or exclude fields as needed
      res.json(courses);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Failed to list courses" });
    }
  }
);

// Delete a course (Admin-only)
router.delete(
  "/courses/:courseId",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    const { courseId } = req.params;
    try {
      const course = await Course.findByIdAndDelete(courseId);
      if (!course) {
        return res.status(404).json({ msg: "Course not found" });
      }
      res.json({ msg: "Course deleted successfully" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Error deleting course" });
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

// @route   POST /api/admin/users
// @desc    Create a new user (Admin only)

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

      // Check if user already exists
      let user = await User.findOne({ email });
      if (user) {
        return res.status(400).json({ msg: "Email already exists" });
      }

      user = new User({
        name,
        email,
        password,
        role,
      });

      await user.save();

      // Send back a response without the password
      const { password: _, ...userWithoutPassword } = user.toObject();

      res.status(201).json(userWithoutPassword);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Could not create user" });
    }
  }
);

// @route   PATCH /api/admin/users/:userId
// @desc    Update user role (Admin only)
router.patch(
  "/users/:userId",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    const { role } = req.body;
    if (!role || !["student", "teacher", "admin"].includes(role)) {
      return res.status(400).json({ msg: "Invalid role" });
    }

    try {
      const user = await User.findById(req.params.userId);
      if (!user) return res.status(404).json({ msg: "User not found" });

      user.role = role;
      await user.save();

      res.json({ msg: "User role updated successfully", user });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Failed to update user role" });
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
