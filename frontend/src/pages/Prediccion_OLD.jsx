import React, { useEffect, useMemo, useState } from "react";
import * as XLSX from "xlsx";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
} from "recharts";

// Parámetros de simulación de "apoyo institucional"
const SUPPORT_SLOPE_FACTOR = 1.3; // Mejora de la pendiente vs situación actual
const SUPPORT_BIAS_POINTS = 2;    // Uplift adicional en puntos porcentuales
const CLAMP01 = (v) => Math.max(0, Math.min(100, v));

function parseRowFlexible(r) {
  // Normaliza claves a minúsculas
  const lc = Object.fromEntries(
    Object.entries(r).map(([k, v]) => [String(k).toLowerCase(), v])
  );
  const take = (...names) => {
    for (const n of names) {
      if (lc[n] !== undefined) return lc[n];
    }
    return undefined;
  };

  const carrera = String(take("carrera", "career") ?? "").trim();
  const anioRaw = take("anio", "año", "year");
  const anio = typeof anioRaw === "number" ? anioRaw : String(anioRaw ?? "").trim();
  const materia = String(take("materia", "asignatura", "subject") ?? "").trim();
  const alumno = String(take("alumno", "estudiante", "student") ?? "").trim();

  const fechaVal = take("fecha", "date", "dia", "día");
  const fecha = fechaVal ? new Date(fechaVal) : null;

  // Presente: admite 1/0, true/false, "P"/"A", "presente"/"ausente"
  const p = take("presente", "asistencia", "present");
  const presente =
    p === 1 ||
    p === "1" ||
    p === true ||
    String(p).toLowerCase() === "p" ||
    String(p).toLowerCase() === "presente"
      ? 1
      : 0;

  if (!fecha || isNaN(fecha.getTime())) return null;

  return { carrera, anio, materia, alumno, fecha, presente };
}

function monthKey(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return `${y}-${String(m).padStart(2, "0")}`; // YYYY-MM
}
function monthLabelEs(date) {
  const meses = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"
  ];
  return `${meses[date.getMonth()]} ${date.getFullYear()}`;
}
function nextMonth(date) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + 1);
  return d;
}
function linearRegressionXY(xs, ys) {
  const n = xs.length;
  const meanX = xs.reduce((a, b) => a + b, 0) / n;
  const meanY = ys.reduce((a, b) => a + b, 0) / n;
  const num = xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i] - meanY), 0);
  const den = xs.reduce((sum, x) => sum + Math.pow(x - meanX, 2), 0);
  const a = den === 0 ? 0 : num / den; // pendiente
  const b = meanY - a * meanX;         // intercepto
  return { a, b };
}

