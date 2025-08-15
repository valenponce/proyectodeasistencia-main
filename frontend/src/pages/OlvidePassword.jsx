import { useState } from "react";
import { Link } from "react-router-dom";
import axios from "../api/axios";

export default function OlvidePassword() {
  const [email, setEmail] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensaje("");
    setError("");
    setCargando(true);

    try {
      const response = await axios.post("/auth/olvide-password", { email });
      setMensaje(response.data?.mensaje || "Hemos enviado instrucciones a tu correo.");
    } catch (err) {
      const msg = err?.response?.data?.error || "Error de conexión con el servidor";
      setError(msg);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/fondo.png')] bg-cover bg-center p-6 font-inter">
      <div className="bg-white/90 rounded-2xl shadow-xl p-10 w-full max-w-md border-2 border-gray-700">
        <h2
          className="text-3xl text-center font-bold mb-4 pb-2 w-fit mx-auto text-[#020649]"
          style={{ borderBottom: "1px solid rgba(0, 0, 0, 0.5)" }}
        >
          Recuperar Contraseña
        </h2>
        <p className="text-gray-600 text-center mb-6">
          Ingresa tu correo electrónico para enviarte las instrucciones.
        </p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-lg font-medium text-gray-700 mb-1">
              Correo electrónico
            </label>
            <input
              type="email"
              className="w-full px-4 py-3 bg-gray-100 border-[1px] border-gray-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#122847] hover:border-[#122847] transition"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="ejemplo@correo.com"
              required
            />
          </div>

          {mensaje && <p className="text-green-600 text-lg text-center">{mensaje}</p>}
          {error && <p className="text-red-500 text-lg text-center">{error}</p>}

          <button
            type="submit"
            className="w-full bg-[#06A1B1] text-lg text-white py-3 rounded-xl hover:bg-[#05919f] transition duration-200 font-semibold"
            disabled={cargando}
          >
            {cargando ? "Enviando..." : "Enviar instrucciones"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          <Link to="/login" className="text-[#122847] hover:underline">
            ← Volver al inicio de sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
