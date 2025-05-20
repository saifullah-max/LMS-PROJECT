import React from "react";
import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  if (!token || user.role !== allowedRole) {
    // not logged in or wrong role → send to login
    return <Navigate to="/login" replace />;
  }
  return children;
}
