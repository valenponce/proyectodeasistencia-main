
import { useEffect, useState } from "react";

function Historial() {
  const [historial, setHistorial] = useState({});
  const [modoSeleccion, setModoSeleccion] = useState({});
  const [seleccionados, setSeleccionados] = useState({});
  const [historialOriginal, setHistorialOriginal] = useState({});
  const [confirmacion, setConfirmacion] = useState(null);

  useEffect(() => {
    const data = JSON.parse(localStorage.getItem("historialQR")) || [];
    const agrupado = data.reduce((acc, item) => {
      const fechaSolo = item.fecha?.split(" ")[0] || "00/00/0000";
      if (!acc[fechaSolo]) acc[fechaSolo] = [];
      acc[fechaSolo].push(item);
      return acc;
    }, {});
    setHistorial(agrupado);
  }, []);

  const formatearFecha = (fechaStr) => {
    const partes = fechaStr.split("/");
    if (partes.length !== 3) return fechaStr;
    const dia = partes[0].padStart(2, "0");
    const mes = partes[1].padStart(2, "0");
    const año = partes[2];
    return `${dia}/${mes}/${año}`;
  };

  const toggleModoSeleccion = (fecha) => {
    if (!modoSeleccion[fecha]) {
      setHistorialOriginal(JSON.parse(JSON.stringify(historial)));
      setModoSeleccion(prev => ({ ...prev, [fecha]: true }));
      setSeleccionados(prev => ({ ...prev, [fecha]: [] }));
    } else {
      setHistorial(historialOriginal);
      setModoSeleccion(prev => ({ ...prev, [fecha]: false }));
      setSeleccionados(prev => ({ ...prev, [fecha]: [] }));
    }
  };

  const toggleSeleccion = (fecha, index) => {
    setSeleccionados(prev => {
      const lista = prev[fecha] || [];
      return {
        ...prev,
        [fecha]: lista.includes(index)
          ? lista.filter(i => i !== index)
          : [...lista, index]
      };
    });
  };

  const pedirConfirmacion = (fecha) => {
    setConfirmacion(fecha);
  };

  const borrarSeleccionados = () => {
    const fecha = confirmacion;
    if (!seleccionados[fecha] || seleccionados[fecha].length === 0) return;

    const nuevosRegistros = historial[fecha].filter(
      (_, i) => !seleccionados[fecha].includes(i)
    );

    const nuevoHistorial = { ...historial };
    if (nuevosRegistros.length > 0) {
      nuevoHistorial[fecha] = nuevosRegistros;
    } else {
      delete nuevoHistorial[fecha];
    }

    setHistorial(nuevoHistorial);

    const listaPlana = Object.entries(nuevoHistorial).flatMap(([f, registros]) =>
      registros.map(r => ({ ...r, fecha: r.fecha || f }))
    );
    localStorage.setItem("historialQR", JSON.stringify(listaPlana));

    setModoSeleccion(prev => ({ ...prev, [fecha]: false }));
    setSeleccionados(prev => ({ ...prev, [fecha]: [] }));
    setConfirmacion(null);
  };

  
  const estadoAsistencia = (horaEsperada, horaRegistro, estadoJustificacion) => {
    if (estadoJustificacion === "justificado") return "justificado";
    if (!horaRegistro) return "falta";

    const parsearMinutos = (horaStr) => {
      const [h, m] = horaStr.split(":").map(Number);
      return h * 60 + m;
    };

    const minutosEsperados = parsearMinutos(horaEsperada);
    const minutosRegistro = parsearMinutos(horaRegistro);

    if (minutosRegistro <= minutosEsperados + 5) return "tiempo";
    if (minutosRegistro > minutosEsperados + 5) return "tardanza";

    return "falta";
  };

  
  const fechasOrdenadas = Object.keys(historial).sort((a, b) => {
    const [dA, mA, yA] = a.split("/");
    const [dB, mB, yB] = b.split("/");
    return new Date(yB, mB - 1, dB) - new Date(yA, mA - 1, dA);
  });

  return (
    <div className="p-6">
      <h1
        className="text-3xl text-center font-bold mb-4 pb-2 w-fit mx-auto"
        style={{ borderBottom: '1px solid rgba(0, 0, 0, 0.5)' }}
      >
        Bitácora de Asistencia
      </h1>

      {confirmacion && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50" style={{ zIndex: 1000 }}>
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <p className="mb-4">¿Seguro que deseas borrar los registros seleccionados?</p>
            <div className="flex justify-center gap-4">
              <button
                onClick={borrarSeleccionados}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Sí, borrar
              </button>
              <button
                onClick={() => {
                  toggleModoSeleccion(confirmacion);
                  setConfirmacion(null);
                }}
                className="px-4 py-2 bg-[#4A90E2] text-white rounded hover:bg-[#357ABD]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

    
      {fechasOrdenadas.length === 0 ? (
        <p className="text-center text-lg text-blue-600">No hay registros aún.</p>
      ) : (
        fechasOrdenadas.map((fecha) => {
          const registros = historial[fecha];
          return (
            <div key={fecha} className="mb-6 bg-white rounded-lg shadow p-4 border border-black">
              <div className="flex justify-between items-center border-b pb-2 mb-3 border-black">
                <h2 className="text-lg font-semibold" style={{ color: "#122847" }}>
                  {formatearFecha(fecha)}
                </h2>
                <div className="flex gap-2">
                  {modoSeleccion[fecha] ? (
                    <button
                      onClick={() => pedirConfirmacion(fecha)}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Borrar
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleModoSeleccion(fecha)}
                      className="text-white px-4 py-2 rounded transition"
                      style={{ backgroundColor: 'rgba(6, 161, 177, 0.85)' }}
                      onMouseEnter={e => e.currentTarget.style.backgroundColor = 'rgba(6, 161, 177, 1)'}
                      onMouseLeave={e => e.currentTarget.style.backgroundColor = 'rgba(6, 161, 177, 0.85)'}
                    >
                      Seleccionar
                    </button>
                  )}
                </div>
              </div>

              <ul className="space-y-2">
                {registros.map((item, i) => {

                  const estaSeleccionado = modoSeleccion[fecha] && seleccionados[fecha]?.includes(i);

                  return (
                    <li
                      key={i}
                      className="relative text-lg text-gray-700 flex items-center justify-between p-2 rounded-lg"
                      style={{ borderRadius: 0 }} 
                    >
                      {estaSeleccionado && (
                        <div
                          style={{
                            position: 'absolute',
                            top: 0, left: 0, right: 0, bottom: 0,
                            backgroundColor: 'rgba(128, 128, 128, 0.3)',
                            borderRadius: '0',
                            pointerEvents: 'none',
                            zIndex: 1
                          }}
                        />
                      )}

                      {modoSeleccion[fecha] && (
                        <input
                          type="checkbox"
                          className="mr-2 relative z-20"
                          checked={seleccionados[fecha]?.includes(i) || false}
                          onChange={() => toggleSeleccion(fecha, i)}
                        />
                      )}
                      <span className="text-lg relative z-10" style={{ color: "#122847" }}>
                        {item.materia || "Materia desconocida"}
                      </span>
                      <span className="text-lg relative z-10" style={{ color: "#122847" }}>
                        {item.hora || "Hora desconocida"}
                      </span>
                      <span className="text-lg relative z-10" style={{ color: "#122847" }}>
                        {item.metodo || "Método desconocida"}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })
      )}
    </div>
  );
}

export default Historial;
