from app import db
from datetime import datetime

class Usuario(db.Model):
    __tablename__ = 'usuarios'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100))
    apellido = db.Column(db.String(100))
    correo = db.Column(db.String(100), unique=True)
    contraseña = db.Column(db.Text)
    rol = db.Column(db.String(20))

    estudiantes = db.relationship('Estudiante', backref='usuario', uselist=False)

class Docente(db.Model):
    __tablename__ = 'docentes'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'), nullable=False)
    usuario = db.relationship('Usuario', backref='docente')

class Curso(db.Model):
    __tablename__ = 'cursos'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100))
    nivel = db.Column(db.String(50))

class Estudiante(db.Model):
    __tablename__ = 'estudiantes'
    id = db.Column(db.Integer, primary_key=True)
    usuario_id = db.Column(db.Integer, db.ForeignKey('usuarios.id'))
    curso_id = db.Column(db.Integer, db.ForeignKey('cursos.id'))
    qr_codigo = db.Column(db.Text, unique=True)

    curso = db.relationship('Curso', backref='estudiantes')

class Materia(db.Model):
    __tablename__ = 'materias'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    curso_id = db.Column(db.Integer, db.ForeignKey('cursos.id'), nullable=False)
    docente_id = db.Column(db.Integer, db.ForeignKey('docentes.id'), nullable=True)

    curso = db.relationship('Curso', backref='materias')
    docente = db.relationship('Docente', backref='materias')

class Clase(db.Model):
    __tablename__ = 'clases'
    id = db.Column(db.Integer, primary_key=True)
    materia_id = db.Column(db.Integer, db.ForeignKey('materias.id'), nullable=False)
    docente_id = db.Column(db.Integer, db.ForeignKey('docentes.id'), nullable=False)
    fecha = db.Column(db.Date, nullable=False)
    hora_inicio = db.Column(db.Time, nullable=False)
    hora_fin = db.Column(db.Time, nullable=False)

    materia = db.relationship('Materia', backref='clases')
    docente = db.relationship('Docente', backref='clases')
    asistencias = db.relationship('RegistrosDeAsistencia', backref='clases', lazy=True)


class EstudiantesMaterias(db.Model):
    __tablename__ = 'estudiantes_materias'
    id = db.Column(db.Integer, primary_key=True)
    estudiante_id = db.Column(db.Integer, db.ForeignKey('estudiantes.id'), nullable=False)
    materia_id = db.Column(db.Integer, db.ForeignKey('materias.id'), nullable=False)
    fecha_alta = db.Column(db.DateTime, default=datetime.now)
    fecha_baja = db.Column(db.DateTime, nullable=True)
    estado = db.Column(db.String(30), default='activo')  # 'activo' o 'baja_por_inasistencia'
    docente_id = db.Column(db.Integer, db.ForeignKey('docentes.id'),nullable=True)  # opcional para registrar la baja

    estudiante = db.relationship('Estudiante', backref='inscripciones')
    materia = db.relationship('Materia', backref='inscriptos')


class RegistrosDeAsistencia(db.Model):
    __tablename__ = 'registros_de_asistencia'

    id = db.Column(db.Integer, primary_key=True)
    estudiante_id = db.Column(db.Integer, db.ForeignKey('estudiantes.id'), nullable=False)
    clase_id = db.Column(db.Integer, db.ForeignKey('clases.id'), nullable=False)
    método_registro = db.Column(db.String(20), nullable=False)  # 'QR' o 'Reconocimiento facial'
    fecha_hora = db.Column(db.DateTime, default=datetime.now)

    estudiante = db.relationship('Estudiante', backref='asistencias')
    #clase = db.relationship('Clase', backref='asistencias')
