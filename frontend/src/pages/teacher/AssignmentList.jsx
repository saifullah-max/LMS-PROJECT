// frontend/AssignmentList.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";

export default function AssignmentList() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [error, setError] = useState("");
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";

  useEffect(() => {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://cdn.weglot.com/weglot.min.js";
    script.onload = () => {
      Weglot.initialize({
        api_key: "wg_96813b70717ac14018000943f675710e4",
      });
    };
    document.head.appendChild(script);
    return () => document.head.removeChild(script);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(
          `${BASE}/assignments/course/${courseId}`,
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
        setAssignments(data);
      } catch (err) {
        console.error(err);
        setError("Could not load assignments.");
      }
    })();
  }, [courseId]);

  if (error)
    return (
      <p className="p-6 text-red-600 font-semibold max-w-4xl mx-auto">
        {error}
      </p>
    );
  if (!assignments.length)
    return (
      <p className="p-6 max-w-4xl mx-auto text-gray-200 font-semibold">
        No assignments yet.
      </p>
    );

  return (
    <div className="p-6 max-w-4xl mx-auto font-sans text-gray-100 bg-gray-900 min-h-screen">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-lime-400 hover:underline"
      >
        ← Back
      </button>
      <h1 className="text-2xl font-semibold mb-6 text-lime-400">
        Choose Assignment to Grade
      </h1>
      <ul className="space-y-4">
        {assignments.map((a) => (
          <li
            key={a._id}
            className="flex justify-between items-center border border-gray-700 p-4 rounded bg-gray-800"
          >
            <span>{a.title}</span>
            <Link
              to={`/teacher/course/${courseId}/assignments/grade/${a._id}`}
              className="text-lime-400 hover:underline"
            >
              Grade
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
