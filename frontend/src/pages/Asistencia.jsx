import { useEffect, useState } from "react";
import axios from "../api/axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import useAuth from "../hooks/useAuth";

const PALETA = {
  primario: "#237BB2",
  primarioAlt: "#179FCE",
  ok: "#4CAF50",
  peligro: "#FB6362",
};

export default function Asistencia() {
  const { auth } = useAuth();

  const [materias, setMaterias] = useState([]);
  const [materiaId, setMateriaId] = useState("");

  const [resumen, setResumen] = useState({
    presentes: 0,
    tardanza: 0,
    ausentes: 0
  });

  const [presentes, setPresentes] = useState([]);
  const [tardanza, setTardanza] = useState([]);
  const [ausentes, setAusentes] = useState([]);

  // ============================================================
  // OBTENER MATERIAS DEL DOCENTE
  // ============================================================
  useEffect(() => {
    const cargarMaterias = async () => {
      try {
        const res = await axios.get("/materias/docente", {
          headers: { Authorization: `Bearer ${auth?.accessToken}` }
        });
        setMaterias(res.data);
      } catch (error) {
        console.error("Error al obtener materias", error);
      }
    };
    cargarMaterias();
  }, [auth]);

  // ============================================================
  // OBTENER RESUMEN CUANDO CAMBIA LA MATERIA
  // ============================================================
  useEffect(() => {
    if (!materiaId) return;

    const cargarResumen = async () => {
      try {
        const res = await axios.get(`/asistencia/resumen?materia_id=${materiaId}`, {
          headers: {
            Authorization: `Bearer ${auth?.accessToken}`
          }
        });

        setResumen(res.data.resumen);
        setPresentes(res.data.presentes_detalle);
        setTardanza(res.data.tardanza_detalle);
        setAusentes(res.data.ausentes_detalle);

      } catch (error) {
        console.error("Error al obtener resumen:", error);
      }
    };

    cargarResumen();
  }, [materiaId, auth]);

  // ============================================================
  // DATOS PARA EL GRÁFICO
  // ============================================================
  const dataChart = [
    { name: "Presentes", value: resumen.presentes },
    { name: "Tardanza", value: resumen.tardanza },
    { name: "Ausentes", value: resumen.ausentes }
  ];

  return (
    <div className="p-0">

      {/* BARRA SUPERIOR */}
      <div
        className="py-3 px-6 shadow-md flex justify-center items-center text-white"
        style={{
          background: `linear-gradient(90deg, ${PALETA.primario} 0%, ${PALETA.primarioAlt} 100%)`
        }}
      >
        <h1 className="text-2xl font-bold tracking-wide">ASISTENCIA</h1>
      </div>

      <div className="p-6">

        {/* SELECTOR DE MATERIAS */}
        <div className="mb-6">
          <label className="font-bold mr-3">Seleccionar materia:</label>
          <select
            value={materiaId}
            onChange={(e) => setMateriaId(e.target.value)}
            className="border px-3 py-2 rounded"
          >
            <option value="">-- Elegir materia --</option>
            {materias.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nombre} ({m.curso})
              </option>
            ))}
          </select>
        </div>

        {/* Si aún no eligió materia */}
        {!materiaId && (
          <p className="text-gray-600">Seleccione una materia para ver asistencia.</p>
        )}

        {materiaId && (
          <>

            {/* TARJETAS RESUMEN */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-100 text-green-800 p-4 rounded-lg text-center shadow">
                <h2 className="text-2xl font-bold">{resumen.presentes}</h2>
                <p>Presentes</p>
              </div>

              <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg text-center shadow">
                <h2 className="text-2xl font-bold">{resumen.tardanza}</h2>
                <p>Tardanza</p>
              </div>

              <div className="bg-red-100 text-red-800 p-4 rounded-lg text-center shadow">
                <h2 className="text-2xl font-bold">{resumen.ausentes}</h2>
                <p>Ausentes</p>
              </div>
            </div>

            {/* GRÁFICO (NO SE BORRÓ NADA) */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Resumen gráfico</h2>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={dataChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill={PALETA.primario} radius={[5, 5, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* LISTAS DETALLADAS */}

            {/* PRESENTES */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Presentes</h2>
              {presentes.length > 0 ? (
                <ul className="list-disc pl-6">
                  {presentes.map((p, idx) => (
                    <li key={idx}>
                      {p.nombre} {p.apellido} — {p.fecha} {p.hora}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Nadie presente.</p>
              )}
            </div>

            {/* TARDANZA */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Tardanza</h2>
              {tardanza.length > 0 ? (
                <ul className="list-disc pl-6">
                  {tardanza.map((p, idx) => (
                    <li key={idx}>
                      {p.nombre} {p.apellido} — {p.fecha} {p.hora}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Sin tardanza.</p>
              )}
            </div>

            {/* AUSENTES */}
            <div className="mt-6 bg-white p-4 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-4">Ausentes</h2>
              {ausentes.length > 0 ? (
                <ul className="list-disc pl-6">
                  {ausentes.map((p, idx) => (
                    <li key={idx}>
                      {p.nombre} {p.apellido} — {p.fecha} {p.hora}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">Sin ausentes.</p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
