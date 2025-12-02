from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import db, EstudiantesMaterias, Docente, Estudiante
from app.utils.security import rol_requerido

from datetime import datetime

inscripciones_bp = Blueprint('inscripciones', __name__)

# Ruta para inscribir a un estudiante en una materia
@inscripciones_bp.route('/', methods=['POST'])
@jwt_required()
@rol_requerido(['administrador', 'docente'])
def inscribir_estudiante():
    data = request.json
    estudiante_id = data.get('estudiante_id')
    materia_id = data.get('materia_id')

    if not estudiante_id or not materia_id:
        return jsonify({"error": "Faltan campos requeridos"}), 400
    
    estudiante = Estudiante.query.filter_by(usuario_id=estudiante_id).first()
    if not estudiante:
        return jsonify({"error": "Estudiante no encontrado"}), 404

    # Verificamos si ya está inscrito
    ya_inscripto = EstudiantesMaterias.query.filter_by(estudiante_id=estudiante.id, materia_id=materia_id, fecha_baja=None).first()
    if ya_inscripto:
        return jsonify({"error": "El estudiante ya está inscrito en esta materia"}), 409

    nueva_inscripcion = EstudiantesMaterias(
        estudiante_id=estudiante.id,
        materia_id=materia_id
    )

    db.session.add(nueva_inscripcion)
    db.session.commit()

    return jsonify({"mensaje": "Estudiante inscrito correctamente"}), 201

# Ruta para listar las materias en las que está inscrito un estudiante
@inscripciones_bp.route('/estudiante/<int:estudiante_id>', methods=['GET'])
@jwt_required()
@rol_requerido(['administrador', 'docente', 'estudiante'])
def ver_inscripciones(estudiante_id):
    inscripciones = EstudiantesMaterias.query.filter_by(estudiante_id=estudiante_id, fecha_baja=None).all()

    resultado = []
    for insc in inscripciones:
        resultado.append({
            "materia_id": insc.materia.id,
            "materia_nombre": insc.materia.nombre,
            "estado": insc.estado,
            "fecha_alta": insc.fecha_alta.strftime('%d-%m-%Y %H:%M:%S')
        })

    return jsonify(resultado), 200

# Ruta para dar de baja una inscripción 
@inscripciones_bp.route('/<int:inscripcion_id>', methods=['DELETE'])
@jwt_required()
@rol_requerido(['docente', 'administrador'])
def dar_baja_inscripcion(inscripcion_id):
    inscripcion = EstudiantesMaterias.query.get(inscripcion_id)

    if not inscripcion or inscripcion.estado != 'activo':
        return jsonify({"error": "Inscripción no encontrada o ya dada de baja"}), 404

    identidad = get_jwt_identity()

    # Obtenemos el id del docente si corresponde
    docente_id = None
    if identidad['rol'] == 'docente':
        docente = Docente.query.filter_by(usuario_id=identidad['id']).first()
        if not docente:
            return jsonify({"error": "Docente no encontrado"}), 404
        docente_id = docente.id

    inscripcion.fecha_baja = datetime.now()
    inscripcion.estado = 'baja_por_inasistencia'
    inscripcion.docente_id = docente_id

    db.session.commit()

    return jsonify({"mensaje": "Inscripción dada de baja correctamente"}), 200

# Ruta para listar todas las inscripciones activas
@inscripciones_bp.route('/', methods=['GET'])
@jwt_required()
@rol_requerido(['administrador', 'docente'])
def listar_todas_inscripciones():
    inscripciones = EstudiantesMaterias.query.filter_by(estado='activo').all()

    resultado = []
    for insc in inscripciones:
        estudiante = insc.estudiante
        usuario = estudiante.usuario  # relación entre estudiante y usuario
        materia = insc.materia

        resultado.append({
            "id": insc.id,
            "estudiante_id": estudiante.id,
            "estudiante_nombre": f"{usuario.nombre} {usuario.apellido}",
            "materia_id": materia.id,
            "materia_nombre": materia.nombre,
            "fecha_alta": insc.fecha_alta.strftime('%d-%m-%Y %H:%M:%S') if insc.fecha_alta else None
        })

    return jsonify(resultado), 200



