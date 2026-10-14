/**
 * Mi Cursada - Aplicación Principal
 * 
 * Organizador académico universitario completo.
 * 4 pestañas: Hoy & Horarios | Materias | Exámenes & TPs | Compañeros & Grupos
 * 
 * Stack: Vanilla JS + IndexedDB + CSS Custom Design System
 * Diseño: Mobile-first, dark mode, glassmorphism
 */

import { 
  openDB, addRecord, updateRecord, deleteRecord, getRecord, getAllRecords, 
  getByIndex, deleteByIndex, calcularAsistencia, registrarAsistencia, 
  getMateriasPorDia, getEvaluacionesProximas, getCondicionMateria,
  getIntegrantesGrupo, agregarIntegrante, eliminarIntegrante,
  exportarDatos, importarDatos, limpiarBaseDatos
} from './db/database.js';

import { icon } from './icons.js';
import { esFeriado } from './data/feriados.js';
import { SAMPLE_DATA } from './data/sample-data.js';

// ============================
// Utilidades
// ============================
const DIAS_SEMANA = ['', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const DIAS_CORTOS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

function getDiaSemanaHoy() {
  const d = new Date().getDay(); // 0 = domingo
  return d === 0 ? 7 : d; // Convertir a 1=Lunes ... 7=Domingo
}

function getFechaHoy() {
  const d = new Date();
  return d.toISOString().split('T')[0]; // YYYY-MM-DD
}

function formatFecha(fechaStr) {
  const d = new Date(fechaStr + 'T00:00:00');
  return `${d.getDate()} ${MESES[d.getMonth()]}`;
}

function diasHasta(fechaStr) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(fechaStr + 'T00:00:00');
  return Math.ceil((fecha - hoy) / (1000 * 60 * 60 * 24));
}

function getProgressClass(porcentaje, minimo) {
  if (porcentaje >= minimo) return 'progress-success';
  if (porcentaje >= minimo - 10) return 'progress-warning';
  return 'progress-danger';
}

function getNotaClass(nota) {
  const n = parseFloat(nota);
  if (n >= 7) return 'nota-alta';
  if (n >= 4) return 'nota-media';
  return 'nota-baja';
}

function getCountdownClass(dias) {
  if (dias <= 3) return 'countdown-urgent';
  if (dias <= 7) return 'countdown-soon';
  return 'countdown-normal';
}

function getCondicionClass(condicion) {
  switch (condicion) {
    case 'Promocionado': return 'condicion-promocionado';
    case 'Regular': return 'condicion-regular';
    case 'En riesgo': return 'condicion-riesgo';
    default: return 'condicion-sin-evaluar';
  }
}

function getInitials(nombre, apellido) {
  return ((nombre || '')[0] || '') + ((apellido || '')[0] || '');
}

