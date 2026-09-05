# Sprint 0 · Kaavar PM

PWA offline (vanilla HTML/CSS/JS, sin frameworks ni dependencias) para tu incorporación como PM en Kaavar Plants & Design. Cubre las 6 piezas del kit de Sprint 0:

1. **Backlog** — historias por épica (E1–E5) con prioridad MoSCoW
2. **Kanban** — mueve cada historia por las 5 etapas del descubrimiento
3. **Checklists** — primera semana (onboarding) + visita de campo por línea (vivero, obra, mantenimiento), con historial de visitas
4. **AS-IS** — mapeo de procesos tal como funcionan hoy
5. **Riesgos** — matriz de riesgos, precargada con los 6 riesgos iniciales del kit
6. **Reporte** — reporte semanal con botón "Copiar texto" listo para pegar en WhatsApp o correo

## Cómo usarla ahora mismo (sin instalar nada)

Abre `index.html` directamente en el navegador del celular o la compu. Funciona completa sin internet; los datos se guardan en ese navegador (localStorage), en ese dispositivo.

**Limitación de abrirla así:** el botón "Agregar a pantalla de inicio" con ícono propio y el modo offline vía Service Worker solo se activan cuando la app se sirve por `http/https`, no cuando se abre como archivo suelto (`file://`). Para uso diario en campo desde el celular te conviene el paso siguiente.

## Para instalarla en la pantalla de inicio del celular

Sube esta carpeta completa a cualquier hosting estático gratuito, por ejemplo:
- **GitHub Pages** (si ya usas GitHub, es lo más simple: repo → Settings → Pages)
- **Netlify Drop** (netlify.com/drop — arrastras la carpeta y te da un link al instante)
- **Vercel**

Con el link resultante, abre la app desde Chrome en Android o Safari en iPhone y elige "Agregar a pantalla de inicio". Quedará con su propio ícono y abrirá a pantalla completa como una app nativa.

## Respaldo de datos

Como todo se guarda localmente en el navegador, usa el menú **⋮** (arriba a la derecha) para:
- **Exportar respaldo (JSON)** — antes de limpiar caché del navegador, cambiar de celular, o simplemente como respaldo semanal
- **Importar respaldo** — para restaurar o pasar tu información a otro dispositivo
- **Reiniciar todo** — borra todo lo capturado en ese dispositivo (usarlo con cuidado)

## Estructura de archivos

```
index.html      → estructura de la app
styles.css      → estilos (paleta café/verde inspirada en Kaavar, no es su logo real)
app.js          → toda la lógica: estado, formularios, render de cada pestaña
manifest.json   → metadatos de instalación
sw.js           → service worker para funcionamiento offline
icons/          → ícono propio de la app (no es el logo de Kaavar)
```

Nota: el ícono de la app es un diseño original (portapapeles con checklist) — no es el logo real de Kaavar, para no generar confusión de marca.
