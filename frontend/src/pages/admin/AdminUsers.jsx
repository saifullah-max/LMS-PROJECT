import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";
import AdminHeatmapDownload from "../../components/AdminHeatmapDownload";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [courses, setCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "student",
  });
  const [submitting, setSubmitting] = useState(false);

  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";

  // Fetch users
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${BASE}/admin/users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data);
      } catch (err) {
        console.error(err);
        setError("Failed to load users.");
      } finally {
        setLoading(false);
      }
    })();
  }, [token, BASE]);

  // Fetch courses
  useEffect(() => {
    (async () => {
      try {
        const res = await axios.get(`${BASE}/courses`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCourses(res.data);
      } catch (err) {
        console.error("Failed to load courses:", err);
      }
    })();
  }, [token, BASE]);

  const handleField = (e) =>
    setNewUser({ ...newUser, [e.target.name]: e.target.value });

  const createUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await axios.post(`${BASE}/admin/users`, newUser, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const { data } = await axios.get(`${BASE}/admin/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(data);
      setNewUser({ name: "", email: "", password: "", role: "student" });
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.msg || "Could not create user");
    } finally {
      setSubmitting(false);
    }
  };

  const updateRole = async (userId, role) => {
    try {
      await axios.patch(
        `${BASE}/admin/users/${userId}`,
        { role },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setUsers((u) => u.map((x) => (x._id === userId ? { ...x, role } : x)));
    } catch (err) {
      console.error(err);
      setError("Failed to update role");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center font-sans">
        <p className="text-gray-300 text-lg">Loading users…</p>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center font-sans">
        <p className="text-red-500 text-lg">{error}</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-900 p-6 font-sans">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-lime-400">
          User Management
        </h1>

        <div className="flex items-center space-x-4">
          <Link
            to="/admin/analytics"
            className="px-4 py-2 bg-lime-400 text-black rounded hover:bg-lime-500 transition"
          >
            View Analytics
          </Link>

          {/* Course Selector */}
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="px-4 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-lime-400"
          >
            <option value="">Select Course</option>
            {courses.map((c) => (
              <option key={c._id} value={c._id}>
                {c.title}
              </option>
            ))}
          </select>

          {/* Single Button: generates AI-enhanced PDF heatmap + summary */}
          <AdminHeatmapDownload courseId={selectedCourse} />
        </div>
      </div>

      {/* Create User Form */}
      <form
        onSubmit={createUser}
        className="mb-8 bg-gray-800 p-6 rounded-lg shadow-lg"
      >
        <h2 className="text-xl font-semibold text-lime-400 mb-6">
          Add New User
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
          {["name", "email", "password"].map((f) => (
            <div key={f} className="space-y-2">
              <label className="block text-gray-200">
                {f[0].toUpperCase() + f.slice(1)}
              </label>
              <input
                name={f}
                type={f === "password" ? "password" : "text"}
                value={newUser[f]}
                onChange={handleField}
                required
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-opacity-50"
              />
            </div>
          ))}
          <div className="space-y-2">
            <label className="block text-gray-200">Role</label>
            <select
              name="role"
              value={newUser.role}
              onChange={handleField}
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-lime-400 focus:ring-opacity-50"
            >
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 mt-4 bg-lime-400 text-gray-900 rounded-lg hover:bg-lime-500 transition disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create User"}
        </button>
      </form>

      {/* Users Table */}
      <div className="overflow-auto bg-gray-800 rounded-lg shadow-lg">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-700">
            <tr>
              {["Name", "Email", "Role", "Change"].map((h) => (
                <th
                  key={h}
                  className="px-6 py-3 text-left text-gray-200 font-semibold"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-600">
            {users.map((u) => (
              <tr key={u._id}>
                <td className="px-6 py-3 text-gray-200">{u.name}</td>
                <td className="px-6 py-3 text-gray-200">{u.email}</td>
                <td className="px-6 py-3 text-gray-200">{u.role}</td>
                <td className="px-6 py-3 text-center">
                  <select
                    value={u.role}
                    onChange={(e) => updateRole(u._id, e.target.value)}
                    className="px-4 py-2 bg-gray-700 text-gray-200 border border-gray-600 rounded-lg focus:ring-2 focus:ring-lime-400"
                  >
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
