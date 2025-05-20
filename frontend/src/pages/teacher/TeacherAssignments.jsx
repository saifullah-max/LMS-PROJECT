import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

export default function TeacherAssignments() {
  const { courseId } = useParams();

  const [lectures, setLectures] = useState([]);
  const [title, setTitle] = useState("");
  const [desc, setDesc] = useState("");
  const [lectureId, setLectureId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [file, setFile] = useState(null);

  const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";
  const ASSIGN_BASE = `${API_BASE}/assignments`;
  const token = localStorage.getItem("token");

  useEffect(() => {
    axios
      .get(`${API_BASE}/lectures/course/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((r) => {
        if (Array.isArray(r.data)) {
          setLectures(r.data);
        } else {
          setLectures([]);
          console.warn("Expected lectures array, got:", r.data);
        }
      })
      .catch((err) => {
        console.error("Could not load lectures:", err);
        setLectures([]);
      });
  }, [API_BASE, courseId, token]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!lectureId || !title || !deadline || !file) {
      return alert("Please fill out every field");
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("lectureId", lectureId);
    fd.append("title", title);
    fd.append("description", desc);
    fd.append("deadline", deadline);

    try {
      await axios.post(`${ASSIGN_BASE}/${courseId}`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      alert("Assignment created!");
      setTitle("");
      setDesc("");
      setLectureId("");
      setDeadline("");
      setFile(null);
    } catch (err) {
      console.error("Assignment creation failed:", err);
      alert(err.response?.data?.msg || "Failed to create assignment");
    }
  };

  return (
    <div className="min-h-screen p-6 bg-gray-900 font-sans max-w-4xl mx-auto text-gray-100">
      <h1 className="text-3xl font-bold mb-6 text-lime-400">Author Assignment</h1>

      <form
        onSubmit={handleCreate}
        className="space-y-6 bg-gray-800 p-6 rounded-lg shadow-lg"
      >
        <div>
          <label className="block mb-2 font-semibold">Attach to Lecture</label>
          <select
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-400"
            value={lectureId}
            onChange={(e) => setLectureId(e.target.value)}
            required
          >
            <option value="">— select lecture —</option>
            {lectures.map((lec) => (
              <option key={lec._id} value={lec._id}>
                {lec.title}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-semibold">Title</label>
          <input
            type="text"
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-400"
            placeholder="Assignment title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Description</label>
          <textarea
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-400"
            placeholder="Details (optional)"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            rows={3}
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Deadline</label>
          <input
            type="datetime-local"
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-400"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Upload File</label>
          <input
            type="file"
            accept=".pdf,.docx"
            onChange={(e) => setFile(e.target.files[0] || null)}
            className="text-gray-200"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full bg-lime-400 text-gray-900 font-semibold py-2 rounded hover:bg-lime-500 transition"
        >
          Create Assignment
        </button>
      </form>
    </div>
  );
}
