import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function StudentDashboard() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";
  const token = localStorage.getItem("token");


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
    (async () => {
      try {
        const { data } = await axios.get(`${BASE}/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(data);
      } catch (err) {
        console.error(err);
        setError("Could not load your courses");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-300 text-lg">Loading your courses…</p>
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
    <div className="min-h-screen bg-gray-900 p-6 max-w-6xl mx-auto font-sans text-gray-100">
      <h1 className="text-4xl font-bold text-lime-400 mb-6">My Courses</h1>

      {courses.length === 0 ? (
        <p className="text-gray-400 italic text-lg">You have not been assigned any courses yet.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {courses.map((c) => (
            <div
              key={c._id}
              className="bg-gray-800 p-6 rounded-lg shadow hover:shadow-xl transition"
            >
              <h2 className="text-2xl font-semibold text-lime-300 mb-3">{c.title}</h2>
              <p className="text-gray-400 mb-6">{c.description || "No description provided"}</p>
              <button
                onClick={() => navigate(`/student/course/${c._id}`)}
                className="px-5 py-2 bg-lime-400 text-gray-900 font-semibold rounded hover:bg-lime-500 transition"
              >
                Go to Course
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
