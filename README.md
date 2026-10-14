# 📚 Mi Cursada - Organizador Académico Universitario

Aplicación web progresiva (PWA) para organizar tu vida universitaria: materias, asistencias, exámenes, trabajos prácticos, temas de estudio y grupos de trabajo.

## ✨ Características

### 🗓️ Hoy & Horarios
- Dashboard diario que muestra las materias del día actual
- **3 botones de acción rápida** por materia: Presente, Ausente, Sin Clase
- Barra de progreso de asistencia en tiempo real
- Vista de próximos exámenes y entregas

### 📖 Materias
- Lista completa de materias con estado académico
- **Cálculo inteligente de asistencia**: los feriados y días sin clase se descuentan del total (no penalizan)
- Condición académica automática: Promocionado / Regular / En riesgo
- Promedio de notas por materia

### 📝 Exámenes, TPs & Temarios
- Agenda de parciales y trabajos prácticos con **cuenta regresiva** de días
- Por cada parcial: **checklist de temas a estudiar** con progreso visual
- Estado de entrega y notas obtenidas
- Separación entre evaluaciones próximas y pasadas

### 👥 Compañeros & Grupos
- Directorio de compañeros con **botón directo a WhatsApp** (`wa.me/...`)
- Gestión de grupos de trabajo por materia
- Enlace a Drive/GitHub del grupo
- Agregar/quitar integrantes fácilmente

## 🧮 Fórmula de Asistencia

```
Porcentaje = (Presentes / (Presentes + Ausentes)) × 100
```

> Los días marcados como "Feriado" o "Sin Clase" **NO se cuentan** en el denominador.
> Solo se dividen las asistencias entre las clases efectivamente dictadas.

## 🗄️ Esquema de Datos (IndexedDB)

| Tabla              | Clave Primaria  | Relación                    |
|--------------------|----------------|-----------------------------|
| `materias`         | `id_materia`   | Tabla principal              |
| `horarios`         | `id_horario`   | FK → `materias` (1:N)       |
| `asistencias`      | `id_asistencia`| FK → `materias` (1:N)       |
| `evaluaciones`     | `id_eval`      | FK → `materias` (1:N)       |
| `temas_parcial`    | `id_tema`      | FK → `evaluaciones` (1:N)   |
| `companeros`       | `id_companero` | Directorio independiente     |
| `grupos`           | `id_grupo`     | FK → `materias` (1:N)       |
| `grupo_integrantes`| `id`           | N:M (grupos ↔ compañeros)   |

## 🚀 Cómo usar

### Opción 1: Abrir directamente
1. Servir la carpeta con cualquier servidor HTTP local:
   ```bash
   # Con Python
   python -m http.server 3000
   
   # Con Node.js (si está instalado)
   npx -y serve .
   ```
2. Abrir `http://localhost:3000` en el navegador

### Opción 2: Instalar como PWA en Android
1. Abrir `http://tu-servidor:3000` en **Chrome para Android**
2. Tocar el menú (⋮) → **"Agregar a pantalla de inicio"**
3. La app se instala como nativa, funciona offline

### Opción 3: Deploy en la nube (gratuito)
Subir a **GitHub Pages**, **Netlify** o **Vercel** para acceder desde cualquier dispositivo:
```bash
# GitHub Pages: simplemente pushear a la rama main
git add .
git commit -m "Mi Cursada v1.0"
git push origin main
# Luego activar GitHub Pages en Settings → Pages → Source: main
```

## 📱 Stack Técnico

- **HTML5 + CSS3 + JavaScript ES6+** (sin frameworks, sin build step)
- **IndexedDB** para persistencia local estructurada
- **Service Worker** para funcionamiento offline (PWA)
- **Diseño Mobile-First** con modo oscuro y glassmorphism
- **Lucide Icons** (SVG inline)
- Preparado para **Capacitor** (empaquetado como APK Android)

## 📂 Estructura del proyecto

```
proyecto-mi-cursada/
├── index.html              # Punto de entrada principal
├── manifest.json           # Manifest PWA (instalable en Android)
├── sw.js                   # Service Worker (soporte offline)
├── src/
│   ├── app.js              # Lógica principal de las 4 pestañas
│   ├── styles.css          # Design system completo (dark mode)
│   ├── icons.js            # Iconos Lucide SVG
│   ├── db/
│   │   └── database.js     # Servicio IndexedDB (CRUD + lógica)
│   └── data/
│       └── feriados.js     # Feriados argentinos 2026
└── README.md
```

## 🔧 Exportar / Importar datos

- Botón de **exportar** (↓) en el header: genera un archivo JSON con todos tus datos
- Útil para backup o para migrar a otro dispositivo

## 📄 Licencia

Proyecto personal para uso académico.
