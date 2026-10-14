/**
 * Mi Cursada - Feriados Argentina 2026
 * 
 * Calendario de feriados nacionales y días no laborables.
 * Se usa para precargar automáticamente los estados 'Feriado' en asistencias.
 * Fuente: Ministerio del Interior (Ley 27.399 y decretos complementarios).
 * 
 * NOTA: Actualizar cada año con el calendario oficial.
 * Los feriados con tipo 'puente' son feriados puente turísticos (cambian por decreto).
 */

export const feriadosArgentina2026 = [
  { fecha: '2026-01-01', nombre: 'Año Nuevo', tipo: 'inamovible' },
  { fecha: '2026-02-16', nombre: 'Carnaval', tipo: 'inamovible' },
  { fecha: '2026-02-17', nombre: 'Carnaval', tipo: 'inamovible' },
  { fecha: '2026-03-24', nombre: 'Día Nacional de la Memoria por la Verdad y la Justicia', tipo: 'inamovible' },
  { fecha: '2026-04-02', nombre: 'Día del Veterano y de los Caídos en la Guerra de Malvinas', tipo: 'inamovible' },
  { fecha: '2026-04-03', nombre: 'Viernes Santo', tipo: 'inamovible' },
  { fecha: '2026-05-01', nombre: 'Día del Trabajador', tipo: 'inamovible' },
  { fecha: '2026-05-25', nombre: 'Día de la Revolución de Mayo', tipo: 'inamovible' },
  { fecha: '2026-06-15', nombre: 'Paso a la Inmortalidad del Gral. Martín Miguel de Güemes', tipo: 'trasladable' },
  { fecha: '2026-06-20', nombre: 'Paso a la Inmortalidad del Gral. Manuel Belgrano', tipo: 'inamovible' },
  { fecha: '2026-07-09', nombre: 'Día de la Independencia', tipo: 'inamovible' },
  { fecha: '2026-08-17', nombre: 'Paso a la Inmortalidad del Gral. José de San Martín', tipo: 'trasladable' },
  { fecha: '2026-10-12', nombre: 'Día del Respeto a la Diversidad Cultural', tipo: 'trasladable' },
  { fecha: '2026-11-20', nombre: 'Día de la Soberanía Nacional', tipo: 'trasladable' },
  { fecha: '2026-12-08', nombre: 'Inmaculada Concepción de María', tipo: 'inamovible' },
  { fecha: '2026-12-25', nombre: 'Navidad', tipo: 'inamovible' },
];

/**
 * Verifica si una fecha es feriado.
 * @param {string} fecha - formato YYYY-MM-DD
 * @returns {{ esFeriado: boolean, nombre?: string }}
 */
export function esFeriado(fecha) {
  const feriado = feriadosArgentina2026.find(f => f.fecha === fecha);
  return feriado 
    ? { esFeriado: true, nombre: feriado.nombre }
    : { esFeriado: false };
}

/**
 * Obtiene los feriados entre dos fechas.
 * @param {string} desde - formato YYYY-MM-DD
 * @param {string} hasta - formato YYYY-MM-DD
 * @returns {Array}
 */
export function getFeriadosEnRango(desde, hasta) {
  return feriadosArgentina2026.filter(f => f.fecha >= desde && f.fecha <= hasta);
}
