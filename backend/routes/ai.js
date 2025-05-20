// server/routes/ai.js
const express = require("express");
const axios = require("axios");
const JSON5 = require("json5");
const Quiz = require("../model/Quiz");
const Assignment = require("../model/Assignment");
const { authenticateJWT, authorizeRoles } = require("../middleware/auth");

const router = express.Router();

/**
 * POST /api/ai/quiz-feedback
 * Student submits quiz answers and gets AI feedback.
 */
router.post(
  "/quiz-feedback",
  authenticateJWT,
  authorizeRoles("student"),
  async (req, res) => {
    try {
      const { quizId, answers } = req.body;
      const quiz = await Quiz.findById(quizId);
      if (!quiz) return res.status(404).json({ msg: "Quiz not found" });

      const questionLines = quiz.questions
        .map((q, i) => {
          const opts = q.options.map((o, j) => `${j}: ${o}`).join(", ");
          return `Q${i + 1}: ${q.text}\nOptions: ${opts}\nStudent answered: ${
            answers[i]
          }`;
        })
        .join("\n\n");

      const prompt = `
You are an AI tutor.

You will be given a student's quiz submission with each question, its options, and the student's selected answer.

Respond ONLY with a single **markdown code block** containing a valid **JSON array** of feedback objects.

Each object should include:

- "question": integer (starts at 1)
- "correct": boolean
- "explanation": string
- "tip": string (optional, include only if "correct" is false)

Respond ONLY with the code block and the valid JSON inside it.

If the student's answer is correct, set "correct" to true and provide a short explanation.

If the answer is wrong, set "correct" to false, explain why, and give a helpful tip.

### Example Format

\`\`\`json
[
  {
    "question": 1,
    "correct": true,
    "explanation": "2+2 equals 4."
  },
  {
    "question": 2,
    "correct": false,
    "explanation": "The correct answer is B because subtraction requires borrowing.",
    "tip": "Review how borrowing works in subtraction problems."
  }
]
\`\`\`

### Quiz Attempt:

${questionLines}
`.trim();

      console.log("Prompt sent:", prompt);

      const aiRes = await axios.post("http://localhost:8000/predict", {
        prompt,
        max_new_tokens: 512,
      });

      let raw = aiRes.data.result.trim();
      console.log("Raw AI output:", raw);

      if (raw === "[0]" || !raw.startsWith("[")) {
        console.warn("Received invalid AI feedback. Returning empty array.");
        return res.json({
          feedback: [],
          warning: "Invalid or no AI feedback.",
        });
      }

      // Try to match a markdown code block
      const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);

      if (codeBlockMatch) {
        raw = codeBlockMatch[1].trim();
      }

      // Attempt to safely parse JSON
      let feedback;
      try {
        raw = raw.replace(/,\s*}/g, "}").replace(/,\s*]/g, "]");
        feedback = JSON.parse(raw);
      } catch (err) {
        console.error("JSON parse error:", err);
        return res.json({
          rawFeedback: raw,
          msg: "Failed to parse AI feedback JSON. Please inspect rawFeedback.",
        });
      }

      res.json({ feedback });
    } catch (err) {
      console.error("AI feedback error:", err);
      res.status(500).json({ msg: "AI feedback error", error: err.message });
    }
  }
);

/**
 * GET /api/ai/report-card/:studentId
 * Teacher/Admin gets a narrative report card.
 */
router.get(
  "/report-card/:studentId",
  authenticateJWT,
  authorizeRoles("teacher", "admin"),
  async (req, res) => {
    try {
      const studentId = req.params.studentId;

      // Gather quiz attempts
      const quizzes = await Quiz.find({ "attempts.student": studentId });
      const quizSummary = quizzes
        .map((q) => {
          const a = q.attempts.find((x) => x.student.toString() === studentId);
          return `${q.title}: ${a.score}/${q.questions.length}`;
        })
        .join("\n");

      // Gather assignment submissions
      const assignments = await Assignment.find({
        "submissions.student": studentId,
      });
      const assignSummary = assignments
        .map((a) => {
          const s = a.submissions.find(
            (x) => x.student.toString() === studentId
          );
          return `${a.title}: ${
            s.grade != null ? `graded ${s.grade}` : "not graded yet"
          }`;
        })
        .join("\n");

      console.log("Quiz Summary for student:", quizSummary);
      console.log("Assignment Summary for student:", assignSummary);

      const quizSummaryText = quizSummary || "No quizzes attempted yet.";
      const assignSummaryText =
        assignSummary || "No assignments submitted yet.";

      const prompt = `
You are an academic advisor. Write a concise report-card narrative for the student:

Quizzes:
${quizSummaryText}

Assignments:
${assignSummaryText}

Include:
- A positive highlight
- Strengths
- Areas to improve
- Recommended next steps

Example:
"The student has shown consistent effort in quizzes, particularly in 'abc' where they scored full marks. Although 'Quiz 01' needs improvement, their participation in assignments like 'lec 3' indicates active engagement. Strengths include quick learning and punctual submissions. To improve, the student should focus on conceptual understanding. Recommended next steps include attending review sessions and practicing problem-solving exercises."

Return ONLY the narrative text.
`.trim();

      const aiRes = await axios.post("http://localhost:8000/predict", {
        prompt,
        max_new_tokens: 512,
      });

      const reportCard = aiRes.data.result.trim();
      res.json({ reportCard });
    } catch (err) {
      console.error(err);
      res.status(500).json({ msg: "AI report-card error", error: err.message });
    }
  }
);

module.exports = router;
