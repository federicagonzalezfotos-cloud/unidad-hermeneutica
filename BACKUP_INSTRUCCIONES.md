# Instrucciones de Backup — Unidad Hermenéutica

## Por Qué Hacer Backup

Los datos se almacenan en `localStorage` del navegador, que tiene límites de espacio (~5-10MB) y puede ser borrado accidentalmente (limpieza del navegador, cambio de dispositivo, etc.).

## Métodos de Backup

### Método 1: Exportar JSON (Recomendado)
1. Abrir la aplicación en el navegador
2. Click en "Exportar JSON" en la barra superior
3. El archivo se descarga con nombre `backup_UH_YYYY-MM-DD.json`
4. Guardar en múltiples ubicaciones (disco externo, nube, email)

### Método 2: Copiar index.html
1. Hacer una copia del archivo `index.html`
2. Guardar con nombre descriptivo: `index_v1_backup_2026-05-17.html`
3. Las copias van en el directorio `backups/`

### Método 3: Usar el directorio backups/
```bash
# Desde la terminal, en el directorio del proyecto
cp index.html backups/index_v1_$(date +%Y-%m-%d).html
```

## Restaurar Datos

1. Abrir la aplicación en el navegador
2. Click en "Importar JSON"
3. Seleccionar el archivo de backup
4. La aplicación detectará automáticamente la versión y fusionará datos
5. Se mostrará cuántas citas son nuevas y cuántas ya existían

## Frecuencia Recomendada

- **Mínimo:** Una vez por semana
- **Recomendado:** Después de cada sesión de codificación
- **Ideal:** Después de codificar 5+ citas nuevas

## Advertencias

- Los archivos adjuntos (imágenes/audio) se almacenan en base64 y ocupan espacio
- Si localStorage está lleno, el backup es **imperativo**
- No hay backup automático — el usuario debe hacerlo manualmente

## Verificar Backup

1. Importar el backup en un navegador limpio
2. Verificar que todas las citas aparecen
3. Verificar que los memos están intactos
4. Verificar que las notas de campo están presentes
