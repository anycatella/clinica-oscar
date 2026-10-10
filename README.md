# Clínica Oscar

Aplicación web para organizar documentos personales de Oscar: historial por fecha médica, originales descargables, lectura de PDF e imágenes con OCR local, revisión y edición, comparación de dos fechas, evolución con tabla y gráfico, calendario de quimioterapia y PWA.

## Alcance de esta versión

Uso personal bajo control del usuario, con autorización del titular para guardar y compartir sus documentos. Admite PDF, JPG y PNG personales; no admite PHI sujeto a HIPAA ni se ofrece como servicio HIPAA. Las [condiciones de Sites](https://openai.com/policies/chatgpt-sites-terms/) distinguen PHI de otros datos sensibles. [HHS](https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/cell-phone-hipaa/index.html) distingue aplicaciones personales de las ofrecidas por entidades cubiertas. Esta configuración sigue el uso personal declarado por el usuario; no acredita cumplimiento legal general. Todos los portadores del enlace pueden consultar, descargar, editar y eliminar registros. No publicar el enlace en el repositorio.

La app empieza vacía. Los valores no son diagnósticos ni recomendaciones: Bajo/Normal/Alto usa solo rangos revisados de cada documento. Subió/Bajó muestra la dirección del cambio entre fechas. No incluye funciones de voz ni múltiples pacientes.

## Desarrollo

Requiere Node >=22.13.0. Instalar con `npm ci`, luego `npm test`, `npm run typecheck` y `npm run dev`. El starter incorpora la integración de Sites y no debe sustituirse por un export estático.

D1 guarda documentos y sesiones; las mediciones revisadas se guardan como JSON estructurado dentro del documento para permitir modificaciones atómicas. R2 guarda los originales. Los adaptadores de datos y archivos pueden reemplazarse sin cambiar la interfaz.

Configuración nativa: `.openai/hosting.json` declara `DB` y `BUCKET`. Configurar `LINK_KEY_SHA256` como secreto del runtime. El enlace tiene una clave aleatoria de 32 bytes en el fragmento; nunca guardar la clave real en este repositorio. Localmente se puede crear `.dev.vars` (ignorado) con el hash de una clave de pruebas. `.env.example` documenta el nombre, sin credenciales.

Generar migraciones con `npm run db:generate`; la publicación de Sites aplica las migraciones alojadas. Para pruebas locales, construir primero y aplicar cada SQL según el README del starter; no repetir migraciones ya aplicadas.

## Documentos y accesibilidad

PDF, JPEG y PNG hasta 25 MB. PDF.js extrae texto seleccionable; Tesseract.js procesa imágenes y páginas escaneadas en el navegador. Los recursos OCR se sirven desde este origen. No se envían documentos a una API de IA. Los datos detectados siempre requieren revisión. Una lectura fallida permite guardar el original con datos manuales.

Texto Normal/Grande/Muy grande, alto contraste, controles amplios, teclado y gráficos acompañados de tablas. Objetivo de accesibilidad WCAG 2.2 AA; consultar el registro de verificaciones para límites de pruebas.

El service worker cachea solo la interfaz y omite API y documentos. La app no permite guardar cambios sin conexión. Instalar mediante el botón o Agregar a pantalla de inicio según el navegador.

## Licencias de recursos

PDF.js y Tesseract.js: Apache-2.0. Se incluyen sus licencias en `public/pdf/` y `public/ocr/`. Modelo español de `@tesseract.js-data/spa` obtenido del origen documentado por Tesseract. Iconos de interfaz: lucide-react. El icono de la aplicación fue dibujado específicamente para este proyecto.

El código público no contiene archivos médicos, credenciales de enlace ni volcados de base.
