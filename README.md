# Unidad Hermenéutica — Uber Mendoza

Aplicación web para análisis cualitativo de entrevistas a conductores de Uber en Mendoza, diseñada para la tesina de sociología (UNCuyo). Permite codificación abierta, axial y selectiva de fragmentos de chat, con visualización de datos y exportación a múltiples formatos.

## 🚀 Inicio Rápido

1. Abrir `index.html` en cualquier navegador moderno
2. No requiere servidor, internet ni instalación
3. Los datos se guardan automáticamente en `localStorage` del navegador

## 📋 Estructura del Proyecto

```
unidad-hermeneutica/
├── index.html              # Aplicación completa (HTML + CSS + JS)
├── README.md               # Este archivo
├── ARCHITECTURE.md         # Arquitectura técnica detallada
├── CATEGORIAS.md           # Estructura de categorías
├── V2_PLAN.md              # Plan para próxima iteración
├── BACKUP_INSTRUCCIONES.md # Cómo hacer backups
└── backups/                # Directorio para respaldos
```

**Nota:** La aplicación es un archivo único (`index.html`). No hay build process, frameworks ni dependencias locales.

## 🧩 Funcionalidades

### Codificación de Citas
- **Cita individual**: fragmento de chat de un participante
- **Intercambio**: múltiples participantes con turnos (mínimo 2)
- Campos: fecha, sesión (mañana/noche), participante, tipo, género, categoría, código in vivo, tono, memo

### Sistema de Categorías
- **Famlias**: `ALG:` (Algoritmo), `SUB:` (Subjetividad), `COL:` (Colectivo)
- **General**: categorías sin prefijo
- Autocompletado inteligente al escribir
- Indicador de saturación teórica

### Dashboard
- Métricas: total de citas, categorías activas, días observados, archivos adjuntos
- Gráfico de barras: frecuencia por categoría
- Gráfico de dona: distribución por género
- Heatmap: sesión × categoría
- Advertencias de saturación teórica

### Notas de Campo
- Tab independiente en panel central
- Crear, editar, eliminar notas
- Búsqueda en tiempo real
- Almacenamiento en `localStorage`

### Exportación
- **JSON**: backup completo con importación
- **CSV**: datos estructurados para análisis
- **DOCX**: informe formateado para Word
- **Markdown**: notas para editores Markdown

### Evidencia
- Adjuntar imágenes y audio (máximo 5 por cita)
- Almacenamiento en base64 en localStorage
- Vista previa con thumbnails

## 🔧 Tecnologías

- **Vanilla JavaScript** (ES6+)
- **Chart.js**: visualizaciones
- **PapaParse**: exportación CSV
- **docx.js**: exportación DOCX
- **html2canvas**: captura de contenido

## 💾 Almacenamiento

| Clave | Contenido |
|-------|-----------|
| `uh_uber_mendoza_citas` | Citas codificadas |
| `uh_uber_mendoza_field_notes` | Notas de campo |

**Limitación:** localStorage tiene ~5-10MB. Para proyectos grandes, exportar regularmente.

## 📊 Estructura de Datos

### Cita (Citation)
```json
{
  "id": 1234567890,
  "fecha": "2026-05-15",
  "sesion": "mañana",
  "tipo_registro": "cita",
  "participante": "P01",
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

### Intercambio (Intercambio)
```json
{
  "id": 1234567890,
  "fecha": "2026-05-15",
  "sesion": "noche",
  "tipo_registro": "intercambio",
  "participante": "P01",
  "tipo_participante": "veterano",
  "genero": "masculino",
  "categoria": "SUB:002",
  "codigo_invivo": "uno tiene que pelear",
  "tono": "tenso",
  "memo": "Resistencia ante la imposibilidad",
  "fragmento": null,
  "turnos": [
    {"id": 1, "participante": "P01", "genero": "masculino", "mensaje": "Uno tiene que pelear"},
    {"id": 2, "participante": "P02", "genero": "femenino", "mensaje": "Así es, hay que luchar"}
  ],
  "cantidad_turnos": 2,
  "descripcion_intercambio": "Dinámica de resistencia compartida",
  "media": []
}
```

### Nota de Campo (FieldNote)
```json
{
  "id": 1234567890,
  "texto": "Los conductores veteranos muestran más confianza en el algoritmo",
  "fecha": "2026-05-15T10:00:00.000Z",
  "fecha_modificacion": "2026-05-15T10:00:00.000Z"
}
```

## 🗂️ Sistema de Categorías

Ver `CATEGORIAS.md` para la estructura completa.

Prefijos:
- `ALG:` → Algoritmo (lógica del sistema)
- `SUB:` → Subjetividad (experiencia personal)
- `COL:` → Colectivo (relaciones sociales)
- Sin prefijo → General

## 🎨 Diseño

- **Layout**: 3 paneles (código | formulario | dashboard)
- **Responsive**: optimizado para desktop
- **Colores**: azul (#2563eb), gris claro (#f8fafc), acentos por familia
- **Scroll**: cada panel tiene scroll independiente

## ⚠️ Limitaciones

1. **localStorage**: ~5-10MB de almacenamiento
2. **Sin servidor**: no hay autenticación ni colaboración
3. **Imágenes/audio**: almacenados en base64 (ocupan espacio)
4. **Sin backup automático**: el usuario debe exportar regularmente
5. **Un solo usuario**: no hay multi-investigador

## 🔒 Privacidad

- Todo se ejecuta localmente en el navegador
- No se envían datos a ningún servidor
- Las imágenes/audio se almacenan en base64 en localStorage
