import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function StudentAssignmentSubmit() {
  const { courseId, assignmentId } = useParams();
  const navigate = useNavigate();
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";
  const token = localStorage.getItem("token");

  const [assignment, setAssignment] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submission, setSubmission] = useState(null);

  // Fetch assignment details
  useEffect(() => {
    (async () => {
      try {
        const { data: a } = await axios.get(
          `${BASE}/assignments/${assignmentId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setAssignment(a);

        const meId = JSON.parse(atob(token.split(".")[1])).userId;
        const mySub = a.submissions.find((s) => s.student._id === meId);
        if (mySub) setSubmission(mySub); // If user has already submitted, populate submission
      } catch (err) {
        console.error("Could not load assignment:", err);
        setError("Could not load assignment.");
      } finally {
        setLoading(false);
      }
    })();
  }, [BASE, assignmentId, token]);

  // Handle file submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError("Choose a file to upload");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await axios.post(
        `${BASE}/assignments/${assignmentId}/submit`,
        fd,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setSubmission({ filePath: data.fileUrl });
    } catch (err) {
      console.error("Submission error:", err);
      setError(err.response?.data?.msg || "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle deleting the submission
  const handleDelete = async () => {
    if (!window.confirm("Delete your submission?")) return;
    try {
      await axios.delete(`${BASE}/assignments/${assignmentId}/submit`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSubmission(null);
      setFile(null);
    } catch (err) {
      console.error("Delete error:", err);
      alert("Could not delete submission");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-300 text-lg">Loading…</p>
      </div>
    );
  }
  if (error && !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <p className="text-red-500 text-center max-w-md">{error}</p>
      </div>
    );
  }

  const now = new Date();
  const pastDeadline = now > new Date(assignment.deadline);

  return (
    <div className="min-h-screen p-6 max-w-3xl mx-auto font-sans text-gray-100 bg-gray-900 rounded">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-lime-400 hover:underline text-sm font-semibold"
      >
        ← Back to Course
      </button>

      <h1 className="text-3xl font-bold mb-4">{assignment.title}</h1>
      <p className="mb-2">Lecture: {assignment.lecture.title}</p>
      <p className="mb-6 text-gray-400">
        Due: {new Date(assignment.deadline).toLocaleString()}
      </p>

      {pastDeadline && !submission && (
        <p className="text-red-600 mb-6 font-semibold">
          Deadline has passed – you cannot submit.
        </p>
      )}

      {submission ? (
        <div className="space-y-6">
          <p className="font-semibold text-gray-200">Your submission:</p>
          <a
            href={submission.filePath}
            target="_blank"
            rel="noreferrer"
            className="underline text-lime-400 mb-4 block"
          >
            Download your file
          </a>
          {!pastDeadline && (
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
            >
              Delete / Re-upload
            </button>
          )}
        </div>
      ) : (
        !pastDeadline && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="file"
              accept=".pdf,.docx"
              onChange={(e) => setFile(e.target.files[0])}
              className="text-gray-200"
            />
            {error && <p className="text-red-500 font-semibold">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-3 bg-lime-400 text-gray-900 rounded font-semibold hover:bg-lime-500 disabled:opacity-50 transition"
            >
              {submitting ? "Submitting…" : "Submit Work"}
            </button>
          </form>
        )
      )}
    </div>
  );
}
