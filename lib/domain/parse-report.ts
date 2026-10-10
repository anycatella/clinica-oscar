import type { ExtractionDraft } from './types';
import { laboratoryMeasurements } from './laboratory-rows';
import { validateDate } from './calendar';
const aliases:Record<string,string>={'hdl':'hdl','colesterol hdl':'hdl','hdl colesterol':'hdl','glucosa':'glucosa','glucemia':'glucosa','colesterol total':'colesterol total','ldl':'ldl','colesterol ldl':'ldl','trigliceridos':'triglicéridos','hemoglobina':'hemoglobina','hematocrito':'hematocrito','creatinina':'creatinina','urea':'urea','tsh':'tsh'};
export function normalizeIndicator(name:string){const plain=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[-_]/g,' ').replace(/\s+/g,' ').trim();return aliases[plain]??null;}
export function parseReport(text:string):ExtractionDraft{
 const dateCandidates:string[]=[];
 for(const m of text.matchAll(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})\b/g)){const iso=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;if(validateDate(iso)&&!dateCandidates.includes(iso))dateCandidates.push(iso);}
 for(const m of text.matchAll(/\b\d{4}-\d{2}-\d{2}\b/g))if(validateDate(m[0])&&!dateCandidates.includes(m[0]))dateCandidates.push(m[0]);
 const lines=text.split(/\n/).map(line=>line.trim()).filter(Boolean);
 const dateFromLine=(line:string)=>{const m=/(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})/.exec(line);const iso=m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:/\b\d{4}-\d{2}-\d{2}\b/.exec(line)?.[0];return iso&&validateDate(iso)?iso:null;};
 const medicalDateSuggestion=lines.filter(line=>/fecha.*(?:estudio|extracci[oó]n|muestra|realizaci[oó]n|an[aá]lisis|toma)|(?:extracci[oó]n|toma de muestra|realizado|fecha de ingreso)\s*:/i.test(line)).map(dateFromLine).find(Boolean)??lines.filter(line=>/fecha/i.test(line)&&!/nacim|impresi[oó]n|emisi[oó]n/i.test(line)).map(dateFromLine).find(Boolean)??(dateCandidates.length===1&&!lines.some(line=>/nacim/i.test(line)&&dateFromLine(line)===dateCandidates[0])?dateCandidates[0]:null);
 const institution=lines.find(line=>/\b(?:laboratorio|hospital|sanatorio|instituto|centro m[eé]dico|cl[ií]nica)\b/i.test(line)&&line.length<=180&&!/\b(?:paciente|solicitud|fecha)\b/i.test(line))??null;
 const study=/tomograf|resonancia|ecograf|radiograf|endoscop|electrocard|doppler/i.test(text);
 const analysis=/laboratorio|hemograma|glucemia|glucosa|hemoglobina|hematocrito|creatinina|an[aá]lisis|mg\/d[lL]/i.test(text);
 const measurements=laboratoryMeasurements(text);
 const conclusion=/\b(?:conclusi[oó]n(?:es)?|impresi[oó]n diagn[oó]stica)\s*:\s*([\s\S]+)/i.exec(text)?.[1].trim()??null;
 const studyTitle=study?lines.find(line=>/tomograf|resonancia|ecograf|radiograf|endoscop|electrocard|doppler/i.test(line)&&line.length<=180&&!/paciente|solicitud|antecedente/i.test(line)):null;
 return {dateCandidates,medicalDateSuggestion,categorySuggestion:study?'study':analysis?'analysis':null,institution,subcategory:study?(/tomograf/i.test(text)?'Tomografías':/resonancia/i.test(text)?'Resonancias':/ecograf/i.test(text)?'Ecografías':null):null,title:studyTitle??(study?'Estudio médico':analysis?'Análisis de laboratorio':'Documento médico'),summary:study?conclusion?.slice(0,800)??null:measurements.length?`${measurements.length} indicadores detectados en el documento.`:null,conclusions:conclusion,measurements,extractionConfidence:{documentDate:medicalDateSuggestion?'medium':'low',category:study||analysis?'medium':'low',results:'low'}};
}
