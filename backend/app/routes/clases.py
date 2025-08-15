from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload
from app.models import db,Clase, Materia, Docente, Usuario
from app.utils.security import rol_requerido,docente_required
from datetime import datetime

clases_bp = Blueprint('clases', __name__)

# Crear una nueva clase
@clases_bp.route('/', methods=['POST'])
@docente_required
def crear_clase():
    data = request.json
    campos_requeridos = ['materia_id', 'fecha', 'hora_inicio', 'hora_fin']
    if not all(campo in data for campo in campos_requeridos):
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    try:
        fecha = datetime.strptime(data['fecha'], '%Y-%m-%d').date()
        hora_inicio = datetime.strptime(data['hora_inicio'], '%H:%M').time()
        hora_fin = datetime.strptime(data['hora_fin'], '%H:%M').time()
    except ValueError:
        return jsonify({"error": "Formato de fecha u hora inválido"}), 400

    # Buscar la materia
    materia = Materia.query.get(data['materia_id'])
    if not materia:
        return jsonify({"error": "Materia no encontrada"}), 404

    # Verificar que el docente autenticado sea el que dicta esa materia
    identidad = get_jwt_identity()  # trae {"id": usuario_id, "rol": "docente"}
    docente = Docente.query.filter_by(usuario_id=identidad['id']).first()
    if not docente or materia.docente_id != docente.id:
        return jsonify({"error": "No tienes permiso para crear clases en esta materia"}), 403

    # Crear la clase con el docente_id correcto
    clase = Clase(
        materia_id=data['materia_id'],
        docente_id=docente.id,
        fecha=fecha,
        hora_inicio=hora_inicio,
        hora_fin=hora_fin
    )
    db.session.add(clase)
    db.session.commit()
    return jsonify({"mensaje": "Clase creada correctamente"}), 201


# Modificar una clase existente
@clases_bp.route('/<int:id>', methods=['PUT'])
@docente_required
def editar_clase(id):
    clase = Clase.query.get(id)
    if not clase:
        return jsonify({"error": "Clase no encontrada"}), 404

    data = request.json
    if 'fecha' in data:
        try:
            clase.fecha = datetime.strptime(data['fecha'], '%Y-%m-%d').date()
        except ValueError:
            return jsonify({"error": "Fecha inválida"}), 400
    if 'hora_inicio' in data:
        clase.hora_inicio = datetime.strptime(data['hora_inicio'], '%H:%M').time()
    if 'hora_fin' in data:
        clase.hora_fin = datetime.strptime(data['hora_fin'], '%H:%M').time()

    db.session.commit()
    return jsonify({"mensaje": "Clase actualizada correctamente"}), 200

# Eliminar una clase
@clases_bp.route('/<int:id>', methods=['DELETE'])
@docente_required
def eliminar_clase(id):
    clase = Clase.query.get(id)
    if not clase:
        return jsonify({"error": "Clase no encontrada"}), 404

    db.session.delete(clase)
    db.session.commit()
    return jsonify({"mensaje": "Clase eliminada correctamente"}), 200

#obtener clases por rol o administrador

@clases_bp.route('/', methods=['GET'])
@jwt_required()
def obtener_clases():
    identidad = get_jwt_identity()
    usuario_id = identidad["id"]
    rol = identidad["rol"]

    # Consulta base con joinedload para traer relaciones
    query = Clase.query.options(
        joinedload(Clase.materia).joinedload(Materia.curso),
        joinedload(Clase.docente).joinedload(Docente.usuario)
    )

    # Filtro por nombre de materia
    materia_nombre = request.args.get('materia')
    if materia_nombre:
        query = query.join(Materia).filter(Materia.nombre.ilike(f"%{materia_nombre}%"))

    # Filtro por fecha
    fecha = request.args.get('fecha')
    if fecha:
        try:
            fecha_obj = datetime.strptime(fecha, "%Y-%m-%d").date()
            query = query.filter(Clase.fecha == fecha_obj)
        except ValueError:
            return jsonify({"error": "Formato de fecha inválido. Usa YYYY-MM-DD"}), 400

    # Si es docente, filtra por su ID
    if rol == "docente":
        docente = Docente.query.filter_by(usuario_id=usuario_id).first()
        if not docente:
            return jsonify({"error": "Docente no encontrado"}), 404
        query = query.filter(Clase.docente_id == docente.id)

    # Si es admin, puede filtrar por docente_id si lo desea
    elif rol == "administrador":
        docente_id = request.args.get('docente_id')
        if docente_id:
            try:
                query = query.filter(Clase.docente_id == int(docente_id))
            except ValueError:
                return jsonify({"error": "docente_id debe ser numérico"}), 400
    else:
        return jsonify({"error": "Acceso no autorizado"}), 403

    clases = query.all()

    resultado = []
    for clase in clases:
        resultado.append({
            "id": clase.id,
            "fecha": clase.fecha.isoformat(),
            "hora_inicio": clase.hora_inicio.strftime('%H:%M'),
            "hora_fin": clase.hora_fin.strftime('%H:%M'),
            "materia_id": clase.materia_id,
            "materia": {
                "id": clase.materia.id,
                "nombre": clase.materia.nombre
            } if clase.materia else None,
            "curso": {
                "id": clase.materia.curso.id,
                "nombre": clase.materia.curso.nombre
            } if clase.materia and clase.materia.curso else None,
            "docente_id": clase.docente_id,
            "docente": f"{clase.docente.usuario.nombre} {clase.docente.usuario.apellido}" if clase.docente and clase.docente.usuario else None
        })

    return jsonify(resultado), 200

#generacion del QR para un docente

@clases_bp.route('/generar_qr/<int:clase_id>', methods=['GET'])
@jwt_required()
@docente_required
def generar_qr_para_clase(clase_id):
    from app.utils.security import generar_token_asistencia

    clase = Clase.query.get_or_404(clase_id)
    token = generar_token_asistencia(clase.id)

    # Podés retornar solo el token o una URL lista para escanear
    return jsonify({
        "token": token,
        "url_qr": f"https://tusitio.com/asistencia/escaneo?token={token}"
    }), 200
