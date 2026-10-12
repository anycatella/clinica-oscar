import type {DocumentRecord,MeasurementInput,SessionRecord} from './types';
import {prepareMeasurementUnit} from './unit-normalization';
const notice='FICTICIO — SOLO DEMOSTRACIÓN PARA EL HACKATÓN. No corresponde a una persona real. Valores creados para mostrar la aplicación; no son resultados médicos ni recomendaciones.';
const dates=['2026-08-24','2026-09-21','2026-10-05'];
const labRows=[
 ['Glóbulos Rojos','/mm³',4500000,6000000,[4800000,4950000,5100000]],
 ['Hemoglobina','g/dL',13,17,[11.8,12.6,13.5]],
 ['Hematocrito','%',40,51,[36,39,42]],
 ['VCM','fL',80,99,[78,81,84]],
 ['Glóbulos Blancos','/mm³',4500,11000,[12500,10400,8700]],
 ['Plaquetas','/µL',150000,450000,[145000,172000,210000]],
 ['Urea','mg/dL',15,45,[38,35,32]],
 ['Creatinina','mg/dL',0.7,1.3,[1.4,1.2,1.0]],
 ['GOT','U/L',0,40,[65,49,35]],
 ['GPT','U/L',0,40,[72,54,38]],
] as const;
function numeric(name:string,value:number,unit:string,lower:number|null=null,upper:number|null=null):MeasurementInput{return prepareMeasurementUnit({indicatorName:name,normalizedName:null,kind:'numeric',rawValue:String(value).replace('.',','),numericValue:value,operator:'=',unit,referenceText:lower===null&&upper===null?'Sin rango de referencia: medición de ejemplo.':`${lower}–${upper} ${unit} · Referencia ficticia de demostración`,referenceBounds:lower===null&&upper===null?null:{lower,upper,lowerInclusive:true,upperInclusive:true}});}
function record(category:'analysis'|'study',index:number):DocumentRecord{
 const id=`demo-${category}-${index+1}`,medicalDate=dates[index];const measurements=category==='analysis'?labRows.map(([name,unit,lower,upper,values])=>numeric(name,values[index],unit,lower,upper)):[numeric('Lesión hepática de ejemplo · diámetro mayor',[32,29,26][index],'mm'),numeric('Lesión hepática de ejemplo · diámetro menor',[24,22,20][index],'mm'),numeric('Ganglio cervical de ejemplo · eje corto',[11,10,9][index],'mm')];
 return {id,title:`FICTICIO · ${category==='analysis'?'Análisis de laboratorio':'Estudio por imágenes'} de demostración`,category,medicalDate,institution:'Institución ficticia · Hackatón',subcategory:category==='analysis'?'Laboratorio de ejemplo':'Imágenes de ejemplo',summary:notice,conclusions:category==='study'?`${notice}\nHallazgos ficticios: se registran medidas de una lesión hepática de ejemplo y de un ganglio cervical de ejemplo. El cambio entre fechas se muestra únicamente para probar las comparativas.`:notice,extractionConfidence:{},measurements:measurements.map((m,i)=>({...m,id:`${id}-result-${i+1}`,documentId:id,medicalDate,reviewed:true})),originalName:`FICTICIO-${category}-${medicalDate}.pdf`,mime:'application/pdf',size:0,sha256:'0'.repeat(64),fileKey:`demo/${id}.pdf`,uploadedAt:medicalDate+'T12:00:00Z',updatedAt:medicalDate+'T12:00:00Z',version:1,reviewStatus:'confirmed',processingStatus:'confirmed'};
}
export const demoDocuments=dates.flatMap((_,i)=>[record('analysis',i),record('study',i)]).sort((a,b)=>b.medicalDate.localeCompare(a.medicalDate));
export function demoSessions(today:string):SessionRecord[]{return [-14,0,14].map((offset,i)=>{const d=new Date(today+'T12:00:00Z');d.setUTCDate(d.getUTCDate()+offset);return {id:`demo-session-${i+1}`,number:i+1,date:d.toISOString().slice(0,10),time:'09:00',durationDays:3,location:'Centro ficticio de demostración',status:'scheduled',notes:'FICTICIO — SOLO DEMOSTRACIÓN. Esta sesión no corresponde a un tratamiento real.',updatedAt:today+'T12:00:00Z'};});}
