import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ReportCard() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";
  const token = localStorage.getItem("token");

  useEffect(() => {
    (async () => {
      try {
        // 🔄 hit our new combined endpoint
        const { data } = await axios.get(
          `${BASE}/ai/course-report/${courseId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setReport(data.report);
      } catch (err) {
        console.error("Failed to load report:", err);
        setError("Could not load report.");
      } finally {
        setLoading(false);
      }
    })();
  }, [BASE, courseId, token]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-300">Loading report…</p>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-red-500">{error}</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-900 p-6 max-w-3xl mx-auto text-gray-100 font-sans">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-sm font-medium text-lime-400 hover:underline"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-semibold text-lime-400 mb-4">
        AI Course Performance Report
      </h1>

      <div className="bg-gray-800 p-6 rounded-lg whitespace-pre-wrap">
        {report}
      </div>
    </div>
  );
}
