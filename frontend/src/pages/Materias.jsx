import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import useAuth from "../hooks/useAuth";
import { toast } from "react-toastify";

export default function Materias() {
  const { auth } = useAuth();
  const navigate = useNavigate();

  const [materias, setMaterias] = useState([]);
  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);
  const [estudiantes, setEstudiantes] = useState([]);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarModalImportar, setMostrarModalImportar] = useState(false);
  const [mostrarModalInscripcion, setMostrarModalInscripcion] =
    useState(false);

  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  const [nombre, setNombre] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [docenteId, setDocenteId] = useState("");
  const [estudianteId, setEstudianteId] = useState("");
  const [archivo, setArchivo] = useState(null);

  // ============================================================
  //   OBTENER MATERIAS
  // ============================================================
  const obtenerMaterias = async () => {
    try {
      let url = "/materias/";

      if (auth?.rol === "estudiante") {
        url = `/materias/estudiante/${auth.id}`;
      }

      const res = await axios.get(url, {
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
      });

      setMaterias(res.data);
    } catch (err) {
      console.error("Error al obtener materias:", err);
      toast.error("Error al obtener materias");
    }
  };

  // ============================================================
  //   OBTENER CURSOS (ADMIN)
  // ============================================================
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

  // ============================================================
  //   OBTENER DOCENTES (ADMIN)
  // ============================================================
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

  // ============================================================
  //   OBTENER ESTUDIANTES PARA INSCRIPCIÓN
  // ============================================================
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

  // ============================================================
  //   INICIALIZAR
  // ============================================================
  useEffect(() => {
    obtenerMaterias();

    if (auth?.rol === "administrador") {
      obtenerCursos();
      obtenerDocentes();
    }
  }, [auth]);

  // ============================================================
  //   CREAR / EDITAR MATERIA
  // ============================================================
  const guardarMateria = async (e) => {
    e.preventDefault();

    try {
      if (materiaSeleccionada) {
        // Editar
        await axios.put(
          `/materias/${materiaSeleccionada.id}`,
          {
            nombre,
            docente_id: docenteId,
          },
          {
            headers: { Authorization: `Bearer ${auth?.accessToken}` },
          }
        );
        toast.success("Materia actualizada correctamente");
      } else {
        // Crear nueva
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
        toast.success("Materia creada correctamente");
      }

      setMostrarModal(false);
      setMateriaSeleccionada(null);
      setNombre("");
      setCursoId("");
      setDocenteId("");

      obtenerMaterias();
    } catch (err) {
      console.error(err);
      toast.error("Error al guardar materia");
    }
  };

  // ============================================================
  //   ELIMINAR MATERIA
  // ============================================================
  const eliminarMateria = async (id) => {
    try {
      await axios.delete(`/materias/${id}`, {
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
      });

      toast.success("Materia eliminada");
      obtenerMaterias();
    } catch (err) {
      console.error(err);
      toast.error("No se pudo eliminar la materia");
    }
  };

  // ============================================================
  //   INSCRIBIR ESTUDIANTE
  // ============================================================
  const inscribir = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "/inscripciones/",
        {
          estudiante_id: estudianteId,
          materia_id: materiaSeleccionada.id,
        },
        {
          headers: { Authorization: `Bearer ${auth?.accessToken}` },
        }
      );

      toast.success("Estudiante inscrito correctamente");
      setMostrarModalInscripcion(false);
    } catch (err) {
      console.error(err);
      toast.error("Error al inscribir estudiante");
    }
  };

  // ============================================================
  //   IMPORTAR EXCEL
  // ============================================================
  const importarMaterias = async (e) => {
    e.preventDefault();

    if (!archivo) {
      toast.error("Selecciona un archivo");
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

      toast.success(res.data.mensaje);
      setMostrarModalImportar(false);

      obtenerMaterias();
    } catch (err) {
      console.error(err);
      toast.error("Error al importar");
    }
  };

  // ============================================================
  //   RENDER
  // ============================================================
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Listado de Materias</h1>

      {/* =========================== */}
      {/* BOTONES SOLO PARA ADMIN    */}
      {/* =========================== */}
      {auth?.rol === "administrador" && (
        <div className="flex space-x-3 mb-6">
          <button
            onClick={() => {
              setMateriaSeleccionada(null);
              setNombre("");
              setCursoId("");
              setDocenteId("");
              setMostrarModal(true);
            }}
            className="bg-green-600 text-white px-4 py-2 rounded"
          >
            Crear Materia
          </button>

          <button
            onClick={() => setMostrarModalImportar(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Importar Excel
          </button>
        </div>
      )}

      {/* TABLA PRINCIPAL */}
      <table className="min-w-full bg-white shadow rounded-lg">
        <thead>
          <tr className="bg-gray-100 text-sm font-semibold text-gray-700">
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
            materias.map((m) => (
              <tr key={m.id} className="border-b text-sm">
                <td className="p-3">
                  {auth?.rol === "estudiante" ? m.materia_nombre : m.nombre}
                </td>

                <td className="p-3">
                  {auth?.rol === "estudiante"
                    ? m.curso || "Sin curso"
                    : m.curso?.nombre || "Sin curso"}
                </td>

                <td className="p-3">
                  {m.docente
                    ? `${m.docente.nombre} ${m.docente.apellido}`
                    : "Sin docente"}
                </td>

                <td className="p-3 space-x-2">
                  {/* ESTUDIANTE → SOLO ESCANEAR */}
                  {auth?.rol === "estudiante" && (
                    <button
                      onClick={() => navigate("/escaneo")}
                      className="bg-blue-600 text-white px-3 py-1 rounded"
                    >
                      Escanear QR
                    </button>
                  )}

                  {/* ADMIN → INSCRIBIR / EDITAR / BORRAR */}
                  {auth?.rol === "administrador" && (
                    <>
                      <button
                        onClick={() => {
                          setMateriaSeleccionada(m);
                          obtenerEstudiantes();
                          setMostrarModalInscripcion(true);
                        }}
                        className="bg-blue-500 text-white px-3 py-1 rounded mr-2"
                      >
                        Inscribir alumno
                      </button>

                      <button
                        onClick={() => {
                          setMateriaSeleccionada(m);
                          setNombre(m.nombre);
                          setCursoId(m.curso?.id || "");
                          setDocenteId(m.docente?.id || "");
                          setMostrarModal(true);
                        }}
                        className="bg-yellow-400 text-white px-3 py-1 rounded mr-2"
                      >
                        Editar
                      </button>

                      <button
                        onClick={() => eliminarMateria(m.id)}
                        className="bg-red-600 text-white px-3 py-1 rounded"
                      >
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

      {/* ============================================================
          MODAL CREAR / EDITAR MATERIA
      ============================================================ */}
      {mostrarModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              {materiaSeleccionada ? "Editar Materia" : "Nueva Materia"}
            </h2>

            <form onSubmit={guardarMateria} className="space-y-4">
              <div>
                <label className="block text-sm">Nombre</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>

              {/* Si es nueva materia, seleccionar curso */}
              {!materiaSeleccionada && (
                <div>
                  <label className="block text-sm">Curso</label>
                  <select
                    className="w-full border px-3 py-2 rounded"
                    value={cursoId}
                    onChange={(e) => setCursoId(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar curso</option>
                    {cursos.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm">Docente</label>
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
                  onClick={() => setMostrarModal(false)}
                  type="button"
                  className="px-4 py-2 border rounded"
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL INSCRIPCIÓN
      ============================================================ */}
      {mostrarModalInscripcion && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded max-w-md w-full">
            <h2 className="text-xl font-semibold mb-4">
              Inscribir alumno en {materiaSeleccionada?.nombre}
            </h2>

            <form onSubmit={inscribir} className="space-y-4">
              <div>
                <label className="block">Seleccionar estudiante</label>
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
                  className="px-4 py-2 border rounded"
                  onClick={() => setMostrarModalInscripcion(false)}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded"
                >
                  Inscribir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL IMPORTAR EXCEL
      ============================================================ */}
      {mostrarModalImportar && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded max-w-md w-full">
            <h2 className="text-xl text-center font-semibold mb-4">
              Importar Materias desde Excel
            </h2>

            <form onSubmit={importarMaterias} className="space-y-4">
              <input
                type="file"
                accept=".xlsx,.csv"
                className="border w-full p-2 rounded"
                onChange={(e) => setArchivo(e.target.files[0])}
              />

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  className="px-4 py-2 border rounded"
                  onClick={() => setMostrarModalImportar(false)}
                >
                  Cancelar
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded"
                >
                  Importar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
