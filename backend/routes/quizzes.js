// server/routes/quizzes.js
const express = require("express");
const { celebrate, Joi, Segments } = require("celebrate");
const { authenticateJWT, authorizeRoles } = require("../middleware/auth");
const Quiz = require("../model/Quiz");
const Lecture = require("../model/Lecture");
const Course = require("../model/Course");
const router = express.Router();

// POST /api/quizzes
router.post(
  "/",
  authenticateJWT,
  authorizeRoles("teacher", "admin"),
  // Validation example (adjust to your schema)
  celebrate({
    [Segments.BODY]: Joi.object({
      course: Joi.string().length(24).hex().required(),
      lecture: Joi.string().length(24).hex().required(),
      title: Joi.string().min(3).required(),
      questions: Joi.array()
        .items(
          Joi.object({
            text: Joi.string().required(),
            options: Joi.array().items(Joi.string()).min(2).required(),
            correctOption: Joi.number().min(0).required(),
          })
        )
        .min(1)
        .required(),
    }),
  }),
  async (req, res) => {
    try {
      const { course, lecture, title, questions } = req.body;
      // Optionally check if course and lecture exist here

      const newQuiz = new Quiz({ course, lecture, title, questions });
      await newQuiz.save();

      res.status(201).json(newQuiz);
    } catch (err) {
      console.error("Error creating quiz:", err);
      res.status(500).json({ msg: "Server error creating quiz" });
    }
  }
);

/**
 * 1) List all quizzes for a course
 *    GET /api/quizzes/course/:courseId
 */
router.get(
  "/course/:courseId",
  celebrate({
    [Segments.PARAMS]: Joi.object({
      courseId: Joi.string().length(24).hex().required(),
    }),
  }),
  authenticateJWT,
  async (req, res) => {
    try {
      const quizzes = await Quiz.find({ course: req.params.courseId }).select(
        "-attempts"
      );
      return res.json(quizzes);
    } catch (err) {
      console.error("Error listing quizzes for course:", err);
      return res.status(500).json({ msg: "Server error" });
    }
  }
);

/**
 * 2) List all quizzes for a lecture
 *    GET /api/quizzes/lecture/:lectureId
 */
router.get("/lecture/:lectureId", authenticateJWT, async (req, res) => {
  try {
    const quizzes = await Quiz.find({ lecture: req.params.lectureId }).select(
      "-attempts"
    );
    return res.json(quizzes);
  } catch (err) {
    console.error("Error listing quizzes for lecture:", err);
    return res.status(500).json({ msg: "Server error" });
  }
});

/**
 * 3) Get a single quiz (for student to take)
 *    GET /api/quizzes/:quizId
 */
router.get(
  "/:quizId",
  celebrate({
    [Segments.PARAMS]: Joi.object({
      quizId: Joi.string().length(24).hex().required(),
    }),
  }),
  authenticateJWT,
  async (req, res) => {
    try {
      const quiz = await Quiz.findById(req.params.quizId).select("-attempts");
      if (!quiz) return res.status(404).json({ msg: "Quiz not found" });
      return res.json(quiz);
    } catch (err) {
      console.error("Error fetching quiz:", err);
      return res.status(500).json({ msg: "Server error" });
    }
  }
);

/**
 * 4) Student submits an attempt for a quiz
 *    POST /api/quizzes/:quizId/attempt
 */
router.post(
  "/:quizId/attempt",
  celebrate({
    [Segments.PARAMS]: Joi.object({
      quizId: Joi.string().length(24).hex().required(),
    }),
    [Segments.BODY]: Joi.object({
      answers: Joi.array().items(Joi.number().min(0)).required(),
    }),
  }),
  authenticateJWT,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const { quizId } = req.params;
      const { answers } = req.body;

      const quiz = await Quiz.findById(quizId);
      if (!quiz) return res.status(404).json({ msg: "Quiz not found" });

      // require lecture view
      const lecture = await Lecture.findById(quiz.lecture);
      if (!lecture) return res.status(500).json({ msg: "Missing lecture" });
      if (
        !Array.isArray(lecture.views) ||
        !lecture.views.some((v) => v.student.toString() === req.user.userId)
      ) {
        return res
          .status(403)
          .json({ msg: "You must view the lecture before attempting" });
      }

      // no re-attempts
      if (quiz.attempts.some((a) => a.student.equals(req.user.userId))) {
        return res
          .status(403)
          .json({ msg: "You have already submitted this quiz." });
      }

      // score
      let score = 0;
      quiz.questions.forEach((q, i) => {
        if (answers[i] === q.correctOption) score++;
      });
      quiz.attempts.push({
        student: req.user.userId,
        answers,
        score,
      });
      await quiz.save();

      return res.json({
        total: quiz.questions.length,
        score,
      });
    } catch (err) {
      console.error("Quiz attempt error:", err);
      return res.status(500).json({ msg: "Server error during attempt" });
    }
  }
);

/**
 * GET /api/quizzes/:quizId/attempts
 * - students see only their own attempt
 * - teachers & admins see all attempts
 */
router.get(
  "/:quizId/attempts",
  celebrate({
    [Segments.PARAMS]: Joi.object({
      quizId: Joi.string().length(24).hex().required(),
    }),
  }),
  authenticateJWT,
  authorizeRoles("student", "teacher", "admin"),
  async (req, res) => {
    try {
      const quiz = await Quiz.findById(req.params.quizId).populate(
        "attempts.student",
        "name email"
      );
      if (!quiz) return res.status(404).json({ msg: "Quiz not found" });

      if (req.user.role === "student") {
        // send only the current student's attempt
        const mine = quiz.attempts.filter((a) =>
          a.student._id.equals(req.user.userId)
        );
        return res.json(mine);
      }

      // teachers/admins get them all
      return res.json(quiz.attempts);
    } catch (err) {
      console.error("Error loading attempts:", err);
      return res.status(500).json({ msg: "Server error" });
    }
  }
);

module.exports = router;
