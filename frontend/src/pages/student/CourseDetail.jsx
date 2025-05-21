// src/pages/CourseDetail.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";
  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [assignmentsList, setAssignmentsList] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("lectures");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // 1️⃣ Load current user
  useEffect(() => {
    axios
      .get(`${BASE}/auth/me`, { headers })
      .then(({ data }) => setUser(data))
      .catch(console.error);
  }, []);

  // 2️⃣ Load course, lectures, quizzes, basic assignments
  useEffect(() => {
    (async () => {
      try {
        const [{ data: c }, { data: lects }, { data: qs }, { data: asgs }] =
          await Promise.all([
            axios.get(`${BASE}/courses/${courseId}`, { headers }),
            axios.get(`${BASE}/lectures/course/${courseId}`, { headers }),
            axios.get(`${BASE}/quizzes/course/${courseId}`, { headers }),
            axios.get(`${BASE}/assignments/course/${courseId}`, {
              headers,
            }),
          ]);

        setCourse(c);
        setLectures(lects);
        setQuizzes(qs);
        setAssignmentsList(asgs);
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Could not load course data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, user]);

  // 3️⃣ If student, enrich assignmentsList with your grade
  useEffect(() => {
    if (!user || user.role !== "student") {
      setAssignments(assignmentsList);
      return;
    }
    (async () => {
      const enriched = await Promise.all(
        assignmentsList.map(async (a) => {
          try {
            const { data: full } = await axios.get(
              `${BASE}/assignments/${a._id}`,
              { headers }
            );
            const mine = full.submissions.find(
              (s) => s.student._id === user._id
            );
            return { ...a, mySubmission: mine };
          } catch {
            return { ...a, mySubmission: null };
          }
        })
      );
      setAssignments(enriched);
    })();
  }, [assignmentsList, user]);

  const handleViewLecture = (lec) => {
    axios
      .get(`${BASE}/lectures/${lec._id}/view`, { headers })
      .then((res) => window.open(res.data.offlineUrl, "_blank"))
      .catch(console.error);
  };

  const handleTakeQuiz = async (quiz) => {
    try {
      const { data } = await axios.get(
        `${BASE}/lectures/${quiz.lecture}/status`,
        { headers }
      );
      if (data.viewed) {
        navigate(`/student/course/${courseId}/quiz/${quiz._id}`);
      } else {
        alert("Please view the lecture before attempting the quiz.");
      }
    } catch {
      alert("Could not verify lecture view status.");
    }
  };

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
        <p className="text-red-500 text-center text-lg max-w-md">
          {error || "Course not found."}
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 max-w-5xl mx-auto font-sans text-gray-100">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-sm font-medium text-lime-400 hover:underline"
      >
        ← Back to dashboard
      </button>

      <h1 className="text-4xl font-bold text-lime-400 mb-4">{course.title}</h1>
      <p className="mb-8 text-gray-300">{course.description}</p>

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
              <li className="text-gray-400 italic">
                No lectures uploaded yet.
              </li>
            ) : (
              lectures.map((lec) => (
                <li
                  key={lec._id}
                  className="flex justify-between items-center border border-gray-700 rounded px-4 py-3 hover:bg-gray-700 transition cursor-pointer"
                >
                  <span>{lec.title}</span>
                  <span className="text-sm text-gray-400 ml-4">
                    Difficulty: {lec.difficulty}
                  </span>
                  <button
                    onClick={() => handleViewLecture(lec)}
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
                  <button
                    onClick={() => handleTakeQuiz(q)}
                    className="text-lime-400 hover:underline text-sm font-semibold"
                  >
                    Take Quiz
                  </button>
                </li>
              ))
            )}
          </ul>
        )}

        {tab === "assignments" && (
          <ul className="space-y-4">
            {assignments.length === 0 ? (
              <li className="text-gray-400 italic">
                No assignments available.
              </li>
            ) : (
              assignments.map((a) => {
                const past = new Date() > new Date(a.deadline);
                const my = a.mySubmission;
                return (
                  <li
                    key={a._id}
                    className="flex justify-between items-center border border-gray-700 rounded px-4 py-3 hover:bg-gray-700 transition"
                  >
                    <div>
                      <span>{a.title}</span>
                      <div className="flex space-x-4 mt-1 text-sm text-gray-400">
                        <span>
                          Due: {new Date(a.deadline).toLocaleString()}
                        </span>
                        {my && my.grade != null && (
                          <span className="text-lime-400">
                            Grade: {my.grade}
                          </span>
                        )}
                      </div>
                    </div>
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
                        {my ? "Edit Submission" : "Submit Work"}
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
