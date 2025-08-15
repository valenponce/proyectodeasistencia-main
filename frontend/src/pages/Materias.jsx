
import { useEffect, useState } from "react";
import axios from "../api/axios";
import useAuth from "../hooks/useAuth";

export default function Materias() {
  const { auth } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [error, setError] = useState("");
  const [mostrarModalCrear, setMostrarModalCrear] = useState(false);
  const [mostrarModalEditar, setMostrarModalEditar] = useState(false);
  const [mostrarModalEliminar, setMostrarModalEliminar] = useState(false);

  const [cursos, setCursos] = useState([]);
  const [docentes, setDocentes] = useState([]);

  
  const [nombre, setNombre] = useState("");
  const [cursoId, setCursoId] = useState("");
  const [docenteId, setDocenteId] = useState("");

  // Para eliminar materia
  const [materiaAEliminar, setMateriaAEliminar] = useState(null);

  // Para editar materia
  const [materiaAEditar, setMateriaAEditar] = useState(null);
  const [nombreEditar, setNombreEditar] = useState("");
  const [cursoIdEditar, setCursoIdEditar] = useState("");
  const [docenteIdEditar, setDocenteIdEditar] = useState("");

  useEffect(() => {
    const obtenerMaterias = async () => {
      try {
        const url =
          auth?.rol === "estudiante"
            ? `/materias/estudiante/${auth?.id}`
            : "/materias/";

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
      setMostrarModalCrear(false);
      window.location.reload();
    } catch (err) {
      console.error("Error al crear materia:", err);
      alert("Error al crear materia.");
    }
  };

  // Confirmar eliminar
  const confirmarEliminar = (materia) => {
    setMateriaAEliminar(materia);
    setMostrarModalEliminar(true);
  };

  // Eliminar materia
  const eliminarMateria = async () => {
    try {
      await axios.delete(`/materias/${materiaAEliminar.id || materiaAEliminar.materia_id}`, {
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
      });
      setMostrarModalEliminar(false);
      setMateriaAEliminar(null);
      setMaterias((prev) =>
        prev.filter(
          (m) => m.id !== (materiaAEliminar.id || materiaAEliminar.materia_id)
        )
      );
    } catch (err) {
      console.error("Error al eliminar materia:", err);
      alert("Error al eliminar materia.");
    }
  };

  const abrirEditar = (materia) => {
    setMateriaAEditar(materia);
    setNombreEditar(materia.nombre || materia.materia_nombre || "");
    setCursoIdEditar(materia.curso?.id || materia.curso || "");
    setDocenteIdEditar(materia.docente?.id || materia.docente || "");
    setMostrarModalEditar(true);
  };

  const guardarEdicion = async (e) => {
    e.preventDefault();
    try {
      await axios.put(
        `/materias/${materiaAEditar.id || materiaAEditar.materia_id}`,
        {
          nombre: nombreEditar,
          curso_id: cursoIdEditar,
          docente_id: docenteIdEditar,
        },
        {
          headers: { Authorization: `Bearer ${auth?.accessToken}` },
        }
      );
      setMostrarModalEditar(false);
      setMateriaAEditar(null);
     
      setMaterias((prev) =>
        prev.map((m) =>
          (m.id || m.materia_id) === (materiaAEditar.id || materiaAEditar.materia_id)
            ? { ...m, nombre: nombreEditar, curso: cursos.find(c => c.id === cursoIdEditar) || cursoIdEditar, docente: docentes.find(d => d.id === docenteIdEditar) || docenteIdEditar }
            : m
        )
      );
    } catch (err) {
      console.error("Error al editar materia:", err);
      alert("Error al editar materia.");
    }
  };

  return (
    <div className="p-6">
      <h1
        className="text-3xl text-center font-bold mb-4 pb-2 w-fit mx-auto"
        style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.5)" }}
      >
        Listado de Materias
      </h1>

      {auth?.rol === "administrador" && (
        <button
          onClick={() => setMostrarModalCrear(true)}
          className="bg-[#179FCE] text-white px-4 py-2 rounded mb-4"
        >
          Crear nueva materia
        </button>
      )}

      {error && materias.length === 0 && (
        <p className="text-red-500">{error}</p>
      )}

      <table className="min-w-full bg-white shadow rounded-lg border border-black">
        <thead>
          <tr className="bg-[#237BB2]/85 text-white text-center text-lg font-semibold border-b-2 border-black">
            <th className="p-4 border-r border-black">Nombre</th>
            <th className="p-4 border-r border-black">Curso</th>
            <th className="p-4 border-r border-black">Docente</th>
            {auth?.rol !== "estudiante" && (
              <th className="p-4 border-r border-black">Acciones</th>
            )}
          </tr>
        </thead>
        <tbody>
          {materias.length === 0 ? (
            <tr>
              <td colSpan="4" className="p-4 text-center border border-black">
                No hay materias registradas.
              </td>
            </tr>
          ) : (
            materias.map((materia) => (
              <tr
                key={materia.id || materia.materia_id}
                className="border-b border-black text-lg"
              >
                <td className="p-4 border-r text-center border-black">
                  {materia.nombre || materia.materia_nombre}
                </td>
                <td className="p-4 border-r text-center border-black">
                  {materia.curso?.nombre || materia.curso || "Sin curso"}
                </td>
                <td className="p-4 border-r text-center border-black">
                  {materia.docente
                    ? `${materia.docente.nombre} ${materia.docente.apellido}`
                    : materia.docente || "Sin docente"}
                </td>
                {auth?.rol !== "estudiante" && (
                  <td className="p-3 border-black border-l">
                    <div className="flex justify-center items-center gap-2">
                      <button
                        className="text-white px-2 py-1 rounded mr-2"
                        style={{ backgroundColor: "rgba(230, 159, 78, 0.89)" }}
                        onClick={() => abrirEditar(materia)}
                      >
                        Editar
                      </button>
                      <button
                        className="bg-[#FB6362] text-white px-2 py-1 rounded"
                        onClick={() => confirmarEliminar(materia)}
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>

  
      {mostrarModalCrear && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2
              className="text-xl text-center font-semibold mb-4 pb-2 w-fit mx-auto"
              style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.5)" }}
            >
              Nueva Materia
            </h2>
            <form onSubmit={crearMateria} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Nombre</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded bg-gray-100 focus:outline-none focus:ring-1 focus:ring-[#122847] hover:border-[#122847] transition"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Curso</label>
                <select
                  className="w-full border px-3 py-2 rounded bg-gray-100 focus:outline-none focus:ring-1 focus:ring-[#122847] hover:border-[#122847] transition"
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
                  className="w-full border px-3 py-2 rounded bg-gray-100 focus:outline-none focus:ring-1 focus:ring-[#122847] hover:border-[#122847] transition"
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
                  onClick={() => setMostrarModalCrear(false)}
                  className="px-4 py-2 bg-[#4A90E2] text-white rounded hover:bg-[#357ABD]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#388E3C]"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      
      {mostrarModalEditar && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2
              className="text-xl text-center font-semibold mb-4 pb-2 w-fit mx-auto"
              style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.5)" }}
            >
              Editar Materia
            </h2>
            <form onSubmit={guardarEdicion} className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Nombre</label>
                <input
                  type="text"
                  className="w-full border px-3 py-2 rounded bg-gray-100 focus:outline-none focus:ring-1 focus:ring-[#122847] hover:border-[#122847] transition"
                  value={nombreEditar}
                  onChange={(e) => setNombreEditar(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Curso</label>
                <select
                  className="w-full border px-3 py-2 rounded bg-gray-100 focus:outline-none focus:ring-1 focus:ring-[#122847] hover:border-[#122847] transition"
                  value={cursoIdEditar}
                  onChange={(e) => setCursoIdEditar(e.target.value)}
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
                  className="w-full border px-3 py-2 rounded bg-gray-100 focus:outline-none focus:ring-1 focus:ring-[#122847] hover:border-[#122847] transition"
                  value={docenteIdEditar}
                  onChange={(e) => setDocenteIdEditar(e.target.value)}
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
                  onClick={() => setMostrarModalEditar(false)}
                  className="px-4 py-2 bg-[#4A90E2] text-white rounded hover:bg-[#357ABD]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#388E3C]"
                >
                  Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

     
      {mostrarModalEliminar && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg max-w-sm w-full text-center">
            <p className="mb-4 text-lg">
              ¿Estás seguro que quieres eliminar la materia{" "}

              <span className="font-semibold">
                {materiaAEliminar.nombre || materiaAEliminar.materia_nombre}
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
                onClick={eliminarMateria}
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
