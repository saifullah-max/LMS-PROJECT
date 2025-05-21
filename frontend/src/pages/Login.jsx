import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import styles from "./Auth.module.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    try {
      const res = await axios.post(
        `${BASE_URL}/auth/login`,
        { email, password },
        { headers: { "Content-Type": "application/json" } }
      );
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));
      toast.success("Login successful!");
      const role = res.data.user.role;
      setTimeout(() => {
        if (role === "admin") {
          navigate("/admin/users");
        } else {
          navigate(`/${role}`)
        }
      }, 1000);
    } catch (err) {
      const data = err.response?.data || {};
      const msg =
        data.msg ||
        data.message ||
        JSON.stringify(data) ||
        err.message ||
        "Login failed";
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
        <h1>Welcome Back!</h1>
        <p>Enter your credentials to access your account and continue your journey.</p>
      </div>
      <div className={styles.rightPanel}>
        <form onSubmit={handleSubmit} className={styles.formCard} noValidate>
          <h2 className={styles.title}>Sign In</h2>

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
              autoComplete="current-password"
              disabled={loading}
              required
            />
            <label htmlFor="password">Password</label>
          </div>

          <div className={styles.forgotPassword}>
            <Link to="/forgot-password">Forgot Password?</Link>
          </div>

          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? "Signing In..." : "Sign In"}
          </button>

          <p className={styles.signUpPrompt}>
            Don’t have an account? <Link to="/signup">Sign up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}