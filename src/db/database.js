/**
 * Mi Cursada - Servicio de Base de Datos (IndexedDB)
 * 
 * Encapsula toda la lógica de persistencia usando IndexedDB.
 * Las 7 tablas del esquema relacional se mapean a Object Stores:
 * materias, horarios, asistencias, evaluaciones, temas_parcial, companeros, grupos
 * Más una tabla intermedia: grupo_integrantes
 */

const DB_NAME = 'mi_cursada_db';
const DB_VERSION = 1;

let dbInstance = null;

/**
 * Abre (o crea) la base de datos IndexedDB con todas las tablas.
 * @returns {Promise<IDBDatabase>}
 */
export function openDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // --- materias ---
      if (!db.objectStoreNames.contains('materias')) {
        const store = db.createObjectStore('materias', { keyPath: 'id_materia', autoIncrement: true });
        store.createIndex('nombre', 'nombre', { unique: false });
        store.createIndex('cuatrimestre', 'cuatrimestre', { unique: false });
      }
      
      // --- horarios ---
      if (!db.objectStoreNames.contains('horarios')) {
        const store = db.createObjectStore('horarios', { keyPath: 'id_horario', autoIncrement: true });
        store.createIndex('id_materia', 'id_materia', { unique: false });
        store.createIndex('dia_semana', 'dia_semana', { unique: false });
      }
      
      // --- asistencias ---
      if (!db.objectStoreNames.contains('asistencias')) {
        const store = db.createObjectStore('asistencias', { keyPath: 'id_asistencia', autoIncrement: true });
        store.createIndex('id_materia', 'id_materia', { unique: false });
        store.createIndex('fecha', 'fecha', { unique: false });
        store.createIndex('materia_fecha', ['id_materia', 'fecha'], { unique: true });
      }
      
      // --- evaluaciones ---
      if (!db.objectStoreNames.contains('evaluaciones')) {
        const store = db.createObjectStore('evaluaciones', { keyPath: 'id_eval', autoIncrement: true });
        store.createIndex('id_materia', 'id_materia', { unique: false });
        store.createIndex('tipo', 'tipo', { unique: false });
        store.createIndex('fecha_entrega', 'fecha_entrega', { unique: false });
      }
      
      // --- temas_parcial ---
      if (!db.objectStoreNames.contains('temas_parcial')) {
        const store = db.createObjectStore('temas_parcial', { keyPath: 'id_tema', autoIncrement: true });
        store.createIndex('id_eval', 'id_eval', { unique: false });
      }
      
      // --- companeros ---
      if (!db.objectStoreNames.contains('companeros')) {
        const store = db.createObjectStore('companeros', { keyPath: 'id_companero', autoIncrement: true });
        store.createIndex('nombre_completo', ['nombre', 'apellido'], { unique: false });
      }
      
      // --- grupos ---
      if (!db.objectStoreNames.contains('grupos')) {
        const store = db.createObjectStore('grupos', { keyPath: 'id_grupo', autoIncrement: true });
        store.createIndex('id_materia', 'id_materia', { unique: false });
      }
      
      // --- grupo_integrantes (tabla intermedia N:M) ---
      if (!db.objectStoreNames.contains('grupo_integrantes')) {
        const store = db.createObjectStore('grupo_integrantes', { keyPath: 'id', autoIncrement: true });
        store.createIndex('id_grupo', 'id_grupo', { unique: false });
        store.createIndex('id_companero', 'id_companero', { unique: false });
        store.createIndex('grupo_companero', ['id_grupo', 'id_companero'], { unique: true });
      }
    };
    
    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };
  });
}

// ============================
// Operaciones genéricas CRUD
// ============================

/**
 * Agrega un registro a un Object Store.
 * @param {string} storeName 
 * @param {Object} data 
 * @returns {Promise<number>} El ID generado
 */
