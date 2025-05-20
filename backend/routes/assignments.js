// server/routes/assignments.js
const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { celebrate, Joi, Segments } = require("celebrate");
const { authenticateJWT, authorizeRoles } = require("../middleware/auth");
const Assignment = require("../model/Assignment");
const Course = require("../model/Course");
const Lecture = require("../model/Lecture");
const { sendSubmissionEmail } = require("../utils/email")

const router = express.Router();

// unified multer storage: picks up either courseId or assignmentId
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // teacher creating uses req.params.courseId
    // student submitting uses req.params.assignmentId
    const id = req.params.courseId ?? req.params.assignmentId;
    if (!id) {
      return cb(new Error("Missing courseId or assignmentId in URL"), null);
    }
    // store under uploads/assignments/<id>
    const dir = path.join(__dirname, "..", "uploads", "assignments", id);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  },
});
const upload = multer({ storage });

/**
 * 1) Teacher creates a new assignment template
 * POST /api/assignments/:courseId
 */
router.post(
  "/:courseId",
  authenticateJWT,
  authorizeRoles("teacher", "admin"),
  upload.single("file"),
  celebrate({
    [Segments.PARAMS]: Joi.object({
      courseId: Joi.string().length(24).hex().required(),
    }),
    [Segments.BODY]: Joi.object({
      lectureId: Joi.string().length(24).hex().required(),
      title: Joi.string().min(3).required(),
      description: Joi.string().allow("").optional(),
      deadline: Joi.date().iso().required(),
    }),
  }),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const { lectureId, title, description, deadline } = req.body;

      const [course, lecture] = await Promise.all([
        Course.findById(courseId),
        Lecture.findById(lectureId),
      ]);
      if (!course) return res.status(404).json({ msg: "Course not found" });
      if (!lecture) return res.status(404).json({ msg: "Lecture not found" });

      // build public URL
      const filename = req.file.filename;
      const relPath = path.join("uploads", "assignments", courseId, filename);
      const publicUrl = `${req.protocol}://${req.get("host")}/${relPath}`;

      const assignment = await Assignment.create({
        course: courseId,
        lecture: lectureId,
        title,
        description,
        deadline,
        filePath: publicUrl,
      });

      course.assignments.push(assignment._id);
      await course.save();

      res.status(201).json(assignment);
    } catch (err) {
      console.error("Assignment creation error:", err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

/**
 * 2) Get a single assignment (for student view & submit)
 * GET /api/assignments/:assignmentId
 */
router.get(
  "/:assignmentId",
  authenticateJWT,
  authorizeRoles("student", "teacher", "admin"),
  async (req, res) => {
    const asg = await Assignment.findById(req.params.assignmentId)
      .populate("lecture", "title")
      .populate("submissions.student", "name email");
    if (!asg) return res.status(404).json({ msg: "Assignment not found" });
    res.json(asg);
  }
);

/**
 * 3) List all assignments for a course
 * GET /api/assignments/course/:courseId
 */
router.get("/course/:courseId", authenticateJWT, async (req, res) => {
  try {
    const assignments = await Assignment.find({ course: req.params.courseId })
      .select("-submissions")
      .sort({ deadline: 1 });
    res.json(assignments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Server error" });
  }
});

/**
 * 4) Student submits their work before the deadline
 * POST /api/assignments/:assignmentId/submit
 */
/**
 * 4) Student submits their work before the deadline
 * POST /api/assignments/:assignmentId/submit
 * Added: sends submission confirmation email to student
 */
router.post(
  "/:assignmentId/submit",
  authenticateJWT,
  authorizeRoles("student"),
  upload.single("file"),
  async (req, res) => {
    try {
      const { assignmentId } = req.params;
      const assignment = await Assignment.findById(assignmentId).populate(
        "course",
        "title"
      );
      if (!assignment) {
        return res.status(404).json({ msg: "Assignment not found" });
      }

      if (new Date() > assignment.deadline) {
        return res.status(403).json({ msg: "Deadline has passed" });
      }

      const filename = req.file.filename;
      const relPath = path.join(
        "uploads",
        "assignments",
        assignmentId,
        filename
      );
      const publicUrl = `${req.protocol}://${req.get("host")}/${relPath}`;

      assignment.submissions.push({
        student: req.user.userId,
        filePath: publicUrl,
      });
      await assignment.save();

      // Send confirmation email (non-blocking)
      try {
        await sendSubmissionEmail({
          toUserId: req.user.userId,
          assignmentTitle: assignment.title,
          courseTitle: assignment.course.title,
          deadline: assignment.deadline,
          submissionUrl: publicUrl,
        });
      } catch (emailErr) {
        console.error("Failed to send submission email:", emailErr);
      }

      res.json({ msg: "Submitted!", fileUrl: publicUrl });
    } catch (err) {
      console.error("Submission error:", err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

/**
 * PUT  /api/assignments/:assignmentId/submit
 *    — edit your own submission (replace the file)
 */
router.put(
  "/:assignmentId/submit",
  authenticateJWT,
  authorizeRoles("student"),
  upload.single("file"),
  async (req, res) => {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ msg: "Not found" });
    if (new Date() > assignment.deadline) {
      return res.status(403).json({ msg: "Deadline has passed" });
    }

    // find your existing submission index
    const idx = assignment.submissions.findIndex((sub) =>
      sub.student.equals(req.user.userId)
    );
    if (idx === -1) {
      return res.status(404).json({ msg: "No existing submission to edit" });
    }

    // build new URL
    const filename = req.file.filename;
    const relPath = path.join("uploads", "assignments", assignmentId, filename);
    const publicUrl = `${req.protocol}://${req.get("host")}/${relPath}`;

    // replace
    assignment.submissions[idx].filePath = publicUrl;
    assignment.submissions[idx].submittedAt = new Date();
    await assignment.save();

    res.json({ msg: "Submission updated", fileUrl: publicUrl });
  }
);

/**
 * DELETE /api/assignments/:assignmentId/submit
 *    — remove your own submission (before deadline)
 */
router.delete(
  "/:assignmentId/submit",
  authenticateJWT,
  authorizeRoles("student"),
  async (req, res) => {
    const { assignmentId } = req.params;
    const assignment = await Assignment.findById(assignmentId);
    if (!assignment) return res.status(404).json({ msg: "Not found" });
    if (new Date() > assignment.deadline) {
      return res.status(403).json({ msg: "Deadline has passed" });
    }

    const before = assignment.submissions.length;
    assignment.submissions = assignment.submissions.filter(
      (sub) => !sub.student.equals(req.user.userId)
    );
    if (assignment.submissions.length === before) {
      return res.status(404).json({ msg: "No submission found to delete" });
    }
    await assignment.save();
    res.json({ msg: "Your submission has been removed." });
  }
);

/**
 * GET all submissions for a given assignment
 */
router.get(
  "/:assignmentId/submissions",
  authenticateJWT,
  authorizeRoles("teacher", "admin"),
  async (req, res) => {
    try {
      const asn = await Assignment.findById(req.params.assignmentId).populate(
        "submissions.student",
        "name email"
      );
      if (!asn) return res.status(404).json({ msg: "Assignment not found" });
      res.json(asn);
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

/**
 * PATCH grade & feedback on a single submission
 */
router.patch(
  "/:assignmentId/submissions/:submissionId",
  authenticateJWT,
  authorizeRoles("teacher", "admin"),
  async (req, res) => {
    const { assignmentId, submissionId } = req.params;
    const { grade, feedback } = req.body;
    console.log("PATCH", req.params, "body:", req.body);

    try {
      const asn = await Assignment.findById(assignmentId);

      console.log(
        "All submission _ids:",
        asn.submissions.map((s) => s._id.toString())
      );
      console.log("Looking for:", submissionId);
      if (!asn) return res.status(404).json({ msg: "Assignment not found" });

      // find the subdoc
      const sub = asn.submissions.id(submissionId);
      if (!sub) return res.status(404).json({ msg: "Submission not found" });

      // update & timestamp
      if (grade != null) sub.grade = grade;
      if (feedback != null) sub.feedback = feedback;
      sub.gradedAt = new Date();

      await asn.save();
      // return the updated submission
      res.json({
        _id: sub._id,
        grade: sub.grade,
        feedback: sub.feedback,
        gradedAt: sub.gradedAt,
      });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "Server error" });
    }
  }
);

module.exports = router;
