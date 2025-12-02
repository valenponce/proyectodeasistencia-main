import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function Navbar() {
  const { auth, setAuth } = useAuth();
  const rol = auth?.rol;

  const handleLogout = () => {
    localStorage.clear();
    setAuth(null);
    window.location.href = "/";
  };

  const renderLinks = () => {
    if (rol === "estudiante") {
      return (
        <>
          <Link to="/materias" className="hover:underline">Mis materias</Link>
          <Link to="/historial" className="hover:underline">Historial</Link>
        </>
      );
    }

    if (rol === "docente") {
      return (
        <>
          <Link to="/clases" className="hover:underline">Clases</Link>
          <Link to="/asistencia" className="hover:underline">Asistencia</Link>
        </>
      );
    }

    if (rol === "administrador") {
      return (
        <>
          <Link to="/usuarios" className="hover:underline">Usuarios</Link>
          <Link to="/materias" className="hover:underline">Materias</Link>
          <Link to="/reportes" className="hover:underline">Reportes</Link>
        </>
      );
    }

    return null;
  };

  return (
    <nav className="bg-blue-600 text-white px-6 py-3 flex justify-between items-center shadow-md">
      <h1 className="text-lg font-semibold">Sistema de Asistencia IES Nº 6</h1>
      <div className="flex gap-6 items-center text-sm">
        {renderLinks()}
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded-md"
        >
          Cerrar sesión
        </button>
      </div>
    </nav>
  );
}
