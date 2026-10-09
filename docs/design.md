# Clínica Oscar — diseño de la aplicación

Fecha: 9 de octubre de 2026.
Estado: diseño detallado para revisión. La propuesta general fue aprobada; este documento aún no autoriza afirmar que la aplicación esté implementada o publicada.

Base complementaria: `docs/prd/clinica-oscar-prd-original.txt`. Las ampliaciones y diferencias están resueltas en `docs/prd/clinica-oscar-integracion.md`, que actualiza este diseño y conserva los requisitos explícitos anteriores.

## Objetivo y alcance

Crear un repositorio médico compartido para Oscar, accesible desde celulares, tablets y computadoras mediante un enlace, sin cuentas ni inicio de sesión. Personas mayores de 60 años deben poder encontrar, cargar y descargar documentos, revisar la evolución de indicadores y consultar las sesiones de quimioterapia.

La aplicación comienza vacía, sin muestras precargadas. Conforme al PRD y a la restricción de Sites sobre PHI, la versión en Sites solo se usará con documentos sintéticos o efectivamente anonimizados. No recibirá documentos médicos reales identificables de Oscar ni se presentará como historia real lista para el paciente. Los archivos se cargarán desde la interfaz; no se presupone integración con Drive ni importación de documentos usados en proyectos anteriores.

## Arquitectura elegida

Aplicación alojada en Sites, con interfaz responsive y API en el mismo origen. Se utilizará el starter Vinext con almacenamiento D1 para registros y R2 para archivos originales, según las capacidades documentadas de Sites. El navegador podrá conservar preferencias visuales; los documentos y registros se guardarán en el servidor.

DataService, FileStorageService, DocumentProcessingService y ComparisonService separarán registros, archivos, extracción y comparativas. Las capacidades y límites de Sites no acreditan aptitud para alojar información médica identificable. La prohibición de PHI fue verificada el 9 de octubre de 2026: https://openai.com/policies/chatgpt-sites-terms/, sección 3.3. Un aviso previo a la carga limitará el uso a documentos de prueba sin información identificable. Un despliegue para uso real requiere una decisión posterior sobre infraestructura apropiada, sin migraciones automáticas.

El código estará en un repositorio público de GitHub llamado `clinica-oscar`, si el nombre está disponible en la cuenta autenticada. No se incluirán documentos médicos, valores reales, copias de la base, enlaces con credenciales ni secretos. El repositorio de fuente de Sites y el repositorio público de GitHub se sincronizarán explícitamente; no se asumirá que son el mismo servicio.

## Acceso por enlace

El sitio permitirá visitas anónimas. El acceso a la carpeta médica usará un enlace con una clave aleatoria larga: no habrá usuarios, contraseñas ni invitaciones individuales. El servidor comprobará la clave en todas las operaciones de documentos, indicadores y calendario, incluidas las descargas.

Se recomienda transportar la clave en el fragmento del enlace y enviarla a la API mediante un encabezado, para evitar incluirla en las rutas de descarga o registros de solicitudes. La clave no se incorporará al código público; su verificador se configurará como secreto del servidor. La pantalla sin un enlace válido no mostrará datos médicos.

Quienes tengan el enlace podrán consultar, cargar documentos admitidos y registrar o corregir datos. El PRD incorpora eliminación y reemplazo con confirmación explícita dentro de la aplicación, según el documento de integración. El enlace compartido concederá acceso a los archivos admitidos: esta condición será visible al compartirlo. No se solicitará una confirmación adicional de audiencia porque el usuario ya pidió acceso para cualquiera que tenga el enlace.

## Dirección visual y accesibilidad

Estética de portal médico premium: fondo marfil claro, azul profundo para navegación, verde petróleo para acciones y tarjetas blancas con bordes suaves. Tipografía sans serif legible; texto principal de al menos 18 px y controles táctiles de al menos 48 px. Los estados se comunicarán con palabras e iconos además del color.

Habrá menú Accesibilidad con Normal (18 px), Grande (22 px), Muy grande (26 px) y Alto contraste, conservados como preferencias del dispositivo. Texto secundario mínimo 16 px y botones 18 px. Ningún tamaño perderá acciones ni datos. En modo de alto contraste, el texto principal y sus fondos tendrán una relación objetivo de al menos 7:1; se comprobarán colores renderizados, incluidos encabezados, botones y foco. Se evaluará WCAG 2.2 AA sin afirmar conformidad antes de comprobarla.

