from flask_jwt_extended import get_jwt_identity, jwt_required
from functools import wraps
from flask import jsonify, current_app
from itsdangerous import URLSafeTimedSerializer

def rol_requerido(roles):
    # Convertir un solo rol en lista si hace falta
    if isinstance(roles, str):
        roles = [roles]

    def decorador(func):
        @wraps(func)
        @jwt_required()
        def wrapper(*args, **kwargs):
            identidad = get_jwt_identity()
            if not identidad or 'rol' not in identidad:
                return jsonify({"error": "Token inválido"}), 401
            rol_usuario = identidad['rol']
            if rol_usuario not in roles and rol_usuario != 'administrador':
                return jsonify({"error": "Acceso no autorizado"}), 403
            return func(*args, **kwargs)
        return wrapper
    return decorador

# Decoradores específicos (siguen funcionando igual)
def admin_required(func):
    return rol_requerido("administrador")(func)

def docente_required(func):
    return rol_requerido("docente")(func)

def estudiante_required(func):
    return rol_requerido("estudiante")(func)

# validacion del token QR

def generar_token_asistencia(clase_id):
    s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    return s.dumps({"clase_id": clase_id})

def verificar_token_asistencia(token, max_age=300):  # 5 minutos por defecto
    s = URLSafeTimedSerializer(current_app.config['SECRET_KEY'])
    try:
        data = s.loads(token, max_age=max_age)
        return data  # debería ser {"clase_id": X}
    except Exception:
        return None
