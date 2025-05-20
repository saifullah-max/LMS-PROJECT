import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

export default function LectureUpload() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001/api";

  const [course, setCourse] = useState(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [fileType, setFileType] = useState("video");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await axios.get(`${BASE_URL}/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourse(data);
      } catch (err) {
        console.error(err);
        setError("Could not load course.");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  const handleFileChange = (e) => setFile(e.target.files[0]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!title || !file) {
      setError("Please provide a title and select a file.");
      return;
    }
    setSubmitting(true);

    const form = new FormData();
    form.append("title", title);
    form.append("description", description);
    form.append("fileType", fileType);
    form.append("file", file);

    try {
      await axios.post(`${BASE_URL}/lectures/${courseId}`, form, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });
      setSuccess("Lecture uploaded!");
      setTitle("");
      setDescription("");
      setFile(null);

      const { data } = await axios.get(`${BASE_URL}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCourse(data);
    } catch (err) {
      console.log("SERVER VALIDATION ERROR:", err.response.data);
      setError(
        err.response?.data?.message ||
          err.response?.data?.msg ||
          "Failed to create course"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-300">Loading course…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 max-w-4xl mx-auto font-sans text-gray-100">
      <button
        onClick={() => navigate(-1)}
        className="mb-4 text-sm font-medium text-lime-400 hover:underline"
      >
        ← Back to Courses
      </button>

      <h1 className="mb-2 text-3xl font-semibold text-lime-400">{course?.title}</h1>
      <p className="mb-6 text-gray-300">{course?.description}</p>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-6 rounded-lg shadow-md space-y-4"
      >
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-lime-400">{success}</p>}

        <div>
          <label htmlFor="title" className="block mb-1 font-semibold">
            Lecture Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-400"
          />
        </div>

        <div>
          <label htmlFor="description" className="block mb-1 font-semibold">
            Description (optional)
          </label>
          <textarea
            id="description"
            rows="3"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-400"
          />
        </div>

        <div>
          <label className="block mb-1 font-semibold">File Type</label>
          <select
            value={fileType}
            onChange={(e) => setFileType(e.target.value)}
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-400"
          >
            <option value="video">Video</option>
            <option value="pdf">PDF</option>
          </select>
        </div>

        <div>
          <label htmlFor="file" className="block mb-1 font-semibold">
            Select File
          </label>
          <input
            id="file"
            type="file"
            onChange={handleFileChange}
            className="text-gray-200"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 mt-2 font-semibold rounded bg-lime-400 text-gray-900 hover:bg-lime-500 disabled:opacity-50 transition"
        >
          {submitting ? "Uploading…" : "Upload Lecture"}
        </button>
      </form>

      {course?.lectures?.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-lime-400 mb-2">
            Existing Lectures
          </h2>
          <ul className="space-y-2">
            {course.lectures.map((lec) => (
              <li
                key={lec._id}
                className="flex justify-between bg-gray-800 p-3 rounded shadow-sm"
              >
                <span>{lec.title}</span>
                <a
                  href={lec.offlineUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-lime-400 hover:underline text-sm"
                >
                  View
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
