import React, { useEffect, useState, useMemo } from "react";
import * as XLSX from "xlsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Prediccion() {
  const [mensual, setMensual] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [anios, setAnios] = useState([]);
  const [carreraSel, setCarreraSel] = useState("");
  const [anioSel, setAnioSel] = useState("Todos");

  // 📥 Cargar Excel
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const resp = await fetch("/asistencia_demo.xlsx");
        const blob = await resp.arrayBuffer();
        const wb = XLSX.read(blob, { type: "array" });
        const alumnosWS = wb.Sheets["alumnos"];
        const detalleWS = wb.Sheets["asistencia_detalle"];
        const alumnos = XLSX.utils.sheet_to_json(alumnosWS);
        const detalle = XLSX.utils.sheet_to_json(detalleWS);

        // Detectar carreras y años disponibles
        const carrerasUnicas = [...new Set(alumnos.map((a) => a.carrera))].filter(Boolean);
        setCarreras(carrerasUnicas);
        if (carrerasUnicas.length === 1) setCarreraSel(carrerasUnicas[0]);

        const aniosUnicos = [...new Set(alumnos.map((a) => a.anio))].filter(Boolean);
        setAnios(["Todos", ...aniosUnicos.sort()]);

        // Guardar datos combinados
        detalle.forEach((r) => {
          const alum = alumnos.find((a) => a.id_alumno === r.id_alumno);
          r.carrera = alum?.carrera || "";
          r.anio = alum?.anio || "";
        });

        // Guardamos en memoria todo para filtrar luego
        setMensual(detalle);
      } catch (err) {
        console.error("Error al cargar Excel:", err);
      }
    };

    cargarDatos();
  }, []);

  // 🔹 Filtrado según carrera y año
  const filtrados = useMemo(() => {
    if (!mensual.length || !carreraSel) return [];
    return mensual.filter(
      (r) =>
        r.carrera === carreraSel &&
        (anioSel === "Todos" || String(r.anio) === String(anioSel))
    );
  }, [mensual, carreraSel, anioSel]);

  // 🔹 Calcular promedio mensual de asistencia
  const mensualPromedio = useMemo(() => {
    if (!filtrados.length) return [];

    const asistenciaPorMes = {};
    filtrados.forEach((r) => {
      const fecha = new Date(r.fecha);
      const mes = fecha.toLocaleString("es-ES", { month: "long", year: "numeric" });
      if (!asistenciaPorMes[mes]) asistenciaPorMes[mes] = { total: 0, presentes: 0 };
      asistenciaPorMes[mes].total += 1;
      if (r.presente === 1) asistenciaPorMes[mes].presentes += 1;
    });

    const datos = Object.keys(asistenciaPorMes).map((mes) => ({
      mes: mes.charAt(0).toUpperCase() + mes.slice(1).replace("de ", ""),
      asistencia: Math.round(
        (asistenciaPorMes[mes].presentes / asistenciaPorMes[mes].total) * 100
      ),
    }));

    const mesesOrden = [
      "enero","febrero","marzo","abril","mayo","junio",
      "julio","agosto","septiembre","octubre","noviembre","diciembre",
    ];

    const ordenados = datos.sort((a, b) => {
      const [mesA, añoA] = a.mes.toLowerCase().split(" ");
      const [mesB, añoB] = b.mes.toLowerCase().split(" ");
      if (añoA !== añoB) return parseInt(añoA) - parseInt(añoB);
      return mesesOrden.indexOf(mesA) - mesesOrden.indexOf(mesB);
    });

    return ordenados;
  }, [filtrados]);

  // 🔹 Regresión lineal (predicción)
  const predicciones = useMemo(() => {
    if (mensualPromedio.length === 0) return [];

    const n = mensualPromedio.length;
    const xs = mensualPromedio.map((_, i) => i + 1);
    const ys = mensualPromedio.map((p) => p.asistencia);
    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;
    const num = xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i] - meanY), 0);
    const den = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
    const a = num / den;
    const b = meanY - a * meanX;

    const mesesFuturos = ["Octubre", "Noviembre", "Diciembre"];
    const futuros = mesesFuturos.map((m, i) => ({
      mes: m + " 2025",
      asistencia: Math.max(0, Math.min(100, Math.round(a * (n + i + 1) + b))),
      prediccion: true,
    }));

    return [...mensualPromedio, ...futuros];
  }, [mensualPromedio]);

  // 🔹 Tendencia
  const pendiente = useMemo(() => {
    if (mensualPromedio.length < 2) return 0;
    const first = mensualPromedio[0].asistencia;
    const last = mensualPromedio[mensualPromedio.length - 1].asistencia;
    return last - first;
  }, [mensualPromedio]);

  const mensajeTendencia =
    pendiente > 3
      ? "📈 Tendencia positiva en la asistencia"
      : pendiente < -3
      ? "📉 Tendencia a la baja, posible riesgo"
      : "⚖️ Tendencia estable";

  const futuros = predicciones.filter((p) => p.prediccion);
  const [mes1, mes2, mes3] = futuros;

  return (
    <div className="p-6 mt-20">
      {/* 🔹 Encabezado con carrera y año */}
      <h1 className="text-2xl font-bold mb-4 text-gray-800 text-center">
        🔮 Predicción de Asistencia —{" "}
        {carreraSel ? `${carreraSel}` : "Selecciona carrera"}{" "}
        {anioSel !== "Todos" ? `· ${anioSel}° Año` : ""}
      </h1>

      {/* Filtros */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Carrera</span>
          <select
            value={carreraSel}
            onChange={(e) => setCarreraSel(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 shadow-sm"
          >
            <option value="" disabled>Selecciona carrera</option>
            {carreras.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {carreraSel && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Año</span>
            <select
              value={anioSel}
              onChange={(e) => setAnioSel(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 shadow-sm"
            >
              {anios.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Gráfico */}
      {!carreraSel ? (
        <p className="text-center text-gray-500">Selecciona una carrera para comenzar…</p>
      ) : mensualPromedio.length === 0 ? (
        <p className="text-center text-gray-500">
          No hay datos suficientes para calcular la tendencia.
        </p>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={predicciones}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" angle={-30} textAnchor="end" height={60} />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Line
                  type="monotone"
                  dataKey="asistencia"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  data={mensualPromedio}
                  name="Asistencia real"
                />
                <Line
                  type="monotone"
                  dataKey="asistencia"
                  stroke="#f97316"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  dot={{ r: 4 }}
                  data={futuros}
                  name="Predicción"
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-center mt-4 text-gray-700 font-medium">
              {mensajeTendencia}
            </p>
          </div>

          {/* Tarjetas de predicción futura */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            {[mes1, mes2, mes3].map((m, i) => (
              <div key={i} className="bg-indigo-50 rounded-xl p-4 shadow">
                <h3 className="text-gray-700 font-medium">{m?.mes}</h3>
                <p className="text-3xl font-bold text-indigo-600">
                  {m?.asistencia ?? "-"}%
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
