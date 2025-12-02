from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token
from flask_bcrypt import Bcrypt  # Importamos Bcrypt para el hash de contraseñas
from app.models import Usuario, Docente, Estudiante
from app import db
from datetime import timedelta

# Inicialización de Bcrypt para encriptar las contraseñas
bcrypt = Bcrypt()

# Definimos el Blueprint para la autenticación
auth_bp = Blueprint('auth', __name__)

# Ruta para registrar un nuevo usuario
@auth_bp.route('/registro', methods=['POST'])
def registrar_usuario():
    data = request.json

    # Verificamos si todos los campos requeridos están presentes
    if not all(key in data for key in ('nombre', 'apellido', 'email', 'password', 'rol')):
        return jsonify({"error": "Faltan datos requeridos"}), 400

    # Verificamos si el correo ya está registrado
    if Usuario.query.filter_by(correo=data['email']).first():
        return jsonify({"error": "Correo ya registrado"}), 400

    # Hasheamos la contraseña
    hashed_password = bcrypt.generate_password_hash(data['contraseña']).decode('utf-8')

    # Creamos el nuevo usuario
    nuevo_usuario = Usuario(
        nombre=data['nombre'],
        apellido=data['apellido'],
        correo=data['email'],
        dni=data['dni'],  # 🔴 Nuevo
        contraseña=hashed_password,
        rol=data['rol'],
        debe_cambiar_password=True
    )

    db.session.add(nuevo_usuario)
    db.session.commit()

    # Si el rol es docente, también lo agregamos a la tabla docentes
    if nuevo_usuario.rol == 'docente':
        nuevo_docente = Docente(usuario_id=nuevo_usuario.id)
        db.session.add(nuevo_docente)
        db.session.commit()
    
    # Si el rol es estudiante, también lo agregamos a la tabla estudiantes
    if nuevo_usuario.rol == 'estudiante':
        nuevo_estudiante = Estudiante(usuario_id=nuevo_usuario.id)
        db.session.add(nuevo_estudiante)
        db.session.commit()

    return jsonify({"mensaje": "Usuario registrado exitosamente"}), 201 

# Ruta para el login de un usuario
@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    usuario = Usuario.query.filter_by(correo=data.get('email')).first()
    if not usuario or not bcrypt.check_password_hash(usuario.contraseña, data.get('password')):
        return jsonify({"error": "Credenciales inválidas"}), 401
    
    identity = {
    "id": usuario.id,
    "rol": usuario.rol,
    "nombre": f"{usuario.nombre} {usuario.apellido}"
    }

    if usuario.rol == "docente":
        docente = Docente.query.filter_by(usuario_id=usuario.id).first()
        if docente:
            identity["docente_id"] = docente.id

    token = create_access_token(identity=identity, expires_delta=timedelta(hours=1))
    return jsonify({
        "access_token": token,
        "identity": identity
    }), 200
