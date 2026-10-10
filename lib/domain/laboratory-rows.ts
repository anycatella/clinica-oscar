import type {MeasurementInput,ReferenceBounds} from './types';
const numeric='-?(?:\\d{1,3}(?:[.,]\\d{3})+(?:[.,]\\d+)?|\\d+(?:[.,]\\d+)?)';
export function reportNumber(raw:string):number{
 const clean=raw.replace(/\s/g,'');
 if(clean.includes(',')&&clean.includes('.'))return Number(clean.lastIndexOf(',')>clean.lastIndexOf('.')?clean.replace(/\./g,'').replace(',','.'):clean.replace(/,/g,''));
 if(/^-?\d{1,3}(?:\.\d{3})+$/.test(clean))return Number(clean.replace(/\./g,''));
 return Number(clean.replace(',','.'));
}
function bounds(ref:string|null):ReferenceBounds|null{
 if(!ref)return null;
 const range=new RegExp(`(${numeric})\\s*(?:-|–|—|a|hasta)\\s*(${numeric})`,'i').exec(ref);
 if(range)return {lower:reportNumber(range[1]),upper:reportNumber(range[2]),lowerInclusive:true,upperInclusive:true};
 const single=new RegExp(`(<=|>=|<|>|menor(?:\\s+(?:a|de))?|mayor(?:\\s+(?:a|de))?|hasta)\\s*(${numeric})`,'i').exec(ref);
 return single?(/^(?:<|menor|hasta)/i.test(single[1])?{lower:null,upper:reportNumber(single[2]),lowerInclusive:true,upperInclusive:/<=|hasta/i.test(single[1])}:{lower:reportNumber(single[2]),upper:null,lowerInclusive:/>=/i.test(single[1]),upperInclusive:true}):null;
}
const metadata=/documento|identificador|cobertura|carnet|sexo|fecha|p[aá]gina|impresi[oó]n|nacimiento|edad|protocolo|orden|dni|matr[ií]cula|paciente|m[eé]todo|resultado|referencia|laboratorio|tel[eé]fono|domicilio|solicitante/i;
const referencePopulation=/^(?:adultos?|niños?|neonatos?|hombres|mujeres|embarazadas|nivel(?:es)?|reci[eé]n nacidos|varones)\b/i;
const ignored=(name:string)=>metadata.test(name)||referencePopulation.test(name.trim());
const unitPattern=/^(?:[%/µμ]|(?:mg|g|gr|ng|pg|ug|mcg|mmol|mol|mEq|UI|U|mUI|uUI|fl|fL|mm|cm|seg|s|min|c[eé]l|cel|x\s?10|10\^))/i;
export function laboratoryMeasurements(text:string):MeasurementInput[]{
 const lines=text.split(/\n/).map(s=>s.replace(/[|]/g,'\t').trim()).filter(Boolean);
 const rows:string[]=[];
 for(let i=0;i<lines.length;i++){
  let row=lines[i];
  // Some text layers export each cell on a separate line.
  if(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][\wÁÉÍÓÚÜÑáéíóúüñ ()/.-]{1,70}$/.test(row)&&!ignored(row)&&new RegExp(`^[<>]?=?\\s*${numeric}\\s*$`).test(lines[i+1]??'')){
   row+='\t'+lines[++i];
   if(unitPattern.test(lines[i+1]??''))row+='\t'+lines[++i];
   if(new RegExp(`^(?:[<>]=?\\s*)?${numeric}(?:\\s*(?:-|–|—|a)\\s*${numeric})?$`).test(lines[i+1]??''))row+='\t'+lines[++i];
  }
  rows.push(row);
 }
 const measurements:MeasurementInput[]=[];
 for(const row of rows){
  const m=new RegExp(`^\\s*(CA\\s*\\d{1,3}(?:[.-]\\d{1,2})?|[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ\\s()\\-./]{0,70}?)\\s*[:\\t ]+([<>]=?)?\\s*(${numeric})(.*)$`).exec(row);
  if(m&&!ignored(m[1])){
   let tail=m[4].trim().replace(/^[*↑↓]+\s*/,'');let unit:string|null=null;
   if(unitPattern.test(tail)){
    const u=/^(?:x\s*10\^?\d+\s*\/\s*\w+|[^\s\t]+)(?:\s*\/\s*[a-zA-Zµμ0-9]+)?/.exec(tail);
    if(u){unit=u[0].replace(/\s/g,'');tail=tail.slice(u[0].length).trim();}
   }
   // Avoid treating a date or a report identifier as a result.
   if(!unit&&/^[/.]\d/.test(tail))continue;
   const referenceText=tail.replace(/^(?:valor(?:es)?\s+de\s+referencia|referencia)\s*:?\s*/i,'')||null;
   measurements.push({indicatorName:m[1].trim(),normalizedName:null,kind:'numeric',rawValue:(m[2]??'')+m[3],numericValue:reportNumber(m[3]),operator:(m[2]??'=') as MeasurementInput['operator'],unit,referenceText,referenceBounds:bounds(referenceText)});
   continue;
  }
  const q=/^([A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-z0-9ÁÉÍÓÚÜÑáéíóúüñ ()/.-]{0,70}?)\s*[:\t ]+((?:no\s+detectable|no\s+reactivo|negativo|positivo|reactivo|ausente|presente|normal|escasos|abundantes)\b.*)$/i.exec(row);
  if(q&&!ignored(q[1]))measurements.push({indicatorName:q[1].trim(),normalizedName:null,kind:'text',rawValue:q[2].trim(),numericValue:null,operator:null,unit:null,referenceText:null,referenceBounds:null});
 }
 return measurements;
}