En computadora, navegación lateral con Inicio, Análisis, Estudios, Comparativas y Calendario. En celular, navegación accesible sin depender de gestos; las acciones de cargar, compartir e instalar permanecerán fáciles de encontrar. En tablets, las tarjetas se distribuirán según el espacio disponible. Se verificará funcionamiento con zoom del 200 %, teclado y lector de pantalla, además de ausencia de desplazamiento horizontal a 390 px.

## Pantallas y flujos

### Inicio

Encabezado “Clínica Oscar” y acceso a Cargar documentos, Compartir y Descargar app. El tablero mostrará exactamente:

- Fecha del último análisis.
- Fecha del último estudio.
- Cantidad de análisis guardados.
- Cantidad de estudios guardados.
- Fecha de la última quimioterapia realizada.
- Fecha de la próxima quimioterapia programada.

Si falta información, mostrará “Sin registros” o “Sin sesión programada”. Debajo aparecerán documentos recientes y la próxima sesión, si existe.

### Análisis y Estudios

Cada carpeta tendrá búsqueda, filtro por fecha y lista ordenada por fecha del documento en orden descendente. Cada tarjeta mostrará título, fecha, categoría, estado de revisión y acciones Ver PDF y Descargar original. La fecha de carga se conservará como metadato separado y no sustituirá la fecha médica.

El historial se agrupará por fecha médica con encabezados legibles y la fecha más reciente arriba. Dentro de cada día, se conservarán todos los documentos, con categoría y enlace al original. Se podrán ver todas las fechas o filtrar un intervalo sin modificar el historial guardado. Las imágenes tendrán vista previa y descarga del archivo original, además de los PDF.

Documentos con institución cuando figure, subcategoría editable, resumen descriptivo y conclusiones originales. Búsqueda por nombre, categoría, subcategoría, indicador y año. El visor ofrecerá zoom, ajustar ancho, pantalla completa y descarga original.

Cuando el documento contenga varias fechas, el usuario confirmará la fecha del análisis o estudio antes de guardar. Si no puede determinarse, la carga permanecerá en revisión y no se mezclará con la lista ordenada de documentos confirmados.

### Carga de documentos

Selección múltiple de PDF y fotografías de documentos. Límite inicial propuesto: 25 MB por archivo, indicado antes de cargar. La interfaz mostrará progreso, resultado por archivo y errores que permitan reintentar sin repetir los archivos ya guardados.

Se extraerá texto de PDF con texto seleccionable. Para escaneos y fotografías se utilizará OCR, con procesamiento en el dispositivo cuando sea viable. La vista previa propondrá categoría, fecha e indicadores detectados. El usuario revisará y corregirá los datos antes de incorporarlos a las comparativas. No se contratará una API de pago para OCR o extracción sin autorización.

Si la extracción falla o el archivo está protegido, el original podrá guardarse con fecha y categoría confirmadas manualmente. Se indicará que sus indicadores no fueron extraídos y se permitirá agregarlos manualmente. No se presentará esta situación como una extracción exitosa.

La acción “Revisar y editar” estará disponible antes y después de guardar. Permitirá corregir título, categoría, fecha médica, indicadores, valores, unidades y referencias mientras se consulta el original. Guardar una corrección actualizará el historial, tablero y comparativas; el archivo original y su hash permanecerán intactos. Se conservarán fecha de modificación y número de versión. Si otra persona modificó el registro durante la edición, se avisará y se pedirá revisar la versión actual antes de sobrescribir sus cambios.

La revisión también abarcará institución, subcategoría, resumen y conclusiones. Cada campo importante conservará confianza Alta/Media/Baja y los de confianza Baja mostrarán “Revisar este dato”. Los nombres originales se conservarán y los alias se normalizarán solo tras revisión. No habrá funciones propias de voz ni interpretación médica de conclusiones.

Los duplicados exactos se detectarán mediante SHA-256 del contenido original y una restricción única en el servidor. Renombrar el mismo archivo no creará otro registro. Una coincidencia por fecha o título se mostrará como advertencia, sin descartar documentos distintos automáticamente.

### Comparativas

Cada medición conservará nombre del indicador, valor, unidad, rango de referencia si figura en el documento, fecha y vínculo al archivo fuente. Solo los datos revisados alimentarán las comparativas.

La comparación principal permitirá seleccionar dos fechas disponibles dentro de Análisis o Estudios. La tabla tendrá cinco columnas: Indicador, Valor de la fecha anterior, Valor de la fecha más reciente, Cambios y Valores de referencia actuales. Los encabezados mostrarán las fechas elegidas; el orden cronológico se mantendrá aunque se seleccionen en orden inverso.

