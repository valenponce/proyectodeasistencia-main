import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";

// 🔹 Modal detalle de un alumno
const ModalAlumnoDetalle = ({ alumno, onClose }) => {
  if (!alumno) return null;
  const materiasEnRiesgo = alumno.materias.filter((m) => m.asistencia < 70);
  const data = materiasEnRiesgo.map((m) => ({
    name: m.nombre,
    asistencia: m.asistencia,
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-xl shadow-lg w-[800px] max-h-[80vh] overflow-y-auto relative transition-all duration-300">
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-2xl font-bold text-gray-500 hover:text-black transition"
        >
          ✖
        </button>
        <h2 className="text-2xl font-bold mb-2 text-center">{alumno.nombre}</h2>
        <p className="text-sm text-gray-600 mb-6 text-center">
          Riesgo: <strong>{alumno.riesgo}</strong> — Promedio global:{" "}
          <strong>{Math.round(alumno.promedioGeneral)}%</strong>
        </p>
        <h3 className="text-lg font-semibold mb-4">
          Materias con baja asistencia
        </h3>
        {data.length === 0 ? (
          <p>✅ Este alumno no tiene materias con asistencia menor al 70%.</p>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
              <XAxis type="number" domain={[0, 100]} tickFormatter={(n) => `${n}%`} />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip formatter={(v) => `${v}%`} />
              <Bar dataKey="asistencia" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};

// 🔹 Modal alumnos por materia
const ModalAlumnosPorMateria = ({ materia, alumnos, onClose }) => {
  if (!materia) return null;
  const normalizar = (texto) =>
    texto.toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");

  const peorMateriaDe = (a) =>
    a.materias.reduce((min, m) => (m.asistencia < min.asistencia ? m : min)).nombre;

  const alumnosFiltrados = alumnos.filter(
    (a) => normalizar(peorMateriaDe(a)) === normalizar(materia)
  );

  const data = alumnosFiltrados.map((a) => {
    const mat = a.materias.find(
      (m) => normalizar(m.nombre) === normalizar(materia)
    );
    return {
      name: a.nombre,
      asistencia: mat ? mat.asistencia : 0,
      riesgo: a.riesgo,
    };
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-70">
      <div className="bg-white rounded-xl shadow-lg p-8 w-[800px] max-h-[80vh] overflow-y-auto relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-5 text-2xl font-bold text-gray-500 hover:text-black transition"
        >
          ✖
        </button>
        <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
          👥 Alumnos con riesgo en {materia}
        </h2>

        {data.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
                <XAxis type="number" domain={[0, 100]} tickFormatter={(n) => `${n}%`} />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="asistencia" fill="#facc15" />
              </BarChart>
            </ResponsiveContainer>

            <table className="w-full text-left border-collapse mt-6">
              <thead>
                <tr className="border-b bg-gray-100">
                  <th className="p-2">Alumno</th>
                  <th className="p-2">Asistencia (%)</th>
                  <th className="p-2">Riesgo</th>
                </tr>
              </thead>
              <tbody>
                {data.map((a, i) => {
                  let riesgoMateria = "";
                  if (a.asistencia < 50) riesgoMateria = "Alto";
                  else if (a.asistencia < 70) riesgoMateria = "Medio";
                  else riesgoMateria = "Bajo";

                  return (
                    <tr key={i} className="border-b">
                      <td className="p-2">{a.name}</td>
                      <td className="p-2">{a.asistencia}%</td>
                      <td
                        className={`p-2 font-semibold ${
                          riesgoMateria === "Alto"
                            ? "text-red-600"
                            : riesgoMateria === "Medio"
                            ? "text-yellow-600"
                            : "text-green-600"
                        }`}
                      >
                        {riesgoMateria}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </>
        ) : (
          <p className="text-center text-gray-600 mt-8">
            No hay alumnos en riesgo en esta materia.
          </p>
        )}
      </div>
    </div>
  );
};

// 🔹 Componente principal
const Reportes = () => {
  const [alumnosDemo, setAlumnosDemo] = useState([]);
  const [carrera, setCarrera] = useState("Ciencias de Datos e Inteligencia Artificial");
  const [año, setAño] = useState("Todos");
  const [showModalRiesgo, setShowModalRiesgo] = useState(false);
  const [showModalMaterias, setShowModalMaterias] = useState(false);
  const [showModalAlumnosMateria, setShowModalAlumnosMateria] = useState(false);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  // 📥 Cargar Excel y procesar
  useEffect(() => {
    const cargarExcel = async () => {
      try {
        const resp = await fetch("/src/data/asistencia_demo.xlsx");
        const blob = await resp.arrayBuffer();
        const wb = XLSX.read(blob, { type: "array" });

        const alumnosWS = wb.Sheets["alumnos"];
        const detalleWS = wb.Sheets["asistencia_detalle"];
        const alumnos = XLSX.utils.sheet_to_json(alumnosWS);
        const detalle = XLSX.utils.sheet_to_json(detalleWS);

        const alumnosCompletos = alumnos.map((a) => {
          const registros = detalle.filter((r) => r.id_alumno === a.id_alumno);
          const total = registros.length;
          const presentes = registros.filter((r) => r.presente === 1).length;
          const asistencia = total ? (presentes / total) * 100 : 0;

          let riesgo = "Bajo";
          if (asistencia < 50) riesgo = "Alto";
          else if (asistencia < 70) riesgo = "Medio";

          const materias = [];
          const materiasUnicas = [...new Set(registros.map((r) => r.materia))];
          materiasUnicas.forEach((m) => {
            const registrosMateria = registros.filter((r) => r.materia === m);
            const totalMat = registrosMateria.length;
            const presentesMat = registrosMateria.filter((r) => r.presente === 1).length;
            const porcentaje = totalMat ? (presentesMat / totalMat) * 100 : 0;
            materias.push({ nombre: m, asistencia: Math.round(porcentaje) });
          });

          return {
            id: a.id_alumno,
            nombre: a.nombre,
            anio: parseInt(a.anio),
            materias,
            promedioGeneral: Math.round(asistencia),
            riesgo,
            registros,
          };
        });

        setAlumnosDemo(alumnosCompletos);
      } catch (err) {
        console.error("Error al cargar Excel:", err);
      }
    };

    cargarExcel();
  }, []);

  // 🎨 Colores para el gráfico de riesgo
  const COLORS = ["#22c55e", "#facc15", "#ef4444"];

  // 🔹 Filtros
  const alumnosFiltrados = useMemo(() => {
    if (año === "Todos") return alumnosDemo;
    const num = parseInt(año);
    return alumnosDemo.filter((a) => a.anio === num);
  }, [año, alumnosDemo]);

  // 🔹 Métricas principales
  const totalAlumnos = alumnosFiltrados.length;
  const promedioAsistencia = totalAlumnos
    ? (
        alumnosFiltrados.reduce((acc, a) => acc + a.promedioGeneral, 0) /
        totalAlumnos
      ).toFixed(1)
    : 0;

  const riesgoBajo = alumnosFiltrados.filter((a) => a.riesgo === "Bajo").length;
  const riesgoMedio = alumnosFiltrados.filter((a) => a.riesgo === "Medio").length;
  const riesgoAlto = alumnosFiltrados.filter((a) => a.riesgo === "Alto").length;

  const dataRiesgo = [
    { name: "Bajo", value: riesgoBajo },
    { name: "Medio", value: riesgoMedio },
    { name: "Alto", value: riesgoAlto },
  ];

  // 🔹 Alumnos en riesgo
  const alumnosEnRiesgo = alumnosFiltrados.filter(
    (a) => a.riesgo === "Alto" || a.riesgo === "Medio"
  );

  // 🔹 Materias con riesgo
  const materiasFiltradas = useMemo(() => {
    const conteo = {};
    alumnosFiltrados.forEach((a) => {
      if (!a.materias.length) return;
      const materiaMasFaltas = a.materias.reduce((min, actual) =>
        actual.asistencia < min.asistencia ? actual : min
      );
      const nombre = materiaMasFaltas.nombre;
      if (!conteo[nombre]) conteo[nombre] = { asistencias: [], alto: 0, medio: 0 };
      conteo[nombre].asistencias.push(materiaMasFaltas.asistencia);
      if (a.riesgo === "Alto") conteo[nombre].alto += 1;
      else if (a.riesgo === "Medio") conteo[nombre].medio += 1;
    });

    return Object.keys(conteo)
      .map((materia) => {
        const arr = conteo[materia].asistencias;
        const promedio = arr.length
          ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length)
          : 0;
        return {
          materia,
          promedio,
          riesgoAlto: conteo[materia].alto,
          riesgoMedio: conteo[materia].medio,
          totalRiesgo: conteo[materia].alto + conteo[materia].medio,
        };
      })
      .filter((m) => m.totalRiesgo > 0)
      .sort((a, b) => b.totalRiesgo - a.totalRiesgo || a.promedio - b.promedio);
  }, [alumnosFiltrados]);

  const abrirAlumnosMateria = (materia) => {
    setMateriaSeleccionada(materia);
    setShowModalAlumnosMateria(true);
  };

  // 💡 Render
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">📊 Panel de Reportes</h1>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          value={carrera}
          onChange={(e) => setCarrera(e.target.value)}
          className="border p-2 rounded-md"
        >
          <option>Ciencias de Datos e Inteligencia Artificial</option>
        </select>
        <select
          value={año}
          onChange={(e) => setAño(e.target.value)}
          className="border p-2 rounded-md"
        >
          <option>Todos</option>
          <option>1</option>
          <option>2</option>
          <option>3</option>
        </select>
      </div>

      {/* Tarjetas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-gray-600 mb-1">Total de alumnos</p>
          <p className="text-4xl font-bold text-blue-600">{totalAlumnos}</p>
        </div>
        <div className="bg-white rounded-xl shadow p-4 text-center">
          <p className="text-gray-600 mb-1">Asistencia promedio</p>
          <p className="text-4xl font-bold text-green-600">{promedioAsistencia}%</p>
        </div>
        <div
          onClick={() => setShowModalRiesgo(true)}
          className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg hover:bg-red-50 transition cursor-pointer"
        >
          <p className="text-gray-600 mb-1">Alumnos en riesgo</p>
          <p className="text-4xl font-bold text-red-600">
            {riesgoMedio + riesgoAlto}
          </p>
          <p className="text-sm text-gray-500">(click para ver detalles)</p>
        </div>
        <div
          onClick={() => setShowModalMaterias(true)}
          className="bg-white rounded-xl shadow p-4 text-center hover:shadow-lg hover:bg-yellow-50 transition cursor-pointer"
        >
          <p className="text-gray-600 mb-1">Materias con alumnos en riesgo</p>
          <p className="text-4xl font-bold text-yellow-600">
            {materiasFiltradas.length}
          </p>
          <p className="text-sm text-gray-500">(click para ver detalle por riesgo)</p>
        </div>
      </div>

      {/* Gráfico circular */}
      <div className="bg-white rounded-lg shadow p-4 mb-8">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">
          Distribución de riesgo —{" "}
          {año === "Todos" ? "Todos los años" : `${año}° Año`}
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={dataRiesgo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
              {dataRiesgo.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Gráfico de materias */}
      <div className="bg-white rounded-lg shadow p-4">
        <h2 className="text-lg font-semibold mb-3 text-gray-700">
          Promedio de asistencia por materia —{" "}
          {año === "Todos" ? "Todos los años" : `${año}° Año`}
        </h2>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={materiasFiltradas} layout="vertical">
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="materia" width={180} />
                <Tooltip />
                <Bar dataKey="promedio" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Modales */}
      {showModalRiesgo && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-[800px] max-h-[80vh] overflow-y-auto relative">
            <button
              onClick={() => setShowModalRiesgo(false)}
              className="absolute top-4 right-5 text-2xl font-bold text-gray-500 hover:text-black"
            >
              ✖
            </button>
            <h2 className="text-2xl font-semibold text-gray-800 mt-2 mb-6 text-center">
              ⚠️ Alumnos en riesgo
            </h2>
            <div className="mb-4">
              <input
                type="text"
                placeholder="Buscar alumno..."
                className="w-full border border-gray-300 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
              />
            </div>
            <ul className="space-y-2">
              {alumnosEnRiesgo
                .filter((a) => a.nombre.toLowerCase().includes(busqueda.toLowerCase()))
                .map((a, i) => (
                  <li key={i}>
                    <button
                      onClick={() => setAlumnoSeleccionado(a)}
                      className="w-full text-left bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md shadow"
                    >
                      {a.nombre}
                    </button>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}

      {showModalMaterias && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-8 w-[800px] max-h-[80vh] overflow-y-auto relative">
            <button
              onClick={() => setShowModalMaterias(false)}
              className="absolute top-4 right-5 text-2xl font-bold text-gray-500 hover:text-black"
            >
              ✖
            </button>
            <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
              📘 Materias analizadas — Foco en alumnos en riesgo (Alto/Medio)
            </h2>
            <p className="text-sm text-gray-500 mb-4 text-center">
              * Cada alumno aporta una sola materia: su peor desempeño.
              <br />* Se muestran solo los conteos de{" "}
              <span className="text-red-600 font-semibold">Alto</span> y{" "}
              <span className="text-yellow-600 font-semibold">Medio</span>.
            </p>
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b bg-gray-100">
                  <th className="p-2">Materia</th>
                  <th className="p-2">Promedio</th>
                  <th className="p-2 text-red-600">Alto</th>
                  <th className="p-2 text-yellow-600">Medio</th>
                  <th className="p-2">Total (A+M)</th>
                </tr>
              </thead>
              <tbody>
                {materiasFiltradas.map((m, i) => (
                  <tr key={i} className="border-b">
                    <td
                      className="p-2 text-blue-600 cursor-pointer hover:underline"
                      onClick={() => abrirAlumnosMateria(m.materia)}
                    >
                      {m.materia}
                    </td>
                    <td className="p-2">{m.promedio}%</td>
                    <td className="p-2 text-red-700 font-bold">{m.riesgoAlto}</td>
                    <td className="p-2 text-yellow-700 font-bold">{m.riesgoMedio}</td>
                    <td className="p-2 font-semibold">{m.totalRiesgo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {showModalAlumnosMateria && (
        <ModalAlumnosPorMateria
          materia={materiaSeleccionada}
          alumnos={alumnosEnRiesgo}
          onClose={() => setShowModalAlumnosMateria(false)}
        />
      )}

      {alumnoSeleccionado && (
        <ModalAlumnoDetalle
          alumno={alumnoSeleccionado}
          onClose={() => setAlumnoSeleccionado(null)}
        />
      )}
    </div>
  );
};

export default Reportes;
