

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import axios from "../api/axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const navigate = useNavigate();
  const { setAuth } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await axios.post("/auth/login", {
        email,
        password,
      });

      const data = response.data;
      const { access_token, identity } = data;

      setAuth({
        id: identity.id,
        docente_id: identity.docente_id,
        rol: identity.rol,
        nombre: identity.nombre,
        accessToken: access_token,
      });

      localStorage.setItem("token", access_token);
      localStorage.setItem("rol", identity.rol);
      localStorage.setItem("usuario_id", identity.id);
      localStorage.setItem("nombre", identity.nombre);
      localStorage.setItem("docente_id", identity.docente_id);

      navigate("/panel");
    } catch (err) {
      const msg = err?.response?.data?.error || "Error de conexión con el servidor";
      setError(msg);
    }
  };

  const toggleMostrarPassword = () => {
    setMostrarPassword((prev) => !prev);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/fondo.png')] bg-cover bg-center p-6 font-inter">
      <div className="bg-white/90 rounded-2xl shadow-xl p-10 w-full max-w-md border-2 border-gray-700">
        <h2
          className="text-3xl text-center font-bold mb-4 pb-2 w-fit mx-auto text-[#020649]"
          style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.5)" }}
        >
          Iniciar Sesión
        </h2>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-gray-100 border-[1px] border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#122847] hover:border-[#122847] transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              required
            />
          </div>
          <div className="relative">
            <label className="block text-lg font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type={mostrarPassword ? "text" : "password"}
              className="w-full px-4 py-3 pr-10 bg-gray-100 border-[1px] border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#122847] hover:border-[#122847] transition"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="********"
              required
            />
            <button
              type="button"
              onClick={toggleMostrarPassword}
              style={{ top: "70%" }}
              className="absolute right-3 transform -translate-y-1/2 text-gray-600 hover:text-[#122847] focus:outline-none flex items-center justify-center h-full"
              aria-label={mostrarPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {mostrarPassword ? <FaEyeSlash size={24} /> : <FaEye size={24} />}
            </button>
          </div>
          {error && <p className="text-red-500 text-lg text-center">{error}</p>}
          <button
            type="submit"
            className="w-full bg-[#06A1B1] text-lg text-white py-3 rounded-xl hover:bg-[#05919f] transition duration-200 font-semibold"
          >
            Ingresar
          </button>
        </form>

        {/* Enlaces alineados izquierda y derecha */}
        <div className="mt-4 flex justify-between text-sm">
          <Link to="/olvide-password" className="text-[#122847] hover:underline">
            ¿Olvidaste tu contraseña?
          </Link>
          <p className="text-gray-700">
            ¿Eres nuevo?{" "}
            <Link to="/registro" className="text-[#06A1B1] font-semibold hover:underline">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}


