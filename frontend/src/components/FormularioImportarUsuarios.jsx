import { useState } from "react";
import axios from "../api/axios";
import { toast } from "react-toastify";

export default function FormularioImportarUsuarios({ onClose, onSuccess }) {
  const [archivo, setArchivo] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [tiposErrores, setTiposErrores] = useState([]);

  const handleFileChange = (e) => {
    setArchivo(e.target.files[0]);
  };

  const analizarErrores = (errores) => {
    const resumen = new Set();

    errores.forEach((e) => {
      const error = e.error.toLowerCase();
      if (error.includes("ya registrados")) resumen.add("❌ Emails o DNIs duplicados");
      else if (error.includes("rol no válido")) resumen.add("❌ Rol inválido");
      else if (error.includes("falta") || error.includes("columnas")) resumen.add("❌ Faltan columnas o datos");
      else if (error.includes("no se permite importar administradores")) resumen.add("❌ No se permite importar administradores");
      else resumen.add("❌ Otros errores");
    });

    return Array.from(resumen);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!archivo) {
      toast.error("Selecciona un archivo primero");
      return;
    }

    const formData = new FormData();
    formData.append("file", archivo);

    try {
      setCargando(true);
      const res = await axios.post("/usuarios/importar_excel", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setResultado(res.data);

      const errores = res.data?.detalle?.errores || [];
      setTiposErrores(analizarErrores(errores));

      if (res.data.total_importados > 0 && errores.length === 0) {
        toast.success("✅ Importación completada sin errores");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        toast.warning("⚠️ Importación completada con advertencias");
      }
    } catch (err) {
      toast.error(err.response?.data?.error || "Error al importar");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md max-h-[80vh] overflow-y-auto">
      <h2 className="text-lg font-bold mb-4">Importar usuarios desde Excel/CSV</h2>

      <form onSubmit={handleSubmit}>
        <input
          type="file"
          accept=".xlsx,.csv"
          onChange={handleFileChange}
          className="mb-4"
        />
        <button
          type="submit"
          disabled={cargando}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {cargando ? "Importando..." : "Importar"}
        </button>
        <button
          type="button"
          onClick={onClose}
          className="ml-2 bg-gray-400 text-white px-4 py-2 rounded-lg"
        >
          Cerrar
        </button>
      </form>

      {resultado && (
        <div className="mt-4">
          <h3 className="font-semibold">Resultado:</h3>
          <p>✅ Total importados: {resultado.total_importados}</p>
          <p>❌ Total errores: {resultado.total_errores}</p>

          {resultado.detalle?.usuarios_procesados?.length > 0 && (
            <div className="mt-2">
              <h4 className="font-semibold">Usuarios importados:</h4>
              <ul className="list-disc pl-6">
                {resultado.detalle.usuarios_procesados.map((u, i) => (
                  <li key={i}>
                    Fila {u.fila}: {u.correo} → {u.estado}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {tiposErrores.length > 0 && (
            <div className="mt-4 text-red-700">
              <h4 className="font-semibold">Tipos de errores detectados:</h4>
              <ul className="list-disc pl-6">
                {tiposErrores.map((tipo, i) => (
                  <li key={i}>{tipo}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
