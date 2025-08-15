from flask import Blueprint, request, jsonify
from app.models import Curso, db
from app.utils.security import rol_requerido, admin_required

cursos_bp = Blueprint('cursos', __name__)

# Obtener todos los cursos (rol: docente o administrador)
@cursos_bp.route('/', methods=['GET'])
@rol_requerido(['docente', 'administrador'])
def obtener_cursos():
    cursos = Curso.query.all()
    resultado = []
    for curso in cursos:
        resultado.append({
            'id': curso.id,
            'nombre': curso.nombre,
            'nivel': curso.nivel
        })
    return jsonify(resultado), 200

# Crear un nuevo curso (solo administrador)
@cursos_bp.route('/', methods=['POST'])
@admin_required
def crear_curso():
    data = request.json
    if 'nombre' not in data or 'nivel' not in data:
        return jsonify({"error": "Faltan datos obligatorios (nombre, nivel)"}), 400

    nuevo_curso = Curso(nombre=data['nombre'], nivel=data['nivel'])
    db.session.add(nuevo_curso)
    db.session.commit()
    return jsonify({"mensaje": "Curso creado correctamente"}), 201

# Modificar un curso existente (solo administrador)
@cursos_bp.route('/<int:id>', methods=['PUT'])
@admin_required
def modificar_curso(id):
    curso = Curso.query.get(id)
    if not curso:
        return jsonify({"error": "Curso no encontrado"}), 404

    data = request.json
    if 'nombre' in data:
        curso.nombre = data['nombre']
    if 'nivel' in data:
        curso.nivel = data['nivel']
    db.session.commit()
    return jsonify({"mensaje": "Curso actualizado correctamente"}), 200

# Eliminar un curso (solo administrador)
@cursos_bp.route('/<int:id>', methods=['DELETE'])
@admin_required
def eliminar_curso(id):
    curso = Curso.query.get(id)
    if not curso:
        return jsonify({"error": "Curso no encontrado"}), 404

    db.session.delete(curso)
    db.session.commit()
    return jsonify({"mensaje": "Curso eliminado correctamente"}), 200
