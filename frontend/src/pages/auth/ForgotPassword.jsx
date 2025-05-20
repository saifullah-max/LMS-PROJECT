// src/pages/auth/ForgotPassword.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      // call /request-reset
      await axios.post(`${BASE}/auth/request-reset`, { email });
      // navigate on success
      navigate("/verify-otp", { state: { email } });
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to send OTP");
    }
  };

  return (
    <div className="min-h-screen bg-neutral font-sans flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow-md"
      >
        <h2 className="text-2xl font-semibold text-primary mb-4">
          Forgot Password
        </h2>

        {error && <p className="mb-3 text-sm text-secondary">{error}</p>}

        <label className="block text-text mb-1" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <button
          type="submit"
          className="w-full py-2 bg-primary text-white rounded hover:bg-accent transition"
        >
          Send OTP
        </button>
      </form>
    </div>
  );
}
