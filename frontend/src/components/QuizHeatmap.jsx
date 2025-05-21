// src/components/QuizHeatmap.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function QuizHeatmap() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";
  const token = localStorage.getItem("token");

  const [heatmapData, setHeatmapData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(
          `${BASE}/ai/heatmap/${quizId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setHeatmapData(data.heatmapData);
      } catch (err) {
        console.error("Heatmap fetch error:", err);
        setError("Could not load heatmap data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [BASE, quizId, token]);

  if (loading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#111",
        color: "#ccc"
      }}>
        Loading heatmap…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        padding: 20,
        background: "#111",
        color: "salmon",
        fontFamily: "sans-serif"
      }}>
        <p>{error}</p>
        <button
          onClick={() => navigate(-1)}
          style={{
            padding: "8px 12px",
            background: "#9CFF6A",
            color: "#222",
            border: "none",
            borderRadius: 4,
            cursor: "pointer"
          }}
        >
          ← Back
        </button>
      </div>
    );
  }

  // helper to convert rate [0..1] → HSL hue (0=red → 120=green)
  const rateToColor = (rate) => {
    const hue = Math.round(rate * 120);
    return `hsl(${hue}, 75%, 60%)`;
  };

  return (
    <div style={{
      background: "#111",
      color: "#fff",
      padding: 20,
      fontFamily: "sans-serif",
      maxWidth: 800,
      margin: "0 auto"
    }}>
      <h1 style={{ marginBottom: 20 }}>Quiz Heatmap</h1>
      <table style={{
        width: "100%",
        borderCollapse: "collapse"
      }}>
        <thead>
          <tr>
            <th style={thStyle}>Question #</th>
            <th style={thStyle}>Question Text</th>
            <th style={thStyle}>Correct Rate</th>
          </tr>
        </thead>
        <tbody>
          {heatmapData.map(({ questionNumber, questionText, correctRate }) => (
            <tr key={questionNumber}>
              <td style={tdStyle}>{questionNumber}</td>
              <td style={tdStyle}>{questionText}</td>
              <td
                style={{
                  ...tdStyle,
                  backgroundColor: rateToColor(correctRate),
                  textAlign: "center",
                  fontWeight: 600
                }}
              >
                {(correctRate * 100).toFixed(0)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button
        onClick={() => navigate(-1)}
        style={{
          marginTop: 20,
          padding: "8px 12px",
          background: "#9CFF6A",
          color: "#222",
          border: "none",
          borderRadius: 4,
          cursor: "pointer"
        }}
      >
        ← Back
      </button>
    </div>
  );
}

// simple cell styles
const thStyle = {
  borderBottom: "2px solid #444",
  padding: "10px",
  textAlign: "left"
};
const tdStyle = {
  borderBottom: "1px solid #333",
  padding: "10px"
};
