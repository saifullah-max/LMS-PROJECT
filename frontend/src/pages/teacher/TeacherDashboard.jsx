import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from "react-select";
import axios from "axios";

export default function TeacherDashboard() {
  const [courses, setCourses] = useState([]);
  const [allStudents, setAllStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const [selectedMap, setSelectedMap] = useState({});
  const [assigningMap, setAssigningMap] = useState({});

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";

  useEffect(() => {
    (async () => {
      try {
        const [{ data: coursesData }, { data: studentsData }] = await Promise.all([
          axios.get(`${BASE}/courses`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${BASE}/users?role=student`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);
        setCourses(coursesData);
        setAllStudents(studentsData);
      } catch (err) {
        console.error(err);
        setError("Could not load data");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreateError("");
    if (!newTitle.trim()) {
      setCreateError("Title is required");
      return;
    }
    setCreating(true);
    try {
      const { data: course } = await axios.post(
        `${BASE}/courses`,
        { title: newTitle, description: newDesc },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCourses((c) => [course, ...c]);
      setNewTitle("");
      setNewDesc("");
    } catch (err) {
      console.error("Error creating course", err);
      setCreateError(err.response?.data?.msg || "Failed to create course");
    } finally {
      setCreating(false);
    }
  };

  const handleAssign = async (courseId) => {
    const studentIds = selectedMap[courseId] || [];
    if (!studentIds.length) return;
    setAssigningMap((m) => ({ ...m, [courseId]: true }));
    try {
      const { data: updated } = await axios.post(
        `${BASE}/courses/${courseId}/assign-students`,
        { studentIds },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCourses((cs) => cs.map((c) => (c._id === courseId ? updated : c)));
      setSelectedMap((m) => ({ ...m, [courseId]: [] }));
    } catch (err) {
      console.error("Assign error", err);
      alert(err.response?.data?.msg || "Assignment failed");
    } finally {
      setAssigningMap((m) => ({ ...m, [courseId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-300 text-lg">Loading…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );
  }

  const studentOptions = allStudents.map((s) => ({
    value: s._id,
    label: `${s.name} (${s.email})`,
  }));

  return (
    <div className="min-h-screen bg-gray-900 p-8 font-sans text-gray-100 max-w-7xl mx-auto">
      <h1 className="text-4xl font-bold text-lime-400 mb-8">Teacher Dashboard</h1>

      {/* New Course Form */}
      <form
        onSubmit={handleCreate}
        className="mb-12 bg-gray-800 rounded-lg p-6 shadow-lg max-w-md"
      >
        <h2 className="text-2xl font-semibold text-lime-400 mb-4">+ New Course</h2>
        {createError && (
          <p className="mb-4 text-red-500 font-medium">{createError}</p>
        )}
        <div className="mb-4">
          <label className="block mb-1 font-semibold" htmlFor="newTitle">
            Title
          </label>
          <input
            id="newTitle"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Intro to React"
            required
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400"
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 font-semibold" htmlFor="newDesc">
            Description (optional)
          </label>
          <textarea
            id="newDesc"
            value={newDesc}
            onChange={(e) => setNewDesc(e.target.value)}
            rows={3}
            placeholder="Course overview…"
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-gray-100 focus:outline-none focus:ring-2 focus:ring-lime-400"
          />
        </div>
        <button
          type="submit"
          disabled={creating}
          className="w-full bg-lime-400 text-gray-900 font-semibold rounded py-2 hover:bg-lime-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          {creating ? "Creating…" : "Create Course"}
        </button>
      </form>

      {/* Course Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {courses.map((course) => (
          <div
            key={course._id}
            className="bg-gray-800 rounded-lg p-6 shadow hover:shadow-xl transition"
          >
            <h3 className="text-xl font-semibold text-lime-300 mb-2">
              {course.title}
            </h3>
            <p className="text-gray-400 mb-6">{course.description || "No description"}</p>

            <div className="flex flex-wrap gap-2 mb-6">
              <button
                onClick={() => navigate(`/teacher/course/${course._id}/lectures`)}
                className="px-3 py-1 rounded bg-lime-400 text-gray-900 font-medium hover:bg-lime-500 transition"
              >
                Upload Lectures
              </button>
              <button
                onClick={() => navigate(`/teacher/course/${course._id}/quizzes`)}
                className="px-3 py-1 rounded bg-lime-400 text-gray-900 font-medium hover:bg-lime-500 transition"
              >
                Author Quizzes
              </button>
              <button
                onClick={() => navigate(`/teacher/course/${course._id}/assignments`)}
                className="px-3 py-1 rounded bg-lime-400 text-gray-900 font-medium hover:bg-lime-500 transition"
              >
                Author Assignments
              </button>
              <button
                onClick={() =>
                  navigate(`/teacher/course/${course._id}/assignments/grade`)
                }
                className="px-3 py-1 rounded bg-lime-400 text-gray-900 font-medium hover:bg-lime-500 transition"
              >
                Grade Assignments
              </button>
              <button
                onClick={() => navigate(`/teacher/course/${course._id}/progress`)}
                className="px-3 py-1 rounded bg-lime-400 text-gray-900 font-medium hover:bg-lime-500 transition"
              >
                View Progress
              </button>
            </div>

            <div>
              <label className="block mb-2 font-semibold text-gray-300">
                Assign Students
              </label>
              <Select
                isMulti
                options={studentOptions}
                value={studentOptions.filter((o) =>
                  (selectedMap[course._id] || []).includes(o.value)
                )}
                onChange={(selected) =>
                  setSelectedMap((m) => ({
                    ...m,
                    [course._id]: selected.map((o) => o.value),
                  }))
                }
                placeholder="Search & select…"
                className="text-gray-900"
                classNamePrefix="select"
              />
              <button
                onClick={() => handleAssign(course._id)}
                disabled={
                  assigningMap[course._id] || !(selectedMap[course._id]?.length > 0)
                }
                className="mt-3 w-full bg-lime-400 text-gray-900 font-semibold rounded py-2 hover:bg-lime-500 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {assigningMap[course._id] ? "Assigning…" : "Assign Selected"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
