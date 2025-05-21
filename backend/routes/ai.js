// backend/routes/ai.js
require("dotenv").config(); // load OPENAI_API_KEY
const express = require("express");
const OpenAI = require("openai");
const Quiz = require("../model/Quiz");
const Course = require("../model/Course");
const Assignment = require("../model/Assignment");
const PDFDocument = require("pdfkit");
const { authenticateJWT, authorizeRoles } = require("../middleware/auth");

const router = express.Router();
const openai = new OpenAI(); // picks up process.env.OPENAI_API_KEY

/**
 * POST /api/ai/quiz-grade
 * Student submits quiz answers and gets AI‐graded feedback + recommendation.
 */
router.post(
  "/quiz-grade",
  authenticateJWT,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const { quizId, answers } = req.body;
      const quiz = await Quiz.findById(quizId);
      if (!quiz) return res.status(404).json({ msg: "Quiz not found" });

      const total = quiz.questions.length;
      const attemptLines = quiz.questions
        .map((q, i) => {
          const studentAns = q.options[answers[i]];
          const correctAns = q.options[q.correctOption];
          return (
            `Q${i + 1}: ${q.text}\n` +
            `- Student: "${studentAns}"\n` +
            `- Correct: "${correctAns}"`
          );
        })
        .join("\n\n");

      const systemMsg = `
You are an AI tutor. Grade this quiz.
For each question return:
 • question (number)
 • correct (true/false)
 • explanation
 • tip (if incorrect)
Then give one overall "recommendation" (topics to review).

Return exactly one JSON object:
\`\`\`json
{
  "feedback": [ { "question":1, "correct":true, "explanation":"…", "tip":"…" }, … ],
  "recommendation": "…"
}
\`\`\`
`.trim();

      const userMsg = `Quiz Attempt:\n\n${attemptLines}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemMsg },
          { role: "user", content: userMsg },
        ],
        temperature: 0.2,
        max_tokens: 600,
      });

      let content = completion.choices[0].message.content.trim();
      const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
      if (fenceMatch) content = fenceMatch[1];

      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch (e) {
        console.error("AI JSON parse error:", content);
        return res.status(500).json({ msg: "Invalid AI JSON", raw: content });
      }

      const { feedback, recommendation } = parsed;
      const score = feedback.filter((f) => f.correct).length;
      return res.json({ feedback, recommendation, score, total });
    } catch (err) {
      console.error("Quiz-grade error:", err);
      return res.status(500).json({ msg: "Server error", error: err.message });
    }
  }
);

/**
 * GET /api/ai/course-report/:courseId
 * Teacher/Admin-only: AI summarizes both quiz & assignment performance.
 */
router.get(
  "/course-report/:courseId",
  authenticateJWT,
  authorizeRoles("teacher", "admin"),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const course = await Course.findById(courseId).lean();
      if (!course) return res.status(404).json({ msg: "Course not found" });

      // — gather quizzes performance
      const quizzes = await Quiz.find({ course: courseId }).lean();
      const quizLines = quizzes
        .map((q) => {
          const total = q.attempts.length || 1;
          const rates = q.questions
            .map((ques, idx) => {
              const correctCount = q.attempts.filter(
                (a) => a.answers[idx] === ques.correctOption
              ).length;
              const pct = Math.round((correctCount / total) * 100);
              return `  Q${idx + 1} (“${ques.text}”): ${pct}% correct`;
            })
            .join("\n");
          return `Quiz: ${q.title}\n${rates}`;
        })
        .join("\n\n");

      // — gather assignments performance
      // assume Course.students is an array
      const totalStudents = Array.isArray(course.students)
        ? course.students.length
        : 0;
      const assignments = await Assignment.find({ course: courseId }).lean();
      const assignLines = assignments
        .map((a) => {
          const submitted = a.submissions.length;
          const submitPct = totalStudents
            ? Math.round((submitted / totalStudents) * 100)
            : 0;
          // compute average grade if present
          const grades = a.submissions
            .map((s) => s.grade)
            .filter((g) => typeof g === "number");
          const avgGrade = grades.length
            ? Math.round(grades.reduce((sum, g) => sum + g, 0) / grades.length)
            : null;
          return (
            `Assignment: ${a.title}\n  • Submission rate: ${submitPct}%` +
            (avgGrade !== null ? `\n  • Average grade: ${avgGrade}%` : "")
          );
        })
        .join("\n\n");

      // — build the combined AI prompt
      const systemPrompt = `
You are an expert academic advisor.  
Given both quiz correctness percentages and assignment submission/grade statistics 
for a course, identify:
  1) Any quiz questions where a majority of students answered incorrectly (correct rate < 50%).
  2) Any assignments where submission rate < 50% or average grade < 60%.
