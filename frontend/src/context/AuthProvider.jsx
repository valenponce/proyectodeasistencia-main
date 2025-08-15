import { createContext, useState, useEffect } from "react";

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [auth, setAuth] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const rol = localStorage.getItem("rol");
    const id = localStorage.getItem("usuario_id");
    const nombre = localStorage.getItem("nombre");
    const docente_id = localStorage.getItem("docente_id");

    if (token && rol && id) {
      const docenteIdNum = docente_id ? parseInt(docente_id) : null;
      setAuth({
        accessToken: token,
        rol,
        id,
        nombre,
        docente_id: docenteIdNum
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ auth, setAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;