“Subió” y “Bajó” describirán el cambio numérico entre las dos fechas con unidades compatibles. “Normal” indicará que el valor de la fecha más reciente está dentro del rango de referencia confirmado de ese documento. Cuando proceda, la celda combinará las etiquetas: “Bajó · Normal” o “Subió · Normal”. Si ambos valores son iguales, indicará “Sin cambios”, acompañado de “Normal” cuando corresponda. Un valor estable fuera del rango no se etiquetará como Normal.

Los valores de referencia actuales serán los del documento correspondiente a la fecha más reciente seleccionada, no rangos buscados en internet ni copiados de un documento anterior. Si no figuran, mostrará “No informado”. Para rangos numéricos se revisarán también sus límites y operadores antes de evaluar Normal; una referencia textual ambigua no se interpretará automáticamente.

La tabla incluirá indicadores presentes en cualquiera de las dos fechas. Si falta un valor, mostrará “Sin dato” y “No comparable” en Cambios. Si hay varios resultados del mismo indicador y unidad en una fecha, permitirá elegir el resultado y consultar su documento fuente, sin promediar ni seleccionar uno silenciosamente. Las mediciones textuales, unidades distintas y resultados con operadores que impidan una comparación exacta se mostrarán sin afirmar que subieron o bajaron.

Los indicadores numéricos con la misma unidad podrán verse en tabla y gráfico con fechas reales, respetando intervalos irregulares. No se convertirán unidades automáticamente ni se unirán indicadores por parecido de nombres sin una asociación explícita. Los valores con signos como “<” o “>” conservarán su operador y se mostrarán en la tabla sin convertirlos en puntos exactos del gráfico.

Para estudios se compararán las mediciones numéricas que el informe incluya y los hallazgos textuales confirmados. La interfaz permitirá abrir los informes originales en paralelo. No se generarán conclusiones diagnósticas, recomendaciones de tratamiento ni afirmaciones sobre mejoría o empeoramiento a partir de la extracción.

Si solo existe una medición, se mostrará el valor disponible sin inventar una tendencia. Los rangos pertenecerán a cada documento y no se sustituirán por rangos genéricos.

Además de comparar dos fechas, se podrá elegir un indicador para ver toda su historia, con gráfico de marcadores grandes y tabla equivalente debajo: Fecha, Valor, Unidad, Referencia y Estado. La tabla irá de reciente a antiguo. Bajo/Normal/Alto/Sin referencia dependerán solo del documento de cada fila y se mostrarán con texto; no se confundirán con Subió/Bajó. Las conclusiones textuales de estudios se ordenarán por fecha y fuente sin interpretar las diferencias.

### Calendario de quimioterapia

Vista mensual y lista de sesiones, con número de sesión, fecha, hora opcional, estado y notas opcionales. Estados: Programada, Realizada y Cancelada. Se podrá crear y corregir una sesión, reprogramarla o marcarla como realizada.

La última quimioterapia será la sesión más reciente marcada como Realizada. La próxima será la primera sesión Programada desde la fecha local actual. Una fecha pasada no convertirá automáticamente una sesión en Realizada. El número de sesión será explícito y no se recalculará al reprogramar.

Fechas médicas y de sesiones como fechas de calendario; referencia horaria de la aplicación: America/Argentina/Tucuman. No se enviarán recordatorios externos ni mensajes a terceros en esta versión.

## PWA e instalación

Manifest con nombre Clínica Oscar, iconos propios, colores y modo standalone. Service worker para los recursos de la interfaz. El botón Descargar app abrirá la instalación cuando el navegador la permita y ofrecerá instrucciones de Agregar a pantalla de inicio cuando sea necesario.

El acceso instalado deberá conservar el enlace autorizado en el dispositivo. Se verificará este comportamiento y no se afirmará compatibilidad de instalación en dispositivos no comprobados.

Los PDF y las respuestas médicas no se almacenarán automáticamente en la caché del service worker. Sin conexión, la aplicación mostrará claramente su estado y no confirmará cargas ni cambios que el servidor no haya guardado. El alcance inicial no incluye edición médica sin conexión.

## Modelo de datos

