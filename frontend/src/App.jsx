import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import PanelPrincipal from "./pages/PanelPrincipal";
import RutaPrivada from "./components/RutaPrivada";
import Materias from "./pages/Materias";
import Usuarios from "./pages/Usuarios";
import Reportes from "./pages/Reportes";
import Prediccion from "./pages/Prediccion";
import Clases from "./pages/Clases";
import Asistencia from "./pages/Asistencia";
import Historial from "./pages/Historial";
import EscaneoQR from "./pages/EscaneoQR";
import OlvidePassword from "./pages/OlvidePassword";
import Registro from "./pages/Registro";

import Chatbot from "./components/Chatbot";        // ✅ CORREGIDO
import useAuth from "./hooks/useAuth";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const { auth } = useAuth();

  return (
    <Router>

      {/* ⬇️ Chatbot SOLO si hay sesión */}
      {auth?.rol && <Chatbot />}

      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/olvide-password" element={<OlvidePassword />} />
        <Route path="/registro" element={<Registro />} />

        <Route
          path="/panel"
          element={
            <RutaPrivada>
              <PanelPrincipal />
            </RutaPrivada>
          }
        />

        <Route
          path="/materias"
          element={
            <RutaPrivada>
              <Materias />
            </RutaPrivada>
          }
        />

        <Route
          path="/usuarios"
          element={
            <RutaPrivada>
              <Usuarios />
            </RutaPrivada>
          }
        />

        <Route
          path="/reportes"
          element={
            <RutaPrivada>
              <Reportes />
            </RutaPrivada>
          }
        />

        <Route
          path="/prediccion"
          element={
            <RutaPrivada>
              <Prediccion />
            </RutaPrivada>
          }
        />

        <Route
          path="/clases"
          element={
            <RutaPrivada>
              <Clases />
            </RutaPrivada>
          }
        />

        <Route
          path="/asistencia"
          element={
            <RutaPrivada>
              <Asistencia />
            </RutaPrivada>
          }
        />

        <Route
          path="/historial"
          element={
            <RutaPrivada>
              <Historial />
            </RutaPrivada>
          }
        />

        <Route
          path="/escaneo"
          element={
            <RutaPrivada>
              <EscaneoQR />
            </RutaPrivada>
          }
        />

      </Routes>

      <ToastContainer
        position="top-right"
        autoClose={3000}
      />
    </Router>
  );
}

export default App;
