import {demoDocuments,demoSessions} from '../domain/demo-data';
import {buildReportPdf} from '../domain/report-pdf';
import {localToday,summarize} from '../domain/calendar';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
export async function demoResponse(request:Request){
 if(request.method!=='GET')return json({error:'La demostración usa datos ficticios y es de solo lectura. El historial real no se modifica.'},405);
 const url=new URL(request.url),[area,id,action]=url.pathname.split('/').filter(Boolean).slice(2);const today=localToday(),sessions=demoSessions(today);const documents=demoDocuments.map(d=>({...d,size:buildReportPdf(d).byteLength}));
 if(area==='records')return json({documents,sessions,latestDocuments:documents,summary:summarize(documents,sessions,today)});
 if(area==='history')return json(documents);
 if(area==='sessions')return json(sessions);
 const category=url.searchParams.get('category');
 if(area==='document-filters'){const docs=documents.filter(d=>!category||d.category===category);return json({years:[...new Set(docs.map(d=>d.medicalDate.slice(0,4)))],subcategories:[...new Set(docs.map(d=>d.subcategory))]});}
 if(area==='documents'&&id){const doc=documents.find(d=>d.id===id);if(!doc)return json({error:'Documento de demostración no encontrado.'},404);if(action==='file')return new Response(buildReportPdf(doc) as unknown as BodyInit,{headers:{'Content-Type':'application/pdf','Content-Disposition':`${url.searchParams.get('download')?'attachment':'inline'}; filename="${doc.originalName}"`,'Cache-Control':'no-store'}});if(!action)return json(doc);}
 if(area==='documents'&&!id){const value=(key:string)=>url.searchParams.get(key)??'';const docs=documents.filter(d=>(!category||d.category===category)&&(!value('q')||[d.title,d.originalName,d.summary].join(' ').toLocaleLowerCase('es').includes(value('q').toLocaleLowerCase('es')))&&(!value('year')||d.medicalDate.startsWith(value('year')))&&(!value('subcategory')||d.subcategory===value('subcategory'))&&(!value('from')||d.medicalDate>=value('from'))&&(!value('until')||d.medicalDate<=value('until')));return json({items:docs,nextCursor:null});}
 return json({error:'Operación de demostración no disponible.'},404);
}