- Documento: identificador, título, nombre original, tipo MIME, tamaño, SHA-256, clave del objeto R2, categoría, fecha médica confirmada, fecha de carga y estado de revisión.
- Ampliación del PRD: institución, subcategoría, resumen, conclusiones, estado de procesamiento y confianza por campo; indicador con nombre original, normalizado y alias revisados.
- Edición del registro: fecha de modificación y versión para detectar cambios simultáneos; sin reemplazar el archivo original.
- Indicador: identificador, nombre confirmado, tipo numérico o textual y unidad de agrupación.
- Medición: documento, indicador, valor original, valor numérico cuando proceda, operador, unidad, rango original, fecha y estado de revisión.
- Referencia de medición: texto original y límites numéricos opcionales, con operadores inclusivos o exclusivos, confirmados en la revisión; sin referencia estructurada no se calculará Normal.
- Sesión: identificador, número, fecha, hora opcional, estado, notas y fecha de actualización.

El archivo original no se sobrescribirá por correcciones de metadatos. Las mediciones siempre conservarán el vínculo a su documento. La lista se paginará y se ordenará en el servidor para mantener su funcionamiento al crecer el repositorio.

## Integridad y manejo de errores

Validación de tipos, tamaños y campos tanto en cliente como en servidor. Las APIs no entregarán datos sin validar el enlace. Las respuestas médicas y descargas usarán controles de caché apropiados y las páginas no se anunciarán a buscadores.

Una carga solo se confirmará cuando exista tanto el archivo como el registro. Los fallos parciales se limpiarán o se identificarán para recuperación; no se mostrarán tarjetas con descargas inexistentes. Las cargas simultáneas del mismo archivo quedarán cubiertas por la unicidad del hash. Los errores se explicarán en español y preservarán los campos que el usuario estaba revisando.

## Verificación y definición de completado

La aplicación estará terminada cuando se hayan comprobado los siguientes resultados:

- Cargar un documento en un navegador y verlo desde otro con el mismo enlace.
- Ver y descargar el original, comprobando que el archivo descargado coincide con el cargado.
- Revisar y editar un registro ya guardado; comprobar actualización de fecha, indicadores y comparativas, y que el hash del original no cambia. Rechazar sobrescrituras de versiones desactualizadas.
- Detectar un duplicado aunque cambie el nombre del archivo, sin bloquear archivos distintos de la misma fecha.
- Ordenar documentos por su fecha médica y calcular correctamente las seis tarjetas del tablero.
- Extraer y revisar indicadores de un PDF con texto; comprobar la ruta de OCR y la alternativa manual para documentos ilegibles.
- Comparar valores revisados con unidades compatibles y abrir sus fuentes.
- Elegir dos fechas en Análisis y Estudios; comprobar las cinco columnas, etiquetas Subió/Bajó/Normal, referencias de la fecha más reciente, datos faltantes y selección explícita cuando haya más de un resultado del mismo indicador en una fecha.
- Crear, corregir, reprogramar y registrar sesiones, verificando la última y la próxima quimioterapia.
- Compartir el enlace y verificar que las rutas médicas rechazan accesos sin la clave.
- Comprobar accesibilidad y distribución en celular, tablet y computadora.
- Comprobar historial agrupado por fecha, lectura automática de PDF e imágenes, tablas y gráficos, ampliación de texto a 22 px y modo de alto contraste con relación objetivo 7:1.
- Comprobar Muy grande de 26 px, subcategorías, campos de confianza baja, alias revisados, historial por indicador, eliminación y reemplazo con cancelación, conflictos y fallos parciales, utilizando exclusivamente documentos de prueba admitidos en Sites.
- Verificar el manifest, service worker y flujo de instalación en los navegadores disponibles, indicando las pruebas de dispositivo pendientes si las hubiera.
- Confirmar publicación exitosa en Sites y existencia del repositorio público de GitHub con código y documentación, sin archivos médicos ni secretos.

Las pruebas usarán archivos sintéticos identificados como tales y se retirarán antes de la entrega. No se afirmará que la app contiene la historia clínica real de Oscar hasta que sus documentos hayan sido cargados y comprobados.

## Dependencias y limitaciones conocidas

Document Control no encontró sesiones conectadas durante la revisión inicial; no se utilizará como fuente de documentos. Esto no impide la carga mediante la aplicación.

La comprobación inicial de GitHub CLI falló al autenticar la cuenta. Antes de crear el repositorio público se deberá verificar de nuevo la conexión y, si sigue fallando, restablecer el acceso. No se instalarán credenciales nuevas ni se inventará una URL de repositorio.

La capacidad de persistencia está documentada en Sites; su disponibilidad concreta y funcionamiento deberán confirmarse durante la creación y las pruebas. La extracción automática no garantiza precisión: la revisión de fecha e indicadores forma parte del flujo diseñado.
