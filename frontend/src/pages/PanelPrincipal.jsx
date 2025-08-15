
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";

export default function PanelPrincipal() {
  const [rol, setRol] = useState("");
  const [nombre, setNombre] = useState("");

  useEffect(() => {
    const storedRol = localStorage.getItem("rol");
    const storedNombre = localStorage.getItem("nombre");
    setRol(storedRol);
    setNombre(storedNombre);
  }, []);

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-50 to-gray-200">
      <Navbar />
      <div className="flex-grow flex items-center justify-center p-4">
        <div className="bg-white shadow-lg rounded-2xl p-12 max-w-xl w-full text-center border-2 border-gray-700">
          <h1 className="text-4xl font-bold mb-4 text-blue-700">

            ¡Bienvenido, {nombre || "usuario"}!
          </h1>
          <p className="text-gray-700 mb-2">Seleccioná una opción del menú para comenzar.</p>

          {rol === "estudiante" && (
            <>
              <p className="text-base text-gray-600 mb-2">
                Estás logueado como <strong>estudiante</strong>. Podés ver tus materias y registrar asistencia por QR.
              </p>
              <Link
                to="/escaneo"
                className="inline-block bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition text-xl"
                
              >
                Escanear código QR
              </Link>
            </>
          )}
          {rol === "docente" && (
            <p className="text-base text-gray-600 mb-2">
              Estás logueado como <strong>docente</strong>. Podés crear clases y registrar asistencias.
            </p>
          )}
          {rol === "administrador" && (
            <p className="text-base text-gray-600 mb-2">
              Estás logueado como <strong>administrador</strong>. Podés gestionar usuarios, materias y ver reportes.
            </p>
          )}
          {!rol && <p className="text-lg">No se detectó rol en la sesión.</p>}
          
        </div>
      </div>
    </div>
  );
}
