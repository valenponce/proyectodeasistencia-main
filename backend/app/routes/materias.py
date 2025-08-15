from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload
from app import db
from app.models import Materia, Docente, Usuario, Curso
from app.utils.security import admin_required, rol_requerido, docente_required

materias_bp = Blueprint('materias', __name__)

@materias_bp.route('/', methods=['GET'])
@jwt_required()
@rol_requerido("docente")  # permite a docentes y admin listar
def listar_materias():
    materias = Materia.query.options(
        joinedload(Materia.docente).joinedload(Docente.usuario),
        joinedload(Materia.curso)
    ).all()

    resultado = []
    for m in materias:
        resultado.append({
            "id": m.id,
            "nombre": m.nombre,
            "curso": {
                "id": m.curso.id,
                "nombre": m.curso.nombre
            } if m.curso else None,
            "docente": {
                "id": m.docente.id,
                "nombre": m.docente.usuario.nombre,
                "apellido": m.docente.usuario.apellido
            } if m.docente and m.docente.usuario else None
        })
    return jsonify(resultado), 200

@materias_bp.route('/', methods=['POST'])
@jwt_required()
@admin_required
def crear_materia():
    data = request.json

    if 'nombre' not in data or 'curso_id' not in data or 'docente_id' not in data:
        return jsonify({"error": "Faltan datos obligatorios (nombre, curso_id, docente_id)"}), 400

    curso = Curso.query.get(data['curso_id'])
    if not curso:
        return jsonify({"error": "Curso no encontrado"}), 404

    docente = Docente.query.get(data['docente_id'])
    if not docente:
        return jsonify({"error": "Docente no encontrado"}), 404

    nueva = Materia(
        nombre=data['nombre'],
        curso_id=data['curso_id'],
        docente_id=data['docente_id']
    )
    db.session.add(nueva)
    db.session.commit()

    return jsonify({"mensaje": "Materia creada correctamente"}), 201

@materias_bp.route('/<int:id>', methods=['PUT'])
@jwt_required()
@admin_required
def editar_materia(id):
    materia = Materia.query.get_or_404(id)
    data = request.json
    materia.nombre = data.get('nombre', materia.nombre)
    materia.docente_id = data.get('docente_id', materia.docente_id)
    db.session.commit()
    return jsonify({"mensaje": "Materia actualizada"}), 200

@materias_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def eliminar_materia(id):
    materia = Materia.query.get_or_404(id)
    db.session.delete(materia)
    db.session.commit()
    return jsonify({"mensaje": "Materia eliminada"}), 200

@materias_bp.route('/autocompletar', methods=['GET'])
@jwt_required()
def autocompletar_materias():
    termino = request.args.get('busqueda', '')

    if not termino:
        return jsonify([])

    materias = Materia.query.filter(Materia.nombre.ilike(f'%{termino}%')).limit(10).all()

    resultados = []
    for materia in materias:
        resultado = {
            "id": materia.id,
            "nombre": materia.nombre
        }

        if materia.curso:
            resultado["curso"] = materia.curso.nombre
        if materia.docente and materia.docente.usuario:
            resultado["docente"] = f"{materia.docente.usuario.nombre} {materia.docente.usuario.apellido}"

        resultados.append(resultado)

    return jsonify(resultados), 200

@materias_bp.route('/docente', methods=['GET'])
@docente_required
def obtener_materias_del_docente():
    identidad = get_jwt_identity()
    docente = Docente.query.filter_by(usuario_id=identidad['id']).first()
    if not docente:
        return jsonify({"error": "Docente no encontrado"}), 404

    materias = Materia.query.filter_by(docente_id=docente.id).all()

    resultado = []
    for materia in materias:
        resultado.append({
            "id": materia.id,
            "nombre": materia.nombre,
            "curso": materia.curso.nombre if materia.curso else None
        })

    return jsonify(resultado), 200

#listar materias pero unicamente para estudiantes

@materias_bp.route('/estudiante/<int:usuario_id>', methods=['GET'])
@jwt_required()
@rol_requerido("estudiante")
def materias_del_estudiante(usuario_id):
    from app.models import Estudiante, EstudiantesMaterias  # evitar import circular

    estudiante = Estudiante.query.filter_by(usuario_id=usuario_id).first()
    if not estudiante:
        return jsonify({"error": "Estudiante no encontrado"}), 404

    inscripciones = EstudiantesMaterias.query.filter_by(estudiante_id=estudiante.id, estado='activo').all()

    resultado = []
    for insc in inscripciones:
        materia = insc.materia
        resultado.append({
            "materia_id": materia.id,
            "materia_nombre": materia.nombre,
            "curso": materia.curso.nombre if materia.curso else None,
            "docente": {
            "nombre": materia.docente.usuario.nombre if materia.docente and materia.docente.usuario else None,
            "apellido": materia.docente.usuario.apellido if materia.docente and materia.docente.usuario else None
            }
        })

    return jsonify(resultado), 200
