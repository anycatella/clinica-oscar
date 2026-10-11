import { services } from '../../../lib/server/runtime';
import { authorize } from '../../../lib/server/access';
import { AppError } from '../../../lib/server/errors';
import { validateSession } from '../../../lib/server/validation';
import { localToday, summarize } from '../../../lib/domain/calendar';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
async function handle(request:Request){
 try{
 const s=services();if(!await authorize(request,s.keyHash))return json({error:'Abrí el enlace compartido de Clínica Oscar para acceder.'},401);
 const url=new URL(request.url),parts=url.pathname.split('/').filter(Boolean).slice(1);const [area,id,action]=parts;
 if(request.method==='GET'){
  if(area==='records'){const [documents,sessions,stats,latestDocuments]=await Promise.all([s.data.listDocumentPage({limit:20}),s.data.listSessions(),s.data.documentStats(),s.data.latestDocuments()]);return json({documents,sessions,latestDocuments,summary:{...summarize([],sessions,localToday()),...stats,analysisCount:stats?.analysisCount??0,studyCount:stats?.studyCount??0}});}
  if(area==='history')return json(await s.documents.listDocuments());
  if(area==='document-filters')return json(await s.data.filterOptions(url.searchParams.get('category')));
  if(area==='dashboard')return json(summarize(await s.documents.listDocuments(),await s.data.listSessions(),localToday()));
  if(area==='sessions')return json(await s.data.listSessions());
  if(area==='measurements'){const docs=await s.documents.listDocuments();return json(docs.filter(d=>d.processingStatus==='confirmed'&&(!url.searchParams.get('category')||d.category===url.searchParams.get('category'))).flatMap(d=>d.measurements));}
  if(area==='documents'&&id&&action==='file'){
   const record=await s.documents.getDocument(id),bytes=await s.documents.getFile(id);
   const name=record.originalName.replace(/[\r\n"\\]/g,'_');return new Response(bytes as unknown as BodyInit,{headers:{'Content-Type':record.mime,'Content-Disposition':`${url.searchParams.get('download')==='1'?'attachment':'inline'}; filename="original${record.mime==='application/pdf'?'.pdf':record.mime==='image/png'?'.png':'.jpg'}"; filename*=UTF-8''${encodeURIComponent(name)}`,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
  }
  if(area==='documents'&&id)return json(await s.documents.getDocument(id));
  if(area==='documents'){
   const limit=Math.max(1,Math.min(100,Number(url.searchParams.get('limit'))||20));const list=await s.data.listDocumentPage({limit:limit+1,before:url.searchParams.get('before'),category:url.searchParams.get('category'),q:url.searchParams.get('q'),from:url.searchParams.get('from'),until:url.searchParams.get('until'),year:url.searchParams.get('year'),subcategory:url.searchParams.get('subcategory')});const items=list.slice(0,limit);await Promise.all(items.filter(d=>d.pendingFileKeys?.length).map(d=>s.documents.cleanup(d)));return json({items,nextCursor:list.length>limit?`${items.at(-1)!.medicalDate}:${items.at(-1)!.id}`:null});
  }
 }
 if(request.method==='POST'&&area==='documents'){
  if(Number(request.headers.get('Content-Length')??0)>27*1024*1024)throw new AppError('El archivo puede pesar hasta 25 MB.');
  const form=await request.formData(),file=form.get('file');if(!(file instanceof File))throw new AppError('Seleccioná un archivo.');if(form.get('personalUseConfirmed')!=='true')throw new AppError('Confirmá que tenés autorización para guardar y compartir estos documentos personales.');
  let metadata;try{metadata=JSON.parse(String(form.get('metadata')));}catch{throw new AppError('Revisá los datos del documento.');}
  if(id&&action==='replacement')return json(await s.documents.replaceDocument(id,Number(form.get('expectedVersion')),file,metadata));
  if(!id){const result=await s.documents.saveDocument(file,metadata);return json(result,result.duplicate?200:201);}
 }
 if(request.method==='PATCH'&&area==='documents'&&id&&action==='units'){const body=await request.json() as {expectedVersion:number;actions:unknown};return json(await s.documents.normalizeUnits(id,body.expectedVersion,body.actions));}
 if(request.method==='PATCH'&&area==='documents'&&id){const body=await request.json() as {expectedVersion:number;metadata:unknown};return json(await s.documents.updateDocument(id,body.expectedVersion,body.metadata as never));}
 if(request.method==='DELETE'&&area==='documents'&&id){const body=await request.json() as {expectedVersion:number;confirmed:boolean};if(body.confirmed!==true)throw new AppError('Confirmá la eliminación del documento.');await s.documents.deleteDocument(id,body.expectedVersion);return json({deleted:true});}
 if((request.method==='POST'||request.method==='PATCH')&&area==='sessions'){
  const body=validateSession(await request.json());if(request.method==='PATCH'&&!id)throw new AppError('Elegí una sesión.');const session={...body,id:id??crypto.randomUUID(),updatedAt:new Date().toISOString()};await s.data.saveSession(session,request.method==='POST');return json(session,request.method==='POST'?201:200);
 }
 return json({error:'No encontramos esta operación.'},404);
 }catch(error){if(error instanceof AppError)return json({error:error.message},error.status);return json({error:'No pudimos completar la operación. Tus cambios no se confirmaron. Intentá nuevamente.'},503);}
}
export const GET=handle;export const POST=handle;export const PATCH=handle;export const DELETE=handle;
