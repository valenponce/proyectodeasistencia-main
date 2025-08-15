from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.utils.security import docente_required, estudiante_required, admin_required
from app.models import RegistrosDeAsistencia, Estudiante, Clase, Materia, EstudiantesMaterias
from datetime import datetime
asistencia_bp = Blueprint('asistencia', __name__)

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

    # Verificar inscripción activa
    inscripcion = EstudiantesMaterias.query.filter_by(
        estudiante_id=estudiante.id,
        materia_id=clase.materia_id,
        estado='activo'
    ).first()
    if not inscripcion:
        return jsonify({"error": "No estás inscripto en esta materia"}), 403

    # Verificar si ya registró asistencia
    ya_registrado = RegistrosDeAsistencia.query.filter_by(
        estudiante_id=estudiante.id,
        clase_id=clase.id
    ).first()
    if ya_registrado:
        return jsonify({
            "mensaje": "Ya registraste asistencia para esta clase",
            "materia": clase.materia.nombre if clase.materia else None,
            "fecha": ya_registrado.fecha_hora.strftime("%Y-%m-%d"),
            "hora": ya_registrado.fecha_hora.strftime("%H:%M"),
            "metodo": ya_registrado.método_registro
        }), 200
        

    # Registrar asistencia
    nueva_asistencia = RegistrosDeAsistencia(
        estudiante_id=estudiante.id,
        clase_id=clase.id,
        fecha_hora=datetime.now(),
        método_registro='QR'  # o 'app', 'manual', etc.
    )
    db.session.add(nueva_asistencia)
    db.session.commit()
    
    return jsonify({
        "mensaje": "Asistencia registrada correctamente",
        "materia": clase.materia.nombre if clase.materia else None,
        "fecha": nueva_asistencia.fecha_hora.strftime("%Y-%m-%d"),
        "hora": nueva_asistencia.fecha_hora.strftime("%H:%M"),
        "metodo": nueva_asistencia.método_registro
    }), 201
    
#escaneo del QR para el alumno

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