export default function Prediccion() {
  const [raw, setRaw] = useState([]);
  const [carreras, setCarreras] = useState([]);
  const [anios, setAnios] = useState([]);
  const [alumnos, setAlumnos] = useState([]);

  const [carreraSel, setCarreraSel] = useState("");
  const [anioSel, setAnioSel] = useState("Todos");
  const [alumnoSel, setAlumnoSel] = useState("Todos");


// Cargar Excel desde /public/
// 📥 Cargar Excel (dos hojas: alumnos + asistencia_detalle)
useEffect(() => {
  const cargarExcel = async () => {
    try {
      // ✅ Leer el archivo desde la carpeta /public
      const resp = await fetch("/asistencia_demo.xlsx");
      const blob = await resp.arrayBuffer();
      const wb = XLSX.read(blob, { type: "array" });

      console.log("📄 Hojas disponibles:", wb.SheetNames); // debería mostrar ["alumnos", "asistencia_detalle"]

      // ✅ Leer las dos hojas
      const alumnosWS = wb.Sheets["alumnos"];
      const detalleWS = wb.Sheets["asistencia_detalle"];

      if (!alumnosWS || !detalleWS) {
        console.error("❌ No se encontraron las hojas 'alumnos' o 'asistencia_detalle' en el Excel");
        return;
      }

      // Convertir a JSON
      const alumnos = XLSX.utils.sheet_to_json(alumnosWS);
      const detalle = XLSX.utils.sheet_to_json(detalleWS);

      // 🔹 Combinar alumnos con registros de asistencia
      const registrosCombinados = detalle.map((r) => {
        const alumno = alumnos.find((a) => a.id_alumno === r.id_alumno);
        return {
          ...r,
          alumno: alumno ? alumno.nombre : "Desconocido",
          anio: alumno ? alumno.anio : "",
          carrera: alumno ? alumno.carrera : "",
        };
      });

      // ✅ Convertir y filtrar fechas válidas (evita error getFullYear)
      const parsed = registrosCombinados
        .map((r) => ({
          ...r,
          fecha: r.fecha ? new Date(r.fecha) : null, // forzar conversión a Date
        }))
        .filter((r) => r.fecha instanceof Date && !isNaN(r.fecha))
        .sort((a, b) => a.fecha - b.fecha);

      // Guardar registros combinados
      setRaw(parsed);

      // Extraer carreras únicas
      const carrerasUnicas = [...new Set(parsed.map((r) => r.carrera))].filter(Boolean);
      setCarreras(carrerasUnicas);

      // Si hay una sola carrera, seleccionarla automáticamente
      if (carrerasUnicas.length === 1) setCarreraSel(carrerasUnicas[0]);

      console.log("✅ Excel combinado cargado correctamente:", parsed.slice(0, 5));
    } catch (err) {
      console.error("Error al cargar Excel:", err);
    }
  };

  cargarExcel();
}, []);



  // Años disponibles según carrera
  useEffect(() => {
    if (!carreraSel) {
      setAnios([]);
      setAnioSel("Todos");
      return;
    }
    const subset = raw.filter((r) => r.carrera === carreraSel);
    const aniosUnicos = [...new Set(subset.map((d) => d.anio))].filter(Boolean);
    // Orden natural: 1,2,3,... y "Todos" primero
    const ordenados = aniosUnicos
      .slice()
      .sort((a, b) => Number(a) - Number(b));
    setAnios(["Todos", ...ordenados]);
    setAnioSel("Todos");
    setAlumnoSel("Todos");
  }, [carreraSel, raw]);

  // Alumnos disponibles según carrera + año
  useEffect(() => {
    if (!carreraSel) {
      setAlumnos([]);
      setAlumnoSel("Todos");
      return;
    }
    const subset = raw.filter(
      (r) =>
        r.carrera === carreraSel &&
        (anioSel === "Todos" || String(r.anio) === String(anioSel))
    );
    const alumnosUnicos = [...new Set(subset.map((d) => d.alumno))].filter(Boolean);
    setAlumnos(["Todos", ...alumnosUnicos]);
    setAlumnoSel("Todos");
  }, [carreraSel, anioSel, raw]);

  // Filtrado jerárquico base (carrera + año)
  const datosFiltrados = useMemo(() => {
    if (!carreraSel) return [];
    return raw.filter(
      (r) =>
        r.carrera === carreraSel &&
        (anioSel === "Todos" || String(r.anio) === String(anioSel))
    );
  }, [raw, carreraSel, anioSel]);

  // --- 1) Serie mensual global (para carrera / carrera+año) ---
  const serieMensual = useMemo(() => {
    if (!datosFiltrados.length) return [];

    const byMonth = new Map(); // key: YYYY-MM -> {total, presentes, label, dateAny}
    for (const r of datosFiltrados) {
      const key = monthKey(r.fecha);
      const curr = byMonth.get(key) || { total: 0, presentes: 0, dateAny: r.fecha };
      curr.total += 1;
      curr.presentes += r.presente ? 1 : 0;
      if (!curr.dateAny) curr.dateAny = r.fecha;
      byMonth.set(key, curr);
    }

    // ordenar por YYYY-MM
    const sortedKeys = [...byMonth.keys()].sort();
    return sortedKeys.map((k) => {
      const v = byMonth.get(k);
      const pct = Math.round((v.presentes / v.total) * 100);
      return {
        key: k,
        mes: monthLabelEs(v.dateAny),
        asistencia: pct,
        date: v.dateAny,
      };
    });
  }, [datosFiltrados]);

  // Regresión & proyección 1 mes: "sin" y "con" apoyo
  const proyecciones = useMemo(() => {
    if (serieMensual.length < 2) return null;

    const xs = serieMensual.map((_, i) => i + 1);
    const ys = serieMensual.map((d) => d.asistencia);
    const { a, b } = linearRegressionXY(xs, ys);

    const lastDate = serieMensual[serieMensual.length - 1].date;
    const nextDate = nextMonth(lastDate);
    const nextLabel = monthLabelEs(nextDate);

    // Sin apoyo: y = a*(n+1)+b
    const yNextSin = CLAMP01(Math.round(a * (xs.length + 1) + b));

    // Con apoyo: pendiente mejorada + bias
    const aCon = a * SUPPORT_SLOPE_FACTOR;
    const yNextCon = CLAMP01(
      Math.round(aCon * (xs.length + 1) + b + SUPPORT_BIAS_POINTS)
    );

    const hist = serieMensual.map((d) => ({ mes: d.mes, asistencia: d.asistencia }));
    const sinApoyo = [...hist, { mes: nextLabel, asistencia: yNextSin, pred: true }];
    const conApoyo = [...hist, { mes: nextLabel, asistencia: yNextCon, pred: true }];

    const delta = yNextCon - yNextSin;

    return {
      sinApoyo,
      conApoyo,
      nextLabel,
      yNextSin,
      yNextCon,
      delta,
      pendiente: a,
    };
  }, [serieMensual]);

  const mensajeTendenciaGlobal = useMemo(() => {
    if (!serieMensual.length) return "—";
    const first = serieMensual[0].asistencia;
    const last = serieMensual[serieMensual.length - 1].asistencia;
    const diff = last - first;
    if (diff > 3) return "📈 Tendencia positiva";
    if (diff < -3) return "📉 Tendencia a la baja";
    return "⚖️ Tendencia estable";
  }, [serieMensual]);

  // --- 2) Ranking por materia (promedio de asistencia actual, sin predicción) ---
  const rankingMaterias = useMemo(() => {
    if (!datosFiltrados.length) return [];
    const byMat = new Map(); // materia -> {total, presentes}
    for (const r of datosFiltrados) {
      if (!r.materia) continue;
      const curr = byMat.get(r.materia) || { total: 0, presentes: 0 };
      curr.total += 1;
      curr.presentes += r.presente ? 1 : 0;
      byMat.set(r.materia, curr);
    }
    const arr = [...byMat.entries()].map(([materia, v]) => ({
      materia,
      asistencia: Math.round((v.presentes / v.total) * 100),
    }));
    // Orden ascendente: materias más críticas primero
    return arr.sort((a, b) => a.asistencia - b.asistencia);
  }, [datosFiltrados]);

  // --- 3) Vista por alumno (tendencia simple) ---
  const datosAlumno = useMemo(() => {
    if (!datosFiltrados.length || alumnoSel === "Todos") return null;
    const sub = datosFiltrados.filter((r) => r.alumno === alumnoSel);
    if (sub.length < 2) return { serie: [], tendencia: "Datos insuficientes" };

    // Serie mensual del alumno
    const byMonth = new Map();
    for (const r of sub) {
      const key = monthKey(r.fecha);
      const curr = byMonth.get(key) || { total: 0, presentes: 0, dateAny: r.fecha };
      curr.total += 1;
      curr.presentes += r.presente ? 1 : 0;
      if (!curr.dateAny) curr.dateAny = r.fecha;
      byMonth.set(key, curr);
    }
    const keys = [...byMonth.keys()].sort();
    const serie = keys.map((k) => {
      const v = byMonth.get(k);
      return {
        mes: monthLabelEs(v.dateAny),
        asistencia: Math.round((v.presentes / v.total) * 100),
      };
    });

    // Tendencia por diferencia simple
    const first = serie[0].asistencia;
    const last = serie[serie.length - 1].asistencia;
    const diff = last - first;
    const tendencia =
      diff > 3 ? "📈 Mejora" : diff < -3 ? "📉 Empeora" : "⚖️ Estable";

    return { serie, tendencia, actual: last };
  }, [datosFiltrados, alumnoSel]);

  return (
    <div className="p-6 mt-20">
      <h1 className="text-2xl font-bold mb-6 text-gray-800 text-center">
        🔮 Predicción de Asistencia — Carrera → Año → Alumno
      </h1>

      {/* Paso 1: Selección de carrera */}
      <div className="flex flex-wrap justify-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Carrera</span>
          <select
            value={carreraSel}
            onChange={(e) => setCarreraSel(e.target.value)}
            className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 shadow-sm"
          >
            <option value="" disabled>
              Selecciona carrera
            </option>
            {carreras.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Paso 2: Año (solo visible si hay carrera) */}
        {carreraSel && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Año</span>
            <select
              value={anioSel}
              onChange={(e) => setAnioSel(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 shadow-sm"
            >
              {anios.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Paso 3: Alumno (solo visible si hay carrera y año seleccionado) */}
        {carreraSel && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Alumno</span>
            <select
              value={alumnoSel}
              onChange={(e) => setAlumnoSel(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2 text-gray-700 shadow-sm"
            >
              {alumnos.map((al) => (
                <option key={al} value={al}>
                  {al}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Gráfico global con y sin apoyo */}
      {!carreraSel ? (
        <p className="text-center text-gray-500">Elegí una carrera para comenzar…</p>
      ) : serieMensual.length < 2 ? (
        <p className="text-center text-gray-500">
          Aún no hay suficientes registros para calcular tendencia (se necesitan al menos 2 meses).
        </p>
      ) : (
        <>
          <div className="bg-white rounded-xl shadow p-6 mb-8">
            <h2 className="text-lg font-semibold mb-4">
              Predicción mensual — {carreraSel}
              {anioSel !== "Todos" ? ` · ${anioSel}º año` : " · Todos los años"}
            </h2>
            <ResponsiveContainer width="100%" height={360}>
              <LineChart data={serieMensual}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                <Tooltip formatter={(v) => `${v}%`} />
                {/* Histórica */}
                <Line
                  type="monotone"
                  dataKey="asistencia"
                  stroke="#3b82f6"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                  name="Asistencia histórica"
                />
              </LineChart>
            </ResponsiveContainer>

            {proyecciones && (
              <div className="mt-6">
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                    <Tooltip formatter={(v) => `${v}%`} />
                    {/* Sin apoyo */}
                    <Line
                      type="monotone"
                      data={proyecciones.sinApoyo}
                      dataKey="asistencia"
                      stroke="#ef4444"
                      strokeWidth={3}
                      strokeDasharray="6 6"
                      dot={{ r: 3 }}
                      name="Predicción sin apoyo institucional"
                    />
                    {/* Con apoyo */}
                    <Line
                      type="monotone"
                      data={proyecciones.conApoyo}
                      dataKey="asistencia"
                      stroke="#22c55e"
                      strokeWidth={3}
                      strokeDasharray="4 4"
                      dot={{ r: 3 }}
                      name="Predicción con apoyo institucional"
                    />
                  </LineChart>
                </ResponsiveContainer>
                <p className="text-center mt-4 text-gray-700 font-medium">
                  {mensajeTendenciaGlobal} · Próximo mes:{" "}
                  <span className="font-semibold text-red-600">
                    {proyecciones.yNextSin}% sin apoyo
                  </span>{" "}
                  vs{" "}
                  <span className="font-semibold text-green-600">
                    {proyecciones.yNextCon}% con apoyo
                  </span>{" "}
                  (mejora estimada: {proyecciones.delta >= 0 ? "+" : ""}
                  {proyecciones.delta} pts).
                </p>
              </div>
            )}
          </div>

          {/* Vista por alumno (opcional, solo tendencia simple) */}
          {alumnoSel !== "Todos" && datosAlumno && (
            <div className="grid grid-cols-1 gap-4">
              <div className="bg-indigo-50 rounded-xl p-5 shadow">
                <h2 className="text-lg font-semibold mb-2">
                  Tendencia individual — {alumnoSel}
                </h2>
                <p className="text-gray-700">
                  Estado: <span className="font-semibold">{datosAlumno.tendencia}</span>{" "}
                  · Asistencia actual:{" "}
                  <span className="font-semibold">{datosAlumno.actual}%</span>
                </p>
                {datosAlumno.serie.length >= 2 && (
                  <div className="mt-4">
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={datosAlumno.serie}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
                        <Tooltip formatter={(v) => `${v}%`} />
                        <Line
                          type="monotone"
                          dataKey="asistencia"
                          stroke="#0ea5e9"
                          strokeWidth={3}
                          dot={{ r: 3 }}
                          name="Asistencia del alumno"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
