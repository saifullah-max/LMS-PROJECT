import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link, useNavigate } from "react-router-dom";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
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
  }, [token]);

  const handleField = (e) =>
    setNewUser({ ...newUser, [e.target.name]: e.target.value });

  const createUser = async (e) => {
    e.preventDefault();
    setSubmitting(true);
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
    } catch {
      alert("Failed to update role");
    }
  };

  if (loading)
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center font-sans">
        <p className="text-text">Loading users…</p>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen bg-neutral flex items-center justify-center font-sans">
        <p className="text-secondary">{error}</p>
      </div>
    );

  return (
    <div className="min-h-screen bg-neutral p-6 font-sans">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-semibold text-primary">User Management</h1>
        <Link
          to="/admin/analytics"
          className="px-4 py-2 bg-secondary text-black rounded hover:bg-accent transition"
        >
          View Analytics
        </Link>
      </div>

      <form
        onSubmit={createUser}
        className="mb-8 bg-white p-6 rounded shadow space-y-4"
      >
        <h2 className="text-xl font-semibold text-primary">Add New User</h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {["name", "email", "password"].map((f) => (
            <div key={f}>
              <label className="block text-text mb-1">
                {f[0].toUpperCase() + f.slice(1)}
              </label>
              <input
                name={f}
                type={f === "password" ? "password" : "text"}
                value={newUser[f]}
                onChange={handleField}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none"
              />
            </div>
          ))}
          <div>
            <label className="block text-text mb-1">Role</label>
            <select
              name="role"
              value={newUser.role}
              onChange={handleField}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none"
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
          className="mt-2 px-4 py-2 bg-primary text-black rounded hover:bg-accent transition disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create User"}
        </button>
      </form>

      <div className="overflow-auto bg-white rounded shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {["Name", "Email", "Role", "Change"].map((h) => (
                <th
                  key={h}
                  className="px-4 py-2 text-left text-text font-medium"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((u) => (
              <tr key={u._id}>
                <td className="px-4 py-3 text-text">{u.name}</td>
                <td className="px-4 py-3 text-text">{u.email}</td>
                <td className="px-4 py-3 text-text">{u.role}</td>
                <td className="px-4 py-3 text-center">
                  <select
                    value={u.role}
                    onChange={(e) => updateRole(u._id, e.target.value)}
                    className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none"
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