export async function addRecord(storeName, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.add(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Actualiza un registro existente.
 * @param {string} storeName 
 * @param {Object} data - Debe incluir la keyPath (ej: id_materia)
 * @returns {Promise<void>}
 */
export async function updateRecord(storeName, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.put(data);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Elimina un registro por su clave primaria.
 * @param {string} storeName 
 * @param {number} id 
 * @returns {Promise<void>}
 */
export async function deleteRecord(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/**
 * Obtiene un registro por su clave primaria.
 * @param {string} storeName 
 * @param {number} id 
 * @returns {Promise<Object|undefined>}
 */
export async function getRecord(storeName, id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Obtiene todos los registros de un Object Store.
 * @param {string} storeName 
 * @returns {Promise<Object[]>}
 */
export async function getAllRecords(storeName) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Obtiene registros filtrados por un índice.
 * @param {string} storeName 
 * @param {string} indexName 
 * @param {*} value 
 * @returns {Promise<Object[]>}
 */
export async function getByIndex(storeName, indexName, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(value);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Elimina todos los registros filtrados por un índice.
 * @param {string} storeName 
 * @param {string} indexName 
 * @param {*} value 
 * @returns {Promise<void>}
 */
export async function deleteByIndex(storeName, indexName, value) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.openCursor(value);
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        cursor.delete();
        cursor.continue();
      } else {
        resolve();
      }
    };
    request.onerror = () => reject(request.error);
  });
}

// ============================
// Operaciones específicas de dominio
// ============================

/**
 * Calcula el porcentaje de asistencia de una materia, excluyendo
 * feriados y clases suspendidas del denominador.
 * Fórmula: (Presentes / (Presentes + Ausentes)) * 100
 * 
 * @param {number} idMateria 
 * @returns {Promise<{presentes: number, ausentes: number, descontados: number, porcentaje: number, totalClases: number}>}
 */
export async function calcularAsistencia(idMateria) {
  const asistencias = await getByIndex('asistencias', 'id_materia', idMateria);
  
  const presentes = asistencias.filter(a => a.estado === 'Presente').length;
  const ausentes = asistencias.filter(a => a.estado === 'Ausente').length;
  const descontados = asistencias.filter(a => a.estado === 'Feriado' || a.estado === 'Sin_Clase').length;
  const totalClases = presentes + ausentes; // Solo clases efectivamente dictadas
  
  const porcentaje = totalClases > 0 
    ? Math.round((presentes / totalClases) * 10000) / 100 
    : 100; // Si no hay clases aún, 100%
  
  return { presentes, ausentes, descontados, porcentaje, totalClases };
}

/**
 * Registra asistencia para una materia en una fecha.
 * Si ya existe, la actualiza. Si no, la crea.
 * 
 * @param {number} idMateria 
 * @param {string} fecha - formato YYYY-MM-DD
 * @param {string} estado - 'Presente', 'Ausente', 'Feriado', 'Sin_Clase'
 * @returns {Promise<number>}
 */
export async function registrarAsistencia(idMateria, fecha, estado) {
  const db = await openDB();
  
  // Buscar si ya existe una asistencia para esa materia en esa fecha
  const existentes = await getByIndex('asistencias', 'id_materia', idMateria);
  const existente = existentes.find(a => a.fecha === fecha);
  
  if (existente) {
    existente.estado = estado;
    return updateRecord('asistencias', existente);
  } else {
    return addRecord('asistencias', { id_materia: idMateria, fecha, estado });
  }
}

/**
 * Obtiene las materias que tienen horario en un día específico de la semana.
 * @param {number} diaSemana - 1 (Lunes) a 7 (Domingo)
 * @returns {Promise<Array<{materia: Object, horarios: Object[]}>>}
 */
export async function getMateriasPorDia(diaSemana) {
  const horarios = await getByIndex('horarios', 'dia_semana', diaSemana);
  const materias = await getAllRecords('materias');
  
  const resultado = [];
  const materiasMap = new Map(materias.map(m => [m.id_materia, m]));
  
  // Agrupar horarios por materia
  const horariosPorMateria = new Map();
  for (const h of horarios) {
    if (!horariosPorMateria.has(h.id_materia)) {
      horariosPorMateria.set(h.id_materia, []);
    }
    horariosPorMateria.get(h.id_materia).push(h);
  }
  
  for (const [idMateria, hrs] of horariosPorMateria) {
    const materia = materiasMap.get(idMateria);
    if (materia) {
      resultado.push({ materia, horarios: hrs.sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio)) });
    }
  }
  
  // Ordenar por hora de inicio de la primera clase
  resultado.sort((a, b) => a.horarios[0].hora_inicio.localeCompare(b.horarios[0].hora_inicio));
  
  return resultado;
}

/**
 * Obtiene las evaluaciones próximas (futuras) ordenadas por fecha.
 * @param {number} [limit=10] - Cantidad máxima de resultados
 * @returns {Promise<Array<{eval: Object, materia: Object, diasRestantes: number}>>}
 */
