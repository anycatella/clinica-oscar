import type { ExtractionDraft, MeasurementInput } from './types';
import { validateDate } from './calendar';
const aliases:Record<string,string>={'hdl':'hdl','colesterol hdl':'hdl','hdl colesterol':'hdl','glucosa':'glucosa','glucemia':'glucosa','colesterol total':'colesterol total','ldl':'ldl','colesterol ldl':'ldl','trigliceridos':'triglicéridos','hemoglobina':'hemoglobina','hematocrito':'hematocrito','creatinina':'creatinina','urea':'urea','tsh':'tsh'};
export function normalizeIndicator(name:string){const plain=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[-_]/g,' ').replace(/\s+/g,' ').trim();return aliases[plain]??null;}
const number=(s:string)=>Number(s.replace(',','.'));
export function parseReport(text:string):ExtractionDraft{
 const dateCandidates:string[]=[];
 for(const m of text.matchAll(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})\b/g)){const iso=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;if(validateDate(iso)&&!dateCandidates.includes(iso))dateCandidates.push(iso);}
 for(const m of text.matchAll(/\b\d{4}-\d{2}-\d{2}\b/g))if(validateDate(m[0])&&!dateCandidates.includes(m[0]))dateCandidates.push(m[0]);
 const lines=text.split(/\n/).map(line=>line.trim()).filter(Boolean);
 const dateFromLine=(line:string)=>{const m=/(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})/.exec(line);const iso=m?`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`:/\b\d{4}-\d{2}-\d{2}\b/.exec(line)?.[0];return iso&&validateDate(iso)?iso:null;};
 const medicalDateSuggestion=lines.filter(line=>/fecha.*(?:estudio|extracci[oó]n|muestra|realizaci[oó]n|an[aá]lisis|toma)|(?:extracci[oó]n|toma de muestra|realizado|fecha de ingreso)\s*:/i.test(line)).map(dateFromLine).find(Boolean)??lines.filter(line=>/fecha/i.test(line)&&!/nacim|impresi[oó]n|emisi[oó]n/i.test(line)).map(dateFromLine).find(Boolean)??(dateCandidates.length===1&&!lines.some(line=>/nacim/i.test(line)&&dateFromLine(line)===dateCandidates[0])?dateCandidates[0]:null);
 const institution=lines.find(line=>/\b(?:laboratorio|hospital|sanatorio|instituto|centro m[eé]dico|cl[ií]nica)\b/i.test(line)&&line.length<=180&&!/\b(?:paciente|solicitud|fecha)\b/i.test(line))??null;
 const study=/tomograf|resonancia|ecograf|radiograf|endoscop|electrocard|doppler/i.test(text);
 const analysis=/laboratorio|glucosa|hemoglobina|hematocrito|creatinina|an[aá]lisis|mg\/d[lL]/i.test(text);
 const measurements:MeasurementInput[]=[];
 for(const line of text.split(/\n/)){
  const m=/^\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s()\-./]{1,70}?)\s*[:\t ]+([<>]=?)?\s*(-?\d+(?:[.,]\d+)?)\s+([a-zA-Zµμ%][a-zA-Z0-9µμ%/^.*−-]*)(?:\s+(.+))?\s*$/.exec(line);
  if(!m||/fecha|p[aá]gina|impresi[oó]n|nacimiento|edad|protocolo|orden|dni|matr[ií]cula|paciente/i.test(m[1]))continue;
  const ref=m[5]?.trim()??null;const range=ref?/(-?\d+(?:[.,]\d+)?)\s*(?:-|–|—|a)\s*(-?\d+(?:[.,]\d+)?)/.exec(ref):null;
  const single=ref?/(<=|>=|<|>|menor(?:\s+(?:a|de))?|mayor(?:\s+(?:a|de))?|hasta)\s*(-?\d+(?:[.,]\d+)?)/i.exec(ref):null;
  const singleBounds=single?(/^(?:<|menor|hasta)/i.test(single[1])?{lower:null,upper:number(single[2]),lowerInclusive:true,upperInclusive:/<=|hasta/i.test(single[1])}:{lower:number(single[2]),upper:null,lowerInclusive:/>=/i.test(single[1]),upperInclusive:true}):null;
  measurements.push({indicatorName:m[1].trim(),normalizedName:null,kind:'numeric',rawValue:`${m[2]??''}${m[3]}`,numericValue:number(m[3]),operator:(m[2]??'=') as MeasurementInput['operator'],unit:m[4],referenceText:ref,referenceBounds:range?{lower:number(range[1]),upper:number(range[2]),lowerInclusive:true,upperInclusive:true}:singleBounds});
 }
 const conclusion=/\b(?:conclusi[oó]n(?:es)?|impresi[oó]n diagn[oó]stica)\s*:\s*([\s\S]+)/i.exec(text)?.[1].trim()??null;
 const studyTitle=study?lines.find(line=>/tomograf|resonancia|ecograf|radiograf|endoscop|electrocard|doppler/i.test(line)&&line.length<=180&&!/paciente|solicitud|antecedente/i.test(line)):null;
 return {dateCandidates,medicalDateSuggestion,categorySuggestion:study?'study':analysis?'analysis':null,institution,subcategory:study?(/tomograf/i.test(text)?'Tomografías':/resonancia/i.test(text)?'Resonancias':/ecograf/i.test(text)?'Ecografías':null):null,title:studyTitle??(study?'Estudio médico':analysis?'Análisis de laboratorio':'Documento médico'),summary:study?conclusion?.slice(0,800)??null:measurements.length?`${measurements.length} indicadores detectados en el documento.`:null,conclusions:conclusion,measurements,extractionConfidence:{documentDate:medicalDateSuggestion?'medium':'low',category:study||analysis?'medium':'low',results:'low'}};
}
