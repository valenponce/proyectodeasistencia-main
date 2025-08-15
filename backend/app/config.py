import os

class Config:
    SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:admin1234@localhost/asistencia_db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    JWT_SECRET_KEY = 'clave_secreta_segura'
    JWT_VERIFY_SUB = False
    SECRET_KEY = os.environ.get('SECRET_KEY', 'G7x@kZ9vK#kTf9Qw$3x!')
