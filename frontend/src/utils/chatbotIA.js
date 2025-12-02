// ====== CHATBOT INTELIGENTE CON ROLES ======

export function normalizar(texto) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

// ======================================================
// BASE DE CONOCIMIENTO ESPECÍFICA POR ROL
// ======================================================
const conocimientoPorRol = {
  administrador: {
    inscripcion: {
      respuestas: [
        "Para inscribir un alumno, ve a *Materias → Inscribir estudiante*. Allí eliges la materia y el alumno.",
        "Desde *Materias*, presiona *Inscribir estudiante*. Seleccionas alumno y listo.",
        "Los administradores inscriben alumnos desde la vista *Materias*, botón azul."
      ],
      keywords: ["inscribir", "inscripcion", "anotar alumno", "agregar alumno", "poner alumno"]
    },
    crear_materia: {
      respuestas: [
        "Puedes crear una materia desde *Materias → Crear nueva materia*.",
        "En la sección *Materias*, usa el botón verde para crear una nueva materia.",
        "Para agregar una materia: ve a *Materias* y toca 'Crear nueva materia'."
      ],
      keywords: ["crear materia", "nueva materia", "agregar materia"]
    },
    usuarios: {
      respuestas: [
        "Puedes gestionar usuarios en *Usuarios*. Allí puedes crear, editar o eliminar.",
        "La administración de usuarios está en la sección *Usuarios*.",
        "Para modificar usuarios, abre la pestaña *Usuarios*."
      ],
      keywords: ["usuarios", "crear usuario", "editar usuario", "eliminar usuario"]
    },
    reportes: {
      respuestas: [
        "Los reportes están en *Reportes*, donde puedes filtrar por fechas y materias.",
        "Para ver reportes generales o por materia, abre la pestaña *Reportes*.",
        "Desde *Reportes* puedes descargar y visualizar datos de asistencia."
      ],
      keywords: ["reporte", "reporte asistencia", "estadisticas", "informes"]
    },
    ayuda: {
      respuestas: [
        "Puedo ayudarte con: inscripciones, materias, usuarios y reportes.",
        "¿Qué deseas hacer? Puedo ayudarte a gestionar usuarios, materias y asistencia.",
        "Estoy aquí para ayudarte con toda la gestión del sistema."
      ],
      keywords: ["ayuda", "que puedo", "no entiendo", "como hago"]
    }
  },

  docente: {
    asistencia: {
      respuestas: [
        "Puedes ver la asistencia en *Asistencia*. Se actualiza en tiempo real.",
        "En la vista *Asistencia*, verás presentes, ausentes y tardanzas.",
        "Los alumnos aparecen automáticamente cuando escanean el QR."
      ],
      keywords: ["asistencia", "presentes", "ausentes", "tardanza", "qr", "clase"]
    },
    crear_clase: {
      respuestas: [
        "Para crear una clase, ve a *Clases → Crear Clase*. Selecciona la materia y horario.",
        "Puedes crear clases desde la pestaña *Clases* con el botón 'Crear Clase'.",
        "Las clases se gestionan desde la sección *Clases* del panel docente."
      ],
      keywords: ["crear clase", "nueva clase", "generar clase"]
    },
    qr: {
      respuestas: [
        "Puedes generar el QR de una clase desde *Clases*, con el botón 'Generar QR'.",
        "El QR permite a los alumnos marcar su asistencia de forma automática.",
        "Cada clase tiene su propio QR que puedes mostrar antes de empezar."
      ],
      keywords: ["qr", "codigo", "generar qr"]
    },
    alumnos: {
      respuestas: [
        "Puedes ver la lista de alumnos presentes en la vista *Asistencia*.",
        "Los alumnos aparecen automáticamente al escanear el QR.",
        "Si un alumno falta, lo verás reflejado como *ausente*."
      ],
      keywords: ["alumno", "lista", "presente", "ausente", "tardanza"]
    },
    ayuda: {
      respuestas: [
        "Soy tu asistente docente. Puedo ayudarte con QR, clases y asistencia.",
        "Puedes preguntarme sobre clases, asistencia, QR y alumnos.",
        "Estoy aquí para ayudarte con la gestión diaria de tus clases."
      ],
      keywords: ["ayuda", "no entiendo", "explica"]
    }
  },

  estudiante: {
    escanear: {
      respuestas: [
        "Para marcar asistencia, ve a *Escanear QR* y apunta la cámara al código.",
        "Tu asistencia se registra automáticamente escaneando el QR de tu docente.",
        "Presiona *Escanear QR* desde tu panel de materias."
      ],
      keywords: ["escaneo", "qr", "asistencia", "escanear", "codigo"]
    },
    materias: {
      respuestas: [
        "Puedes ver tus materias en la sección *Materias*. Allí está el botón para escanear QR.",
        "Tus materias asignadas aparecen en *Materias* junto a la opción 'Escanear QR'.",
        "La lista de tus materias está siempre actualizada en la sección *Materias*."
      ],
      keywords: ["materias", "clases", "asignaturas"]
    },
    asistencia: {
      respuestas: [
        "Tu asistencia se registra sola al escanear el QR.",
        "Si quieres ver tu historial, está en *Historial*.",
        "El sistema registra fecha y hora exacta de tu asistencia."
      ],
      keywords: ["asistencia", "fui", "presente", "faltas", "historial"]
    },
    ayuda: {
      respuestas: [
        "Puedo ayudarte a escanear el QR, ver tus materias o tu asistencia.",
        "Pregúntame sobre cómo escanear, materias o historial.",
        "Estoy aquí para ayudarte. ¿Qué necesitas?"
      ],
      keywords: ["ayuda", "no se", "como hago"]
    }
  }
};

// ======================================================
// IA con detección de rol + intención
// ======================================================
export function detectarIntencionPorRol(texto, rol) {
  const limpio = normalizar(texto);
  const dataRol = conocimientoPorRol[rol] || conocimientoPorRol["estudiante"];

  let mejorIntento = "ayuda";
  let mejorScore = 0;

  for (const intento in dataRol) {
    for (const key of dataRol[intento].keywords) {
      let score = similitud(limpio, normalizar(key));
      if (score > mejorScore) {
        mejorScore = score;
        mejorIntento = intento;
      }
    }
  }

  return mejorIntento;
}

function similitud(a, b) {
  let s1 = new Set(a.split(" "));
  let s2 = new Set(b.split(" "));
  return [...s1].filter(x => s2.has(x)).length / Math.max(s1.size, s2.size);
}

export function responderInteligente(rol, intento) {
  const dataRol = conocimientoPorRol[rol] || conocimientoPorRol["estudiante"];
  const respuestas = dataRol[intento]?.respuestas || dataRol["ayuda"].respuestas;

  return respuestas[Math.floor(Math.random() * respuestas.length)];
}
