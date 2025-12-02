
import React, { useState } from "react";
import axios from "../api/axios";
import useAuth from "../hooks/useAuth";

const FormularioCrearUsuario = ({ onUsuarioCreado }) => {
  const { auth } = useAuth();
  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [correo, setCorreo] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [rol, setRol] = useState("");
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMensaje("");
    try {
      const res = await axios.post(
        "/usuarios/crear",
        {
          nombre,
          apellido,
          correo,
          contraseña,
          rol,
        },
        {
          headers: {
            Authorization: `Bearer ${auth?.accessToken}`,
          },
        }
      );
      setMensaje(res.data.mensaje);
      setNombre("");
      setApellido("");
      setCorreo("");
      setContraseña("");
      setRol("");
      if (onUsuarioCreado) onUsuarioCreado(); // actualiza lista
    } catch (err) {
      setError(err.response?.data?.error || "Error al crear usuario");
    }
  };

  return (
    <div className="p-4 border rounded-md max-w-md mx-auto">
      <h2 className="text-lg font-bold mb-4">Agregar Usuario</h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          type="text"
          placeholder="Apellido"
          value={apellido}
          onChange={(e) => setApellido(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          type="email"
          placeholder="Correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={contraseña}
          onChange={(e) => setContraseña(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        />
        <select
          value={rol}
          onChange={(e) => setRol(e.target.value)}
          className="w-full border px-3 py-2 rounded"
          required
        >
          <option value="">Seleccione un rol</option>
          <option value="docente">Docente</option>
          <option value="estudiante">Estudiante</option>
        </select>
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Crear Usuario
        </button>
      </form>
      {mensaje && <p className="text-green-600 mt-2">{mensaje}</p>}
      {error && <p className="text-red-600 mt-2">{error}</p>}
    </div>
  );
};

export default FormularioCrearUsuario;
