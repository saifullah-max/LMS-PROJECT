import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function QuizAttempt() {
  const { courseId, quizId } = useParams();
  const navigate = useNavigate();
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";
  const token = localStorage.getItem("token");

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const [aiFeedback, setAiFeedback] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { data: q } = await axios.get(`${BASE}/quizzes/${quizId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuiz(q);
        setAnswers(Array(q.questions.length).fill(-1));

        const { data: attempts } = await axios.get(
          `${BASE}/quizzes/${quizId}/attempts`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (attempts.length > 0) {
          const a = attempts[0];
          setResult({ score: a.score, total: q.questions.length });
          // Optionally load AI feedback for previous attempt
        }
      } catch (err) {
        console.error("Error loading quiz or attempts:", err);
        setError("Could not load quiz.");
      } finally {
        setLoading(false);
      }
    })();
  }, [BASE, quizId, token]);

  const handleSelect = (qIdx, optIdx) =>
    setAnswers((a) => {
      const copy = [...a];
      copy[qIdx] = optIdx;
      return copy;
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (answers.some((a) => a < 0)) {
      setError("Please answer all questions");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const { data } = await axios.post(
        `${BASE}/quizzes/${quizId}/attempt`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setResult({ score: data.score, total: data.total });

      const aiRes = await axios.post(
        `${BASE}/ai/quiz-feedback`,
        { quizId, answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAiFeedback(aiRes.data.feedback);
    } catch (err) {
      console.error("Attempt or AI feedback error:", err);
      setError(
        err.response?.data?.msg || "Submission failed. Did you view the lecture first?"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-300 text-lg">Loading quiz…</p>
      </div>
    );
  }

  if (error && !quiz) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <p className="text-red-500 text-center max-w-md">{error}</p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="min-h-screen p-6 max-w-3xl mx-auto font-sans text-gray-100 bg-gray-900">
        <h1 className="text-3xl font-bold mb-6 text-lime-400">
          You scored {result.score} / {result.total}
        </h1>

        {aiFeedback && (
          <div className="bg-gray-800 p-5 rounded mb-6 shadow-inner space-y-4">
            <h2 className="text-2xl font-semibold text-lime-400">
              AI Feedback & Suggestions
            </h2>
            {aiFeedback.map((fb, idx) => (
              <div key={idx} className="p-3 border border-gray-700 rounded">
                <p>
                  <strong>Question {fb.question}:</strong>{" "}
                  {fb.correct ? (
                    <span className="text-green-500 font-semibold">Correct</span>
                  ) : (
                    <span className="text-red-500 font-semibold">Incorrect</span>
                  )}
                </p>
                <p>
                  <em>Explanation:</em> {fb.explanation}
                </p>
                {!fb.correct && fb.tip && (
                  <p>
                    <em>Tip:</em> {fb.tip}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2 bg-lime-400 text-gray-900 rounded font-semibold hover:bg-lime-500 transition"
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto font-sans bg-gray-900 text-gray-100">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-lime-400 hover:underline text-sm font-semibold"
      >
        ← Back to Course
      </button>
      <h1 className="text-3xl font-bold mb-6">{quiz.title}</h1>
      <form onSubmit={handleSubmit} className="space-y-6">
        {quiz.questions.map((q, qi) => (
          <div
            key={qi}
            className="p-4 rounded border border-gray-700 bg-gray-800"
          >
            <p className="mb-3 font-semibold">{`Q${qi + 1}. ${q.text}`}</p>
            {q.options.map((opt, oi) => (
              <label
                key={oi}
                className="flex items-center space-x-3 mb-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name={`q-${qi}`}
                  checked={answers[qi] === oi}
                  onChange={() => handleSelect(qi, oi)}
                  className="h-5 w-5 text-lime-400"
                  required
                />
                <span>{opt}</span>
              </label>
            ))}
          </div>
        ))}
        {error && <p className="text-red-500 font-semibold">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 bg-lime-400 text-gray-900 rounded font-semibold hover:bg-lime-500 disabled:opacity-50 transition"
        >
          {submitting ? "Submitting…" : "Submit Quiz"}
        </button>
      </form>
    </div>
  );
}
