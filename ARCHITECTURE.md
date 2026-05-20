# Arquitectura Técnica — Unidad Hermenéutica

## Visión General

Aplicación web de un solo archivo (`index.html`) sin frameworks, build process ni servidor. Toda la lógica, estilos y datos residen en un único archivo HTML de ~1666 líneas.

## Estructura del Archivo

```
index.html
├── <head>
│   ├── Meta tags
│   ├── Scripts CDN (Chart.js, PapaParse, docx.js, html2canvas)
│   └── <style> — CSS completo (~600 líneas)
├── <body>
│   ├── <header> — Barra superior con título y botones de exportación
│   ├── <div class="container"> — Layout de 3 paneles
│   │   ├── <div class="panel-left"> — Árbol de códigos
│   │   ├── <div class="panel-center"> — Formulario + lista de citas
│   │   └── <div class="panel-right"> — Dashboard + Memos
│   └── <footer>
└── <script> — JavaScript completo (~800 líneas)
```

## Componentes Principales

### 1. Panel Izquierdo — Sistema de Códigos
**Función:** `renderCodeTree()`
- Agrupa categorías por familia (ALG/SUB/COL/General)
- Muestra conteo por categoría
- Indicador visual de saturación
- Click filtra citas por categoría

**Estado:** `currentFilter` (categoría activa o null)

### 2. Panel Central — Formulario
**Funciones clave:**
- `saveCitation()`: guarda cita o intercambio
- `toggleType()`: alterna entre cita individual e intercambio
- `addTurn()` / `removeTurn()`: gestiona turnos
- `handleMedia()`: procesa archivos como base64
- `showCategorySuggestions()`: autocompletado

**Campos:**
- Fecha (date picker)
- Sesión (select: mañana/noche)
- Participante (texto libre, auto-incremental P01, P02...)
- Tipo participante (veterano/nuevo/líder/sin_clasificar)
- Género (masculino/femenino/no_binario/no_identificado)
- Tipo registro (cita/intercambio)
- Fragmento (textarea, solo cita individual)
- Categoría (input con autocompletado)
- Código In Vivo (texto libre)
- Tono (select)
- Memo (textarea)
- Evidencia (file input)

### 3. Panel Central — Citas Recientes
**Función:** `renderCitationsList()`
- Muestra últimas 20 citas
- Filtra por categoría activa
- Muestra fragmento, categoría, tono, código in vivo
- Botón eliminar por cita

### 4. Panel Central — Notas de Campo
**Funciones:**
- `saveFieldNote()`: crea o edita nota
- `deleteFieldNote(id)`: elimina nota
- `editFieldNote(id)`: carga nota en textarea
- `renderFieldNotes()`: renderiza lista con búsqueda

**Estado:** `currentFieldNoteEditId` (null si es nueva)

### 5. Panel Derecho — Dashboard
**Funciones:**
- `renderDashboard()`: métricas generales
- `renderCategoryChart()`: barras de frecuencia
- `renderGenderChart()`: dona de género
- `renderHeatmap()`: sesión × categoría
- `renderSaturationWarnings()`: advertencias

**Métricas:**
- Total citas
- Categorías activas
- Días observados
- Archivos adjuntos
- Citas vs Intercambios

### 6. Panel Derecho — Memos
**Funciones:**
- `renderMemos()`: renderiza memos con filtro
- `filterMemos()`: filtra por categoría y búsqueda

## Funciones de Datos

| Función | Descripción |
|---------|-------------|
| `loadCitations()` | Carga desde localStorage |
| `saveCitations()` | Guarda en localStorage + invalidate caches |
| `getNextPid()` | Genera siguiente ID de participante (P01, P02...) |
| `getCategories()` | Devuelve categorías únicas ordenadas (con cache) |
| `getCategoryCount(cat)` | Cuenta citas por categoría (con cache) |
| `isSaturated(cat)` | Verifica saturación teórica |
| `getFamily(code)` | Devuelve familia de un código |

## Optimizaciones

### Cache de Categorías
```javascript
let categoriesCache = null;
let categoriesCountCache = {};

function invalidateCaches() {
    categoriesCache = null;
    categoriesCountCache = {};
}
```

Se invalida en `saveCitations()` y se reconstruye lazy en `getCategories()`.

