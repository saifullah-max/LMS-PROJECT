import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const BASE = import.meta.env.VITE_API_URL || "http://localhost:8001/api";


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
    <div className="min-h-screen bg-[var(--clr-surface-a0)] flex items-center justify-center p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[var(--clr-surface-a10)] p-8 rounded-lg shadow-lg"
      >
        <h2 className="text-3xl font-semibold text-[var(--clr-primary-a0)] mb-6 text-center">
          Forgot Password
        </h2>

        {error && (
          <p className="mb-3 text-sm text-[var(--clr-primary-a40)] text-center">
            {error}
          </p>
        )}

        <div className="mb-6">
          <label className="block text-[var(--clr-primary-a10)] mb-2" htmlFor="email">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full px-4 py-3 mb-6 bg-[var(--clr-surface-a30)] border border-[var(--clr-surface-a20)] rounded-lg text-[var(--clr-primary-a10)] focus:outline-none focus:ring-2 focus:ring-[var(--clr-primary-a20)]"
          />
        </div>

        <button
          type="submit"
          className="w-full py-3 bg-[var(--clr-primary-a0)] text-[var(--clr-surface-a0)] rounded-lg hover:bg-[var(--clr-primary-a10)] transition duration-300 focus:outline-none focus:ring-2 focus:ring-[var(--clr-primary-a30)]"
        >
          Send OTP
        </button>

        <div className="mt-6 text-center">
          <p className="text-[var(--clr-primary-a30)] text-sm">
            Remember your password?{" "}
            <span
              className="text-[var(--clr-primary-a0)] hover:underline cursor-pointer"
              onClick={() => navigate("/login")}
            >
              Login
            </span>
          </p>
        </div>
      </form>
    </div>
  );
}
