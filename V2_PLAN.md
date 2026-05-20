# Plan v2 — Unidad Hermenéutica

## Estado Actual: v1 Estable

La aplicación en `index.html` es la versión 1 estable con todos los bugs corregidos y optimizaciones implementadas.

### Lo que funciona en v1
- ✅ Codificación de citas individuales e intercambios
- ✅ Sistema de categorías con familias (ALG/SUB/COL/General)
- ✅ Autocompletado inteligente
- ✅ Dashboard con gráficos (Chart.js)
- ✅ Heatmap sesión × categoría
- ✅ Saturación teórica (indicador)
- ✅ Notas de campo (tab independiente)
- ✅ Evidencia (imágenes y audio en base64)
- ✅ Exportación JSON, CSV, DOCX, Markdown
- ✅ Importación JSON con deduplicación
- ✅ Filtros por categoría
- ✅ Búsqueda en memos y notas
- ✅ Cache de categorías para rendimiento
- ✅ Debounce en autocompletado

### Bugs Corregidos
1. `saveCitation()` fallaba con `cit.turnos.length` cuando era null
2. Scroll bloqueado por `overflow: hidden` en body/paneles
3. Selector de categorías duplicando opciones en `renderMemos()`
4. Gráficos Chart.js recreándose innecesariamente

---

## Funcionalidades Pendientes (Plan Original)

### 1. Campo Hora en Formularios
**Estado:** No implementado
**Complejidad:** Baja
**Descripción:** Agregar campo de hora al formulario de citas (además de fecha).
**Implementación:**
- Agregar `<input type="time">` al form-grid
- Guardar en `cit.hora`
- Mostrar en cita renderizada
- Usar en análisis temporal (futuro)

### 2. Objetivos de Tesis (4 Botones)
**Estado:** No implementado
**Complejidad:** Media
**Descripción:** Mostrar objetivos de la tesis como botones informativos en el dashboard.
**Implementación:**
- Crear sección en dashboard
- 4 objetivos predefinidos
- Marcar progreso por objetivo
- Vincular citas/memos a objetivos

### 3. Copiar a Docs (Citas y Notas)
**Estado:** No implementado
**Complejidad:** Baja
**Descripción:** Botón para copiar cita al portapapeles en formato listo para Google Docs.
**Implementación:**
- `navigator.clipboard.writeText()`
- Formatear texto con metadatos
- Opción: copiar cita completa o solo fragmento

### 4. Notas de Campo (Tab Independiente)
**Estado:** ✅ IMPLEMENTADO
**Nota:** Ya está en v1. Ver sección "Notas de Campo" en el panel central.

---

## Propuestas para v2

### A. Tejido de Categorías (Inter-categorías)
**Prioridad:** Alta
**Descripción:** Visualización de relaciones entre categorías (mapa conceptual).
**Por qué:** Permite ver cómo se conectan las categorías codificadas.
**Implementación:**
- Tabla de co-ocurrencia (qué categorías aparecen juntas)
- Visualización tipo grafo con D3.js o vis.js
- Detectar patrones de co-ocurrencia frecuente

### B. Códigos In Vivo como Primera Clase
**Prioridad:** Media
**Descripción:** Los códigos in vivo tendrían su propio panel y análisis.
**Por qué:** Ahora son solo un campo texto; podrían ser codificables, agrupables y filtrables.
**Implementación:**
- Panel dedicado para códigos in vivo
- Agrupación automática por similitud
- Filtro por código in vivo
- Estadísticas de frecuencia

### C. Citas Comentadas (Co-investigación)
**Prioridad:** Baja-Media
**Descripción:** Sistema de comentarios para discutir citas con co-investigador.
**Por qué:** Permite trabajo colaborativo (aunque no hay backend).
**Implementación:**
- Campo de comentarios por cita
- Multi-autor (simulado con nombre de investigador)
- Exportar comentarios

### D. Análisis Temporal
**Prioridad:** Media
**Descripción:** Tendencia de categorías a lo largo del tiempo.
**Por qué:** Permite ver evolución de temas en las entrevistas.
**Implementación:**
- Gráfico de línea (categorías vs tiempo)
- Filtro por período
- Exportar series temporales

### E. Exportar Memos Separados
**Prioridad:** Alta
**Descripción:** Exportar solo los memos en formato para el capítulo de hallazgos.
**Por qué:** Los memos son el material interpretativo central de la tesis.
**Implementación:**
- Nueva función `exportMemos()`
- Agrupar por categoría
- Incluir contexto de cada cita
- Formato académico

### F. Búsqueda Semántica
**Prioridad:** Baja
**Descripción:** Buscar por conceptos relacionados, no solo por texto exacto.
**Por qué:** Mejora la recuperación de información codificada.
**Implementación:**
- Tesauro de sinónimos
- Búsqueda por raíz de palabras
- Filtros combinados (categoría + tono + fecha)

---

## Cambio de Arquitectura Propuesto

### Opción 1: Mantener Single-File (Conservador)
**Ventajas:** Simplicidad, sin infraestructura, portátil
**Desventajas:** localStorage limitado, sin colaboración
**Ideal para:** Proyecto pequeño (<50 citas), un solo investigador

### Opción 2: Migrar a IndexedDB (Moderado)
**Ventajas:** Más almacenamiento, mejor rendimiento, sin backend
**Desventajas:** Requiere migración, API más compleja
**Cambios:** Reemplazar localStorage por IndexedDB

### Opción 3: Stack Completo (Avanzado)
**Ventajas:** Colaboración, backup automático, análisis avanzado
**Desventajas:** Requiere servidor, hosting, más complejidad
**Tech:** Node.js + Express + SQLite + React/Vue

---

## Decisiones Pendientes

1. **¿Migrar a IndexedDB?** Si hay muchas citas/adjuntos, sí. Si no, mantener localStorage.
2. **¿Agregar backend?** Solo si se necesita colaboración o backup automático.
3. **¿Priorizar análisis o codificación?** La mayoría de funciones están en codificación; el análisis visual es el próximo paso lógico.
4. **¿Exportación académica?** Crear formato específico para capítulos de tesis.

---

## Checklist para Próximo Chat

Cuando un nuevo asistente tome este proyecto:

1. Leer `README.md` y `ARCHITECTURE.md`
2. Leer `CATEGORIAS.md`
3. Revisar `index.html` completo
4. Confirmar qué funcionalidad implementar primero
5. Hacer backup de `index.html` antes de modificar
6. Probar que todo funciona después de cambios

## Instrucciones para el Próximo Asistente

```
1. Leer primero: README.md, ARCHITECTURE.md, CATEGORIAS.md
2. Leer index.html completo para entender el código
3. Preguntar al usuario qué funcionalidad implementar primero
4. Hacer backup de index.html antes de cualquier cambio
5. Probar en navegador después de cada cambio
6. Actualizar este documento con el progreso
```
