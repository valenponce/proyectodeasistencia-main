import Navbar from "../components/Navbar";
import useAuth from "../hooks/useAuth";

export default function PanelPrincipal() {
  const { auth } = useAuth();
  const rol = auth?.rol;
  const nombre = auth?.nombre;

  return (
    <>
      <Navbar />
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white shadow-lg rounded-2xl p-8 max-w-xl w-full text-center">
          <h1 className="text-3xl font-bold mb-2 text-blue-700">
            ¡Bienvenido, {nombre || "usuario"}!
          </h1>
          <p className="text-gray-700 mb-6">Seleccioná una opción del menú para comenzar.</p>

          {rol === "estudiante" && (
            <p className="text-sm text-gray-600">
              Estás logueado como <strong>estudiante</strong>. Podés ver tus materias y registrar asistencia por QR.
            </p>
          )}
          {rol === "docente" && (
            <p className="text-sm text-gray-600">
              Estás logueado como <strong>docente</strong>. Podés crear clases y registrar asistencias.
            </p>
          )}
          {rol === "administrador" && (
            <p className="text-sm text-gray-600">
              Estás logueado como <strong>administrador</strong>. Podés gestionar usuarios, materias y ver reportes.
            </p>
          )}
          {!rol && <p>No se detectó rol en la sesión.</p>}

          <button
            onClick={() => {
              localStorage.clear();
              window.location.href = "/";
            }}
            className="mt-6 bg-red-600 text-white px-4 py-2 rounded-xl hover:bg-red-700 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </>
  );
}
