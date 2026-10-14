/**
 * Mi Cursada - Datos de prueba (Demo Seed)
 * 
 * Permite inicializar la aplicación con datos universitarios realistas
 * para probar todas las vistas y funciones inmediatamente.
 */

export const SAMPLE_DATA = {
  materias: [
    { id_materia: 1, nombre: 'Algoritmos y Estructuras de Datos', profesor: 'Lic. Martín Gómez', cuatrimestre: '1° Cuatrimestre 2026', pct_minimo_asistencia: 75 },
    { id_materia: 2, nombre: 'Bases de Datos I', profesor: 'Ing. Valeria Roldán', cuatrimestre: '1° Cuatrimestre 2026', pct_minimo_asistencia: 80 },
    { id_materia: 3, nombre: 'Arquitectura de Computadores', profesor: 'Dr. Roberto Rossi', cuatrimestre: '1° Cuatrimestre 2026', pct_minimo_asistencia: 75 },
    { id_materia: 4, nombre: 'Probabilidad y Estadística', profesor: 'Lic. Mariana Duarte', cuatrimestre: '1° Cuatrimestre 2026', pct_minimo_asistencia: 75 }
  ],
  horarios: [
    { id_horario: 1, id_materia: 1, dia_semana: 1, hora_inicio: '18:30', hora_fin: '21:30', aula: 'Aula 304' },
    { id_horario: 2, id_materia: 1, dia_semana: 3, hora_inicio: '18:30', hora_fin: '21:30', aula: 'Laboratorio 2' },
    { id_horario: 3, id_materia: 2, dia_semana: 2, hora_inicio: '18:00', hora_fin: '22:00', aula: 'Laboratorio 3' },
    { id_horario: 4, id_materia: 3, dia_semana: 4, hora_inicio: '19:00', hora_fin: '22:00', aula: 'Aula Magna' },
    { id_horario: 5, id_materia: 4, dia_semana: 5, hora_inicio: '17:30', hora_fin: '20:30', aula: 'Aula 102' }
  ],
  asistencias: [
    // Algoritmos (80%)
    { id_asistencia: 1, id_materia: 1, fecha: '2026-09-07', estado: 'Presente' },
    { id_asistencia: 2, id_materia: 1, fecha: '2026-09-09', estado: 'Presente' },
    { id_asistencia: 3, id_materia: 1, fecha: '2026-09-14', estado: 'Ausente' },
    { id_asistencia: 4, id_materia: 1, fecha: '2026-09-16', estado: 'Presente' },
    { id_asistencia: 5, id_materia: 1, fecha: '2026-09-21', estado: 'Presente' },
    // Bases de Datos (100%)
    { id_asistencia: 6, id_materia: 2, fecha: '2026-09-08', estado: 'Presente' },
    { id_asistencia: 7, id_materia: 2, fecha: '2026-09-15', estado: 'Presente' },
    { id_asistencia: 8, id_materia: 2, fecha: '2026-09-22', estado: 'Presente' },
    { id_asistencia: 9, id_materia: 2, fecha: '2026-09-29', estado: 'Presente' },
    // Arquitectura (60% - En riesgo!)
    { id_asistencia: 10, id_materia: 3, fecha: '2026-09-03', estado: 'Presente' },
    { id_asistencia: 11, id_materia: 3, fecha: '2026-09-10', estado: 'Ausente' },
    { id_asistencia: 12, id_materia: 3, fecha: '2026-09-17', estado: 'Ausente' },
    { id_asistencia: 13, id_materia: 3, fecha: '2026-09-24', estado: 'Presente' },
    { id_asistencia: 14, id_materia: 3, fecha: '2026-10-01', estado: 'Presente' },
    // Probabilidad (100% asistencias válidas, 1 feriado no descuenta)
    { id_asistencia: 15, id_materia: 4, fecha: '2026-09-04', estado: 'Presente' },
    { id_asistencia: 16, id_materia: 4, fecha: '2026-09-11', estado: 'Presente' },
    { id_asistencia: 17, id_materia: 4, fecha: '2026-09-18', estado: 'Presente' },
    { id_asistencia: 18, id_materia: 4, fecha: '2026-09-25', estado: 'Feriado' }
  ],
  evaluaciones: [
    { id_eval: 1, id_materia: 2, tipo: 'Parcial', titulo: '1° Parcial Modelo y Álgebra Relacional', fecha_entrega: '2026-10-20', nota: null },
    { id_eval: 2, id_materia: 1, tipo: 'TP', titulo: 'TP Integrador Estructuras Dinámicas', fecha_entrega: '2026-10-28', nota: null },
    { id_eval: 3, id_materia: 3, tipo: 'Parcial', titulo: '1° Parcial Conjunto de Instrucciones y MIPS', fecha_entrega: '2026-09-25', nota: 8 },
    { id_eval: 4, id_materia: 4, tipo: 'TP', titulo: 'TP Análisis Estadístico en Python', fecha_entrega: '2026-10-08', nota: 9 }
  ],
  temas_parcial: [
    { id_tema: 1, id_eval: 1, tema: 'Modelo Entidad-Relación y Relacional' },
    { id_tema: 2, id_eval: 1, tema: 'Álgebra Relacional (Proyección, Selección, Join)' },
    { id_tema: 3, id_eval: 1, tema: 'SQL DDL y DML avanzado' },
    { id_tema: 4, id_eval: 1, tema: 'Normalización (1FN, 2FN, 3FN, BCNF)' }
  ],
  companeros: [
    { id_companero: 1, nombre: 'Lucas', apellido: 'Fernández', email: 'lucas.fernandez@alumnos.edu.ar', telefono: '5491155551234', materias_compartidas: 'Algoritmos, Bases de Datos' },
    { id_companero: 2, nombre: 'Sofía', apellido: 'Martínez', email: 'sofia.martinez@alumnos.edu.ar', telefono: '5491155556789', materias_compartidas: 'Algoritmos, Arquitectura' },
    { id_companero: 3, nombre: 'Agustín', apellido: 'Benítez', email: 'agustin.b@alumnos.edu.ar', telefono: '5491155554321', materias_compartidas: 'Bases de Datos' },
    { id_companero: 4, nombre: 'Camila', apellido: 'López', email: 'camila.l@alumnos.edu.ar', telefono: '5491155559876', materias_compartidas: 'Probabilidad y Estadística' }
  ],
  grupos: [
    { id_grupo: 1, id_materia: 1, nombre_grupo: 'Grupo 4 - TP Algoritmos', tema_tp: 'Simulador de Memoria Caché con Grafos' },
    { id_grupo: 2, id_materia: 2, nombre_grupo: 'Grupo SQL - Normalización', tema_tp: 'Sistema de Gestión de Turnos Médicos' }
  ],
  grupo_integrantes: [
    { id: 1, id_grupo: 1, id_companero: 1 },
    { id: 2, id_grupo: 1, id_companero: 2 },
    { id: 3, id_grupo: 2, id_companero: 1 },
    { id: 4, id_grupo: 2, id_companero: 3 }
  ]
};
