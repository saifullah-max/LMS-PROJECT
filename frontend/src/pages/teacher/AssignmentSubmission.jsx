// frontend/AssignmentSubmissions.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function AssignmentSubmissions() {
  const { assignmentId } = useParams();
  const navigate = useNavigate();
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [assignment, setAssignment] = useState(null);
  const [error, setError] = useState("");
  const [grading, setGrading] = useState({});

  useEffect(() => {
    axios
      .get(`${BASE}/assignments/${assignmentId}/submissions`, { headers })
      .then(({ data }) => setAssignment(data))
      .catch((err) => {
        console.error("Load submissions error:", err);
        setError("Could not load submissions.");
      });
  }, [assignmentId]);

  const handleChange = (subId, field, value) =>
    setGrading((g) => ({
      ...g,
      [subId]: { ...g[subId], [field]: value },
    }));

  const saveGrade = async (subId) => {
    const { grade, feedback } = grading[subId] || {};
    if (grade == null) {
      alert("Enter a grade before saving.");
      return;
    }
    setGrading((g) => ({
      ...g,
      [subId]: { ...g[subId], saving: true },
    }));
    try {
      const { data } = await axios.patch(
        `${BASE}/assignments/${assignmentId}/submissions/${subId}`,
        { grade, feedback },
        { headers }
      );
      setAssignment((a) => ({
        ...a,
        submissions: a.submissions.map((s) =>
          s._id === subId ? { ...s, ...data } : s
        ),
      }));
    } catch (err) {
      console.error("Save grade error:", err);
      setError("Could not save grade.");
    } finally {
      setGrading((g) => ({
        ...g,
        [subId]: { ...g[subId], saving: false },
      }));
    }
  };

  if (!assignment) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#111",
        }}
      >
        <p style={{ color: "#ccc" }}>{error || "Loading submissions…"}</p>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "30px",
        backgroundColor: "#111",
        color: "#fff",
        fontFamily: "sans-serif",
        maxWidth: "900px",
        margin: "0 auto",
      }}
    >
      <button
        onClick={() => navigate(-1)}
        style={{
          marginBottom: "20px",
          fontSize: "14px",
          color: "#9CFF6A",
          cursor: "pointer",
          textDecoration: "underline",
        }}
      >
        ← Back to Courses
      </button>

      <h1
        style={{
          fontSize: "28px",
          fontWeight: "600",
          color: "#9CFF6A",
          marginBottom: "20px",
        }}
      >
        {assignment.title}
      </h1>

      {error && (
        <p style={{ marginBottom: "15px", color: "red", fontWeight: "600" }}>
          {error}
        </p>
      )}

      {assignment.submissions.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        assignment.submissions.map((s) => {
          const sid = s._id;
          const state = grading[sid] || {};

          return (
            <div
              key={sid}
              style={{
                backgroundColor: "#333",
                padding: "20px",
                borderRadius: "8px",
                marginBottom: "20px",
                border: "1px solid #444",
                boxSizing: "border-box",
              }}
            >
              {/* Student info */}
              <div style={{ marginBottom: "15px" }}>
                <p style={{ fontWeight: "600", color: "#ccc", margin: 0 }}>
                  {s.student.name} &lt;{s.student.email}&gt;
                </p>
                <p
                  style={{
                    color: "#bbb",
                    margin: "5px 0 0 0",
                    fontSize: "14px",
                  }}
                >
                  Submitted: {new Date(s.submittedAt).toLocaleString()}
                </p>
                <a
                  href={s.filePath}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    textDecoration: "underline",
                    color: "#9CFF6A",
                    marginTop: "10px",
                    display: "inline-block",
                    fontSize: "14px",
                  }}
                >
                  Download Submission
                </a>
              </div>

              {/* Grade row */}
              <div
                style={{
                  marginBottom: "20px",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                <span style={{ fontWeight: "600", color: "#ccc" }}>
                  Grade (0–100):
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={state.grade ?? s.grade ?? ""}
                  onChange={(e) =>
                    handleChange(sid, "grade", Number(e.target.value))
                  }
                  style={{
                    marginLeft: "10px",
                    padding: "8px",
                    backgroundColor: "#222",
                    border: "1px solid #333",
                    color: "#ccc",
                    borderRadius: "4px",
                    width: "60px",
                  }}
                />
                <button
                  onClick={() => saveGrade(sid)}
                  disabled={state.saving}
                  style={{
                    marginLeft: "20px",
                    padding: "10px 20px",
                    backgroundColor: "#9CFF6A",
                    color: "#222",
                    borderRadius: "4px",
                    fontWeight: "600",
                    cursor: "pointer",
                    border: "none",
                    opacity: state.saving ? 0.6 : 1,
                  }}
                >
                  {state.saving ? "Saving…" : "Save Grade"}
                </button>
              </div>

              {/* Feedback row */}
              <div style={{ marginBottom: "20px" }}>
                <span style={{ fontWeight: "600", color: "#ccc" }}>
                  Feedback:
                </span>
                <textarea
                  rows={3}
                  value={state.feedback ?? s.feedback ?? ""}
                  onChange={(e) =>
                    handleChange(sid, "feedback", e.target.value)
                  }
                  style={{
                    display: "block",
                    marginTop: "8px",
                    width: "100%",
                    padding: "10px",
                    backgroundColor: "#222",
                    border: "1px solid #333",
                    color: "#ccc",
                    borderRadius: "4px",
                    boxSizing: "border-box",
                  }}
                />
              </div>

              {/* Timestamp */}
              {s.grade != null && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "#aaa",
                    marginTop: "6px",
                  }}
                >
                  Last graded: {new Date(s.gradedAt).toLocaleString()}
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}
