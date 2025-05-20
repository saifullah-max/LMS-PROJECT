// src/pages/auth/ResetPassword.jsx
import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

export default function ResetPassword() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";

  // Guard: must have email+otp in state
  useEffect(() => {
    if (!state?.email || !state?.otp) {
      navigate("/forgot-password", { replace: true });
    }
  }, [state, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (newPass !== confirm) {
      setError("Passwords do not match");
      return;
    }
    try {
      await axios.post(`${BASE}/auth/reset-password`, {
        email: state.email,
        otp: state.otp,
        newPassword: newPass,
      });
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.msg || "Reset failed");
    }
  };

  return (
    <div className="min-h-screen bg-neutral font-sans flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow-md"
      >
        <h2 className="text-2xl font-semibold text-primary mb-4">
          Reset Password
        </h2>

        {error && <p className="mb-3 text-sm text-secondary">{error}</p>}

        <label className="block text-text mb-1" htmlFor="newPass">
          New Password
        </label>
        <input
          id="newPass"
          type="password"
          required
          value={newPass}
          onChange={(e) => setNewPass(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <label className="block text-text mb-1" htmlFor="confirm">
          Confirm Password
        </label>
        <input
          id="confirm"
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="w-full mb-6 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <button
          type="submit"
          className="w-full py-2 bg-primary text-white rounded hover:bg-accent transition"
        >
          Reset Password
        </button>
      </form>
    </div>
  );
}
