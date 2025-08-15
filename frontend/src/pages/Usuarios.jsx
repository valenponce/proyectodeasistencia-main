

import { useEffect, useState } from "react";
import axios from "../api/axios";
import useAuth from "../hooks/useAuth";

export default function Usuarios() {
  const { auth } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);

  useEffect(() => {
    const obtenerUsuarios = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/usuarios/", {
          headers: { Authorization: `Bearer ${auth?.accessToken}` },
        });
        setUsuarios(res.data);
        setError("");
      } catch (err) {
        console.error("Error al obtener usuarios:", err);
        setError("Error al obtener usuarios.");
      } finally {
        setLoading(false);
      }
    };

    obtenerUsuarios();
  }, [auth]);

  const confirmarEliminar = (usuario) => {
    setUsuarioAEliminar(usuario);
    setMostrarModalEliminar(true);
  };

  const eliminarUsuario = async () => {
    try {
      await axios.delete(`/usuarios/${usuarioAEliminar.id}`, {
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
      });
      setUsuarios((prev) =>
        prev.filter((u) => u.id !== usuarioAEliminar.id)
      );
      setMostrarModalEliminar(false);
      setUsuarioAEliminar(null);
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      alert("Error al eliminar usuario.");
    }
  };

  const estudiantes = usuarios.filter(u => u.rol.toLowerCase() === "estudiante");
  const administradores = usuarios.filter(u => u.rol.toLowerCase() === "administrador");
  const docentes = usuarios.filter(u => u.rol.toLowerCase() === "docente");

  const TablaUsuariosPorRol = ({ titulo, lista }) => (
    <>
      <h2 className="text-2xl font-semibold mt-8 mb-4">{titulo}</h2>
      
      {lista.length === 0 ? (
        <p className="text-blue-600 italic">No hay usuarios con este rol.</p>
      ) : (
        <table className="min-w-full bg-white shadow rounded-lg border border-black">
          <thead>
            <tr className="bg-[#237BB2]/85 text-white text-center text-lg font-semibold border-b-2 border-black">
              <th className="p-4 border-r border-black">ID</th>
              <th className="p-4 border-r border-black">Nombre</th>
              <th className="p-4 border-r border-black">Correo</th>
              <th className="p-4 border-r border-black">Rol</th>
              <th className="p-4 border-black">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {lista.map((usuario) => (
              <tr key={usuario.id} className="border-b border-black text-lg">
                <td className="p-4 border-r text-center border-black">
                  {usuario.id}
                </td>
                <td className="p-4 border-r text-center border-black">
                  {usuario.nombre} {usuario.apellido}
                </td>
                <td className="p-4 border-r text-center border-black">
                  {usuario.correo}
                </td>
                <td className="p-4 border-r text-center border-black">{usuario.rol}</td>
                <td className="p-3 border-black border-l">
                  <div className="flex justify-center items-center gap-2">
                    <button
                      className="bg-[#FB6362] text-white px-2 py-1 rounded"
                      onClick={() => confirmarEliminar(usuario)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </>
  );

  return (
    <div className="p-6">
      <h1
        className="text-3xl text-center font-bold mb-4 pb-2 w-fit mx-auto"
        style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.5)" }}
      >
        Listado de Usuarios
      </h1>

      {loading && <p>Cargando usuarios...</p>}
      {error && <p className="text-red-500">{error}</p>}

      {!loading && usuarios.length === 0 && (
        <p className="text-blue-600 italic">No hay usuarios con este rol.</p>
      )}

      {!loading && usuarios.length > 0 && (
        <>
          <TablaUsuariosPorRol titulo="Administradores" lista={administradores} />
          <TablaUsuariosPorRol titulo="Docentes" lista={docentes} />
          <TablaUsuariosPorRol titulo="Estudiantes" lista={estudiantes} />
        </>
      )}

      {mostrarModalEliminar && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full text-center">
            <p className="mb-4 text-lg">
              ¿Estás seguro que quieres eliminar al usuario{" "}
              <span className="font-semibold">
                {usuarioAEliminar.nombre} {usuarioAEliminar.apellido}
              </span>
              ?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setMostrarModalEliminar(false)}
                className="px-4 py-2 bg-[#4A90E2] text-white rounded hover:bg-[#357ABD]"
              >
                Cancelar
              </button>
              <button
                onClick={eliminarUsuario}
                className="px-4 py-2 bg-[#FB6362] text-white rounded hover:bg-[#D9534F]"
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
