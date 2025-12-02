from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy.orm import joinedload
from app import db
from app.models import Materia, Docente, Usuario, Curso
from app.utils.security import admin_required, rol_requerido, docente_required
import pandas as pd

materias_bp = Blueprint("materias", __name__)


# ================================================================
# LISTAR MATERIAS (ADMIN y DOCENTE)
# ================================================================
@materias_bp.route("/", methods=["GET"])
@jwt_required()
@docente_required   # permite docentes y administradores (ya funciona para ambos)
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



# ================================================================
# CREAR MATERIA (SOLO ADMIN)
# ================================================================
@materias_bp.route("/", methods=["POST"])
@jwt_required()
@admin_required
def crear_materia():
    data = request.json

    if "nombre" not in data or "curso_id" not in data or "docente_id" not in data:
        return jsonify({"error": "Faltan datos obligatorios"}), 400

    curso = Curso.query.get(data["curso_id"])
    docente = Docente.query.get(data["docente_id"])

    if not curso:
        return jsonify({"error": "Curso no encontrado"}), 404
    if not docente:
        return jsonify({"error": "Docente no encontrado"}), 404

    materia = Materia(
        nombre=data["nombre"],
        curso_id=data["curso_id"],
        docente_id=data["docente_id"]
    )

    db.session.add(materia)
    db.session.commit()

    return jsonify({"mensaje": "Materia creada correctamente"}), 201



# ================================================================
# EDITAR MATERIA (SOLO ADMIN)
# ================================================================
@materias_bp.route("/<int:id>", methods=["PUT"])
@jwt_required()
@admin_required
def editar_materia(id):
    materia = Materia.query.get_or_404(id)
    data = request.json

    materia.nombre = data.get("nombre", materia.nombre)
    materia.docente_id = data.get("docente_id", materia.docente_id)

    db.session.commit()
    return jsonify({"mensaje": "Materia actualizada"}), 200



# ================================================================
# ELIMINAR MATERIA (SOLO ADMIN)
# ================================================================
@materias_bp.route("/<int:id>", methods=["DELETE"])
@jwt_required()
@admin_required
def eliminar_materia(id):
    materia = Materia.query.get_or_404(id)

    # Antes de borrar, eliminar relaciones para evitar error de integridad:
    from app.models import Clase, EstudiantesMaterias

    # Eliminar clases relacionadas
    Clase.query.filter_by(materia_id=id).delete()

    # Eliminar inscripciones relacionadas
    EstudiantesMaterias.query.filter_by(materia_id=id).delete()

    db.session.delete(materia)
    db.session.commit()

    return jsonify({"mensaje": "Materia eliminada"}), 200



# ================================================================
# AUTOCOMPLETAR
# ================================================================
@materias_bp.route("/autocompletar", methods=["GET"])
@jwt_required()
def autocompletar_materias():
    termino = request.args.get("busqueda", "")

    if not termino:
        return jsonify([])

    materias = Materia.query.filter(
        Materia.nombre.ilike(f"%{termino}%")
    ).limit(10).all()

    resultados = []
    for m in materias:
        resultados.append({
            "id": m.id,
            "nombre": m.nombre,
            "curso": m.curso.nombre if m.curso else None,
            "docente": (
                f"{m.docente.usuario.nombre} {m.docente.usuario.apellido}"
                if m.docente and m.docente.usuario else None
            )
        })

    return jsonify(resultados), 200



# ================================================================
# MATERIAS DEL DOCENTE LOGEADO
# ================================================================
@materias_bp.route("/docente", methods=["GET"])
@jwt_required()
@docente_required
def obtener_materias_del_docente():
    identidad = get_jwt_identity()
    docente = Docente.query.filter_by(usuario_id=identidad["id"]).first()

    if not docente:
        return jsonify({"error": "Docente no encontrado"}), 404

    materias = Materia.query.filter_by(docente_id=docente.id).all()

    resultado = []
    for m in materias:
        resultado.append({
            "id": m.id,
            "nombre": m.nombre,
            "curso": m.curso.nombre if m.curso else "Sin curso"
        })

    return jsonify(resultado), 200



# ================================================================
# MATERIAS DEL ESTUDIANTE (FORMATO QUE USA TU FRONTEND)
# ================================================================
@materias_bp.route("/estudiante/<int:usuario_id>", methods=["GET"])
@jwt_required()
@rol_requerido("estudiante")
def materias_del_estudiante(usuario_id):
    from app.models import Estudiante, EstudiantesMaterias

    estudiante = Estudiante.query.filter_by(usuario_id=usuario_id).first()

    if not estudiante:
        return jsonify({"error": "Estudiante no encontrado"}), 404

    inscripciones = EstudiantesMaterias.query.filter_by(
        estudiante_id=estudiante.id,
        estado="activo"
    ).all()

    resultado = []

    for insc in inscripciones:
        materia = insc.materia
        if materia is None:
            continue

        resultado.append({
            "materia_id": materia.id,
            "materia_nombre": materia.nombre,
            "curso": materia.curso.nombre if materia.curso else "Sin curso",
            "docente": {
                "nombre": materia.docente.usuario.nombre
                if materia.docente and materia.docente.usuario else None,

                "apellido": materia.docente.usuario.apellido
                if materia.docente and materia.docente.usuario else None
            }
        })

    return jsonify(resultado), 200



# ================================================================
# IMPORTAR EXCEL
# ================================================================
@materias_bp.route("/importar_excel", methods=["POST"])
@jwt_required()
@admin_required
def importar_excel():
    if "file" not in request.files:
        return jsonify({"error": "No se envió archivo"}), 400

    file = request.files["file"]

    if not file.filename.endswith((".xlsx", ".csv")):
        return jsonify({"error": "Formato inválido"}), 400

    try:
        df = pd.read_csv(file) if file.filename.endswith(".csv") else pd.read_excel(file)

        columnas_requeridas = {"nombre", "curso_id", "docente_id"}
        if not columnas_requeridas.issubset(df.columns):
            return jsonify({"error": "Faltan columnas requeridas"}), 400

        materias_creadas = []
        errores = []

        for i, row in df.iterrows():
            try:
                nombre = str(row["nombre"]).strip()
                curso_id = int(row["curso_id"])
                docente_id = int(row["docente_id"])

                curso = Curso.query.get(curso_id)
                docente = Docente.query.get(docente_id)

                if not curso:
                    errores.append({"fila": i+2, "error": f"Curso ID {curso_id} no existe"})
                    continue

                if not docente:
                    errores.append({"fila": i+2, "error": f"Docente ID {docente_id} no existe"})
                    continue

                materia = Materia(nombre=nombre, curso_id=curso_id, docente_id=docente_id)
                db.session.add(materia)

                materias_creadas.append({
                    "nombre": nombre,
                    "curso": curso.nombre,
                    "docente": f"{docente.usuario.nombre} {docente.usuario.apellido}"
                })

            except Exception as e:
                errores.append({"fila": i+2, "error": str(e)})

        db.session.commit()

        return jsonify({
            "mensaje": f"{len(materias_creadas)} materias importadas",
            "materias": materias_creadas,
            "errores": errores
        }), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
