
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import { FaEye, FaEyeSlash } from "react-icons/fa";

export default function Registro() {
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [rol, setRol] = useState("");
  const [carrera, setCarrera] = useState("");
  const [mostrarPassword, setMostrarPassword] = useState(false);
  const [mostrarConfirmPassword, setMostrarConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [id, setId] = useState("");
  const navigate = useNavigate();

  const carreras = ["Ingeniería", "Medicina", "Derecho", "Arquitectura", "Psicología"];

  const toggleMostrarPassword = () => setMostrarPassword((prev) => !prev);
  const toggleMostrarConfirmPassword = () => setMostrarConfirmPassword((prev) => !prev);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    try {
      await axios.post("/auth/registro", {
        id,
        nombre,
        email,
        password,
        rol,
        carrera: rol === "estudiante" ? carrera : null,
      });
      navigate("/login"); 
    } catch (err) {
      const msg = err?.response?.data?.error || "Error al registrarse";
      setError(msg);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/fondo.png')] bg-cover bg-center p-6 font-inter">
      <div className="bg-white/90 rounded-2xl shadow-xl p-10 w-full max-w-3xl border-2 border-gray-700">
        <h2
          className="text-3xl text-center font-bold mb-6 pb-2 w-fit mx-auto text-[#020649]"
          style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.5)" }}
        >
          Crear Cuenta
        </h2>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* ID */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">ID</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#122847] hover:border-[#122847] transition"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="1346"
            />
          </div>

          {/* Nombre */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Nombre completo</label>
            <input
              type="text"
              className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#122847] hover:border-[#122847] transition"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Juan Pérez"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#122847] hover:border-[#122847] transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              required
            />
          </div>

          {/* Contraseña */}
          <div className="relative">
            <label className="block text-lg font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type={mostrarPassword ? "text" : "password"}
              className="w-full px-4 py-3 pr-10 bg-gray-100 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#122847] hover:border-[#122847] transition"
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

          {/* Confirmar Contraseña */}
          <div className="relative">
            <label className="block text-lg font-medium text-gray-700 mb-1">Confirmar contraseña</label>
            <input
              type={mostrarConfirmPassword ? "text" : "password"}
              className="w-full px-4 py-3 pr-10 bg-gray-100 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#122847] hover:border-[#122847] transition"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="********"
              required
            />
            <button
              type="button"
              onClick={toggleMostrarConfirmPassword}
              style={{ top: "70%" }}
              className="absolute right-3 transform -translate-y-1/2 text-gray-600 hover:text-[#122847] focus:outline-none flex items-center justify-center h-full"
              aria-label={mostrarConfirmPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {mostrarConfirmPassword ? <FaEyeSlash size={24} /> : <FaEye size={24} />}
            </button>
          </div>

          {/* Rol */}
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">Rol</label>
            <select
              className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#122847] hover:border-[#122847] transition"
              value={rol}
              onChange={(e) => setRol(e.target.value)}
              required
            >
              <option value="">Seleccionar rol</option>
              <option value="estudiante">Estudiante</option>
              <option value="docente">Docente</option>
              <option value="administrador">Administrador</option>
            </select>
          </div>

          {/* Carrera solo si es estudiante */}
          {rol === "estudiante" && (
            <div>
              <label className="block text-lg font-medium text-gray-700 mb-1">Carrera</label>
              <select
                className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#122847] hover:border-[#122847] transition"
                value={carrera}
                onChange={(e) => setCarrera(e.target.value)}
                required
              >
                <option value="">Selecciona una carrera</option>
                {carreras.map((c, i) => (
                  <option key={i} value={c}>{c}</option>
                ))}
              </select>
            </div>
          )}
        </form>

        {error && <p className="text-red-500 text-lg text-center mt-4">{error}</p>}

        <button
          type="submit"
          onClick={handleSubmit}
          className="mt-6 w-48 mx-auto block bg-[#06A1B1] text-lg text-white py-3 rounded-xl hover:bg-[#05919f] transition duration-200 font-semibold"
          
        >
          Registrarse
        </button>
      </div>
    </div>
  );
}
