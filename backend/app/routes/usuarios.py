import secrets
import pandas as pd
from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db, bcrypt
from app.models import Usuario, Docente, Estudiante
from app.utils.security import admin_required, rol_requerido
from app.utils.email import send_email


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
    rol = request.args.get("rol")
    if rol:
        usuarios = Usuario.query.filter_by(rol=rol, activo=True).all()
    else:
        usuarios = Usuario.query.filter_by(activo=True).all()

    resultado = []
    for u in usuarios:
        resultado.append({
            "id": u.id,
            "nombre": u.nombre,
            "apellido": u.apellido,
            "correo": u.correo,
            "dni":u.dni,
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
        if usuario and usuario.activo:  # 👈 filtramos solo usuarios activos
            resultado.append({
                "id": d.id,
                "nombre": usuario.nombre,
                "apellido": usuario.apellido,
                "correo": usuario.correo
            })
    return jsonify(resultado), 200


@usuarios_bp.route('/crear', methods=['POST'])
@jwt_required()
@admin_required
def crear_usuario():
    ident = get_jwt_identity()
    es_superadmin = ident.get("es_superadmin", False)

    data = request.get_json()
    nombre = data.get('nombre')
    apellido = data.get('apellido')
    correo = data.get('correo')
    contraseña = data.get('contraseña')
    rol = data.get('rol')

    if not all([nombre, apellido, correo, contraseña, rol]):
        return jsonify({"error": "Faltan campos obligatorios."}), 400

    if rol == 'administrador' and not es_superadmin:
        return jsonify({"error": "Solo un superadmin puede crear administradores."}), 403

    if rol not in ['docente', 'estudiante']:
        return jsonify({"error": "Rol no permitido. Solo docente o estudiante."}), 400

    if Usuario.query.filter_by(correo=correo).first():
        return jsonify({"error": "Ya existe un usuario con ese correo."}), 400

    contraseña_hash = bcrypt.generate_password_hash(contraseña).decode('utf-8')
    nuevo = Usuario(
        nombre=nombre,
        apellido=apellido,
        correo=correo,
        contraseña=contraseña_hash,
        rol=rol
    )
    db.session.add(nuevo)
    db.session.commit()

    if rol == 'docente':
        db.session.add(Docente(usuario_id=nuevo.id))
    elif rol == 'estudiante':
        db.session.add(Estudiante(usuario_id=nuevo.id))

    db.session.commit()
    return jsonify({"mensaje": "Usuario creado correctamente."}), 201


#ELIMINAR USUARIO

@usuarios_bp.route('/<int:id>', methods=['DELETE'])
@jwt_required()
@admin_required
def eliminar_usuario(id):
    usuario = Usuario.query.get(id)
    if not usuario:
        return jsonify({"error": "Usuario no encontrado"}), 404

    # Validar que un admin común no pueda eliminar a otro administrador
    if usuario.rol == 'administrador':
        identidad = get_jwt_identity()
        if not identidad.get("es_superadmin", False):
            return jsonify({"error": "Solo un superadmin puede eliminar administradores."}), 403

    usuario.activo = False
    db.session.commit()
    return jsonify({"mensaje": "Usuario dado de baja (lógicamente)."}), 200

#Cambiar contraseña

@usuarios_bp.route('/cambiar_password', methods=['POST'])
@jwt_required()
def cambiar_password():
    identidad = get_jwt_identity()
    usuario = Usuario.query.get(identidad["id"])

    data = request.json
    nueva_password = data.get("password")

    if not nueva_password:
        return jsonify({"error": "Contraseña requerida"}), 400

    usuario.password = bcrypt.generate_password_hash(nueva_password).decode("utf-8")
    usuario.debe_cambiar_password = False
    db.session.commit()

    return jsonify({"mensaje": "Contraseña actualizada correctamente"}), 200


#importar excel

@usuarios_bp.route('/importar_excel', methods=['POST'])
@jwt_required()
@admin_required
def importar_excel():
    if 'file' not in request.files:
        return jsonify({"error": "No se envió archivo"}), 400

    file = request.files['file']
    if not file.filename.endswith(('.xlsx', '.csv')):
        return jsonify({"error": "Formato no permitido (use .xlsx o .csv)"}), 400

    try:
        if file.filename.endswith('.csv'):
            df = pd.read_csv(file)
        else:
            df = pd.read_excel(file)

        columnas_requeridas = {"nombre", "apellido", "correo", "dni", "rol"}
        if not columnas_requeridas.issubset(set(df.columns)):
            return jsonify({"error": f"El archivo debe contener: {columnas_requeridas}"}), 400

        usuarios_ok = []
        errores = []

        for i, row in df.iterrows():
            try:
                rol = str(row['rol']).lower().strip()
                if rol == "administrador":
                    errores.append({"fila": i+2, "error": "No se permite importar administradores"})
                    continue
                if rol not in ["docente", "estudiante"]:
                    errores.append({"fila": i+2, "error": f"Rol no válido: {rol}"})
                    continue
                
                if Usuario.query.filter((Usuario.correo == row['correo'].strip()) | (Usuario.dni == str(row['dni']).strip())).first():
                    errores.append({"fila": i+2, "error": "Email o DNI ya registrados"})
                    continue

                password_plano = secrets.token_urlsafe(8)
                password_hash = bcrypt.generate_password_hash(password_plano).decode("utf-8")

                usuario = Usuario(
                    nombre=row['nombre'],
                    apellido=row['apellido'],
                    correo=row['correo'].strip(),
                    dni=str(row['dni']).strip(),
                    rol=rol,
                    contraseña=password_hash,
                    debe_cambiar_password=True
                )
                db.session.add(usuario)
                db.session.flush()

                if rol == 'docente':
                    db.session.add(Docente(usuario_id=usuario.id))
                elif rol == 'estudiante':
                    db.session.add(Estudiante(usuario_id=usuario.id))

                cuerpo = (
                    f"Hola {row['nombre']} {row['apellido']},\n\n"
                    f"Se creó tu usuario en el Sistema de Asistencia.\n\n"
                    f"Correo: {row['correo']}\n"
                    f"Contraseña temporal: {password_plano}\n\n"
                    f"Deberás cambiarla al iniciar sesión por primera vez.\n\n"
                    f"Saludos,\nAdministración"
                )

                try:
                    send_email(
                        to_email=row['correo'],
                        subject="Credenciales de acceso - Sistema de Asistencia",
                        body=cuerpo
                    )
                    usuarios_ok.append({"fila": i+2, "correo": row['correo'], "estado": "enviado"})
                except Exception as e_mail:
                    usuarios_ok.append({"fila": i+2, "correo": row['correo'], "estado": f"correo no enviado: {e_mail}"})

            except Exception as e_row:
                errores.append({"fila": i+2, "error": str(e_row)})

        db.session.commit()

        return jsonify({
            "mensaje": "Importación finalizada",
            "total_importados": len([u for u in usuarios_ok if u["estado"].startswith("enviado") or u["estado"].startswith("correo no enviado")]),
            "total_errores": len(errores),
            "detalle": {
                "usuarios_procesados": usuarios_ok,
                "errores": errores
            }
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": f"Error al procesar archivo: {str(e)}"}), 500
