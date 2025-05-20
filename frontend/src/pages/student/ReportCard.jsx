import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ReportCard() {
  const { studentId, courseId } = useParams();
  const navigate = useNavigate();
  const [report, setReport] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001/api";
  const token = localStorage.getItem("token");

  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${BASE_URL}/ai/report-card/${studentId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReport(res.data.reportCard);
      } catch (err) {
        console.error(err);
        setError("Failed to load report card.");
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-300 text-lg">Loading report card…</p>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 px-4">
        <p className="text-red-500 text-center max-w-md">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 max-w-4xl mx-auto font-sans rounded shadow">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-lime-600 font-semibold hover:underline"
      >
        ← Back
      </button>
      <h1 className="text-3xl font-bold mb-6">Report Card</h1>
      <pre className="whitespace-pre-wrap text-gray-800">{report}</pre>
    </div>
  );
}