For each item, output a bullet point with:
  - The quiz title and question number/text OR assignment title.
  - The relevant percentage(s).
  - A recommendation (e.g., "revisit lecture on X", "remind students to submit", etc.)
Return a single bullet-point report.
`.trim();

      const userPrompt = `
Course: ${course.title}

Quiz Performance:
${quizLines}

Assignment Performance:
${assignLines}
`.trim();

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 500,
      });

      const report = completion.choices[0].message.content.trim();
      res.json({ report });
    } catch (err) {
      console.error("Course-report error:", err);
      res.status(500).json({ msg: "Server error", error: err.message });
    }
  }
);

/**
 * GET /api/ai/heatmap/pdf
 * Admin-only: PDF with heatmaps + recommendations for every course & quiz.
 */
router.get(
  "/heatmap/pdf",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const courses = await Course.find().lean();

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=heatmap_all_courses.pdf"
      );

      const doc = new PDFDocument({ margin: 40 });
      doc.pipe(res);

      for (let ci = 0; ci < courses.length; ci++) {
        const course = courses[ci];
        doc.fontSize(18).text(`Course: ${course.title}`, { underline: true });
        doc.moveDown(0.5);

        const quizzes = await Quiz.find({ course: course._id }).lean();
        if (quizzes.length === 0) {
          doc.fontSize(12).text("No quizzes for this course.");
          if (ci < courses.length - 1) doc.addPage();
          continue;
        }

        for (const quiz of quizzes) {
          doc.fontSize(16).text(`Quiz: ${quiz.title}`);
          doc.moveDown(0.2);

          // header
          doc
            .fontSize(12)
            .text("Question", { continued: true })
            .text("Correct Rate", { align: "right" });
          doc.moveDown(0.1);

          const totalAttempts = quiz.attempts.length || 1;
          // collect rates
          const rates = quiz.questions.map((q, idx) => {
            const correctCount = quiz.attempts.filter(
              (a) => a.answers[idx] === q.correctOption
            ).length;
            const rate = Math.round((correctCount / totalAttempts) * 100);
            // render row
            doc
              .text(`Q${idx + 1}`, { continued: true })
              .text(` ${rate}%`, { align: "right" });
            return { idx, text: q.text, rate };
          });

          doc.moveDown(0.2);

          // recommendation: lowest two rates
          const lowest = rates
            .sort((a, b) => a.rate - b.rate)
            .slice(0, Math.min(2, rates.length))
            .map((r) => `Q${r.idx + 1} (${r.text})`);
          doc
            .fontSize(12)
            .fillColor("red")
            .text(`Recommendation: Focus review on ${lowest.join(", ")}`)
            .fillColor("black");

          doc.moveDown(1);
        }

        if (ci < courses.length - 1) doc.addPage();
      }

      doc.end();
    } catch (err) {
      console.error("PDF all-courses error:", err);
      res.status(500).json({ msg: "PDF error", error: err.message });
    }
  }
);

/**
 * GET /api/ai/heatmap/:quizId
 * Teacher/Admin gets per-question correctness rates.
 */
router.get(
  "/heatmap/:quizId",
  authenticateJWT,
  authorizeRoles("teacher", "admin"),
  async (req, res) => {
    try {
      const quiz = await Quiz.findById(req.params.quizId);
      if (!quiz) return res.status(404).json({ msg: "Quiz not found" });

      const total = quiz.attempts.length || 1;
      const data = quiz.questions.map((q, idx) => {
        const correctCount = quiz.attempts.filter(
          (a) => a.answers[idx] === q.correctOption
        ).length;
        return {
          questionNumber: idx + 1,
          questionText: q.text,
          correctRate: Number((correctCount / total).toFixed(2)),
        };
      });

      return res.json({ heatmapData: data });
    } catch (err) {
      console.error("Heatmap error:", err);
      return res.status(500).json({ msg: "Server error", error: err.message });
    }
  }
);

/**
 * GET /api/ai/heatmap/pdf/:courseId
 * Admin‐only: PDF recommendation on the one question
 * that the majority of students got wrong.
 */
router.get(
  "/heatmap/pdf/:courseId",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const course = await Course.findById(req.params.courseId).lean();
      if (!course) return res.status(404).json({ msg: "Course not found" });

      // Gather every quiz for this course
      const quizzes = await Quiz.find({ course: course._id }).lean();
      let worst = null;

      // Compute correct‐rates and track the lowest
      for (const quiz of quizzes) {
        const total = quiz.attempts.length || 1;
        quiz.questions.forEach((q, idx) => {
          const correct = quiz.attempts.filter(
            (a) => a.answers[idx] === q.correctOption
          ).length;
          const pct = Math.round((correct / total) * 100);

          if (worst === null || pct < worst.pct) {
            worst = {
              quizTitle: quiz.title,
              questionIdx: idx + 1,
              questionText: q.text,
              pct,
            };
          }
        });
      }

      // Stream PDF
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename=weakest_question_${course._id}.pdf`
      );

      const doc = new PDFDocument({ margin: 40 });
      doc.pipe(res);

      doc
        .fontSize(20)
        .text(`Key Weak Question: ${course.title}`, { underline: true });
      doc.moveDown(1);

      if (!worst) {
        doc.fontSize(14).text("No quiz attempts found for this course.");
      } else {
        doc
          .fontSize(14)
          .fillColor("red")
          .text(
            `Most students struggled with:\n\n` +
              `Quiz: "${worst.quizTitle}"\n` +
              `Question ${worst.questionIdx}: ${worst.questionText}\n` +
              `Correct Rate: ${worst.pct}%`
          )
          .fillColor("black");
      }

      doc.end();
    } catch (err) {
      console.error("PDF generation error:", err);
      res.status(500).json({ msg: "PDF error", error: err.message });
    }
  }
);

