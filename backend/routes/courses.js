const express = require("express");
const Course = require("../model/Course");
const User = require("../model/User"); // ← import User
const Lecture = require("../model/Lecture");
const Quiz = require("../model/Quiz");
const Assignment = require("../model/Assignment");
const { authenticateJWT, authorizeRoles } = require("../middleware/auth");
const router = express.Router();
const { celebrate, Joi, Segments } = require("celebrate");

// Create a new course (teachers + admins)
router.post(
  "/",
  celebrate({
    [Segments.BODY]: Joi.object({
      title: Joi.string().min(3).required(),
      description: Joi.string().allow("").optional(),
    }),
  }),
  authenticateJWT,
  authorizeRoles("teacher", "admin"),
  async (req, res) => {
    const { title, description } = req.body;
    try {
      const course = new Course({
        title,
        description,
        teacher: req.user.userId,
      });
      await course.save();
      res.status(201).json(course);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

// GET /api/courses        — your “list my courses” endpoint
router.get("/", authenticateJWT, async (req, res) => {
  let filter = {};
  if (req.user.role === "teacher") {
    filter.teacher = req.user.userId;
  } else if (req.user.role === "student") {
    filter.students = req.user.userId;
  }
  const courses = await Course.find(filter).populate("teacher", "name");
  res.json(courses);
});

// GET /api/courses/:id    — any enrolled student or assigned teacher/admin
router.get("/:id", authenticateJWT, async (req, res) => {
  const course = await Course.findById(req.params.id)
    .populate("teacher", "name email")
    .populate("students", "name email")
    .populate({ path: "lectures", select: "title offlineUrl" })
    .populate({ path: "quizzes", select: "title" })
    .populate({ path: "assignments", select: "title" });
  if (!course) return res.status(404).json({ msg: "Not found" });

  const uid = req.user.userId;
  if (
    req.user.role === "admin" ||
    course.teacher._id.equals(uid) ||
    course.students.some((s) => s._id.equals(uid))
  ) {
    return res.json(course);
  }
  res.status(403).json({ msg: "Forbidden" });
});

// GET /api/courses/:id/progress
router.get(
  "/:courseId/progress",
  authenticateJWT,
  authorizeRoles("teacher"),
  async (req, res) => {
    try {
      const { courseId } = req.params;

      // 1) find all students enrolled in this course
      //    (you'll need some enrollment model or array on Course)
      const course = await Course.findById(courseId).populate(
        "students",
        "name email"
      );
      if (!course) return res.status(404).json({ msg: "Course not found" });

      const students = course.students;

      // 2) for each student, compute:
      const results = await Promise.all(
        students.map(async (stu) => {
          // lecturesPct: fraction of lectures they’ve viewed
          const totalLectures = await Lecture.countDocuments({
            course: courseId,
          });
          const viewedCount = await Lecture.countDocuments({
            course: courseId,
            "views.student": stu._id, // however you track views
          });
          const lecturesPct = totalLectures
            ? (viewedCount / totalLectures) * 100
            : 0;

          // quizzesPct & avgScore
          const quizzes = await Quiz.find({ course: courseId });
          let done = 0,
            sumScore = 0;
          quizzes.forEach((q) => {
            const att = q.attempts.find(
              (a) => a.student.toString() === stu._id.toString()
            );
            if (att) {
              done++;
              sumScore += (att.score / q.questions.length) * 100;
            }
          });
          const quizzesPct = quizzes.length ? (done / quizzes.length) * 100 : 0;
          const avgScore = done ? sumScore / done : null;

          // assignmentsSubmitted / totalAssignments
          const assignments = await Assignment.find({ course: courseId });
          let submitted = 0;
          assignments.forEach((a) => {
            if (
              a.submissions.find(
                (s) => s.student.toString() === stu._id.toString()
              )
            ) {
              submitted++;
            }
          });

          return {
            student: stu,
            lecturesPct,
            quizzesPct,
            avgScore,
            assignmentsSubmitted: submitted,
            totalAssignments: assignments.length,
          };
        })
      );

      res.json(results);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Progress load error", error: err.message });
    }
  }
);

router.get('/course/:courseId/progress', authenticateJWT, async (req, res) => {
  try {
    const courseId = req.params.courseId;
    const studentId = req.user.userId;

    // Check if student has viewed all lectures in the course
    const lectures = await Lecture.find({ course: courseId });
    const viewedLectures = lectures.filter((lecture) =>
      lecture.views.some((view) => view.student.toString() === studentId)
    );
    const lecturesPct = (viewedLectures.length / lectures.length) * 100;

    // Check if final exam exists
    const finalExam = await Quiz.findOne({ course: courseId, isFinal: true });

    res.json({
      lecturesPct, // Percentage of lectures completed
      finalExamAvailable: lecturesPct === 100 && finalExam !== null, // Final exam available if all lectures are viewed
    });
  } catch (err) {
    console.error("Error fetching progress:", err);
    res.status(500).json({ msg: "Server error" });
  }
});


// ─── REMOVE THIS BLOCK ──────────────────────────────────────────────────────────
// // Enroll student in a course (student self-enroll)
// router.post(
//   "/:courseId/enroll",
//   authenticateJWT,
//   authorizeRoles("student"),
//   async (req, res) => {
//     try {
//       const course = await Course.findById(req.params.courseId);
//       if (!course) return res.status(404).json({ msg: "Course not found" });
//       if (!course.students.includes(req.user.userId)) {
//         course.students.push(req.user.userId);
//         await course.save();
//       }
//       res.json(course);
//     } catch (err) {
//       console.error(err);
//       res.status(500).json({ msg: "Server error" });
//     }
//   }
// );
// ────────────────────────────────────────────────────────────────────────────────

// ─── ADD THIS BLOCK ─────────────────────────────────────────────────────────────
/**
 * @route   POST /api/courses/:courseId/assign-student
 * @desc    Admin assigns a student to a course
 * @access  Admin only
 */
// POST /api/courses/:courseId/assign-students
router.post(
  "/:courseId/assign-students",
  authenticateJWT,
  authorizeRoles("teacher", "admin"),
  async (req, res) => {
    const { studentIds } = req.body; // expect an array
    const course = await Course.findById(req.params.courseId);
    if (!course) return res.status(404).json({ msg: "Course not found" });
    // filter only valid students not already enrolled
    const adds = studentIds.filter((id) => !course.students.includes(id));
    course.students.push(...adds);
    await course.save();
    const populated = await Course.findById(course._id).populate(
      "students",
      "name email"
    );
    res.json(populated);
  }
);
// ────────────────────────────────────────────────────────────────────────────────

module.exports = router;
