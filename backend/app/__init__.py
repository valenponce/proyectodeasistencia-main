from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS

db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()

def create_app():
    app = Flask(__name__)
    app.config.from_object('app.config.Config')

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)

    # Habilitar CORS para permitir frontend desde localhost:5173
    #CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}}, supports_credentials=True)
    CORS(app, resources={r"/*": {"origins": ["http://localhost:5173", "http://192.168.100.11:5173"]}}, supports_credentials=True)


    # Registrar Blueprints
    from app.routes.auth import auth_bp
    from app.routes.usuarios import usuarios_bp
    from app.routes.asistencia import asistencia_bp
    from app.routes.materias import materias_bp
    from app.routes.cursos import cursos_bp
    from app.routes.clases import clases_bp
    from app.routes.inscripciones import inscripciones_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(usuarios_bp, url_prefix="/usuarios")
    app.register_blueprint(asistencia_bp, url_prefix="/asistencia")
    app.register_blueprint(materias_bp, url_prefix="/materias")
    app.register_blueprint(cursos_bp, url_prefix="/cursos")
    app.register_blueprint(clases_bp, url_prefix="/clases")
    app.register_blueprint(inscripciones_bp, url_prefix='/inscripciones')

    return app