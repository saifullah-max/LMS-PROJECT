// server/routes/offline.js
const express = require("express");
const Course = require("../model/Course");
const Lecture = require("../model/Lecture");
const Quiz = require("../model/Quiz");
const Assignment = require("../model/Assignment");
const { authenticateJWT, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

/**
 * GET /api/offline/data
 * Student-only: return all the courses, lectures, quizzes and assignments
 * the student is enrolled in, with URLs for offline caching.
 */
router.get(
  "/data",
  authenticateJWT,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const studentId = req.user.userId;

      // 1) Courses the student is enrolled in
      const courses = await Course.find({ students: studentId }).select(
        "_id title"
      );

      // 2) Lectures in those courses
      const courseIds = courses.map((c) => c._id);
      const lectures = await Lecture.find({
        course: { $in: courseIds },
      }).select("course title offlineUrl fileType");

      // 3) Quizzes (structure only, no attempts)
      const quizzes = await Quiz.find({ course: { $in: courseIds } }).select(
        "course title questions"
      );

      // 4) Assignments spec URLs & dueDates
      const assignments = await Assignment.find({
        course: { $in: courseIds },
      }).select("course title description dueDate filePath");

      res.json({
        courses,
        lectures: lectures.map((l) => ({
          id: l._id,
          course: l.course,
          title: l.title,
          url: l.offlineUrl,
          fileType: l.fileType,
        })),
        quizzes: quizzes.map((q) => ({
          id: q._id,
          course: q.course,
          title: q.title,
          questions: q.questions,
        })),
        assignments: assignments.map((a) => ({
          id: a._id,
          course: a.course,
          title: a.title,
          description: a.description,
          dueDate: a.dueDate,
          url: a.filePath,
        })),
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Offline data error", error: err.message });
    }
  }
);

module.exports = router;
