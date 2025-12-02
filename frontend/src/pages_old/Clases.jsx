
import { useEffect, useState } from "react";
import useAuth from "../hooks/useAuth";
import axios from "../api/axios";
import { format } from "date-fns";
import QRCode from "react-qr-code";

const Clases = () => {
  const { auth } = useAuth();
  const [clases, setClases] = useState([]);
  const [error, setError] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [qrToken, setQrToken] = useState("");
  const [claseQR, setClaseQR] = useState(null);

  const fetchClases = async () => {
    try {
      const res = await axios.get("/clases/", {
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
      });
      setClases(res.data);
    } catch (err) {
      setError("No se pudieron cargar las clases.");
      console.error(err);
    }
  };

  useEffect(() => {
    fetchClases();
  }, [auth]);

  const generarQR = async (clase) => {
    try {
      const res = await axios.get(`/clases/generar_qr/${clase.id}`, {
        headers: { Authorization: `Bearer ${auth?.accessToken}` },
      });
      setQrToken(res.data.token);
      setClaseQR(clase);
    } catch (err) {
      console.error(err);
      alert("Error al generar el código QR");
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl text-center font-bold mb-4 pb-2 w-fit mx-auto" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.5)' }}>
        Gestión de Clases
      </h1>

      {auth?.rol === "docente" && (
        <button onClick={() => setMostrarModal(true)} className="text-white px-4 py-2 rounded transition hover:bg-[#147BB2]" style={{ backgroundColor: '#179FCE' }}>
          Crear Clase
        </button>
      )}

      {error && <p className="text-red-500 mt-2">{error}</p>}

      <div className="overflow-x-auto mt-6 shadow-lg border border-black">
        <table className="min-w-full bg-white text-lg">
          <thead>
            <tr className="bg-[#237BB2]/85 text-white text-center text-lg font-semibold border-b-2 border-black">
              <th className="p-4 border-r border-black">Materia</th>
              <th className="p-4 border-r border-black">Curso</th>
              <th className="p-4 border-r border-black">Fecha</th>
              <th className="p-4 border-r border-black">Hora Inicio</th>
              <th className="p-4 border-r border-black">Hora Fin</th>
              <th className="p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black">
            {clases.length === 0 ? (
              <tr>
                <td className="p-6 text-center text-gray-500" colSpan="6">No hay clases registradas.</td>
              </tr>
            ) : (
              clases.map((clase, index) => (
                <tr key={clase.id} className={`${index % 2 === 0 ? "bg-gray-50" : "bg-f9f8fe"} border-b border-white`}>
                  <td className="p-4 text-center border-r border-black">{clase.materia?.nombre || "Sin nombre"}</td>
                  <td className="p-4 text-center border-r border-black">{clase.curso?.nombre || "Sin curso"}</td>
                  <td className="p-4 text-center border-r border-black">{format(new Date(clase.fecha), "dd/MM/yyyy")}</td>
                  <td className="p-4 text-center border-r border-black">{clase.hora_inicio}</td>
                  <td className="p-4 text-center border-r border-black">{clase.hora_fin}</td>
                  <td className="p-4 text-center flex justify-center">
                    {auth?.rol === "docente" && clase.docente_id === auth.docente_id && (
                      <button onClick={() => generarQR(clase)} className="bg-[#375982] text-white px-3 py-1 rounded text-lg hover:bg-[#2c4668] transition">
                        Generar QR
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {mostrarModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl text-center font-semibold mb-4 pb-2 w-fit mx-auto" style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.5)' }}>
              Nueva Clase
            </h2>
            <FormularioClase onClose={() => {
              setMostrarModal(false);
              fetchClases();
            }} />
          </div>
        </div>
      )}

      {qrToken && claseQR && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 z-50">
          <div className="bg-white p-6 rounded-lg max-w-md text-center">
            <h2 className="text-xl font-semibold mb-4">Código QR para: {claseQR.materia?.nombre}</h2>
            <p className="mb-2 text-sm text-gray-600">
              Clase del {format(new Date(claseQR.fecha), "dd/MM/yyyy")} - {claseQR.hora_inicio}
            </p>
            <div className="flex justify-center mb-4 bg-white p-4">
              <QRCode value={qrToken} size={200} />
            </div>
            <button onClick={() => { setQrToken(""); setClaseQR(null); }} className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const FormularioClase = ({ onClose }) => {
  const { auth } = useAuth();
  const [materias, setMaterias] = useState([]);
  const [materiaId, setMateriaId] = useState("");
  const [fecha, setFecha] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFin, setHoraFin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const cargarMaterias = async () => {
      try {
        const res = await axios.get("/materias/docente");
        setMaterias(res.data);
      } catch (err) {
        console.error(err);
        setError("No se pudieron cargar las materias.");
      }
    };
    cargarMaterias();
  }, [auth]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/clases/", {
        materia_id: parseInt(materiaId),
        fecha,
        hora_inicio: horaInicio,
        hora_fin: horaFin,
      });
      setMateriaId("");
      setFecha("");
      setHoraInicio("");
      setHoraFin("");
      onClose();
    } catch (err) {
      console.error("Error al crear clase:", err);
      setError("Error al crear la clase. Verificá los campos.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-red-500">{error}</p>}

      <div>
        <label className="block text-sm font-medium">Materia</label>
        <select value={materiaId} onChange={(e) => setMateriaId(e.target.value)} className="w-full border px-3 py-2 rounded bg-gray-100" required>
          <option value="">Seleccionar materia</option>
          {materias.map((m) => (
            <option key={m.id} value={m.id}>{m.nombre} - {m.curso?.nombre}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Fecha</label>
        <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} className="w-full border px-3 py-2 rounded bg-gray-100" required />
      </div>

      <div>
        <label className="block text-sm font-medium">Hora de Inicio</label>
        <input type="time" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)} className="w-full border px-3 py-2 rounded bg-gray-100" required />
      </div>

      <div>
        <label className="block text-sm font-medium">Hora de Fin</label>
        <input type="time" value={horaFin} onChange={(e) => setHoraFin(e.target.value)} className="w-full border px-3 py-2 rounded bg-gray-100" required />
      </div>

      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onClose} className="px-4 py-2 bg-[#4A90E2] text-white rounded hover:bg-[#357ABD]">Cancelar</button>
        <button type="submit" className="px-4 py-2 bg-[#4CAF50] text-white rounded hover:bg-[#388E3C]">Guardar</button>
      </div>
    </form>
  );
};

export default Clases;
