import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./Auth.module.css";

export default function Signup() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8001/api";

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
    setLoading(true);
    if (password !== confirm) {
      toast.error("Passwords do not match");
      setLoading(false);
      return;
    }
    try {
      await axios.post(
       `${BASE_URL}/auth/register`,
        { name, email, password, role: "student" },
        { headers: { "Content-Type": "application/json" } }
      );
      toast.success("Account created successfully! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      const data = err.response?.data || {};
      const msg =
        data.msg ||
        data.message ||
        JSON.stringify(data) ||
        err.message ||
        "Signup failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <ToastContainer
        position="top-right"
        autoClose={3000}
        transition={Slide}
        theme="colored"
        toastStyle={{
          backgroundColor: "var(--clr-primary-a0)",
          color: "var(--clr-surface-a0)",
        }}
      />
      <div className={styles.leftPanel}>
        <h1>Create Account</h1>
        <p>Join us today to unlock all features and benefits.</p>
      </div>
      <div className={styles.rightPanel}>
        <form onSubmit={handleSubmit} className={styles.formCard} noValidate>
          <h2 className={styles.title}>Sign Up</h2>

          <div className={styles.formGroup}>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className={styles.input}
              autoComplete="name"
              disabled={loading}
              required
            />
            <label htmlFor="name">Full Name</label>
          </div>

          <div className={styles.formGroup}>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={styles.input}
              autoComplete="email"
              disabled={loading}
              required
            />
            <label htmlFor="email">Email</label>
          </div>

          <div className={styles.formGroup}>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className={styles.input}
              autoComplete="new-password"
              disabled={loading}
              required
            />
            <label htmlFor="password">Password</label>
          </div>

          <div className={styles.formGroup}>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm Password"
              className={styles.input}
              autoComplete="new-password"
              disabled={loading}
              required
            />
            <label htmlFor="confirm">Confirm Password</label>
          </div>

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "Signing Up..." : "Sign Up"}
          </button>

          <p className={styles.signUpPrompt}>
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}