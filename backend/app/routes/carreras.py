from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required
from app import db
from app.models import Carrera
from app.utils.security import admin_required

carreras_bp = Blueprint("carreras", __name__)

# 📌 Listar solo carreras activas
@carreras_bp.route("/", methods=["GET"])
@jwt_required()
def listar_carreras():
    carreras = Carrera.query.filter_by(activo=True).all()
    resultado = [
        {"id": c.id, "nombre": c.nombre, "descripcion": c.descripcion}
        for c in carreras
    ]
    return jsonify(resultado), 200


# 📌 Listar todas las carreras (activas e inactivas) → solo admin
@carreras_bp.route("/todas", methods=["GET"])
@jwt_required()
@admin_required
def listar_todas_carreras():
    carreras = Carrera.query.all()
    resultado = [
        {
            "id": c.id,
            "nombre": c.nombre,
            "descripcion": c.descripcion,
            "activo": c.activo,
        }
        for c in carreras
    ]
    return jsonify(resultado), 200


# 📌 Crear carrera
@carreras_bp.route("/", methods=["POST"])
@jwt_required()
@admin_required
def crear_carrera():
    data = request.get_json()
    if not data or "nombre" not in data:
        return jsonify({"error": "Falta el nombre de la carrera"}), 400

    carrera = Carrera(
        nombre=data["nombre"],
        descripcion=data.get("descripcion"),
        activo=True,
    )
    db.session.add(carrera)
    db.session.commit()

    return jsonify({"mensaje": "Carrera creada correctamente", "id": carrera.id}), 201


# 📌 Editar carrera
@carreras_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
@admin_required
def editar_carrera(id):
    carrera = Carrera.query.get(id)
    if not carrera or not carrera.activo:
        return jsonify({"error": "Carrera no encontrada"}), 404

    data = request.get_json()
    carrera.nombre = data.get("nombre", carrera.nombre)
    carrera.descripcion = data.get("descripcion", carrera.descripcion)

    db.session.commit()
    return jsonify({"mensaje": "Carrera actualizada correctamente"}), 200


# 📌 Baja lógica
@carreras_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
@admin_required
def eliminar_carrera(id):
    carrera = Carrera.query.get(id)
    if not carrera or not carrera.activo:
        return jsonify({"error": "Carrera no encontrada"}), 404

    carrera.activo = False
    db.session.commit()

    return jsonify({"mensaje": "Carrera dada de baja correctamente"}), 200


# 📌 Reactivar carrera
@carreras_bp.route("/reactivar/<int:id>", methods=["PUT"])
@jwt_required()
@admin_required
def reactivar_carrera(id):
    carrera = Carrera.query.get(id)
    if not carrera:
        return jsonify({"error": "Carrera no encontrada"}), 404
    if carrera.activo:
        return jsonify({"mensaje": "Carrera ya estaba activa"}), 200

    carrera.activo = True
    db.session.commit()
    return jsonify({"mensaje": "Carrera reactivada correctamente"}), 200

