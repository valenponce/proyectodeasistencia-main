import React, { useState, useEffect, useMemo } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
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
import NavbarDashboard from "../components/NavbarDashboard"; // ✅ Import del navbar
import Prediccion from "./Prediccion";
import { LineChart, Line } from "recharts";



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
          <p>Este alumno no tiene materias con asistencia menor al 70%.</p>
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

  // 🔍 Filtrar y recalcular riesgo solo para esta materia
  const alumnosMateria = alumnos
    .map((a) => {
      const mat = a.materias.find(
        (m) => normalizar(m.nombre) === normalizar(materia)
      );
      if (!mat) return null;

      // ⚠️ Calcular riesgo directamente por asistencia real de esta materia
      let riesgoMateria = "Bajo";
      if (mat.asistencia < 50) riesgoMateria = "Alto";
      else if (mat.asistencia < 70) riesgoMateria = "Medio";

      return {
        name: a.nombre,
        asistencia: Number(mat.asistencia.toFixed(1)),
        riesgo: riesgoMateria,
      };
    })
    .filter(Boolean)
    // Mostrar solo los alumnos realmente en riesgo en esta materia
    .filter((a) => a.riesgo === "Alto" || a.riesgo === "Medio");

  // 🔢 Datos para el gráfico
  const data = alumnosMateria.map((a) => ({
    name: a.name,
    asistencia: a.asistencia,
  }));

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
          Alumnos con riesgo en {materia}
        </h2>

        {alumnosMateria.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data} layout="vertical" margin={{ left: 40 }}>
                <XAxis type="number" domain={[0, 100]} tickFormatter={(n) => `${n}%`} />
                <YAxis type="category" dataKey="name" width={120} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Bar dataKey="asistencia" fill="#3b82f6" />
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
                {alumnosMateria.map((a, i) => (
                  <tr key={i} className="border-b">
                    <td className="p-2">{a.name}</td>
                    <td className="p-2">{a.asistencia}%</td>
                    <td
                      className={`p-2 font-semibold ${
                        a.riesgo === "Alto"
                          ? "text-red-600"
                          : a.riesgo === "Medio"
                          ? "text-yellow-600"
                          : "text-green-600"
                      }`}
                    >
                      {a.riesgo}
                    </td>
                  </tr>
                ))}
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
  const [vista, setVista] = useState("reportes"); // ✅ Controla vista
  const [alumnosDemo, setAlumnosDemo] = useState([]);
  const [carrera, setCarrera] = useState("Ciencias de Datos e Inteligencia Artificial");
  const [año, setAño] = useState("Todos");
  const [showModalRiesgo, setShowModalRiesgo] = useState(false);
  const [showModalMaterias, setShowModalMaterias] = useState(false);
  const [showModalAlumnosMateria, setShowModalAlumnosMateria] = useState(false);
  const [materiaSeleccionada, setMateriaSeleccionada] = useState(null);
  const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
  const [busqueda, setBusqueda] = useState("");

  // 📥 Cargar Excel
  useEffect(() => {
  const cargarExcel = async () => {
    try {
      // ✅ Cargar desde la carpeta public
      const resp = await fetch("/asistencia_demo.xlsx");
      const blob = await resp.arrayBuffer();
      const wb = XLSX.read(blob, { type: "array" });

      console.log("📄 Hojas disponibles:", wb.SheetNames); // debería mostrar ["alumnos", "asistencia_detalle"]

      // ✅ Leer hojas "alumnos" y "asistencia_detalle"
      const alumnosWS = wb.Sheets["alumnos"];
      const detalleWS = wb.Sheets["asistencia_detalle"];

      if (!alumnosWS || !detalleWS) {
        console.error("❌ No se encontraron las hojas 'alumnos' o 'asistencia_detalle' en el Excel");
        return;
      }

      // Convertir ambas hojas a JSON
      const alumnos = XLSX.utils.sheet_to_json(alumnosWS);
      const detalle = XLSX.utils.sheet_to_json(detalleWS);

      // 🔹 Combinar datos: calcular asistencia, riesgo y materias por alumno
      const alumnosCompletos = alumnos.map((a) => {
        const registros = detalle.filter((r) => r.id_alumno === a.id_alumno);
        const total = registros.length;
        const presentes = registros.filter((r) => r.presente === 1).length;
        const asistencia = total ? (presentes / total) * 100 : 0;

        // Nivel de riesgo
        let riesgo = "Bajo";
        if (asistencia < 50) riesgo = "Alto";
        else if (asistencia < 70) riesgo = "Medio";

        // Calcular asistencia por materia
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
          carrera: a.carrera, // ✅ viene desde la hoja alumnos
          materias,
          promedioGeneral: Math.round(asistencia),
          riesgo,
          registros,
        };
      });

      // Guardar resultados
      setAlumnosDemo(alumnosCompletos);
      console.log("✅ Excel cargado correctamente:", alumnosCompletos.slice(0, 3));
    } catch (err) {
      console.error("Error al cargar Excel:", err);
    }
  };

  cargarExcel();
}, []);

  const COLORS = ["#22c55e", "#facc15", "#ef4444"];

  const alumnosFiltrados = useMemo(() => {
    if (año === "Todos") return alumnosDemo;
    const num = parseInt(año);
    return alumnosDemo.filter((a) => a.anio === num);
  }, [año, alumnosDemo]);

  const totalAlumnos = alumnosFiltrados.length;
  const promedioAsistencia = totalAlumnos
    ? (
        alumnosFiltrados.reduce((acc, a) => acc + a.promedioGeneral, 0) / totalAlumnos
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

  const alumnosEnRiesgo = alumnosFiltrados.filter(
    (a) => a.riesgo === "Alto" || a.riesgo === "Medio"
  );

 const materiasFiltradas = useMemo(() => {
  const conteo = {};

  alumnosFiltrados.forEach((alumno) => {
    alumno.materias.forEach((mat) => {
      const nombre = mat.nombre;
      const asistencia = mat.asistencia;

      // Calcular riesgo en esta materia individual
      let riesgo = "Bajo";
      if (asistencia < 50) riesgo = "Alto";
      else if (asistencia < 70) riesgo = "Medio";

      // Solo contar si está en riesgo (alto o medio)
      if (riesgo === "Alto" || riesgo === "Medio") {
        if (!conteo[nombre]) {
          conteo[nombre] = {
            asistencias: [],
            riesgoAlto: 0,
            riesgoMedio: 0,
          };
        }

        conteo[nombre].asistencias.push(asistencia);
        if (riesgo === "Alto") conteo[nombre].riesgoAlto += 1;
        else if (riesgo === "Medio") conteo[nombre].riesgoMedio += 1;
      }
    });
  });

  return Object.entries(conteo)
    .map(([materia, datos]) => {
      const promedio = Math.round(
        datos.asistencias.reduce((acc, val) => acc + val, 0) / datos.asistencias.length
      );
      return {
        materia,
        promedio,
        riesgoAlto: datos.riesgoAlto,
        riesgoMedio: datos.riesgoMedio,
        totalRiesgo: datos.riesgoAlto + datos.riesgoMedio,
      };
    })
    .sort((a, b) => b.totalRiesgo - a.totalRiesgo || a.promedio - b.promedio);
}, [alumnosFiltrados]);


  const abrirAlumnosMateria = (materia) => {
    setMateriaSeleccionada(materia);
    setShowModalAlumnosMateria(true);
  };



  // 📄 Exportar informe pedagógico a PDF
const exportarPDF = async () => {
  const elemento = document.getElementById("informe-pedagogico");
  if (!elemento) {
    alert("❌ No se encontró el informe pedagógico.");
    return;
  }

  // Asegura que el bloque esté visible arriba  (opcional pero recomendado)
  elemento.scrollIntoView({ behavior: "instant", block: "start" });

  const canvas = await html2canvas(elemento, {
    scale: 2,            // calidad 2x
    useCORS: true,       // por si hay imágenes
    backgroundColor: "#1f2937", // gris oscuro de tu card
  });

  const imgData = canvas.toDataURL("image/png");
  const pdf = new jsPDF("p", "mm", "a4");
  const imgProps = pdf.getImageProperties(imgData);
  const pdfW = pdf.internal.pageSize.getWidth();
  const pdfH = (imgProps.height * pdfW) / imgProps.width;

  let heightLeft = pdfH;
  let position = 0;

  pdf.addImage(imgData, "PNG", 0, position, pdfW, pdfH);
  heightLeft -= pdf.internal.pageSize.getHeight();

  while (heightLeft > 0) {
    position = heightLeft - pdfH;
    pdf.addPage();
    pdf.addImage(imgData, "PNG", 0, position, pdfW, pdfH);
    heightLeft -= pdf.internal.pageSize.getHeight();
  }

  pdf.save("informe_pedagogico.pdf");
};




  // 💡 Render
  return (
    <div className="pt-24 px-6 pb-6 bg-gray-50 min-h-screen">
      <NavbarDashboard onChangeView={setVista} activeView={vista} />

      {vista === "reportes" && (
        <>
          <h1 className="text-2xl font-bold mb-6 text-gray-800">Panel de Reportes</h1>

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
                <Pie
                  data={dataRiesgo}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label
                >
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
              {año === "Todos" ? "Todos los niveles" : `${año}° Año`}
            </h2>
            <div className="overflow-x-auto">
              <div className="min-w-[600px]">
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={materiasFiltradas} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} />
                    <YAxis type="category" dataKey="materia" width={180} />
                    <Tooltip />
                    <Bar dataKey="promedio" name="Promedio de asistencia">
                      {materiasFiltradas.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={
                            entry.promedio < 50
                              ? "#ef4444" // 🔴 rojo = riesgo alto
                              : entry.promedio < 70
                              ? "#facc15" // 🟡 amarillo = riesgo medio
                              : "#22c55e" // 🟢 verde = riesgo bajo (buena asistencia)
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

         {/* Listado dinámico de materias críticas */}
            {materiasFiltradas.some((m) => m.promedio < 50) && (
            <p className="text-sm text-red-600 mt-1 text-center">
                Materias en estado crítico:{" "}
                {materiasFiltradas
                .filter((m) => m.promedio < 50)
                .map((m) => m.materia)
                .join(", ")}
            </p>
            )}

          {/* 📈 Tendencia semanal de asistencia */}
<div className="bg-white rounded-lg shadow p-4 mt-8">
  <h2 className="text-lg font-semibold mb-3 text-gray-700">
    Historico de Asistencia —{" "}
    {año === "Todos" ? "Todos los niveles" : `${año}° Año`}
  </h2>

  {/* 🔍 Buscador y selector sincronizados */}
  <div className="flex flex-wrap gap-3 mb-4">
    <input
      type="text"
      placeholder="Buscar alumno (escribe para filtrar)..."
      className="border p-2 rounded-md flex-1 min-w-[200px]"
      value={busqueda}
      onChange={(e) => setBusqueda(e.target.value)}
    />
    <select
      className="border p-2 rounded-md min-w-[200px]"
      value={busqueda}
      onChange={(e) => setBusqueda(e.target.value)}
    >
      <option value="">— Ver todos —</option>
      {alumnosFiltrados
        .filter((a) =>
          a.nombre.toLowerCase().includes(busqueda.toLowerCase())
        )
        .map((a) => (
          <option key={a.id} value={a.nombre}>
            {a.nombre}
          </option>
        ))}
    </select>
  </div>

  {/* 📊 Gráfico de tendencia mensual (con detalle semanal en el mes actual) */}
<ResponsiveContainer width="100%" height={350}>
  <LineChart
    data={(() => {
      if (alumnosFiltrados.length === 0) return [];

      const ahora = new Date();
      const mesActual = ahora.getMonth() + 1;
      const anioActual = ahora.getFullYear();

      const grupos = {};

      alumnosFiltrados.forEach((a) => {
        a.registros.forEach((r) => {
          const fecha = new Date(r.fecha);
          const anio = fecha.getFullYear();
          const mes = fecha.getMonth() + 1;
          const diaMes = fecha.getDate();

          // 🔹 Clave general mensual
          let clave = `${anio}-${String(mes).padStart(2, "0")}`;

          // 🔸 Si es el mes actual, dividir por semanas dentro del mes
          if (anio === anioActual && mes === mesActual) {
            const semanaMes = Math.ceil(diaMes / 7);
            clave = `${anio}-${String(mes).padStart(2, "0")}-S${semanaMes}`;
          }

          if (!grupos[clave]) grupos[clave] = [];

          // 🔎 Filtrar por texto o alumno seleccionado
          if (
            !busqueda ||
            a.nombre.toLowerCase().includes(busqueda.toLowerCase())
          ) {
            grupos[clave].push(r.presente);
          }
        });
      });

      // 🔹 Calcular promedio por grupo (mes o semana del mes actual)
      const data = Object.entries(grupos).map(([periodo, valores]) => ({
        periodo,
        asistencia: Math.round(
          (valores.reduce((a, b) => a + b, 0) / valores.length) * 100
        ),
      }));

      // 🔸 Ordenar cronológicamente (año → mes → semana)
      return data.sort((a, b) => (a.periodo > b.periodo ? 1 : -1));
    })()}
  >
    <XAxis dataKey="periodo" />
    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
    <Tooltip formatter={(v) => `${v}%`} />
    <Line
      type="monotone"
      dataKey="asistencia"
      stroke="#2563eb"
      strokeWidth={3}
      dot={true}
    />
  </LineChart>
</ResponsiveContainer>

<p className="text-sm text-gray-500 mt-2">
  * Muestra la evolución mensual del porcentaje promedio de asistencia.
  En el mes actual, se desglosa por semanas (S1, S2, S3...).
  {busqueda && " (filtrado por alumno)"}
</p>
</div>

{/* ────────────────────────────────────────────── */}
{/* 🔹 INFORME PEDAGÓGICO DEL ALUMNO (PROTOTIPO) */}
{/* ──────────────────────────────────────────────  */}
<div 
    id="informe-pedagogico"   // ✅ necesario para capturar este bloque
    className="mt-10 bg-gray-900 text-white rounded-2xl shadow-lg p-6 border border-gray-700">
  <h2 className="text-2xl font-bold mb-4">
    📋 Informe Pedagógico — Alumno:{" "}
    <span className="text-emerald-400">Juan Pérez</span>
  </h2>
  <p className="text-gray-400 mb-6">
    Carrera:{" "}
    <span className="text-gray-200">
      Ciencias de Datos e Inteligencia Artificial
    </span>{" "}
    · Año: <span className="text-gray-200">2°</span> · Fecha del informe:{" "}
    <span className="text-gray-200">17/10/2025</span>
  </p>

  {/* Diagnóstico de Asistencia  */}
  <div className="bg-gray-800 rounded-xl p-4 mb-6">
    <h3 className="text-xl font-semibold mb-3 text-amber-300">
      📊 Diagnóstico de Asistencia
    </h3>
    <ul className="space-y-2 text-gray-300">
      <li>
        • Asistencia general:{" "}
        <span className="text-red-400 font-semibold">
          58% (Riesgo Medio)
        </span>
      </li>
      <li>
        • Materias con asistencia baja:{" "}
        <span className="text-red-400 font-semibold">Matemática (45%)</span>,{" "}
        <span className="text-yellow-400 font-semibold">
          Programación (52%)
        </span>
      </li>
      <li>
        • Tendencia mensual: 📉{" "}
        <span className="text-gray-200">Descendente</span>
      </li>
      <li>
        • Promedio del curso:{" "}
        <span className="text-gray-200">73%</span>
      </li>
    </ul>
    <p className="mt-3 text-gray-400 italic">
      💡 Interpretación: el alumno presenta una asistencia inferior al promedio
      general, con tendencia negativa durante las últimas semanas.
    </p>
  </div>

  {/* Acciones Tomadas */}
  <div className="bg-gray-800 rounded-xl p-4 mb-6">
    <h3 className="text-xl font-semibold mb-3 text-sky-300">
      ⚙️ Acciones Tomadas
    </h3>
    <table className="w-full text-sm text-gray-300">
      <thead className="text-gray-400">
        <tr>
          <th className="text-left pb-2">Fecha</th>
          <th className="text-left pb-2">Acción</th>
          <th className="text-left pb-2">Canal</th>
          <th className="text-left pb-2">Estado</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-t border-gray-700">
          <td className="py-2">10/10/2025</td>
          <td>Mensaje al tutor notificando asistencia baja</td>
          <td>WhatsApp</td>
          <td className="text-emerald-400 font-semibold">✅ Enviado</td>
        </tr>
        <tr className="border-t border-gray-700">
          <td className="py-2">11/10/2025</td>
          <td>Mensaje automatizado al alumno (chatbot)</td>
          <td>Chatbot</td>
          <td className="text-emerald-400 font-semibold">✅ Completado</td>
        </tr>
        <tr className="border-t border-gray-700">
          <td className="py-2">17/10/2025</td>
          <td>Análisis de respuestas recibido</td>
          <td>Sistema IA</td>
          <td className="text-emerald-400 font-semibold">✅ Procesado</td>
        </tr>
      </tbody>
    </table>
    <p className="mt-3 text-gray-400 italic">
      🧠 El sistema registró la intervención y el resultado está disponible en el
      análisis siguiente.
    </p>
  </div>

  {/* Chatbot Pedagógico */}
  <div className="bg-gray-800 rounded-xl p-4 mb-6">
    <h3 className="text-xl font-semibold mb-3 text-pink-300">
      💬 Resumen del Chatbot Pedagógico
    </h3>
    <div className="space-y-3 text-gray-300">
      <p>
        ❓ <strong>¿Por qué creés que estás faltando últimamente?</strong>
        <br />→ “Últimamente me cuesta entender la materia de Matemática, me
        frustro y dejo de ir.”
      </p>
      <p>
        ❓ <strong>¿Tenés algún problema personal o de horarios?</strong>
        <br />→ “Trabajo algunos días y salgo tarde.”
      </p>
      <p>
        ❓ <strong>¿Te gustaría recibir ayuda o tutoría?</strong>
        <br />→ “Sí, estaría bien tener un repaso con un docente.”
      </p>
    </div>
  </div>

  {/* Análisis del Modelo IA */}
  <div className="bg-gray-800 rounded-xl p-4 mb-6">
    <h3 className="text-xl font-semibold mb-3 text-violet-300">
      🤖 Resultado del Análisis de Texto (IA Prototipo)
    </h3>
    <p className="text-gray-400 mb-3">
      Modelo aplicado:{" "}
      <span className="text-gray-200">
        Clasificador de causas de inasistencia (TF-IDF + Regresión Logística)
      </span>
    </p>
    <table className="w-full text-sm text-gray-300 mb-3">
      <thead className="text-gray-400">
        <tr>
          <th className="text-left pb-2">Categoría</th>
          <th className="text-left pb-2">Probabilidad</th>
          <th className="text-left pb-2">Palabras clave</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-t border-gray-700">
          <td>🧮 Dificultad con la materia</td>
          <td className="text-emerald-400 font-semibold">68%</td>
          <td>cuesta, entender, frustro</td>
        </tr>
        <tr className="border-t border-gray-700">
          <td>💼 Problemas personales / laborales</td>
          <td>22%</td>
          <td>trabajo, salgo tarde</td>
        </tr>
        <tr className="border-t border-gray-700">
          <td>😕 Desinterés general</td>
          <td>10%</td>
          <td>—</td>
        </tr>
      </tbody>
    </table>
    <p className="text-gray-400 italic">
      🧩 Interpretación: el modelo estima que la causa principal es{" "}
      <span className="text-emerald-400 font-semibold">
        dificultad en la materia (Matemática)
      </span>
      , con influencia secundaria de factores laborales.
    </p>
  </div>

  {/* Recomendaciones */}
  <div className="bg-gray-800 rounded-xl p-4 mb-6">
    <h3 className="text-xl font-semibold mb-3 text-emerald-300">
      🎯 Recomendaciones del Sistema
    </h3>
    <ul className="list-disc list-inside text-gray-300 space-y-1">
      <li>📚 Programar una tutoría reforzada en Matemática.</li>
      <li>📆 Ajustar horario de cursado si el alumno trabaja.</li>
      <li>📲 Reforzar contacto con tutor y seguimiento semanal.</li>
      <li>🧠 Incluir al alumno en grupo de acompañamiento académico.</li>
    </ul>
  </div>

  {/* Botón Exportar PDF (prototipo) */}
  <div className="mt-6 flex justify-end">
   <button
  onClick={exportarPDF}   // ✅ ahora exporta el PDF real
  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-lg shadow-md transition-all"
>
  📄 Exportar informe a PDF
</button>
  </div>
</div>
{/* ────────────────────────────────────────────── */}







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
                  Alumnos en riesgo
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
                    .filter((a) =>
                      a.nombre.toLowerCase().includes(busqueda.toLowerCase())
                    )
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
            <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center z-80">
              <div className="bg-white rounded-xl shadow-lg p-8 w-[800px] max-h-[80vh] overflow-y-auto relative">
                <button
                  onClick={() => setShowModalMaterias(false)}
                  className="absolute top-4 right-5 text-2xl font-bold text-gray-500 hover:text-black"
                >
                  ✖
                </button>
                <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
                  Materias analizadas — Foco en alumnos en riesgo (Alto/Medio)
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
              alumnos={alumnosFiltrados} // ✅ debe usar alumnosFiltrados
              onClose={() => setShowModalAlumnosMateria(false)}
            />
          )}

          {alumnoSeleccionado && (
            <ModalAlumnoDetalle
              alumno={alumnoSeleccionado}
              onClose={() => setAlumnoSeleccionado(null)}
            />
          )}
        </>
      )}

      {vista === "prediccion" && <Prediccion />}
    </div>
  );
};

export default Reportes;