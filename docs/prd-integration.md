# Integración del PRD de Clínica Oscar

Fecha: 9 de octubre de 2026.
Fuente: `clinica-oscar-prd-original.txt`, copia íntegra del documento aportado. El PRD es material de requisitos; las instrucciones que contiene sobre el rol del asistente no reemplazan las instrucciones de esta conversación.

## Base y precedencia

Se incorpora el PRD conservando los pedidos explícitos anteriores: calendario de quimioterapia y número de sesión, las seis métricas del tablero, PWA, compartir, instalación, duplicados y comparación de dos fechas. La exclusión de aplicación nativa es compatible con la PWA. La exclusión de turnos no elimina el calendario de tratamiento ya solicitado.

Esta integración complementa y actualiza la especificación y el plan anteriores. Sus cambios de alcance aún deben estar presentes en el plan revisado antes de iniciar la implementación.

## Incorporaciones

- Un paciente; D1/R2 nativos de Sites; sin Supabase, Firebase, autenticación externa ni funciones propias de voz. Compatibilidad con lectores de pantalla.
- Capa portable: DataService para registros/búsqueda; FileStorageService para originales; DocumentProcessingService para extracción/confianza; ComparisonService para normalización/comparativas. La interfaz no conoce D1/R2 directamente.
- Documento con institución, categoría, subcategoría editable, título, resumen descriptivo, conclusiones originales, estado de procesamiento y confianza por campo.
- Indicadores con nombre original y nombre normalizado; alias confirmados reutilizan indicador. Coincidencias inciertas requieren revisión y no se fusionan automáticamente.
- Confianza Alta/Media/Baja por campo importante. Mostrar “Revisar este dato” cuando sea Baja; no inventar porcentajes de precisión.
- Revisión antes y después de guardar de todos los campos, incluidos conclusiones, unidades y referencias.
- Bajo/Normal/Alto/Sin referencia se calcula solo con límites revisados del documento. Subió/Bajó corresponde a dirección del cambio entre fechas y se conserva por separado.
- Historial completo por indicador con gráfico accesible y tabla debajo: Fecha, Valor, Unidad, Referencia, Estado. Tabla descendente por fecha; gráfico con eje temporal proporcional y marcadores grandes.
- Conclusiones de estudios ordenadas por fecha y con fuente. No interpretar diferencias ni inventar conclusiones.
- Visores PDF e imagen con zoom, ajustar ancho, pantalla completa y descarga original.
- Búsqueda por nombre, categoría, subcategoría, indicador y año; filtros simples.
- Menú Accesibilidad: Normal 18 px, Grande 22 px, Muy grande 26 px y Alto contraste. Secundario mínimo 16 px, botones 18 px y targets 48 px. Mantener contraste alto objetivo 7:1 y evaluar WCAG 2.2 AA sin anunciar conformidad antes de comprobarla.
- Estados de procesamiento en español según trabajo real: Subiendo documento, Leyendo documento, Detectando resultados, Organizando información y Revisá los datos detectados.

## Eliminación y reemplazo

El PRD amplía el alcance anterior con Eliminar y Reemplazar archivo. Son funciones de producto; no autorizan borrar archivos locales ni datos externos durante el desarrollo.

Eliminar exige confirmar el documento y advertir que no se puede deshacer. Cancelar no realiza cambios. Se retirarán resultados, registro y original; se mantendrá estado pendiente si falla la limpieza y no se borrará un objeto aún referenciado. Confirmar con una versión desactualizada devolverá conflicto.

Reemplazar implica seleccionar nuevo archivo, extraer, revisar datos frente a los existentes y confirmar. Antes de confirmar o ante fallo, el original vigente seguirá accesible. Tras confirmar, se cambia la referencia de forma coherente y se limpia el archivo anterior sin referencias. Editar metadatos sigue preservando el original.

## Limitación verificada de Sites

El 9 de octubre de 2026 se verificó que Sites prohíbe procesar PHI. Los términos distinguen PHI de otros datos sensibles; no se debe afirmar que cualquier dato médico del mundo sea jurídicamente PHI. Conforme al PRD, la versión Sites se limita a documentos sintéticos o efectivamente anonimizados, sin datos médicos identificables de Oscar, y no se presenta como repositorio listo para su historia real.

Ocultar un nombre en pantalla no anonimiza el original. El aviso debe estar antes de seleccionar/subir archivos. No se subirán documentos identificables a Sites para anonimizarlos después. La modalidad real requiere decidir un alojamiento apropiado posteriormente; no se contratará ni migrará infraestructura automáticamente.

Fuentes oficiales verificadas:

- https://openai.com/policies/chatgpt-sites-terms/ — sección 3.3.
- https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites — Limits and unsupported uses.

## Estado

El original fue copiado sin modificaciones y ambos archivos tienen SHA-256 `94d594527e2da7d320f1dbd10c5887cccea9941ec9f82de5191136a7ccce3b2f`.

Existen únicamente documentos de diseño y planificación; no hay aplicación implementada, despliegue ni repositorio público creados. Se conserva inicio vacío sin muestras precargadas. Las pruebas podrán utilizar documentos sintéticos claramente identificados que se retirarán al entregar. No se afirmará que se verificó el historial real de Oscar usando esas pruebas.
