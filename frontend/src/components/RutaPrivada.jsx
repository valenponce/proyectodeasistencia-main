// src/components/RutaPrivada.jsx
import { Navigate } from "react-router-dom";

export default function RutaPrivada({ children }) {
  const token = localStorage.getItem("token");

  if (!token) {
    return <Navigate to="/" replace />;
  }

  // Si hay token, permitir acceso

  return children;
}
