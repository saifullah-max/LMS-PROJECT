// src/pages/admin/AdminAnalytics.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

export default function AdminAnalytics() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem("token");
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";

  useEffect(() => {
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
  }, []);

  if (loading) return <p className="p-6 text-text">Loading…</p>;
  if (error) return <p className="p-6 text-secondary">{error}</p>;

  const { users, totalCourses, quizStats, assignmentStats } = data;

  return (
    <div className="min-h-screen bg-neutral p-6 font-sans">
      <h1 className="text-3xl font-semibold text-primary mb-6">
        Site Analytics
      </h1>

      <section className="mb-8 bg-white p-6 rounded shadow">
        <h2 className="text-xl font-medium text-primary mb-2">Users</h2>
        <ul className="list-disc ml-6 text-text">
          <li>Students: {users.students}</li>
          <li>Teachers: {users.teachers}</li>
          <li>Admins: {users.admins}</li>
        </ul>
      </section>

      <section className="mb-8 bg-white p-6 rounded shadow">
        <h2 className="text-xl font-medium text-primary mb-2">Courses</h2>
        <p className="text-text">Total Courses: {totalCourses}</p>
      </section>

      <section className="mb-8 bg-white p-6 rounded shadow">
        <h2 className="text-xl font-medium text-primary mb-4">
          Quiz Statistics
        </h2>
        <table className="w-full text-text">
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

      <section className="bg-white p-6 rounded shadow">
        <h2 className="text-xl font-medium text-primary mb-4">
          Assignment Submissions
        </h2>
        <table className="w-full text-text">
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
