from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.models import Usuario, Docente
from app.utils.security import admin_required, rol_requerido

usuarios_bp = Blueprint('usuarios', __name__)

@usuarios_bp.route('/perfil', methods=['GET'])
@jwt_required()
def perfil():
    identity = get_jwt_identity()
    usuario = Usuario.query.get(identity['id'])
    return jsonify({
        "id": usuario.id,
        "nombre": usuario.nombre,
        "apellido": usuario.apellido,
        "correo": usuario.correo,
        "rol": usuario.rol
    }), 200

@usuarios_bp.route('/', methods=['GET'])
@jwt_required()
@admin_required
def listar_usuarios():
    rol = request.args.get("rol")  # <-- nuevo parámetro opcional
    if rol:
        usuarios = Usuario.query.filter_by(rol=rol).all()
    else:
        usuarios = Usuario.query.all()

    resultado = []
    for u in usuarios:
        resultado.append({
            "id": u.id,
            "nombre": u.nombre,
            "apellido": u.apellido,
            "correo": u.correo,
            "rol": u.rol
        })
    return jsonify(resultado), 200


@usuarios_bp.route('/docentes_full/', methods=['GET'])
@jwt_required()
@rol_requerido(["administrador", "docente"])
def listar_docentes_completos():
    docentes = Docente.query.all()
    resultado = []
    for d in docentes:
        usuario = d.usuario
        resultado.append({
            "id": d.id,
            "nombre": usuario.nombre,
            "apellido": usuario.apellido,
            "correo": usuario.correo
        })
    return jsonify(resultado), 200
