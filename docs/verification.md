# Verificación de Clínica Oscar

Fecha: 9 de octubre de 2026.

- 46 pruebas automáticas: acceso, fechas, comparaciones, referencias, lectura de texto, edición, archivos, duplicados simultáneos, fallos de almacenamiento, versiones concurrentes, limpieza durable y caché PWA.
- TypeScript sin errores y ESLint sin errores ni advertencias en el código propio. Bibliotecas OCR/PDF distribuidas se excluyen del lint.
- Compilación de producción con Vinext/Vite.
- En navegador: lectura de dos PDFs sintéticos; fechas 01/05/2026 y 10/09/2026; glucosa 105 y 96 mg/dL; comparación Bajó y Normal con referencia 70–99; hemoglobina 13,5 en ambas fechas; tabla histórica equivalente al gráfico.
- OCR local de una imagen sintética: fecha 12/09/2026, medición 12 mm, referencia 5–20 y conclusión literal. Revisión humana previa al guardado.
- Segunda sesión de navegador consulta los mismos tres originales desde la base compartida.
- API local: acceso sin enlace 401; duplicados por contenido; consulta compartida; descarga con SHA-256 idéntico al original; paginación.
- Vista móvil 390 px: sin desbordamiento del documento, también con base de texto 26 px. Navegación completa y tablas con desplazamiento interno.
- Revisión independiente de código completada. Se corrigieron consulta del original durante edición, cambio de tipo numérico, reconfirmación de alias, limpieza durable tras reemplazo, intervalo de fechas, originales en paralelo, paginación real y actualización de historia completa tras editar.

La versión alojada en Sites admite únicamente documentos sintéticos o efectivamente anonimizados. No usar con datos médicos identificables. La instalación en dispositivos físicos iOS/Android no se ha probado; se incluyen manifiesto, iconos, service worker, instalación cuando el navegador la ofrece e instrucciones para añadir a pantalla de inicio. Los originales y respuestas de API no se guardan en caché offline.

La biblioteca utiliza consultas paginadas. La historia completa se consulta por separado cuando se abre Comparativas. No se convierten unidades ni se interpretan diagnósticos. “Normal” depende del rango del documento más reciente elegido.
