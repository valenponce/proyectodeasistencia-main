import { useEffect, useState } from "react";
import axios from "../api/axios";
import useAuth from "../hooks/useAuth";
import FormularioCrearUsuario from "../components/FormularioCrearUsuario";
import { toast } from 'react-toastify';
import FormularioImportarUsuarios from "../components/FormularioImportarUsuarios";

export default function Usuarios() {
  const { auth } = useAuth();
  const [usuarios, setUsuarios] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState(null);
  const [mostrarImportar, setMostrarImportar] = useState(false);

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

  useEffect(() => {
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
      setUsuarios((prev) => prev.filter((u) => u.id !== usuarioAEliminar.id));
      setMostrarModalEliminar(false);
      toast.success("✅ Usuario eliminado correctamente.");
      setUsuarioAEliminar(null);
    } catch (err) {
      console.error("Error al eliminar usuario:", err);
      alert("Error al eliminar usuario.");
    }
  };

  const estudiantes = usuarios.filter(u => u.rol.toLowerCase() === "estudiante");
  const administradores = usuarios.filter(u => u.rol.toLowerCase() === "administrador");
  const docentes = usuarios.filter(u => u.rol.toLowerCase() === "docente");

  const TablaUsuariosPorRol = ({ titulo, lista }) => {
    const [busqueda, setBusqueda] = useState("");

    const listaFiltrada = lista.filter((u) =>
      (`${u.nombre} ${u.apellido}`).toLowerCase().includes(busqueda.toLowerCase()) ||
      u.correo.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
      <div className="mb-8">
        <h2 className="text-xl font-semibold capitalize mb-2">{titulo}</h2>
        <input
          type="text"
          placeholder={`Buscar en ${titulo.toLowerCase()}...`}
          className="mb-3 px-3 py-1 border rounded w-full sm:w-64 shadow-sm"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
        {listaFiltrada.length === 0 ? (
          <p className="text-blue-600 italic">No hay usuarios con este rol.</p>
        ) : (
          <div className="rounded-lg shadow border overflow-hidden">
            <div className="max-h-96 overflow-y-auto">
              <table className="min-w-full bg-white text-sm text-left">
                <thead className="bg-blue-500 text-white sticky top-0 z-10">
                  <tr>
                    <th className="py-2 px-3">ID</th>
                    <th className="py-2 px-3">Nombre</th>
                    <th className="py-2 px-3">Correo</th>
                    <th className="py-2 px-3">DNI</th>
                    <th className="py-2 px-3">Rol</th>
                    <th className="py-2 px-3">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {listaFiltrada.map((usuario) => (
                    <tr key={usuario.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 text-center">{usuario.id}</td>
                      <td className="py-2 px-3">{usuario.nombre} {usuario.apellido}</td>
                      <td className="py-2 px-3">{usuario.correo}</td>
                      <td className="py-2 px-3">{usuario.dni}</td>
                      <td className="py-2 px-3 capitalize">{usuario.rol}</td>
                      <td className="py-2 px-3">
                        <button
                          onClick={() => confirmarEliminar(usuario)}
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-md text-xs"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl text-center font-bold mb-4 pb-2 w-fit mx-auto"
          style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.5)" }}>
        Listado de Usuarios
      </h1>

      {auth.rol === "administrador" && (
        <div className="bg-gray-100 shadow-md rounded-lg p-4 mb-6 flex flex-wrap justify-between items-center gap-2">
          <h2 className="text-xl font-semibold text-gray-800">Gestión de usuarios</h2>
          <div className="flex gap-2">
            <button
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              onClick={() => setMostrarFormulario(!mostrarFormulario)}
            >
              {mostrarFormulario ? "Cerrar formulario" : "Agregar usuario"}
            </button>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
              onClick={() => setMostrarImportar(true)}
            >
              Importar desde Excel
            </button>
          </div>
        </div>
      )}

      {mostrarFormulario && (
        <FormularioCrearUsuario onUsuarioCreado={obtenerUsuarios} />
      )}

      {mostrarImportar && (
        <FormularioImportarUsuarios
          onClose={() => setMostrarImportar(false)}
          onSuccess={obtenerUsuarios}
        />
      )}

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
