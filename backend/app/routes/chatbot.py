from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Usuario, Estudiante, Docente
from datetime import datetime

chatbot_bp = Blueprint("chatbot", __name__)

# ==========================================================
# MOTOR AVANZADO DE RESPUESTAS
# ==========================================================

def detectar_intencion(texto):
    t = texto.lower().strip()

    if any(p in t for p in ["materia", "materias"]):
        return "materias"
    if "crear" in t or "nueva" in t:
        return "crear"
    if any(p in t for p in ["inscribir", "inscripcion", "anotar"]):
        return "inscribir"
    if any(p in t for p in ["asistencia", "presente", "ausente"]):
        return "asistencia"
    if "clase" in t or "qr" in t:
        return "clases"
    if any(p in t for p in ["hola", "hey", "buenas"]):
        return "saludo"

    return "otro"

def respuesta_por_rol(rol, intencion):
    # ---------------------
    # ADMINISTRADOR
    # ---------------------
    if rol == "administrador":
        if intencion == "saludo":
            return "👋 Hola admin, ¿en qué puedo ayudarte hoy?"
        if intencion == "materias":
            return "📘 Para gestionar materias, ve a *Materias*: ahí puedes crear, editar o eliminar materias."
        if intencion == "crear":
            return "➕ Para crear una materia, entra en *Materias* → 'Crear nueva materia'."
        if intencion == "inscribir":
            return "🧍‍♂️ Para inscribir alumnos, entra en *Materias* y usa el botón 'Inscribir estudiante'."
        if intencion == "clases":
            return "📅 Para gestionar clases y generar QR, ve a *Clases*. Allí puedes crear clases y generar tokens."
        if intencion == "asistencia":
            return "📊 Puedes ver reportes completos en *Reportes de Asistencia*."
        return "🤖 No entendí bien, ¿podés repetirlo? Puedo ayudarte con materias, usuarios, clases y asistencias."

    # ---------------------
    # DOCENTE
    # ---------------------
    if rol == "docente":
        if intencion == "saludo":
            return "👋 Hola profe, ¿todo bien? ¿Qué necesitas con tus clases o asistencias?"
        if intencion == "materias":
            return "📘 Puedes ver tus materias en la sección *Clases*. Solo aparecen las que te corresponden."
        if intencion == "clases":
            return "📅 En *Clases* puedes ver, crear clases, generar QR y pasar asistencia."
        if intencion == "asistencia":
            return "🟢 En *Asistencia* verás presentes, ausentes y tardanzas en tiempo real."
        return "🤖 No entendí del todo. Podés preguntarme sobre clases, QR, asistencia o tus materias."

    # ---------------------
    # ESTUDIANTE
    # ---------------------
    if rol == "estudiante":
        if intencion == "saludo":
            return "👋 Hola, ¿cómo estás? ¿Necesitas ayuda con tus materias o el escaneo QR?"
        if intencion == "materias":
            return "📚 Tus materias inscritas aparecen en la sección *Materias*. Ahí puedes escanear el QR."
        if intencion == "clases":
            return "📱 Para registrar asistencia, abre *Escanear QR* y apunta al código generado por el docente."
        if intencion == "asistencia":
            return "🟢 Tu asistencia se registra automáticamente al escanear el QR. Puedes ver tu historial en *Historial*."
        return "🤖 Puedo ayudarte con materias, asistencia y el escaneo QR. Preguntame lo que necesites."

    return "🤖 No pude identificar tu rol, pero puedo ayudarte con materias, clases y asistencia."


# ==========================================================
# ENDPOINT PRINCIPAL DEL CHATBOT
# ==========================================================
@chatbot_bp.route("/mensaje", methods=["POST"])
@jwt_required()
def procesar_mensaje():
    data = request.json
    mensaje = data.get("mensaje", "").strip()

    identidad = get_jwt_identity()
    usuario = Usuario.query.get(identidad["id"])
    rol = usuario.rol

    intencion = detectar_intencion(mensaje)
    respuesta = respuesta_por_rol(rol, intencion)

    return jsonify({"respuesta": respuesta}), 200
