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

  // 📥 Cargar Excel y calcular promedio mensual real
  useEffect(() => {
    const cargarDatos = async () => {
      try {
        const resp = await fetch("/src/data/asistencia_demo.xlsx");
        const blob = await resp.arrayBuffer();
        const wb = XLSX.read(blob, { type: "array" });
        const detalleWS = wb.Sheets["asistencia_detalle"];
        const detalle = XLSX.utils.sheet_to_json(detalleWS);

        // Agrupar por mes (asumiendo formato fecha YYYY-MM-DD)
        const asistenciaPorMes = {};
        detalle.forEach((r) => {
          const fecha = new Date(r.fecha);
          const mes = fecha.toLocaleString("es-ES", { month: "long" });
          if (!asistenciaPorMes[mes]) asistenciaPorMes[mes] = { total: 0, presentes: 0 };
          asistenciaPorMes[mes].total += 1;
          if (r.presente === 1) asistenciaPorMes[mes].presentes += 1;
        });

        const datos = Object.keys(asistenciaPorMes).map((mes) => ({
          mes: mes.charAt(0).toUpperCase() + mes.slice(1),
          asistencia: Math.round(
            (asistenciaPorMes[mes].presentes / asistenciaPorMes[mes].total) * 100
          ),
        }));

        // Orden lógico de meses
        const ordenMeses = [
          "enero","febrero","marzo","abril","mayo",
          "junio","julio","agosto","septiembre","octubre","noviembre","diciembre"
        ];
        const ordenados = datos.sort(
          (a, b) => ordenMeses.indexOf(a.mes.toLowerCase()) - ordenMeses.indexOf(b.mes.toLowerCase())
        );

        setMensual(ordenados);
      } catch (err) {
        console.error("Error al cargar Excel:", err);
      }
    };

    cargarDatos();
  }, []);

  // 🔹 Calcular regresión lineal
  const predicciones = useMemo(() => {
    if (mensual.length === 0) return [];

    const n = mensual.length;
    const xs = mensual.map((_, i) => i + 1);
    const ys = mensual.map((p) => p.asistencia);

    const meanX = xs.reduce((a, b) => a + b, 0) / n;
    const meanY = ys.reduce((a, b) => a + b, 0) / n;

    const num = xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i] - meanY), 0);
    const den = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
    const a = num / den;
    const b = meanY - a * meanX;

    const mesesFuturos = ["Noviembre", "Diciembre", "Enero"];
    const futuros = mesesFuturos.map((m, i) => ({
      mes: m,
      asistencia: Math.max(0, Math.min(100, Math.round(a * (n + i + 1) + b))),
      prediccion: true,
    }));

    return [...mensual, ...futuros];
  }, [mensual]);

  const futuros = predicciones.filter((p) => p.prediccion);
  const [mes1, mes2, mes3] = futuros;

  // 📊 Detectar tendencia (pendiente)
  const pendiente = useMemo(() => {
    if (mensual.length < 2) return 0;
    const first = mensual[0].asistencia;
    const last = mensual[mensual.length - 1].asistencia;
    return last - first;
  }, [mensual]);

  const mensajeTendencia =
    pendiente > 3
      ? "📈 Tendencia positiva"
      : pendiente < -3
      ? "📉 Tendencia a la baja"
      : "⚖️ Tendencia estable";

  return (
    <div className="p-6 mt-20">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">
        🔮 Predicción de Asistencia (basada en datos reales)
      </h1>

      {mensual.length === 0 ? (
        <p className="text-center text-gray-500">Cargando datos...</p>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={predicciones}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => `${v}%`} />
                <Line
                  type="monotone"
                  dataKey="asistencia"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Asistencia histórica"
                />
                <Line
                  type="monotone"
                  dataKey="asistencia"
                  stroke="#f97316"
                  strokeWidth={3}
                  strokeDasharray="5 5"
                  data={predicciones.filter((p) => p.prediccion)}
                  name="Predicción"
                />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-center mt-4 text-gray-700 font-medium">
              {mensajeTendencia}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div className="bg-indigo-50 rounded-xl p-4 shadow">
              <h3 className="text-gray-700 font-medium">{mes1?.mes}</h3>
              <p className="text-3xl font-bold text-indigo-600">
                {mes1?.asistencia ?? "-"}%
              </p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 shadow">
              <h3 className="text-gray-700 font-medium">{mes2?.mes}</h3>
              <p className="text-3xl font-bold text-indigo-600">
                {mes2?.asistencia ?? "-"}%
              </p>
            </div>
            <div className="bg-indigo-50 rounded-xl p-4 shadow">
              <h3 className="text-gray-700 font-medium">{mes3?.mes}</h3>
              <p className="text-3xl font-bold text-indigo-600">
                {mes3?.asistencia ?? "-"}%
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
