import axios from "axios";
/*
export default axios.create({
  baseURL: 'http://localhost:5000', // 🔥 Ruta completa del backend
});
*/

export default axios.create({
  baseURL: '/api', // ✅ Ahora funcionará tanto en PC como en celular
});