// Toast notifications
function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  const iconSvg = type === 'success' ? icon('checkCircle', 18) : icon('alertCircle', 18);
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `${iconSvg}<span>${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

// ============================
// Estado global de la app
// ============================
let currentTab = 'hoy';
let currentView = null; // Para subpantallas (ej. detalle de materia)
let viewParams = {}; // Parámetros de la subpantalla

// ============================
// Router / Navegación
// ============================
function navigateTo(tab, view = null, params = {}) {
  currentTab = tab;
  currentView = view;
  viewParams = params;
  render();
}

function goBack() {
  currentView = null;
  viewParams = {};
  render();
}

// ============================
// Render principal
// ============================
async function render() {
  const app = document.getElementById('app');
  
  let headerHTML = '';
  let contentHTML = '';
  
  if (currentView) {
    // Sub-pantalla con botón atrás
    const titles = {
      'materia-detalle': 'Detalle de materia',
      'materia-form': viewParams.id ? 'Editar materia' : 'Nueva materia',
      'eval-form': viewParams.id_eval ? 'Editar evaluación' : 'Nueva evaluación',
      'eval-temas': 'Temas del parcial',
      'companero-form': viewParams.id ? 'Editar compañero' : 'Nuevo compañero',
      'grupo-form': viewParams.id ? 'Editar grupo' : 'Nuevo grupo',
      'grupo-detalle': 'Detalle del grupo',
      'ajustes': 'Ajustes y Datos',
    };
    
    headerHTML = `
      <header class="header">
        <button class="header-back" onclick="window._goBack()">
          ${icon('chevronLeft', 20)}
          <span>Atrás</span>
        </button>
        <span class="header-title">${titles[currentView] || ''}</span>
        <div class="header-actions"></div>
      </header>
    `;
  } else {
    // Header principal
    const greeting = getGreeting();
    headerHTML = `
      <header class="header">
        <div>
          <div class="header-title">Mi Cursada</div>
          <div class="header-subtitle">${greeting}</div>
        </div>
        <div class="header-actions">
          <button class="btn btn-ghost btn-icon" onclick="window._openSettings()" title="Ajustes y Datos">
            ${icon('settings', 20)}
          </button>
        </div>
      </header>
    `;
  }

  // Renderizar contenido según tab/view
  switch (currentView || currentTab) {
    case 'hoy':
      contentHTML = await renderHoy();
      break;
    case 'materias':
      contentHTML = await renderMaterias();
      break;
    case 'examenes':
      contentHTML = await renderExamenes();
      break;
    case 'companeros':
      contentHTML = await renderCompaneros();
      break;
    // Sub-pantallas
    case 'materia-detalle':
      contentHTML = await renderMateriaDetalle(viewParams.id);
      break;
    case 'materia-form':
      contentHTML = await renderMateriaForm(viewParams.id);
      break;
    case 'eval-form':
      contentHTML = await renderEvalForm(viewParams.id_materia, viewParams.id_eval);
      break;
    case 'eval-temas':
      contentHTML = await renderEvalTemas(viewParams.id_eval);
      break;
    case 'companero-form':
      contentHTML = await renderCompaneroForm(viewParams.id);
      break;
    case 'grupo-form':
      contentHTML = await renderGrupoForm(viewParams.id_materia, viewParams.id);
      break;
    case 'grupo-detalle':
      contentHTML = await renderGrupoDetalle(viewParams.id);
      break;
    case 'ajustes':
      contentHTML = await renderAjustes();
      break;
  }

  // Navigation tabs
  const navHTML = `
    <nav class="bottom-nav" id="bottom-nav">
      <button class="nav-item ${currentTab === 'hoy' && !currentView ? 'active' : ''}" onclick="window._nav('hoy')">
        ${icon('calendar', 22)}
        <span>Hoy</span>
      </button>
      <button class="nav-item ${currentTab === 'materias' && !currentView ? 'active' : ''}" onclick="window._nav('materias')">
        ${icon('bookOpen', 22)}
        <span>Materias</span>
      </button>
      <button class="nav-item ${currentTab === 'examenes' && !currentView ? 'active' : ''}" onclick="window._nav('examenes')">
        ${icon('clipboardList', 22)}
        <span>Exámenes</span>
      </button>
      <button class="nav-item ${currentTab === 'companeros' && !currentView ? 'active' : ''}" onclick="window._nav('companeros')">
        ${icon('users', 22)}
        <span>Grupo</span>
      </button>
    </nav>
  `;

  app.innerHTML = `
    ${headerHTML}
    <main class="main-content animate-fade-in">
      ${contentHTML}
    </main>
    ${navHTML}
    <div id="toast-container" class="toast-container"></div>
  `;
}

function getGreeting() {
  const hour = new Date().getHours();
  const dia = DIAS_SEMANA[getDiaSemanaHoy()];
  const fecha = formatFecha(getFechaHoy());
  if (hour < 12) return `Buenos días · ${dia} ${fecha}`;
  if (hour < 18) return `Buenas tardes · ${dia} ${fecha}`;
  return `Buenas noches · ${dia} ${fecha}`;
}

// ============================
// TAB 1: HOY & HORARIOS
// ============================
async function renderHoy() {
  const diaSemana = getDiaSemanaHoy();
  const hoy = getFechaHoy();
  const feriadoInfo = esFeriado(hoy);
  
  // Obtener materias del día
  const materiasHoy = await getMateriasPorDia(diaSemana);
  
  // Stats rápidas
  const todasMaterias = await getAllRecords('materias');
  const proximasEvals = await getEvaluacionesProximas(3);
  
  let statsHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${materiasHoy.length}</div>
        <div class="stat-label">Clases hoy</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${todasMaterias.length}</div>
        <div class="stat-label">Materias</div>
      </div>
    </div>
  `;

  // Feriado alert
  let feriadoAlert = '';
  if (feriadoInfo.esFeriado) {
    feriadoAlert = `
      <div class="card" style="border-color: rgba(245, 158, 11, 0.3); background: rgba(245, 158, 11, 0.08);">
        <div class="flex items-center gap-3">
          ${icon('sun', 20)}
          <div>
            <div class="font-bold" style="color: var(--warning-400);">🇦🇷 Feriado Nacional</div>
            <div class="text-xs text-muted">${feriadoInfo.nombre}</div>
          </div>
        </div>
      </div>
    `;
  }

  // Lista de materias de hoy con botones de asistencia
  let materiasHTML = '';
  if (materiasHoy.length === 0) {
    materiasHTML = `
      <div class="empty-state">
        ${icon('sun', 64)}
        <div class="empty-state-title">Sin clases hoy</div>
        <div class="empty-state-text">
          ${diaSemana >= 6 ? '¡Es fin de semana! Aprovechá para estudiar o descansar.' : 'No tenés materias registradas para hoy. Agregá materias con sus horarios.'}
        </div>
        ${todasMaterias.length === 0 ? `
          <div class="flex flex-col gap-2 mt-4" style="width: 100%; max-width: 280px; margin-left: auto; margin-right: auto;">
            <button class="btn btn-primary" onclick="window._newMateria()">
              ${icon('plus', 18)} Agregar mi primera materia
            </button>
            <button class="btn btn-secondary" onclick="window._loadSampleData()">
              ✨ Cargar datos de ejemplo
            </button>
          </div>
        ` : ''}
      </div>
    `;
  } else {
    for (const item of materiasHoy) {
      const asistencia = await calcularAsistencia(item.materia.id_materia);
      const asistenciasHoy = await getByIndex('asistencias', 'id_materia', item.materia.id_materia);
      const asistenciaHoy = asistenciasHoy.find(a => a.fecha === hoy);
      const estadoHoy = asistenciaHoy ? asistenciaHoy.estado : null;
      const minAsist = item.materia.pct_minimo_asistencia || 75;
      const progressClass = getProgressClass(asistencia.porcentaje, minAsist);
      
      const horariosStr = item.horarios.map(h => 
        `<div class="materia-horario">${icon('clock', 14)} ${h.hora_inicio} - ${h.hora_fin} ${h.aula ? `<span style="margin-left: 4px">${icon('mapPin', 14)} ${h.aula}</span>` : ''}</div>`
      ).join('');
      
      materiasHTML += `
        <div class="card materia-card animate-slide-up" style="--color: ${getColorForIndex(item.materia.id_materia)}">
          <div class="materia-info">
            <div class="card-header">
              <div class="materia-nombre">${item.materia.nombre}</div>
              <button class="btn btn-ghost btn-icon" onclick="window._viewMateria(${item.materia.id_materia})" title="Ver detalle">
                ${icon('chevronRight', 18)}
              </button>
            </div>
            <div class="materia-profesor">${icon('graduationCap', 12)} ${item.materia.profesor || 'Sin profesor asignado'}</div>
            ${horariosStr}
            
            <div class="progress-container">
              <div class="progress-label">
                <span class="progress-label-text">Asistencia (${asistencia.presentes}/${asistencia.totalClases})</span>
                <span class="progress-label-value" style="color: ${asistencia.porcentaje >= minAsist ? 'var(--success-400)' : asistencia.porcentaje >= minAsist - 10 ? 'var(--warning-400)' : 'var(--danger-400)'}">${asistencia.porcentaje}%</span>
              </div>
              <div class="progress-bar ${progressClass}">
                <div class="progress-fill" style="width: ${asistencia.porcentaje}%"></div>
              </div>
            </div>
            
            <div class="attendance-buttons">
              <button class="att-btn att-btn-presente ${estadoHoy === 'Presente' ? 'selected' : ''}" 
                      onclick="window._marcarAsistencia(${item.materia.id_materia}, 'Presente')">
                ${icon('checkCircle', 20)}
                Presente
              </button>
              <button class="att-btn att-btn-ausente ${estadoHoy === 'Ausente' ? 'selected' : ''}"
                      onclick="window._marcarAsistencia(${item.materia.id_materia}, 'Ausente')">
                ${icon('xCircle', 20)}
                Ausente
              </button>
              <button class="att-btn att-btn-feriado ${(estadoHoy === 'Feriado' || estadoHoy === 'Sin_Clase') ? 'selected' : ''}"
                      onclick="window._marcarAsistencia(${item.materia.id_materia}, 'Sin_Clase')">
                ${icon('sun', 20)}
                Sin clase
              </button>
            </div>
          </div>
        </div>
      `;
    }
  }

  // Próximos exámenes preview
  let proximasHTML = '';
  if (proximasEvals.length > 0) {
    proximasHTML = `
      <div class="section-header">
        <span class="section-title">Próximas entregas</span>
      </div>
    `;
    for (const pe of proximasEvals) {
      const fecha = new Date(pe.eval.fecha_entrega + 'T00:00:00');
      proximasHTML += `
        <div class="card animate-slide-up">
          <div class="exam-card">
            <div class="exam-date-box">
              <div class="exam-date-day">${fecha.getDate()}</div>
              <div class="exam-date-month">${MESES[fecha.getMonth()]}</div>
            </div>
            <div class="exam-info">
              <div class="exam-title">${pe.eval.titulo || pe.eval.tipo}</div>
              <div class="exam-materia">${pe.materia ? pe.materia.nombre : 'Materia no encontrada'}</div>
              <div class="exam-status">
                <span class="badge badge-info">${pe.eval.tipo}</span>
                <span class="countdown-tag ${getCountdownClass(pe.diasRestantes)}">
                  ${pe.diasRestantes === 0 ? '¡HOY!' : pe.diasRestantes === 1 ? '¡MAÑANA!' : `Faltan ${pe.diasRestantes} días`}
                </span>
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }

  return `
    <h1 class="page-title">Hoy · ${DIAS_SEMANA[diaSemana]}</h1>
    <p class="page-subtitle">Registrá tu asistencia y revisá tu día</p>
    ${statsHTML}
    ${feriadoAlert}
    ${materiasHTML}
    ${proximasHTML}
  `;
}

// ============================
// TAB 2: MATERIAS
// ============================
async function renderMaterias() {
  const materias = await getAllRecords('materias');
  
  if (materias.length === 0) {
    return `
      <h1 class="page-title">Materias</h1>
      <p class="page-subtitle">Gestión de cursada y asistencias</p>
      <div class="empty-state">
        ${icon('bookOpen', 64)}
        <div class="empty-state-title">Sin materias aún</div>
        <div class="empty-state-text">Agregá tu primera materia para empezar a organizar tu cursada o cargá datos de ejemplo para probarla.</div>
        <div class="flex flex-col gap-2 mt-4" style="width: 100%; max-width: 280px; margin-left: auto; margin-right: auto;">
          <button class="btn btn-primary" onclick="window._newMateria()">
            ${icon('plus', 18)} Agregar materia
          </button>
          <button class="btn btn-secondary" onclick="window._loadSampleData()">
            ✨ Cargar datos de ejemplo
          </button>
        </div>
      </div>
    `;
  }
  
  let listHTML = '';
  for (const m of materias) {
    const asist = await calcularAsistencia(m.id_materia);
    const condicion = await getCondicionMateria(m.id_materia);
    const minAsist = m.pct_minimo_asistencia || 75;
    const progressClass = getProgressClass(asist.porcentaje, minAsist);
    const horarios = await getByIndex('horarios', 'id_materia', m.id_materia);
    
    const diasStr = horarios.map(h => DIAS_CORTOS[h.dia_semana]).filter((v, i, a) => a.indexOf(v) === i).join(', ');
    
    listHTML += `
      <div class="card materia-card card-clickable animate-slide-up" onclick="window._viewMateria(${m.id_materia})">
        <div class="materia-info">
          <div class="card-header">
            <div>
              <div class="materia-nombre">${m.nombre}</div>
              <div class="materia-profesor">${m.profesor || ''} ${diasStr ? `· ${diasStr}` : ''}</div>
            </div>
            <div class="flex items-center gap-2">
              <span class="${getCondicionClass(condicion.condicion)} condicion-indicator" style="font-size: 0.625rem; padding: 3px 8px;">
                ${condicion.condicion}
              </span>
              ${icon('chevronRight', 18)}
            </div>
          </div>
          
          <div class="progress-container" style="margin-top: 4px;">
            <div class="progress-label">
              <span class="progress-label-text">Asistencia</span>
              <span class="progress-label-value" style="color: ${asist.porcentaje >= minAsist ? 'var(--success-400)' : 'var(--danger-400)'}">${asist.porcentaje}%</span>
            </div>
            <div class="progress-bar ${progressClass}">
              <div class="progress-fill" style="width: ${Math.min(asist.porcentaje, 100)}%"></div>
            </div>
          </div>
          
          ${condicion.promedio > 0 ? `
            <div class="flex items-center gap-2 mt-2">
              <span class="text-xs text-muted">Promedio:</span>
              <span class="badge ${condicion.promedio >= 7 ? 'badge-success' : condicion.promedio >= 4 ? 'badge-warning' : 'badge-danger'}">${condicion.promedio}</span>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  return `
    <h1 class="page-title">Materias</h1>
    <p class="page-subtitle">${materias.length} materia${materias.length !== 1 ? 's' : ''} registrada${materias.length !== 1 ? 's' : ''}</p>
    ${listHTML}
    <button class="btn btn-fab" onclick="window._newMateria()" title="Agregar materia">
      ${icon('plus', 24)}
    </button>
  `;
}

// --- Detalle de materia ---
async function renderMateriaDetalle(idMateria) {
  const materia = await getRecord('materias', idMateria);
  if (!materia) return '<div class="empty-state"><div class="empty-state-title">Materia no encontrada</div></div>';
  
  const asist = await calcularAsistencia(idMateria);
  const condicion = await getCondicionMateria(idMateria);
  const horarios = await getByIndex('horarios', 'id_materia', idMateria);
  const evaluaciones = await getByIndex('evaluaciones', 'id_materia', idMateria);
  const grupos = await getByIndex('grupos', 'id_materia', idMateria);
  const minAsist = materia.pct_minimo_asistencia || 75;
  const progressClass = getProgressClass(asist.porcentaje, minAsist);
  
  // Horarios
  let horariosHTML = horarios.map(h => `
    <div class="flex items-center gap-2 text-sm" style="padding: 6px 0;">
      <span class="badge badge-info">${DIAS_SEMANA[h.dia_semana]}</span>
      <span>${h.hora_inicio} - ${h.hora_fin}</span>
      ${h.aula ? `<span class="text-muted">${icon('mapPin', 12)} ${h.aula}</span>` : ''}
    </div>
  `).join('');
  
  // Evaluaciones
  let evalsHTML = '';
  if (evaluaciones.length > 0) {
    evalsHTML = evaluaciones.sort((a, b) => (a.fecha_entrega || '').localeCompare(b.fecha_entrega || '')).map(e => {
      const dias = e.fecha_entrega ? diasHasta(e.fecha_entrega) : null;
      return `
        <div class="card" style="padding: 12px;">
          <div class="flex items-center justify-between">
            <div>
              <div class="font-bold text-sm">${e.titulo || e.tipo}</div>
              <div class="text-xs text-muted">
                ${e.tipo} ${e.fecha_entrega ? `· ${formatFecha(e.fecha_entrega)}` : ''}
                ${dias !== null && dias >= 0 ? ` · <span class="countdown-tag ${getCountdownClass(dias)}">${dias === 0 ? '¡HOY!' : `${dias}d`}</span>` : ''}
              </div>
            </div>
            <div class="flex items-center gap-2">
              ${e.nota !== null && e.nota !== undefined && e.nota !== '' ? 
                `<span class="nota-display ${getNotaClass(e.nota)}">${e.nota}</span>` : 
                `<span class="badge badge-muted">Sin nota</span>`}
              ${e.tipo === 'Parcial' ? `<button class="btn btn-ghost btn-icon" onclick="window._viewTemas(${e.id_eval})" title="Ver temas">${icon('fileText', 16)}</button>` : ''}
              <button class="btn btn-ghost btn-icon" onclick="window._editEval(${idMateria}, ${e.id_eval})" title="Editar">${icon('edit', 16)}</button>
              <button class="btn btn-ghost btn-icon" onclick="window._deleteEval(${e.id_eval})" title="Eliminar">${icon('trash', 16)}</button>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }
  
  return `
    <div class="flex items-center justify-between mb-3">
      <h1 class="page-title">${materia.nombre}</h1>
      <div class="flex gap-2">
        <button class="btn btn-ghost btn-icon" onclick="window._editMateria(${idMateria})" title="Editar">${icon('edit', 18)}</button>
        <button class="btn btn-ghost btn-icon" onclick="window._deleteMateria(${idMateria})" title="Eliminar">${icon('trash', 18)}</button>
      </div>
    </div>
    
    <div class="card">
      <div class="materia-profesor mb-2">${icon('graduationCap', 14)} ${materia.profesor || 'Sin profesor'}</div>
      <div class="text-xs text-muted mb-3">Cuatrimestre: ${materia.cuatrimestre || 'No especificado'} · Mínimo asistencia: ${minAsist}%</div>
      
      <span class="${getCondicionClass(condicion.condicion)} condicion-indicator">
        ${condicion.condicion === 'Promocionado' ? '🏆' : condicion.condicion === 'Regular' ? '✅' : condicion.condicion === 'En riesgo' ? '⚠️' : '📋'} 
        ${condicion.condicion}
        ${condicion.promedio > 0 ? ` · Promedio: ${condicion.promedio}` : ''}
      </span>
    </div>
    
    <!-- Asistencia -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">📊 Asistencia</span>
      </div>
      <div class="stats-grid" style="margin-bottom: 12px;">
        <div class="stat-card" style="padding: 10px;">
          <div class="stat-value" style="font-size: 1.25rem; color: var(--success-400); -webkit-text-fill-color: var(--success-400);">${asist.presentes}</div>
          <div class="stat-label">Presentes</div>
        </div>
        <div class="stat-card" style="padding: 10px;">
          <div class="stat-value" style="font-size: 1.25rem; color: var(--danger-400); -webkit-text-fill-color: var(--danger-400);">${asist.ausentes}</div>
          <div class="stat-label">Ausentes</div>
        </div>
      </div>
      <div class="flex items-center gap-2 text-xs text-muted mb-2">
        ${icon('sun', 14)} ${asist.descontados} día${asist.descontados !== 1 ? 's' : ''} descontado${asist.descontados !== 1 ? 's' : ''} (feriados/sin clase)
      </div>
      <div class="progress-container" style="margin-top: 0;">
        <div class="progress-label">
          <span class="progress-label-text">Progreso</span>
          <span class="progress-label-value" style="color: ${asist.porcentaje >= minAsist ? 'var(--success-400)' : 'var(--danger-400)'}">${asist.porcentaje}%</span>
        </div>
        <div class="progress-bar ${progressClass}">
          <div class="progress-fill" style="width: ${Math.min(asist.porcentaje, 100)}%"></div>
        </div>
      </div>
      ${asist.porcentaje < minAsist && asist.totalClases > 0 ? `
        <div class="mt-2 text-xs" style="color: var(--danger-400);">
          ⚠️ Estás por debajo del mínimo de ${minAsist}%. ¡No faltes más!
        </div>
      ` : ''}
    </div>
    
    <!-- Horarios -->
    <div class="card">
      <div class="card-header">
        <span class="card-title">🕐 Horarios</span>
      </div>
      ${horariosHTML || '<div class="text-sm text-muted">Sin horarios asignados</div>'}
    </div>
    
    <!-- Evaluaciones -->
    <div class="section-header">
      <span class="section-title">Evaluaciones & TPs</span>
      <button class="btn btn-sm btn-secondary" onclick="window._newEval(${idMateria})">
        ${icon('plus', 14)} Agregar
      </button>
    </div>
    ${evalsHTML || '<div class="card"><div class="text-sm text-muted text-center">Sin evaluaciones registradas</div></div>'}
    
    <!-- Grupos -->
    <div class="section-header">
      <span class="section-title">Grupos de trabajo</span>
      <button class="btn btn-sm btn-secondary" onclick="window._newGrupo(${idMateria})">
        ${icon('plus', 14)} Nuevo grupo
      </button>
    </div>
    ${grupos.length > 0 ? grupos.map(g => `
      <div class="card card-clickable" onclick="window._viewGrupo(${g.id_grupo})">
        <div class="group-header">
          <div class="group-icon">${icon('users', 18)}</div>
          <div>
            <div class="font-bold text-sm">${g.nombre_grupo}</div>
            ${g.link_drive_repo ? `<div class="text-xs text-muted">${icon('link', 12)} Enlace disponible</div>` : ''}
          </div>
        </div>
      </div>
    `).join('') : '<div class="card"><div class="text-sm text-muted text-center">Sin grupos asignados</div></div>'}
  `;
}

// --- Formulario de materia ---
async function renderMateriaForm(idMateria) {
  let materia = { nombre: '', profesor: '', cuatrimestre: '2C-2026', pct_minimo_asistencia: 75 };
  let horarios = [];
  
  if (idMateria) {
    materia = await getRecord('materias', idMateria) || materia;
    horarios = await getByIndex('horarios', 'id_materia', idMateria);
  }
  
  let horariosInputs = '';
  const numHorarios = Math.max(horarios.length, 1);
  for (let i = 0; i < numHorarios; i++) {
    const h = horarios[i] || { dia_semana: 1, hora_inicio: '08:00', hora_fin: '10:00', aula: '' };
    horariosInputs += `
      <div class="card" style="padding: 12px;" data-horario-index="${i}">
        <div class="form-row" style="margin-bottom: 8px;">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Día</label>
            <select class="form-select horario-dia">
              ${[1,2,3,4,5,6,7].map(d => `<option value="${d}" ${h.dia_semana == d ? 'selected' : ''}>${DIAS_SEMANA[d]}</option>`).join('')}
            </select>
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Aula</label>
            <input class="form-input horario-aula" value="${h.aula || ''}" placeholder="Ej: A-204">
          </div>
        </div>
        <div class="form-row">
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Hora inicio</label>
            <input type="time" class="form-input horario-inicio" value="${h.hora_inicio || '08:00'}">
          </div>
          <div class="form-group" style="margin-bottom: 0;">
            <label class="form-label">Hora fin</label>
            <input type="time" class="form-input horario-fin" value="${h.hora_fin || '10:00'}">
          </div>
        </div>
      </div>
    `;
  }
  
  return `
    <form id="materia-form" onsubmit="window._saveMateria(event)">
      <input type="hidden" id="materia-id" value="${idMateria || ''}">
      
      <div class="form-group">
        <label class="form-label">Nombre de la materia *</label>
        <input class="form-input" id="materia-nombre" value="${materia.nombre}" placeholder="Ej: Programación I" required>
      </div>
      
      <div class="form-group">
        <label class="form-label">Profesor/a</label>
        <input class="form-input" id="materia-profesor" value="${materia.profesor || ''}" placeholder="Nombre del docente">
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Cuatrimestre</label>
          <select class="form-select" id="materia-cuatrimestre">
            <option value="1C-2026" ${materia.cuatrimestre === '1C-2026' ? 'selected' : ''}>1° Cuatrimestre 2026</option>
            <option value="2C-2026" ${materia.cuatrimestre === '2C-2026' ? 'selected' : ''}>2° Cuatrimestre 2026</option>
            <option value="Anual-2026" ${materia.cuatrimestre === 'Anual-2026' ? 'selected' : ''}>Anual 2026</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">% Mín. asistencia</label>
          <input type="number" class="form-input" id="materia-minasist" value="${materia.pct_minimo_asistencia || 75}" min="0" max="100">
        </div>
      </div>
      
      <div class="section-header">
        <span class="section-title">Horarios</span>
        <button type="button" class="btn btn-sm btn-secondary" onclick="window._addHorarioInput()">
          ${icon('plus', 14)} Agregar día
        </button>
      </div>
      
      <div id="horarios-container">
        ${horariosInputs}
      </div>
      
      <div class="modal-actions mt-4">
        <button type="button" class="btn btn-secondary" onclick="window._goBack()">Cancelar</button>
        <button type="submit" class="btn btn-primary">${idMateria ? 'Guardar cambios' : 'Crear materia'}</button>
      </div>
    </form>
  `;
}

// --- Formulario de evaluación ---
async function renderEvalForm(idMateria, idEval) {
  let eval_ = { tipo: 'Parcial', titulo: '', fecha_entrega: '', nota: '', entregado: false };
  if (idEval) {
    eval_ = await getRecord('evaluaciones', idEval) || eval_;
  }
  
  return `
    <form id="eval-form" onsubmit="window._saveEval(event)">
      <input type="hidden" id="eval-id" value="${idEval || ''}">
      <input type="hidden" id="eval-materia" value="${idMateria}">
      
      <div class="form-group">
        <label class="form-label">Tipo *</label>
        <select class="form-select" id="eval-tipo">
          ${['Parcial', 'TP', 'Final', 'Recuperatorio'].map(t => 
            `<option value="${t}" ${eval_.tipo === t ? 'selected' : ''}>${t}</option>`
          ).join('')}
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label">Título / Descripción</label>
        <input class="form-input" id="eval-titulo" value="${eval_.titulo || ''}" placeholder="Ej: 1er Parcial, TP Integrador">
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Fecha de entrega</label>
          <input type="date" class="form-input" id="eval-fecha" value="${eval_.fecha_entrega || ''}">
        </div>
        <div class="form-group">
          <label class="form-label">Nota (1-10)</label>
          <input type="number" class="form-input" id="eval-nota" value="${eval_.nota !== null && eval_.nota !== undefined ? eval_.nota : ''}" min="1" max="10" step="0.5" placeholder="—">
        </div>
      </div>
      
      <div class="checkbox-item ${eval_.entregado ? 'checked' : ''}" onclick="this.classList.toggle('checked'); document.getElementById('eval-entregado').checked = this.classList.contains('checked');">
        <div class="checkbox-box">${icon('check', 14)}</div>
        <span class="checkbox-text">Entregado / Rendido</span>
        <input type="checkbox" id="eval-entregado" ${eval_.entregado ? 'checked' : ''} style="display:none">
      </div>
      
      <div class="modal-actions mt-4">
        <button type="button" class="btn btn-secondary" onclick="window._goBack()">Cancelar</button>
        <button type="submit" class="btn btn-primary">${idEval ? 'Guardar' : 'Crear evaluación'}</button>
      </div>
    </form>
  `;
}

// --- Temas de un parcial ---
async function renderEvalTemas(idEval) {
  const eval_ = await getRecord('evaluaciones', idEval);
  if (!eval_) return '<div class="empty-state"><div class="empty-state-title">Evaluación no encontrada</div></div>';
  
  const temas = await getByIndex('temas_parcial', 'id_eval', idEval);
  const materia = await getRecord('materias', eval_.id_materia);
  
  const totalTemas = temas.length;
  const estudiados = temas.filter(t => t.estudiado).length;
  const porcentaje = totalTemas > 0 ? Math.round((estudiados / totalTemas) * 100) : 0;
  
  let temasHTML = temas.map(t => `
    <div class="checkbox-item ${t.estudiado ? 'checked' : ''}" onclick="window._toggleTema(${t.id_tema})">
      <div class="checkbox-box">${icon('check', 14)}</div>
      <div style="flex: 1;">
        <span class="checkbox-text">${t.descripcion}</span>
        ${t.unidad ? `<div class="checkbox-meta">Unidad ${t.unidad}</div>` : ''}
      </div>
      <button class="btn btn-ghost btn-icon" onclick="event.stopPropagation(); window._deleteTema(${t.id_tema})" title="Eliminar">
        ${icon('trash', 14)}
      </button>
    </div>
  `).join('');
  
  return `
    <h1 class="page-title">${eval_.titulo || eval_.tipo}</h1>
    <p class="page-subtitle">${materia ? materia.nombre : ''} ${eval_.fecha_entrega ? `· ${formatFecha(eval_.fecha_entrega)}` : ''}</p>
    
    ${totalTemas > 0 ? `
      <div class="card">
        <div class="progress-container" style="margin-top: 0;">
          <div class="progress-label">
            <span class="progress-label-text">Progreso de estudio</span>
            <span class="progress-label-value" style="color: var(--primary-300);">${estudiados}/${totalTemas} (${porcentaje}%)</span>
          </div>
          <div class="progress-bar ${porcentaje === 100 ? 'progress-success' : porcentaje >= 50 ? 'progress-warning' : 'progress-danger'}">
            <div class="progress-fill" style="width: ${porcentaje}%"></div>
          </div>
        </div>
      </div>
    ` : ''}
    
    <div class="section-header">
      <span class="section-title">Temas (${totalTemas})</span>
    </div>
    
    ${temasHTML || '<div class="text-sm text-muted text-center mb-3">Sin temas agregados todavía.</div>'}
    
    <div class="card" style="padding: 12px;">
      <form onsubmit="window._addTema(event, ${idEval})" class="flex gap-2">
        <input class="form-input" id="nuevo-tema" placeholder="Agregar tema..." style="flex: 1; margin: 0;">
        <input class="form-input" id="nuevo-tema-unidad" placeholder="Unidad" style="width: 70px; margin: 0;">
        <button type="submit" class="btn btn-primary btn-sm">${icon('plus', 16)}</button>
      </form>
    </div>
  `;
}

// ============================
// TAB 3: EXÁMENES & TPs
// ============================
async function renderExamenes() {
  const evaluaciones = await getAllRecords('evaluaciones');
  const materias = await getAllRecords('materias');
  const materiasMap = new Map(materias.map(m => [m.id_materia, m]));
  
  if (evaluaciones.length === 0) {
    return `
      <h1 class="page-title">Exámenes & TPs</h1>
      <p class="page-subtitle">Agenda académica con cuenta regresiva</p>
      <div class="empty-state">
        ${icon('clipboardList', 64)}
        <div class="empty-state-title">Sin evaluaciones</div>
        <div class="empty-state-text">Agregá parciales y trabajos prácticos desde el detalle de cada materia.</div>
      </div>
    `;
  }
  
  // Separar en próximas y pasadas
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  const proximas = evaluaciones
    .filter(e => e.fecha_entrega && new Date(e.fecha_entrega + 'T00:00:00') >= hoy)
    .sort((a, b) => a.fecha_entrega.localeCompare(b.fecha_entrega));
  
  const pasadas = evaluaciones
    .filter(e => !e.fecha_entrega || new Date(e.fecha_entrega + 'T00:00:00') < hoy)
    .sort((a, b) => (b.fecha_entrega || '').localeCompare(a.fecha_entrega || ''));
  
  function renderEvalCard(e) {
    const materia = materiasMap.get(e.id_materia);
    const dias = e.fecha_entrega ? diasHasta(e.fecha_entrega) : null;
    const fecha = e.fecha_entrega ? new Date(e.fecha_entrega + 'T00:00:00') : null;
    
    return `
      <div class="card animate-slide-up">
        <div class="exam-card">
          ${fecha ? `
            <div class="exam-date-box">
              <div class="exam-date-day">${fecha.getDate()}</div>
              <div class="exam-date-month">${MESES[fecha.getMonth()]}</div>
            </div>
          ` : '<div class="exam-date-box"><div class="exam-date-day">—</div><div class="exam-date-month">S/F</div></div>'}
          <div class="exam-info">
            <div class="exam-title">${e.titulo || e.tipo}</div>
            <div class="exam-materia">${materia ? materia.nombre : 'Sin materia'}</div>
            <div class="exam-status">
              <span class="badge badge-info">${e.tipo}</span>
              ${e.entregado ? '<span class="badge badge-success">Entregado</span>' : ''}
              ${e.nota !== null && e.nota !== undefined && e.nota !== '' ? 
                `<span class="badge ${parseFloat(e.nota) >= 7 ? 'badge-success' : parseFloat(e.nota) >= 4 ? 'badge-warning' : 'badge-danger'}">Nota: ${e.nota}</span>` : ''}
              ${dias !== null && dias >= 0 ? `
                <span class="countdown-tag ${getCountdownClass(dias)}">
                  ${dias === 0 ? '¡HOY!' : dias === 1 ? '¡MAÑANA!' : `${dias} días`}
                </span>
              ` : ''}
            </div>
          </div>
          <div class="flex flex-col gap-2">
            ${e.tipo === 'Parcial' ? `<button class="btn btn-ghost btn-icon" onclick="window._viewTemas(${e.id_eval})" title="Temas">${icon('fileText', 16)}</button>` : ''}
            <button class="btn btn-ghost btn-icon" onclick="window._editEval(${e.id_materia}, ${e.id_eval})" title="Editar">${icon('edit', 16)}</button>
          </div>
        </div>
      </div>
    `;
  }
  
  let html = `
    <h1 class="page-title">Exámenes & TPs</h1>
    <p class="page-subtitle">${proximas.length} próxima${proximas.length !== 1 ? 's' : ''} · ${pasadas.length} pasada${pasadas.length !== 1 ? 's' : ''}</p>
  `;
  
  if (proximas.length > 0) {
    html += `<div class="section-header"><span class="section-title">📅 Próximas</span></div>`;
    html += proximas.map(renderEvalCard).join('');
  }
  
  if (pasadas.length > 0) {
    html += `<div class="section-header"><span class="section-title">📋 Pasadas</span></div>`;
    html += pasadas.map(renderEvalCard).join('');
  }
  
  return html;
}

// ============================
// TAB 4: COMPAÑEROS & GRUPOS
// ============================
async function renderCompaneros() {
  const companeros = await getAllRecords('companeros');
  const grupos = await getAllRecords('grupos');
  const materias = await getAllRecords('materias');
  const materiasMap = new Map(materias.map(m => [m.id_materia, m]));
  
  let companerosList = '';
  if (companeros.length > 0) {
    companerosList = companeros.map(c => `
      <div class="card animate-slide-up">
        <div class="contact-card">
          <div class="contact-avatar">${getInitials(c.nombre, c.apellido)}</div>
          <div class="contact-info">
            <div class="contact-name">${c.nombre} ${c.apellido || ''}</div>
            <div class="contact-detail">
              ${c.email || c.telefono || 'Sin datos de contacto'}
            </div>
          </div>
          <div class="contact-actions">
            ${c.telefono ? `
              <a href="https://wa.me/${c.telefono.replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-whatsapp btn-sm" title="WhatsApp">
                ${icon('messageCircle', 14)}
              </a>
            ` : ''}
            <button class="btn btn-ghost btn-icon" onclick="window._editCompanero(${c.id_companero})" title="Editar">${icon('edit', 16)}</button>
            <button class="btn btn-ghost btn-icon" onclick="window._deleteCompanero(${c.id_companero})" title="Eliminar">${icon('trash', 16)}</button>
          </div>
        </div>
      </div>
    `).join('');
  }
  
  let gruposList = '';
  if (grupos.length > 0) {
    for (const g of grupos) {
      const materia = materiasMap.get(g.id_materia);
      const integrantes = await getIntegrantesGrupo(g.id_grupo);
      gruposList += `
        <div class="card card-clickable animate-slide-up" onclick="window._viewGrupo(${g.id_grupo})">
          <div class="group-header">
            <div class="group-icon">${icon('users', 18)}</div>
            <div style="flex: 1;">
              <div class="font-bold text-sm">${g.nombre_grupo}</div>
              <div class="text-xs text-muted">${materia ? materia.nombre : 'Sin materia'} · ${integrantes.length} integrante${integrantes.length !== 1 ? 's' : ''}</div>
            </div>
            ${icon('chevronRight', 18)}
          </div>
          ${integrantes.length > 0 ? `
            <div class="group-members">
              ${integrantes.map(i => `<span class="group-member-chip">${i.nombre} ${i.apellido || ''}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      `;
    }
  }
  
  return `
    <h1 class="page-title">Compañeros & Grupos</h1>
    <p class="page-subtitle">Directorio y equipos de trabajo</p>
    
    <div class="section-header">
      <span class="section-title">Compañeros (${companeros.length})</span>
      <button class="btn btn-sm btn-secondary" onclick="window._newCompanero()">
        ${icon('userPlus', 14)} Agregar
      </button>
    </div>
    
    ${companerosList || `
      <div class="card">
        <div class="text-sm text-muted text-center">
          Sin compañeros registrados. Agregá compañeros para armar tus grupos.
        </div>
      </div>
    `}
    
    <div class="section-header">
      <span class="section-title">Grupos de trabajo (${grupos.length})</span>
    </div>
    
    ${gruposList || `
      <div class="card">
        <div class="text-sm text-muted text-center">
          Sin grupos armados. Creá grupos desde el detalle de cada materia.
        </div>
      </div>
    `}
  `;
}

// --- Formulario de compañero ---
async function renderCompaneroForm(idCompanero) {
  let comp = { nombre: '', apellido: '', telefono: '', email: '', github_user: '', notas: '' };
  if (idCompanero) {
    comp = await getRecord('companeros', idCompanero) || comp;
  }
  
  return `
    <form id="companero-form" onsubmit="window._saveCompanero(event)">
      <input type="hidden" id="comp-id" value="${idCompanero || ''}">
      
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Nombre *</label>
          <input class="form-input" id="comp-nombre" value="${comp.nombre}" required placeholder="Nombre">
        </div>
        <div class="form-group">
          <label class="form-label">Apellido</label>
          <input class="form-input" id="comp-apellido" value="${comp.apellido || ''}" placeholder="Apellido">
        </div>
      </div>
      
      <div class="form-group">
        <label class="form-label">Teléfono (con código de país)</label>
        <input class="form-input" id="comp-telefono" value="${comp.telefono || ''}" placeholder="Ej: +5491112345678">
      </div>
      
      <div class="form-group">
        <label class="form-label">Email</label>
        <input type="email" class="form-input" id="comp-email" value="${comp.email || ''}" placeholder="email@ejemplo.com">
      </div>
      
      <div class="form-group">
        <label class="form-label">Usuario GitHub</label>
        <input class="form-input" id="comp-github" value="${comp.github_user || ''}" placeholder="@username">
      </div>
      
      <div class="form-group">
        <label class="form-label">Notas</label>
        <textarea class="form-textarea" id="comp-notas" placeholder="Notas adicionales...">${comp.notas || ''}</textarea>
      </div>
      
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="window._goBack()">Cancelar</button>
        <button type="submit" class="btn btn-primary">${idCompanero ? 'Guardar' : 'Agregar compañero'}</button>
      </div>
    </form>
  `;
}

// --- Formulario de grupo ---
async function renderGrupoForm(idMateria, idGrupo) {
  let grupo = { nombre_grupo: '', link_drive_repo: '', id_materia: idMateria };
  if (idGrupo) {
    grupo = await getRecord('grupos', idGrupo) || grupo;
  }
  
  const materias = await getAllRecords('materias');
  
  return `
    <form id="grupo-form" onsubmit="window._saveGrupo(event)">
      <input type="hidden" id="grupo-id" value="${idGrupo || ''}">
      
      <div class="form-group">
        <label class="form-label">Materia</label>
        <select class="form-select" id="grupo-materia">
          ${materias.map(m => `<option value="${m.id_materia}" ${m.id_materia == grupo.id_materia ? 'selected' : ''}>${m.nombre}</option>`).join('')}
        </select>
      </div>
      
      <div class="form-group">
        <label class="form-label">Nombre del grupo *</label>
        <input class="form-input" id="grupo-nombre" value="${grupo.nombre_grupo}" required placeholder="Ej: Grupo TP Integrador">
      </div>
      
      <div class="form-group">
        <label class="form-label">Link (Drive, GitHub, etc.)</label>
        <input class="form-input" id="grupo-link" value="${grupo.link_drive_repo || ''}" placeholder="https://...">
      </div>
      
      <div class="modal-actions">
        <button type="button" class="btn btn-secondary" onclick="window._goBack()">Cancelar</button>
        <button type="submit" class="btn btn-primary">${idGrupo ? 'Guardar' : 'Crear grupo'}</button>
      </div>
    </form>
  `;
}

// --- Detalle de grupo ---
async function renderGrupoDetalle(idGrupo) {
  const grupo = await getRecord('grupos', idGrupo);
  if (!grupo) return '<div class="empty-state"><div class="empty-state-title">Grupo no encontrado</div></div>';
  
  const materia = await getRecord('materias', grupo.id_materia);
  const integrantes = await getIntegrantesGrupo(idGrupo);
  const todosCompaneros = await getAllRecords('companeros');
  const integrantesIds = new Set(integrantes.map(i => i.id_companero));
  const disponibles = todosCompaneros.filter(c => !integrantesIds.has(c.id_companero));
  
  return `
    <h1 class="page-title">${grupo.nombre_grupo}</h1>
    <p class="page-subtitle">${materia ? materia.nombre : 'Sin materia'}</p>
    
    ${grupo.link_drive_repo ? `
      <div class="card">
        <a href="${grupo.link_drive_repo}" target="_blank" class="flex items-center gap-2" style="color: var(--primary-300); text-decoration: none;">
          ${icon('link', 18)} <span class="text-sm">Abrir enlace del grupo</span>
        </a>
      </div>
    ` : ''}
    
    <div class="section-header">
      <span class="section-title">Integrantes (${integrantes.length})</span>
      <div class="flex gap-2">
        <button class="btn btn-sm btn-secondary" onclick="window._editGrupo(${grupo.id_materia}, ${idGrupo})">${icon('edit', 14)} Editar</button>
        <button class="btn btn-sm btn-danger" onclick="window._deleteGrupo(${idGrupo})">${icon('trash', 14)} Eliminar</button>
      </div>
    </div>
    
    ${integrantes.length > 0 ? integrantes.map(c => `
      <div class="card" style="padding: 10px;">
        <div class="contact-card">
          <div class="contact-avatar" style="width: 36px; height: 36px; font-size: 0.8rem;">${getInitials(c.nombre, c.apellido)}</div>
          <div class="contact-info">
            <div class="contact-name" style="font-size: 0.875rem;">${c.nombre} ${c.apellido || ''}</div>
            <div class="contact-detail">${c.telefono || c.email || ''}</div>
          </div>
          <div class="contact-actions">
            ${c.telefono ? `
              <a href="https://wa.me/${c.telefono.replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-whatsapp btn-sm">${icon('messageCircle', 14)}</a>
            ` : ''}
            <button class="btn btn-ghost btn-icon" onclick="window._removeIntegrante(${idGrupo}, ${c.id_companero})" title="Quitar del grupo">${icon('x', 16)}</button>
          </div>
        </div>
      </div>
    `).join('') : '<div class="card"><div class="text-sm text-muted text-center">Sin integrantes</div></div>'}
    
    ${disponibles.length > 0 ? `
      <div class="section-header">
        <span class="section-title">Agregar integrante</span>
      </div>
      <div class="card" style="padding: 12px;">
        <select class="form-select" id="agregar-integrante">
          <option value="">Seleccionar compañero...</option>
          ${disponibles.map(c => `<option value="${c.id_companero}">${c.nombre} ${c.apellido || ''}</option>`).join('')}
        </select>
        <button class="btn btn-primary btn-sm w-full mt-2" onclick="window._addIntegrante(${idGrupo})">
          ${icon('userPlus', 14)} Agregar al grupo
        </button>
      </div>
    ` : ''}
  `;
}

// ============================
// Helpers de colores para materias
// ============================
const MATERIA_COLORS = [
  'var(--primary-500)', 'var(--accent-500)', 'var(--success-500)',
  'var(--warning-500)', 'var(--info-500)', '#8b5cf6', '#f97316', '#14b8a6'
];

function getColorForIndex(id) {
  return MATERIA_COLORS[id % MATERIA_COLORS.length];
}

// ============================
// Handlers globales (window._*)
// ============================

// Navegación
window._nav = (tab) => navigateTo(tab);
window._goBack = () => goBack();

// Asistencia
window._marcarAsistencia = async (idMateria, estado) => {
  await registrarAsistencia(idMateria, getFechaHoy(), estado);
  showToast(`Asistencia registrada: ${estado === 'Sin_Clase' ? 'Sin clase' : estado}`);
  render();
};

// Materias
window._viewMateria = (id) => navigateTo('materias', 'materia-detalle', { id });
window._newMateria = () => navigateTo('materias', 'materia-form', {});
window._editMateria = (id) => navigateTo('materias', 'materia-form', { id });

window._saveMateria = async (event) => {
  event.preventDefault();
  const id = document.getElementById('materia-id').value;
  const data = {
    nombre: document.getElementById('materia-nombre').value.trim(),
    profesor: document.getElementById('materia-profesor').value.trim(),
    cuatrimestre: document.getElementById('materia-cuatrimestre').value,
    pct_minimo_asistencia: parseInt(document.getElementById('materia-minasist').value) || 75,
  };
  
  let materiaId;
  if (id) {
    data.id_materia = parseInt(id);
    await updateRecord('materias', data);
    materiaId = data.id_materia;
    // Eliminar horarios viejos
    await deleteByIndex('horarios', 'id_materia', materiaId);
  } else {
    materiaId = await addRecord('materias', data);
  }
  
  // Guardar horarios
  const horariosContainer = document.getElementById('horarios-container');
  const horarioCards = horariosContainer.querySelectorAll('[data-horario-index]');
  for (const card of horarioCards) {
    const horario = {
      id_materia: materiaId,
      dia_semana: parseInt(card.querySelector('.horario-dia').value),
      hora_inicio: card.querySelector('.horario-inicio').value,
      hora_fin: card.querySelector('.horario-fin').value,
      aula: card.querySelector('.horario-aula').value.trim(),
    };
    await addRecord('horarios', horario);
  }
  
  showToast(id ? 'Materia actualizada' : 'Materia creada exitosamente');
  navigateTo('materias', 'materia-detalle', { id: materiaId });
};

window._deleteMateria = async (id) => {
  if (!confirm('¿Eliminar esta materia? Se borrarán todos sus datos (horarios, asistencias, evaluaciones y grupos).')) return;
  await deleteByIndex('horarios', 'id_materia', id);
  await deleteByIndex('asistencias', 'id_materia', id);
  // Eliminar evaluaciones y sus temas
  const evals = await getByIndex('evaluaciones', 'id_materia', id);
  for (const e of evals) {
    await deleteByIndex('temas_parcial', 'id_eval', e.id_eval);
  }
  await deleteByIndex('evaluaciones', 'id_materia', id);
  // Eliminar grupos e integrantes
  const grupos = await getByIndex('grupos', 'id_materia', id);
  for (const g of grupos) {
    await deleteByIndex('grupo_integrantes', 'id_grupo', g.id_grupo);
  }
  await deleteByIndex('grupos', 'id_materia', id);
  await deleteRecord('materias', id);
  showToast('Materia eliminada');
  navigateTo('materias');
};

window._addHorarioInput = () => {
  const container = document.getElementById('horarios-container');
  const idx = container.children.length;
  const html = `
    <div class="card" style="padding: 12px;" data-horario-index="${idx}">
      <div class="form-row" style="margin-bottom: 8px;">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Día</label>
          <select class="form-select horario-dia">
            ${[1,2,3,4,5,6,7].map(d => `<option value="${d}">${DIAS_SEMANA[d]}</option>`).join('')}
          </select>
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Aula</label>
          <input class="form-input horario-aula" value="" placeholder="Ej: A-204">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Hora inicio</label>
          <input type="time" class="form-input horario-inicio" value="08:00">
        </div>
        <div class="form-group" style="margin-bottom: 0;">
          <label class="form-label">Hora fin</label>
          <input type="time" class="form-input horario-fin" value="10:00">
        </div>
      </div>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', html);
};

// Evaluaciones
window._newEval = (idMateria) => navigateTo('materias', 'eval-form', { id_materia: idMateria });
window._editEval = (idMateria, idEval) => navigateTo('examenes', 'eval-form', { id_materia: idMateria, id_eval: idEval });
window._viewTemas = (idEval) => navigateTo('examenes', 'eval-temas', { id_eval: idEval });

window._saveEval = async (event) => {
  event.preventDefault();
  const id = document.getElementById('eval-id').value;
  const data = {
    id_materia: parseInt(document.getElementById('eval-materia').value),
    tipo: document.getElementById('eval-tipo').value,
    titulo: document.getElementById('eval-titulo').value.trim(),
    fecha_entrega: document.getElementById('eval-fecha').value || null,
    nota: document.getElementById('eval-nota').value ? parseFloat(document.getElementById('eval-nota').value) : null,
    entregado: document.getElementById('eval-entregado').checked,
  };
  
  if (id) {
    data.id_eval = parseInt(id);
    await updateRecord('evaluaciones', data);
  } else {
    await addRecord('evaluaciones', data);
  }
  
  showToast(id ? 'Evaluación actualizada' : 'Evaluación creada');
  goBack();
};

window._deleteEval = async (idEval) => {
  if (!confirm('¿Eliminar esta evaluación y sus temas?')) return;
  await deleteByIndex('temas_parcial', 'id_eval', idEval);
  await deleteRecord('evaluaciones', idEval);
  showToast('Evaluación eliminada');
  render();
};

// Temas
window._toggleTema = async (idTema) => {
  const tema = await getRecord('temas_parcial', idTema);
  if (tema) {
    tema.estudiado = !tema.estudiado;
    await updateRecord('temas_parcial', tema);
    render();
  }
};

window._addTema = async (event, idEval) => {
  event.preventDefault();
  const desc = document.getElementById('nuevo-tema').value.trim();
  const unidad = document.getElementById('nuevo-tema-unidad').value.trim();
  if (!desc) return;
  
  await addRecord('temas_parcial', {
    id_eval: idEval,
    descripcion: desc,
    unidad: unidad || null,
    estudiado: false,
    apuntes_url: null,
  });
  
  showToast('Tema agregado');
  render();
};

window._deleteTema = async (idTema) => {
  await deleteRecord('temas_parcial', idTema);
  showToast('Tema eliminado');
  render();
};

// Compañeros
window._newCompanero = () => navigateTo('companeros', 'companero-form', {});
window._editCompanero = (id) => navigateTo('companeros', 'companero-form', { id });

window._saveCompanero = async (event) => {
  event.preventDefault();
  const id = document.getElementById('comp-id').value;
  const data = {
    nombre: document.getElementById('comp-nombre').value.trim(),
    apellido: document.getElementById('comp-apellido').value.trim(),
    telefono: document.getElementById('comp-telefono').value.trim(),
    email: document.getElementById('comp-email').value.trim(),
    github_user: document.getElementById('comp-github').value.trim(),
    notas: document.getElementById('comp-notas').value.trim(),
  };
  
  if (id) {
    data.id_companero = parseInt(id);
    await updateRecord('companeros', data);
  } else {
    await addRecord('companeros', data);
  }
  
  showToast(id ? 'Compañero actualizado' : 'Compañero agregado');
  navigateTo('companeros');
};

window._deleteCompanero = async (id) => {
  if (!confirm('¿Eliminar este compañero? Se removerá de todos los grupos.')) return;
  await deleteByIndex('grupo_integrantes', 'id_companero', id);
  await deleteRecord('companeros', id);
  showToast('Compañero eliminado');
  render();
};

// Grupos
window._newGrupo = (idMateria) => navigateTo('materias', 'grupo-form', { id_materia: idMateria });
window._editGrupo = (idMateria, id) => navigateTo('materias', 'grupo-form', { id_materia: idMateria, id });
window._viewGrupo = (id) => navigateTo('companeros', 'grupo-detalle', { id });

window._saveGrupo = async (event) => {
  event.preventDefault();
  const id = document.getElementById('grupo-id').value;
  const data = {
    id_materia: parseInt(document.getElementById('grupo-materia').value),
    nombre_grupo: document.getElementById('grupo-nombre').value.trim(),
    link_drive_repo: document.getElementById('grupo-link').value.trim(),
  };
  
  if (id) {
    data.id_grupo = parseInt(id);
    await updateRecord('grupos', data);
    showToast('Grupo actualizado');
    navigateTo('companeros', 'grupo-detalle', { id: parseInt(id) });
  } else {
    const newId = await addRecord('grupos', data);
    showToast('Grupo creado');
    navigateTo('companeros', 'grupo-detalle', { id: newId });
  }
};

window._deleteGrupo = async (id) => {
  if (!confirm('¿Eliminar este grupo?')) return;
  await deleteByIndex('grupo_integrantes', 'id_grupo', id);
  await deleteRecord('grupos', id);
  showToast('Grupo eliminado');
  navigateTo('companeros');
};

window._addIntegrante = async (idGrupo) => {
  const select = document.getElementById('agregar-integrante');
  const idCompanero = parseInt(select.value);
  if (!idCompanero) return;
  
  try {
    await agregarIntegrante(idGrupo, idCompanero);
    showToast('Integrante agregado');
    render();
  } catch (e) {
    showToast('Este compañero ya está en el grupo', 'error');
  }
};

window._removeIntegrante = async (idGrupo, idCompanero) => {
  await eliminarIntegrante(idGrupo, idCompanero);
  showToast('Integrante removido');
  render();
};

// Export / Import / Ajustes
window._openSettings = () => navigateTo(currentTab, 'ajustes');

window._exportData = async () => {
  try {
    const data = await exportarDatos();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mi_cursada_backup_${getFechaHoy()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Datos exportados correctamente');
  } catch (e) {
    showToast('Error al exportar', 'error');
  }
};

window._loadSampleData = async () => {
  try {
    await importarDatos(SAMPLE_DATA);
    showToast('¡Datos de ejemplo cargados!');
    navigateTo('hoy');
  } catch (e) {
    console.error(e);
    showToast('Error al cargar datos de ejemplo', 'error');
  }
};

window._importData = () => {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json,application/json';
  input.onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await importarDatos(data);
      showToast('Backup restaurado con éxito');
      navigateTo('hoy');
    } catch (err) {
      console.error(err);
      showToast('Error al leer el archivo de backup', 'error');
    }
  };
  input.click();
};

window._clearAllData = async () => {
  if (!confirm('¿Estás seguro de que querés borrar TODOS los datos de la app?')) return;
  try {
    await limpiarBaseDatos();
    showToast('Datos borrados correctamente');
    navigateTo('hoy');
  } catch (e) {
    showToast('Error al limpiar datos', 'error');
  }
};

// ============================
// VISTA: AJUSTES Y DATOS
// ============================
async function renderAjustes() {
  const materias = await getAllRecords('materias');
  const companeros = await getAllRecords('companeros');
  const evaluaciones = await getAllRecords('evaluaciones');

  return `
    <h1 class="page-title">Ajustes & Datos</h1>
    <p class="page-subtitle">Gestión de copia de seguridad e instalación</p>

    <!-- Resumen de datos -->
    <div class="card animate-slide-up mb-4">
      <div class="card-header">
        <span class="card-title">${icon('fileText', 18)} Estado del almacenamiento</span>
      </div>
      <div class="stats-grid mt-2">
        <div class="stat-card">
          <div class="stat-value">${materias.length}</div>
          <div class="stat-label">Materias</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${evaluaciones.length}</div>
          <div class="stat-label">Evaluaciones</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${companeros.length}</div>
          <div class="stat-label">Compañeros</div>
        </div>
      </div>
    </div>

    <!-- Datos de prueba -->
    <div class="card animate-slide-up mb-4">
      <div class="card-header">
        <span class="card-title">${icon('target', 18)} Datos de prueba</span>
      </div>
      <p class="text-sm text-muted mb-3">
        Pobla la base de datos con materias universitarias, horarios, asistencias calculadas, exámenes próximos y compañeros para explorar todas las funciones.
      </p>
      <button class="btn btn-primary w-full" onclick="window._loadSampleData()">
        ✨ Cargar datos universitarios de ejemplo
      </button>
    </div>

    <!-- Backup & Restauración -->
    <div class="card animate-slide-up mb-4">
      <div class="card-header">
        <span class="card-title">${icon('download', 18)} Copia de seguridad (Backup)</span>
      </div>
      <p class="text-sm text-muted mb-3">
        Tus datos se guardan de forma privada en tu dispositivo (IndexedDB). Podés descargar una copia en JSON para transferirla a otro equipo o guardar un respaldo.
      </p>
      <div class="flex flex-col gap-2">
        <button class="btn btn-secondary w-full" onclick="window._exportData()">
          ${icon('download', 18)} Exportar backup (JSON)
        </button>
        <button class="btn btn-secondary w-full" onclick="window._importData()">
          ${icon('upload', 18)} Importar backup (JSON)
        </button>
      </div>
    </div>

    <!-- Cómo instalar en Android -->
    <div class="card animate-slide-up mb-4" style="border-color: rgba(99, 102, 241, 0.3); background: rgba(99, 102, 241, 0.05);">
      <div class="card-header">
        <span class="card-title" style="color: var(--primary-300);">${icon('award', 18)} Cómo instalar en Android</span>
      </div>
      <div class="text-sm text-muted" style="line-height: 1.6;">
        <ol style="padding-left: 20px; margin-top: 8px;">
          <li style="margin-bottom: 6px;">Abrí esta app en <strong>Google Chrome</strong> en tu celular (a través de GitHub Pages o tu IP local Wi-Fi).</li>
          <li style="margin-bottom: 6px;">Tocá el menú de <strong>tres puntos (⋮)</strong> en la esquina superior derecha del navegador.</li>
          <li style="margin-bottom: 6px;">Seleccioná <strong>"Instalar aplicación"</strong> o <strong>"Agregar a la pantalla principal"</strong>.</li>
          <li>¡Listo! Se abrirá como app nativa a pantalla completa y funcionará <strong>100% offline</strong> sin consumir datos móviles.</li>
        </ol>
      </div>
    </div>

    <!-- Zona de peligro -->
    <div class="card animate-slide-up" style="border-color: rgba(239, 68, 68, 0.3);">
      <div class="card-header">
        <span class="card-title text-danger">${icon('alertTriangle', 18)} Restablecer aplicación</span>
      </div>
      <p class="text-sm text-muted mb-3">
        Borra todas las materias, horarios, asistencias y contactos para reiniciar desde cero.
      </p>
      <button class="btn btn-danger w-full" onclick="window._clearAllData()">
        ${icon('trash', 18)} Borrar todos los datos
      </button>
    </div>
  `;
}

// ============================
// Inicialización
// ============================
async function init() {
  await openDB();
  render();
}

init();