/**
 * GET /api/ai/quiz-report/:courseId
 * Admin-only: AI summarizes which questions the majority got wrong
 * and recommends lecture modules to revisit.
 */
router.get(
  "/quiz-report/:courseId",
  authenticateJWT,
  authorizeRoles("admin", "teacher"),
  async (req, res) => {
    try {
      const { courseId } = req.params;
      const course = await Course.findById(courseId).lean();
      if (!course) return res.status(404).json({ msg: "Course not found" });

      // 1) load all quizzes & attempts for this course
      const quizzes = await Quiz.find({ course: courseId }).lean();

      // 2) build a summary of performance
      //    we’ll list quiz title, question idx, correctRate
      const performanceLines = quizzes
        .map((q) => {
          const total = q.attempts.length || 1;
          const rates = q.questions
            .map((ques, idx) => {
              const correctCount = q.attempts.filter(
                (a) => a.answers[idx] === ques.correctOption
              ).length;
              const pct = Math.round((correctCount / total) * 100);
              return `  Q${idx + 1} (${ques.text}): ${pct}% correct`;
            })
            .join("\n");
          return `Quiz: ${q.title}\n${rates}`;
        })
        .join("\n\n");

      // 3) construct the prompt for OpenAI
      const systemPrompt = `
You are an expert academic advisor.  
Given the per-question correct percentages for a course, 
identify every question where *majority* of students got it wrong 
(i.e. correct rate < 50%).  
For each such question, output:
  - Quiz title  
  - Question number and text  
  - Percentage correct  
  - The lecture/module name that instructors should revisit (assume module names can be inferred from question text).

Return a bullet-point report.  
Example:
- In "Arrays Quiz", Question 3 ("What is index-out-of-bounds?"): 42% correct.  
  Recommend revisiting the "Array Indexing" lecture.
- In "Loops Quiz", Question 1 ("For vs While"): 38% correct.  
  Recommend revisiting the "Loop Constructs" lecture.
`.trim();

      const userPrompt = `
Course: ${course.title}

Performance:
${performanceLines}
`.trim();

      // 4) call OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 400,
      });

      const report = completion.choices[0].message.content.trim();
      res.json({ report });
    } catch (err) {
      console.error("Quiz-report error:", err);
      res.status(500).json({ msg: "Server error", error: err.message });
    }
  }
);

module.exports = router;
