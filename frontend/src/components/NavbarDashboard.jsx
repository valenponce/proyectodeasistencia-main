/*
// --- NavbarDashboard.jsx ---
export default function NavbarDashboard({ onChangeView, activeView }) {
  return (
    <nav className="bg-white shadow-md fixed top-0 left-0 w-full z-10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        {/* 🔹 Logo o título }
        <h1 className="text-xl font-bold text-indigo-600">
          Sistema de Asistencia IES N°6
        </h1>

        {/* 🔹 Botones }
        <div className="space-x-4">
          <button
            onClick={() => onChangeView("reportes")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeView === "reportes"
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:text-indigo-600"
            }`}
          >
            Reportes
          </button>

          <button
            onClick={() => onChangeView("prediccion")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeView === "prediccion"
                ? "bg-indigo-600 text-white"
                : "text-gray-600 hover:text-indigo-600"
            }`}
          >
            Predicción
          </button>

          <button className="border border-gray-300 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100">
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
}*/

export default function NavbarDashboard({ onChangeView, activeView }) {
  return (
    <nav className="bg-blue-600 shadow-md fixed top-0 left-0 w-full z-10">
      <div className="max-w-7xl mx-auto px-4 py-3 flex justify-between items-center">
        <h1 className="text-xl font-bold text-white">
          Sistema de Asistencia IES N°6
        </h1>

        <div className="space-x-4">
          <button
            onClick={() => onChangeView("reportes")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeView === "reportes"
                ? "bg-white text-blue-600"
                : "text-white hover:bg-blue-500"
            }`}
          >
            Reportes
          </button>

          <button
            onClick={() => onChangeView("prediccion")}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              activeView === "prediccion"
                ? "bg-white text-blue-600"
                : "text-white hover:bg-blue-500"
            }`}
          >
            Predicción
          </button>

          <button className="border border-white text-white px-3 py-2 rounded-lg hover:bg-blue-500">
            Cerrar sesión
          </button>
        </div>
      </div>
    </nav>
  );
}

