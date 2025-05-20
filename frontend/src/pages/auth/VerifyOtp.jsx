// src/pages/auth/VerifyOtp.jsx
import React, { useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import axios from "axios";

export default function VerifyOtp() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(state?.email || "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.post(`${BASE}/auth/verify-otp`, { email, otp });
      navigate("/reset-password", { state: { email, otp } });
    } catch (err) {
      setError(err.response?.data?.msg || "Invalid or expired code");
    }
  };

  return (
    <div className="min-h-screen bg-neutral font-sans flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white p-8 rounded-lg shadow-md"
      >
        <h2 className="text-2xl font-semibold text-primary mb-4">
          Verify Code
        </h2>

        {error && <p className="mb-3 text-sm text-secondary">{error}</p>}

        <label className="block text-text mb-1">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <label className="block text-text mb-1">OTP Code</label>
        <input
          type="text"
          required
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          placeholder="123456"
          className="w-full mb-6 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-primary"
        />

        <button
          type="submit"
          className="w-full py-2 bg-primary text-white rounded hover:bg-accent transition"
        >
          Verify
        </button>

        <p className="mt-4 text-center text-sm text-text">
          Didn’t get a code?{" "}
          <Link
            to="/forgot-password"
            className="text-secondary hover:underline"
          >
            Send again
          </Link>
        </p>
      </form>
    </div>
  );
}
