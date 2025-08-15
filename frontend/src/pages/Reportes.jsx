import { useState, useEffect } from "react";
import { PieChart, Pie, Cell, Tooltip, Legend } from "recharts";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import * as XLSX from "xlsx";

const PALETA = {
  primario: "#237BB2",
  primarioAlt: "#179FCE",
  foco: "#122847",
  ok: "#4CAF50",
  okHover: "#388E3C",
  peligro: "#FB6362",
  peligroHover: "#D9534F",
  editar: "rgba(230, 159, 78, 0.89)",
};

const datosEjemplo = [
  { id: 1, nombre: "Ana Gómez", presentes: 92, ausentes: 5, justificados: 4 },
  { id: 2, nombre: "Juan Pérez", presentes: 88, ausentes: 3, justificados: 7 },
  { id: 3, nombre: "Lucía Martínez", presentes: 95, ausentes: 0, justificados: 8 },
  { id: 4, nombre: "Leo Gonsales", presentes: 79, ausentes: 7, justificados: 5 },
  { id: 5, nombre: "Martina Flores", presentes: 66, ausentes: 2, justificados: 11 },
];

const coloresGrafico = [PALETA.ok, PALETA.peligro, PALETA.editar];

const ReporteAsistencias = () => {
  const [filtroCarrera, setFiltroCarrera] = useState("");
  const [filtroMateria, setFiltroMateria] = useState("");
  const [filtroFecha, setFiltroFecha] = useState("");
  const [datos, setDatos] = useState([]);

  useEffect(() => {
    setDatos(datosEjemplo);
  }, []);

  const asistenciaPromedio =
    datos.length > 0
      ? (datos.reduce((acc, cur) => acc + cur.presentes, 0) / datos.length).toFixed(1)
      : 0;

  const asistenciaPerfecta = datos.filter((d) => d.presentes === 100).length;
  const ausenciasFrecuentes = datos.filter((d) => d.ausentes > 5).length;

  const totalPresentes = datos.reduce((acc, cur) => acc + cur.presentes, 0);
  const totalAusentes = datos.reduce((acc, cur) => acc + cur.ausentes, 0);
  const totalJustificados = datos.reduce((acc, cur) => acc + cur.justificados, 0);

  const graficoData = [
    { name: "Presentes", value: totalPresentes },
    { name: "Ausentes", value: totalAusentes },
    { name: "Justificados", value: totalJustificados },
  ];

  // PDF con estilos completos
  const exportarPDF = () => {
    const elemento = document.getElementById("area-exportar");
    html2canvas(elemento, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save("reporte_asistencias.pdf");
    });
  };

  // Excel con estilos básicos
  const exportarExcel = () => {
    const tabla = document.querySelector("#tabla-asistencias");
    const ws = XLSX.utils.table_to_sheet(tabla);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reporte");
    XLSX.writeFile(wb, "reporte_asistencias.xlsx");
  };

  return (
    <div className="p-6">
      <div id="area-exportar">
        <h1
          className="text-2xl font-bold mb-6 text-center w-fit mx-auto pb-2"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.5)" }}
        >
          Reportes Analíticos de Asistencia
        </h1>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4 mb-6 justify-center">
          <input
            type="text"
            placeholder="Carrera"
            value={filtroCarrera}
            onChange={(e) => setFiltroCarrera(e.target.value)}
            className="border p-2 rounded bg-gray-100 focus:outline-none focus:ring-1 focus:ring-[#122847] hover:border-[#122847] transition"
          />
          <input
            type="text"
            placeholder="Materia"
            value={filtroMateria}
            onChange={(e) => setFiltroMateria(e.target.value)}
            className="border p-2 rounded bg-gray-100 focus:outline-none focus:ring-1 focus:ring-[#122847] hover:border-[#122847] transition"
          />
          <input
            type="date"
            value={filtroFecha}
            onChange={(e) => setFiltroFecha(e.target.value)}
            className="border p-2 rounded bg-gray-100 focus:outline-none focus:ring-1 focus:ring-[#122847] hover:border-[#122847] transition"
          />
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto mb-6">
          <table
            id="tabla-asistencias"
            className="w-full border-collapse bg-white shadow rounded-lg border border-black"
          >
            <thead>
              <tr className="bg-[#237BB2]/85 text-white text-center text-lg font-semibold border-b-2 border-black">
                <th className="p-2 border-r border-black">N°</th>
                <th className="p-2 border-r border-black">Nombre del Estudiante</th>
                <th className="p-2 border-r border-black">Presentes</th>
                <th className="p-2 border-r border-black">Ausentes</th>
                <th className="p-2 border-r border-black">Justificados</th>
              </tr>
            </thead>
            <tbody>
              {datos.map((d, index) => (
                <tr key={d.id} className="border-b border-black text-base">
                  <td className="border-r border-black p-2 text-center">{index + 1}</td>
                  <td className="border-r border-black p-2">{d.nombre}</td>
                  <td className="border-r border-black p-2 text-center">{d.presentes}%</td>
                  <td className="border-r border-black p-2 text-center">{d.ausentes}%</td>
                  <td className="p-2 text-center">{d.justificados}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Gráfico + stats */}
        <div className="flex flex-col md:flex-row justify-center items-start gap-8 mb-6">
          <PieChart width={300} height={300}>
            <Pie
              data={graficoData}
              cx="50%"
              cy="50%"
              labelLine={false}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {graficoData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={coloresGrafico[index % coloresGrafico.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>

          <div className="rounded-xl shadow border border-black/50 overflow-hidden min-w-[280px]">
            <div
              className="px-4 py-2 text-white text-center font-semibold"
              style={{
                background: `linear-gradient(90deg, ${PALETA.primario} 0%, ${PALETA.primarioAlt} 100%)`,
              }}
            >
              Resumen del curso
            </div>
            <div className="p-4 space-y-2 text-[#122847]">
              <p>
                Asistencia promedio: <strong>{asistenciaPromedio}%</strong>
              </p>
              <p>
                Asistencia perfecta:{" "}
                <strong
                  className="px-2 py-0.5 rounded"
                  style={{ backgroundColor: PALETA.ok, color: "white" }}
                >
                  {asistenciaPerfecta}
                </strong>
              </p>
              <p>
                Ausencias frecuentes:{" "}
                <strong
                  className="px-2 py-0.5 rounded"
                  style={{ backgroundColor: PALETA.peligro, color: "white" }}
                >
                  {ausenciasFrecuentes}
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-center gap-4">
        <button
          onClick={exportarPDF}
          className="px-4 py-2 text-white rounded hover:opacity-90"
          style={{ backgroundColor: PALETA.peligro }}
        >
          Exportar a PDF
        </button>
        <button
          onClick={exportarExcel}
          className="px-4 py-2 text-white rounded hover:bg-[#388E3C]"
          style={{ backgroundColor: PALETA.ok }}
        >
          Exportar a Excel
        </button>
      </div>
    </div>
  );
};

export default ReporteAsistencias;
