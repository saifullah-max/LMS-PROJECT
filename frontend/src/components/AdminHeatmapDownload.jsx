import React from "react";

export default function AdminHeatmapDownload({ courseId }) {
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";
  const token = localStorage.getItem("token");

  const downloadPDF = async () => {
    if (!courseId) {
      return alert("Please select a course first.");
    }
    try {
      const resp = await fetch(`${BASE}/ai/heatmap/pdf/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!resp.ok) throw new Error("Network response was not ok");
      const blob = await resp.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `course_${courseId}_heatmap_report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error("Download error:", err);
      alert("Failed to download AI heatmap report");
    }
  };

  return (
    <button
      onClick={downloadPDF}
      className="px-4 py-2 bg-lime-400 text-black rounded hover:bg-lime-500 transition"
    >
      Download AI Heatmap Report
    </button>
  );
}
