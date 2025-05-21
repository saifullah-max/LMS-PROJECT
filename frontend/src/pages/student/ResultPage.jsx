import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export default function ResultPage() {
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

  const {
    feedback = [],
    recommendation = "",
    score = 0,
    total = 0,
  } = useLocation().state || {};
  const navigate = useNavigate();
  const passed = score >= total / 2;

  return (
    <div
      style={{
        padding: 30,
        background: "#111",
        color: "#fff",
        maxWidth: 800,
        margin: "auto",
      }}
    >
      <h1 style={{ color: "#9CFF6A" }}>
        You scored {score} / {total}
      </h1>
      <p style={{ color: passed ? "lightgreen" : "salmon" }}>
        {passed ? "🎉 Passed!" : "😞 Failed."}
      </p>

      <section
        style={{
          margin: "20px 0",
          background: "#333",
          padding: 15,
          borderRadius: 6,
        }}
      >
        <h2 style={{ color: "#9CFF6A" }}>Detailed Feedback</h2>
        {feedback.map((fb) => (
          <div
            key={fb.question}
            style={{
              marginBottom: 10,
              background: "#222",
              padding: 10,
              borderRadius: 4,
            }}
          >
            <p>
              <strong>Q{fb.question}:</strong>{" "}
              {fb.correct ? (
                <span style={{ color: "lightgreen" }}>Correct</span>
              ) : (
                <span style={{ color: "salmon" }}>Incorrect</span>
              )}
            </p>
            <p>
              <em>Explanation:</em> {fb.explanation}
            </p>
            {fb.tip && (
              <p>
                <em>Tip:</em> {fb.tip}
              </p>
            )}
          </div>
        ))}
      </section>

      {recommendation && (
        <section
          style={{
            margin: "20px 0",
            background: "#222",
            padding: 15,
            borderRadius: 6,
          }}
        >
          <h2 style={{ color: "#9CFF6A" }}>Recommendation</h2>
          <p>{recommendation}</p>
        </section>
      )}

      <button
        onClick={() => navigate(-1)}
        style={{ padding: 10, background: "#9CFF6A", border: "none" }}
      >
        ← Back
      </button>
    </div>
  );
}
