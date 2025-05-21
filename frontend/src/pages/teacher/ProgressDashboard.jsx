// src/pages/ProgressDashboard.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ProgressDashboard() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001/api";
  const token = localStorage.getItem("token");

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://cdn.weglot.com/weglot.min.js";
    script.onload = () => {
      // Initialize Weglot once the script is loaded
      Weglot.initialize({
        api_key: "wg_96813b70717ac14018000943f675710e4",
      });
    };
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(
          `${BASE_URL}/courses/${courseId}/progress`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setStudents(res.data);
      } catch (err) {
        console.error(err);
        setError("Could not load progress data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId, BASE_URL, token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-300">Loading progress…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 max-w-6xl mx-auto font-sans text-gray-100">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm font-medium text-lime-400 hover:underline"
      >
        ← Back to Courses
      </button>

      <h1 className="mb-6 text-3xl font-semibold text-lime-400">
        Student Progress
      </h1>

      <div className="overflow-auto bg-gray-800 rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-700">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-300">
                Student
              </th>
              <th className="px-4 py-2 text-center font-medium text-gray-300">
                Lectures
              </th>
              <th className="px-4 py-2 text-center font-medium text-gray-300">
                Quizzes
              </th>
              <th className="px-4 py-2 text-center font-medium text-gray-300">
                Avg Score
              </th>
              <th className="px-4 py-2 text-center font-medium text-gray-300">
                Assignments
              </th>
              <th className="px-4 py-2 text-center font-medium text-gray-300">
                Report
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {students.map((s) => (
              <tr key={s.student._id} className="bg-gray-800 hover:bg-gray-700">
                <td className="px-4 py-3">
                  <div className="font-medium">{s.student.name}</div>
                  <div className="text-sm text-gray-400">{s.student.email}</div>
                </td>
                <td className="px-4 py-3 text-center">
                  {Math.round(s.lecturesPct)}%
                </td>
                <td className="px-4 py-3 text-center">
                  {Math.round(s.quizzesPct)}%
                </td>
                <td className="px-4 py-3 text-center">
                  {s.avgScore != null ? `${s.avgScore.toFixed(1)}%` : "—"}
                </td>
                <td className="px-4 py-3 text-center">
                  {s.assignmentsSubmitted}/{s.totalAssignments}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() =>
                      navigate(
                        `/teacher/course/${courseId}/report-card/${s.student._id}`
                      )
                    }
                    className="text-sm font-medium text-lime-400 hover:underline"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
