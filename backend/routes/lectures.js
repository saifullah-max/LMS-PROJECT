// server/routes/lectures.js
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Lecture = require("../model/Lecture");
const Course = require("../model/Course");
const { authenticateJWT, authorizeRoles } = require("../middleware/auth");
const { celebrate, Joi, Segments } = require("celebrate");

const router = express.Router();

// Multer disk storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const courseId = req.params.courseId;
    if (!courseId) {
      return cb(new Error("Missing courseId in URL"), null);
    }
    // uploads/lectures/<courseId> folder
    const uploadDir = path.join(
      __dirname,
      "..",
      "uploads",
      "lectures",
      courseId
    );
    fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // prepend timestamp to original filename
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

/**
 * @route   POST /api/lectures/:courseId
 * @desc    Upload a new lecture (video/pdf) and create its record
 * @access  Teacher/Admin
 *
 * Form-data fields:
 *  - file        : (File) the video or PDF
 *  - title       : (Text) lecture title
 *  - description : (Text, optional)
 *  - fileType    : (Text) either "video" or "pdf"
 */
router.post(
  "/:courseId",
  celebrate({
    [Segments.PARAMS]: Joi.object({
      courseId: Joi.string().length(24).hex().required(),
    }),
    // Note: file upload fields validated in code
    [Segments.BODY]: Joi.object({
      title: Joi.string().min(3).required(),
      description: Joi.string().allow("").optional().default(""),
      fileType: Joi.string().valid("video", "pdf").required(),
      difficulty: Joi.string().valid("easy", "medium", "hard").required(), // New field validation
    }),
  }),
  authenticateJWT,
  authorizeRoles("teacher", "admin"),
  upload.single("file"),
  async (req, res) => {
    try {
      const courseId = req.params.courseId;
      const { title, description, fileType, difficulty } = req.body;

      // 1) Verify course exists
      const course = await Course.findById(courseId);
      if (!course) return res.status(404).json({ msg: "Course not found" });

      // 2) Build file URL
      const filename = req.file.filename;
      const relativePath = path.join("uploads", "lectures", courseId, filename);
      const publicUrl = `${req.protocol}://${req.get("host")}/${relativePath}`;

      // 3) Create Lecture document
      const lecture = await Lecture.create({
        course: courseId,
        title,
        description,
        filePath: relativePath,
        fileType,
        offlineUrl: publicUrl,
        difficulty, // Store difficulty level
      });

      // 4) Attach lecture to course
      course.lectures.push(lecture._id);
      await course.save();

      // 5) Return the new lecture
      res.status(201).json(lecture);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

/**
 * @route   GET /api/lectures/course/:courseId
 * @desc    List all lectures for a given course
 * @access  Any authenticated user
 */

/**
 * List lectures for a course
 * GET /api/lectures/course/:courseId
 */
router.get("/course/:courseId", authenticateJWT, async (req, res) => {
  const lectures = await Lecture.find({ course: req.params.courseId }).select(
    "title difficulty"
  );
  res.json(lectures);
});

// ★ NEW: check if current student has viewed this lecture
router.get(
  "/:lectureId/status",
  authenticateJWT,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const lecture = await Lecture.findById(req.params.lectureId);
      if (!lecture) return res.status(404).json({ msg: "Lecture not found" });

      const viewed = lecture.views.some((v) =>
        v.student.equals(req.user.userId)
      );
      return res.json({ viewed });
    } catch (err) {
      console.error("Lecture status error:", err);
      return res.status(500).json({ msg: "Server error" });
    }
  }
);

// GET /api/lectures/:lectureId/view
router.get(
  "/:lectureId/view",
  authenticateJWT,
  authorizeRoles("student"),
  async (req, res) => {
    const lec = await Lecture.findById(req.params.lectureId);
    if (!lec) return res.status(404).json({ msg: "Lecture not found" });

    if (!lec.views.some((v) => v.student.equals(req.user.userId))) {
      lec.views.push({ student: req.user.userId });
      await lec.save();
    }

    res.json(lec);
  }
);

// POST /api/lectures/:lectureId/view
router.post(
  "/:lectureId/view",
  celebrate({
    [Segments.PARAMS]: Joi.object({
      lectureId: Joi.string().length(24).hex().required(),
    }),
  }),
  authenticateJWT,
  async (req, res) => {
    const lecture = await Lecture.findById(req.params.lectureId);
    if (!lecture) return res.status(404).json({ msg: "Lecture not found" });

    if (!lecture.views.some((v) => v.student.equals(req.user.userId))) {
      lecture.views.push({ student: req.user.userId, viewedAt: new Date() });
      await lecture.save();
    }
    res.json({ ok: true });
  }
);

module.exports = router;
