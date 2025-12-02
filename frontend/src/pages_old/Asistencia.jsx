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
  foco: "#122847",
  ok: "#4CAF50",
  peligro: "#FB6362",
  editar: "rgba(230, 159, 78, 0.89)",
};

function Asistencia() {
  const { auth } = useAuth();
  const [resumen, setResumen] = useState({
    presentes: 0,
    ausentes: 0,
    tardanza: 0
  });
  const [presentesLista, setPresentesLista] = useState([]);

  useEffect(() => {
    const fetchAsistencia = async () => {
      try {
        const res = await axios.get("/asistencia/resumen", {
          headers: {
            Authorization: `Bearer ${auth?.accessToken}`
          }
        });
        setResumen(res.data.resumen || {});
        setPresentesLista(res.data.presentes || []);
      } catch (error) {
        console.error("Error al obtener asistencia:", error);
      }
    };

    fetchAsistencia();
  }, [auth]);

  const dataChart = [
    { name: "Presentes", value: resumen.presentes },
    { name: "Ausentes", value: resumen.ausentes },
    { name: "Tardanza", value: resumen.tardanza }
  ];

  return (
    <div className="p-0">
      {/* Barra superior con gradiente y estilo del primer código */}
      <div
        className="py-3 px-6 shadow-md flex justify-center items-center text-white"
        style={{
          background: `linear-gradient(90deg, ${PALETA.primario} 0%, ${PALETA.primarioAlt} 100%)`
        }}
      >
        <h1 className="text-2xl font-bold tracking-wide">
          ASISTENCIA
        </h1>
      </div>

      <div className="p-6">
        {/* Resumen */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-green-100 text-green-800 p-4 rounded-lg text-center shadow">
            <h2 className="text-2xl font-bold">{resumen.presentes}</h2>
            <p>Presentes</p>
          </div>
          <div className="bg-red-100 text-red-800 p-4 rounded-lg text-center shadow">
            <h2 className="text-2xl font-bold">{resumen.ausentes}</h2>
            <p>Ausentes</p>
          </div>
          <div className="bg-yellow-100 text-yellow-800 p-4 rounded-lg text-center shadow">
            <h2 className="text-2xl font-bold">{resumen.tardanza}</h2>
            <p>Tardanza</p>
          </div>
        </div>

        {/* Gráfico */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Resumen de Asistencia</h2>
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

        {/* Lista de presentes */}
        <div className="mt-6 bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Lista de Presentes</h2>
          {presentesLista.length > 0 ? (
            <ul className="list-disc pl-6">
              {presentesLista.map((nombre, idx) => (
                <li key={idx}>{nombre}</li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">No hay presentes registrados.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default Asistencia;
