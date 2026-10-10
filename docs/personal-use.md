# Uso personal de Clínica Oscar

El 9 de octubre de 2026, el usuario confirmó que la aplicación guardará la carpeta personal de Oscar en su cuenta para compartirla con sus médicos. Esta decisión actualiza la modalidad inicial de pruebas de docs/design.md y docs/prd-integration.md.

La restricción anterior contra cualquier documento médico identificable fue más amplia que la cláusula 3.3 de Sites: esta distingue PHI definido por HIPAA de otros datos sensibles, admitidos sujeto a obligaciones de privacidad. HHS explica que las aplicaciones personales elegidas por individuos generalmente no son sistemas de entidades cubiertas ni sus asociados. La configuración de uso personal se basa en la finalidad declarada por el usuario; no supone certificación HIPAA ni una evaluación legal general. No se admite uso institucional sujeto a HIPAA.

Fuentes verificadas:
- https://openai.com/policies/chatgpt-sites-terms/
- https://www.hhs.gov/hipaa/for-professionals/privacy/guidance/cell-phone-hipaa/index.html

La carga requiere declaración de autorización para guardar y compartir documentos personales. Archivos y metadatos se guardan en almacenamiento del sitio, no en GitHub. El enlace es una credencial: cualquier portador puede consultar, descargar, editar y eliminar; no hay permisos individuales ni revocación por médico. La interfaz informa esta capacidad antes de cargar y al compartir. No se indexa la aplicación. La lectura OCR se ejecuta en el dispositivo y los resultados se revisan antes de guardar. Originales descargables, duplicados por contenido y control de versiones se conservan. Las verificaciones se ejecutan con archivos sintéticos y se retiran después, sin importar documentos personales previos.
