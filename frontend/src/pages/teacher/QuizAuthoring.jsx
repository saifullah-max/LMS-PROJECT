import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function QuizAuthoring() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001/api";
  const token = localStorage.getItem("token");

  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://cdn.weglot.com/weglot.min.js";
    script.onload = () => {
      // Initialize Weglot once the script is loaded
      Weglot.initialize({
        api_key: "wg_96813b70717ac14018000943f675710e4", // Use your own Weglot API key
      });
    };
    document.head.appendChild(script);

    // Clean up script when component is unmounted
    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data: c } = await axios.get(`${BASE_URL}/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourse(c);
        setQuizzes(c.quizzes || []);

        const { data: lecList } = await axios.get(
          `${BASE_URL}/lectures/course/${courseId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLectures(lecList);
      } catch (err) {
        console.error(err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  const addQuestion = () =>
    setQuestions((qs) => [
      ...qs,
      { text: "", options: ["", ""], correctOption: 0 },
    ]);

  const updateQuestion = (qi, field, val) =>
    setQuestions((qs) => {
      const copy = [...qs];
      copy[qi][field] = val;
      return copy;
    });

  const updateOption = (qi, oi, val) =>
    setQuestions((qs) => {
      const copy = [...qs];
      copy[qi].options[oi] = val;
      return copy;
    });

  const addOption = (qi) =>
    setQuestions((qs) => {
      const copy = [...qs];
      copy[qi].options.push("");
      return copy;
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLecture || !quizTitle || !questions.length) {
      setError("All fields are required.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(
        `${BASE_URL}/quizzes`,
        {
          course: courseId,
          lecture: selectedLecture,
          title: quizTitle,
          questions,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { data: c } = await axios.get(`${BASE_URL}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuizzes(c.quizzes || []);
      setQuizTitle("");
      setQuestions([]);
      setSelectedLecture("");
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || "Quiz creation failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "#111" }}>
        <p style={{ color: "#ccc" }}>Loading…</p>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#111", padding: "30px", fontFamily: "sans-serif", color: "#fff", maxWidth: "900px", margin: "0 auto" }}>
      <button onClick={() => navigate(-1)} style={{ marginBottom: "20px", fontSize: "14px", color: "#9CFF6A", cursor: "pointer", textDecoration: "underline" }}>
        ← Back to Courses
      </button>

      <h1 style={{ fontSize: "28px", fontWeight: "600", color: "#9CFF6A", marginBottom: "20px" }}>
        {course?.title} — Quizzes
      </h1>

      {error && <p style={{ marginBottom: "15px", color: "red", fontWeight: "600" }}>{error}</p>}

      <div style={{ marginBottom: "20px" }}>
        <label style={{ display: "block", marginBottom: "5px", fontWeight: "600", color: "#ccc" }}>
          Select Lecture
        </label>
        <select
          required
          value={selectedLecture}
          onChange={(e) => setSelectedLecture(e.target.value)}
          style={{ width: "100%", padding: "10px", backgroundColor: "#222", border: "1px solid #333", color: "#ccc", borderRadius: "4px" }}
        >
          <option value="">— choose a lecture —</option>
          {lectures.map((l) => (
            <option key={l._id} value={l._id}>
              {l.title}
            </option>
          ))}
        </select>
      </div>

      {quizzes.length > 0 && (
        <ul style={{ marginBottom: "20px" }}>
          {quizzes.map((q) => (
            <li key={q._id} style={{ backgroundColor: "#333", padding: "15px", borderRadius: "4px", display: "flex", justifyContent: "space-between" }}>
              <span>{q.title}</span>
              <Link
                to={`/student/course/${courseId}/quiz/${q._id}`}
                style={{ color: "#9CFF6A", textDecoration: "underline", fontSize: "14px" }}
              >
                Preview
              </Link>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} style={{ backgroundColor: "#222", padding: "25px", borderRadius: "8px", boxShadow: "0 2px 10px rgba(0, 0, 0, 0.5)" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "600", color: "#9CFF6A", marginBottom: "20px" }}>
          Create New Quiz
        </h2>

        <div>
          <label style={{ display: "block", marginBottom: "10px", fontWeight: "600", color: "#ccc" }}>
            Quiz Title
          </label>
          <input
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            required
            style={{ width: "100%", padding: "12px", backgroundColor: "#222", border: "1px solid #333", color: "#ccc", borderRadius: "4px", marginBottom: "20px" }}
          />
        </div>

        {questions.map((q, qi) => (
          <div key={`q-${qi}`} style={{ padding: "20px", border: "1px solid #333", borderRadius: "8px", backgroundColor: "#222", marginBottom: "15px" }}>
            <label style={{ display: "block", fontWeight: "600", color: "#ccc" }}>
              Question #{qi + 1}
            </label>
            <input
              type="text"
              value={q.text}
              onChange={(e) => updateQuestion(qi, "text", e.target.value)}
              required
              style={{ width: "100%", padding: "12px", backgroundColor: "#222", border: "1px solid #333", color: "#ccc", borderRadius: "4px", marginBottom: "15px" }}
            />

            <div style={{ marginBottom: "20px" }}>
              <span style={{ display: "block", fontWeight: "600", color: "#ccc" }}>Options:</span>
              {q.options.map((opt, oi) => (
                <div key={`q-${qi}-opt-${oi}`} style={{ display: "flex", alignItems: "center", marginBottom: "15px" }}>
                  <input
                    type="radio"
                    name={`correct-${qi}`}
                    checked={q.correctOption === oi}
                    onChange={() => updateQuestion(qi, "correctOption", oi)}
                    style={{ marginRight: "10px", height: "16px", width: "16px" }}
                  />
                  <input
                    value={opt}
                    onChange={(e) => updateOption(qi, oi, e.target.value)}
                    required
                    placeholder={`Option #${oi + 1}`}
                    style={{
                      flex: "1",
                      padding: "10px",
                      backgroundColor: "#222",
                      border: "1px solid #333",
                      color: "#ccc",
                      borderRadius: "4px",
                    }}
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => addOption(qi)}
                style={{
                  color: "#9CFF6A",
                  fontSize: "14px",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  textDecoration: "underline",
                }}
              >
                + Add Option
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addQuestion}
          style={{
            color: "#9CFF6A",
            fontSize: "14px",
            background: "none",
            border: "none",
            cursor: "pointer",
            textDecoration: "underline",
          }}
        >
          + Add Question
        </button>

        <button
          type="submit"
          disabled={submitting}
          style={{
            width: "100%",
            padding: "15px",
            backgroundColor: "#9CFF6A",
            color: "#222",
            borderRadius: "4px",
            fontWeight: "600",
            cursor: "pointer",
            marginTop: "20px",
            border: "none",
            opacity: submitting ? "0.6" : "1",
          }}
        >
          {submitting ? "Creating…" : "Create Quiz"}
        </button>
      </form>
    </div>
  );
}
