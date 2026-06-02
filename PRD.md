# PRD — Unidad Hermenéutica v1
**Tesina de Sociología · UNCuyo · GT Conductores Uber Mendoza**
*Versión: 1.0 · Fecha: junio 2026 · Estado: producción activa*

---

## 1. Propósito

Herramienta de análisis cualitativo de entrevistas de chat para una tesina de sociología sobre conductores de Uber en Mendoza. Permite codificación abierta, axial y selectiva de fragmentos de chat, con visualización de datos y exportación para escritura académica.

---

## 2. Usuarios

| Usuario | Rol |
|---|---|
| Investigadora principal | Única usuaria — carga, codifica y analiza |

---

## 3. Funcionalidades v1 (producción)

### 3.1 Codificación
- **Cita individual**: fragmento de chat de un participante con categoría, código in vivo, tono y memo
- **Intercambio**: múltiples participantes con turnos (mínimo 2), importación directa desde .txt de WhatsApp
- Campos obligatorios: participante, categoría, fragmento o turnos
- Campos opcionales: hora (auto-completada), nombre, teléfono, tipo, género, memo, evidencia adjunta

### 3.2 Sistema de Categorías
- Tres familias: `ALG:` (Algoritmo), `SUB:` (Subjetividad), `COL:` (Colectivo)
- Categorías generales sin prefijo
- Autocompletado inteligente con creación de nuevas categorías al vuelo
- Gestión: renombrar, fusionar categorías
- Indicador de saturación teórica (orientativo, requiere juicio interpretativo)

### 3.3 Participantes
- Registro por ID (P01, P02...) con nombre y teléfono opcionales
- Autocomplete al cargar citas — detecta participantes existentes
- Panel de participantes con estadísticas de mensajes

### 3.4 Dashboard y Análisis
- Métricas: total citas, categorías activas, días observados, archivos adjuntos
- Gráfico de barras: frecuencia por categoría
- Gráfico de dona: distribución de género
- Heatmap: sesión (mañana/noche) × categoría
- Advertencias de saturación teórica

### 3.5 Tejido de Categorías
- Matriz de co-ocurrencias entre categorías
- Agrupable por participante o por sesión
- Ranking de los pares más relacionados

### 3.6 Notas de Campo
- Notas libres con fecha, búsqueda en tiempo real
- Edición y eliminación

### 3.7 Exportación
| Formato | Contenido |
|---|---|
| JSON | Backup completo (citas, notas, participantes) — para importar de vuelta |
| CSV | Datos tabulares para análisis en Excel/Sheets |
| Markdown | Memos interpretativos agrupados por categoría, listos para el capítulo de hallazgos |

### 3.8 Almacenamiento y Sincronización
- Almacenamiento primario: IndexedDB local via localforage (sin servidor)
- Sincronización: Google Drive (guardar y cargar JSON vía OAuth 2.0)
- Import JSON: deduplicación automática por ID

---

## 4. Arquitectura

| Decisión | Elección | Razón |
|---|---|---|
| Estructura | Single-file (index.html) | Sin build process, portable, sin dependencias |
| Storage | IndexedDB (localforage) | > capacidad que localStorage, misma API |
| Sync | Google Drive API v3 | Sin servidor propio, datos en cuenta de la investigadora |
| Charts | Chart.js (CDN) | Liviano, suficiente para el volumen de datos |
| CSV | PapaParse (CDN) | Exportación robusta |
| Auth | Google Identity Services | OAuth 2.0 en browser, sin backend |

---

## 5. Modelo de Datos

### Cita
```json
{
  "id": 1234567890,
  "fecha": "2026-06-02",
  "hora": "10:30",
  "sesion": "mañana",
  "tipo_registro": "cita",
  "participante": "P01",
  "participante_nombre": "Juan García",
  "participante_telefono": "261-XXXX",
  "tipo_participante": "veterano",
  "genero": "masculino",
  "categoria": "ALG:001",
  "codigo_invivo": "el algoritmo me busca",
  "tono": "solidario",
  "memo": "Patrón de confianza en el sistema",
  "fragmento": "El algoritmo siempre me busca cuando estoy cerca del centro",
  "turnos": null,
  "media": []
}
```

### Intercambio
```json
{
  "tipo_registro": "intercambio",
  "turnos": [
    {"id": 1, "participante": "P01", "genero": "masculino", "mensaje": "..."},
    {"id": 2, "participante": "P02", "genero": "femenino", "mensaje": "..."}
  ],
  "cantidad_turnos": 2,
  "descripcion_intercambio": "Dinámica de resistencia compartida"
}
```

### Claves IndexedDB
| Clave | Contenido |
|---|---|
| `uh_uber_mendoza_citas` | Array de citas e intercambios |
| `uh_uber_mendoza_field_notes` | Array de notas de campo |
| `uh_uber_mendoza_participants` | Array de participantes |
| `uh_migrated_lf` | Flag de migración desde localStorage |
| `uh_drive_fileid` | ID del archivo JSON en Google Drive |

---

## 6. ⚠️ Reglas de Continuidad de Datos

**CRÍTICO: desde el inicio del registro de datos (junio 2026) ningún cambio puede romper la compatibilidad con los datos existentes.**

### Prohibido
- Cambiar o eliminar las claves IndexedDB (`uh_uber_mendoza_*`)
- Eliminar campos del objeto cita
- Cambiar el tipo de dato de campos existentes
- Resetear datos sin confirmación explícita de la investigadora
- Cambiar la versión de exportación sin mantener import de versiones anteriores (v2, v3, v4)

### Obligatorio en cualquier cambio futuro
- Nuevos campos: siempre opcionales, con valor por defecto (`null` o `''`)
- Migración de datos: si se cambia estructura, escribir función de migración que se ejecuta en `init()`
- Antes de cualquier edit a `index.html`: hacer backup en `/backups/`
- Testear importación del JSON de backup existente antes de deployar

### Versiones de exportación soportadas
| Versión | Estado |
|---|---|
| v2 | Import OK (legado) |
| v3 | Import OK (legado) |
| v4 | **Actual** |

---

## 7. URLs y Accesos

| Recurso | URL |
|---|---|
| App en producción | https://unidad-hermeneutica.vercel.app |
| Repositorio | https://github.com/federicagonzalezfotos-cloud/unidad-hermeneutica |
| Google Cloud Project | decent-booster-419017 |
| OAuth Client | 215247255613-m78e2sv09ashvctgfi81m084mui29q50.apps.googleusercontent.com |

---

## 8. Pendiente v2 (no urgente — pospuesto hasta fin del trabajo de campo)

| Feature | Prioridad | Descripción |
|---|---|---|
| Análisis Temporal | Media | Gráfico de tendencia de categorías a lo largo del tiempo |
| Objetivos de Tesis | Media | 4 botones en análisis vinculados a citas y memos |
| Copiar a Docs | Baja | Botón para copiar cita formateada al portapapeles |
| Códigos In Vivo | Media | Panel propio con frecuencia y agrupación |

---

## 9. Flujo de Bugs y Mejoras

Ver sección "Cómo reportar" en la documentación del proyecto.