export async function getEvaluacionesProximas(limit = 10) {
  const evaluaciones = await getAllRecords('evaluaciones');
  const materias = await getAllRecords('materias');
  const materiasMap = new Map(materias.map(m => [m.id_materia, m]));
  
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  return evaluaciones
    .filter(e => {
      if (!e.fecha_entrega) return false;
      const fechaEval = new Date(e.fecha_entrega + 'T00:00:00');
      return fechaEval >= hoy;
    })
    .map(e => {
      const fechaEval = new Date(e.fecha_entrega + 'T00:00:00');
      const diasRestantes = Math.ceil((fechaEval - hoy) / (1000 * 60 * 60 * 24));
      return {
        eval: e,
        materia: materiasMap.get(e.id_materia),
        diasRestantes
      };
    })
    .sort((a, b) => a.diasRestantes - b.diasRestantes)
    .slice(0, limit);
}

/**
 * Obtiene la condición académica de una materia basándose en sus notas.
 * - Promocionado: promedio >= 7 y todas las notas >= 6
 * - Regular: promedio >= 4
 * - En riesgo: promedio < 4 o más de 2 ausencias seguidas
 * @param {number} idMateria 
 * @returns {Promise<{promedio: number, condicion: string, notas: Object[]}>}
 */
export async function getCondicionMateria(idMateria) {
  const evaluaciones = await getByIndex('evaluaciones', 'id_materia', idMateria);
  const conNota = evaluaciones.filter(e => e.nota !== null && e.nota !== undefined && e.nota !== '');
  
  if (conNota.length === 0) {
    return { promedio: 0, condicion: 'Sin evaluar', notas: evaluaciones };
  }
  
  const notas = conNota.map(e => parseFloat(e.nota));
  const promedio = Math.round((notas.reduce((s, n) => s + n, 0) / notas.length) * 100) / 100;
  const todasAprobadas = notas.every(n => n >= 6);
  
  let condicion;
  if (promedio >= 7 && todasAprobadas) {
    condicion = 'Promocionado';
  } else if (promedio >= 4) {
    condicion = 'Regular';
  } else {
    condicion = 'En riesgo';
  }
  
  return { promedio, condicion, notas: evaluaciones };
}

/**
 * Obtiene los integrantes de un grupo.
 * @param {number} idGrupo 
 * @returns {Promise<Object[]>} Lista de compañeros
 */
export async function getIntegrantesGrupo(idGrupo) {
  const relaciones = await getByIndex('grupo_integrantes', 'id_grupo', idGrupo);
  const companeros = [];
  for (const rel of relaciones) {
    const comp = await getRecord('companeros', rel.id_companero);
    if (comp) companeros.push(comp);
  }
  return companeros;
}

/**
 * Agrega un compañero a un grupo.
 * @param {number} idGrupo 
 * @param {number} idCompanero 
 * @returns {Promise<number>}
 */
export async function agregarIntegrante(idGrupo, idCompanero) {
  return addRecord('grupo_integrantes', { id_grupo: idGrupo, id_companero: idCompanero });
}

/**
 * Elimina un compañero de un grupo.
 * @param {number} idGrupo 
 * @param {number} idCompanero 
 * @returns {Promise<void>}
 */
export async function eliminarIntegrante(idGrupo, idCompanero) {
  const relaciones = await getByIndex('grupo_integrantes', 'id_grupo', idGrupo);
  const rel = relaciones.find(r => r.id_companero === idCompanero);
  if (rel) {
    return deleteRecord('grupo_integrantes', rel.id);
  }
}

/**
 * Exporta todos los datos como JSON (para backup).
 * @returns {Promise<Object>}
 */
export async function exportarDatos() {
  const stores = ['materias', 'horarios', 'asistencias', 'evaluaciones', 'temas_parcial', 'companeros', 'grupos', 'grupo_integrantes'];
  const data = {};
  for (const store of stores) {
    data[store] = await getAllRecords(store);
  }
  data._exportDate = new Date().toISOString();
  data._version = DB_VERSION;
  return data;
}

/**
 * Importa datos desde un JSON de backup.
 * @param {Object} data 
 * @returns {Promise<void>}
 */
export async function importarDatos(data) {
  const stores = ['materias', 'horarios', 'asistencias', 'evaluaciones', 'temas_parcial', 'companeros', 'grupos', 'grupo_integrantes'];
  const db = await openDB();
  
  for (const storeName of stores) {
    if (!data[storeName]) continue;
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    for (const record of data[storeName]) {
      store.add(record);
    }
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }
}

/**
 * Borra todos los registros de todos los object stores.
 * @returns {Promise<void>}
 */
export async function limpiarBaseDatos() {
  const stores = ['materias', 'horarios', 'asistencias', 'evaluaciones', 'temas_parcial', 'companeros', 'grupos', 'grupo_integrantes'];
  const db = await openDB();
  for (const storeName of stores) {
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    store.clear();
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  }
}