### Debounce
```javascript
function debounce(fn, delay) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => fn.apply(this, args), delay);
    };
}
```
Usado en autocompletado de categorías (100ms).

### Gráficos con Chart.js
Los gráficos se actualizan solo cuando cambian los datos:
```javascript
if (!chartInstances.category || categoriesChanged) {
    // Recrear gráfico
} else {
    // Actualizar datos existentes
}
```

## Sistema de Familias

```javascript
const FAMILIES = {
    'ALG:': { name: 'Algoritmo', color: '#2196F3' },
    'SUB:': { name: 'Subjetividad', color: '#4CAF50' },
    'COL:': { name: 'Colectivo', color: '#FF9800' }
};
const DEFAULT_FAMILY = { name: 'General', color: '#9E9E9E' };
```

Categorías sin prefijo van a `DEFAULT_FAMILY`.

## Exportaciones

### JSON
```javascript
{
    version: 'v3',
    exportado_en: '2026-05-15T10:00:00.000Z',
    citas: [...]
}
```
Incluye importación con detección de versiones (v2/v3) y deduplicación por ID.

### CSV
Headers: id, fecha, sesion, tipo_registro, participante, tipo_participante, genero, categoria, codigo_invivo, tono, memo, cantidad_turnos, tiene_adjunto, cantidad_adjuntos, turnos_resumen

### DOCX
Usa docx.js para generar documento Word con:
- Título, fecha, total de citas
- Secciones por cita con categoría como heading
- Fragmentos e intercambios formateados
- Memos en itálicas

### Markdown
Genera Markdown con:
- Encabezados por cita
- Citas en blockquote
- Intercambios como lista numerada
- Memos como notas

## Flujo de Datos

```
Usuario llena formulario
    ↓
usuario hace click en "Guardar cita"
    ↓
saveCitation() valida y crea objeto cit
    ↓
citations.unshift(cit) — agrega al inicio
    ↓
saveCitations()
    ├── invalidateCaches()
    ├── localStorage.setItem(STORAGE_KEY, JSON.stringify(citations))
    └── updateAll()
            ├── renderCitationsList()
            ├── renderDashboard()
            ├── renderMemos()
            └── renderFieldNotes() (si tab activo)
```

## Puntos de Entrada

```javascript
function init() {
    loadCitations();
    loadFieldNotes();
    updateDate();
    renderCitationsList();
    renderCodeTree();
    renderDashboard();
    renderMemos();
    addTurn();
    initCharts();
    // Event listeners...
}
```

## Eventos

| Elemento | Evento | Función |
|----------|--------|---------|
| category input | input (debounced) | showCategorySuggestions |
| registrationType | change | toggleType |
| media file | change | handleMedia |
| save button | click | saveCitation |
| delete button | click | deleteCitation |
| export buttons | click | exportJSON/CSV/DOCX/MD |
| import file | change | importJSON |
| tabs | click | switchTab / switchPanelCenterTab |
| memoFilter | change | filterMemos |
| memoSearch | input | filterMemos |
| fieldNotesSearch | input | renderFieldNotes |

## Estado Global

```javascript
let citations = [];           // Array de citas
let currentFilter = null;     // Categoría filtrada
let currentTurns = [];        // Turnos del intercambio actual
let currentMedia = [];        // Archivos adjuntos actuales
let chartInstances = {};      // Instancias Chart.js
let categoriesCache = null;   // Cache de categorías
let categoriesCountCache = {}; // Cache de conteos
let fieldNotes = [];          // Notas de campo
let currentFieldNoteEditId = null; // ID nota en edición
```

## Versionado

- **v3**: versión actual (con field notes)
- **v2**: versión anterior (sin field notes, sin genero)
- **v1**: versión original (antes de refactor)

La importación detecta versión y mapea campos faltantes.

## Bugs Corregidos

1. **`saveCitation()` con turnos null**: cit.turnos.length fallaba en citas individuales. Solución: inicializar `cit.turnos = null` y verificar antes de acceder.
2. **Scroll bloqueado**: body y paneles tenían `overflow: hidden`. Solución: `overflow-y: auto` en paneles.
3. **Selector duplicado**: `renderMemos()` agregaba opciones al select sin limpiar. Solución: separar `filterMemos()` de `renderMemos()`.
4. **Rendimiento**: gráficos se recreaban con cada render. Solución: verificar cambios antes de recrear.
