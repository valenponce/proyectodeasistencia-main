from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_socketio import SocketIO

db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()
socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")

def create_app():
    app = Flask(__name__)
    app.config.from_object('app.config.Config')

    db.init_app(app)
    jwt.init_app(app)
    bcrypt.init_app(app)
    socketio.init_app(app)

    CORS(app, resources={r"/*": {
        "origins": [
            "https://localhost:5173",
            "https://127.0.0.1:5173",
            "https://192.168.100.11:5173",
            "https://10.167.47.181:5173"
        ]
    }}, supports_credentials=True)

    from app.routes.auth import auth_bp
    from app.routes.usuarios import usuarios_bp
    from app.routes.asistencia import asistencia_bp
    from app.routes.materias import materias_bp
    from app.routes.cursos import cursos_bp
    from app.routes.clases import clases_bp
    from app.routes.inscripciones import inscripciones_bp
    from app.routes.carreras import carreras_bp
    from app.routes.chatbot import chatbot_bp

    app.register_blueprint(auth_bp, url_prefix="/auth")
    app.register_blueprint(usuarios_bp, url_prefix="/usuarios")
    app.register_blueprint(asistencia_bp, url_prefix="/asistencia")
    app.register_blueprint(materias_bp, url_prefix="/materias")
    app.register_blueprint(cursos_bp, url_prefix="/cursos")
    app.register_blueprint(clases_bp, url_prefix="/clases")
    app.register_blueprint(inscripciones_bp, url_prefix='/inscripciones')
    app.register_blueprint(carreras_bp, url_prefix="/carreras")
    app.register_blueprint(chatbot_bp, url_prefix="/chatbot")

    return app
