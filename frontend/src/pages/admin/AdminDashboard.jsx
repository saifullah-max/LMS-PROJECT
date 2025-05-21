// src/pages/AdminDashboard.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import AdminHeatmapDownload from "../../components/AdminHeatmapDownload";

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <div style={{
      padding: 20,
      background: "#111",
      color: "#fff",
      minHeight: "100vh",
      fontFamily: "sans-serif"
    }}>
      <h1 style={{ marginBottom: 20, color: "#9CFF6A" }}>
        Admin Dashboard
      </h1>

      {/* Other admin controls… */}

      <section style={{ marginBottom: 40 }}>
        <h2 style={{ marginBottom: 10 }}>Analytics</h2>
        <AdminHeatmapDownload />
      </section>

      {/* Example: link back to main app */}
      <button
        onClick={() => navigate("/")}
        style={{
          padding: "8px 15px",
          background: "#444",
          color: "#fff",
          border: "none",
          borderRadius: 4,
          cursor: "pointer"
        }}
      >
        Back to Home
      </button>
    </div>
  );
}
