import { useState, useEffect, useRef } from "react";
import axios from "../api/axios";
import useAuth from "../hooks/useAuth";

export default function ChatBot() {
  const { auth } = useAuth();
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState([]);
  const [entrada, setEntrada] = useState("");
  const chatRef = useRef(null);

  // Enviar mensaje al backend
  const enviarMensaje = async () => {
    if (!entrada.trim()) return;

    const mensajeUsuario = { emisor: "yo", texto: entrada };
    setMensajes((prev) => [...prev, mensajeUsuario]);

    const temp = entrada;
    setEntrada("");

    try {
      const res = await axios.post(
        "/chatbot/mensaje",
        { mensaje: temp },
        { headers: { Authorization: `Bearer ${auth?.accessToken}` } }
      );

      setMensajes((prev) => [
        ...prev,
        { emisor: "bot", texto: res.data.respuesta },
      ]);
    } catch (error) {
      setMensajes((prev) => [
        ...prev,
        { emisor: "bot", texto: "⚠️ No pude procesar tu mensaje." },
      ]);
    }
  };

  // Saludo inicial al abrir
  useEffect(() => {
    if (abierto) {
      setMensajes([
        {
          emisor: "bot",
          texto: `👋 Hola ${auth?.rol}, ¿en qué puedo ayudarte hoy?`,
        },
      ]);
    }
  }, [abierto]);

  // Scroll automático
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [mensajes]);

  return (
    <>
      {/* BOTÓN FLOTANTE — SIEMPRE VISIBLE */}
      <button
        onClick={() => setAbierto(!abierto)}
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl transition transform hover:scale-110"
        style={{ zIndex: 9999 }}
      >
        {abierto ? "❌" : "💬"}
      </button>

      {/* CHAT FLOTANTE */}
      {abierto && (
        <div
          className="fixed bottom-24 right-6 w-80 max-w-[90vw] bg-[#0d1117] text-white rounded-xl shadow-2xl flex flex-col border border-gray-700 transition-all scale-100 opacity-100"
          style={{ zIndex: 9999 }}
        >
          {/* HEADER */}
          <div className="px-4 py-3 border-b border-gray-700 bg-[#161b22] rounded-t-xl">
            <h2 className="font-semibold">Asistente Virtual</h2>
          </div>

          {/* MENSAJES */}
          <div
            ref={chatRef}
            className="h-80 overflow-y-auto px-4 py-3 space-y-2"
          >
            {mensajes.map((m, i) => (
              <div
                key={i}
                className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                  m.emisor === "yo"
                    ? "bg-blue-600 text-white ml-auto"
                    : "bg-gray-800 text-gray-200"
                }`}
              >
                {m.texto}
              </div>
            ))}
          </div>

          {/* INPUT */}
          <div className="p-3 border-t border-gray-700 flex space-x-2 bg-[#161b22] rounded-b-xl">
            <input
              type="text"
              value={entrada}
              onChange={(e) => setEntrada(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && enviarMensaje()}
              placeholder="Escribe tu mensaje..."
              className="flex-1 bg-gray-800 text-white px-3 py-2 rounded-lg outline-none"
            />
            <button
              onClick={enviarMensaje}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white transition"
            >
              ➤
            </button>
          </div>
        </div>
      )}
    </>
  );
}
