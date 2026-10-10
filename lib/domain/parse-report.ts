import type { ExtractionDraft } from './types';
import { laboratoryMeasurements } from './laboratory-rows';
import { reportDates } from './report-dates';
const aliases:Record<string,string>={'hdl':'hdl','colesterol hdl':'hdl','hdl colesterol':'hdl','glucosa':'glucosa','glucemia':'glucosa','colesterol total':'colesterol total','ldl':'ldl','colesterol ldl':'ldl','trigliceridos':'triglicéridos','hemoglobina':'hemoglobina','hematocrito':'hematocrito','creatinina':'creatinina','urea':'urea','tsh':'tsh'};
export function normalizeIndicator(name:string){const plain=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[-_]/g,' ').replace(/\s+/g,' ').trim();return aliases[plain]??null;}
export function parseReport(text:string):ExtractionDraft{
 const {dateCandidates,medicalDateSuggestion}=reportDates(text);
 const lines=text.split(/\n/).map(line=>line.trim()).filter(Boolean);
 const institution=lines.find(line=>/\b(?:laboratorio|hospital|sanatorio|instituto|centro m[eé]dico|cl[ií]nica)\b/i.test(line)&&line.length<=180&&!/\b(?:paciente|solicitud|fecha)\b/i.test(line))??null;
 const study=/tomograf|resonancia|ecograf|radiograf|endoscop|electrocard|doppler/i.test(text);
 const analysis=/laboratorio|hemograma|glucemia|glucosa|hemoglobina|hematocrito|creatinina|an[aá]lisis|mg\/d[lL]/i.test(text);
 const measurements=laboratoryMeasurements(text);
 const conclusion=/\b(?:conclusi[oó]n(?:es)?|impresi[oó]n diagn[oó]stica)\s*:\s*([\s\S]+)/i.exec(text)?.[1].trim()??null;
 const studyTitle=study?lines.find(line=>/tomograf|resonancia|ecograf|radiograf|endoscop|electrocard|doppler/i.test(line)&&line.length<=180&&!/paciente|solicitud|antecedente/i.test(line)):null;
 return {dateCandidates,medicalDateSuggestion,categorySuggestion:study?'study':analysis?'analysis':null,institution,subcategory:study?(/tomograf/i.test(text)?'Tomografías':/resonancia/i.test(text)?'Resonancias':/ecograf/i.test(text)?'Ecografías':null):null,title:studyTitle??(study?'Estudio médico':analysis?'Análisis de laboratorio':'Documento médico'),summary:study?conclusion?.slice(0,800)??null:measurements.length?`${measurements.length} indicadores detectados en el documento.`:null,conclusions:conclusion,measurements,extractionConfidence:{documentDate:medicalDateSuggestion?'medium':'low',category:study||analysis?'medium':'low',results:'low'}};
}
