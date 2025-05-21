import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [courses, setCourses] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";


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
    // Fetching analytics data
    (async () => {
      try {
        const res = await axios.get(`${BASE}/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setData(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load analytics.");
      } finally {
        setLoading(false);
      }
    })();

    // Fetching all courses
    (async () => {
      try {
        const res = await axios.get(`${BASE}/admin/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load courses.");
      }
    })();
  }, [token]);

  const handleDeleteCourse = async (courseId) => {
    if (window.confirm("Are you sure you want to delete this course?")) {
      try {
        await axios.delete(`${BASE}/admin/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(courses.filter((course) => course._id !== courseId));
      } catch (err) {
        console.error("Delete error:", err);
        setError("Failed to delete course");
      }
    }
  };

  if (loading) return <p className="p-6 text-[var(--clr-primary-a40)]">Loading…</p>;
  if (error) return <p className="p-6 text-[var(--clr-primary-a40)]">{error}</p>;

  const { users, totalCourses, quizStats, assignmentStats } = data;

  return (
    <div className="min-h-screen bg-[var(--clr-surface-a0)] p-6 font-sans">
      <h1 className="text-3xl font-semibold text-[var(--clr-primary-a0)] mb-6">
        Site Analytics
      </h1>

      {/* Users Analytics */}
      <section className="mb-8 bg-[var(--clr-surface-a20)] p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-medium text-[var(--clr-primary-a0)] mb-2">
          Users
        </h2>
        <ul className="list-disc ml-6 text-[var(--clr-primary-a10)]">
          <li>Students: {users.students}</li>
          <li>Teachers: {users.teachers}</li>
          <li>Admins: {users.admins}</li>
        </ul>
      </section>

      {/* Total Courses */}
      <section className="mb-8 bg-[var(--clr-surface-a20)] p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-medium text-[var(--clr-primary-a0)] mb-2">
          Courses
        </h2>
        <p className="text-[var(--clr-primary-a10)]">Total Courses: {totalCourses}</p>
      </section>

      {/* Courses Table */}
      <section className="mb-8 bg-[var(--clr-surface-a20)] p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-medium text-[var(--clr-primary-a0)] mb-2">
          All Courses
        </h2>
        <table className="w-full text-[var(--clr-primary-a10)]">
          <thead>
            <tr>
              <th className="text-left pb-2">Course Name</th>
              <th className="text-right pb-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course) => (
              <tr key={course._id}>
                <td className="py-1">{course.title}</td>
                <td className="py-1 text-right">
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                    onClick={() => handleDeleteCourse(course._id)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Quiz Stats */}
      <section className="mb-8 bg-[var(--clr-surface-a20)] p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-medium text-[var(--clr-primary-a0)] mb-4">
          Quiz Statistics
        </h2>
        <table className="w-full text-[var(--clr-primary-a10)]">
          <thead>
            <tr>
              <th className="text-left pb-2">Course</th>
              <th className="text-right pb-2">Quizzes</th>
              <th className="text-right pb-2">Attempts</th>
              <th className="text-right pb-2">Avg Score</th>
            </tr>
          </thead>
          <tbody>
            {quizStats.map((q) => (
              <tr key={q.courseTitle}>
                <td className="py-1">{q.courseTitle}</td>
                <td className="py-1 text-right">{q.quizCount}</td>
                <td className="py-1 text-right">{q.totalAttempts}</td>
                <td className="py-1 text-right">{q.avgScore.toFixed(1)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* Assignment Stats */}
      <section className="bg-[var(--clr-surface-a20)] p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-medium text-[var(--clr-primary-a0)] mb-4">
          Assignment Submissions
        </h2>
        <table className="w-full text-[var(--clr-primary-a10)]">
          <thead>
            <tr>
              <th className="text-left pb-2">Course</th>
              <th className="text-right pb-2">Submissions</th>
            </tr>
          </thead>
          <tbody>
            {assignmentStats.map((a) => (
              <tr key={a.courseTitle}>
                <td className="py-1">{a.courseTitle}</td>
                <td className="py-1 text-right">{a.submissionCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
