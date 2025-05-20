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
    setError("");
    axios
      .get(`${BASE}/assignments/${assignmentId}/submissions`, { headers })
      .then(({ data }) => setAssignment(data))
      .catch((err) => {
        console.error("Load submissions error:", err);
        setError("Could not load submissions.");
      });
  }, [assignmentId]);

  function handleChange(subId, field, value) {
    setGrading((g) => ({
      ...g,
      [subId]: { ...g[subId], [field]: value },
    }));
  }

  async function saveGrade(subId) {
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
      setError("");
    } catch (err) {
      console.error("Save grade error:", err);
      setError("Could not save grade.");
    } finally {
      setGrading((g) => ({
        ...g,
        [subId]: { ...g[subId], saving: false },
      }));
    }
  }

  if (!assignment) {
    return <p className="p-6 text-center text-gray-200">{error || "Loading…"}</p>;
  }

  return (
    <div className="min-h-screen p-6 max-w-5xl mx-auto font-sans text-gray-100 bg-gray-900">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-lime-400 hover:underline text-sm"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-6 text-lime-400">{assignment.title}</h1>

      {assignment.submissions.length === 0 ? (
        <p>No submissions yet.</p>
      ) : (
        <ul className="space-y-6">
          {assignment.submissions.map((s) => {
            const sid = s._id;
            const state = grading[sid] || {};

            return (
              <li key={sid} className="border border-gray-700 p-6 rounded bg-gray-800">
                <p className="font-semibold text-gray-200">
                  {s.student.name} &lt;{s.student.email}&gt;
                </p>
                <p className="text-gray-400 mb-2">
                  Submitted: {new Date(s.submittedAt).toLocaleString()}
                </p>
                <a
                  href={s.filePath}
                  target="_blank"
                  rel="noreferrer"
                  className="underline text-lime-400 mb-4 block"
                >
                  Download Submission
                </a>

                <div className="space-y-4">
                  <label className="block text-gray-200">
                    Grade (0–100):
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={state.grade ?? s.grade ?? ""}
                      onChange={(e) =>
                        handleChange(sid, "grade", Number(e.target.value))
                      }
                      className="ml-2 w-20 rounded border border-gray-700 px-2 py-1 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-400"
                    />
                  </label>

                  <label className="block text-gray-200">
                    Feedback:
                    <textarea
                      value={state.feedback ?? s.feedback ?? ""}
                      onChange={(e) =>
                        handleChange(sid, "feedback", e.target.value)
                      }
                      className="w-full rounded border border-gray-700 p-2 bg-gray-900 text-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-400"
                    />
                  </label>

                  <button
                    onClick={() => saveGrade(sid)}
                    disabled={state.saving}
                    className="px-4 py-2 bg-lime-400 text-gray-900 rounded disabled:opacity-50"
                  >
                    {state.saving ? "Saving…" : "Save Grade"}
                  </button>

                  {s.grade != null && (
                    <p className="text-sm text-gray-500">
                      Last graded: {new Date(s.gradedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {error && <p className="text-red-600 mt-6">{error}</p>}
    </div>
  );
}
