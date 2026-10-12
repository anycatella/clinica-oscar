import type {DocumentRecord,DocumentMetadata,SessionRecord} from '../domain/types';
import type {DataService,FileStorageService} from '../services/contracts';
import {demoDocuments,demoSessions} from '../domain/demo-data';
import {buildReportPdf} from '../domain/report-pdf';
import {localToday,summarize} from '../domain/calendar';
import {DocumentService} from '../server/documents';
import {validateSession} from '../server/validation';
import {sha256} from '../server/access';
import {AppError} from '../server/errors';
export type DemoState={revision:number;documents:Record<string,DocumentRecord>;files:Record<string,Uint8Array>;sessions:SessionRecord[];deleted:Record<string,{record:DocumentRecord;files:Record<string,Uint8Array>}>};
export async function seedDemo():Promise<DemoState>{const documents:DemoState['documents']={},files:DemoState['files']={};for(const d of structuredClone(demoDocuments)){const bytes=buildReportPdf(d);d.size=bytes.length;d.sha256=await sha256(bytes);documents[d.id]=d;files[d.fileKey]=bytes;}return {revision:0,documents,files,sessions:demoSessions(localToday()),deleted:{}};}
export class DemoData implements DataService{
 constructor(public state:DemoState){}
 async listDocuments(){return Object.values(this.state.documents).sort((a,b)=>b.medicalDate.localeCompare(a.medicalDate)||a.id.localeCompare(b.id));}
 async findDocument(id:string){return this.state.documents[id]??null;}
 async findByHash(hash:string){const record=Object.values(this.state.documents).find(d=>d.sha256===hash);return record?{record,state:'confirmed'}:null;}
 async claimDocument(record:DocumentRecord){if(await this.findByHash(record.sha256))return false;this.state.documents[record.id]=record;return true;}
 async activateDocument(){}
 async clearPendingFiles(id:string,version:number){const d=this.state.documents[id];if(d?.version===version)d.pendingFileKeys=[];}
 async updateDocument(record:DocumentRecord,version:number){if(this.state.documents[record.id]?.version!==version)return false;const duplicate=await this.findByHash(record.sha256);if(duplicate&&duplicate.record.id!==record.id)throw new AppError('Ese archivo ya está guardado.',409);this.state.documents[record.id]=record;return true;}
 async removeDocument(id:string,version?:number){if(version!==undefined&&this.state.documents[id]?.version!==version)return false;delete this.state.documents[id];return true;}
 async listSessions(){return this.state.sessions;}
 async saveSession(record:SessionRecord,create:boolean){const index=this.state.sessions.findIndex(s=>s.id===record.id);if(create&&index>=0)throw new AppError('La sesión ya existe.',409);if(!create&&index<0)throw new AppError('No encontramos la sesión.',404);if(this.state.sessions.some(s=>s.number===record.number&&s.id!==record.id))throw new AppError('Ese número de sesión ya existe.',409);if(index>=0)this.state.sessions[index]=record;else this.state.sessions.push(record);}
}
export class DemoFiles implements FileStorageService{constructor(private state:DemoState){}async put(key:string,bytes:Uint8Array){this.state.files[key]=bytes.slice();}async get(key:string){return this.state.files[key]?.slice()??null;}async remove(key:string){delete this.state.files[key];}}
function labelMetadata(m:DocumentMetadata){return {...m,title:('FICTICIO · '+m.title.replace(/^FICTICIO\s*[·:-]?\s*/i,'')).slice(0,180)};}
const json=(data:unknown,status=200)=>Response.json(data,{status});
export async function runDemoRequest(state:DemoState,request:Request):Promise<Response>{const url=new URL(request.url),[area,id,action]=url.pathname.split('/').filter(Boolean).slice(2),data=new DemoData(state),service=new DocumentService(data,new DemoFiles(state));const docs=await data.listDocuments();
 if(request.method==='GET'){
 if(area==='records')return json({documents:docs,sessions:state.sessions,latestDocuments:docs,summary:summarize(docs,state.sessions,localToday())});
 if(area==='history')return json(docs);
 if(area==='sessions')return json(state.sessions);
 if(area==='document-filters'){const rows=docs.filter(d=>!url.searchParams.get('category')||d.category===url.searchParams.get('category'));return json({years:[...new Set(rows.map(d=>d.medicalDate.slice(0,4)))].filter(Boolean).sort().reverse(),subcategories:[...new Set(rows.map(d=>d.subcategory))].filter(Boolean)});}
 if(area==='documents'&&id){const d=await service.getDocument(id);if(action==='file')return new Response(await service.getFile(id) as unknown as BodyInit,{headers:{'Content-Type':d.mime,'Content-Disposition':`${url.searchParams.get('download')?'attachment':'inline'}; filename*=UTF-8''${encodeURIComponent(d.originalName)}`}});return json(d);}
 if(area==='documents'){const v=(k:string)=>url.searchParams.get(k)??'';return json({items:docs.filter(d=>(!v('category')||d.category===v('category'))&&(!v('q')||[d.title,d.originalName,d.summary].join(' ').toLowerCase().includes(v('q').toLowerCase()))&&(!v('year')||d.medicalDate.startsWith(v('year')))&&(!v('subcategory')||d.subcategory===v('subcategory'))&&(!v('from')||d.medicalDate>=v('from'))&&(!v('until')||d.medicalDate<=v('until'))),nextCursor:null});}}
 if(request.method==='POST'&&area==='documents'){const form=await request.formData(),file=form.get('file');if(!(file instanceof File))throw new AppError('Elegí un archivo.');const metadata=labelMetadata(JSON.parse(String(form.get('metadata'))));if(id&&action==='replacement')return json(await service.replaceDocument(id,Number(form.get('expectedVersion')),file,metadata));const saved=await service.saveDocument(file,metadata);return json(saved,saved.duplicate?200:201);}
 if(request.method==='PATCH'&&area==='documents'&&id){const body=await request.json() as {expectedVersion:number;metadata:never;actions:unknown};return json(action==='units'?await service.normalizeUnits(id,body.expectedVersion,body.actions):await service.updateDocument(id,body.expectedVersion,labelMetadata(body.metadata)));}
 if(request.method==='DELETE'&&area==='documents'&&id){const body=await request.json() as {expectedVersion:number;confirmed:boolean};if(!body.confirmed)throw new AppError('Confirmá la eliminación.');const record=structuredClone(await service.getDocument(id));const files:DemoState['files']={};for(const key of [record.fileKey,...(record.pendingFileKeys??[])])if(state.files[key])files[key]=state.files[key].slice();await service.deleteDocument(id,body.expectedVersion);state.deleted[id]={record,files};return json({deleted:true});}
 if((request.method==='POST'||request.method==='PATCH')&&area==='sessions'){const body=validateSession(await request.json());const s={...body,id:id??crypto.randomUUID(),updatedAt:new Date().toISOString()};await data.saveSession(s,request.method==='POST');return json(s);}
 if(request.method==='POST'&&area==='restore'){let count=0;for(const [key,saved] of Object.entries(state.deleted)){if(state.documents[key])continue;state.documents[key]={...saved.record,version:saved.record.version+2,updatedAt:new Date().toISOString()};Object.assign(state.files,saved.files);delete state.deleted[key];count++;}return json({restored:count});}
 if(request.method==='POST'&&area==='reset'){const seeded=await seedDemo();Object.assign(state.documents,seeded.documents);Object.assign(state.files,seeded.files);for(const id of Object.keys(seeded.documents))delete state.deleted[id];state.sessions=[...state.sessions.filter(s=>!s.id.startsWith('demo-')), ...seeded.sessions];return json({reset:true});}
 return json({error:'Operación de prueba no encontrada.'},404);
}
function openDb(){return new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('clinica-oscar-hackathon-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('workspace');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function readState(db:IDBDatabase){return new Promise<DemoState|undefined>((resolve,reject)=>{const r=db.transaction('workspace').objectStore('workspace').get('active');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
async function writeState(db:IDBDatabase,state:DemoState,previous:number|undefined){return new Promise<void>((resolve,reject)=>{const tx=db.transaction('workspace','readwrite'),store=tx.objectStore('workspace'),r=store.get('active');r.onsuccess=()=>{if((r.result?.revision as number|undefined)!==previous){tx.abort();return;}state.revision=(previous??-1)+1;store.put(state,'active');};tx.oncomplete=()=>resolve();tx.onabort=()=>reject(new AppError('La prueba cambió en otra ventana. Volvé a intentar.',409));tx.onerror=()=>reject(tx.error);});}
let queue:Promise<unknown>=Promise.resolve();
export async function demoWorkspaceResponse(path:string,init?:RequestInit){const work=async()=>{let db:IDBDatabase|undefined;try{db=await openDb();let state=await readState(db);if(!state){state=await seedDemo();await writeState(db,state,undefined);}const previous=state.revision;const response=await runDemoRequest(state,new Request(new URL(path,window.location.origin),init));if((init?.method??'GET')!=='GET'&&response.ok)await writeState(db,state,previous);return response;}catch(e){return json({error:e instanceof Error?e.message:'No se pudo guardar la prueba en este navegador.'},e instanceof AppError?e.status:503);}finally{db?.close();}};const pending=queue.then(async()=>navigator.locks?await navigator.locks.request('clinica-oscar-demo-workspace',work):await work());queue=pending.catch(()=>{});return pending;}
