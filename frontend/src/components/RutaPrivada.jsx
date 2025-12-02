/*

import { Navigate } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function RutaPrivada({ children }) {
  const { auth } = useAuth();

  if (auth === null) {
    // Todavía cargando el contexto, evita renderizar antes de tiempo
    return null;
  }

  if (!auth.accessToken) {
    // No hay token => redirigir al login
    return <Navigate to="/" replace />;
  }

  return children;
}*/

import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function RutaPrivada({ children }) {
  const { auth, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <p>Cargando sesión...</p>;
  }

  if (!auth?.accessToken) {
    // Guarda la ruta que intentaba acceder
    localStorage.setItem("ruta_destino", location.pathname);
    return <Navigate to="/login" replace />;
  }

  return children;
}

