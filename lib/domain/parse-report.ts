import type { ExtractionDraft, MeasurementInput } from './types';
import { validateDate } from './calendar';
const aliases:Record<string,string>={'hdl':'hdl','colesterol hdl':'hdl','hdl colesterol':'hdl','glucosa':'glucosa','glucemia':'glucosa','colesterol total':'colesterol total','ldl':'ldl','colesterol ldl':'ldl','trigliceridos':'triglicéridos','hemoglobina':'hemoglobina','hematocrito':'hematocrito','creatinina':'creatinina','urea':'urea','tsh':'tsh'};
export function normalizeIndicator(name:string){const plain=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[-_]/g,' ').replace(/\s+/g,' ').trim();return aliases[plain]??null;}
const number=(s:string)=>Number(s.replace(',','.'));
export function parseReport(text:string):ExtractionDraft{
 const dateCandidates:string[]=[];
 for(const m of text.matchAll(/\b(\d{1,2})[/.\-](\d{1,2})[/.\-](\d{4})\b/g)){const iso=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;if(validateDate(iso)&&!dateCandidates.includes(iso))dateCandidates.push(iso);}
 for(const m of text.matchAll(/\b\d{4}-\d{2}-\d{2}\b/g))if(validateDate(m[0])&&!dateCandidates.includes(m[0]))dateCandidates.push(m[0]);
 const study=/tomograf|resonancia|ecograf|radiograf|endoscop|electrocard|doppler/i.test(text);
 const analysis=/laboratorio|glucosa|hemoglobina|hematocrito|creatinina|an[aá]lisis|mg\/d[lL]/i.test(text);
 const measurements:MeasurementInput[]=[];
 for(const line of text.split(/\n/)){
  const m=/^\s*([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s()\-./]{1,70}?)\s*[:\t ]+([<>]=?)?\s*(-?\d+(?:[.,]\d+)?)\s+([a-zA-Zµμ%][a-zA-Z0-9µμ%/^.*−-]*)(?:\s+(.+))?\s*$/.exec(line);
  if(!m||/fecha|p[aá]gina|impresi[oó]n/i.test(m[1]))continue;
  const ref=m[5]?.trim()??null;const range=ref?/(-?\d+(?:[.,]\d+)?)\s*(?:-|–|—|a)\s*(-?\d+(?:[.,]\d+)?)/.exec(ref):null;
  measurements.push({indicatorName:m[1].trim(),normalizedName:null,kind:'numeric',rawValue:`${m[2]??''}${m[3]}`,numericValue:number(m[3]),operator:(m[2]??'=') as MeasurementInput['operator'],unit:m[4],referenceText:ref,referenceBounds:range?{lower:number(range[1]),upper:number(range[2]),lowerInclusive:true,upperInclusive:true}:null});
 }
 const conclusion=/\b(?:conclusiones?|impresi[oó]n diagn[oó]stica)\s*:\s*([\s\S]+)/i.exec(text)?.[1].trim()??null;
 return {dateCandidates,categorySuggestion:study?'study':analysis?'analysis':null,institution:null,subcategory:study?(/tomograf/i.test(text)?'Tomografías':/resonancia/i.test(text)?'Resonancias':/ecograf/i.test(text)?'Ecografías':null):null,title:study?'Estudio médico':analysis?'Análisis de laboratorio':'Documento médico',summary:null,conclusions:conclusion,measurements,extractionConfidence:{documentDate:dateCandidates.length===1?'medium':'low',category:study||analysis?'medium':'low',results:'low'}};
}
