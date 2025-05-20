import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [quizzes, setQuizzes] = useState([]);
  const [tab, setTab] = useState("lectures");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";
  const token = localStorage.getItem("token");

  useEffect(() => {
    (async () => {
      try {
        const { data: c } = await axios.get(`${BASE}/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourse(c);

        const { data: q } = await axios.get(`${BASE}/quizzes/course/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setQuizzes(q);
      } catch (err) {
        console.error("Fetch course or quizzes error:", err);
        setError("Could not load course or quizzes.");
      } finally {
        setLoading(false);
      }
    })();
  }, [BASE, courseId, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-300 text-lg">Loading course…</p>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <p className="text-red-500 text-center text-lg max-w-md">{error || "Course not found."}</p>
      </div>
    );
  }

  const { title, description, lectures = [], assignments = [] } = course;

  const handleView = async (lec) => {
    try {
      await axios.post(
        `${BASE}/lectures/${lec._id}/view`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      console.warn("Could not record view:", e);
    }
    window.open(lec.offlineUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-900 p-6 max-w-5xl mx-auto font-sans text-gray-100">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-sm font-medium text-lime-400 hover:underline"
      >
        ← Back to dashboard
      </button>

      <h1 className="text-4xl font-bold text-lime-400 mb-4">{title}</h1>
      <p className="mb-8 text-gray-300">{description}</p>

      {/* Tabs */}
      <div className="flex space-x-4 mb-6 border-b border-gray-700">
        {["lectures", "quizzes", "assignments"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-6 py-2 rounded-t-lg font-semibold transition ${
              tab === t
                ? "bg-gray-800 text-lime-400"
                : "bg-gray-700 text-gray-400 hover:text-lime-400"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-gray-800 p-6 rounded-b-lg shadow-lg min-h-[200px]">
        {tab === "lectures" && (
          <ul className="space-y-4">
            {lectures.length === 0 ? (
              <li className="text-gray-400 italic">No lectures uploaded yet.</li>
            ) : (
              lectures.map((lec) => (
                <li
                  key={lec._id}
                  className="flex justify-between items-center border border-gray-700 rounded px-4 py-3 hover:bg-gray-700 transition cursor-pointer"
                >
                  <span>{lec.title}</span>
                  <button
                    onClick={() => handleView(lec)}
                    className="text-lime-400 hover:underline text-sm font-semibold"
                  >
                    View / Download
                  </button>
                </li>
              ))
            )}
          </ul>
        )}

        {tab === "quizzes" && (
          <ul className="space-y-4">
            {quizzes.length === 0 ? (
              <li className="text-gray-400 italic">No quizzes available.</li>
            ) : (
              quizzes.map((q) => (
                <li
                  key={q._id}
                  className="flex justify-between items-center border border-gray-700 rounded px-4 py-3 hover:bg-gray-700 transition"
                >
                  <span>{q.title}</span>
                  <Link
                    to={`/student/course/${courseId}/quiz/${q._id}`}
                    className="text-lime-400 hover:underline text-sm font-semibold"
                  >
                    Take Quiz
                  </Link>
                </li>
              ))
            )}
          </ul>
        )}

        {tab === "assignments" && (
          <ul className="space-y-4">
            {assignments.length === 0 ? (
              <li className="text-gray-400 italic">No assignments available.</li>
            ) : (
              assignments.map((a) => {
                const past = new Date() > new Date(a.deadline);
                return (
                  <li
                    key={a._id}
                    className="flex justify-between items-center border border-gray-700 rounded px-4 py-3 hover:bg-gray-700 transition"
                  >
                    <span>{a.title}</span>
                    <span className="text-sm text-gray-400 mr-4">
                      Due: {new Date(a.deadline).toLocaleString()}
                    </span>
                    {past ? (
                      <button
                        disabled
                        className="cursor-not-allowed px-3 py-1 rounded bg-gray-600 text-gray-500"
                      >
                        Deadline Passed
                      </button>
                    ) : (
                      <Link
                        to={`/student/course/${courseId}/assignment/${a._id}`}
                        className="text-lime-400 hover:underline text-sm font-semibold"
                      >
                        Submit Work
                      </Link>
                    )}
                  </li>
                );
              })
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
