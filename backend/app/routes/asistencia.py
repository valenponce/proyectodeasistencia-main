from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, date
from app import db
from app.utils.security import docente_required, estudiante_required, admin_required
from app.models import (
    RegistrosDeAsistencia,
    Estudiante,
    Clase,
    Materia,
    EstudiantesMaterias,
    Docente
)

asistencia_bp = Blueprint('asistencia', __name__)

# ============================================================
# REGISTRO NORMAL DEL DOCENTE
# ============================================================
@asistencia_bp.route('/registrar', methods=['POST'])
@jwt_required()
@docente_required
def registrar_asistencia():
    data = request.json
    nuevo_registro = RegistrosDeAsistencia(
        estudiante_id=data['estudiante_id'],
        clase_id=data['clase_id'],
        método_registro=data['metodo']
    )
    db.session.add(nuevo_registro)
    db.session.commit()
    return jsonify({"mensaje": "Asistencia registrada"}), 201


# ============================================================
# REPORTE ADMIN
# ============================================================
@asistencia_bp.route('/reporte', methods=['GET'])
@jwt_required()
@admin_required
def obtener_reporte_asistencia():
    estudiante_id = request.args.get('estudiante_id', type=int)
    materia_id = request.args.get('materia_id', type=int)
    desde = request.args.get('desde')
    hasta = request.args.get('hasta')

    query = RegistrosDeAsistencia.query.join(Clase).join(Materia)

    if estudiante_id:
        query = query.filter(RegistrosDeAsistencia.estudiante_id == estudiante_id)
    if materia_id:
        query = query.filter(Clase.materia_id == materia_id)
    if desde:
        query = query.filter(RegistrosDeAsistencia.fecha_hora >= desde)
    if hasta:
        query = query.filter(RegistrosDeAsistencia.fecha_hora <= hasta)

    resultados = []
    for r in query.all():
        resultados.append({
            "id": r.id,
            "estudiante_id": r.estudiante_id,
            "clase_id": r.clase_id,
            "materia_id": r.clase.materia_id,
            "fecha_hora": r.fecha_hora.isoformat(),
            "metodo": r.método_registro
        })

    return jsonify(resultados), 200


# ============================================================
# REGISTRO DE ASISTENCIA POR QR (ALUMNO)
# ============================================================
@asistencia_bp.route('/clase/<int:clase_id>', methods=['POST'])
@jwt_required()
@estudiante_required
def registrar_asistencia_por_clase(clase_id):
    identidad = get_jwt_identity()
    estudiante = Estudiante.query.filter_by(usuario_id=identidad['id']).first()
    if not estudiante:
        return jsonify({"error": "Estudiante no encontrado"}), 404

    clase = Clase.query.get(clase_id)
    if not clase:
        return jsonify({"error": "Clase no encontrada"}), 404

    # Verificar inscripción
    inscripcion = EstudiantesMaterias.query.filter_by(
        estudiante_id=estudiante.id,
        materia_id=clase.materia_id,
        estado='activo'
    ).first()

    if not inscripcion:
        return jsonify({"error": "No estás inscripto en esta materia"}), 403

    # Ya registrado
    ya_registrado = RegistrosDeAsistencia.query.filter_by(
        estudiante_id=estudiante.id,
        clase_id=clase.id
    ).first()

    if ya_registrado:
        return jsonify({
            "mensaje": "Ya registraste asistencia",
            "materia": clase.materia.nombre if clase.materia else None,
            "fecha": ya_registrado.fecha_hora.strftime("%Y-%m-%d"),
            "hora": ya_registrado.fecha_hora.strftime("%H:%M:%S"),
            "metodo": ya_registrado.método_registro
        }), 200

    # Registrar nueva asistencia
    nueva = RegistrosDeAsistencia(
        estudiante_id=estudiante.id,
        clase_id=clase.id,
        fecha_hora=datetime.now(),
        método_registro='QR'
    )
    db.session.add(nueva)
    db.session.commit()

    return jsonify({
        "mensaje": "Asistencia registrada",
        "materia": clase.materia.nombre,
        "fecha": nueva.fecha_hora.strftime("%Y-%m-%d"),
        "hora": nueva.fecha_hora.strftime("%H:%M:%S")
    }), 201


# ============================================================
# QR ESCANEO
# ============================================================
@asistencia_bp.route('/escaneo', methods=['POST'])
@jwt_required()
@estudiante_required
def registrar_asistencia_con_token():
    from app.utils.security import verificar_token_asistencia

    token = request.json.get('token')
    datos = verificar_token_asistencia(token)

    if not datos:
        return jsonify({"error": "Token inválido o expirado"}), 400

    clase_id = datos.get('clase_id')
    return registrar_asistencia_por_clase(clase_id)


# ============================================================
# ⭐ RESUMEN DETALLADO PARA DOCENTE
# ============================================================
@asistencia_bp.route("/resumen", methods=["GET"])
@jwt_required()
@docente_required
def resumen_docente():

    identidad = get_jwt_identity()
    docente = Docente.query.filter_by(usuario_id=identidad["id"]).first()

    materia_id = request.args.get("materia_id", type=int)
    if not materia_id:
        return jsonify({"error": "Debe enviar materia_id"}), 400

    clase = Clase.query.filter_by(
        materia_id=materia_id,
        fecha=date.today()
    ).first()

    if not clase:
        return jsonify({
            "resumen": {"presentes": 0, "tardanza": 0, "ausentes": 0},
            "presentes_detalle": [],
            "tardanza_detalle": [],
            "ausentes_detalle": []
        }), 200

    inscripciones = EstudiantesMaterias.query.filter_by(
        materia_id=materia_id,
        estado="activo"
    ).all()

    estudiantes_ids = [i.estudiante_id for i in inscripciones]
    registros = RegistrosDeAsistencia.query.filter_by(clase_id=clase.id).all()

    presentes = []
    tardanza = []
    ausentes = []

    hora_inicio = datetime.combine(date.today(), clase.hora_inicio)

    for est_id in estudiantes_ids:
        est = Estudiante.query.get(est_id)
        usr = est.usuario

        registro = next((r for r in registros if r.estudiante_id == est_id), None)

        if registro:
            delta = registro.fecha_hora - hora_inicio
            minutos = delta.total_seconds() / 60

            detalle = {
                "nombre": usr.nombre,
                "apellido": usr.apellido,
                "fecha": registro.fecha_hora.strftime("%Y-%m-%d"),
                "hora": registro.fecha_hora.strftime("%H:%M:%S")
            }

            if minutos <= 5:
                presentes.append(detalle)
            elif minutos <= 30:
                tardanza.append(detalle)
            else:
                ausentes.append(detalle)

        else:
            ausentes.append({
                "nombre": usr.nombre,
                "apellido": usr.apellido,
                "fecha": date.today().strftime("%Y-%m-%d"),
                "hora": "--"
            })

    return jsonify({
        "resumen": {
            "presentes": len(presentes),
            "tardanza": len(tardanza),
            "ausentes": len(ausentes)
        },
        "presentes_detalle": presentes,
        "tardanza_detalle": tardanza,
        "ausentes_detalle": ausentes
    }), 200
