import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import useAuth from "../hooks/useAuth";
import { toast } from "react-toastify";

export default function Materias() {
  const { auth } = useAuth();
  const navigate = useNavigate();
  const [materias, setMaterias] = useState([]);
  const [error, setError] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalImportar, setMostrarModalImportar] = useState(false);
  const [mostrarModalInscripcion, setMostrarModalInscripcion] = useState(false);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);
  const [nombre, setNombre] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [docenteId, setDocenteId] = useState("");
  const [archivo, setArchivo] = useState(null);
  const [estudianteId, setEstudianteId] = useState("");

  // Obtener materias
  const obtenerMaterias = async () => {
    try {
      let url = "/materias/";
      if (auth?.rol === "estudiante") {
        url = `/materias/estudiante/${auth?.id}`;
      }
      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
      });
      setMaterias(res.data);
      setError("");
    } catch (err) {
      console.error("Error al obtener materias:", err);
      if (!err.response || err.response.status >= 400) {
        setError("Error al obtener materias.");
      }
    }
  };

  const obtenerCursos = async () => {
    try {
      const res = await axios.get("/cursos/", {
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
      });
      setCursos(res.data);
    } catch (err) {
      console.error("Error al obtener cursos:", err);
    }
  };

  const obtenerDocentes = async () => {
    try {
      const res = await axios.get("/usuarios/docentes_full/", {
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
      });
      setDocentes(res.data);
    } catch (err) {
      console.error("Error al obtener docentes:", err);
    }
  };

  const obtenerEstudiantes = async () => {
    try {
      const res = await axios.get("/usuarios/?rol=estudiante", {
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
      });
      setEstudiantes(res.data);
    } catch (err) {
      console.error("Error al obtener estudiantes:", err);
    }
  };

  useEffect(() => {
    obtenerMaterias();
    if (auth?.rol === "administrador") {
      obtenerCursos();
      obtenerDocentes();
    }
  }, [auth]);

  // Crear materia
  const crearMateria = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "/materias/",
        {
          nombre,
          curso_id: cursoId,
          docente_id: docenteId,
        },
        {
          headers: { Authorization: `Bearer ${auth?.accessToken}` },
        }
      );
      setNombre("");
      setCursoId("");
      setDocenteId("");
      setMostrarModal(false);
      await obtenerMaterias();
      toast.success("✅ Materia creada correctamente");
    } catch (err) {
      console.error("Error al crear materia:", err);
      toast.error("❌ Error al crear materia");
    }
  };

  // Importar materias desde Excel
  const importarMaterias = async (e) => {
    e.preventDefault();
    if (!archivo) {
      toast.error("Debes seleccionar un archivo");
      return;
    }
    try {
      const formData = new FormData();
      formData.append("file", archivo);

      const res = await axios.post("/materias/importar_excel", formData, {
        headers: {
          Authorization: `Bearer ${auth?.accessToken}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setMostrarModalImportar(false);
      setArchivo(null);
      await obtenerMaterias();

      toast.success(`✅ ${res.data.mensaje}`);
      if (res.data.errores.length > 0) {
        toast.warning("⚠️ Algunas filas tuvieron errores. Revisa consola.");
        console.warn("Errores de importación:", res.data.errores);
      }
    } catch (err) {
      console.error("Error al importar materias:", err);
      toast.error("❌ Error al importar materias");
    }
  };

  // Inscribir estudiante en materia
  const inscribirEstudiante = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "/inscripciones/",
        { estudiante_id: estudianteId, materia_id: materiaSeleccionada.id },
        {
          headers: { Authorization: `Bearer ${auth?.accessToken}` },
        }
      );
      toast.success("✅ Estudiante inscrito correctamente");
      setEstudianteId("");
      setMostrarModalInscripcion(false);
    } catch (err) {
      console.error("Error al inscribir estudiante:", err);
      const msg = err?.response?.data?.error || "Error al inscribir estudiante";
      toast.error(`❌ ${msg}`);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Listado de Materias</h1>

      {auth?.rol === "administrador" && (
        <div className="flex space-x-2 mb-4">
          <button
            onClick={() => setMostrarModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Crear nueva materia
          </button>
          <button
            onClick={() => setMostrarModalImportar(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Importar desde Excel
          </button>
        </div>
      )}

      {error && materias.length === 0 && (
        <p className="text-red-500">{error}</p>
      )}

      <table className="min-w-full bg-white shadow rounded-lg">
        <thead>
          <tr className="bg-gray-100 text-left text-sm font-semibold text-gray-700">
            <th className="p-3">Nombre</th>
            <th className="p-3">Curso</th>
            <th className="p-3">Docente</th>
            <th className="p-3">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {materias.length === 0 ? (
            <tr>
              <td colSpan="4" className="p-4 text-center">
                No hay materias registradas.
              </td>
            </tr>
          ) : (
            materias.map((materia) => (
              <tr key={materia.materia_id || materia.id} className="border-b text-sm">
                <td className="p-3">
                  {auth?.rol === "estudiante" ? materia.materia_nombre : materia.nombre}
                </td>
                <td className="p-3">
                  {auth?.rol === "estudiante"
                    ? materia.curso || "Sin curso"
                    : materia.curso?.nombre || "Sin curso"}
                </td>
                <td className="p-3">
                  {materia.docente
                    ? `${materia.docente.nombre} ${materia.docente.apellido}`
                    : "Sin docente"}
                </td>
                <td className="p-3 space-x-2">
                  {auth?.rol === "estudiante" && (
                    <button
                      onClick={() => navigate("/escaneo")}
                      className="bg-blue-600 text-white px-2 py-1 rounded"
                    >
                      Escanear QR
                    </button>
                  )}
                  {auth?.rol !== "estudiante" && (
                    <>
                      <button
                        onClick={() => {
                          setMateriaSeleccionada(materia);
                          obtenerEstudiantes();
                          setMostrarModalInscripcion(true);
                        }}
                        className="bg-blue-500 text-white px-2 py-1 rounded mr-2"
                      >
                        Inscribir estudiante
                      </button>
                      <button className="bg-yellow-400 text-white px-2 py-1 rounded mr-2">
                        Editar
                      </button>
                      <button className="bg-red-600 text-white px-2 py-1 rounded">
                        Eliminar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* --- MODAL CREAR MATERIA --- */}
      {mostrarModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Nueva Materia</h2>
            <form onSubmit={crearMateria} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Nombre</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Curso</label>
                <select
                  className="w-full border px-3 py-2 rounded"
                  value={cursoId}
                  onChange={(e) => setCursoId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar curso</option>
                  {cursos.map((curso) => (
                    <option key={curso.id} value={curso.id}>
                      {curso.nombre}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Docente</label>
                <select
                  className="w-full border px-3 py-2 rounded"
                  value={docenteId}
                  onChange={(e) => setDocenteId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar docente</option>
                  {docentes.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.nombre} {d.apellido}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setMostrarModal(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL IMPORTAR EXCEL --- */}
      {mostrarModalImportar && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">Importar Materias desde Excel</h2>
            <form onSubmit={importarMaterias} className="space-y-4">
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={(e) => setArchivo(e.target.files[0])}
                className="w-full border p-2 rounded"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalImportar(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                >
                  Importar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL INSCRIPCIÓN --- */}
      {mostrarModalInscripcion && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              Inscribir estudiante en {materiaSeleccionada?.nombre}
            </h2>
            <form onSubmit={inscribirEstudiante} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Seleccionar Estudiante</label>
                <select
                  value={estudianteId}
                  onChange={(e) => setEstudianteId(e.target.value)}
                  className="w-full border px-3 py-2 rounded"
                  required
                >
                  <option value="">-- Selecciona un estudiante --</option>
                  {estudiantes.map((est) => (
                    <option key={est.id} value={est.id}>
                      {est.nombre} {est.apellido}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setMostrarModalInscripcion(false)}
                  className="px-4 py-2 border rounded hover:bg-gray-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Inscribir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
