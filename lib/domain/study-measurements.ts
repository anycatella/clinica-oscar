import type {DocumentRecord,MeasurementInput} from './types';
const plain=(s:string)=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim();
// A study needs a clinical label: arbitrary names followed by numbers are not findings.
const administrative=/\b(?:paciente|afiliado|documento|dni|nombre|apellido|edad|nacimiento|domicilio|direccion|telefono|matricula|protocolo|orden|version|pagina|firma|solicitante|medico|numero de tomas|se reciben|informacion confidencial|secreto medico)\b|^(?:m\.?\s*[np]\.?|dr\.?|dra\.?)\b/;
const clinical=/^(?:lesion|nodulo|masa|tumor|quiste|ganglio|adenopatia|diametro|espesor|grosor|longitud|volumen|area|fraccion de eyeccion|fevi|gradiente|velocidad|presion|suv(?:max)?|grado histologico|ki[ -]?67|cdx2|satb2|her[ -]?2|braf|kras|nras|pdl[ -]?1|pd[ -]?l1|receptor|mutacion|proporcion de celulas neoplasicas|higado|pancreas|bazo|rinon|prostata|tiroides|aorta|ventriculo|auricula)\b/;
export function isStudyMeasurement(row:MeasurementInput){const name=plain(row.indicatorName);return !administrative.test(name)&&clinical.test(name)&&name.length<=120;}
export function comparisonMeasurements(documents:Pick<DocumentRecord,'category'|'measurements'>[]){return documents.flatMap(d=>d.category==='study'?d.measurements.filter(isStudyMeasurement):d.measurements);}
