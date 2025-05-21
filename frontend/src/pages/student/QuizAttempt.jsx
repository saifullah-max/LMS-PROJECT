// frontend/QuizAttempt.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function QuizAttempt() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";
  const token = localStorage.getItem("token");

  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        // 1) Load the quiz (includes course field)
        const { data: quizData } = await axios.get(
          `${BASE}/quizzes/${quizId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // 2) Check for existing attempts
        const { data: attempts } = await axios.get(
          `${BASE}/quizzes/${quizId}/attempts`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (Array.isArray(attempts) && attempts.length > 0) {
          alert("You have already attempted this quiz.");
          // redirect to CourseDetail
          navigate(`/student/course/${quizData.course}`);
          return;
        }

        // 3) No prior attempt → initialize
        setQuiz(quizData);
        setAnswers(Array(quizData.questions.length).fill(-1));
      } catch (err) {
        console.error(err);
        setError("Could not load quiz or verify attempts.");
      } finally {
        setLoading(false);
      }
    })();
  }, [BASE, quizId, token, navigate]);

  const handleSelect = (qIdx, optIdx) => {
    setAnswers((prev) => {
      const copy = [...prev];
      copy[qIdx] = optIdx;
      return copy;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (answers.some((a) => a < 0)) {
      setError("Please answer all questions.");
      return;
    }
    setSubmitting(true);
    setError("");

    try {
      // 1) Record attempt in DB
      const { data: attemptData } = await axios.post(
        `${BASE}/quizzes/${quizId}/attempt`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 2) Get AI feedback + recommendation
      const { data: aiData } = await axios.post(
        `${BASE}/ai/quiz-grade`,
        { quizId, answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 3) Navigate to result
      navigate(`/result/${quizId}`, {
        state: {
          score: attemptData.score,
          total: attemptData.total,
          feedback: aiData.feedback,
          recommendation: aiData.recommendation,
        },
      });
    } catch (err) {
      console.error(err);
      if (
        err.response?.status === 403 &&
        err.response?.data?.msg?.includes("already submitted")
      ) {
        alert(err.response.data.msg);
        navigate(`/student/course/${quiz.course}`);
      } else {
        setError("Failed to submit quiz. Try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          background: "#111",
          color: "#ccc",
        }}
      >
        Loading…
      </div>
    );
  }

  if (!quiz) {
    return (
      <div
        style={{
          minHeight: "100vh",
          padding: 20,
          background: "#111",
          color: "salmon",
          fontFamily: "sans-serif",
        }}
      >
        <p style={{ fontSize: 18, fontWeight: 600 }}>
          {error || "Quiz not found."}
        </p>
        <button
          onClick={() => navigate(`/student/course/${quiz?.course || ""}`)}
          style={{
            marginTop: 20,
            padding: "10px 15px",
            background: "#9CFF6A",
            color: "#222",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          ← Back
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#111",
        color: "#fff",
        padding: 20,
        fontFamily: "sans-serif",
        width: "100%",
        boxSizing: "border-box",
      }}
    >
      <button
        onClick={() => navigate(`/student/course/${quiz.course}`)}
        style={{
          background: "none",
          border: "none",
          color: "#9CFF6A",
          cursor: "pointer",
          marginBottom: 16,
        }}
      >
        ← Back
      </button>

      <h1 style={{ marginTop: 0, marginBottom: 24 }}>{quiz.title}</h1>

      <form onSubmit={handleSubmit}>
        {quiz.questions.map((q, qi) => (
          <div
            key={qi}
            style={{
              marginBottom: 32,
              padding: 16,
              background: "#222",
              borderRadius: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
            }}
          >
            <p style={{ margin: "0 0 12px 0", fontWeight: 600 }}>
              {`Q${qi + 1}. ${q.text}`}
            </p>

            <div
              style={{
                marginLeft: 16,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {q.options.map((opt, oi) => (
                <div
                  key={oi}
                  style={{
                    marginBottom: 8,
                    display: "flex",
                    alignItems: "center",
                  }}
                >
                  <input
                    type="radio"
                    name={`q-${qi}`}
                    value={oi}
                    checked={answers[qi] === oi}
                    onChange={() => handleSelect(qi, oi)}
                    style={{
                      marginRight: 8,
                      verticalAlign: "middle",
                    }}
                    required
                  />
                  <span style={{ verticalAlign: "middle" }}>{opt}</span>
                </div>
              ))}
            </div>
          </div>
        ))}

        {error && (
          <p
            style={{
              color: "salmon",
              fontWeight: 600,
              marginBottom: 16,
            }}
          >
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          style={{
            padding: "12px 20px",
            background: "#9CFF6A",
            color: "#222",
            border: "none",
            borderRadius: 4,
            fontWeight: 600,
            cursor: submitting ? "not-allowed" : "pointer",
          }}
        >
          {submitting ? "Submitting…" : "Submit Quiz"}
        </button>
      </form>
    </div>
  );
}
