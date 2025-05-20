import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function QuizAuthoring() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001/api";
  const token = localStorage.getItem("token");

  const [course, setCourse] = useState(null);
  const [lectures, setLectures] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [selectedLecture, setSelectedLecture] = useState("");
  const [quizTitle, setQuizTitle] = useState("");
  const [questions, setQuestions] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const { data: c } = await axios.get(`${BASE_URL}/courses/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourse(c);
        setQuizzes(c.quizzes || []);

        const { data: lecList } = await axios.get(
          `${BASE_URL}/lectures/course/${courseId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setLectures(lecList);
      } catch (err) {
        console.error(err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    })();
  }, [courseId]);

  const addQuestion = () =>
    setQuestions((qs) => [
      ...qs,
      { text: "", options: ["", ""], correctOption: 0 },
    ]);

  const updateQuestion = (qi, field, val) =>
    setQuestions((qs) => {
      const copy = [...qs];
      copy[qi][field] = val;
      return copy;
    });

  const updateOption = (qi, oi, val) =>
    setQuestions((qs) => {
      const copy = [...qs];
      copy[qi].options[oi] = val;
      return copy;
    });

  const addOption = (qi) =>
    setQuestions((qs) => {
      const copy = [...qs];
      copy[qi].options.push("");
      return copy;
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLecture || !quizTitle || !questions.length) {
      setError("All fields are required.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(
        `${BASE_URL}/quizzes`,
        {
          course: courseId,
          lecture: selectedLecture,
          title: quizTitle,
          questions,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { data: c } = await axios.get(`${BASE_URL}/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setQuizzes(c.quizzes || []);
      setQuizTitle("");
      setQuestions([]);
      setSelectedLecture("");
      setError("");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || "Quiz creation failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <p className="text-gray-300">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6 max-w-5xl mx-auto font-sans text-gray-100">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 text-sm text-lime-400 hover:underline"
      >
        ← Back to Courses
      </button>

      <h1 className="text-3xl font-semibold text-lime-400 mb-6">
        {course?.title} — Quizzes
      </h1>

      {error && <p className="mb-4 text-red-500 font-semibold">{error}</p>}

      <div className="mb-6">
        <label className="block mb-2 font-semibold text-gray-300">
          Select Lecture
        </label>
        <select
          required
          value={selectedLecture}
          onChange={(e) => setSelectedLecture(e.target.value)}
          className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-400"
        >
          <option value="">— choose a lecture —</option>
          {lectures.map((l) => (
            <option key={l._id} value={l._id}>
              {l.title}
            </option>
          ))}
        </select>
      </div>

      {quizzes.length > 0 && (
        <ul className="mb-6 space-y-2">
          {quizzes.map((q) => (
            <li
              key={q._id}
              className="bg-gray-800 p-3 rounded flex justify-between"
            >
              <span>{q.title}</span>
              <Link
                to={`/student/course/${courseId}/quiz/${q._id}`}
                className="text-lime-400 hover:underline text-sm"
              >
                Preview
              </Link>
            </li>
          ))}
        </ul>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-gray-800 p-6 rounded shadow-lg"
      >
        <h2 className="text-2xl font-semibold text-lime-400">
          Create New Quiz
        </h2>

        <div>
          <label className="block mb-2 font-semibold text-gray-300">
            Quiz Title
          </label>
          <input
            value={quizTitle}
            onChange={(e) => setQuizTitle(e.target.value)}
            required
            className="w-full rounded border border-gray-700 bg-gray-900 px-3 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-400"
          />
        </div>

        {questions.map((q, qi) => (
          <div
            key={`q-${qi}`}
            className="p-4 border border-gray-700 rounded space-y-3 bg-gray-800"
          >
            <label className="block font-semibold text-gray-300">
              Question #{qi + 1}
            </label>
            <input
              type="text"
              value={q.text}
              onChange={(e) => updateQuestion(qi, "text", e.target.value)}
              required
              className="w-full rounded border border-gray-700 bg-gray-900 px-2 py-1 text-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-400"
            />

            <div className="space-y-2">
              <span className="block font-semibold text-gray-300">
                Options:
              </span>
              {q.options.map((opt, oi) => (
                <div
                  key={`q-${qi}-opt-${oi}`}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={q.correctOption === oi}
                      onChange={() => updateQuestion(qi, "correctOption", oi)}
                      className="h-4 w-4 text-lime-400"
                    />
                    <input
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      required
                      placeholder={`Option #${oi + 1}`}
                      className="flex-1 rounded border border-gray-700 bg-gray-900 px-2 py-2 text-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-400"
                    />
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addOption(qi)}
                className="text-sm text-lime-400 hover:underline"
              >
                + Add Option
              </button>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addQuestion}
          className="text-sm text-lime-400 hover:underline"
        >
          + Add Question
        </button>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2 bg-lime-400 text-gray-900 rounded font-semibold hover:bg-lime-500 disabled:opacity-50 transition"
        >
          {submitting ? "Creating…" : "Create Quiz"}
        </button>
      </form>
    </div>
  );
}
