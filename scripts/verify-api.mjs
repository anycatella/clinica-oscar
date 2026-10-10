import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const config=JSON.parse(await new Promise(resolve=>{let s='';process.stdin.on('data',b=>s+=b);process.stdin.on('end',()=>resolve(s));}));
const auth={'Authorization':'Bearer '+config.key};const request=(path,init={})=>fetch(config.base+path,{...init,headers:{...auth,...init.headers}});
const assert=(ok,label)=>{if(!ok)throw new Error(label);console.log('PASS '+label);};
assert((await fetch(config.base+'/api/records')).status===401,'sin enlace no hay acceso');
const bytes=await readFile(new URL('../tests/fixtures/analysis-old.pdf',import.meta.url));
const metadata={title:'Verificación sintética',category:'analysis',medicalDate:'2026-05-01',institution:null,subcategory:null,summary:null,conclusions:null,extractionConfidence:{},measurements:[]};
const upload=async(confirmed=true)=>{const f=new FormData();f.set('file',new File([bytes],'verificacion-sintetica.pdf',{type:'application/pdf'}));f.set('metadata',JSON.stringify(metadata));if(confirmed)f.set('personalUseConfirmed','true');return request('/api/documents',{method:'POST',body:f});};
assert((await upload(false)).status===400,'sin autorización declarada no se guarda');
let doc,created=false;
try{
 const first=await upload();assert(first.ok,'carga original');const a=await first.json();doc=a.document;created=!a.duplicate;
 const second=await upload();const b=await second.json();assert(second.ok&&b.duplicate&&b.document.id===doc.id,'duplicados por contenido');
 const records=await (await request('/api/records')).json();assert(records.documents.some(d=>d.id===doc.id),'persistencia compartida');
 const original=await request('/api/documents/'+doc.id+'/file?download=1');const downloaded=Buffer.from(await original.arrayBuffer());assert(original.ok&&createHash('sha256').update(downloaded).digest('hex')===createHash('sha256').update(bytes).digest('hex'),'descarga conserva bytes');
 const page=await (await request('/api/documents?limit=1')).json();assert(page.items.length===1,'paginación');
 if(created){const updated=await request('/api/documents/'+doc.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({expectedVersion:doc.version,metadata:{...metadata,title:'Verificación editada'}})});assert(updated.ok,'edición');const current=await updated.json();const stale=await request('/api/documents/'+doc.id,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({expectedVersion:doc.version,metadata})});assert(stale.status===409,'conflicto conserva versión');doc=current;}
 console.log('Verificación API completa');
}finally{if(created&&doc){const deleted=await request('/api/documents/'+doc.id,{method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({expectedVersion:doc.version,confirmed:true})});assert(deleted.ok,'limpieza del documento de verificación');}}
