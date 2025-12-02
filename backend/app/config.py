import os

class Config:
    SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:admin1234@localhost/asistencia_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'clave_secreta_segura'
    JWT_VERIFY_SUB = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'G7x@kZ9vK#kTf9Qw$3x!')

 # === Configuración de Flask-Mail ===
    MAIL_SERVER = os.environ.get("MAIL_SERVER", "smtp.gmail.com")
    MAIL_PORT = int(os.environ.get("MAIL_PORT", "587"))
    MAIL_USE_TLS = os.environ.get("MAIL_USE_TLS", "true").lower() == "true"
    MAIL_USERNAME = os.environ.get("MAIL_USERNAME")  # tu correo
    MAIL_PASSWORD = os.environ.get("MAIL_PASSWORD")  # app password
    MAIL_DEFAULT_SENDER = (
        os.environ.get("MAIL_DEFAULT_NAME", "Sistema de Asistencia"),
        os.environ.get("MAIL_DEFAULT_EMAIL", os.environ.get("MAIL_USERNAME", ""))
    )
    MAIL_SUPPRESS_SEND = os.environ.get("MAIL_SUPPRESS_SEND", "false").lower() == "true"