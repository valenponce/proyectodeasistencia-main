import { Link } from "react-router-dom";

export default function Navbar() {
  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("rol");
    localStorage.removeItem("usuario_id");
    window.location.href = "/";
  };

  const rol = localStorage.getItem("rol");

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
    <nav className="bg-[#020649]  text-white px-6 py-3 flex justify-between items-center shadow-md">
      <Link to="/">
        <img 
          src="/logo.png" 
          className="h-14  w-30"
        />
      </Link>
      
      <div className="flex gap-6 items-center text-lg">
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
